/**
 * demo-store.ts — Phase 3 Extended
 * Single source of truth for the localStorage-backed demo ERP flow.
 * All pages read/write through these helpers — no direct localStorage calls elsewhere.
 */

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
  ORDER: "demoWarehouseOrder",
  TRACKING_STATUS: "demoOrderTrackingStatus",
  STOCK_OVERRIDES: "demoStockOverrides",        // Record<productId, currentStock>
  WAREHOUSE_NOTIFS: "demoWarehouseNotifs",
  BRANCH_NOTIFS: "demoBranchNotifs",
  ADMIN_NOTIFS: "demoAdminNotifs",
  INVOICE_COUNTER: "demoInvoiceCounter",
  STOCK_LOGS: "demoStockLogs",                  // DemoStockLog[]
  LOW_STOCK_ALERTS: "demoLowStockAlerts",        // DemoLowStockAlert[]
  PENDING_PRODUCTS: "demoPendingProducts",       // DemoPendingProduct[]
  ORDER_ANALYTICS: "demoOrderAnalytics",         // DemoOrderAnalytics
  PRODUCT_AUDIT: "demoProductAudit",             // DemoProductAuditEntry[]
  PRODUCT_APPROVAL_MAP: "demoProductApprovalMap", // Record<productId, "Approved"|"Rejected">
} as const;

export const LOW_STOCK_THRESHOLD = 50;

// ── Types ─────────────────────────────────────────────────────────────────────

export type DemoOrderItem = {
  name: string;
  requested: number;
  available: number;
  approved?: number; // set by warehouse on approval
};

export type DemoOrder = {
  id: string;
  branch: string;
  date: string;
  itemsCount: number;
  amount: number;        // original requested amount (from checkout)
  approvedAmount: number; // amount based on approved quantities (set on approval)
  isPartial: boolean;    // true when any item was partially approved
  status: "Pending" | "Approved" | "Rejected";
  paymentStatus: "Pending" | "Paid";
  invoiceNumber: string | null;
  invoiceGenerated: boolean;
  items: DemoOrderItem[];
  paymentMethod: string;
  orderDate: string;
  expectedDelivery: string;
};

export type DemoTrackingStatus =
  | "Pending Approval"
  | "Approved"
  | "Payment Completed"
  | "Packed"
  | "Dispatched"
  | "In Transit"
  | "Delivered"
  | "Rejected";

export type DemoNotif = {
  id: string;
  type: "order_pending" | "order_approved" | "order_rejected" | "delivery" | "stock_updated" | "invoice_generated" | "payment_received" | "low_stock" | "product_pending" | "product_approved" | "product_rejected";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export type DemoStockLog = {
  logId: string;
  product: string;
  action: "OUT" | "IN" | "ADJUSTMENT";
  quantity: number;
  date: string;
  reason: string;
};

export type DemoLowStockAlert = {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  timestamp: string;
  resolved: boolean;
};

export type DemoPendingProduct = {
  id: string;
  productName: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  supplier: string;
  costPrice: number;
  batchNumber: string;
  expiryDate: string;
  image: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  rejectionReason?: string;
};

export type DemoProductAuditEntry = {
  id: string;
  productName: string;
  action: "Approved" | "Rejected";
  performedBy: string;
  timestamp: string;
};

export type DemoOrderAnalytics = {
  topProduct: string;
  topProductCount: number;
  mostActiveBranch: string;
  totalOrdersToday: number;
  totalRevenue: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota */ }
}

function nowStr() {
  const d = new Date();
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

function todayStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Stock Overrides (per product ID) ─────────────────────────────────────────

/** Returns map of productId → currentStock override */
export function getStockOverrides(): Record<string, number> {
  return read<Record<string, number>>(KEYS.STOCK_OVERRIDES, {});
}

/** Get the live stock for a product (override if set, else base value) */
export function getLiveStock(productId: string, baseStock: number): number {
  const overrides = getStockOverrides();
  return overrides[productId] !== undefined ? overrides[productId] : baseStock;
}

/** Set stock for a specific product */
export function setProductStock(productId: string, newStock: number) {
  const overrides = getStockOverrides();
  overrides[productId] = Math.max(0, newStock);
  write(KEYS.STOCK_OVERRIDES, overrides);
}

/** Deduct stock for approved order items (by productId) */
export function deductStockForApproval(items: Array<{ productId: string; name: string; quantity: number; baseStock: number }>) {
  const overrides = getStockOverrides();
  items.forEach((item) => {
    const current = overrides[item.productId] !== undefined ? overrides[item.productId] : item.baseStock;
    const newStock = Math.max(0, current - item.quantity);
    overrides[item.productId] = newStock;
    // Create stock log
    addDemoStockLog({
      product: item.name,
      action: "OUT",
      quantity: item.quantity,
      reason: `Branch Order approved`,
    });
    // Check low stock
    if (newStock < LOW_STOCK_THRESHOLD) {
      createLowStockAlert(item.productId, item.name, newStock);
    }
  });
  write(KEYS.STOCK_OVERRIDES, overrides);
}

/** Legacy: deduct by product name (used by old checkout flow) */
export function applyStockDeductions(items: DemoOrderItem[]) {
  items.forEach((item) => {
    addDemoStockLog({
      product: item.name,
      action: "OUT",
      quantity: item.requested,
      reason: "Branch Order approved",
    });
  });
}

/**
 * Called when Warehouse marks an order as Dispatched (Packed → Dispatched).
 * Deducts dispatched quantities from stock and generates low stock alerts.
 */
export function deductStockOnDispatch(
  orderId: string,
  items: Array<{ productId: string; name: string; quantity: number; baseStock: number }>
) {
  const overrides = getStockOverrides();
  items.forEach((item) => {
    const current = overrides[item.productId] !== undefined ? overrides[item.productId] : item.baseStock;
    const newStock = Math.max(0, current - item.quantity);
    overrides[item.productId] = newStock;
    addDemoStockLog({
      product: item.name,
      action: "OUT",
      quantity: item.quantity,
      reason: `Dispatched — Order ${orderId}`,
    });
    if (newStock < LOW_STOCK_THRESHOLD) {
      createLowStockAlert(item.productId, item.name, newStock);
    }
  });
  write(KEYS.STOCK_OVERRIDES, overrides);
}

// ── Stock Logs ────────────────────────────────────────────────────────────────

export function getDemoStockLogs(): DemoStockLog[] {
  return read<DemoStockLog[]>(KEYS.STOCK_LOGS, []);
}

export function addDemoStockLog(entry: Omit<DemoStockLog, "logId" | "date">) {
  const logs = getDemoStockLogs();
  const logId = `DLOG-${String(logs.length + 1).padStart(4, "0")}`;
  logs.unshift({ logId, date: todayStr(), ...entry });
  write(KEYS.STOCK_LOGS, logs);
}

// ── Low Stock Alerts ──────────────────────────────────────────────────────────

export function getLowStockAlerts(): DemoLowStockAlert[] {
  return read<DemoLowStockAlert[]>(KEYS.LOW_STOCK_ALERTS, []);
}

export function createLowStockAlert(productId: string, productName: string, currentStock: number) {
  const alerts = getLowStockAlerts();
  // Avoid duplicate unresolved alerts for same product
  if (alerts.some((a) => a.productId === productId && !a.resolved)) return;
  alerts.unshift({
    id: `LSA-${Date.now()}`,
    productId,
    productName,
    currentStock,
    timestamp: nowStr(),
    resolved: false,
  });
  write(KEYS.LOW_STOCK_ALERTS, alerts);
  // Push warehouse notification
  pushWarehouseNotif({
    type: "low_stock",
    title: "⚠ Low Stock Alert",
    message: `${productName} is running low. Current stock: ${currentStock}`,
  });
}

export function resolveLowStockAlert(productId: string) {
  const alerts = getLowStockAlerts();
  const updated = alerts.map((a) => a.productId === productId ? { ...a, resolved: true } : a);
  write(KEYS.LOW_STOCK_ALERTS, updated);
}

// ── Product Approval Map (persists Admin decisions across refresh) ─────────────

/** Get map of productId → approval status set by admin */
export function getProductApprovalMap(): Record<string, "Approved" | "Rejected"> {
  return read<Record<string, "Approved" | "Rejected">>(KEYS.PRODUCT_APPROVAL_MAP, {});
}

/** Persist admin's approval decision for a warehouse product */
export function setProductApprovalStatus(productId: string, status: "Approved" | "Rejected") {
  const map = getProductApprovalMap();
  map[productId] = status;
  write(KEYS.PRODUCT_APPROVAL_MAP, map);
}

// ── Pending Products (New Product Approval Flow) ──────────────────────────────

export function getPendingProducts(): DemoPendingProduct[] {
  return read<DemoPendingProduct[]>(KEYS.PENDING_PRODUCTS, []);
}

export function savePendingProduct(product: Omit<DemoPendingProduct, "id" | "status" | "createdAt">) {
  const products = getPendingProducts();
  const id = `PPRD-${Date.now()}`;
  const newProduct: DemoPendingProduct = {
    ...product,
    id,
    status: "Pending",
    createdAt: nowStr(),
  };
  products.unshift(newProduct);
  write(KEYS.PENDING_PRODUCTS, products);
  // Notify admin
  pushAdminNotif({
    type: "product_pending",
    title: "New Product Pending Approval",
    message: `Warehouse added "${product.productName}" (${product.category}). Price: ₹${product.price}. Awaiting admin approval.`,
  });
  return id;
}

export function approveProduct(productId: string) {
  const products = getPendingProducts();
  const updated = products.map((p) =>
    p.id === productId ? { ...p, status: "Approved" as const } : p
  );
  write(KEYS.PENDING_PRODUCTS, updated);
  const product = products.find((p) => p.id === productId);
  if (product) {
    // Persist approval decision so warehouse context picks it up after refresh
    setProductApprovalStatus(productId, "Approved");
    pushWarehouseNotif({
      type: "product_approved",
      title: "Product Approved",
      message: `"${product.productName}" has been approved by admin and is now visible in Branch Catalog.`,
    });
    addProductAuditEntry({ productName: product.productName, action: "Approved", performedBy: "Admin" });
  }
}

export function rejectProduct(productId: string, reason: string) {
  const products = getPendingProducts();
  const updated = products.map((p) =>
    p.id === productId ? { ...p, status: "Rejected" as const, rejectionReason: reason } : p
  );
  write(KEYS.PENDING_PRODUCTS, updated);
  const product = products.find((p) => p.id === productId);
  if (product) {
    // Persist rejection so warehouse context picks it up after refresh
    setProductApprovalStatus(productId, "Rejected");
    pushWarehouseNotif({
      type: "product_rejected",
      title: "Product Rejected",
      message: `"${product.productName}" was rejected by admin. Reason: ${reason}`,
    });
    addProductAuditEntry({ productName: product.productName, action: "Rejected", performedBy: "Admin" });
  }
}

/** Get only approved pending products (visible to branch catalog) */
export function getApprovedPendingProducts(): DemoPendingProduct[] {
  return getPendingProducts().filter((p) => p.status === "Approved");
}

// ── Product Audit Trail ────────────────────────────────────────────────────────

export function getProductAuditTrail(): DemoProductAuditEntry[] {
  return read<DemoProductAuditEntry[]>(KEYS.PRODUCT_AUDIT, []);
}

export function addProductAuditEntry(entry: Omit<DemoProductAuditEntry, "id" | "timestamp">) {
  const all = getProductAuditTrail();
  all.unshift({ ...entry, id: `PA-${Date.now()}`, timestamp: nowStr() });
  write(KEYS.PRODUCT_AUDIT, all);
}

// ── Order Analytics ───────────────────────────────────────────────────────────

export function getOrderAnalytics(): DemoOrderAnalytics {
  return read<DemoOrderAnalytics>(KEYS.ORDER_ANALYTICS, {
    topProduct: "Milk Bread",
    topProductCount: 8,
    mostActiveBranch: "Gandhi Nagar",
    totalOrdersToday: 3,
    totalRevenue: 0,
  });
}

function updateOrderAnalytics(order: DemoOrder) {
  const analytics = getOrderAnalytics();
  // Count products
  const productCounts: Record<string, number> = {};
  order.items.forEach((item) => {
    productCounts[item.name] = (productCounts[item.name] ?? 0) + item.requested;
  });
  const topEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
  write(KEYS.ORDER_ANALYTICS, {
    topProduct: topEntry?.[0] ?? analytics.topProduct,
    topProductCount: topEntry?.[1] ?? analytics.topProductCount,
    mostActiveBranch: order.branch,
    totalOrdersToday: analytics.totalOrdersToday + 1,
    totalRevenue: analytics.totalRevenue + order.amount,
  });
}

// ── Invoice counter ───────────────────────────────────────────────────────────

export function nextDemoInvoiceNumber(): string {
  const n = read<number>(KEYS.INVOICE_COUNTER, 2001);
  write(KEYS.INVOICE_COUNTER, n + 1);
  return `INV-2026-${n}`;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export function getWarehouseNotifs(): DemoNotif[] {
  return read<DemoNotif[]>(KEYS.WAREHOUSE_NOTIFS, []);
}

export function getBranchNotifs(): DemoNotif[] {
  return read<DemoNotif[]>(KEYS.BRANCH_NOTIFS, []);
}

export function getAdminNotifs(): DemoNotif[] {
  return read<DemoNotif[]>(KEYS.ADMIN_NOTIFS, []);
}

export function markWarehouseNotifRead(id: string) {
  const all = getWarehouseNotifs().map((n) => n.id === id ? { ...n, read: true } : n);
  write(KEYS.WAREHOUSE_NOTIFS, all);
}

export function markBranchNotifRead(id: string) {
  const all = getBranchNotifs().map((n) => n.id === id ? { ...n, read: true } : n);
  write(KEYS.BRANCH_NOTIFS, all);
}

export function markAdminNotifRead(id: string) {
  const all = getAdminNotifs().map((n) => n.id === id ? { ...n, read: true } : n);
  write(KEYS.ADMIN_NOTIFS, all);
}

function pushWarehouseNotif(n: Omit<DemoNotif, "id" | "timestamp" | "read">) {
  const all = getWarehouseNotifs();
  all.unshift({ ...n, id: `wn-${Date.now()}`, timestamp: nowStr(), read: false });
  write(KEYS.WAREHOUSE_NOTIFS, all);
}

function pushBranchNotif(n: Omit<DemoNotif, "id" | "timestamp" | "read">) {
  const all = getBranchNotifs();
  all.unshift({ ...n, id: `bn-${Date.now()}`, timestamp: nowStr(), read: false });
  write(KEYS.BRANCH_NOTIFS, all);
}

function pushAdminNotif(n: Omit<DemoNotif, "id" | "timestamp" | "read">) {
  const all = getAdminNotifs();
  all.unshift({ ...n, id: `an-${Date.now()}`, timestamp: nowStr(), read: false });
  write(KEYS.ADMIN_NOTIFS, all);
}

// ── Order ─────────────────────────────────────────────────────────────────────

export function getDemoOrder(): DemoOrder | null {
  return read<DemoOrder | null>(KEYS.ORDER, null);
}

export function saveDemoOrder(order: DemoOrder) {
  write(KEYS.ORDER, order);
}

export function clearDemoOrder() {
  localStorage.removeItem(KEYS.ORDER);
  localStorage.removeItem(KEYS.TRACKING_STATUS);
}

// ── Tracking status ───────────────────────────────────────────────────────────

export function getDemoTrackingStatus(): DemoTrackingStatus {
  return read<DemoTrackingStatus>(KEYS.TRACKING_STATUS, "Pending Approval");
}

export function setDemoTrackingStatus(status: DemoTrackingStatus) {
  write(KEYS.TRACKING_STATUS, status);
}

// ── High-level flow actions ───────────────────────────────────────────────────

/** Called from Checkout when branch places an order */
export function placeOrder(
  orderId: string,
  branch: string,
  items: DemoOrderItem[],
  amount: number,
  paymentMethod: string,
  orderDate: string,
  expectedDelivery: string
) {
  const order: DemoOrder = {
    id: orderId,
    branch,
    date: orderDate,
    itemsCount: items.length,
    amount,
    approvedAmount: amount, // will be recalculated on approval
    isPartial: false,
    status: "Pending",
    paymentStatus: "Pending",
    invoiceNumber: null,
    invoiceGenerated: false,
    items,
    paymentMethod,
    orderDate,
    expectedDelivery,
  };
  saveDemoOrder(order);
  setDemoTrackingStatus("Pending Approval");
  pushWarehouseNotif({
    type: "order_pending",
    title: "New Order Received",
    message: `Branch ${branch} placed order ${orderId} (${items.length} items). Awaiting verification.`,
  });
}

/** Called from Warehouse Order Verification when approving the demo order */
export function approveOrder(orderId: string, branch: string) {
  const order = getDemoOrder();
  if (!order || order.id !== orderId) return;

  // Compute approved quantities and recalculate amount based on approved qtys only
  const totalRequestedQty = order.items.reduce((s, i) => s + i.requested, 0);
  const unitPrice = totalRequestedQty > 0 ? order.amount / totalRequestedQty : 0;

  let isPartial = false;
  const updatedItems: DemoOrderItem[] = order.items.map((item) => {
    const approved = Math.min(item.requested, item.available);
    if (approved < item.requested) isPartial = true;
    return { ...item, approved };
  });

  const approvedAmount = Math.round(
    updatedItems.reduce((s, i) => s + (i.approved ?? i.requested) * unitPrice, 0)
  );

  order.status = "Approved";
  order.items = updatedItems;
  order.approvedAmount = approvedAmount;
  order.isPartial = isPartial;
  saveDemoOrder(order);
  setDemoTrackingStatus("Approved");

  // Update analytics
  updateOrderAnalytics(order);

  pushWarehouseNotif({
    type: "order_approved",
    title: "Order Approved",
    message: `Order ${orderId} for ${branch} approved. Proceed to Invoice Generation.`,
  });
  pushBranchNotif({
    type: "order_approved",
    title: isPartial ? "Order Partially Approved" : "Order Approved",
    message: isPartial
      ? `Your order ${orderId} was partially approved. Invoice will reflect approved quantities only.`
      : `Your order ${orderId} has been approved by warehouse. Invoice will be generated shortly.`,
  });
}

/** Called from Warehouse Invoice Generation page */
export function generateInvoice(orderId: string): string | null {
  const order = getDemoOrder();
  if (!order || order.id !== orderId || order.status !== "Approved") return null;
  const invNo = nextDemoInvoiceNumber();
  order.invoiceNumber = invNo;
  order.invoiceGenerated = true;
  saveDemoOrder(order);
  pushWarehouseNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invNo} generated successfully for order ${orderId}.`,
  });
  pushBranchNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invNo} has been generated for your order ${orderId}. Please proceed with payment.`,
  });
  return invNo;
}

/** Called from Warehouse Order Verification when rejecting the demo order */
export function rejectOrder(orderId: string, reason: string) {
  const order = getDemoOrder();
  if (!order || order.id !== orderId) return;
  order.status = "Rejected";
  saveDemoOrder(order);
  setDemoTrackingStatus("Rejected");
  pushWarehouseNotif({
    type: "order_rejected",
    title: "Order Rejected",
    message: `Order ${orderId} has been rejected. Reason: ${reason}`,
  });
  pushBranchNotif({
    type: "order_rejected",
    title: "Order Rejected",
    message: `Your order ${orderId} was rejected. Reason: ${reason}`,
  });
}

/** Called from Branch Order Tracking when paying */
export function payForOrder(orderId: string) {
  const order = getDemoOrder();
  if (!order || order.id !== orderId) return;
  order.paymentStatus = "Paid";
  saveDemoOrder(order);
  setDemoTrackingStatus("Payment Completed");
  pushWarehouseNotif({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment completed for order ${orderId} (${order.branch}). Ready for dispatch.`,
  });
  pushBranchNotif({
    type: "payment_received",
    title: "Payment Confirmed",
    message: `Your payment for order ${orderId} has been received. Order is now ready for dispatch.`,
  });
}

/** Called from Warehouse Dispatch Tracking */
export function advanceDispatch(orderId: string, stage: "Packed" | "Dispatched" | "In Transit" | "Delivered") {
  const order = getDemoOrder();
  if (!order || order.id !== orderId) return;
  setDemoTrackingStatus(stage);
  if (stage === "Dispatched" || stage === "In Transit") {
    pushBranchNotif({
      type: "delivery",
      title: "Order Dispatched",
      message: `Your order ${orderId} has been dispatched and is on its way.`,
    });
  }
  if (stage === "Delivered") {
    pushBranchNotif({
      type: "delivery",
      title: "Order Delivered",
      message: `Your order ${orderId} has been delivered to ${order.branch}.`,
    });
  }
}

// ── Demo Reset ────────────────────────────────────────────────────────────────

/** Reset all demo localStorage data back to initial state */
export function resetDemoData() {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}

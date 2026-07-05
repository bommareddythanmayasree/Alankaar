/**
 * demo-store.ts — Phase 3 Extended
 * Single source of truth for the localStorage-backed demo ERP flow.
 * All pages read/write through these helpers — no direct localStorage calls elsewhere.
 */

import { DEMO_BRANCH_ACCOUNTS } from "../data/demo-mock-data";
import { WAREHOUSE_STOCK_ITEMS } from "../data/warehouse-mock-data";
import { formatCurrency } from "../utils/format-currency";

// ── Keys ──────────────────────────────────────────────────────────────────────

const KEYS = {
  ORDER: "demoWarehouseOrder",
  TRACKING_STATUS: "demoOrderTrackingStatus",
  SUBMITTED_ORDERS: "demoSubmittedOrders",
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
  DELIVERY_EXCEPTIONS: "demoDeliveryExceptions", // DeliveryExceptionRecord[]
  DISPATCH_ASSIGNMENTS: "demoDispatchAssignments", // DispatchAssignment[]
  DISPATCH_BATCHES: "demoDispatchBatches",       // DispatchBatch[]
  DELIVERY_DISCREPANCIES: "demoDeliveryDiscrepancies", // DeliveryDiscrepancy[]
  DRIVER_POOL: "demoDriverPool",                 // DriverRecord[]
  VEHICLE_POOL: "demoVehiclePool",               // VehicleRecord[]
  // Tray Management
  TRAY_CONFIG: "demoTrayConfig",                 // TrayConfig
  TRAY_DISPATCHES: "demoTrayDispatches",         // TrayDispatch[]
  TRAY_RETURNS: "demoTrayReturns",               // TrayReturn[]
  TRAY_SEED_VERSION: "demoTraySeedVersion",      // string — bump to force re-seed
} as const;

/** Bump this string whenever SEED_TRAY_DISPATCHES or SEED_TRAY_RETURNS changes */
const TRAY_SEED_VERSION = "v3";

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

// ── Delivery Exception Types ──────────────────────────────────────────────────

export type DeliveryExceptionType =
  | "Partially Produced"
  | "Missing During Loading"
  | "Lost During Transit"
  | null;

export type DeliveryExceptionItem = {
  product: string;
  unit: string;
  orderedQty: number;
  producedQty: number;
  loadedQty: number;
  receivedQty: number;
  difference: number;
  exceptionType: DeliveryExceptionType;
  exceptionReason: string;
};

export type DeliveryExceptionRecord = {
  orderId: string;
  branch: string;
  date: string;
  items: DeliveryExceptionItem[];
  /** orderValue = original order amount before delivery */
  orderValue?: number;
  /** receivedValue = invoice amount (always based on receivedQty) */
  receivedValue: number;
  deliveryStatus: "Delivered Successfully" | "Partial Delivery";
};

// ── Driver & Vehicle Pool ─────────────────────────────────────────────────────

export type DriverRecord = {
  id: string;
  name: string;
  phone: string;
  status: "Available" | "Assigned" | "Off Duty";
  assignedOrderId?: string;
};

export type VehicleRecord = {
  id: string;
  number: string;
  type: string;
  status: "Available" | "Assigned" | "In Maintenance";
  assignedOrderId?: string;
};

const SEED_DRIVERS: DriverRecord[] = [
  { id: "DRV-001", name: "Ramesh Kumar",  phone: "9440001001", status: "Available" },
  { id: "DRV-002", name: "Suresh Rao",    phone: "9440001002", status: "Available" },
  { id: "DRV-003", name: "Vijay Reddy",   phone: "9440001003", status: "Available" },
  { id: "DRV-004", name: "Arun Babu",     phone: "9440001004", status: "Available" },
  { id: "DRV-005", name: "Nagaraju P",    phone: "9440001005", status: "Available" },
  { id: "DRV-006", name: "Srinivas M",    phone: "9440001006", status: "Available" },
  { id: "DRV-007", name: "Kiran Kumar",   phone: "9440001007", status: "Available" },
  { id: "DRV-008", name: "Praveen S",     phone: "9440001008", status: "Available" },
];

const SEED_VEHICLES: VehicleRecord[] = [
  { id: "VEH-001", number: "AP 16 AB 1234", type: "Mini Truck",  status: "Available" },
  { id: "VEH-002", number: "AP 29 BX 7734", type: "Pickup Van",  status: "Available" },
  { id: "VEH-003", number: "AP 16 CD 5678", type: "Mini Truck",  status: "Available" },
  { id: "VEH-004", number: "AP 37 EF 9012", type: "Delivery Van", status: "Available" },
  { id: "VEH-005", number: "AP 16 GH 3456", type: "Mini Truck",  status: "Available" },
  { id: "VEH-006", number: "AP 29 IJ 7890", type: "Pickup Van",  status: "Available" },
  { id: "VEH-007", number: "AP 16 KL 2345", type: "Delivery Van", status: "Available" },
  { id: "VEH-008", number: "AP 37 MN 6789", type: "Mini Truck",  status: "Available" },
];

export function getDriverPool(): DriverRecord[] {
  const stored = read<DriverRecord[]>(KEYS.DRIVER_POOL, []);
  if (stored.length === 0) {
    write(KEYS.DRIVER_POOL, SEED_DRIVERS);
    return SEED_DRIVERS;
  }
  return stored;
}

export function getVehiclePool(): VehicleRecord[] {
  const stored = read<VehicleRecord[]>(KEYS.VEHICLE_POOL, []);
  if (stored.length === 0) {
    write(KEYS.VEHICLE_POOL, SEED_VEHICLES);
    return SEED_VEHICLES;
  }
  return stored;
}

/**
 * Reset all drivers and vehicles back to Available.
 * Clears any Assigned/Off-Duty state — useful in the demo when you
 * want to re-dispatch without restarting the application.
 */
export function resetDriverVehiclePool() {
  write(KEYS.DRIVER_POOL, SEED_DRIVERS);
  write(KEYS.VEHICLE_POOL, SEED_VEHICLES);
  write(KEYS.DISPATCH_ASSIGNMENTS, []);
  broadcastChange(KEYS.DRIVER_POOL);
  broadcastChange(KEYS.VEHICLE_POOL);
}

function saveDriverPool(drivers: DriverRecord[]) {
  write(KEYS.DRIVER_POOL, drivers);
  broadcastChange(KEYS.DRIVER_POOL);
}

function saveVehiclePool(vehicles: VehicleRecord[]) {
  write(KEYS.VEHICLE_POOL, vehicles);
  broadcastChange(KEYS.VEHICLE_POOL);
}

// ── Dispatch Assignment ───────────────────────────────────────────────────────

export type DispatchAssignment = {
  orderId: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  slot: "Morning" | "Evening";
  dispatchTime: string;
  assignedAt: string;
};

export function getDispatchAssignments(): DispatchAssignment[] {
  return read<DispatchAssignment[]>(KEYS.DISPATCH_ASSIGNMENTS, []);
}

export function getDispatchAssignment(orderId: string): DispatchAssignment | undefined {
  return getDispatchAssignments().find(a => a.orderId === orderId);
}

/** Assign driver + vehicle to an order dispatch, mark them as Assigned */
export function assignDispatch(
  orderId: string,
  driverId: string,
  vehicleId: string,
  slot: "Morning" | "Evening",
): DispatchAssignment | null {
  const drivers = getDriverPool();
  const vehicles = getVehiclePool();
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!driver || !vehicle) return null;

  // Mark driver and vehicle as Assigned
  saveDriverPool(drivers.map(d => d.id === driverId ? { ...d, status: "Assigned", assignedOrderId: orderId } : d));
  saveVehiclePool(vehicles.map(v => v.id === vehicleId ? { ...v, status: "Assigned", assignedOrderId: orderId } : v));

  const assignment: DispatchAssignment = {
    orderId,
    driverId,
    driverName: driver.name,
    vehicleId,
    vehicleNumber: vehicle.number,
    slot,
    dispatchTime: slot === "Morning" ? "06:30 AM" : "03:00 PM",
    assignedAt: nowStr(),
  };

  const existing = getDispatchAssignments().filter(a => a.orderId !== orderId);
  write(KEYS.DISPATCH_ASSIGNMENTS, [assignment, ...existing]);
  broadcastChange(KEYS.DISPATCH_ASSIGNMENTS);
  return assignment;
}

/** Release driver + vehicle back to Available when order completes */
export function releaseDispatchAssignment(orderId: string) {
  const assignments = getDispatchAssignments();
  const a = assignments.find(x => x.orderId === orderId);
  if (!a) return;

  saveDriverPool(getDriverPool().map(d =>
    d.id === a.driverId ? { ...d, status: "Available", assignedOrderId: undefined } : d
  ));
  saveVehiclePool(getVehiclePool().map(v =>
    v.id === a.vehicleId ? { ...v, status: "Available", assignedOrderId: undefined } : v
  ));
}

// ── Dispatch Batches (multi-batch per order) ──────────────────────────────────

export type DispatchBatchStatus = "Scheduled" | "In Transit" | "Delivered";

export type DispatchBatchProduct = {
  product: string;
  unit: string;
  qty: number;
};

export type DispatchBatch = {
  batchId: string;
  orderId: string;
  batchNumber: number;         // 1, 2, 3…
  slot: "Morning" | "Evening";
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  dispatchTime: string;        // "06:30 AM" | "03:00 PM"
  status: DispatchBatchStatus;
  products: DispatchBatchProduct[];
  createdAt: string;
  deliveredAt?: string;
  /** Per-product delivery lines filled when batch is confirmed delivered */
  deliveryLines?: ProductDeliveryLine[];
};

export function getDispatchBatches(): DispatchBatch[] {
  return read<DispatchBatch[]>(KEYS.DISPATCH_BATCHES, []);
}

export function getDispatchBatchesForOrder(orderId: string): DispatchBatch[] {
  return getDispatchBatches().filter(b => b.orderId === orderId);
}

/**
 * Returns order products that have NOT yet been assigned to any dispatch batch.
 * Use this to populate the product selector when creating a new batch —
 * ensures each product belongs to exactly ONE batch.
 */
export function getUnassignedOrderProducts(orderId: string, orderItems: WorkflowOrderItemLive[]): WorkflowOrderItemLive[] {
  const batches = getDispatchBatchesForOrder(orderId);
  // Collect all product names already assigned to any batch for this order
  const assignedProducts = new Set<string>();
  for (const batch of batches) {
    for (const p of batch.products) {
      assignedProducts.add(p.product);
    }
  }
  return orderItems.filter(item => !assignedProducts.has(item.product));
}

/** Create a new dispatch batch for an order. Driver/vehicle marked Assigned for this batch. */
export function addDispatchBatch(
  orderId: string,
  slot: "Morning" | "Evening",
  driverId: string,
  vehicleId: string,
  products: DispatchBatchProduct[],
): DispatchBatch | null {
  const drivers = getDriverPool();
  const vehicles = getVehiclePool();
  const driver = drivers.find(d => d.id === driverId);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (!driver || !vehicle) return null;

  // Mark them assigned (allow reassignment across batches for demo flexibility)
  saveDriverPool(drivers.map(d =>
    d.id === driverId ? { ...d, status: "Assigned" as const, assignedOrderId: orderId } : d
  ));
  saveVehiclePool(vehicles.map(v =>
    v.id === vehicleId ? { ...v, status: "Assigned" as const, assignedOrderId: orderId } : v
  ));

  const existing = getDispatchBatches();
  const orderBatches = existing.filter(b => b.orderId === orderId);
  const batchNumber = orderBatches.length + 1;

  const batch: DispatchBatch = {
    batchId: `BATCH-${orderId}-${batchNumber}`,
    orderId,
    batchNumber,
    slot,
    driverId,
    driverName: driver.name,
    vehicleId,
    vehicleNumber: vehicle.number,
    dispatchTime: slot === "Morning" ? "06:30 AM" : "03:00 PM",
    status: "Scheduled",
    products,
    createdAt: nowStr(),
  };

  write(KEYS.DISPATCH_BATCHES, [batch, ...existing]);
  broadcastChange(KEYS.DISPATCH_BATCHES);

  // Also save a legacy DispatchAssignment for backward-compat with pages that call getDispatchAssignment()
  const legacyAssignment: DispatchAssignment = {
    orderId,
    driverId,
    driverName: driver.name,
    vehicleId,
    vehicleNumber: vehicle.number,
    slot,
    dispatchTime: batch.dispatchTime,
    assignedAt: batch.createdAt,
  };
  const existingAssignments = getDispatchAssignments().filter(a => a.orderId !== orderId);
  write(KEYS.DISPATCH_ASSIGNMENTS, [legacyAssignment, ...existingAssignments]);
  broadcastChange(KEYS.DISPATCH_ASSIGNMENTS);

  // Keep order in "Ready For Dispatch" — status only advances when first batch is dispatched
  pushWarehouseNotif({
    type: "delivery",
    title: "Dispatch Batch Created",
    message: `Batch ${batchNumber} (${slot}) created for order ${orderId} — ${driver.name} / ${vehicle.number}.`,
  });

  return batch;
}

/** Update a dispatch batch's status (Scheduled → In Transit only via orders-workflow).
 *  "Delivered" status is set exclusively via confirmBatchDelivery().
 *  NOTE: callers should also update the parent order status via updateWorkflowOrderStatus
 *  when advancing to "In Transit" so all pages stay in sync. */
export function updateDispatchBatchStatus(
  batchId: string,
  status: DispatchBatchStatus,
  deliveryLines?: ProductDeliveryLine[],
): void {
  const batches = getDispatchBatches();
  const updated = batches.map(b => {
    if (b.batchId !== batchId) return b;
    return {
      ...b,
      status,
      deliveredAt: status === "Delivered" ? nowStr() : b.deliveredAt,
      deliveryLines: deliveryLines ?? b.deliveryLines,
    };
  });
  write(KEYS.DISPATCH_BATCHES, updated);
  broadcastChange(KEYS.DISPATCH_BATCHES);
}

/**
 * Mark a dispatch batch "In Transit" and synchronise the parent order status.
 * This is the correct entry point from Orders Workflow — it updates both the
 * batch and the order in a single atomic write so Delivery Confirmation
 * immediately shows the batch without requiring a page refresh.
 */
export function markBatchInTransit(batchId: string): void {
  const batches = getDispatchBatches();
  const batch = batches.find(b => b.batchId === batchId);
  if (!batch || batch.status !== "Scheduled") return;

  // 1. Update batch status
  const updatedBatches = batches.map(b =>
    b.batchId === batchId ? { ...b, status: "In Transit" as DispatchBatchStatus } : b
  );
  write(KEYS.DISPATCH_BATCHES, updatedBatches);
  broadcastChange(KEYS.DISPATCH_BATCHES);

  // 2. Advance parent order to "In Transit" if it isn't already past that stage.
  // Order status is always derived from batch state — never set independently by pages.
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === batch.orderId);
  const alreadyAdvanced = order && (
    order.status === "In Transit" || order.status === "Delivered" ||
    order.status === "Partially Delivered" || order.status === "Awaiting Invoice" ||
    order.status === "Invoice Generated" || order.status === "Payment Pending" ||
    order.status === "Payment Verification Pending" || order.status === "Payment Completed" ||
    order.status === "Order Closed"
  );
  if (order && !alreadyAdvanced) {
    const updatedOrders = orders.map(o =>
      o.id === batch.orderId ? { ...o, status: "In Transit" as WorkflowLifecycleStatus } : o
    );
    write(WORKFLOW_ORDERS_KEY, updatedOrders);
    broadcastChange(WORKFLOW_ORDERS_KEY);
  }
}

/**
 * Confirm delivery for a specific dispatch batch.
 * Saves delivery lines on the batch, marks it "Delivered", saves a
 * BatchDeliveryConfirmation, then derives the parent order status from
 * all batch statuses.
 *
 * Order status rules:
 *   - No delivered batches         → In Transit (unchanged)
 *   - Some delivered, some pending → Partially Delivered
 *   - All batches delivered        → Awaiting Invoice
 */
export function confirmBatchDelivery(
  batchId: string,
  deliveryLines: ProductDeliveryLine[],
): void {
  const now = new Date();
  const confirmedAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + ", " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // 1. Update the batch record
  const batches = getDispatchBatches();
  const updated = batches.map(b => {
    if (b.batchId !== batchId) return b;
    return { ...b, status: "Delivered" as DispatchBatchStatus, deliveredAt: nowStr(), deliveryLines };
  });
  write(KEYS.DISPATCH_BATCHES, updated);
  broadcastChange(KEYS.DISPATCH_BATCHES);

  const batch = updated.find(b => b.batchId === batchId);
  if (!batch) return;

  // 2. Save a BatchDeliveryConfirmation for this batch
  const allDelivered = deliveryLines.every(l => l.status === "Delivered");
  const noneDelivered = deliveryLines.every(l => l.status === "Not Delivered");
  const batchOverallStatus: ProductDeliveryStatus | "Delivered Successfully" =
    allDelivered ? "Delivered Successfully"
    : noneDelivered ? "Not Delivered"
    : "Partial Delivery";
  const batchInvoicedValue = Math.round(
    deliveryLines.reduce((s, l) => s + l.deliveredQty * getProductSellingPrice(l.product), 0)
  );
  const orders = getWorkflowOrders();
  const parentOrder = orders.find(o => o.id === batch.orderId);
  const batchConf: BatchDeliveryConfirmation = {
    batchId,
    orderId: batch.orderId,
    batchNumber: batch.batchNumber,
    branch: parentOrder?.branch ?? "",
    confirmedAt,
    lines: deliveryLines,
    invoicedValue: batchInvoicedValue,
    overallStatus: batchOverallStatus,
    invoiced: false,
  };
  const existingBatchConfs = getBatchDeliveryConfirmations().filter(c => c.batchId !== batchId);
  write(BATCH_DELIVERY_CONFIRMATIONS_KEY, [batchConf, ...existingBatchConfs]);
  broadcastChange(BATCH_DELIVERY_CONFIRMATIONS_KEY);

  // 3. Derive parent order status from all batch statuses
  _updateOrderStatusFromBatches(batch.orderId, updated);
}

/**
 * Derive and update the parent order status from all its batch statuses.
 *
 * Rules:
 *   - No delivered batches         → stays In Transit / Partially Delivered (unchanged beyond "In Transit")
 *   - Some delivered, some pending → Partially Delivered
 *   - All batches delivered        → Awaiting Invoice (aggregate confirmation saved)
 */
function _updateOrderStatusFromBatches(orderId: string, allBatches: DispatchBatch[]) {
  const orderBatches = allBatches.filter(b => b.orderId === orderId);
  if (orderBatches.length === 0) return;

  const allDelivered = orderBatches.every(b => b.status === "Delivered");
  const someDelivered = orderBatches.some(b => b.status === "Delivered");
  const hasPending = orderBatches.some(b => b.status === "Scheduled" || b.status === "In Transit");

  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  // Already past delivery — don't regress
  const alreadyAdvanced = (
    order.status === "Awaiting Invoice" || order.status === "Invoice Generated" ||
    order.status === "Payment Pending" || order.status === "Payment Verification Pending" ||
    order.status === "Payment Completed" || order.status === "Order Closed"
  );
  if (alreadyAdvanced) return;

  if (allDelivered) {
    // Aggregate delivery lines from all batches into an order-level confirmation
    const lineMap: Record<string, ProductDeliveryLine> = {};
    for (const batch of orderBatches) {
      for (const line of (batch.deliveryLines ?? [])) {
        if (lineMap[line.product]) {
          const existing = lineMap[line.product];
          const deliveredQty = existing.deliveredQty + line.deliveredQty;
          const loadedQty = existing.loadedQty + line.loadedQty;
          const pendingQty = loadedQty - deliveredQty;
          lineMap[line.product] = {
            ...existing,
            loadedQty,
            deliveredQty,
            pendingQty,
            status: deriveOverallProductStatus(loadedQty, deliveredQty),
            reason: line.reason || existing.reason,
          };
        } else {
          lineMap[line.product] = { ...line };
        }
      }
    }
    const lines = Object.values(lineMap);
    const allLinesDelivered = lines.every(l => l.status === "Delivered");
    const noneLinesDelivered = lines.every(l => l.status === "Not Delivered");
    const overallStatus: ProductDeliveryStatus | "Delivered Successfully" =
      allLinesDelivered ? "Delivered Successfully"
      : noneLinesDelivered ? "Not Delivered"
      : "Partial Delivery";
    const invoicedValue = Math.round(
      lines.reduce((s, l) => s + l.deliveredQty * getProductSellingPrice(l.product), 0)
    );
    const now = new Date();
    const deliveredDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const deliveredTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const confirmation: OrderDeliveryConfirmation = {
      orderId,
      branch: order.branch,
      confirmedAt: `${deliveredDate}, ${deliveredTime}`,
      lines,
      invoicedValue,
      overallStatus,
    };
    const existingConfs = getOrderDeliveryConfirmations().filter(c => c.orderId !== orderId);
    write(ORDER_DELIVERY_CONFIRMATIONS_KEY, [confirmation, ...existingConfs]);
    broadcastChange(ORDER_DELIVERY_CONFIRMATIONS_KEY);

    // Advance order to Awaiting Invoice
    const updatedOrders = orders.map(o =>
      o.id === orderId
        ? { ...o, status: "Awaiting Invoice" as WorkflowLifecycleStatus, deliveredDate, deliveredTime }
        : o
    );
    write(WORKFLOW_ORDERS_KEY, updatedOrders);
    broadcastChange(WORKFLOW_ORDERS_KEY);

    // Release all drivers/vehicles
    const allDriverIds = [...new Set(orderBatches.map(b => b.driverId))];
    const allVehicleIds = [...new Set(orderBatches.map(b => b.vehicleId))];
    saveDriverPool(getDriverPool().map(d =>
      allDriverIds.includes(d.id) ? { ...d, status: "Available" as const, assignedOrderId: undefined } : d
    ));
    saveVehiclePool(getVehiclePool().map(v =>
      allVehicleIds.includes(v.id) ? { ...v, status: "Available" as const, assignedOrderId: undefined } : v
    ));

    const isPartial = overallStatus === "Partial Delivery";
    pushBranchNotif({
      type: "delivery",
      title: isPartial ? "Partial Delivery Confirmed" : "Delivery Confirmed",
      message: `All batches for order ${orderId} confirmed. Invoice will be generated shortly.`,
    });
    pushWarehouseNotif({
      type: "delivery",
      title: "All Batches Confirmed — Awaiting Invoice",
      message: `All dispatch batches for order ${orderId} (${order.branch}) have been confirmed. Please generate invoice.`,
    });
  } else if (someDelivered && hasPending) {
    // Partially delivered — update order status only if not already partial
    if (order.status !== "Partially Delivered") {
      const updatedOrders = orders.map(o =>
        o.id === orderId ? { ...o, status: "Partially Delivered" as WorkflowLifecycleStatus } : o
      );
      write(WORKFLOW_ORDERS_KEY, updatedOrders);
      broadcastChange(WORKFLOW_ORDERS_KEY);
    }
    pushBranchNotif({
      type: "delivery",
      title: "Batch Delivered",
      message: `A batch for order ${orderId} has been delivered. Remaining batches are still in transit.`,
    });
  }
}

function deriveOverallProductStatus(loadedQty: number, deliveredQty: number): ProductDeliveryStatus {
  if (deliveredQty >= loadedQty) return "Delivered";
  if (deliveredQty === 0)        return "Not Delivered";
  return "Partial Delivery";
}

// ── Delivery Discrepancy (Branch Report Difference) ───────────────────────────

export type DiscrepancyType = "Missing Quantity" | "Damaged Items" | "Wrong Product" | "Other";

export type DiscrepancyItem = {
  product: string;
  unit: string;
  deliveredQty: number;
  reportedIssue: DiscrepancyType;
  missingQty?: number;
  remarks: string;
};

export type DeliveryDiscrepancy = {
  id: string;
  orderId: string;
  branch: string;
  reportedAt: string;
  status: "Pending Review" | "Resolved";
  items: DiscrepancyItem[];
};

export function getDeliveryDiscrepancies(): DeliveryDiscrepancy[] {
  return read<DeliveryDiscrepancy[]>(KEYS.DELIVERY_DISCREPANCIES, []);
}

export function getDeliveryDiscrepancy(orderId: string): DeliveryDiscrepancy | undefined {
  return getDeliveryDiscrepancies().find(d => d.orderId === orderId);
}

export function reportDeliveryDiscrepancy(
  orderId: string,
  branch: string,
  items: DiscrepancyItem[]
): DeliveryDiscrepancy {
  const discrepancy: DeliveryDiscrepancy = {
    id: `DDR-${Date.now()}`,
    orderId,
    branch,
    reportedAt: nowStr(),
    status: "Pending Review",
    items,
  };

  const existing = getDeliveryDiscrepancies().filter(d => d.orderId !== orderId);
  write(KEYS.DELIVERY_DISCREPANCIES, [discrepancy, ...existing]);
  broadcastChange(KEYS.DELIVERY_DISCREPANCIES);

  // Notify warehouse
  pushWarehouseNotif({
    type: "delivery",
    title: "Delivery Discrepancy Reported",
    message: `Branch ${branch} reported a delivery difference for order ${orderId}. Please review.`,
  });

  return discrepancy;
}

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
    message: `Warehouse added "${product.productName}" (${product.category}). Price: ?${product.price}. Awaiting admin approval.`,
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

// ── Demo Branch Identity ───────────────────────────────────────────────────────

export const DEMO_BRANCH_KEY = "demo_branch_id";

/**
 * Returns the currently selected demo branch name (e.g. "Gandhi Nagar").
 * Falls back to "Gandhi Nagar" if nothing is stored.
 */
export function getCurrentDemoBranchName(): string {
  const id = localStorage.getItem(DEMO_BRANCH_KEY);
  if (!id) return "Gandhi Nagar";
  return DEMO_BRANCH_ACCOUNTS.find(b => b.id === id)?.name ?? "Gandhi Nagar";
}

// ── Submitted Orders (Place Order → My Orders flow) ───────────────────────────

export type SubmittedOrderItem = {
  name: string;
  qty: number;
  priority: "Normal" | "Urgent";
};

export type SubmittedOrder = {
  orderId: string;
  branch: string;
  timestamp: string;
  dispatchSlot: "Morning Dispatch" | "Evening Dispatch";
  status: "Warehouse Review";
  items: SubmittedOrderItem[];
};

export function getSubmittedOrders(): SubmittedOrder[] {
  return read<SubmittedOrder[]>(KEYS.SUBMITTED_ORDERS, []);
}

export function saveSubmittedOrder(order: SubmittedOrder) {
  const existing = getSubmittedOrders().filter(o => o.orderId !== order.orderId);
  write(KEYS.SUBMITTED_ORDERS, [order, ...existing]);
}

// ── Warehouse Orders — shared localStorage bridge (Branch ↔ Warehouse) ────────

export type WarehouseOrderStatus =
  | "Under Review"
  | "Approved"
  | "Production Started"
  | "Ready For Dispatch"
  | "Morning Dispatch"
  | "Evening Dispatch"
  | "Delivered";

export const WAREHOUSE_STATUS_SEQUENCE: WarehouseOrderStatus[] = [
  "Under Review",
  "Approved",
  "Production Started",
  "Ready For Dispatch",
  "Morning Dispatch",
  "Evening Dispatch",
  "Delivered",
];

export type WarehouseOrderItem = {
  name: string;
  qty: number;
  priority: "Normal" | "Urgent";
};

export type WarehouseOrder = {
  orderId: string;
  branch: string;
  products: WarehouseOrderItem[];
  quantity: number;          // total units
  priority: "Normal" | "Urgent";
  dispatchSlot: "Morning Dispatch" | "Evening Dispatch";
  status: WarehouseOrderStatus;
  createdAt: string;         // ISO timestamp for sorting
  amount: number;            // calculated total (qty × selling price)
};

const WAREHOUSE_ORDERS_KEY = "warehouseOrders";

// ── Product Price Lookup ──────────────────────────────────────────────────────

/**
 * Look up the selling price for a product by name using the canonical catalog.
 * Returns 0 if not found.
 */
export function getProductSellingPrice(productName: string): number {
  const match = WAREHOUSE_STOCK_ITEMS.find(
    (p) => p.productName.toLowerCase() === productName.toLowerCase()
  );
  return match?.sellingPrice ?? 0;
}

/**
 * Calculate the total amount for a list of {name, qty} items
 * using the warehouse product catalog's selling prices.
 */
export function calcOrderAmount(items: Array<{ name: string; qty: number }>): number {
  return items.reduce((sum, item) => sum + item.qty * getProductSellingPrice(item.name), 0);
}

export function getWarehouseOrders(): WarehouseOrder[] {
  return read<WarehouseOrder[]>(WAREHOUSE_ORDERS_KEY, []);
}

export function saveWarehouseOrder(order: WarehouseOrder) {
  const existing = getWarehouseOrders().filter(o => o.orderId !== order.orderId);
  // newest first
  write(WAREHOUSE_ORDERS_KEY, [order, ...existing]);
}

export function approveWarehouseOrder(orderId: string) {
  const orders = getWarehouseOrders();
  const updated = orders.map(o =>
    o.orderId === orderId ? { ...o, status: "Approved" as WarehouseOrderStatus } : o
  );
  write(WAREHOUSE_ORDERS_KEY, updated);
}

/** Advance a warehouse order to any lifecycle status */
export function updateWarehouseOrderStatus(orderId: string, status: WarehouseOrderStatus) {
  const orders = getWarehouseOrders();
  const updated = orders.map(o =>
    o.orderId === orderId ? { ...o, status } : o
  );
  write(WAREHOUSE_ORDERS_KEY, updated);
}

// ── Workflow Orders — full lifecycle synchronized store ───────────────────────
// This is the master store for the complete Order Lifecycle.
// All pages (Orders Workflow, Production Planning, Dispatch Tracking,
// Delivery Tracking, Invoice Generation, Collections,
// Branch My Orders, Branch Order Tracking) read/write from this key.

export type WorkflowLifecycleStatus =
  | "Order Placed"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Added To Production"
  | "Production Started"
  | "Production Completed"
  | "Ready For Dispatch"
  | "Morning Dispatch"
  | "Evening Dispatch"
  | "In Transit"
  | "Delivered"
  | "Partially Delivered"
  | "Awaiting Invoice"
  | "Invoice Generated"
  | "Payment Pending"
  | "Payment Verification Pending"
  | "Payment Completed"
  | "Order Closed";

export const WORKFLOW_LIFECYCLE_SEQUENCE: WorkflowLifecycleStatus[] = [
  "Order Placed",
  "Under Review",
  "Approved",
  "Added To Production",
  "Production Started",
  "Production Completed",
  "Ready For Dispatch",
  "Morning Dispatch",
  "Evening Dispatch",
  "In Transit",
  "Delivered",
  "Partially Delivered",
  "Awaiting Invoice",
  "Invoice Generated",
  "Payment Pending",
  "Payment Verification Pending",
  "Payment Completed",
  "Order Closed",
];

export type WorkflowOrderItemLive = {
  product: string;
  orderedQty: number;
  approvedQty: number;
  rejectedQty: number;
  unit: string;
};

export type WorkflowOrderLive = {
  id: string;
  branch: string;
  date: string;
  time: string;
  priority: "Normal" | "Urgent";
  value: number;
  status: WorkflowLifecycleStatus;
  items: WorkflowOrderItemLive[];
  invoiceNumber?: string;
  /** Set when delivery rep confirms delivery */
  deliveredDate?: string;
  deliveredTime?: string;
  // Advance order metadata (only present for orders placed via Advance Orders page)
  isAdvanceOrder?: boolean;
  advanceOrderId?: string;
  occasion?: string;
  deliveryDate?: string;
};

const WORKFLOW_ORDERS_KEY = "workflowOrders";

/** Dispatch a storage event so all same-tab listeners also react */
function broadcastChange(key: string) {
  try {
    window.dispatchEvent(new StorageEvent("storage", { key }));
  } catch { /* SSR or test env */ }
}

export function getWorkflowOrders(): WorkflowOrderLive[] {
  return read<WorkflowOrderLive[]>(WORKFLOW_ORDERS_KEY, []);
}

/**
 * Increment this version whenever the static mock order list changes
 * (e.g. new orders added, statuses updated). Forces a re-seed on next load.
 */
const WORKFLOW_SEED_VERSION = "v3";
const WORKFLOW_SEED_VERSION_KEY = "workflowOrdersSeedVersion";

/**
 * Seed workflow orders from static mock data.
 * Re-seeds automatically when WORKFLOW_SEED_VERSION changes so that new
 * mock orders (e.g. "Payment Verification Pending") always appear even if
 * the user has stale localStorage data from a previous session.
 * Call once at app startup (e.g. in App.tsx or router).
 */
export function initWorkflowOrders(staticOrders: WorkflowOrderLive[]) {
  const storedVersion = read<string>(WORKFLOW_SEED_VERSION_KEY, "");
  const existing = getWorkflowOrders();
  if (existing.length === 0 || storedVersion !== WORKFLOW_SEED_VERSION) {
    write(WORKFLOW_ORDERS_KEY, staticOrders);
    write(WORKFLOW_SEED_VERSION_KEY, WORKFLOW_SEED_VERSION);
  }
}

export function saveWorkflowOrder(order: WorkflowOrderLive) {
  const existing = getWorkflowOrders().filter(o => o.id !== order.id);
  write(WORKFLOW_ORDERS_KEY, [order, ...existing]);
  broadcastChange(WORKFLOW_ORDERS_KEY);
}

/** Statuses that mean an order is complete and resources should be freed */
const RELEASE_STATUSES: WorkflowLifecycleStatus[] = [
  "Delivered",
  "Awaiting Invoice",
  "Invoice Generated",
  "Payment Completed",
  "Order Closed",
];

/** Update a single workflow order's status and notify all pages.
 *  If the order doesn't exist in workflowOrders yet, optionally seed it first.
 *  When status reaches "Payment Completed", automatically advances to "Order Closed".
 *  When status reaches a terminal delivery/payment stage, releases assigned driver & vehicle. */
export function updateWorkflowOrderStatus(
  orderId: string,
  status: WorkflowLifecycleStatus,
  seedData?: Omit<WorkflowOrderLive, "id" | "status">
) {
  const orders = getWorkflowOrders();
  const exists = orders.some(o => o.id === orderId);
  // "Payment Completed" is an accounting checkpoint — auto-closes the order
  const finalStatus: WorkflowLifecycleStatus = status === "Payment Completed" ? "Order Closed" : status;
  let updated: WorkflowOrderLive[];

  if (!exists && seedData) {
    const newOrder: WorkflowOrderLive = { id: orderId, status: finalStatus, ...seedData };
    updated = [newOrder, ...orders];
  } else {
    updated = orders.map(o => o.id === orderId ? { ...o, status: finalStatus } : o);
  }

  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  // Release driver & vehicle when order reaches a terminal stage
  if (RELEASE_STATUSES.includes(finalStatus)) {
    releaseDispatchAssignment(orderId);
  }

  const order = updated.find(o => o.id === orderId);
  if (order) {
    _notifyBranchForStatus(order, finalStatus);
  }
}

/** Assign invoice number to a workflow order */
export function setWorkflowOrderInvoice(orderId: string, invoiceNumber: string) {
  const orders = getWorkflowOrders();
  const updated = orders.map(o =>
    o.id === orderId ? { ...o, invoiceNumber, status: "Invoice Generated" as WorkflowLifecycleStatus } : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);
}

function _notifyBranchForStatus(order: WorkflowOrderLive, status: WorkflowLifecycleStatus) {
  const map: Partial<Record<WorkflowLifecycleStatus, { title: string; msg: string }>> = {
    "Approved":            { title: "Order Approved", msg: `Your order ${order.id} has been approved by warehouse.` },
    "Rejected":            { title: "Order Rejected", msg: `Your order ${order.id} has been rejected by warehouse.` },
    "Production Started":  { title: "Production Started", msg: `Your order ${order.id} is now in production.` },
    "Ready For Dispatch":  { title: "Ready For Dispatch", msg: `Your order ${order.id} is ready for dispatch.` },
    "Morning Dispatch":    { title: "Out For Delivery", msg: `Your order ${order.id} has been dispatched (Morning).` },
    "Evening Dispatch":    { title: "Out For Delivery", msg: `Your order ${order.id} has been dispatched (Evening).` },
    "In Transit":          { title: "Order In Transit", msg: `Your order ${order.id} is on its way to ${order.branch}.` },
    "Delivered":           { title: "Order Delivered", msg: `Your order ${order.id} has been delivered.` },
    "Awaiting Invoice":    { title: "Delivery Confirmed", msg: `Your order ${order.id} has been delivered. Invoice will be generated shortly.` },
    "Invoice Generated":   { title: "Invoice Generated", msg: `Invoice has been generated for order ${order.id}.` },
    "Payment Pending":     { title: "Payment Pending", msg: `Payment is pending for order ${order.id}.` },
    "Payment Verification Pending": { title: "Payment Verification Pending", msg: `Payment for order ${order.id} is awaiting warehouse verification.` },
    "Payment Completed":   { title: "Payment Completed", msg: `Payment completed for order ${order.id}.` },
    "Order Closed":        { title: "Order Closed", msg: `Order ${order.id} has been closed.` },
  };
  const n = map[status];
  if (n) {
    const all = read<DemoNotif[]>(KEYS.BRANCH_NOTIFS, []);
    all.unshift({ id: `bn-${Date.now()}`, type: "order_approved", title: n.title, message: n.msg, timestamp: nowStr(), read: false });
    write(KEYS.BRANCH_NOTIFS, all);
  }
}



// ── Production Progress ────────────────────────────────────────────────────────
// Tracks how much of each product has been produced today.
// Key: product name (matches ProductEntry.product)  Value: produced quantity

const PRODUCTION_PROGRESS_KEY = "demoProductionProgress";

export type ProductionProgressMap = Record<string, number>; // productName → producedQty

export function getProductionProgress(): ProductionProgressMap {
  return read<ProductionProgressMap>(PRODUCTION_PROGRESS_KEY, {});
}

export function setProductionQty(productName: string, qty: number) {
  const map = getProductionProgress();
  map[productName] = Math.max(0, qty);
  write(PRODUCTION_PROGRESS_KEY, map);
  broadcastChange(PRODUCTION_PROGRESS_KEY);
}

export function resetProductionProgress() {
  localStorage.removeItem(PRODUCTION_PROGRESS_KEY);
}

// ── Per-Product Delivery Confirmation ─────────────────────────────────────────
// Stores the warehouse-side per-product delivery data (loaded qty, delivered qty,
// pending qty, reason). Separate from the old DeliveryExceptionRecord.

export type ProductDeliveryStatus = "Delivered" | "Partial Delivery" | "Pending Delivery" | "Not Delivered";

export type ProductDeliveryLine = {
  product: string;
  unit: string;
  orderedQty: number;
  loadedQty: number;
  deliveredQty: number;
  pendingQty: number;     // auto: loadedQty - deliveredQty
  status: ProductDeliveryStatus;
  reason: string;         // logistics reason when deliveredQty < orderedQty
};

/** Delivery reasons — shown only when Pending Qty > 0 */
export const LOGISTICS_REASONS = [
  "Shop Closed",
  "Customer Not Available",
  "Customer Refused Delivery",
  "Product Damaged During Transit",
  "Product Missing",
  "Short Loaded",
  "Wrong Product Loaded",
  "Vehicle Breakdown",
  "Traffic Delay",
  "Returned by Branch",
  "Storage Capacity Full",
  "Other",
] as const;

export type LogisticsReason = typeof LOGISTICS_REASONS[number];

export type OrderDeliveryConfirmation = {
  orderId: string;
  branch: string;
  confirmedAt: string;
  lines: ProductDeliveryLine[];
  /** Sum of delivered values (for invoice) */
  invoicedValue: number;
  /** Overall delivery status */
  overallStatus: ProductDeliveryStatus | "Delivered Successfully";
};

/** Per-batch delivery confirmation — created immediately when a batch is confirmed delivered. */
export type BatchDeliveryConfirmation = {
  batchId: string;
  orderId: string;
  batchNumber: number;
  branch: string;
  confirmedAt: string;
  lines: ProductDeliveryLine[];
  invoicedValue: number;
  overallStatus: ProductDeliveryStatus | "Delivered Successfully";
  /** Invoice number set by generateInvoiceFromBatch() */
  invoiceNumber?: string;
  /** True once an invoice has been generated for this batch */
  invoiced?: boolean;
};

const ORDER_DELIVERY_CONFIRMATIONS_KEY = "orderDeliveryConfirmations";
const BATCH_DELIVERY_CONFIRMATIONS_KEY = "batchDeliveryConfirmations";

export function getOrderDeliveryConfirmations(): OrderDeliveryConfirmation[] {
  return read<OrderDeliveryConfirmation[]>(ORDER_DELIVERY_CONFIRMATIONS_KEY, []);
}

export function getOrderDeliveryConfirmation(orderId: string): OrderDeliveryConfirmation | undefined {
  return getOrderDeliveryConfirmations().find(c => c.orderId === orderId);
}

export function getBatchDeliveryConfirmations(): BatchDeliveryConfirmation[] {
  return read<BatchDeliveryConfirmation[]>(BATCH_DELIVERY_CONFIRMATIONS_KEY, []);
}

export function getBatchDeliveryConfirmation(batchId: string): BatchDeliveryConfirmation | undefined {
  return getBatchDeliveryConfirmations().find(c => c.batchId === batchId);
}

export function getBatchDeliveryConfirmationsForOrder(orderId: string): BatchDeliveryConfirmation[] {
  return getBatchDeliveryConfirmations().filter(c => c.orderId === orderId);
}

/**
 * Warehouse confirms delivery per product.
 * - Saves per-product delivery lines.
 * - Advances order to "Awaiting Invoice" (warehouse must then manually generate invoice).
 * - Does NOT auto-generate invoice.
 */
export function confirmDeliveryPerProduct(confirmation: OrderDeliveryConfirmation) {
  const existing = getOrderDeliveryConfirmations().filter(c => c.orderId !== confirmation.orderId);
  write(ORDER_DELIVERY_CONFIRMATIONS_KEY, [confirmation, ...existing]);
  broadcastChange(ORDER_DELIVERY_CONFIRMATIONS_KEY);

  const now = new Date();
  const deliveredDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const deliveredTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const orders = getWorkflowOrders();
  const updated = orders.map(o =>
    o.id === confirmation.orderId
      ? { ...o, status: "Awaiting Invoice" as WorkflowLifecycleStatus, deliveredDate, deliveredTime }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  // Release driver & vehicle — delivery is complete
  releaseDispatchAssignment(confirmation.orderId);

  const isPartial = confirmation.overallStatus === "Partial Delivery";
  pushBranchNotif({
    type: "delivery",
    title: isPartial ? "Partial Delivery Confirmed" : "Delivery Confirmed",
    message: `Order ${confirmation.orderId} has been delivered to ${confirmation.branch}. Invoice will be generated shortly.`,
  });
  pushWarehouseNotif({
    type: "delivery",
    title: "Delivery Confirmed — Awaiting Invoice",
    message: `Delivery confirmed for order ${confirmation.orderId} (${confirmation.branch}). Please review and generate invoice.`,
  });
}

/**
 * Warehouse manually generates invoice after reviewing delivery.
 * Uses delivered qty from the confirmation record.
 * Advances order from "Awaiting Invoice" → "Payment Pending".
 * Branch then pays via Pay button → Payment Verification Pending → Warehouse marks received → Payment Completed → Order Closed.
 */
export function generateInvoiceFromDelivery(orderId: string): string | null {
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;
  if (order.status !== "Awaiting Invoice") return null;

  const confirmation = getOrderDeliveryConfirmation(orderId);
  // Always recalculate invoicedValue from delivered lines × current selling prices.
  // This prevents stale/incorrect values stored in confirmation.invoicedValue
  // (e.g. when getProductSellingPrice returned 0 at the time of delivery confirmation)
  // from propagating to the invoice and all downstream pages.
  const invoicedValue = confirmation
    ? Math.round(
        confirmation.lines.reduce(
          (s, l) => s + l.deliveredQty * getProductSellingPrice(l.product),
          0
        )
      )
    : order.value;
  const invoiceNumber = nextDemoInvoiceNumber();

  const updated = orders.map(o =>
    o.id === orderId
      ? {
          ...o,
          status: "Payment Pending" as WorkflowLifecycleStatus,
          invoiceNumber,
          value: invoicedValue,
        }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  pushBranchNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} has been generated for your order ${orderId}. Please proceed with payment.`,
  });
  pushWarehouseNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for order ${orderId} (${order.branch}) — ${formatCurrency(invoicedValue)}.`,
  });
  pushAdminNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for order ${orderId} — ${formatCurrency(invoicedValue)}.`,
  });

  return invoiceNumber;
}

/**
 * Generate an invoice for a single delivered batch.
 * Can be called as soon as a batch status = "Delivered", regardless of other batches.
 * Marks the batch confirmation as invoiced and advances the order to "Payment Pending"
 * (or leaves it in "Partially Delivered" if other batches are still pending).
 */
export function generateInvoiceFromBatch(batchId: string): string | null {
  const conf = getBatchDeliveryConfirmation(batchId);
  if (!conf || conf.invoiced) return null;

  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === conf.orderId);
  if (!order) return null;

  const invoicedValue = Math.round(
    conf.lines.reduce((s, l) => s + l.deliveredQty * getProductSellingPrice(l.product), 0)
  );
  const invoiceNumber = nextDemoInvoiceNumber();

  // Mark batch confirmation as invoiced
  const updatedBatchConfs = getBatchDeliveryConfirmations().map(c =>
    c.batchId === batchId ? { ...c, invoiced: true, invoiceNumber } : c
  );
  write(BATCH_DELIVERY_CONFIRMATIONS_KEY, updatedBatchConfs);
  broadcastChange(BATCH_DELIVERY_CONFIRMATIONS_KEY);

  // Check if all batch confirmations for this order are now invoiced
  const allBatchConfs = updatedBatchConfs.filter(c => c.orderId === conf.orderId);
  const allBatches = getDispatchBatchesForOrder(conf.orderId);
  const allDeliveredBatchesInvoiced = allBatches
    .filter(b => b.status === "Delivered")
    .every(b => allBatchConfs.find(c => c.batchId === b.batchId)?.invoiced);
  const allBatchesDelivered = allBatches.every(b => b.status === "Delivered");

  // Advance order: if all batches delivered and all invoiced → Payment Pending
  // If partial but this batch is invoiced → remains Partially Delivered
  let newOrderStatus: WorkflowLifecycleStatus | null = null;
  if (allBatchesDelivered && allDeliveredBatchesInvoiced) {
    newOrderStatus = "Payment Pending";
  } else if (order.status === "Awaiting Invoice" && !allBatchesDelivered) {
    // Some batches still pending — keep as Partially Delivered
    newOrderStatus = "Partially Delivered";
  }

  if (newOrderStatus) {
    const updatedOrders = orders.map(o =>
      o.id === conf.orderId
        ? { ...o, status: newOrderStatus!, invoiceNumber, value: invoicedValue }
        : o
    );
    write(WORKFLOW_ORDERS_KEY, updatedOrders);
    broadcastChange(WORKFLOW_ORDERS_KEY);
  }

  pushBranchNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} has been generated for Batch ${conf.batchNumber} of order ${conf.orderId}. Please proceed with payment.`,
  });
  pushWarehouseNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for Batch ${conf.batchNumber} of order ${conf.orderId} (${conf.branch}) — ${formatCurrency(invoicedValue)}.`,
  });
  pushAdminNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for Batch ${conf.batchNumber} of order ${conf.orderId} — ${formatCurrency(invoicedValue)}.`,
  });

  return invoiceNumber;
}

/**
 * Branch submits payment for an order.
 * Advances order from "Payment Pending" (or "Invoice Generated") → "Payment Verification Pending".
 * Order remains Delivered. Warehouse/Collections must then call markPaymentReceived() to complete.
 */
export function submitBranchPayment(orderId: string): void {
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || (order.status !== "Payment Pending" && order.status !== "Invoice Generated")) return;

  const updated = orders.map(o =>
    o.id === orderId
      ? { ...o, status: "Payment Verification Pending" as WorkflowLifecycleStatus }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  pushWarehouseNotif({
    type: "payment_received",
    title: "Payment Submitted — Verification Required",
    message: `Branch ${order.branch} has submitted payment for order ${orderId}. Please verify and mark as received.`,
  });
  pushAdminNotif({
    type: "payment_received",
    title: "Payment Verification Pending",
    message: `Order ${orderId} (${order.branch}) payment submitted — awaiting warehouse verification.`,
  });
}

/**
 * Warehouse/Collections confirms payment received.
 * Advances order from "Payment Verification Pending" → "Payment Completed", then immediately "Order Closed".
 * Payment status badge shows "Payment Completed"; order status badge shows "Order Closed".
 */
export function markPaymentReceived(orderId: string): void {
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status !== "Payment Verification Pending") return;

  // Two-step: Payment Completed → Order Closed (atomic in demo)
  const updated = orders.map(o =>
    o.id === orderId
      ? { ...o, status: "Order Closed" as WorkflowLifecycleStatus, paymentCompletedAt: new Date().toISOString() }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  if (RELEASE_STATUSES.includes("Order Closed")) {
    releaseDispatchAssignment(orderId);
  }

  pushBranchNotif({
    type: "payment_received",
    title: "Payment Confirmed",
    message: `Your payment for order ${orderId} has been verified. Order is now closed.`,
  });
  pushWarehouseNotif({
    type: "payment_received",
    title: "Payment Received",
    message: `Payment confirmed for order ${orderId} (${order.branch}). Order closed.`,
  });
  pushAdminNotif({
    type: "payment_received",
    title: "Payment Completed",
    message: `Order ${orderId} (${order.branch}) payment verified and closed.`,
  });
}

// ── Delivery Exceptions ────────────────────────────────────────────────────────
// Stores per-order delivery exception records (exception items per product).

export function getDeliveryExceptions(): DeliveryExceptionRecord[] {
  return read<DeliveryExceptionRecord[]>(KEYS.DELIVERY_EXCEPTIONS, []);
}

export function saveDeliveryException(record: DeliveryExceptionRecord) {
  const existing = getDeliveryExceptions().filter(r => r.orderId !== record.orderId);
  write(KEYS.DELIVERY_EXCEPTIONS, [record, ...existing]);
  broadcastChange(KEYS.DELIVERY_EXCEPTIONS);
}

export function getDeliveryException(orderId: string): DeliveryExceptionRecord | undefined {
  return getDeliveryExceptions().find(r => r.orderId === orderId);
}

/**
 * Confirm delivery for an order — saves exception record, records delivered
 * date/time, calculates invoice amount from received quantities, and advances
 * order status to "Awaiting Invoice" so warehouse can review and generate invoice.
 *
 * NOTE: Does NOT auto-generate an invoice. The warehouse must click
 * "Generate Invoice" in the Invoice Generation page to proceed.
 * Delivery difference reports are preserved separately for warehouse resolution.
 */
export function confirmDelivery(record: DeliveryExceptionRecord) {
  saveDeliveryException(record);

  const now = new Date();
  const deliveredDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const deliveredTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  // 1. Also save as an OrderDeliveryConfirmation so Invoice Generation page
  //    can display delivery lines and billable amount.
  const lines: ProductDeliveryLine[] = record.items.map(item => {
    const deliveredQty = item.receivedQty;
    const loadedQty = item.loadedQty;
    const pendingQty = Math.max(0, loadedQty - deliveredQty);
    const status: ProductDeliveryStatus =
      deliveredQty >= loadedQty ? "Delivered"
      : deliveredQty === 0 ? "Not Delivered"
      : "Partial Delivery";
    return {
      product: item.product,
      unit: item.unit,
      orderedQty: item.orderedQty,
      loadedQty,
      deliveredQty,
      pendingQty,
      status,
      reason: item.exceptionReason || "",
    };
  });
  const invoicedValue = Math.round(
    lines.reduce((s, l) => s + l.deliveredQty * getProductSellingPrice(l.product), 0)
  );
  const allDelivered = lines.every(l => l.status === "Delivered");
  const noneDelivered = lines.every(l => l.status === "Not Delivered");
  const overallStatus: ProductDeliveryStatus | "Delivered Successfully" =
    allDelivered ? "Delivered Successfully"
    : noneDelivered ? "Not Delivered"
    : "Partial Delivery";

  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === record.orderId);
  const branch = order?.branch ?? record.branch;

  const confirmation: OrderDeliveryConfirmation = {
    orderId: record.orderId,
    branch,
    confirmedAt: `${deliveredDate}, ${deliveredTime}`,
    lines,
    invoicedValue,
    overallStatus,
  };
  const existingConfs = getOrderDeliveryConfirmations().filter(c => c.orderId !== record.orderId);
  write(ORDER_DELIVERY_CONFIRMATIONS_KEY, [confirmation, ...existingConfs]);
  broadcastChange(ORDER_DELIVERY_CONFIRMATIONS_KEY);

  // 2. Advance order to "Awaiting Invoice" (NOT Payment Pending — warehouse must generate invoice first).
  const updated = orders.map(o =>
    o.id === record.orderId
      ? {
          ...o,
          status: "Awaiting Invoice" as WorkflowLifecycleStatus,
          value: invoicedValue,
          deliveredDate,
          deliveredTime,
        }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updated);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  // 3. Release driver & vehicle
  releaseDispatchAssignment(record.orderId);

  const isPartial = record.deliveryStatus === "Partial Delivery";
  pushBranchNotif({
    type: "delivery",
    title: isPartial ? "Partial Delivery Confirmed" : "Delivery Confirmed",
    message: `Order ${record.orderId} delivered to ${branch}. Invoice will be generated shortly.`,
  });
  pushWarehouseNotif({
    type: "delivery",
    title: "Delivery Confirmed — Awaiting Invoice",
    message: `Delivery confirmed for order ${record.orderId} (${branch}). Please review and generate invoice.`,
  });
}

// ── Tray Management ───────────────────────────────────────────────────────────
// Quantity-based tracking only. No unique IDs, no QR codes.
// All tray state is derived from dispatches and returns.

export type TrayReturnStatus = "Received" | "Ready for Return" | "Returned" | "Partial Return" | "Inspection Required";

export type TrayDispatch = {
  id: string;
  orderId: string;
  branch: string;
  date: string;
  traysSent: number;
};

export type TrayReturn = {
  id: string;
  dispatchId: string;
  orderId: string;
  branch: string;
  date: string;
  traysReceived: number;  // trays that went to branch
  traysReturned: number;  // trays physically returned
  damaged: number;
  missing: number;
  status: TrayReturnStatus;
};

/** Initial seed data so the UI is populated on first load */
const SEED_TRAY_DISPATCHES: TrayDispatch[] = [
  { id: "TD-001", orderId: "ORD-2026-001", branch: "Gandhi Nagar",   date: "Jun 20, 2026", traysSent: 12 },
  { id: "TD-002", orderId: "ORD-2026-002", branch: "Gayatri Nagar",  date: "Jun 20, 2026", traysSent: 8  },
  { id: "TD-003", orderId: "ORD-2026-003", branch: "Ayyappa Nagar",  date: "Jun 21, 2026", traysSent: 10 },
  { id: "TD-004", orderId: "ORD-2026-004", branch: "Patamata",       date: "Jun 21, 2026", traysSent: 15 },
  { id: "TD-005", orderId: "ORD-2026-005", branch: "Gannavaram",     date: "Jun 21, 2026", traysSent: 6  },
  { id: "TD-006", orderId: "ORD-2026-006", branch: "Machavaram",     date: "Jun 22, 2026", traysSent: 9  },
  { id: "TD-007", orderId: "ORD-2026-007", branch: "Gunadala",       date: "Jun 22, 2026", traysSent: 11 },
  { id: "TD-008", orderId: "ORD-2026-008", branch: "Governorpet",    date: "Jun 23, 2026", traysSent: 7  },
  { id: "TD-009", orderId: "ORD-2026-009", branch: "Kanuru",         date: "Jun 23, 2026", traysSent: 14 },
  { id: "TD-010", orderId: "ORD-2026-010", branch: "Poranki",        date: "Jun 24, 2026", traysSent: 5  },
  { id: "TD-011", orderId: "ORD-2026-018", branch: "Gandhi Nagar",   date: "Jun 22, 2026", traysSent: 10 },
  { id: "TD-012", orderId: "ORD-2026-021", branch: "Gandhi Nagar",   date: "Jun 24, 2026", traysSent: 15 },
  // Additional Gandhi Nagar records
  { id: "TD-013", orderId: "ORD-2026-025", branch: "Gandhi Nagar",   date: "Jun 23, 2026", traysSent: 9  },
  { id: "TD-014", orderId: "ORD-2026-028", branch: "Gandhi Nagar",   date: "Jun 23, 2026", traysSent: 11 },
  { id: "TD-015", orderId: "ORD-2026-031", branch: "Gandhi Nagar",   date: "Jun 24, 2026", traysSent: 8  },
  { id: "TD-016", orderId: "ORD-2026-033", branch: "Gandhi Nagar",   date: "Jun 25, 2026", traysSent: 14 },
  { id: "TD-017", orderId: "ORD-2026-036", branch: "Gandhi Nagar",   date: "Jun 25, 2026", traysSent: 12 },
];

const SEED_TRAY_RETURNS: TrayReturn[] = [
  { id: "TR-001", dispatchId: "TD-001", orderId: "ORD-2026-001", branch: "Gandhi Nagar",  date: "Jun 22, 2026", traysReceived: 12, traysReturned: 12, damaged: 0, missing: 0, status: "Returned"             },
  { id: "TR-002", dispatchId: "TD-002", orderId: "ORD-2026-002", branch: "Gayatri Nagar", date: "Jun 22, 2026", traysReceived: 8,  traysReturned: 7,  damaged: 1, missing: 0, status: "Returned"             },
  { id: "TR-003", dispatchId: "TD-003", orderId: "ORD-2026-003", branch: "Ayyappa Nagar", date: "Jun 23, 2026", traysReceived: 10, traysReturned: 0,  damaged: 0, missing: 0, status: "Ready for Return"     },
  { id: "TR-004", dispatchId: "TD-004", orderId: "ORD-2026-004", branch: "Patamata",      date: "Jun 23, 2026", traysReceived: 15, traysReturned: 0,  damaged: 0, missing: 0, status: "Received"             },
  { id: "TR-011", dispatchId: "TD-011", orderId: "ORD-2026-018", branch: "Gandhi Nagar",  date: "Jun 22, 2026", traysReceived: 10, traysReturned: 8,  damaged: 0, missing: 0, status: "Partial Return"       },
  { id: "TR-012", dispatchId: "TD-012", orderId: "ORD-2026-021", branch: "Gandhi Nagar",  date: "Jun 24, 2026", traysReceived: 15, traysReturned: 13, damaged: 1, missing: 1, status: "Inspection Required"  },
  // Additional Gandhi Nagar records
  { id: "TR-013", dispatchId: "TD-013", orderId: "ORD-2026-025", branch: "Gandhi Nagar",  date: "Jun 25, 2026", traysReceived: 9,  traysReturned: 9,  damaged: 0, missing: 0, status: "Returned"             },
  { id: "TR-014", dispatchId: "TD-014", orderId: "ORD-2026-028", branch: "Gandhi Nagar",  date: "Jun 25, 2026", traysReceived: 11, traysReturned: 11, damaged: 0, missing: 0, status: "Returned"             },
  { id: "TR-015", dispatchId: "TD-015", orderId: "ORD-2026-031", branch: "Gandhi Nagar",  date: "Jun 25, 2026", traysReceived: 8,  traysReturned: 5,  damaged: 0, missing: 0, status: "Partial Return"       },
  { id: "TR-016", dispatchId: "TD-016", orderId: "ORD-2026-033", branch: "Gandhi Nagar",  date: "Jun 26, 2026", traysReceived: 14, traysReturned: 11, damaged: 2, missing: 1, status: "Inspection Required"  },
  { id: "TR-017", dispatchId: "TD-017", orderId: "ORD-2026-036", branch: "Gandhi Nagar",  date: "Jun 26, 2026", traysReceived: 12, traysReturned: 9,  damaged: 0, missing: 0, status: "Partial Return"       },
];

/** Total trays company owns (editable via warehouse page) */
const DEFAULT_TOTAL_TRAYS = 200;

export type TrayConfig = {
  totalTrays: number;
};

export function getTrayConfig(): TrayConfig {
  return read<TrayConfig>(KEYS.TRAY_CONFIG, { totalTrays: DEFAULT_TOTAL_TRAYS });
}

export function setTrayConfig(cfg: TrayConfig) {
  write(KEYS.TRAY_CONFIG, cfg);
  broadcastChange(KEYS.TRAY_CONFIG);
}

function ensureTraySeedVersion() {
  const current = localStorage.getItem(KEYS.TRAY_SEED_VERSION);
  if (current !== TRAY_SEED_VERSION) {
    localStorage.removeItem(KEYS.TRAY_DISPATCHES);
    localStorage.removeItem(KEYS.TRAY_RETURNS);
    localStorage.setItem(KEYS.TRAY_SEED_VERSION, TRAY_SEED_VERSION);
  }
}

export function getTrayDispatches(): TrayDispatch[] {
  ensureTraySeedVersion();
  const stored = read<TrayDispatch[] | null>(KEYS.TRAY_DISPATCHES, null);
  if (!stored) {
    write(KEYS.TRAY_DISPATCHES, SEED_TRAY_DISPATCHES);
    return SEED_TRAY_DISPATCHES;
  }
  return stored;
}

export function saveTrayDispatch(dispatch: TrayDispatch) {
  const existing = getTrayDispatches().filter(d => d.id !== dispatch.id);
  write(KEYS.TRAY_DISPATCHES, [dispatch, ...existing]);
  broadcastChange(KEYS.TRAY_DISPATCHES);
}

export function getTrayReturns(): TrayReturn[] {
  ensureTraySeedVersion();
  const stored = read<TrayReturn[] | null>(KEYS.TRAY_RETURNS, null);
  if (!stored) {
    write(KEYS.TRAY_RETURNS, SEED_TRAY_RETURNS);
    return SEED_TRAY_RETURNS;
  }
  return stored;
}

export function saveTrayReturn(ret: TrayReturn) {
  const existing = getTrayReturns().filter(r => r.id !== ret.id);
  write(KEYS.TRAY_RETURNS, [ret, ...existing]);
  broadcastChange(KEYS.TRAY_RETURNS);
}

/**
 * Record a return from the warehouse side.
 * Creates or updates the TrayReturn for a given dispatch.
 */
export function recordTrayReturn(
  dispatchId: string,
  traysReturned: number,
  damaged: number,
  missing: number
) {
  const dispatches = getTrayDispatches();
  const dispatch = dispatches.find(d => d.id === dispatchId);
  if (!dispatch) return;
  const existing = getTrayReturns().find(r => r.dispatchId === dispatchId);
  const ret: TrayReturn = existing
    ? { ...existing, traysReturned, damaged, missing, status: "Returned" as TrayReturnStatus, date: todayStr() }
    : {
        id: `TR-${Date.now()}`,
        dispatchId,
        orderId: dispatch.orderId,
        branch: dispatch.branch,
        date: todayStr(),
        traysReceived: dispatch.traysSent,
        traysReturned,
        damaged,
        missing,
        status: "Returned" as TrayReturnStatus,
      };
  saveTrayReturn(ret);
  pushBranchNotifTray(dispatch.branch, dispatch.orderId, traysReturned);
}

function pushBranchNotifTray(branch: string, orderId: string, traysReturned: number) {
  const all = read<DemoNotif[]>(KEYS.BRANCH_NOTIFS, []);
  all.unshift({
    id: `bn-tray-${Date.now()}`,
    type: "delivery",
    title: "Tray Return Confirmed",
    message: `${traysReturned} tray(s) returned from ${branch} for order ${orderId} have been confirmed by warehouse.`,
    timestamp: nowStr(),
    read: false,
  });
  write(KEYS.BRANCH_NOTIFS, all);
}

/**
 * Derived tray summary used by all three portals.
 */
export type TraySummary = {
  totalTrays: number;
  availableTrays: number;
  traysAtBranches: number;
  pendingReturns: number;
  damagedTrays: number;
};

export function getTraySummary(): TraySummary {
  const { totalTrays } = getTrayConfig();
  const dispatches = getTrayDispatches();
  const returns = getTrayReturns();

  // Sum all trays sent
  const totalSent = dispatches.reduce((s, d) => s + d.traysSent, 0);

  // Sum all trays returned (regardless of status)
  const totalReturned = returns.reduce((s, r) => s + r.traysReturned, 0);

  // Damaged from all returns
  const damagedTrays = returns.reduce((s, r) => s + r.damaged, 0);

  // Trays currently at branches = sent - returned (not yet back)
  const traysAtBranches = totalSent - totalReturned;

  // Pending returns = trays at branches that haven't been returned yet
  // (dispatches that have no "Returned" status return)
  const pendingReturns = dispatches.reduce((s, d) => {
    const ret = returns.find(r => r.dispatchId === d.id);
    if (!ret || ret.status !== "Returned") return s + d.traysSent;
    return s;
  }, 0);

  // Available = total - at branches - damaged
  const availableTrays = Math.max(0, totalTrays - traysAtBranches - damagedTrays);

  return { totalTrays, availableTrays, traysAtBranches, pendingReturns, damagedTrays };
}

/**
 * Branch-wise tray ledger: opening balance + sent - returned = current at branch.
 */
export type BranchTrayLedger = {
  branch: string;
  traysSent: number;
  traysReturned: number;
  damaged: number;
  missing: number;
  currentAtBranch: number;
  pendingReturn: number;
};

export function getBranchTrayLedger(): BranchTrayLedger[] {
  const dispatches = getTrayDispatches();
  const returns = getTrayReturns();

  // Group by branch
  const branchMap: Record<string, BranchTrayLedger> = {};

  for (const d of dispatches) {
    if (!branchMap[d.branch]) {
      branchMap[d.branch] = { branch: d.branch, traysSent: 0, traysReturned: 0, damaged: 0, missing: 0, currentAtBranch: 0, pendingReturn: 0 };
    }
    branchMap[d.branch].traysSent += d.traysSent;
  }

  for (const r of returns) {
    if (!branchMap[r.branch]) {
      branchMap[r.branch] = { branch: r.branch, traysSent: 0, traysReturned: 0, damaged: 0, missing: 0, currentAtBranch: 0, pendingReturn: 0 };
    }
    branchMap[r.branch].traysReturned += r.traysReturned;
    branchMap[r.branch].damaged += r.damaged;
    branchMap[r.branch].missing += r.missing;
  }

  return Object.values(branchMap).map(b => ({
    ...b,
    currentAtBranch: Math.max(0, b.traysSent - b.traysReturned),
    pendingReturn: Math.max(0, b.traysSent - b.traysReturned),
  }));
}

// ── Centralized Business Logic Helpers ───────────────────────────────────────
// ALL calculations live here. Pages must only call these — never compute totals
// or business rules inline.
// =============================================================================

// ── Batch Product Accessors ───────────────────────────────────────────────────

/**
 * Returns all DispatchBatchProduct lines for a given batch.
 * These are the loaded/dispatched quantities — the source of truth for what
 * left the warehouse.
 */
export function getBatchProducts(batchId: string): DispatchBatchProduct[] {
  const batch = getDispatchBatches().find(b => b.batchId === batchId);
  return batch?.products ?? [];
}

/**
 * Returns the confirmed delivery lines for a batch (filled after confirmBatchDelivery).
 * These record actual delivered quantities and reasons for any pending qty.
 */
export function getBatchDeliveryLines(batchId: string): ProductDeliveryLine[] {
  const batch = getDispatchBatches().find(b => b.batchId === batchId);
  return batch?.deliveryLines ?? [];
}

// ── Order-Level Delivery Helpers ──────────────────────────────────────────────

/**
 * Returns the aggregated delivery lines for an order (across all confirmed batches).
 * This is the canonical source for what was actually delivered.
 */
export function getDeliveredProducts(orderId: string): ProductDeliveryLine[] {
  const conf = getOrderDeliveryConfirmation(orderId);
  return conf?.lines ?? [];
}

/**
 * Returns items that still have pendingQty > 0 after delivery confirmation.
 * These are NOT billed on the invoice.
 */
export function getRemainingProducts(orderId: string): ProductDeliveryLine[] {
  return getDeliveredProducts(orderId).filter(l => l.pendingQty > 0);
}

// ── Invoice Calculation Helpers ───────────────────────────────────────────────

/**
 * Returns per-product invoice lines for an order:
 *   { product, unit, deliveredQty, unitPrice, lineTotal }
 *
 * Always derived from confirmed delivery lines × current selling prices.
 * Falls back to approved order items if no delivery confirmation exists
 * (e.g. demo/mock orders).
 */
export function getInvoiceLines(orderId: string): Array<{
  product: string;
  unit: string;
  deliveredQty: number;
  unitPrice: number;
  lineTotal: number;
}> {
  // Prefer order-level confirmation (set when ALL batches are delivered)
  const conf = getOrderDeliveryConfirmation(orderId);
  if (conf && conf.lines.length > 0) {
    return conf.lines.map(l => {
      const unitPrice = getProductSellingPrice(l.product);
      return {
        product: l.product,
        unit: l.unit,
        deliveredQty: l.deliveredQty,
        unitPrice,
        lineTotal: Math.round(l.deliveredQty * unitPrice),
      };
    });
  }

  // If some batches are delivered but not all, aggregate delivered batch lines
  const deliveredBatchConfs = getBatchDeliveryConfirmationsForOrder(orderId);
  if (deliveredBatchConfs.length > 0) {
    const lineMap: Record<string, { product: string; unit: string; deliveredQty: number; unitPrice: number; lineTotal: number }> = {};
    for (const bc of deliveredBatchConfs) {
      for (const l of bc.lines) {
        const unitPrice = getProductSellingPrice(l.product);
        const lineTotal = Math.round(l.deliveredQty * unitPrice);
        if (lineMap[l.product]) {
          lineMap[l.product].deliveredQty += l.deliveredQty;
          lineMap[l.product].lineTotal += lineTotal;
        } else {
          lineMap[l.product] = { product: l.product, unit: l.unit, deliveredQty: l.deliveredQty, unitPrice, lineTotal };
        }
      }
    }
    const lines = Object.values(lineMap);
    if (lines.length > 0) return lines;
  }

  // Fallback: use order's approved quantities
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    return order.items.map(i => {
      const deliveredQty = i.approvedQty > 0 ? i.approvedQty : i.orderedQty;
      const unitPrice = getProductSellingPrice(i.product);
      return {
        product: i.product,
        unit: i.unit,
        deliveredQty,
        unitPrice,
        lineTotal: Math.round(deliveredQty * unitPrice),
      };
    });
  }

  return [];
}

/**
 * Returns per-product invoice lines for a single delivered batch.
 */
export function getBatchInvoiceLines(batchId: string): Array<{
  product: string;
  unit: string;
  deliveredQty: number;
  unitPrice: number;
  lineTotal: number;
}> {
  const conf = getBatchDeliveryConfirmation(batchId);
  if (!conf || conf.lines.length === 0) return [];
  return conf.lines.map(l => {
    const unitPrice = getProductSellingPrice(l.product);
    return {
      product: l.product,
      unit: l.unit,
      deliveredQty: l.deliveredQty,
      unitPrice,
      lineTotal: Math.round(l.deliveredQty * unitPrice),
    };
  });
}

/**
 * Returns the invoice subtotal (before tax) for a single delivered batch.
 */
export function getBatchInvoiceSubtotal(batchId: string): number {
  const lines = getBatchInvoiceLines(batchId);
  return Math.round(lines.reduce((s, l) => s + l.lineTotal, 0));
}

/**
 * Returns the invoice amount including 5% GST for a single delivered batch.
 */
export function getBatchInvoiceAmount(batchId: string): number {
  return Math.round(getBatchInvoiceSubtotal(batchId) * 1.05);
}

/**
 * Returns the invoice subtotal (before tax) for an order.
 * Always computed from confirmed delivery lines × current selling prices.
 * Falls back to order.value if no delivery confirmation exists.
 */
export function getInvoiceSubtotal(orderId: string): number {
  const lines = getInvoiceLines(orderId);
  if (lines.length > 0) {
    return Math.round(lines.reduce((s, l) => s + l.lineTotal, 0));
  }
  const order = getWorkflowOrders().find(o => o.id === orderId);
  return order?.value ?? 0;
}

/**
 * Returns the invoice amount including 5% GST for an order.
 * This is the single canonical "billable amount" used everywhere.
 */
export function getInvoiceAmount(orderId: string): number {
  const subtotal = getInvoiceSubtotal(orderId);
  return Math.round(subtotal * 1.05);
}

// ── Payment / Collections Helpers ─────────────────────────────────────────────

/**
 * Returns the outstanding (unpaid) amount for an order.
 * 0 if the order is Payment Completed or Order Closed.
 */
export function getOutstandingAmount(orderId: string): number {
  const order = getWorkflowOrders().find(o => o.id === orderId);
  if (!order) return 0;
  const paid =
    order.status === "Payment Completed" ||
    order.status === "Order Closed";
  return paid ? 0 : getInvoiceAmount(orderId);
}

/**
 * Returns a summary of collections for a list of orders:
 *   { outstanding, collected, pendingCount, verificationCount, closedCount }
 *
 * Intended for warehouse Collections page KPI cards.
 */
export function getCollections(orders: WorkflowOrderLive[]): {
  outstanding: number;
  collected: number;
  pendingCount: number;
  verificationCount: number;
  closedCount: number;
} {
  let outstanding = 0;
  let collected = 0;
  let pendingCount = 0;
  let verificationCount = 0;
  let closedCount = 0;

  for (const o of orders) {
    const amt = getInvoiceAmount(o.id);
    if (o.status === "Payment Completed" || o.status === "Order Closed") {
      collected += amt;
    } else {
      outstanding += amt;
    }
    if (o.status === "Payment Pending") pendingCount++;
    if (o.status === "Payment Verification Pending") verificationCount++;
    if (o.status === "Order Closed") closedCount++;
  }

  return { outstanding, collected, pendingCount, verificationCount, closedCount };
}

/**
 * Returns totals for the branch Payment Status page:
 *   { totalValue, totalOutstanding, totalPaid }
 */
export function getBranchPayment(orders: WorkflowOrderLive[]): {
  totalValue: number;
  totalOutstanding: number;
  totalPaid: number;
} {
  let totalValue = 0;
  let totalOutstanding = 0;
  let totalPaid = 0;

  for (const o of orders) {
    const amt = getInvoiceAmount(o.id);
    totalValue += amt;
    if (o.status === "Order Closed" || o.status === "Payment Completed") {
      totalPaid += amt;
    } else {
      totalOutstanding += amt;
    }
  }

  return { totalValue, totalOutstanding, totalPaid };
}

// ── Payment Status Derivation ─────────────────────────────────────────────────

/**
 * Maps a lifecycle status to a user-facing payment status string.
 * Used by Collections and Payment Status pages.
 */
export function derivePaymentStatusLabel(status: WorkflowLifecycleStatus): string {
  if (status === "Order Closed" || status === "Payment Completed") return "Payment Completed";
  if (status === "Payment Verification Pending") return "Payment Verification Pending";
  return "Payment Pending";
}

/**
 * Maps a lifecycle status to a user-facing order status string.
 * Used by Collections page.
 */
export function deriveOrderStatusLabel(status: WorkflowLifecycleStatus): string {
  if (status === "Order Closed") return "Order Closed";
  return "Delivered";
}

// ── Product Delivery Status Derivation ───────────────────────────────────────

/**
 * Derives whether a product line was fully/partially/not delivered.
 * Used internally and by delivery-tracking page.
 */
export function deriveProductDeliveryStatus(
  loadedQty: number,
  deliveredQty: number
): ProductDeliveryStatus {
  if (deliveredQty >= loadedQty) return "Delivered";
  if (deliveredQty === 0) return "Not Delivered";
  return "Partial Delivery";
}

// ── Workflow Query Helpers (Single Source of Truth) ───────────────────────────
// These are the canonical helpers all pages must use.
// Never inspect raw order/batch/confirmation data inside page components.

/**
 * Returns the current status of a single dispatch batch.
 */
export function getBatchStatus(batchId: string): DispatchBatch["status"] | null {
  const batch = getDispatchBatches().find(b => b.batchId === batchId);
  return batch?.status ?? null;
}

/**
 * Returns the current lifecycle status of an order.
 * Always derived from the store — never stored independently in pages.
 */
export function getOrderStatus(orderId: string): WorkflowLifecycleStatus | null {
  const order = getWorkflowOrders().find(o => o.id === orderId);
  return (order?.status as WorkflowLifecycleStatus) ?? null;
}



/**
 * Returns all dispatch batches that have been delivered (status === "Delivered")
 * but whose order has NOT yet been fully confirmed at the order level.
 * These batches are eligible for delivery confirmation review.
 */
export function getBatchesReadyForDelivery(): DispatchBatch[] {
  return getDispatchBatches().filter(b => b.status === "In Transit");
}

/**
 * Returns all BatchDeliveryConfirmations that have not yet been invoiced.
 * @deprecated Use getOrdersReadyForInvoice() instead — invoice generation is order-wise.
 */
export function getBatchesReadyForInvoice(): BatchDeliveryConfirmation[] {
  const orders = getWorkflowOrders();
  const allConfs = getBatchDeliveryConfirmations();
  const invoiceableStatuses: WorkflowLifecycleStatus[] = ["Awaiting Invoice", "Partially Delivered"];
  return allConfs.filter(conf => {
    if (conf.invoiced) return false;
    const order = orders.find(o => o.id === conf.orderId);
    if (!order) return false;
    return invoiceableStatuses.includes(order.status as WorkflowLifecycleStatus);
  });
}

/** Represents an order whose ALL dispatch batches have been delivered and no invoice has been generated yet. */
export type OrderReadyForInvoice = {
  orderId: string;
  branch: string;
  /** Date/time of the last batch delivery confirmation */
  lastDeliveredAt: string;
  /** Combined invoice lines from all batches */
  lines: Array<{ product: string; unit: string; deliveredQty: number; unitPrice: number; lineTotal: number }>;
  /** Subtotal before tax */
  subtotal: number;
  /** Total including 5% GST */
  total: number;
  /** How many batches were part of this order */
  batchCount: number;
};

/**
 * Returns orders where ALL dispatch batches have been delivered and
 * no invoice has been generated yet (order status = "Awaiting Invoice").
 * Invoice Generation page renders exactly this list — no inline derivation needed.
 */
export function getOrdersReadyForInvoice(): OrderReadyForInvoice[] {
  const orders = getWorkflowOrders();
  const allBatches = getDispatchBatches();
  const allBatchConfs = getBatchDeliveryConfirmations();

  const result: OrderReadyForInvoice[] = [];

  for (const order of orders) {
    if ((order.status as WorkflowLifecycleStatus) !== "Awaiting Invoice") continue;
    // Must not already have an invoice number on the order
    if (order.invoiceNumber) continue;

    const orderBatches = allBatches.filter(b => b.orderId === order.id);
    if (orderBatches.length === 0) continue;

    // All batches must be Delivered
    if (!orderBatches.every(b => b.status === "Delivered")) continue;

    // None of the batch confirmations for this order should be invoiced
    const batchConfsForOrder = allBatchConfs.filter(c => c.orderId === order.id);
    if (batchConfsForOrder.some(c => c.invoiced)) continue;

    // Aggregate invoice lines across all batches
    const lineMap: Record<string, { product: string; unit: string; deliveredQty: number; unitPrice: number; lineTotal: number }> = {};
    let lastDeliveredAt = "";

    for (const bc of batchConfsForOrder) {
      if (!lastDeliveredAt || bc.confirmedAt > lastDeliveredAt) lastDeliveredAt = bc.confirmedAt;
      for (const l of bc.lines) {
        const unitPrice = getProductSellingPrice(l.product);
        const lineTotal = Math.round(l.deliveredQty * unitPrice);
        if (lineMap[l.product]) {
          lineMap[l.product].deliveredQty += l.deliveredQty;
          lineMap[l.product].lineTotal += lineTotal;
        } else {
          lineMap[l.product] = { product: l.product, unit: l.unit, deliveredQty: l.deliveredQty, unitPrice, lineTotal };
        }
      }
    }

    const lines = Object.values(lineMap);
    const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0));
    const total = Math.round(subtotal * 1.05);

    result.push({
      orderId: order.id,
      branch: order.branch,
      lastDeliveredAt: lastDeliveredAt || order.date,
      lines,
      subtotal,
      total,
      batchCount: orderBatches.length,
    });
  }

  return result;
}

/**
 * Generate a single invoice for a complete order once all batches are delivered.
 * Marks all batch confirmations for the order as invoiced, advances order to "Payment Pending".
 * Returns the generated invoice number, or null if not eligible.
 */
export function generateInvoiceForOrder(orderId: string): string | null {
  const orders = getWorkflowOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || (order.status as WorkflowLifecycleStatus) !== "Awaiting Invoice") return null;
  if (order.invoiceNumber) return null; // already invoiced

  const allBatches = getDispatchBatches().filter(b => b.orderId === orderId);
  if (allBatches.length === 0) return null;
  if (!allBatches.every(b => b.status === "Delivered")) return null;

  // Aggregate invoice value across all batch confirmations
  const batchConfs = getBatchDeliveryConfirmations().filter(c => c.orderId === orderId);
  const invoicedValue = Math.round(
    batchConfs.reduce((sum, conf) =>
      sum + conf.lines.reduce((s, l) => s + l.deliveredQty * getProductSellingPrice(l.product), 0),
    0) * 1.05
  );

  const invoiceNumber = nextDemoInvoiceNumber();

  // Mark all batch confirmations for this order as invoiced
  const allBatchConfs = getBatchDeliveryConfirmations();
  const updatedBatchConfs = allBatchConfs.map(c =>
    c.orderId === orderId ? { ...c, invoiced: true, invoiceNumber } : c
  );
  write(BATCH_DELIVERY_CONFIRMATIONS_KEY, updatedBatchConfs);
  broadcastChange(BATCH_DELIVERY_CONFIRMATIONS_KEY);

  // Advance order to Payment Pending
  const updatedOrders = orders.map(o =>
    o.id === orderId
      ? { ...o, status: "Payment Pending" as WorkflowLifecycleStatus, invoiceNumber, value: invoicedValue }
      : o
  );
  write(WORKFLOW_ORDERS_KEY, updatedOrders);
  broadcastChange(WORKFLOW_ORDERS_KEY);

  pushBranchNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} has been generated for your order ${orderId}. Please proceed with payment.`,
  });
  pushWarehouseNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for order ${orderId} (${order.branch}) — ${formatCurrency(invoicedValue)}.`,
  });
  pushAdminNotif({
    type: "invoice_generated",
    title: "Invoice Generated",
    message: `Invoice ${invoiceNumber} generated for order ${orderId} — ${formatCurrency(invoicedValue)}.`,
  });

  return invoiceNumber;
}

// ── Invoice Object ─────────────────────────────────────────────────────────────

export type InvoiceRecord = {
  invoiceNumber: string;
  orderId: string;
  branch: string;
  batchId: string;
  batchNumber: number;
  deliveredDate: string;
  amount: number;
  orderStatus: WorkflowLifecycleStatus;
  /** Number of dispatch batches that made up this order (informational) */
  batchCount?: number;
};

/**
 * Returns all generated invoices as InvoiceRecord objects — one record per order.
 * Invoice generation is order-wise: a single invoice covers all batches of an order.
 * Collections, Payment Status, and My Orders pages read from this — never from raw confirmations.
 */
export function getInvoices(): InvoiceRecord[] {
  const orders = getWorkflowOrders();
  const allConfs = getBatchDeliveryConfirmations();
  const seen = new Set<string>();
  const result: InvoiceRecord[] = [];

  const INVOICED_STATUSES: WorkflowLifecycleStatus[] = [
    "Invoice Generated", "Payment Pending", "Payment Verification Pending",
    "Payment Completed", "Order Closed",
  ];

  for (const order of orders) {
    if (!order.invoiceNumber) continue;
    if (!INVOICED_STATUSES.includes(order.status as WorkflowLifecycleStatus)) continue;
    if (seen.has(order.invoiceNumber)) continue;
    seen.add(order.invoiceNumber);

    // Aggregate delivery lines from all batch confirmations for this order
    const batchConfsForOrder = allConfs.filter(c => c.orderId === order.id);
    const deliveredDate = order.deliveredDate ?? order.date;

    result.push({
      invoiceNumber: order.invoiceNumber,
      orderId: order.id,
      branch: order.branch,
      batchId: "",       // order-level invoice — no single batchId
      batchNumber: 0,    // 0 = full order
      deliveredDate,
      amount: getInvoiceAmount(order.id),
      orderStatus: order.status as WorkflowLifecycleStatus,
      batchCount: batchConfsForOrder.length,
    });
  }

  return result.sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
}

/**
 * Returns the InvoiceRecord for a specific batch, or null if not yet invoiced.
 */
export function getInvoice(batchId: string): InvoiceRecord | null {
  return getInvoices().find(inv => inv.batchId === batchId) ?? null;
}

/**
 * Returns a summary of the order's delivery confirmation for branch-facing views.
 * Pages must use this instead of calling getOrderDeliveryConfirmation directly.
 */
export function getOrderDeliveryStatus(orderId: string): {
  overallStatus: string;
  deliveryRemark: string | null;
  confirmedAt: string | null;
  hasPendingItems: boolean;
  pendingLines: Array<{ product: string; unit: string; pendingQty: number; reason: string }>;
} {
  const conf = getOrderDeliveryConfirmation(orderId);
  if (!conf) {
    return {
      overallStatus: "Not Confirmed",
      deliveryRemark: null,
      confirmedAt: null,
      hasPendingItems: false,
      pendingLines: [],
    };
  }
  const deliveryRemark = conf.lines.find(l => l.reason)?.reason ?? null;
  const pendingLines = conf.lines
    .filter(l => l.pendingQty > 0)
    .map(l => ({ product: l.product, unit: l.unit, pendingQty: l.pendingQty, reason: l.reason ?? "" }));
  return {
    overallStatus: conf.overallStatus,
    deliveryRemark,
    confirmedAt: conf.confirmedAt,
    hasPendingItems: pendingLines.length > 0,
    pendingLines,
  };
}

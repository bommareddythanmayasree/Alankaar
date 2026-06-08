/**
 * WarehouseContext — Single source of truth for:
 * - Products (StockItems) with image, performedBy
 * - Stock Logs (auto-created on CRUD + order approval)
 * - Audit Trail
 * - Order Verification (partial fulfillment + stock deduction)
 * - Invoices (auto-created on order approval)
 * - Notifications (warehouse + branch cross-context)
 */

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  WAREHOUSE_STOCK_ITEMS,
  WAREHOUSE_STOCK_LOGS,
  WAREHOUSE_ORDER_VERIFICATION,
  type StockCategory,
} from "../../shared/data/warehouse-mock-data";
import { getProductImage } from "../../shared/utils/product-images";
import type { AppNotification } from "../../shared/data/notifications-mock";
import { useEffect } from "react";
import {
  getLiveStock,
  setProductStock,
  addDemoStockLog,
  createLowStockAlert,
  LOW_STOCK_THRESHOLD,
  savePendingProduct,
  getApprovedPendingProducts,
  getPendingProducts,
  getProductApprovalMap,
  setProductApprovalStatus,
} from "../../shared/lib/demo-store";
// ── Types ─────────────────────────────────────────────────────────────────────

export type StockStatus = "Active" | "Inactive";

export type StockItem = {
  id: string;
  productName: string;
  category: StockCategory;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  status: StockStatus;
  batchNumber: string;
  expiryDate: string;
  performedBy: string;
  image: string;
  /** Approval status for new products added by warehouse */
  approvalStatus?: "Pending" | "Approved" | "Rejected";
};

export type LogAction =
  | "Stock In"
  | "Stock Out"
  | "Stock Adjustment"
  | "Product Created"
  | "Product Updated"
  | "Product Deleted"
  | "Order Approved"
  | "Order Rejected"
  | "Partial Fulfillment";

export type StockLog = {
  logId: string;
  product: string;
  action: LogAction;
  quantity: number;
  date: string;
  performedBy: string;
  remarks: string;
};

export type VerifyStatus = "Pending" | "Approved" | "Rejected" | "Partial";

export type OrderItem = { name: string; requested: number; available: number; approved?: number };

export type VerificationOrder = {
  id: string;
  branch: string;
  date: string;
  itemsCount: number;
  amount: number;
  status: VerifyStatus;
  rejectionReason?: string;
  items: OrderItem[];
  partialFulfillment?: boolean;
  emailSent?: boolean;
  paymentStatus?: "Pending" | "Completed";
  invoiceNumber?: string;
};

export type GeneratedInvoice = {
  invoiceNumber: string;
  orderId: string;
  branch: string;
  issuedDate: string;
  gstPercent: number;
  items: { product: string; quantity: number; price: number }[];
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
};

export type AuditEntry = {
  id: string;
  dateTime: string;
  performedBy: string;
  action: string;
  details: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function nowStr() {
  const d = new Date();
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
}

function dateStr() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

let logCounter = WAREHOUSE_STOCK_LOGS.length + 1;
function nextLogId() {
  return `LOG-${String(logCounter++).padStart(4, "0")}`;
}

let auditCounter = 1;
function nextAuditId() {
  return `AUD-${String(auditCounter++).padStart(4, "0")}`;
}

let invoiceCounter = 1004;
function nextInvoiceNumber() {
  return `INV-2026-${invoiceCounter++}`;
}

let notifCounter = 100;
function nextNotifId(prefix: string) {
  return `${prefix}-${notifCounter++}`;
}

function seedItems(): StockItem[] {
  const approvalMap = getProductApprovalMap();

  // Seed base/static products (always Approved unless overridden)
  const baseItems = (WAREHOUSE_STOCK_ITEMS as Omit<StockItem, "performedBy" | "image" | "approvalStatus">[]).map(
    (item) => ({
      ...item,
      performedBy: "Warehouse Admin",
      image: getProductImage(item.productName),
      currentStock: getLiveStock(item.id, item.currentStock),
      approvalStatus: (approvalMap[item.id] ?? "Approved") as "Approved" | "Pending" | "Rejected",
    })
  );

  // Re-hydrate pending products submitted by warehouse (persisted in demo-store)
  const pending = getPendingProducts();
  const baseNames = new Set(baseItems.map((i) => i.productName.toLowerCase()));
  const pendingItems: StockItem[] = pending
    .filter((p) => !baseNames.has(p.productName.toLowerCase()))
    .map((p) => ({
      id: p.id,
      productName: p.productName,
      category: p.category as StockCategory,
      currentStock: p.stock,
      minimumStock: 10,
      maximumStock: p.stock * 3,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.price,
      supplier: p.supplier,
      status: "Active" as const,
      batchNumber: p.batchNumber,
      expiryDate: p.expiryDate,
      performedBy: "Warehouse Admin",
      image: p.image || getProductImage(p.productName),
      // Use persisted approval map; fall back to the status stored in pending product
      approvalStatus: (approvalMap[p.id] ?? p.status) as "Approved" | "Pending" | "Rejected",
    }));

  return [...pendingItems, ...baseItems];
}

function seedLogs(): StockLog[] {
  return WAREHOUSE_STOCK_LOGS.map((l) => ({ ...l, action: l.action as LogAction }));
}

function seedOrders(): VerificationOrder[] {
  return (
    WAREHOUSE_ORDER_VERIFICATION as Omit<
      VerificationOrder,
      "partialFulfillment" | "emailSent" | "paymentStatus" | "invoiceNumber"
    >[]
  ).map((o) => ({
    ...o,
    status: o.status as VerifyStatus,
    partialFulfillment: false,
    emailSent: false,
    paymentStatus: undefined,
    invoiceNumber: undefined,
  }));
}

// ── Email simulation ──────────────────────────────────────────────────────────

export type PartialFulfillmentEmail = {
  to: string;
  branch: string;
  orderId: string;
  items: { name: string; requested: number; approved: number }[];
};

export async function sendPartialFulfillmentEmail(payload: PartialFulfillmentEmail): Promise<void> {
  const subject = `Stock Availability Update — Order ${payload.orderId}`;
  const body = payload.items
    .map(
      (it) =>
        `Product: ${it.name}\nRequested: ${it.requested}\nAvailable/Approved: ${it.approved}\nReason: Insufficient stock available in warehouse. Please place a new request later for remaining quantity.`
    )
    .join("\n\n");
  // eslint-disable-next-line no-console
  console.info(`[EmailService] Sending to: ${payload.to}\nSubject: ${subject}\n\n${body}`);
  return Promise.resolve();
}

// ── Context value type ────────────────────────────────────────────────────────

type WarehouseContextValue = {
  _instanceId: string;
  products: StockItem[];
  addProduct: (form: Omit<StockItem, "id">) => void;
  addProductPendingApproval: (form: Omit<StockItem, "id">) => void;
  updateProduct: (id: string, form: Omit<StockItem, "id">) => void;
  deleteProduct: (id: string) => void;
  approveProductFromAdmin: (pendingId: string) => void;
  rejectProductFromAdmin: (pendingId: string) => void;
  logs: StockLog[];
  orders: VerificationOrder[];
  approveOrder: (id: string) => void;
  rejectOrder: (id: string, reason: string) => void;
  markPaymentComplete: (orderId: string) => void;
  dispatchOrder: (orderId: string) => void;
  invoices: GeneratedInvoice[];
  auditTrail: AuditEntry[];
  warehouseNotifications: AppNotification[];
  branchNotifications: AppNotification[];
  addWarehouseNotification: (n: Omit<AppNotification, "id">) => void;
  addBranchNotification: (n: Omit<AppNotification, "id">) => void;
  addOrderFromBranch: (order: VerificationOrder) => void;
  registerBranchStatusUpdater: (fn: (orderId: string, status: string) => void) => void;
};

const WarehouseContext = createContext<WarehouseContextValue | null>(null);

// ── Instance identity (for debug logging) ────────────────────────────────────
let instanceCounter = 0;

// ── Provider ──────────────────────────────────────────────────────────────────

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const instanceId = useRef(`WH-INSTANCE-${++instanceCounter}`);
  console.log(`[WarehouseProvider] Mounted: ${instanceId.current}`);
  const [products, setProducts] = useState<StockItem[]>(seedItems);
  const [logs, setLogs] = useState<StockLog[]>(seedLogs);
  const [orders, setOrders] = useState<VerificationOrder[]>(seedOrders);
  console.log("FINAL PROVIDER ORDERS", orders.map((o) => o.id));
  useEffect(() => {
    console.log("WAREHOUSE STATE", orders.map((o) => o.id));
  }, [orders]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [invoices, setInvoices] = useState<GeneratedInvoice[]>([]);
  const [warehouseNotifications, setWarehouseNotifications] = useState<AppNotification[]>([]);
  const [branchNotifications, setBranchNotifications] = useState<AppNotification[]>([]);

  // Ref to a branch-side callback that syncs warehouse approval back to branch order state
  const branchStatusUpdaterRef = useRef<((orderId: string, status: string) => void) | null>(null);

  const registerBranchStatusUpdater = useCallback((fn: (orderId: string, status: string) => void) => {
    branchStatusUpdaterRef.current = fn;
  }, []);

  const addLog = useCallback((entry: Omit<StockLog, "logId" | "date">) => {
    setLogs((prev) => [{ logId: nextLogId(), date: dateStr(), ...entry }, ...prev]);
  }, []);

  const addAudit = useCallback((performedBy: string, action: string, details: string) => {
    setAuditTrail((prev) => [
      { id: nextAuditId(), dateTime: nowStr(), performedBy, action, details },
      ...prev,
    ]);
  }, []);

  const addWarehouseNotification = useCallback((n: Omit<AppNotification, "id">) => {
    setWarehouseNotifications((prev) => [{ id: nextNotifId("wn"), ...n }, ...prev]);
  }, []);

  const addBranchNotification = useCallback((n: Omit<AppNotification, "id">) => {
    setBranchNotifications((prev) => [{ id: nextNotifId("bn"), ...n }, ...prev]);
  }, []);

  const addOrderFromBranch = useCallback((order: VerificationOrder) => {
    setOrders((prev) => {
      // Avoid duplicates if called twice
      if (prev.some((o) => o.id === order.id)) return prev;
      return [order, ...prev];
    });
    // Notify warehouse about the new pending order
    setWarehouseNotifications((prev) => [
      {
        id: nextNotifId("wn"),
        type: "order_pending" as const,
        title: "New Order Received",
        message: `Branch ${order.branch} placed order ${order.id} (${order.itemsCount} items). Waiting for verification.`,
        timestamp: nowStr(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const addProduct = useCallback(
    (form: Omit<StockItem, "id">) => {
      const nextId = `PRD-${String(1000 + Math.floor(Math.random() * 9000))}`;
      setProducts((prev) => [{ id: nextId, ...form }, ...prev]);
      addLog({
        product: form.productName,
        action: "Product Created",
        quantity: form.currentStock,
        performedBy: form.performedBy || "Warehouse Admin",
        remarks: `Product created. Initial stock: ${form.currentStock} ${form.unit}.`,
      });
      addAudit(
        form.performedBy || "Warehouse Admin",
        "Product Created",
        `Created product "${form.productName}" (${nextId}) with ${form.currentStock} ${form.unit}.`
      );
      // Persist stock to localStorage
      setProductStock(nextId, form.currentStock);
      // Check low stock on create
      if (form.currentStock < LOW_STOCK_THRESHOLD) {
        createLowStockAlert(nextId, form.productName, form.currentStock);
      }
    },
    [addLog, addAudit]
  );

  /** Add product with Pending Approval status — sends to admin queue */
  const addProductPendingApproval = useCallback(
    (form: Omit<StockItem, "id">) => {
      const nextId = `PRD-P-${Date.now()}`;
      const pendingItem: StockItem = { id: nextId, ...form, approvalStatus: "Pending" };
      setProducts((prev) => [pendingItem, ...prev]);
      addLog({
        product: form.productName,
        action: "Product Created",
        quantity: form.currentStock,
        performedBy: form.performedBy || "Warehouse Admin",
        remarks: `New product submitted for admin approval.`,
      });
      addAudit(
        form.performedBy || "Warehouse Admin",
        "Product Created (Pending Approval)",
        `Product "${form.productName}" (${nextId}) submitted for admin approval.`
      );
      // Save to demo-store pending products list
      savePendingProduct({
        productName: form.productName,
        category: form.category,
        price: form.sellingPrice,
        stock: form.currentStock,
        unit: form.unit,
        supplier: form.supplier,
        costPrice: form.costPrice,
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
        image: form.image || getProductImage(form.productName),
      });
    },
    [addLog, addAudit]
  );

  /** Called when admin approves a pending product — syncs approval status */
  const approveProductFromAdmin = useCallback(
    (pendingProductName: string) => {
      setProducts((prev) => {
        // Persist approval for any matching pending product id
        prev.forEach((p) => {
          if (p.productName === pendingProductName && p.approvalStatus === "Pending") {
            setProductApprovalStatus(p.id, "Approved");
          }
        });
        return prev.map((p) =>
          p.productName === pendingProductName && p.approvalStatus === "Pending"
            ? { ...p, approvalStatus: "Approved" as const }
            : p
        );
      });

      // Also add newly approved products from demo-store that aren't in context yet
      const approved = getApprovedPendingProducts();
      setProducts((prev) => {
        const names = new Set(prev.map((p) => p.productName.toLowerCase()));
        const toAdd: StockItem[] = approved
          .filter((ap) => !names.has(ap.productName.toLowerCase()))
          .map((ap) => ({
            id: ap.id,
            productName: ap.productName,
            category: ap.category as StockCategory,
            currentStock: ap.stock,
            minimumStock: 10,
            maximumStock: ap.stock * 3,
            unit: ap.unit,
            costPrice: ap.costPrice,
            sellingPrice: ap.price,
            supplier: ap.supplier,
            status: "Active" as const,
            batchNumber: ap.batchNumber,
            expiryDate: ap.expiryDate,
            performedBy: "Warehouse Admin",
            image: ap.image || getProductImage(ap.productName),
            approvalStatus: "Approved" as const,
          }));
        return toAdd.length > 0 ? [...toAdd, ...prev] : prev;
      });
    },
    []
  );

  /** Called when admin rejects a pending product — sets Rejected status in warehouse */
  const rejectProductFromAdmin = useCallback(
    (pendingProductName: string) => {
      setProducts((prev) => {
        // Persist rejection for any matching pending product id
        prev.forEach((p) => {
          if (p.productName === pendingProductName && p.approvalStatus === "Pending") {
            setProductApprovalStatus(p.id, "Rejected");
          }
        });
        return prev.map((p) =>
          p.productName === pendingProductName && p.approvalStatus === "Pending"
            ? { ...p, approvalStatus: "Rejected" as const }
            : p
        );
      });
    },
    []
  );

  const updateProduct = useCallback(
    (id: string, form: Omit<StockItem, "id">) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const delta = form.currentStock - p.currentStock;
          if (delta !== 0) {
            const action: LogAction = delta > 0 ? "Stock In" : "Stock Out";
            addLog({
              product: form.productName,
              action,
              quantity: Math.abs(delta),
              performedBy: form.performedBy || "Warehouse Admin",
              remarks: `Stock updated from ${p.currentStock} to ${form.currentStock}.`,
            });
            // Persist stock change to localStorage
            setProductStock(id, form.currentStock);
            addDemoStockLog({
              product: form.productName,
              action: delta > 0 ? "IN" : "OUT",
              quantity: Math.abs(delta),
              reason: `Manual stock update`,
            });
            // Low stock check
            if (form.currentStock < LOW_STOCK_THRESHOLD) {
              createLowStockAlert(id, form.productName, form.currentStock);
            }
          } else {
            addLog({
              product: form.productName,
              action: "Product Updated",
              quantity: 0,
              performedBy: form.performedBy || "Warehouse Admin",
              remarks: "Product details updated.",
            });
          }
          return { id, ...form };
        })
      );
      addAudit(
        form.performedBy || "Warehouse Admin",
        "Product Updated",
        `Updated product "${form.productName}" (${id}).`
      );
    },
    [addLog, addAudit]
  );

  const deleteProduct = useCallback(
    (id: string) => {
      const found = products.find((p) => p.id === id);
      if (!found) return;
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addLog({
        product: found.productName,
        action: "Product Deleted",
        quantity: found.currentStock,
        performedBy: found.performedBy || "Warehouse Admin",
        remarks: `Product deleted. Last stock: ${found.currentStock} ${found.unit}.`,
      });
      addAudit(
        found.performedBy || "Warehouse Admin",
        "Product Deleted",
        `Deleted product "${found.productName}" (${id}).`
      );
    },
    [products, addLog, addAudit]
  );

  // ── Order Verification ───────────────────────────────────────────────────────

  const approveOrder = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        // Guard: only process Pending orders — prevents duplicate deductions
        if (!order || order.status !== "Pending") return prev;

        let isPartial = false;
        const resolvedItems: OrderItem[] = order.items.map((item) => {
          const approved = Math.min(item.requested, item.available);
          if (approved < item.requested) isPartial = true;
          return { ...item, approved };
        });

        const newStatus: VerifyStatus = isPartial ? "Partial" : "Approved";

        // Deduct stock outside of setOrders to avoid nested state update race conditions
        const stockDeductions: Array<{ productId: string; name: string; approvedQty: number; newStock: number }> = [];

        setProducts((prods) => {
          return prods.map((p) => {
            const item = resolvedItems.find((i) => i.name.toLowerCase() === p.productName.toLowerCase());
            if (!item) return p;
            const approvedQty = item.approved ?? item.requested;
            const newStock = Math.max(0, p.currentStock - approvedQty);
            // Persist to localStorage
            setProductStock(p.id, newStock);
            // Low stock alert if threshold crossed
            if (newStock < LOW_STOCK_THRESHOLD) {
              createLowStockAlert(p.id, p.productName, newStock);
            }
            // Collect for logging after state update
            stockDeductions.push({ productId: p.id, name: p.productName, approvedQty, newStock });
            return { ...p, currentStock: newStock };
          });
        });

        // Create stock logs after deductions are computed
        resolvedItems.forEach((item) => {
          const approvedQty = item.approved ?? item.requested;
          const deduction = stockDeductions.find((d) => d.name.toLowerCase() === item.name.toLowerCase());
          const remainingStock = deduction?.newStock ?? 0;
          const productId = deduction?.productId ?? "N/A";

          // Persist to demo-store for Stock Logs page (localStorage-backed)
          addDemoStockLog({
            product: item.name,
            action: "OUT",
            quantity: approvedQty,
            reason: `Order Approved - Stock Deducted | Order: ${id} | Product ID: ${productId} | Remaining: ${remainingStock}`,
          });

          // Add to warehouse-context logs (React state — Stock Logs page)
          addLog({
            product: item.name,
            action: "Order Approved",
            quantity: approvedQty,
            performedBy: "Warehouse Admin",
            remarks: `Order Approved - Stock Deducted | Order ID: ${id} | Product ID: ${productId} | Qty Deducted: ${approvedQty} | Remaining Stock: ${remainingStock}${isPartial ? " (partial fulfillment)" : ""}`,
          });
        });

        // Auto-create invoice
        const invoiceNo = nextInvoiceNumber();
        const approxUnitPrice = Math.round(order.amount / Math.max(order.itemsCount, 1));
        const invoiceItems = resolvedItems.map((item) => ({
          product: item.name,
          quantity: item.approved ?? item.requested,
          price: approxUnitPrice,
        }));
        const subtotal = order.amount;
        const gstAmount = Math.round((subtotal * 5) / 100);

        setInvoices((prevInv) => [
          {
            invoiceNumber: invoiceNo,
            orderId: id,
            branch: order.branch,
            issuedDate: new Date().toISOString().split("T")[0],
            gstPercent: 5,
            items: invoiceItems,
            subtotal,
            gstAmount,
            totalAmount: subtotal + gstAmount,
          },
          ...prevInv,
        ]);

        // Notify warehouse
        addWarehouseNotification({
          type: "order_approved",
          title: "Order Approved — Awaiting Payment",
          message: `Order ${id} for ${order.branch} approved. Invoice ${invoiceNo} generated. Waiting for branch payment.`,
          timestamp: nowStr(),
          read: false,
        });

        // Notify branch
        addBranchNotification({
          type: "order_approved",
          title: "Order Approved — Invoice Ready",
          message: `Your order ${id} has been approved. Invoice ${invoiceNo} is ready. Please proceed with payment.`,
          timestamp: nowStr(),
          read: false,
        });

        if (isPartial) {
          addAudit("Warehouse Admin", "Partial Fulfillment", `Order ${id} partially fulfilled for ${order.branch}.`);
          const emailItems = resolvedItems
            .filter((i) => (i.approved ?? i.requested) < i.requested)
            .map((i) => ({ name: i.name, requested: i.requested, approved: i.approved ?? 0 }));
          sendPartialFulfillmentEmail({
            to: "manager.gandhinagar@alankarsweets.com",
            branch: order.branch,
            orderId: id,
            items: emailItems,
          });
        } else {
          addAudit("Warehouse Admin", "Order Approved", `Order ${id} fully approved for ${order.branch}.`);
        }

        // Sync approval back to branch order state
        branchStatusUpdaterRef.current?.(id, "Approved");

        return prev.map((o) =>
          o.id === id
            ? {
                ...order,
                status: newStatus,
                items: resolvedItems,
                partialFulfillment: isPartial,
                emailSent: isPartial,
                paymentStatus: "Pending" as const,
                invoiceNumber: invoiceNo,
              }
            : o
        );
      });
    },
    [addLog, addAudit, addWarehouseNotification, addBranchNotification]
  );

  const rejectOrder = useCallback(
    (id: string, reason: string) => {
      let branch = "";
      setOrders((prev) => {
        const order = prev.find((o) => o.id === id);
        if (order) branch = order.branch;
        return prev.map((o) =>
          o.id === id ? { ...o, status: "Rejected" as VerifyStatus, rejectionReason: reason } : o
        );
      });
      addBranchNotification({
        type: "order_rejected",
        title: "Order Rejected",
        message: `Your order ${id} has been rejected. Reason: ${reason}`,
        timestamp: nowStr(),
        read: false,
      });
      addWarehouseNotification({
        type: "order_rejected",
        title: "Order Rejected",
        message: `Order ${id}${branch ? ` for ${branch}` : ""} has been rejected.`,
        timestamp: nowStr(),
        read: false,
      });
      addAudit(
        "Warehouse Admin",
        "Order Rejected",
        `Order ${id}${branch ? ` for ${branch}` : ""} rejected. Reason: ${reason}`
      );
      branchStatusUpdaterRef.current?.(id, "Rejected");
    },
    [addAudit, addBranchNotification, addWarehouseNotification]
  );

  const markPaymentComplete = useCallback(
    (orderId: string) => {
      let branch = "";
      setOrders((prev) => {
        const order = prev.find((o) => o.id === orderId);
        if (order) branch = order.branch;
        return prev.map((o) =>
          o.id === orderId ? { ...o, paymentStatus: "Completed" as const } : o
        );
      });
      addWarehouseNotification({
        type: "order_approved",
        title: "Payment Received",
        message: `Payment completed for order ${orderId}${branch ? ` (${branch})` : ""}. Ready for dispatch.`,
        timestamp: nowStr(),
        read: false,
      });
      addAudit("Branch Manager", "Payment Completed", `Payment completed for order ${orderId}.`);
    },
    [addAudit, addWarehouseNotification]
  );

  const dispatchOrder = useCallback(
    (orderId: string) => {
      let branch = "";
      setOrders((prev) => {
        const order = prev.find((o) => o.id === orderId);
        if (order) {
          branch = order.branch;
        }
        return prev;
      });
      addBranchNotification({
        type: "delivery",
        title: "Order Dispatched",
        message: `Your order ${orderId} has been dispatched from the warehouse and is on its way.`,
        timestamp: nowStr(),
        read: false,
      });
      addAudit(
        "Warehouse Admin",
        "Order Dispatched",
        `Order ${orderId}${branch ? ` for ${branch}` : ""} dispatched.`
      );
    },
    [addAudit, addBranchNotification]
  );

  return (
    <WarehouseContext.Provider
      value={{
        _instanceId: instanceId.current,
        products,
        addProduct,
        addProductPendingApproval,
        updateProduct,
        deleteProduct,
        approveProductFromAdmin,
        rejectProductFromAdmin,
        logs,
        orders,
        approveOrder,
        rejectOrder,
        markPaymentComplete,
        dispatchOrder,
        invoices,
        auditTrail,
        warehouseNotifications,
        branchNotifications,
        addWarehouseNotification,
        addBranchNotification,
        addOrderFromBranch,
        registerBranchStatusUpdater,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useWarehouse() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouse must be used within WarehouseProvider");
  return ctx;
}

export function useWarehouseProducts() {
  const ctx = useContext(WarehouseContext);
  return ctx?.products ?? null;
}

/** Hook for branch portal — reads cross-context notifications, invoices, and payment actions */
export function useWarehouseForBranch() {
  const ctx = useContext(WarehouseContext);
  if (!ctx) throw new Error("useWarehouseForBranch must be used within WarehouseProvider");
  return {
    _instanceId: ctx._instanceId,
    branchNotifications: ctx.branchNotifications,
    addBranchNotification: ctx.addBranchNotification,
    markPaymentComplete: ctx.markPaymentComplete,
    orders: ctx.orders,
    invoices: ctx.invoices,
    products: ctx.products,
    addOrderFromBranch: ctx.addOrderFromBranch,
    registerBranchStatusUpdater: ctx.registerBranchStatusUpdater,
    approveProductFromAdmin: ctx.approveProductFromAdmin,
    rejectProductFromAdmin: ctx.rejectProductFromAdmin,
  };
}

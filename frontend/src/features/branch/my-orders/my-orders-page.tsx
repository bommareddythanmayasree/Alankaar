import { useState, useEffect } from "react";
import {
  Zap, CheckCircle2, Clock, Package, Truck, CreditCard,
  AlertTriangle, Calendar, Receipt, PlayCircle,
  Download, Flag,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  BRANCH_MY_ORDERS,
  BRANCH_PRODUCTION_STATUS,
  PRODUCTION_REQUIREMENTS,
  ALL_STEPS,
  type BranchOrderDetail,
  type BranchOrderLifecycle,
  type DispatchSlot,
} from "../../../shared/data/workflow-mock-data";
import { getCurrentDemoBranchName, getSubmittedOrders, getWarehouseOrders, getWorkflowOrders, calcOrderAmount, getDispatchAssignment, getDispatchBatchesForOrder, getDeliveryDiscrepancy, getDeliveryException, getOrderDeliveryStatus, reportDeliveryDiscrepancy, getInvoiceAmount, getOutstandingAmount, getInvoiceSubtotal, getOrderReview, branchAcceptPartialApproval, branchResubmitOrder, type SubmittedOrder, type WarehouseOrderStatus, type DeliveryDiscrepancy, type DiscrepancyItem, type DeliveryExceptionRecord, type DispatchBatch } from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "products" | "production" | "dispatches" | "deliveries" | "financials" | "timeline";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "products",    label: "Products" },
  { id: "production",  label: "Production" },
  { id: "dispatches",  label: "Dispatches" },
  { id: "deliveries",  label: "Deliveries" },
  { id: "financials",  label: "Financials" },
  { id: "timeline",    label: "Timeline" },
];

function lifecycleColors(s: BranchOrderLifecycle) {
  if (s === "Order Closed")                   return { badge: "bg-slate-200 text-slate-700",     dot: "bg-slate-500" };
  if (s === "Payment Completed")              return { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  if (s === "Payment Verification Pending")   return { badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" };
  if (s === "Payment Pending")                return { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  if (s === "Invoice Generated")              return { badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Awaiting Invoice")               return { badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" };
  if (s === "Delivered")                      return { badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-500" };
  if (s === "Partially Delivered")            return { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  if (s === "In Transit")                     return { badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-400" };
  if (s === "Morning Dispatch" || s === "Evening Dispatch")
                                              return { badge: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500" };
  if (s === "Ready For Dispatch")             return { badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" };
  if (s === "Production Completed")           return { badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500" };
  if (s === "Production Started")             return { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" };
  if (s === "Added To Production")            return { badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500" };
  if (s === "Approved")                       return { badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Partially Approved")             return { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  if (s === "Rejected")                       return { badge: "bg-red-100 text-red-700",         dot: "bg-red-500" };
  if (s === "Resubmitted")                    return { badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" };
  if (s === "Warehouse Review" || s === "Pending Review") return { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
  return { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

function bannerConfig(s: BranchOrderLifecycle) {
  if (s === "Partially Approved")
    return { text: "PARTIALLY APPROVED BY WAREHOUSE — ACTION REQUIRED", bg: "bg-amber-500", icon: <AlertTriangle className="h-5 w-5" /> };
  if (s === "Rejected")
    return { text: "ORDER REJECTED BY WAREHOUSE", bg: "bg-red-600", icon: <AlertTriangle className="h-5 w-5" /> };
  if (s === "Resubmitted")
    return { text: "ORDER RESUBMITTED — AWAITING WAREHOUSE REVIEW", bg: "bg-violet-600", icon: <Clock className="h-5 w-5" /> };
  if (s === "Production Started" || s === "Added To Production" || s === "Production Completed")
    return { text: "YOUR ORDER IS IN PRODUCTION", bg: "bg-blue-600", icon: <PlayCircle className="h-5 w-5" /> };
  if (s === "Ready For Dispatch")
    return { text: "READY FOR DISPATCH", bg: "bg-violet-600", icon: <Truck className="h-5 w-5" /> };
  if (s === "Morning Dispatch" || s === "Evening Dispatch")
    return { text: "OUT FOR DELIVERY", bg: "bg-indigo-600", icon: <Truck className="h-5 w-5" /> };
  if (s === "In Transit")
    return { text: "ORDER IN TRANSIT", bg: "bg-sky-600", icon: <Truck className="h-5 w-5" /> };
  if (s === "Delivered" || s === "Invoice Generated" || s === "Payment Pending")
    return { text: "PAYMENT PENDING", bg: "bg-amber-500", icon: <CreditCard className="h-5 w-5" /> };
  if (s === "Payment Verification Pending")
    return { text: "PAYMENT VERIFICATION PENDING", bg: "bg-orange-500", icon: <CreditCard className="h-5 w-5" /> };
  if (s === "Awaiting Invoice")
    return { text: "DELIVERED — INVOICE PENDING", bg: "bg-orange-500", icon: <Receipt className="h-5 w-5" /> };
  if (s === "Payment Completed")
    return { text: "ORDER COMPLETE \u2014 THANK YOU", bg: "bg-emerald-600", icon: <CheckCircle2 className="h-5 w-5" /> };
  if (s === "Order Closed")
    return { text: "ORDER CLOSED", bg: "bg-slate-600", icon: <CheckCircle2 className="h-5 w-5" /> };
  if (s === "Approved")
    return { text: "ORDER APPROVED \u2014 ENTERING PRODUCTION", bg: "bg-teal-600", icon: <CheckCircle2 className="h-5 w-5" /> };
  return null;
}

function prodStatusColors(s: string) {
  if (s === "Ready For Dispatch") return "bg-violet-100 text-violet-700";
  if (s === "In Production")      return "bg-blue-100 text-blue-700";
  if (s === "Completed")          return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

function dispatchStatusColor(s: string) {
  if (s === "Delivered")  return "bg-emerald-100 text-emerald-700";
  if (s === "Dispatched") return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-700";
}



function fmt(v: number) {
  return formatCurrency(v);
}

// ── Order card ────────────────────────────────────────────────────────────────
function OrderCard({ order, selected, onSelect }: {
  order: BranchOrderDetail;
  selected: boolean;
  onSelect: () => void;
}) {
  const colors = lifecycleColors(order.lifecycleStatus);
  const stepIdx = ALL_STEPS.indexOf(order.lifecycleStatus);
  const productCount = order.items.length;
  const delivery = order.expectedDelivery.split("\u2014")[1]?.trim() ?? order.expectedDelivery;
  return (
    <button onClick={onSelect}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${selected ? "border-[#0B2C66] shadow-md bg-[#F0F4FF]" : "border-slate-200 bg-white hover:border-slate-300"}`}>
      {/* Row 1: Order ID + priority badge + value */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#0B2C66]">{order.orderId}</span>
          {order.priority === "Urgent" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              <Zap className="h-2.5 w-2.5" />Urgent
            </span>
          )}
          {order.isAdvanceOrder && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Advance Order</span>
          )}
          {order.scenario === "festival" && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Festival</span>
          )}
        </div>
        <span className="shrink-0 text-sm font-bold text-slate-800">{fmt(order.orderValue)}</span>
      </div>
      {/* Row 2: Date · Products · Delivery */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{order.orderDate}</span>
        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{productCount} product{productCount > 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{delivery}</span>
      </div>
      {/* Row 3: Status badge */}
      <div className="mt-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${colors.badge}`}>
          {order.lifecycleStatus}
        </span>
      </div>
      {/* Progress bar */}
      <div className="mt-2.5 flex gap-0.5">
        {ALL_STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < stepIdx ? "bg-[#0B2C66]" : i === stepIdx ? "bg-[#4B72C8]" : "bg-slate-100"}`} />
        ))}
      </div>
      <div className="mt-1 text-[10px] text-slate-400">
        Step {stepIdx + 1} of {ALL_STEPS.length}
      </div>
    </button>
  );
}

// ── Partial Approval Panel (branch response) ───────────────────────────────────
function PartialApprovalPanel({ order }: { order: BranchOrderDetail }) {
  const [resubmitMode, setResubmitMode] = useState(false);
  const [revisedQtys, setRevisedQtys] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  if (order.lifecycleStatus !== "Partially Approved") return null;

  // Get review from demo store or fall back to demo data
  const review = getOrderReview(order.orderId);
  const rejectedItems = order.items.filter(i => i.rejectedQty >= i.orderedQty || i.approvedQty === 0);
  const approvedItems = order.items.filter(i => i.approvedQty > 0);

  // Get rejection reasons from review
  function getRejectionReason(product: string): string {
    if (!review) {
      // Demo fallback
      const demoReasons: Record<string, string> = {
        "Mysore Pak": "Out of Stock",
        "Boondi Laddu": "Production Capacity Full",
        "Dry Fruit Barfi": "Raw Material Shortage",
        "Gulab Jamun": "Production Capacity Full",
      };
      return demoReasons[product] ?? "Not available";
    }
    return review.items.find(i => i.product === product)?.rejectionReason ?? "—";
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAccept() {
    branchAcceptPartialApproval(order.orderId);
    showToast("Changes accepted. Approved products will proceed to production.");
    window.dispatchEvent(new StorageEvent("storage", { key: "workflowOrders" }));
  }

  function handleResubmit() {
    const updatedItems = order.items.map(item => {
      const isRejected = item.approvedQty === 0;
      const revisedQty = revisedQtys[item.product];
      return {
        product: item.product,
        orderedQty: isRejected ? (revisedQty ?? item.orderedQty) : item.orderedQty,
        approvedQty: 0,
        rejectedQty: 0,
        unit: item.unit,
      };
    });
    branchResubmitOrder(order.orderId, updatedItems);
    setResubmitMode(false);
    showToast("Order resubmitted to warehouse for review.");
    window.dispatchEvent(new StorageEvent("storage", { key: "workflowOrders" }));
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 space-y-4">
      {toast && (
        <div className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{toast}</div>
      )}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">Partially Approved by Warehouse</span>
      </div>

      {/* Approved items */}
      {approvedItems.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Approved Products</p>
          <div className="space-y-1">
            {approvedItems.map(item => (
              <div key={item.product} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-amber-100">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {item.product}
                </div>
                <span className="text-xs text-slate-500">
                  {item.approvedQty !== item.orderedQty
                    ? <><span className="line-through text-slate-400">{item.orderedQty}</span> → <strong>{item.approvedQty}</strong> {item.unit}</>
                    : <>{item.approvedQty} {item.unit}</>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected items */}
      {rejectedItems.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Rejected Products</p>
          <div className="space-y-1">
            {rejectedItems.map(item => (
              <div key={item.product} className="flex items-start justify-between rounded-lg bg-white px-3 py-2 text-sm border border-red-100">
                <div className="flex items-center gap-2 font-medium text-slate-800">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  {item.product}
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-600 font-semibold">Rejected</p>
                  <p className="text-[10px] text-slate-400">{getRejectionReason(item.product)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resubmit form */}
      {resubmitMode && (
        <div className="rounded-lg border border-violet-200 bg-white p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Edit Rejected Products</p>
          {rejectedItems.map(item => (
            <div key={item.product} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">{item.product}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  placeholder={String(item.orderedQty)}
                  value={revisedQtys[item.product] ?? item.orderedQty}
                  onChange={e => setRevisedQtys(prev => ({ ...prev, [item.product]: Number(e.target.value) }))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-violet-400"
                />
                <span className="text-xs text-slate-400">{item.unit}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setResubmitMode(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleResubmit} className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">Resubmit Order</button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!resubmitMode && (
        <div className="flex gap-3 pt-1">
          <button onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition-colors">
            <CheckCircle2 className="h-4 w-4" />
            Accept Changes
          </button>
          <button onClick={() => setResubmitMode(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-white py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
            <Flag className="h-4 w-4" />
            Modify & Resubmit
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rejected Panel (branch side) ───────────────────────────────────────────────
function RejectedPanel({ order }: { order: BranchOrderDetail }) {
  const [editMode, setEditMode] = useState(false);
  const [revisedQtys, setRevisedQtys] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  if (order.lifecycleStatus !== "Rejected") return null;

  const review = getOrderReview(order.orderId);
  const rejectionReason = review?.overallRejectionReason ?? "Factory Closed";
  const reviewDate = review?.reviewedAt ?? order.orderDate;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleResubmit() {
    const updatedItems = order.items.map(item => ({
      product: item.product,
      orderedQty: revisedQtys[item.product] ?? item.orderedQty,
      approvedQty: 0,
      rejectedQty: 0,
      unit: item.unit,
    }));
    branchResubmitOrder(order.orderId, updatedItems);
    setEditMode(false);
    showToast("Order resubmitted to warehouse for review.");
    window.dispatchEvent(new StorageEvent("storage", { key: "workflowOrders" }));
  }

  return (
    <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-4">
      {toast && (
        <div className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{toast}</div>
      )}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <span className="font-bold text-red-800">Rejected by Warehouse</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white px-3 py-2.5 border border-red-100">
          <p className="text-[10px] text-slate-400 uppercase">Reason</p>
          <p className="text-sm font-semibold text-red-700">{rejectionReason}</p>
        </div>
        <div className="rounded-lg bg-white px-3 py-2.5 border border-red-100">
          <p className="text-[10px] text-slate-400 uppercase">Rejected On</p>
          <p className="text-sm font-semibold text-slate-800">{reviewDate}</p>
        </div>
      </div>

      {editMode && (
        <div className="rounded-lg border border-violet-200 bg-white p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Edit Order Before Resubmitting</p>
          {order.items.map(item => (
            <div key={item.product} className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">{item.product}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={revisedQtys[item.product] ?? item.orderedQty}
                  onChange={e => setRevisedQtys(prev => ({ ...prev, [item.product]: Number(e.target.value) }))}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-violet-400"
                />
                <span className="text-xs text-slate-400">{item.unit}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditMode(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button onClick={handleResubmit} className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">Resubmit</button>
          </div>
        </div>
      )}

      {!editMode && (
        <div className="flex gap-2">
          <button onClick={() => setEditMode(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
            <Flag className="h-4 w-4" />
            Edit & Resubmit
          </button>
          <button onClick={() => setEditMode(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors">
            Resubmit Order
          </button>
        </div>
      )}
    </div>
  );
}

// ── Detail panel tabs ─────────────────────────────────────────────────────────

function TabOverview({ order }: { order: BranchOrderDetail }) {
  const banner = bannerConfig(order.lifecycleStatus);
  const s = order.lifecycleStatus;

  return (
    <div className="space-y-4">
      {banner && (
        <div className={`${banner.bg} flex items-center gap-3 rounded-xl px-5 py-4 text-white`}>
          {banner.icon}
          <span className="text-sm font-bold tracking-wide">{banner.text}</span>
        </div>
      )}

      {/* Universal fields */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          { label: "Order ID",    value: order.orderId },
          { label: "Order Date",  value: order.orderDate + " " + order.orderTime },
          { label: "Priority",    value: order.priority, highlight: order.priority === "Urgent" },
          { label: "Order Value", value: fmt(order.orderValue) },
          { label: "Products",    value: `${order.items.length} item${order.items.length > 1 ? "s" : ""}` },
          { label: "Status",      value: s },
        ].map(f => (
          <div key={f.label} className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</p>
            <p className={`mt-0.5 text-sm font-semibold ${f.highlight ? "text-red-600" : "text-slate-800"}`}>{f.value}</p>
          </div>
        ))}
      </div>

      {/* Status-specific details */}
      {(s === "Warehouse Review" || s === "Order Placed" || s === "Pending Review") && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending Approval</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white px-3 py-2.5 border border-amber-100">
              <p className="text-[10px] text-slate-400 uppercase">Submitted</p>
              <p className="text-sm font-semibold text-slate-800">{order.orderDate} · {order.orderTime}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-amber-100">
              <p className="text-[10px] text-slate-400 uppercase">Review Queue</p>
              <p className="text-sm font-semibold text-amber-700">Awaiting Warehouse</p>
            </div>
          </div>
          <p className="text-xs text-amber-600">Your order has been submitted and is waiting for warehouse review and approval.</p>
        </div>
      )}

      {s === "Resubmitted" && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Order Resubmitted</p>
          <p className="text-xs text-violet-600">Your revised order has been sent back to the warehouse for review.</p>
        </div>
      )}

      {s === "Approved" && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Approval Details</p>
          <ul className="space-y-1.5">
            {order.items.map(item => (
              <li key={item.product} className="flex items-center gap-2 text-sm text-teal-800">
                <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
                <span>{item.product}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-teal-600">Approved by Warehouse Manager · Entering production shortly</p>
        </div>
      )}

      <PartialApprovalPanel order={order} />
      <RejectedPanel order={order} />



      {s === "Ready For Dispatch" && order.dispatches.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Dispatch Details</p>
          {order.dispatches.map((d, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-white px-3 py-2.5 border border-violet-100">
                <p className="text-[10px] text-slate-400 uppercase">Slot</p>
                <p className="text-sm font-semibold text-violet-700">{d.slot} Dispatch</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-violet-100">
                <p className="text-[10px] text-slate-400 uppercase">Time</p>
                <p className="text-sm font-semibold text-slate-800">{d.time}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-violet-100">
                <p className="text-[10px] text-slate-400 uppercase">Representative</p>
                <p className="text-sm font-semibold text-slate-800">{d.representative}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-violet-100">
                <p className="text-[10px] text-slate-400 uppercase">Vehicle</p>
                <p className="text-sm font-semibold text-slate-800">{d.vehicle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {(s === "Morning Dispatch" || s === "Evening Dispatch") && order.dispatches.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Out For Delivery</p>
          {order.dispatches.map((d, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-white px-3 py-2.5 border border-indigo-100">
                <p className="text-[10px] text-slate-400 uppercase">Dispatch Slot</p>
                <p className="text-sm font-semibold text-indigo-700">{d.slot} Dispatch</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-indigo-100">
                <p className="text-[10px] text-slate-400 uppercase">Dispatched At</p>
                <p className="text-sm font-semibold text-slate-800">{d.time}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-indigo-100">
                <p className="text-[10px] text-slate-400 uppercase">Representative</p>
                <p className="text-sm font-semibold text-slate-800">{d.representative}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-indigo-100">
                <p className="text-[10px] text-slate-400 uppercase">Vehicle</p>
                <p className="text-sm font-semibold text-slate-800">{d.vehicle}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-indigo-600">Expected delivery: {order.expectedDelivery.split("\u2014")[1]?.trim() ?? order.expectedDelivery}</p>
        </div>
      )}

      {s === "In Transit" && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">In Transit</p>
          <div className="flex items-center gap-3 text-sm text-sky-700">
            <Truck className="h-4 w-4 shrink-0" />
            <span>Your order is on its way to <strong>{order.branch}</strong>. Expected: {order.expectedDelivery.split("—")[1]?.trim() ?? order.expectedDelivery}</span>
          </div>
        </div>
      )}

      {s === "Delivered" && order.deliveries.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Delivery Summary</p>
          <div className="overflow-x-auto rounded-lg border border-sky-100">
            <table className="w-full text-sm">
              <thead className="bg-white text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left">Product</th>
                  <th className="px-3 py-2 text-right">Delivered</th>
                  <th className="px-3 py-2 text-right">Received</th>
                  <th className="px-3 py-2 text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-50">
                {order.deliveries.map(d => (
                  <tr key={d.product} className="bg-white">
                    <td className="px-3 py-2 font-medium text-slate-800">{d.product}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{d.deliveredQty} {d.unit}</td>
                    <td className="px-3 py-2 text-right text-emerald-700 font-semibold">{d.receivedQty} {d.unit}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${d.differenceQty > 0 ? "text-red-500" : "text-slate-400"}`}>
                      {d.differenceQty > 0 ? `\u2212${d.differenceQty}` : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-sky-600">Bill pending generation. Outstanding: {fmt(order.outstandingAmount)}</p>
        </div>
      )}

      {s === "Awaiting Invoice" && (() => {
        const delivery = getOrderDeliveryStatus(order.orderId);
        const isPartial = delivery.overallStatus === "Partial Delivery";
        return (
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Delivery Confirmed — Awaiting Invoice</p>
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{isPartial ? "Partial delivery confirmed." : "Full delivery confirmed."} Warehouse is reviewing and will generate invoice shortly.</span>
            </div>
            {delivery.hasPendingItems && (
              <div className="rounded-lg bg-white border border-orange-100 px-3 py-2 text-xs text-orange-700 space-y-1">
                <p className="font-semibold">Pending items (not billed):</p>
                {delivery.pendingLines.map(l => (
                  <p key={l.product}>{l.product}: {l.pendingQty} {l.unit} — {l.reason || "Pending"}</p>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {s === "Invoice Generated" && (        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Bill Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white px-3 py-2.5 border border-teal-100">
              <p className="text-[10px] text-slate-400 uppercase">Invoice Number</p>
              <p className="text-sm font-semibold text-teal-700">{order.invoiceNumber ?? "\u2014"}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-teal-100">
              <p className="text-[10px] text-slate-400 uppercase">Bill Amount</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(order.deliveredValue > 0 ? order.deliveredValue : order.orderValue)}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-teal-100">
              <p className="text-[10px] text-slate-400 uppercase">Outstanding</p>
              <p className="text-sm font-semibold text-amber-600">{fmt(order.outstandingAmount)}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-teal-100">
              <p className="text-[10px] text-slate-400 uppercase">Payment Status</p>
              <p className="text-sm font-semibold text-amber-700">Pending</p>
            </div>
          </div>
        </div>
      )}

      {s === "Payment Pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Payment Pending</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white px-3 py-2.5 border border-amber-100">
              <p className="text-[10px] text-slate-400 uppercase">Invoice</p>
              <p className="text-sm font-semibold text-slate-800">{order.invoiceNumber ?? "\u2014"}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-amber-100">
              <p className="text-[10px] text-slate-400 uppercase">Outstanding Amount</p>
              <p className="text-lg font-bold text-amber-700">{fmt(order.outstandingAmount)}</p>
            </div>
          </div>
          <p className="text-xs text-amber-600">Please clear the outstanding amount at the earliest. Contact warehouse for any queries.</p>
        </div>
      )}

      {s === "Payment Completed" && order.paymentHistory.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Payment Completed</p>
          {order.paymentHistory.map((p, i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white px-3 py-2.5 border border-emerald-100">
                <p className="text-[10px] text-slate-400 uppercase">Paid Amount</p>
                <p className="text-sm font-bold text-emerald-700">{fmt(p.amount)}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-emerald-100">
                <p className="text-[10px] text-slate-400 uppercase">Method</p>
                <p className="text-sm font-semibold text-slate-800">{p.method}</p>
              </div>
              <div className="rounded-lg bg-white px-3 py-2.5 border border-emerald-100">
                <p className="text-[10px] text-slate-400 uppercase">Reference</p>
                <p className="text-sm font-mono text-slate-600 truncate">{p.reference}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {s === "Order Closed" && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Order Closed</p>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" />
            <span>This order has been fully completed and closed. Invoice: <strong>{order.invoiceNumber ?? "—"}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

function TabProducts({ order }: { order: BranchOrderDetail }) {
  const hasPartial = order.items.some(i => i.rejectedQty > 0);
  return (
    <div className="space-y-4">
      {hasPartial && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="font-bold text-amber-800 tracking-wide">PARTIAL FULFILLMENT</span>
          </div>
          <div className="space-y-2">
            {order.items.filter(i => i.rejectedQty > 0).map(item => (
              <div key={item.product} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm border border-amber-200">
                <span className="font-semibold text-slate-800">{item.product}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">Ordered: <strong>{item.orderedQty} {item.unit}</strong></span>
                  <span className="text-emerald-600">Approved: <strong>{item.approvedQty}</strong></span>
                  <span className="text-red-600">Cancelled: <strong>{item.rejectedQty}</strong></span>
                </div>
              </div>
            ))}
            <p className="mt-1 text-xs text-amber-700 font-medium">Reason: Production Capacity Limit &mdash; Invoice will reflect approved quantities only.</p>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Ordered Quantity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map(item => (
              <tr key={item.product} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                <td className="px-4 py-3 text-right text-slate-600">{item.orderedQty} {item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabProduction({ order }: { order: BranchOrderDetail }) {
  // All statuses at or beyond "Added To Production" should show production info
  const PRODUCTION_VISIBLE_STAGES: BranchOrderLifecycle[] = [
    "Added To Production",
    "Production Started", "Production Completed",
    "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
    "In Transit", "Delivered", "Awaiting Invoice", "Invoice Generated", "Payment Pending",
    "Payment Verification Pending", "Payment Completed", "Order Closed",
  ];
  const isProductionCompleted = [
    "Production Completed",
    "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
    "In Transit", "Delivered", "Awaiting Invoice", "Invoice Generated", "Payment Pending",
    "Payment Verification Pending", "Payment Completed", "Order Closed",
  ].includes(order.lifecycleStatus);

  // Gate: only show after Added To Production
  if (!PRODUCTION_VISIBLE_STAGES.includes(order.lifecycleStatus)) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Clock className="mb-3 h-10 w-10" />
        <p className="text-sm font-medium text-slate-500">Waiting for production to begin.</p>
      </div>
    );
  }

  // Build per-product statuses based on live lifecycle
  const prodStatuses: { product: string; status: string; pct: number }[] =
    BRANCH_PRODUCTION_STATUS[order.orderId] ??
    (() => {
      if (order.lifecycleStatus === "Added To Production") {
        return order.items.map(item => ({
          product: item.product,
          status: "Added to Queue",
          pct: 0,
        }));
      }
      if (order.lifecycleStatus === "Production Started") {
        return order.items.map((item, index) => ({
          product: item.product,
          status: "In Production",
          pct: index % 2 === 0 ? 40 : 70,
        }));
      }
      // Production Completed and all post-production stages
      return order.items.map(item => ({
        product: item.product,
        status: "Completed",
        pct: 100,
      }));
    })();

  const overall = Math.round(prodStatuses.reduce((s, p) => s + p.pct, 0) / prodStatuses.length);

  // Derive timestamps: prefer timeline events, fall back to mock values
  const productionStartEvent = order.timelineEvents.find(e => e.label === "Production Started");
  const productionCompletedEvent = order.timelineEvents.find(e => e.label === "Production Completed");
  const readyForDispatchEvent = order.timelineEvents.find(e => e.label === "Ready For Dispatch");

  const productionStartTime =
    productionStartEvent && (productionStartEvent.done || productionStartEvent.current) && productionStartEvent.timestamp !== "—"
      ? productionStartEvent.timestamp
      : isProductionCompleted ? `${order.orderDate}, 06:00 AM` : null;

  const productionEndTime =
    productionCompletedEvent && (productionCompletedEvent.done || productionCompletedEvent.current) && productionCompletedEvent.timestamp !== "—"
      ? productionCompletedEvent.timestamp
      : readyForDispatchEvent && (readyForDispatchEvent.done || readyForDispatchEvent.current) && readyForDispatchEvent.timestamp !== "—"
        ? readyForDispatchEvent.timestamp
        : isProductionCompleted ? `${order.orderDate}, 11:30 AM` : null;

  return (
    <div className="space-y-4">
      {/* Production Completed banner */}
      {isProductionCompleted && (
        <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-cyan-600 shrink-0" />
            <p className="text-sm font-bold text-cyan-800">Production Completed</p>
            <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-700">Completed</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-white px-3 py-2.5 border border-cyan-100">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Production Start</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{productionStartTime ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-cyan-100">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Production End</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{productionEndTime ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2.5 border border-cyan-100">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Warehouse</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">Central Warehouse</p>
            </div>
          </div>
          {/* Products Produced */}
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Products Produced</p>
            <div className="space-y-1.5">
              {order.items.map(item => (
                  <div key={item.product} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-cyan-100">
                    <span className="text-sm font-medium text-slate-800">{item.product}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Produced</span>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-progress banner for Added To Production / Production Started */}
      {!isProductionCompleted && order.lifecycleStatus === "Added To Production" && (
        <div className="flex items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-5 py-4">
          <Clock className="h-5 w-5 text-cyan-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-cyan-800">Added to Production Queue</p>
            <p className="text-xs text-cyan-600">Your order has been queued for production.</p>
          </div>
        </div>
      )}
      {!isProductionCompleted && order.lifecycleStatus === "Production Started" && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <PlayCircle className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-blue-800">Production In Progress</p>
            {productionStartTime && <p className="text-xs text-blue-600">Started: {productionStartTime}</p>}
          </div>
        </div>
      )}

      {/* Overall progress bar — only for in-progress states */}
      {!isProductionCompleted && (
        <>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <span className="text-sm font-semibold text-slate-700">Overall Production Progress</span>
            <span className="text-lg font-bold text-emerald-600">{overall}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${overall}%` }} />
          </div>

          <div className="space-y-3">
            {prodStatuses.map(p => {
              const item = order.items.find(i => i.product === p.product);
              const preparedQty = item
                ? `${item.approvedQty > 0 ? item.approvedQty : item.orderedQty} ${item.unit}`
                : "\u2014";
              return (
                <div key={p.product} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="font-medium text-slate-800">{p.product}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${prodStatusColors(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] uppercase text-slate-400">Prepared Qty</p>
                      <p className="text-sm font-semibold text-slate-800">{preparedQty}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-[10px] uppercase text-slate-400">Completion</p>
                      <p className="text-sm font-semibold text-emerald-600">{p.pct}%</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className={`h-2 rounded-full ${p.pct === 100 ? "bg-emerald-500" : p.pct > 0 ? "bg-blue-500" : "bg-slate-200"}`}
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Delivery stages that require delivery info ────────────────────────────────
const DELIVERY_ACTIVE_STAGES: BranchOrderLifecycle[] = [
  "In Transit", "Delivered", "Awaiting Invoice", "Invoice Generated", "Payment Pending",
  "Payment Verification Pending", "Payment Completed", "Order Closed",
];

// ── Generate deterministic mock delivery lines for an order ──────────────────
function mockDeliveriesForOrder(order: BranchOrderDetail): Array<{
  product: string; orderedQty: number; deliveredQty: number;
  receivedQty: number; differenceQty: number; unit: string; reason?: string;
}> {
  const h = hashStr(order.orderId);
  return order.items.map((item, idx) => {
    const ordered = item.approvedQty > 0 ? item.approvedQty : item.orderedQty;
    // Deterministically decide if there is a small shortage (1 in 4 items)
    const hasShortage = (h + idx) % 4 === 0 && ordered > 1;
    const delivered = hasShortage ? ordered - 1 : ordered;
    const received = delivered; // received = delivered (no further loss at branch)
    const diff = ordered - received;
    return {
      product: item.product,
      orderedQty: ordered,
      deliveredQty: delivered,
      receivedQty: received,
      differenceQty: diff,
      unit: item.unit,
      reason: hasShortage ? "Short supply during loading" : undefined,
    };
  });
}

// ── Deterministic mock dispatch data keyed by order ID ───────────────────────
const MOCK_DRIVERS = [
  "Ramesh Kumar", "Suresh Rao", "Vijay Reddy", "Arun Babu",
  "Nagaraju P", "Srinivas M", "Kiran Kumar", "Praveen S",
];
const MOCK_VEHICLES = [
  "AP 16 AB 1234", "AP 29 BX 7734", "AP 16 CD 5678", "AP 37 EF 9012",
  "AP 16 GH 3456", "AP 29 IJ 7890", "AP 16 KL 2345", "AP 37 MN 6789",
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function mockDispatchForOrder(order: BranchOrderDetail): DispatchSlot[] {
  const h = hashStr(order.orderId);
  const slot: "Morning" | "Evening" = h % 2 === 0 ? "Morning" : "Evening";
  const driver = MOCK_DRIVERS[h % MOCK_DRIVERS.length];
  const vehicle = MOCK_VEHICLES[(h >> 2) % MOCK_VEHICLES.length];
  const time = slot === "Morning" ? "06:30 AM" : "03:00 PM";
  const s = order.lifecycleStatus;
  const status: DispatchSlot["status"] =
    s === "Ready For Dispatch" ? "Scheduled"
    : s === "Delivered" || s === "Awaiting Invoice" || s === "Invoice Generated" || s === "Payment Pending"
      || s === "Payment Completed" || s === "Order Closed" ? "Delivered"
    : "Dispatched";
  return [{
    slot,
    time,
    representative: driver,
    vehicle,
    products: order.items.map(i => ({ name: i.product, qty: i.approvedQty || i.orderedQty, unit: i.unit })),
    status,
  }];
}

function TabDispatches({ order }: { order: BranchOrderDetail }) {
  const s = order.lifecycleStatus;

  // Always read live dispatch batches first — warehouse may have created them
  // before the order status has formally advanced on the branch side.
  const liveBatches: DispatchBatch[] = getDispatchBatchesForOrder(order.orderId);

  // Show empty state only when no batches exist AND order hasn't reached dispatch yet
  const DISPATCH_STAGES: BranchOrderLifecycle[] = [
    "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
    "In Transit", "Delivered", "Partially Delivered", "Awaiting Invoice", "Invoice Generated",
    "Payment Pending", "Payment Verification Pending", "Payment Completed", "Order Closed",
  ];
  if (liveBatches.length === 0 && !DISPATCH_STAGES.includes(s)) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Truck className="mb-3 h-10 w-10" />
        <p className="text-sm font-medium text-slate-500">Dispatch has not been scheduled yet.</p>
      </div>
    );
  }

  if (liveBatches.length > 0) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Dispatch History — {liveBatches.length} Batch{liveBatches.length > 1 ? "es" : ""}
        </p>
        {liveBatches.map(batch => {
          const statusColor =
            batch.status === "Delivered" ? "bg-emerald-100 text-emerald-700"
            : batch.status === "In Transit" ? "bg-sky-100 text-sky-700"
            : "bg-amber-100 text-amber-700";
          const slotColor = batch.slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700";
          return (
            <div key={batch.batchId} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Batch {batch.batchNumber}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${slotColor}`}>
                    {batch.slot} Dispatch
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
                    {batch.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{batch.dispatchTime}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Driver</p>
                  <p className="font-semibold text-slate-800">{batch.driverName}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] text-slate-400 uppercase">Vehicle</p>
                  <p className="font-semibold text-slate-800">{batch.vehicleNumber}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Products</p>
                <div className="space-y-1">
                  {batch.status === "Delivered" && batch.deliveryLines && batch.deliveryLines.length > 0
                    ? batch.deliveryLines.map(dl => (
                        <div key={dl.product} className="flex items-center rounded-md bg-white border border-slate-100 px-3 py-1.5 text-sm">
                          <span className="text-slate-700">{dl.product}</span>
                        </div>
                      ))
                    : batch.products.map(p => (
                        <div key={p.product} className="flex items-center gap-2 text-sm">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="text-slate-700">{p.product}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: no live batches but we're in a dispatch stage — legacy assignment
  if (liveBatches.length === 0) {
    const assignment = getDispatchAssignment(order.orderId);

  if (!assignment) {
      return (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400">
          <Truck className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium text-slate-500">Driver and vehicle not yet assigned.</p>
        </div>
      );
    }

    const isDelivered = ["Delivered", "Awaiting Invoice", "Invoice Generated", "Payment Pending", "Payment Verification Pending", "Payment Completed", "Order Closed"].includes(s);

    const statusLabel =
      s === "Ready For Dispatch" ? "Ready For Dispatch"
      : s === "Morning Dispatch" ? "Out For Delivery — Morning Slot"
      : s === "Evening Dispatch" ? "Out For Delivery — Evening Slot"
      : s === "In Transit" ? "Order In Transit"
      : "Delivered";

    const bannerClass =
      s === "Ready For Dispatch" ? "bg-violet-50 border-violet-200 text-violet-800"
      : s === "In Transit" ? "bg-sky-50 border-sky-200 text-sky-800"
      : isDelivered ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-indigo-50 border-indigo-200 text-indigo-800";

    const truckColor =
      s === "Ready For Dispatch" ? "text-violet-600"
      : s === "In Transit" ? "text-sky-600"
      : isDelivered ? "text-emerald-600"
      : "text-indigo-600";

    const dispatchStatusLabel =
      isDelivered ? "Delivered"
      : s === "In Transit" ? "In Transit"
      : "Scheduled";

    return (
      <div className="space-y-4">
        <div className={`flex items-center gap-3 rounded-xl border px-5 py-4 ${bannerClass}`}>
          <Truck className={`h-5 w-5 shrink-0 ${truckColor}`} />
          <p className="text-sm font-bold">{statusLabel}</p>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${dispatchStatusColor(dispatchStatusLabel)}`}>
            {dispatchStatusLabel}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: "Dispatch Date & Time", value: assignment.dispatchTime },
            { label: "Dispatch Type",        value: `${assignment.slot ?? "Morning"} Dispatch` },
            { label: "Driver",               value: assignment.driverName },
            { label: "Vehicle",              value: assignment.vehicleNumber },
            { label: "Dispatch Status",      value: s },
          ].map(f => (
            <div key={f.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

function TabDeliveries({ order }: { order: BranchOrderDetail }) {
  const [showModal, setShowModal] = useState(false);
  const [discrepancy, setDiscrepancy] = useState<DeliveryDiscrepancy | undefined>(
    () => getDeliveryDiscrepancy(order.orderId)
  );
  const [missingQty, setMissingQty] = useState("");
  const [damagedItems, setDamagedItems] = useState("");
  const [wrongProduct, setWrongProduct] = useState("");
  const [otherRemarks, setOtherRemarks] = useState("");
  const currentBranch = getCurrentDemoBranchName();

  const liveBatches: DispatchBatch[] = getDispatchBatchesForOrder(order.orderId);
  const s = order.lifecycleStatus;
  const hasAnyDeliveredBatch = liveBatches.some(b => b.status === "Delivered");

  // Show empty state only when: no delivered batches AND order hasn't reached delivery stages yet
  if (!hasAnyDeliveredBatch && !DELIVERY_ACTIVE_STAGES.includes(s)) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Package className="mb-3 h-10 w-10" />
        <p className="text-sm font-medium text-slate-500">Delivery has not started yet.</p>
      </div>
    );
  }

  function handleSubmitDiscrepancy() {
    const items: DiscrepancyItem[] = [];
    if (missingQty.trim()) items.push({ product: order.items[0]?.product ?? "N/A", unit: order.items[0]?.unit ?? "pcs", deliveredQty: order.items[0]?.approvedQty || order.items[0]?.orderedQty || 0, reportedIssue: "Missing Quantity", missingQty: Number(missingQty) || 0, remarks: missingQty.trim() });
    if (damagedItems.trim()) items.push({ product: order.items[0]?.product ?? "N/A", unit: order.items[0]?.unit ?? "pcs", deliveredQty: order.items[0]?.approvedQty || order.items[0]?.orderedQty || 0, reportedIssue: "Damaged Items", remarks: damagedItems.trim() });
    if (wrongProduct.trim()) items.push({ product: order.items[0]?.product ?? "N/A", unit: order.items[0]?.unit ?? "pcs", deliveredQty: order.items[0]?.approvedQty || order.items[0]?.orderedQty || 0, reportedIssue: "Wrong Product", remarks: wrongProduct.trim() });
    if (otherRemarks.trim()) items.push({ product: order.items[0]?.product ?? "N/A", unit: order.items[0]?.unit ?? "pcs", deliveredQty: order.items[0]?.approvedQty || order.items[0]?.orderedQty || 0, reportedIssue: "Other", remarks: otherRemarks.trim() });
    if (items.length === 0) return;
    const result = reportDeliveryDiscrepancy(order.orderId, currentBranch, items);
    setDiscrepancy(result);
    setShowModal(false);
    setMissingQty(""); setDamagedItems(""); setWrongProduct(""); setOtherRemarks("");
  }

  if (liveBatches.length > 0) {
    const sorted = [...liveBatches].sort((a, b) => a.batchNumber - b.batchNumber);
    const allDelivered = sorted.every(b => b.status === "Delivered");
    const hasAnyDelivered = sorted.some(b => b.status === "Delivered");
    return (
      <div className="space-y-4">
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${allDelivered ? "border-emerald-200 bg-emerald-50" : hasAnyDelivered ? "border-amber-200 bg-amber-50" : "border-sky-200 bg-sky-50"}`}>
          {allDelivered ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : hasAnyDelivered ? <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> : <Truck className="h-4 w-4 text-sky-600 shrink-0" />}
          <span className={`text-sm font-semibold ${allDelivered ? "text-emerald-800" : hasAnyDelivered ? "text-amber-800" : "text-sky-800"}`}>
            {allDelivered ? "All Batches Delivered" : hasAnyDelivered ? "Partially Delivered — Some Batches Pending" : "Order In Transit"}
          </span>
          <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${allDelivered ? "bg-emerald-200 text-emerald-800" : hasAnyDelivered ? "bg-amber-200 text-amber-800" : "bg-sky-200 text-sky-800"}`}>
            {sorted.filter(b => b.status === "Delivered").length}/{sorted.length} batches delivered
          </span>
        </div>

        {sorted.map(batch => {
          const isDelivered = batch.status === "Delivered";
          const isInTransitBatch = batch.status === "In Transit";
          const batchHasLines = batch.deliveryLines && batch.deliveryLines.length > 0;
          const slotColor = batch.slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700";
          const statusColor = isDelivered ? "bg-emerald-100 text-emerald-700" : isInTransitBatch ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500";
          return (
            <div key={batch.batchId} className={`rounded-xl border p-4 space-y-3 ${isDelivered ? "border-emerald-200 bg-emerald-50/30" : isInTransitBatch ? "border-sky-200 bg-sky-50/30" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 text-sm">Batch {batch.batchNumber}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${slotColor}`}>{batch.slot} Dispatch</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor}`}>{batch.status}</span>
                </div>
                <span className="text-xs text-slate-400">{isDelivered ? (batch.deliveredAt ?? "—") : batch.dispatchTime}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2"><p className="text-[10px] text-slate-400 uppercase">Driver</p><p className="font-semibold text-slate-800">{batch.driverName}</p></div>
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2"><p className="text-[10px] text-slate-400 uppercase">Vehicle</p><p className="font-semibold text-slate-800">{batch.vehicleNumber}</p></div>
                <div className="rounded-lg bg-white border border-slate-100 px-3 py-2"><p className="text-[10px] text-slate-400 uppercase">Delivery Confirmation</p><p className={`font-semibold ${isDelivered ? "text-emerald-700" : "text-slate-400"}`}>{isDelivered ? "Confirmed" : "Pending"}</p></div>
              </div>
              {isDelivered && batchHasLines ? (
                <div className="overflow-x-auto rounded-lg border border-emerald-200">
                  <table className="w-full text-xs">
                    <thead className="bg-emerald-50 text-[10px] uppercase tracking-wide text-slate-500">
                      <tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Ordered</th><th className="px-3 py-2 text-right">Delivered</th><th className="px-3 py-2 text-right">Pending</th><th className="px-3 py-2">Reason</th></tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {batch.deliveryLines!.map(l => (
                        <tr key={l.product} className="bg-white">
                          <td className="px-3 py-2 font-medium text-slate-800">{l.product}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{l.orderedQty} {l.unit}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${l.deliveredQty < l.orderedQty ? "text-amber-600" : "text-emerald-600"}`}>{l.deliveredQty} {l.unit}</td>
                          <td className={`px-3 py-2 text-right ${l.pendingQty > 0 ? "text-red-500 font-semibold" : "text-slate-300"}`}>{l.pendingQty > 0 ? `${l.pendingQty} ${l.unit}` : "—"}</td>
                          <td className="px-3 py-2 text-slate-500">{l.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {batch.products.map(p => (
                    <span key={p.product} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                      <Package className="h-3 w-3 text-slate-400" />{p.product} × {p.qty} {p.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {hasAnyDelivered && (
          <div className="flex justify-end">
            {discrepancy ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800"><Flag className="h-3.5 w-3.5" />Difference Reported</span>
            ) : (
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"><Flag className="h-3.5 w-3.5" />Report Difference</button>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="mb-4 text-base font-bold text-slate-800">Report Delivery Difference</h2>
              <div className="space-y-3">
                <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Missing Quantity</label><input type="text" value={missingQty} onChange={e => setMissingQty(e.target.value)} placeholder="e.g. 5 pcs of Gulab Jamun missing" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Damaged Items</label><input type="text" value={damagedItems} onChange={e => setDamagedItems(e.target.value)} placeholder="e.g. 2 boxes damaged" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Wrong Product</label><input type="text" value={wrongProduct} onChange={e => setWrongProduct(e.target.value)} placeholder="e.g. Received Rasmalai instead of Rasgulla" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
                <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Other Remarks</label><textarea value={otherRemarks} onChange={e => setOtherRemarks(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" /></div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600">Cancel</button>
                <button onClick={handleSubmitDiscrepancy} disabled={!missingQty.trim() && !damagedItems.trim() && !wrongProduct.trim() && !otherRemarks.trim()} className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Submit Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: no live batches
  const assignment = getDispatchAssignment(order.orderId);
  const driverName = assignment?.driverName ?? "—";
  const vehicleNumber = assignment?.vehicleNumber ?? "—";
  const dispatchTime = assignment?.dispatchTime ?? "—";
  const exceptionRecord: DeliveryExceptionRecord | undefined = getDeliveryException(order.orderId);
  const isPartialDelivery = !!exceptionRecord && exceptionRecord.deliveryStatus === "Partial Delivery";
  const deliveryStatusLabel = isPartialDelivery ? "Partial Delivery" : (discrepancy ? "Difference Reported" : "Delivered");
  const isInTransit = s === "In Transit";

  return (
    <div className="space-y-4">
      {isInTransit ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-sky-600 shrink-0" /><span className="text-sm font-bold text-sky-800">Order In Transit</span></div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Driver", value: driverName }, { label: "Vehicle", value: vehicleNumber }, { label: "Dispatch Time", value: dispatchTime }].map(f => (
              <div key={f.label} className="rounded-lg bg-white border border-sky-100 px-3 py-2.5"><p className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{f.value}</p></div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 space-y-3 ${isPartialDelivery ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-2">
            {isPartialDelivery ? <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" /> : <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            <span className={`text-sm font-bold ${isPartialDelivery ? "text-amber-800" : "text-emerald-800"}`}>{isPartialDelivery ? "Partial Delivery" : "Delivery Completed"}</span>
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold ${isPartialDelivery ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"}`}>{deliveryStatusLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "Driver", value: driverName }, { label: "Vehicle", value: vehicleNumber }, { label: "Delivery Status", value: deliveryStatusLabel }].map(f => (
              <div key={f.label} className={`rounded-lg bg-white px-3 py-2.5 border ${isPartialDelivery ? "border-amber-100" : "border-emerald-100"}`}><p className="text-[10px] uppercase tracking-wide text-slate-400">{f.label}</p><p className="mt-0.5 text-sm font-semibold text-slate-800">{f.value}</p></div>
            ))}
          </div>
        </div>
      )}
      {!isInTransit && (
        <div className="flex justify-end">
          {discrepancy ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800"><Flag className="h-3.5 w-3.5" />Difference Reported</span>
          ) : (
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors"><Flag className="h-3.5 w-3.5" />Report Difference</button>
          )}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-base font-bold text-slate-800">Report Delivery Difference</h2>
            <div className="space-y-3">
              <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Missing Quantity</label><input type="text" value={missingQty} onChange={e => setMissingQty(e.target.value)} placeholder="e.g. 5 pcs missing" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Damaged Items</label><input type="text" value={damagedItems} onChange={e => setDamagedItems(e.target.value)} placeholder="e.g. 2 boxes damaged" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400" /></div>
              <div><label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">Other Remarks</label><textarea value={otherRemarks} onChange={e => setOtherRemarks(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 resize-none" /></div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button onClick={handleSubmitDiscrepancy} disabled={!missingQty.trim() && !damagedItems.trim() && !otherRemarks.trim()} className="flex-1 rounded-lg bg-amber-500 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabFinancials({ order, showInvoice, setShowInvoice }: {
  order: BranchOrderDetail;
  showInvoice: boolean;
  setShowInvoice: (v: boolean) => void;
}) {
  const invoiceSubtotal = getInvoiceSubtotal(order.orderId);
  const invoiceTotal = getInvoiceAmount(order.orderId);
  const billableValue = invoiceSubtotal > 0 ? invoiceSubtotal : (order.deliveredValue > 0 ? order.deliveredValue : order.orderValue);

  return (
    <div className="space-y-4">

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Ordered Value",    value: fmt(order.orderValue),        bg: "bg-slate-50",   color: "text-slate-800",   border: "border-slate-200" },
          { label: "Delivered Value",  value: fmt(billableValue),           bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200" },
          { label: "Paid Amount",      value: fmt(order.paidAmount),        bg: "bg-teal-50",    color: "text-teal-700",    border: "border-teal-200" },
          { label: "Outstanding Amount", value: fmt(order.outstandingAmount), bg: order.outstandingAmount > 0 ? "bg-amber-50" : "bg-slate-50", color: order.outstandingAmount > 0 ? "text-amber-700" : "text-slate-400", border: order.outstandingAmount > 0 ? "border-amber-200" : "border-slate-200" },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className={`mt-1 text-base font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice section */}
      {order.invoiceNumber ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Invoice Number</p>
              <p className="mt-0.5 font-semibold text-slate-800">{order.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Invoice Date</p>
              <p className="mt-0.5 font-semibold text-slate-800">{order.orderDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Invoice Amount</p>
              <p className="mt-0.5 font-semibold text-slate-800">{fmt(invoiceTotal > 0 ? invoiceTotal : Math.round(billableValue * 1.05))}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Payment Status</p>
              <p className={`mt-0.5 font-semibold ${order.lifecycleStatus === "Payment Completed" || order.lifecycleStatus === "Order Closed" ? "text-emerald-600" : "text-amber-600"}`}>
                {order.lifecycleStatus === "Payment Completed" || order.lifecycleStatus === "Order Closed" ? "Paid" : order.lifecycleStatus === "Payment Verification Pending" ? "Verification Pending" : "Pending"}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <button onClick={() => setShowInvoice(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#092757] transition-colors">
              <Receipt className="h-3.5 w-3.5" />View Invoice
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</p>
          <div className="flex items-center gap-3 pt-2 text-sm text-slate-400">
            <Receipt className="h-4 w-4 shrink-0" />
            No invoice has been generated yet.
          </div>
        </div>
      )}

      {showInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Invoice Preview</h3>
              <button onClick={() => setShowInvoice(false)} className="text-xl leading-none text-slate-400 hover:text-slate-600">&#10005;</button>
            </div>
            <div className="mb-4 rounded-lg bg-slate-50 p-4 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Invoice No.</span><span className="font-semibold">{order.invoiceNumber ?? "INV-2026-DRAFT"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="font-semibold">{order.orderId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-semibold">{order.branch}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-semibold">{order.orderDate}</span></div>
            </div>
            <div className="mb-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Items (Approved Quantities)</p>
              <div className="space-y-1">
                {order.items.filter(i => i.approvedQty > 0).map(item => (
                  <div key={item.product} className="flex justify-between rounded bg-slate-50 px-3 py-1.5 text-sm">
                    <span className="text-slate-700">{item.product}</span>
                    <span className="font-semibold text-slate-800">{item.approvedQty} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 border-t border-b border-slate-100 py-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Delivered Value</span><span>{fmt(billableValue)}</span></div>
              {order.cancelledValue > 0 && <div className="flex justify-between text-red-500"><span>Cancelled / Short</span><span>- {fmt(order.cancelledValue)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-600">GST (5%)</span><span>{fmt(invoiceTotal - billableValue)}</span></div>
            </div>
            <div className="mt-3 flex justify-between text-base font-bold">
              <span>Total Payable</span>
              <span className="text-[#0B2C66]">{fmt(invoiceTotal > 0 ? invoiceTotal : Math.round(billableValue * 1.05))}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowInvoice(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#0B2C66] py-2 text-sm font-semibold text-white hover:bg-[#092757]">
                <Download className="h-4 w-4" />Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Timeline stage detail builders ───────────────────────────────────────────

const MOCK_REVIEWERS = ["Warehouse Manager", "Srinivas Rao", "Lakshmi Devi", "Ravi Kumar", "Meena Kumari"];
const MOCK_SUPERVISORS = ["Ravi Kumar", "Srinivas Rao", "Lakshmi Devi", "Rajesh Verma", "Anitha Bai"];
const MOCK_PROD_LINES = ["Line A - Central Unit", "Line B - Main Hub", "Line C - West Wing", "Line D - East Block"];
const MOCK_PACKED_BY = ["Suresh Kumar", "Anand Rao", "Deepa S", "Mohan Babu", "Kavitha Reddy"];
const MOCK_RECEIVED_BY = ["Branch Manager", "Store Supervisor", "Assistant Manager", "Shift In-Charge", "Stock Keeper"];
const MOCK_CLOSED_BY = ["Warehouse Admin", "Ravi Kumar", "Accounts Manager", "Srinivas Rao"];
const MOCK_PAYMENT_METHODS = ["UPI", "NEFT", "Cash", "Cheque", "Bank Transfer"];

function stageDetail(
  label: BranchOrderLifecycle,
  ev: { label: BranchOrderLifecycle; timestamp: string; done: boolean; current: boolean },
  order: BranchOrderDetail,
  h: number,
): Array<{ label: string; value: string }> {
  const ts = ev.timestamp && ev.timestamp !== "—" && ev.timestamp !== "---" ? ev.timestamp : order.orderDate;
  const dispatchInfo = order.dispatches.length > 0
    ? order.dispatches[0]
    : mockDispatchForOrder(order)[0];

  switch (label) {
    case "Order Placed":
      return [
        { label: "Order ID",        value: order.orderId },
        { label: "Branch",          value: order.branch },
        { label: "Requested Time",  value: order.orderDate + " " + order.orderTime },
        { label: "Products Ordered", value: order.items.map(i => i.product).join(", ") },
        { label: "Quantity",        value: order.items.map(i => `${i.orderedQty} ${i.unit} ${i.product}`).join(", ") },
        { label: "Priority",        value: order.priority },
      ];

    case "Warehouse Review": {
      const reviewer = MOCK_REVIEWERS[h % MOCK_REVIEWERS.length];
      const reviewStatus = order.items.some(i => i.rejectedQty > 0) ? "Partial Approval" : "Full Approval";
      const reviewNotes = order.items.some(i => i.rejectedQty > 0)
        ? `${order.items.filter(i => i.rejectedQty > 0).map(i => `${i.product}: ${i.rejectedQty} ${i.unit} unavailable`).join("; ")}`
        : "All items available in stock";
      return [
        { label: "Reviewed By",   value: reviewer },
        { label: "Review Time",   value: ts },
        { label: "Review Status", value: reviewStatus },
        { label: "Review Notes",  value: reviewNotes },
      ];
    }

    case "Approved": {
      const approver = MOCK_REVIEWERS[(h + 1) % MOCK_REVIEWERS.length];
      const remarks = order.items.length === order.items.filter(i => i.approvedQty > 0).length && order.items.every(i => i.rejectedQty === 0)
        ? "Full order approved — all items available"
        : `Partial approval: ${order.items.filter(i => i.rejectedQty > 0).map(i => `${i.product} short by ${i.rejectedQty} ${i.unit}`).join("; ")}`;
      return [
        { label: "Approved By",    value: approver },
        { label: "Approval Time",  value: ts },
        { label: "Remarks",        value: remarks },
      ];
    }

    case "Added To Production": {
      const addedBy = MOCK_SUPERVISORS[(h + 2) % MOCK_SUPERVISORS.length];
      const productReq = PRODUCTION_REQUIREMENTS;
      const batchId = productReq.find(r => order.items.some(i => i.product === r.product))?.batchNumber
        ?? `BT-2026-${100 + (h % 50)}`;
      return [
        { label: "Added By",   value: addedBy },
        { label: "Queue Time", value: ts },
        { label: "Batch ID",   value: batchId },
      ];
    }

    case "Production Started": {
      const supervisor = MOCK_SUPERVISORS[h % MOCK_SUPERVISORS.length];
      const line = MOCK_PROD_LINES[h % MOCK_PROD_LINES.length];
      return [
        { label: "Started Time",     value: ts },
        { label: "Supervisor",       value: supervisor },
        { label: "Production Line",  value: line },
      ];
    }

    case "Production Completed": {
      const batchNum = `BT-2026-${100 + (h % 50)}`;
      const totalProduced = order.items
        .map(i => `${i.approvedQty > 0 ? i.approvedQty : i.orderedQty} ${i.unit} ${i.product}`)
        .join(", ");
      const allApproved = order.items.every(i => i.rejectedQty === 0);
      return [
        { label: "Completed Time",  value: ts },
        { label: "Total Produced",  value: totalProduced },
        { label: "Batch Number",    value: batchNum },
        { label: "QC Status",       value: allApproved ? "Passed — No Issues" : "Passed with notes" },
      ];
    }

    case "Ready For Dispatch": {
      const packedBy = MOCK_PACKED_BY[h % MOCK_PACKED_BY.length];
      const pkgCount = order.items.reduce((s, i) => s + (i.approvedQty > 0 ? i.approvedQty : i.orderedQty), 0);
      const slot = dispatchInfo.slot;
      return [
        { label: "Ready Time",     value: ts },
        { label: "Packed By",      value: packedBy },
        { label: "Package Count",  value: `${pkgCount} ${order.items[0]?.unit ?? "units"}` },
        { label: "Dispatch Slot",  value: `${slot} Dispatch` },
      ];
    }

    case "Morning Dispatch":
    case "Evening Dispatch": {
      const slot = label === "Morning Dispatch" ? "Morning" : "Evening";
      return [
        { label: "Dispatch Time",  value: ts },
        { label: "Vehicle Number", value: dispatchInfo.vehicle },
        { label: "Driver Name",    value: dispatchInfo.representative },
        { label: "Dispatch Slot",  value: `${slot} Dispatch` },
      ];
    }

    case "In Transit": {
      const locs = ["Leaving Warehouse", "NH-16 Near Auto Nagar", "Benz Circle Junction", "MG Road Checkpoint", `Approaching ${order.branch}`];
      return [
        { label: "Current Status",    value: "In Transit" },
        { label: "Vehicle Number",    value: dispatchInfo.vehicle },
        { label: "Driver",            value: dispatchInfo.representative },
        { label: "Last Updated",      value: ts },
        { label: "Current Location",  value: locs[h % locs.length] },
      ];
    }

    case "Delivered": {
      const receiver = MOCK_RECEIVED_BY[h % MOCK_RECEIVED_BY.length];
      const hasShortage = order.deliveries.some(d => d.differenceQty > 0)
        || (order.deliveries.length === 0 && mockDeliveriesForOrder(order).some(d => d.differenceQty > 0));
      return [
        { label: "Delivered Time",  value: ts },
        { label: "Received By",     value: receiver },
        { label: "Delivery Notes",  value: hasShortage ? "Partial delivery — some items short" : "Full delivery — no issues" },
      ];
    }

    case "Awaiting Invoice": {
      const invoiceNote = `Delivery confirmed. Warehouse is reviewing and will generate invoice shortly.`;
      return [
        { label: "Delivery Time",   value: ts },
        { label: "Invoice Status",  value: "Awaiting Generation" },
        { label: "Notes",           value: invoiceNote },
      ];
    }

    case "Invoice Generated": {
      const invoiceNum = order.invoiceNumber ?? `INV-2026-${1000 + (h % 1000)}`;
      const billAmt = order.deliveredValue > 0 ? order.deliveredValue : order.orderValue;
      return [
        { label: "Invoice Number", value: invoiceNum },
        { label: "Invoice Date",   value: ts },
        { label: "Invoice Amount", value: formatCurrency(billAmt) },
      ];
    }

    case "Payment Pending": {
      const dueDate = order.orderDate;
      return [
        { label: "Pending Amount", value: formatCurrency(order.outstandingAmount) },
        { label: "Due Date",       value: dueDate },
      ];
    }

    case "Payment Completed": {
      if (order.paymentHistory.length > 0) {
        const p = order.paymentHistory[order.paymentHistory.length - 1];
        const txnId = p.reference ?? `TXN${h.toString().slice(0, 10)}`;
        return [
          { label: "Payment Method",  value: p.method },
          { label: "Transaction ID",  value: txnId },
          { label: "Payment Time",    value: p.date },
          { label: "Amount Paid",     value: formatCurrency(p.amount) },
        ];
      }
      const method = MOCK_PAYMENT_METHODS[h % MOCK_PAYMENT_METHODS.length];
      const txnId = `TXN${h.toString(16).toUpperCase().padStart(10, "0")}`;
      const paid = order.paidAmount > 0 ? order.paidAmount : order.orderValue;
      return [
        { label: "Payment Method",  value: method },
        { label: "Transaction ID",  value: txnId },
        { label: "Payment Time",    value: ts },
        { label: "Amount Paid",     value: formatCurrency(paid) },
      ];
    }

    case "Order Closed": {
      const closedBy = MOCK_CLOSED_BY[h % MOCK_CLOSED_BY.length];
      return [
        { label: "Closed By",        value: closedBy },
        { label: "Closed Time",      value: ts },
        { label: "Closing Remarks",  value: "Order fulfilled and payment received. Cycle complete." },
      ];
    }

    default:
      return [];
  }
}

function TabTimeline({ order }: { order: BranchOrderDetail }) {
  const h = hashStr(order.orderId);

  // ── Build merged timeline ────────────────────────────────────────────────
  // Live dispatch batches are the source of truth for dispatch/delivery stages.
  // Workflow order status covers pre-dispatch and post-delivery stages.

  const liveBatches = getDispatchBatchesForOrder(order.orderId).sort((a, b) => a.batchNumber - b.batchNumber);

  type MergedEvent = {
    key: string;
    label: string;
    timestamp: string;
    done: boolean;
    current: boolean;
    isBatch?: boolean;
    batchNumber?: number;
    batchSlot?: string;
    batchStatus?: string;
    driverName?: string;
    vehicleNumber?: string;
  };

  // Workflow events up to (but not including) dispatch-related stages when we have live batches
  const DISPATCH_STAGES_SET = new Set<BranchOrderLifecycle>([
    "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
    "In Transit", "Delivered", "Partially Delivered",
  ]);

  // Post-delivery workflow events (Awaiting Invoice and beyond)
  const POST_DELIVERY_STAGES: BranchOrderLifecycle[] = [
    "Awaiting Invoice", "Invoice Generated", "Payment Pending",
    "Payment Verification Pending", "Payment Completed", "Order Closed",
  ];
  const POST_DELIVERY_SET = new Set<BranchOrderLifecycle>(POST_DELIVERY_STAGES);

  // Pre-dispatch workflow events (exclude dispatch stages AND post-delivery stages to avoid duplication)
  const preDispatchEvents: MergedEvent[] = order.timelineEvents
    .filter(ev => !DISPATCH_STAGES_SET.has(ev.label) && !POST_DELIVERY_SET.has(ev.label))
    .map((ev, i) => ({ key: `wf-${i}`, label: ev.label, timestamp: ev.timestamp, done: ev.done, current: ev.current }));

  const postDeliveryEvents: MergedEvent[] = order.timelineEvents
    .filter(ev => POST_DELIVERY_STAGES.includes(ev.label))
    .map((ev, i) => ({ key: `post-${i}`, label: ev.label, timestamp: ev.timestamp, done: ev.done, current: ev.current }));

  // Batch-derived events
  const batchEvents: MergedEvent[] = [];
  if (liveBatches.length > 0) {
    for (const batch of liveBatches) {
      const slotLabel = batch.slot === "Morning" ? "Morning Dispatch" : "Evening Dispatch";

      // Scheduled
      batchEvents.push({
        key: `batch-${batch.batchId}-scheduled`,
        label: `${slotLabel} Scheduled`,
        timestamp: batch.createdAt,
        done: batch.status !== "Scheduled",
        current: batch.status === "Scheduled",
        isBatch: true,
        batchNumber: batch.batchNumber,
        batchSlot: batch.slot,
        batchStatus: "Scheduled",
        driverName: batch.driverName,
        vehicleNumber: batch.vehicleNumber,
      });

      // In Transit
      batchEvents.push({
        key: `batch-${batch.batchId}-intransit`,
        label: `${slotLabel} In Transit`,
        timestamp: batch.status === "In Transit" || batch.status === "Delivered" ? batch.dispatchTime : "—",
        done: batch.status === "Delivered",
        current: batch.status === "In Transit",
        isBatch: true,
        batchNumber: batch.batchNumber,
        batchSlot: batch.slot,
        batchStatus: "In Transit",
        driverName: batch.driverName,
        vehicleNumber: batch.vehicleNumber,
      });

      // Delivered
      batchEvents.push({
        key: `batch-${batch.batchId}-delivered`,
        label: `${slotLabel} Delivered`,
        timestamp: batch.deliveredAt ?? "—",
        done: batch.status === "Delivered",
        current: false,
        isBatch: true,
        batchNumber: batch.batchNumber,
        batchSlot: batch.slot,
        batchStatus: "Delivered",
        driverName: batch.driverName,
        vehicleNumber: batch.vehicleNumber,
      });
    }
  } else {
    // No live batches: fall back to workflow dispatch events
    order.timelineEvents
      .filter(ev => DISPATCH_STAGES_SET.has(ev.label))
      .forEach((ev, i) => preDispatchEvents.push({ key: `wf-dispatch-${i}`, label: ev.label, timestamp: ev.timestamp, done: ev.done, current: ev.current }));
  }

  // Merge: pre-dispatch → batch events → post-delivery
  const mergedEvents: MergedEvent[] = [
    ...preDispatchEvents,
    ...batchEvents,
    ...postDeliveryEvents,
  ];

  // If there are no batch events, show all workflow events as-is (orders that haven't reached dispatch)
  const timelineToRender = batchEvents.length > 0 ? mergedEvents : order.timelineEvents.map((ev, i) => ({
    key: `wf-all-${i}`, label: ev.label, timestamp: ev.timestamp, done: ev.done, current: ev.current,
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Full lifecycle of this order from placement to payment.</p>
      <div className="relative pl-8">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
        {timelineToRender.map((ev, i) => {
          // For workflow events, compute detail cards using stageDetail helper
          const wfLabel = ev.label as BranchOrderLifecycle;
          const details: Array<{ label: string; value: string }> = (ev.done || ev.current)
            ? ev.isBatch
              ? [
                  { label: "Batch", value: `Batch ${ev.batchNumber} — ${ev.batchSlot} Dispatch` },
                  { label: "Driver", value: ev.driverName ?? "—" },
                  { label: "Vehicle", value: ev.vehicleNumber ?? "—" },
                  { label: "Time", value: ev.timestamp && ev.timestamp !== "—" ? ev.timestamp : "—" },
                ]
              : stageDetail(wfLabel, { label: wfLabel, timestamp: ev.timestamp, done: ev.done, current: ev.current }, order, h)
            : [];

          return (
            <div key={ev.key} className={`relative mb-4 ${ev.current || ev.done ? "" : "opacity-50"}`}>
              <div className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                ev.current ? "border-[#0B2C66] bg-[#0B2C66] text-white ring-4 ring-[#0B2C66]/20"
                : ev.done ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-slate-200 bg-white"
              }`}>
                {ev.done && !ev.current ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
              </div>
              <div className={`rounded-xl border px-4 py-3 ${
                ev.current ? "border-[#0B2C66]/30 bg-[#EEF4FF]"
                : ev.done ? "border-emerald-200 bg-emerald-50/50"
                : "border-slate-200 bg-white"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${ev.current ? "text-[#0B2C66]" : ev.done ? "text-emerald-700" : "text-slate-400"}`}>
                    {ev.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {ev.isBatch && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ev.batchSlot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                        Batch {ev.batchNumber}
                      </span>
                    )}
                    {ev.current && <span className="rounded-full bg-[#0B2C66] px-2 py-0.5 text-[10px] font-bold text-white">Current</span>}
                  </div>
                </div>
                {details.length > 0 ? (
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {details.map(d => (
                      <div key={d.label} className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{d.label}</p>
                        <p className="text-xs font-semibold text-slate-700 truncate" title={d.value}>{d.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">Waiting for this stage</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Derive deterministic stage timestamps from order date+time ────────────────
// Each stage gets a fixed offset (in minutes) after the order placement time.
const STAGE_OFFSETS_MIN: Partial<Record<BranchOrderLifecycle, number>> = {
  "Order Placed":           0,
  "Warehouse Review":      15,
  "Approved":              45,
  "Added To Production":   60,
  "Production Started":    90,
  "Production Completed": 270,
  "Ready For Dispatch":   300,
  "Morning Dispatch":     330,
  "Evening Dispatch":     570,
  "In Transit":           360,
  "Delivered":            420,
  "Awaiting Invoice":     435,
  "Invoice Generated":    450,
  "Payment Pending":      450,
  "Payment Completed":    510,
  "Order Closed":         540,
};

function deriveStageTimestamp(orderDate: string, orderTime: string, stage: BranchOrderLifecycle): string {
  try {
    const base = new Date(`${orderDate} ${orderTime}`);
    if (isNaN(base.getTime())) return orderDate;
    const offset = STAGE_OFFSETS_MIN[stage] ?? 0;
    const d = new Date(base.getTime() + offset * 60 * 1000);
    const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return `${datePart} ${timePart}`;
  } catch {
    return orderDate;
  }
}
function workflowStatusToLifecycle(s: string): BranchOrderLifecycle {
  const map: Record<string, BranchOrderLifecycle> = {
    "Order Placed":         "Order Placed",
    "Under Review":         "Warehouse Review",
    "Pending Review":       "Pending Review",
    "Approved":             "Approved",
    "Partially Approved":   "Partially Approved",
    "Rejected":             "Rejected",
    "Resubmitted":          "Resubmitted",
    "Added To Production":  "Added To Production",
    "Production Started":   "Production Started",
    "Production Completed": "Production Completed",
    "Ready For Dispatch":   "Ready For Dispatch",
    "Morning Dispatch":     "Morning Dispatch",
    "Evening Dispatch":     "Evening Dispatch",
    "In Transit":           "In Transit",
    "Delivered":            "Delivered",
    "Awaiting Invoice":     "Awaiting Invoice",
    "Invoice Generated":    "Invoice Generated",
    "Payment Pending":                 "Payment Pending",
    "Payment Verification Pending":    "Payment Verification Pending",
    "Payment Completed":               "Payment Completed",
    "Order Closed":                    "Order Closed",
  };
  return (map[s] ?? "Warehouse Review") as BranchOrderLifecycle;
}

// ── Map WarehouseOrderStatus → BranchOrderLifecycle ──────────────────────────
function warehouseStatusToLifecycle(s: WarehouseOrderStatus): BranchOrderLifecycle {
  const map: Record<WarehouseOrderStatus, BranchOrderLifecycle> = {
    "Under Review":       "Warehouse Review",
    "Approved":           "Approved",
    "Production Started": "Production Started",
    "Ready For Dispatch": "Ready For Dispatch",
    "Morning Dispatch":   "Morning Dispatch",
    "Evening Dispatch":   "Evening Dispatch",
    "Delivered":          "Delivered",
  };
  return map[s] ?? "Warehouse Review";
}

// ── Convert SubmittedOrder → BranchOrderDetail ────────────────────────────────
function submittedToDetail(o: SubmittedOrder, liveStatus?: WarehouseOrderStatus, storedAmount?: number): BranchOrderDetail {
  const lifecycleStatus: BranchOrderLifecycle = liveStatus
    ? warehouseStatusToLifecycle(liveStatus)
    : "Warehouse Review";
  const steps = ALL_STEPS;
  const currentIdx = steps.indexOf(lifecycleStatus);
  // Use stored amount from warehouseOrders, or calculate from catalog
  const orderValue = (storedAmount && storedAmount > 0)
    ? storedAmount
    : calcOrderAmount(o.items.map(i => ({ name: i.name, qty: i.qty })));
  return {
    orderId: o.orderId,
    branch: o.branch,
    orderDate: o.timestamp.split(" ")[0] + " " + o.timestamp.split(" ")[1] + " " + (o.timestamp.split(" ")[2] ?? ""),
    orderTime: o.timestamp.split(" ").slice(3).join(" "),
    expectedDelivery: "Pending warehouse approval",
    priority: o.items.some(i => i.priority === "Urgent") ? "Urgent" : "Normal",
    lifecycleStatus,
    orderValue,
    deliveredValue: 0,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: orderValue,
    paymentIntent: "Payment Pending",
    invoiceNumber: undefined,
    scenario: "full-delivery",
    items: o.items.map(i => ({ product: i.name, orderedQty: i.qty, approvedQty: 0, rejectedQty: 0, unit: "units" })),
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: steps.map((step, i) => ({
      label: step,
      timestamp: i <= currentIdx ? deriveStageTimestamp(
        o.timestamp.split(" ").slice(0, 3).join(" "),
        o.timestamp.split(" ").slice(3).join(" "),
        step
      ) : "—",
      done: i < currentIdx,
      current: i === currentIdx,
    })),
  };
}
export function MyOrdersPage() {
  const currentBranch = getCurrentDemoBranchName();
  const branchOrders = BRANCH_MY_ORDERS.filter(o => o.branch === currentBranch);
  const mockOrders = branchOrders.length > 0 ? branchOrders : BRANCH_MY_ORDERS;

  function buildSubmittedOrders(): BranchOrderDetail[] {
    const warehouseOrders = getWarehouseOrders();
    const warehouseMap = Object.fromEntries(warehouseOrders.map(o => [o.orderId, o]));

    // Also check workflowOrders for updated statuses
    const workflowOrders = getWorkflowOrders();
    const workflowStatusMap = Object.fromEntries(workflowOrders.map(o => [o.id, o.status]));

    return getSubmittedOrders()
      .filter(o => o.branch === currentBranch)
      .map(o => {
        const warehouseEntry = warehouseMap[o.orderId];
        // Prefer workflowOrders status if available (more complete lifecycle)
        const wfStatus = workflowStatusMap[o.orderId];
        if (wfStatus) {
          const lifecycleStatus = workflowStatusToLifecycle(wfStatus);
          const steps = ALL_STEPS;
          const currentIdx = steps.indexOf(lifecycleStatus);
          const wfOrder = workflowOrders.find(w => w.id === o.orderId);
          // Use wfOrder.value if set, else fall back to warehouseEntry.amount, else calculate
          const orderValue = (wfOrder?.value && wfOrder.value > 0)
            ? wfOrder.value
            : (warehouseEntry?.amount && warehouseEntry.amount > 0)
              ? warehouseEntry.amount
              : calcOrderAmount(o.items.map(i => ({ name: i.name, qty: i.qty })));
          return {
            orderId: o.orderId,
            branch: o.branch,
            orderDate: o.timestamp.split(" ")[0] + " " + o.timestamp.split(" ")[1] + " " + (o.timestamp.split(" ")[2] ?? ""),
            orderTime: o.timestamp.split(" ").slice(3).join(" "),
            expectedDelivery: "Pending warehouse approval",
            priority: o.items.some(i => i.priority === "Urgent") ? "Urgent" : "Normal",
            lifecycleStatus,
            orderValue,
            deliveredValue: 0,
            cancelledValue: 0,
            paidAmount: 0,
            outstandingAmount: orderValue,
            paymentIntent: "Payment Pending" as const,
            invoiceNumber: wfOrder?.invoiceNumber,
            scenario: "full-delivery" as const,
            items: (wfOrder?.items ?? o.items.map(i => ({ product: i.name, orderedQty: i.qty, approvedQty: 0, rejectedQty: 0, unit: "units" }))),
            dispatches: [],
            deliveries: [],
            paymentHistory: [],
            timelineEvents: steps.map((step, i) => ({
              label: step,
              timestamp: i <= currentIdx ? deriveStageTimestamp(
                o.timestamp.split(" ").slice(0, 3).join(" "),
                o.timestamp.split(" ").slice(3).join(" "),
                step
              ) : "—",
              done: i < currentIdx,
              current: i === currentIdx,
            })),
          } as BranchOrderDetail;
        }
        return submittedToDetail(o, warehouseEntry?.status, warehouseEntry?.amount);
      });
  }

  // Build live branch orders from workflowOrders that belong to this branch
  function buildLiveBranchOrders(): BranchOrderDetail[] {
    return getWorkflowOrders()
      .filter(o => o.branch === currentBranch)
      .map(o => {
        const lifecycleStatus = workflowStatusToLifecycle(o.status);
        const steps = ALL_STEPS;
        const currentIdx = steps.indexOf(lifecycleStatus);
        return {
          orderId: o.id,
          branch: o.branch,
          orderDate: o.date,
          orderTime: o.time,
          expectedDelivery: o.isAdvanceOrder && o.deliveryDate ? `Advance — ${o.deliveryDate}` : "Per dispatch schedule",
          priority: o.priority,
          lifecycleStatus,
          orderValue: o.value,
          deliveredValue: o.invoiceNumber ? getInvoiceSubtotal(o.id) : 0,
          cancelledValue: 0,
          paidAmount: o.status === "Payment Completed" || o.status === "Order Closed" ? getInvoiceAmount(o.id) : 0,
          outstandingAmount: getOutstandingAmount(o.id),
          paymentIntent: (o.status === "Payment Completed" || o.status === "Order Closed" ? "Payment Completed" : "Payment Pending") as "Payment Completed" | "Payment Pending",
          invoiceNumber: o.invoiceNumber,
          scenario: "full-delivery" as const,
          items: o.items,
          dispatches: [],
          deliveries: [],
          paymentHistory: [],
          timelineEvents: steps.map((step, i) => ({
            label: step,
            timestamp: i <= currentIdx ? deriveStageTimestamp(o.date, o.time, step) : "—",
            done: i < currentIdx,
            current: i === currentIdx,
          })),
          isAdvanceOrder: o.isAdvanceOrder,
          occasion: o.occasion,
          deliveryDate: o.deliveryDate,
        } as BranchOrderDetail;
      });
  }

  const [submittedOrders, setSubmittedOrders] = useState<BranchOrderDetail[]>(() => buildSubmittedOrders());
  const [liveBranchOrders, setLiveBranchOrders] = useState<BranchOrderDetail[]>(() => buildLiveBranchOrders());

  useEffect(() => {
    function sync() {
      setSubmittedOrders(buildSubmittedOrders());
      setLiveBranchOrders(buildLiveBranchOrders());
    }
    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);
    // Poll every 2 seconds so batch status changes from warehouse propagate immediately
    const interval = setInterval(sync, 2000);
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
      clearInterval(interval);
    };
  }, [currentBranch]);

  // Merge: liveBranchOrders (from workflowOrders) takes priority over submittedOrders (duplicates removed)
  // Then append mockOrders for orders that aren't in either live source
  const liveIds = new Set(liveBranchOrders.map(o => o.orderId));
  const submittedNotInLive = submittedOrders.filter(o => !liveIds.has(o.orderId));
  const allLiveAndSubmitted = [...liveBranchOrders, ...submittedNotInLive];
  const allIds = new Set(allLiveAndSubmitted.map(o => o.orderId));
  const mockNotInLive = mockOrders.filter(o => !allIds.has(o.orderId));
  const ordersToShow = [...allLiveAndSubmitted, ...mockNotInLive];

  const [selectedId, setSelectedId] = useState<string>(() =>
    [...submittedOrders, ...mockOrders][0]?.orderId ?? mockOrders[0]?.orderId
  );
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showInvoice, setShowInvoice] = useState(false);

  const selected = ordersToShow.find(o => o.orderId === selectedId) ?? ordersToShow[0];

  function smartTab(status: BranchOrderLifecycle): Tab {
    if (status === "Warehouse Review" || status === "Order Placed" || status === "Approved"
      || status === "Pending Review" || status === "Partially Approved" || status === "Rejected" || status === "Resubmitted") return "overview";
    if (status === "Added To Production" || status === "Production Started" || status === "Production Completed") return "production";
    if (status === "Ready For Dispatch" || status === "Morning Dispatch" || status === "Evening Dispatch" || status === "In Transit") return "dispatches";
    if (status === "Delivered" || status === "Awaiting Invoice") return "deliveries";
    if (status === "Invoice Generated" || status === "Payment Pending" || status === "Payment Verification Pending" || status === "Payment Completed" || status === "Order Closed") return "financials";
    return "overview";
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "My Orders")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">My Orders</h2>
        <p className="mt-1 text-slate-500">
          Full lifecycle visibility &mdash; Order &rarr; Approval &rarr; Production &rarr; Dispatch &rarr; Delivery &rarr; Payment
        </p>
      </div>

      <div className="flex gap-4 items-start">
        {/* Scrollable order list */}
        <div className="w-full xl:w-[340px] shrink-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {ordersToShow.length} Orders
          </p>
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
            {ordersToShow.map(order => (
              <OrderCard
                key={order.orderId}
                order={order}
                selected={order.orderId === selectedId}
                onSelect={() => {
                  setSelectedId(order.orderId);
                  setActiveTab(smartTab(order.lifecycleStatus));
                }}
              />
            ))}
          </div>
        </div>

        {/* Sticky detail panel */}
        <div className="flex-1 min-w-0 sticky top-4">
          <div className="rounded-xl border border-slate-200 bg-white">
            {/* Tabs */}
            <div className="overflow-x-auto border-b border-slate-100">
              <div className="flex min-w-max">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-b-2 border-[#0B2C66] text-[#0B2C66]" : "text-slate-500 hover:text-slate-700"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-5 max-h-[calc(100vh-220px)] overflow-y-auto">
              {activeTab === "overview"   && <TabOverview order={selected} />}
              {activeTab === "products"   && <TabProducts order={selected} />}
              {activeTab === "production" && <TabProduction order={selected} />}
              {activeTab === "dispatches" && <TabDispatches order={selected} />}
              {activeTab === "deliveries" && <TabDeliveries order={selected} />}
              {activeTab === "financials" && (
                <TabFinancials
                  order={selected}
                  showInvoice={showInvoice}
                  setShowInvoice={setShowInvoice}
                />
              )}
              {activeTab === "timeline"   && <TabTimeline order={selected} />}
            </div>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}


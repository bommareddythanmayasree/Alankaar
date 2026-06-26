import { useState, useEffect } from "react";
import {
  Zap, CheckCircle2, Clock, Package, Truck, CreditCard,
  AlertTriangle, Calendar, Receipt, PlayCircle, Sun, Moon,
  Download, CheckSquare, Flag,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  BRANCH_MY_ORDERS,
  BRANCH_PRODUCTION_STATUS,
  ALL_STEPS,
  type BranchOrderDetail,
  type BranchOrderLifecycle,
  type PaymentIntent,
} from "../../../shared/data/workflow-mock-data";
import { getCurrentDemoBranchName, getSubmittedOrders, getWarehouseOrders, getWorkflowOrders, calcOrderAmount, type SubmittedOrder, type WarehouseOrderStatus } from "../../../shared/lib/demo-store";

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
  if (s === "Order Closed")        return { badge: "bg-slate-200 text-slate-700",     dot: "bg-slate-500" };
  if (s === "Payment Completed")   return { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  if (s === "Payment Pending")     return { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  if (s === "Invoice Generated")   return { badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Delivered")           return { badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-500" };
  if (s === "In Transit")          return { badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-400" };
  if (s === "Morning Dispatch" || s === "Evening Dispatch")
                                   return { badge: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500" };
  if (s === "Ready For Dispatch")  return { badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" };
  if (s === "Production Completed")return { badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500" };
  if (s === "Production Started")  return { badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" };
  if (s === "Added To Production") return { badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500" };
  if (s === "Approved")            return { badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Warehouse Review")    return { badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  return { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

function bannerConfig(s: BranchOrderLifecycle) {
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

function slotIcon(slot: string) {
  if (slot === "Morning") return <Sun className="h-4 w-4 text-amber-500" />;
  return <Moon className="h-4 w-4 text-indigo-500" />;
}

const INTENT_OPTIONS: PaymentIntent[] = [
  "Ready To Pay", "Will Pay Later", "Payment Pending", "Payment Completed",
];

function intentColor(i: PaymentIntent) {
  if (i === "Ready To Pay")       return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (i === "Will Pay Later")     return "border-indigo-300 bg-indigo-50 text-indigo-700";
  if (i === "Payment Completed")  return "border-teal-300 bg-teal-50 text-teal-700";
  return "border-amber-300 bg-amber-50 text-amber-700";
}

function fmt(v: number) {
  return `\u20B9${v.toLocaleString("en-IN")}`;
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
      {(s === "Warehouse Review" || s === "Order Placed") && (
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

      {s === "Approved" && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Approval Details</p>
          <div className="grid grid-cols-3 gap-3">
            {order.items.map(item => (
              <div key={item.product} className="rounded-lg bg-white px-3 py-2.5 border border-teal-100">
                <p className="text-[10px] text-slate-400 uppercase truncate">{item.product}</p>
                <p className="text-sm font-semibold text-teal-700">{item.approvedQty} {item.unit}</p>
                {item.rejectedQty > 0 && <p className="text-[10px] text-red-500">&minus;{item.rejectedQty} cancelled</p>}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
            <span className="text-teal-700">Approved by Warehouse Manager · Entering production shortly</span>
          </div>
        </div>
      )}

      {(s === "Added To Production" || s === "Production Started") && (() => {
        const prods = BRANCH_PRODUCTION_STATUS[order.orderId];
        const overall = prods ? Math.round(prods.reduce((a, p) => a + p.pct, 0) / prods.length) : 0;
        return (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Production Progress</p>
              <span className="text-lg font-bold text-blue-700">{overall}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-blue-100">
              <div className="h-2.5 rounded-full bg-blue-500 transition-all" style={{ width: `${overall}%` }} />
            </div>
            {prods && prods.map(p => (
              <div key={p.product} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-blue-100 text-sm">
                <span className="font-medium text-slate-700">{p.product}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-blue-100">
                    <div className="h-1.5 rounded-full bg-blue-400" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${prodStatusColors(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
            <p className="text-xs text-blue-600">Expected completion: {order.expectedDelivery}</p>
          </div>
        );
      })()}

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

      {s === "Invoice Generated" && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-2">
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
              <th className="px-4 py-3 text-right">Ordered</th>
              <th className="px-4 py-3 text-right">Approved</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Cancelled</th>
              <th className="px-4 py-3">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map(item => {
              const pending = Math.max(0, item.orderedQty - item.approvedQty - item.rejectedQty);
              return (
                <tr key={item.product} className={`hover:bg-slate-50 ${item.rejectedQty > 0 ? "bg-amber-50/40" : ""}`}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.orderedQty}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">{item.approvedQty}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600">{pending}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.rejectedQty > 0 ? "text-red-500" : "text-slate-300"}`}>{item.rejectedQty}</td>
                  <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabProduction({ order }: { order: BranchOrderDetail }) {
  const COMPLETED_STAGES: BranchOrderLifecycle[] = [
    "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
    "Delivered", "Invoice Generated", "Payment Pending", "Payment Completed",
  ];
  const isPastProduction = COMPLETED_STAGES.includes(order.lifecycleStatus);

  const prodStatuses =
    BRANCH_PRODUCTION_STATUS[order.orderId] ??
    (
      order.lifecycleStatus === "Production Started"
        ? order.items.map((item, index) => ({
            product: item.product,
            status: "Production Started" as const,
            pct: index % 2 === 0 ? 40 : 70,
          }))
        : isPastProduction
          ? order.items.map(item => ({
              product: item.product,
              status: "Ready For Dispatch" as const,
              pct: 100,
            }))
          : null
    );

  if (!prodStatuses || prodStatuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Clock className="mb-3 h-10 w-10" />
        <p className="text-sm">Production hasn&apos;t started for this order yet.</p>
        <p className="mt-1 text-xs">Status: {order.lifecycleStatus}</p>
      </div>
    );
  }

  const overall = Math.round(prodStatuses.reduce((s, p) => s + p.pct, 0) / prodStatuses.length);

  const completionEvent = order.timelineEvents.find(
    e => e.label === "Ready For Dispatch" || e.label === "Production Started"
  );
  const completionTime = completionEvent?.done || completionEvent?.current
    ? completionEvent.timestamp
    : null;

  return (
    <div className="space-y-4">
      {isPastProduction && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Production Completed</p>
            {completionTime && (
              <p className="text-xs text-emerald-600">Completed: {completionTime}</p>
            )}
          </div>
        </div>
      )}

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
    </div>
  );
}

function TabDispatches({ order }: { order: BranchOrderDetail }) {
  if (order.dispatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Truck className="mb-3 h-10 w-10" />
        <p className="text-sm">No dispatches scheduled yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {order.dispatches.map((d, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slotIcon(d.slot)}
              <span className="font-semibold text-slate-800">{d.slot} Dispatch</span>
              <span className="text-xs text-slate-500">&middot; {d.time}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dispatchStatusColor(d.status)}`}>{d.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Representative</p>
              <p className="text-sm font-semibold text-slate-800">{d.representative}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Vehicle</p>
              <p className="text-sm font-semibold text-slate-800">{d.vehicle}</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Products</p>
            <div className="flex flex-wrap gap-2">
              {d.products.map(p => (
                <span key={p.name} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                  {p.name} &mdash; {p.qty} {p.unit}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabDeliveries({ order }: { order: BranchOrderDetail }) {
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [reported, setReported] = useState<Set<string>>(new Set());

  if (order.deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-slate-400">
        <Package className="mb-3 h-10 w-10" />
        <p className="text-sm">No deliveries confirmed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {order.scenario === "partial-delivery" && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>Partial delivery &mdash; some quantities short due to production constraints. Bill reflects delivered quantities only.</span>
        </div>
      )}

      <div className="space-y-3">
        {order.deliveries.map(d => {
          const isConfirmed = confirmed.has(d.product);
          const isReported = reported.has(d.product);
          return (
            <div key={d.product} className={`rounded-xl border p-4 ${isConfirmed ? "border-emerald-200 bg-emerald-50/40" : isReported ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold text-slate-800">{d.product}</span>
                </div>
                {isConfirmed && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Receipt Confirmed</span>}
                {isReported && !isConfirmed && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Difference Reported</span>}
              </div>

              <div className="mb-3 grid grid-cols-4 gap-2">
                {[
                  { label: "Ordered",     value: d.orderedQty,   color: "text-slate-700" },
                  { label: "Delivered",   value: d.deliveredQty, color: "text-emerald-700 font-bold" },
                  { label: "Received",    value: d.receivedQty,  color: "text-slate-700" },
                  { label: "Difference",  value: d.differenceQty > 0 ? `-${d.differenceQty}` : "0", color: d.differenceQty > 0 ? "text-red-600 font-bold" : "text-slate-400" },
                ].map(c => (
                  <div key={c.label} className="rounded-lg bg-slate-50 px-2 py-2 text-center">
                    <div className={`text-sm ${c.color}`}>{c.value} {d.unit}</div>
                    <div className="text-[10px] text-slate-400">{c.label}</div>
                  </div>
                ))}
              </div>

              {d.reason && (
                <p className="mb-3 text-xs text-slate-500">Reason: <span className="font-medium text-slate-700">{d.reason}</span></p>
              )}

              {!isConfirmed && (
                <div className="flex gap-2">
                  <button onClick={() => setConfirmed(prev => new Set([...prev, d.product]))}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <CheckSquare className="h-3.5 w-3.5" />Confirm Receipt
                  </button>
                  {d.differenceQty > 0 && !isReported && (
                    <button onClick={() => setReported(prev => new Set([...prev, d.product]))}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors">
                      <Flag className="h-3.5 w-3.5" />Report Difference
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TabFinancials({ order, intentMap, setIntentMap, onGenerateBill, showInvoice, setShowInvoice }: {
  order: BranchOrderDetail;
  intentMap: Record<string, PaymentIntent>;
  setIntentMap: (m: Record<string, PaymentIntent>) => void;
  onGenerateBill: () => void;
  showInvoice: boolean;
  setShowInvoice: (v: boolean) => void;
}) {
  const currentIntent = intentMap[order.orderId] ?? order.paymentIntent;
  const isSettled = order.lifecycleStatus === "Payment Completed" || currentIntent === "Payment Completed";
  const billableValue = order.deliveredValue > 0 ? order.deliveredValue : order.orderValue;

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Ordered Value",   value: fmt(order.orderValue),        bg: "bg-slate-50",    color: "text-slate-800",  border: "border-slate-200" },
          { label: "Delivered Value", value: fmt(billableValue),           bg: "bg-emerald-50",  color: "text-emerald-700", border: "border-emerald-200" },
          { label: "Paid Amount",     value: fmt(order.paidAmount),        bg: "bg-teal-50",     color: "text-teal-700",   border: "border-teal-200" },
          { label: "Outstanding",     value: fmt(order.outstandingAmount), bg: order.outstandingAmount > 0 ? "bg-amber-50" : "bg-slate-50", color: order.outstandingAmount > 0 ? "text-amber-700" : "text-slate-400", border: order.outstandingAmount > 0 ? "border-amber-200" : "border-slate-200" },
        ].map(c => (
          <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} px-4 py-3`}>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className={`mt-1 text-base font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {order.cancelledValue > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
          <span className="text-red-500 font-semibold">Cancelled / Short Supply:</span>
          <span className="font-bold text-red-600">{fmt(order.cancelledValue)}</span>
          <span className="ml-auto text-xs text-red-400">Not included in bill</span>
        </div>
      )}

      {order.invoiceNumber ? (
        <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 px-5 py-3">
          <Receipt className="h-5 w-5 shrink-0 text-teal-600" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-teal-800">Bill Generated</p>
            <p className="text-xs text-teal-600">{order.invoiceNumber} &middot; {order.orderDate}</p>
          </div>
          <button onClick={() => setShowInvoice(true)}
            className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors">
            <Download className="h-3.5 w-3.5" />View Invoice
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-500">
          <Receipt className="h-4 w-4 text-slate-400" />
          Invoice will be generated after delivery confirmation.
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment Status</p>
        <div className="flex flex-wrap gap-2">
          {INTENT_OPTIONS.map(opt => (
            <button key={opt}
              onClick={() => !isSettled && setIntentMap({ ...intentMap, [order.orderId]: opt })}
              disabled={isSettled}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-default ${currentIntent === opt ? intentColor(opt) : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
              {opt}
            </button>
          ))}
        </div>

        {!isSettled && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button onClick={onGenerateBill}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2C66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#092757] transition-colors">
              <Receipt className="h-3.5 w-3.5" />Generate Bill
            </button>
            {order.invoiceNumber && (
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Download className="h-3.5 w-3.5" />Download Invoice
              </button>
            )}
          </div>
        )}

        {isSettled && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">Payment Complete &mdash; Thank You!</span>
          </div>
        )}
      </div>

      {order.paymentHistory.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Payment History</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.paymentHistory.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-slate-600">{p.date}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-800">{fmt(p.amount)}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">{p.method}</span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-400">{p.reference}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <div className="flex justify-between"><span className="text-slate-600">GST (5%)</span><span>{fmt(Math.round(billableValue * 0.05))}</span></div>
            </div>
            <div className="mt-3 flex justify-between text-base font-bold">
              <span>Total Payable</span>
              <span className="text-[#0B2C66]">{fmt(Math.round(billableValue * 1.05))}</span>
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

function TabTimeline({ order }: { order: BranchOrderDetail }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Full lifecycle of this order from placement to payment.</p>
      <div className="relative pl-8">
        <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-200" />
        {order.timelineEvents.map((ev, i) => (
          <div key={i} className={`relative mb-4 ${ev.current || ev.done ? "" : "opacity-50"}`}>
            <div className={`absolute -left-8 flex h-7 w-7 items-center justify-center rounded-full border-2 ${ev.current ? "border-[#0B2C66] bg-[#0B2C66] text-white ring-4 ring-[#0B2C66]/20" : ev.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white"}`}>
              {ev.done && !ev.current ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
            </div>
            <div className={`rounded-xl border px-4 py-3 ${ev.current ? "border-[#0B2C66]/30 bg-[#EEF4FF]" : ev.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${ev.current ? "text-[#0B2C66]" : ev.done ? "text-emerald-700" : "text-slate-400"}`}>{ev.label}</span>
                {ev.current && <span className="rounded-full bg-[#0B2C66] px-2 py-0.5 text-[10px] font-bold text-white">Current</span>}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{ev.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Map WorkflowLifecycleStatus → BranchOrderLifecycle ──────────────────────
function workflowStatusToLifecycle(s: string): BranchOrderLifecycle {
  const map: Record<string, BranchOrderLifecycle> = {
    "Order Placed":         "Order Placed",
    "Under Review":         "Warehouse Review",
    "Approved":             "Approved",
    "Added To Production":  "Added To Production",
    "Production Started":   "Production Started",
    "Production Completed": "Production Completed",
    "Ready For Dispatch":   "Ready For Dispatch",
    "Morning Dispatch":     "Morning Dispatch",
    "Evening Dispatch":     "Evening Dispatch",
    "In Transit":           "In Transit",
    "Delivered":            "Delivered",
    "Invoice Generated":    "Invoice Generated",
    "Payment Pending":      "Payment Pending",
    "Payment Completed":    "Payment Completed",
    "Order Closed":         "Order Closed",
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
      timestamp: i === 0 ? o.timestamp : "\u2014",
      done: i < currentIdx,
      current: i === currentIdx,
    })),
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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
              timestamp: i === 0 ? o.timestamp : "—",
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
          expectedDelivery: "Per dispatch schedule",
          priority: o.priority,
          lifecycleStatus,
          orderValue: o.value,
          deliveredValue: o.status === "Delivered" || o.status === "Invoice Generated" || o.status === "Payment Pending" || o.status === "Payment Completed" || o.status === "Order Closed" ? o.value : 0,
          cancelledValue: 0,
          paidAmount: o.status === "Payment Completed" || o.status === "Order Closed" ? o.value : 0,
          outstandingAmount: o.status === "Payment Completed" || o.status === "Order Closed" ? 0 : o.value,
          paymentIntent: (o.status === "Payment Completed" || o.status === "Order Closed" ? "Payment Completed" : "Payment Pending") as "Payment Completed" | "Payment Pending",
          invoiceNumber: o.invoiceNumber,
          scenario: "full-delivery" as const,
          items: o.items,
          dispatches: [],
          deliveries: [],
          paymentHistory: [],
          timelineEvents: steps.map((step, i) => ({
            label: step,
            timestamp: i === 0 ? o.date + " " + o.time : "—",
            done: i < currentIdx,
            current: i === currentIdx,
          })),
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
    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
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
  const [intentMap, setIntentMap] = useState<Record<string, PaymentIntent>>({});
  const [showInvoice, setShowInvoice] = useState(false);

  const selected = ordersToShow.find(o => o.orderId === selectedId) ?? ordersToShow[0];

  function smartTab(status: BranchOrderLifecycle): Tab {
    if (status === "Warehouse Review" || status === "Order Placed" || status === "Approved") return "overview";
    if (status === "Added To Production" || status === "Production Started" || status === "Production Completed") return "production";
    if (status === "Ready For Dispatch" || status === "Morning Dispatch" || status === "Evening Dispatch" || status === "In Transit") return "dispatches";
    if (status === "Delivered") return "deliveries";
    if (status === "Invoice Generated" || status === "Payment Pending" || status === "Payment Completed" || status === "Order Closed") return "financials";
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
                  intentMap={intentMap}
                  setIntentMap={setIntentMap}
                  onGenerateBill={() => setShowInvoice(true)}
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


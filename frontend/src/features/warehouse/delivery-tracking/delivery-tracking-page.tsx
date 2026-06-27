import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Truck, AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { MOCK_DELIVERY_EXCEPTIONS } from "../../../shared/data/workflow-mock-data";
import {
  getWorkflowOrders,
  getDeliveryExceptions,
  confirmDelivery,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
  type DeliveryExceptionRecord,
  type DeliveryExceptionItem,
  type DeliveryExceptionType,
} from "../../../shared/lib/demo-store";

// ── Stages shown in this module ───────────────────────────────────────────────
// "Delivered" is included so that orders marked Delivered from Orders Workflow
// immediately appear in the Awaiting Confirmation table without a page refresh.
const DISPATCH_STAGE_STATUSES: WorkflowLifecycleStatus[] = [
  "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
];

// Statuses that indicate an order has been through delivery confirmation
const POST_DELIVERY_STATUSES: WorkflowLifecycleStatus[] = [
  "Delivered", "Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function exceptionBadge(type: DeliveryExceptionType) {
  if (!type) return null;
  const cfg = {
    "Partially Produced":    { bg: "bg-amber-100 text-amber-700",   label: "Partially Produced" },
    "Missing During Loading":{ bg: "bg-orange-100 text-orange-700", label: "Missing During Loading" },
    "Lost During Transit":   { bg: "bg-red-100 text-red-700",       label: "Lost During Transit" },
  }[type];
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function deliveryStatusBadge(status: "Delivered Successfully" | "Partial Delivery") {
  return status === "Delivered Successfully"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";
}

// ── Exception item row builder ────────────────────────────────────────────────
function buildDefaultExceptionItem(
  product: string,
  unit: string,
  orderedQty: number,
): DeliveryExceptionItem {
  return {
    product,
    unit,
    orderedQty,
    producedQty: orderedQty,
    loadedQty: orderedQty,
    receivedQty: orderedQty,
    difference: 0,
    exceptionType: null,
    exceptionReason: "",
  };
}

// ── Delivery Confirmation Modal ───────────────────────────────────────────────
const EXCEPTION_REASONS: Record<NonNullable<DeliveryExceptionType>, string[]> = {
  "Partially Produced":    ["Insufficient raw materials", "Production capacity reached", "Quality rejected"],
  "Missing During Loading":["Loading mistake", "Item left in warehouse", "Driver error"],
  "Lost During Transit":   ["Package lost", "Transit damage", "Mishandled during transport"],
};

function DeliveryConfirmModal({
  order,
  onClose,
  onConfirm,
}: {
  order: WorkflowOrderLive;
  onClose: () => void;
  onConfirm: (record: DeliveryExceptionRecord) => void;
}) {
  const [items, setItems] = useState<DeliveryExceptionItem[]>(
    order.items.map(i =>
      buildDefaultExceptionItem(i.product, i.unit, i.approvedQty > 0 ? i.approvedQty : i.orderedQty)
    )
  );

  function updateItem(idx: number, patch: Partial<DeliveryExceptionItem>) {
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[idx], ...patch };
      // Auto-recalculate difference
      updated.difference = updated.receivedQty - updated.orderedQty;
      // Auto-derive exceptionType when qtys change
      if (!patch.exceptionType) {
        if (updated.producedQty < updated.orderedQty) {
          updated.exceptionType = "Partially Produced";
        } else if (updated.loadedQty < updated.producedQty) {
          updated.exceptionType = "Missing During Loading";
        } else if (updated.receivedQty < updated.loadedQty) {
          updated.exceptionType = "Lost During Transit";
        } else {
          updated.exceptionType = null;
          updated.exceptionReason = "";
        }
      }
      next[idx] = updated;
      return next;
    });
  }

  function handleConfirm() {
    const hasException = items.some(i => i.difference < 0);
    const deliveryStatus = hasException ? "Partial Delivery" : "Delivered Successfully";
    // Derive receivedValue from receivedQty proportional to order value
    const totalOrdered = items.reduce((s, i) => s + i.orderedQty, 0);
    const totalReceived = items.reduce((s, i) => s + i.receivedQty, 0);
    const receivedValue = totalOrdered > 0
      ? Math.round((totalReceived / totalOrdered) * order.value)
      : order.value;
    onConfirm({
      orderId: order.id,
      branch: order.branch,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      items,
      orderValue: order.value,
      receivedValue,
      deliveryStatus,
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Delivery Confirmation</h3>
              <p className="text-xs text-slate-500 mt-0.5">{order.id} — {order.branch}</p>
            </div>
            <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">Enter actual quantities received. Exception types are detected automatically.</p>
          {items.map((item, idx) => (
            <div key={item.product} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{item.product}</span>
                <span className="text-xs text-slate-400">Ordered: {item.orderedQty} {item.unit}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-slate-500">Produced Qty</span>
                  <input type="number" min={0} max={item.orderedQty} value={item.producedQty}
                    onChange={e => updateItem(idx, { producedQty: Number(e.target.value), loadedQty: Math.min(Number(e.target.value), item.loadedQty), receivedQty: Math.min(Number(e.target.value), item.loadedQty, item.receivedQty) })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-[#0A3A92]" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-slate-500">Loaded Qty</span>
                  <input type="number" min={0} max={item.producedQty} value={item.loadedQty}
                    onChange={e => updateItem(idx, { loadedQty: Number(e.target.value), receivedQty: Math.min(Number(e.target.value), item.receivedQty) })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-[#0A3A92]" />
                </label>
                <label className="space-y-1">
                  <span className="text-xs text-slate-500">Received Qty</span>
                  <input type="number" min={0} max={item.loadedQty} value={item.receivedQty}
                    onChange={e => updateItem(idx, { receivedQty: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-[#0A3A92]" />
                </label>
              </div>
              {item.exceptionType && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500">Exception Type</span>
                    <div>{exceptionBadge(item.exceptionType)}</div>
                  </div>
                  <label className="space-y-1">
                    <span className="text-xs text-slate-500">Reason</span>
                    <select value={item.exceptionReason}
                      onChange={e => updateItem(idx, { exceptionReason: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#0A3A92]">
                      <option value="">Select reason…</option>
                      {EXCEPTION_REASONS[item.exceptionType].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          ))}
          <button onClick={handleConfirm}
            className="w-full rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
            Confirm Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exception Table ───────────────────────────────────────────────────────────
function ExceptionTable({ record }: { record: DeliveryExceptionRecord }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-2">Product</th>
            <th className="px-4 py-2 text-right">Ordered</th>
            <th className="px-4 py-2 text-right">Produced</th>
            <th className="px-4 py-2 text-right">Loaded</th>
            <th className="px-4 py-2 text-right">Received</th>
            <th className="px-4 py-2 text-right">Difference</th>
            <th className="px-4 py-2">Exception Reason</th>
            <th className="px-4 py-2">Delivery Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {record.items.map(item => {
            const hasException = item.difference < 0;
            const deliveryStatus = hasException ? "Partial Delivery" : "Delivered Successfully";
            return (
              <tr key={item.product} className={`hover:bg-slate-50 ${hasException ? "bg-amber-50/30" : ""}`}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{item.product}</td>
                <td className="px-4 py-2.5 text-right text-slate-600">{item.orderedQty} {item.unit}</td>
                <td className={`px-4 py-2.5 text-right font-semibold ${item.producedQty < item.orderedQty ? "text-amber-600" : "text-slate-700"}`}>
                  {item.producedQty} {item.unit}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${item.loadedQty < item.producedQty ? "text-orange-600" : "text-slate-700"}`}>
                  {item.loadedQty} {item.unit}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${item.receivedQty < item.loadedQty ? "text-red-600" : "text-emerald-600"}`}>
                  {item.receivedQty} {item.unit}
                </td>
                <td className={`px-4 py-2.5 text-right font-semibold ${hasException ? "text-red-600" : "text-slate-400"}`}>
                  {hasException ? `${item.difference} ${item.unit}` : "—"}
                </td>
                <td className="px-4 py-2.5">
                  {item.exceptionType
                    ? <div className="space-y-0.5">
                        {exceptionBadge(item.exceptionType)}
                        {item.exceptionReason && <p className="text-[10px] text-slate-500">{item.exceptionReason}</p>}
                      </div>
                    : <span className="text-slate-400">—</span>
                  }
                </td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${deliveryStatusBadge(deliveryStatus)}`}>
                    {deliveryStatus}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function DeliveryTrackingPage() {
  const [inTransitOrders, setInTransitOrders] = useState<WorkflowOrderLive[]>([]);
  const [confirmedRecords, setConfirmedRecords] = useState<DeliveryExceptionRecord[]>([]);
  const [confirmingOrder, setConfirmingOrder] = useState<WorkflowOrderLive | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    const all = getWorkflowOrders();
    const saved = getDeliveryExceptions();
    const savedIds = new Set(saved.map(r => r.orderId));

    // Awaiting confirmation: in-transit/dispatched orders AND "Delivered" orders
    // that haven't been confirmed yet (no saved exception record).
    setInTransitOrders(
      all.filter(o =>
        DISPATCH_STAGE_STATUSES.includes(o.status as WorkflowLifecycleStatus) &&
        !savedIds.has(o.id)
      )
    );

    // Confirmation records: saved (live) exceptions first, then mock exceptions
    // for orders that are in a post-delivery status and not already saved.
    const merged = [
      ...saved,
      ...MOCK_DELIVERY_EXCEPTIONS.filter(r => {
        if (savedIds.has(r.orderId)) return false;
        const order = all.find(o => o.id === r.orderId);
        // Include mock record if order has passed through delivery or doesn't exist in live data
        return !order || POST_DELIVERY_STATUSES.includes(order.status as WorkflowLifecycleStatus);
      }),
    ];
    setConfirmedRecords(merged);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleConfirm(record: DeliveryExceptionRecord) {
    confirmDelivery(record);
    setConfirmingOrder(null);
    showToast(`Delivery confirmed & invoice auto-generated for ${record.orderId}`);
    load();
  }

  const totalPartial = confirmedRecords.filter(r => r.deliveryStatus === "Partial Delivery").length;
  const totalDelivered = confirmedRecords.filter(r => r.deliveryStatus === "Delivered Successfully").length;

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Delivery Tracking")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Delivery Tracking</h2>
        <p className="mt-1 text-slate-500">
          Dispatch Loading → In Transit → Delivery Confirmation. Track exceptions per product.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "In Transit",           value: inTransitOrders.length,  bg: "bg-sky-50",     color: "text-sky-600",     Icon: Truck },
          { label: "Awaiting Confirmation", value: inTransitOrders.length, bg: "bg-amber-50",   color: "text-amber-600",   Icon: ClipboardList },
          { label: "Partial Delivery",      value: totalPartial,           bg: "bg-orange-50",  color: "text-orange-600",  Icon: AlertTriangle },
          { label: "Delivered Successfully",value: totalDelivered,         bg: "bg-emerald-50", color: "text-emerald-600", Icon: PackageCheck },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${c.bg}`}>
              <c.Icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* In Transit — Awaiting Confirmation */}
      {inTransitOrders.length > 0 && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-white">
          <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50 px-5 py-3 rounded-t-xl">
            <Truck className="h-4 w-4 text-sky-600" />
            <span className="font-semibold text-sky-800">Orders In Transit — Awaiting Delivery Confirmation</span>
            <span className="ml-auto rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">{inTransitOrders.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inTransitOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1B4DB1]">{order.id}</td>
                    <td className="px-5 py-3 text-slate-700">{order.branch}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${order.priority === "Urgent" ? "text-red-600" : "text-slate-500"}`}>{order.priority}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 text-xs">
                      {order.items.map(i => `${i.product}: ${i.approvedQty > 0 ? i.approvedQty : i.orderedQty} ${i.unit}`).join(", ")}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">₹{order.value.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">{order.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setConfirmingOrder(order)}
                        className="rounded-md bg-[#0B2C66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors">
                        Confirm Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Confirmation Records */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <PackageCheck className="h-4 w-4 text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Delivery Confirmation Records</h3>
          <p className="ml-1 text-xs text-slate-400">Invoice auto-generated on delivery using received quantity</p>
          <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{confirmedRecords.length}</span>
        </div>

        {confirmedRecords.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No delivery confirmations yet. Confirm deliveries for in-transit orders above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {confirmedRecords.map(record => (
              <div key={record.orderId} className="px-5 py-4">
                <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-[#0B2C66]">{record.orderId}</span>
                    <span className="text-sm text-slate-600">{record.branch}</span>
                    <span className="text-xs text-slate-400">{record.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.orderValue != null && record.orderValue !== record.receivedValue && (
                      <>
                        <span className="text-xs text-slate-500">Actual Order Amount:</span>
                        <span className="font-semibold text-slate-800">₹{record.orderValue.toLocaleString("en-IN")}</span>
                        <span className="text-slate-300">|</span>
                      </>
                    )}
                    <span className="text-xs text-slate-500">Invoice Amount:</span>
                    <span className="font-semibold text-slate-800">₹{record.receivedValue.toLocaleString("en-IN")}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${deliveryStatusBadge(record.deliveryStatus)}`}>
                      {record.deliveryStatus}
                    </span>
                    {record.deliveryStatus === "Delivered Successfully"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />
                    }
                  </div>
                </div>
                <ExceptionTable record={record} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation modal */}
      {confirmingOrder && (
        <DeliveryConfirmModal
          order={confirmingOrder}
          onClose={() => setConfirmingOrder(null)}
          onConfirm={handleConfirm}
        />
      )}
    </ErpLayout>
  );
}

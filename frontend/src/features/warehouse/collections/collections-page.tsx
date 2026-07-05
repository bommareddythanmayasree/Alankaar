import { useState, useEffect, useCallback } from "react";
import { Banknote, AlertCircle, CheckCircle2, DollarSign, X, FileText, Package } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  getOrderDeliveryConfirmation,
  getProductSellingPrice,
  markPaymentReceived,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

// All statuses that should appear in Collections
const COLLECTION_STATUSES: WorkflowLifecycleStatus[] = [
  "Invoice Generated",
  "Payment Pending",
  "Payment Verification Pending",
  "Payment Completed",
  "Order Closed",
];

type FilterTab = "All" | "Payment Pending" | "Payment Verification Pending" | "Payment Completed" | "Order Closed";

function fmt(v: number) { return `₹${v.toLocaleString("en-IN")}`; }

function paymentStatusBadge(status: WorkflowLifecycleStatus) {
  if (status === "Order Closed")                  return "bg-slate-100 text-slate-600";
  if (status === "Payment Completed")             return "bg-emerald-100 text-emerald-700";
  if (status === "Payment Verification Pending")  return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700"; // Payment Pending / Invoice Generated
}


function orderStatusBadge(status: WorkflowLifecycleStatus) {
  if (status === "Order Closed")      return "bg-slate-100 text-slate-600";
  if (status === "Payment Completed") return "bg-emerald-100 text-emerald-700";
  return "bg-blue-100 text-blue-700"; // Delivered
}

function derivePaymentStatus(status: WorkflowLifecycleStatus): string {
  if (status === "Order Closed" || status === "Payment Completed") return "Payment Completed";
  if (status === "Payment Verification Pending") return "Payment Verification Pending";
  return "Payment Pending"; // Invoice Generated or Payment Pending
}


function deriveOrderStatus(status: WorkflowLifecycleStatus): string {
  if (status === "Order Closed") return "Order Closed";
  return "Delivered";
}

// ── Invoice Preview Modal ────────────────────────────────────────────────────

function InvoiceModal({
  order,
  onClose,
}: {
  order: WorkflowOrderLive;
  onClose: () => void;
}) {
  // order.value is the pre-tax subtotal (delivered qty × unit price)
  const subtotal = order.value;
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  // Get delivered qty per product from delivery confirmation
  const conf = getOrderDeliveryConfirmation(order.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-600" />
            <span className="font-semibold text-slate-800">Invoice — {order.invoiceNumber ?? "—"}</span>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Order ID</div>
              <div className="font-mono font-semibold text-[#0B2C66]">{order.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Branch</div>
              <div className="font-medium text-slate-800">{order.branch}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Delivery Date</div>
              <div className="text-slate-700">{order.deliveredDate ?? order.date}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide">Status</div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusBadge(order.status as WorkflowLifecycleStatus)}`}>
                {derivePaymentStatus(order.status as WorkflowLifecycleStatus)}
              </span>
            </div>
          </div>

          <table className="mb-4 w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-right">Delivered Qty</th>
                <th className="px-3 py-2 text-right">Unit Price</th>
                <th className="px-3 py-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, i) => {
                const confLine = conf?.lines.find(l => l.product === item.product);
                const deliveredQty = confLine
                  ? confLine.deliveredQty
                  : (item.approvedQty > 0 ? item.approvedQty : item.orderedQty);
                const unitPrice = getProductSellingPrice(item.product);
                const lineTotal = Math.round(deliveredQty * unitPrice);
                return (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-700">{item.product}</td>
                    <td className="px-3 py-2 text-right font-medium text-emerald-700">{deliveredQty} {item.unit}</td>
                    <td className="px-3 py-2 text-right text-slate-500">₹{unitPrice.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">₹{lineTotal.toLocaleString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (5%)</span>
              <span>{fmt(gst)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-3">
          <button onClick={onClose}
            className="w-full rounded-lg bg-slate-100 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function CollectionsPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [filter, setFilter] = useState<FilterTab>("All");
  const [toast, setToast] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<WorkflowOrderLive | null>(null);

  const loadOrders = useCallback(() => {
    const filtered = getWorkflowOrders().filter(o =>
      COLLECTION_STATUSES.includes(o.status as WorkflowLifecycleStatus)
    );
    setOrders(filtered);
  }, []);

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
    };
  }, [loadOrders]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleMarkPaymentReceived(orderId: string) {
    markPaymentReceived(orderId);
    showToast(`Payment received — Order ${orderId} closed automatically`);
    loadOrders();
  }

  // ── Metrics ──────────────────────────────────────────────────────────────
  const outstanding = orders
    .filter(o => o.status === "Invoice Generated" || o.status === "Payment Pending" || o.status === "Payment Verification Pending")
    .reduce((s, o) => s + Math.round(o.value * 1.05), 0);

  const collected = orders
    .filter(o => o.status === "Payment Completed" || o.status === "Order Closed")
    .reduce((s, o) => s + Math.round(o.value * 1.05), 0);

  const pendingPaymentsCount = orders.filter(o => o.status === "Payment Pending").length;

  const closedOrdersCount = orders.filter(o => o.status === "Order Closed").length;

  // ── Filter logic ─────────────────────────────────────────────────────────
  const TABS: FilterTab[] = ["All", "Payment Pending", "Payment Verification Pending", "Payment Completed", "Order Closed"];

  const rows = filter === "All"
    ? orders
    : filter === "Payment Pending"
      ? orders.filter(o => o.status === "Invoice Generated" || o.status === "Payment Pending")
      : filter === "Payment Verification Pending"
        ? orders.filter(o => o.status === "Payment Verification Pending")
        : filter === "Payment Completed"
          ? orders.filter(o => o.status === "Payment Completed")
          : orders.filter(o => o.status === "Order Closed");

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Collections")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {previewOrder && (
        <InvoiceModal order={previewOrder} onClose={() => setPreviewOrder(null)} />
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Collections</h2>
        <p className="mt-1 text-slate-500">
          Mark payments received — orders close automatically on payment completion.
        </p>
      </div>

      {/* ── Dashboard Cards ──────────────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Outstanding Amount",
            value: fmt(outstanding),
            bg: "bg-[#FFE6D2]",
            color: "text-orange-600",
            Icon: AlertCircle,
          },
          {
            label: "Collected Amount",
            value: fmt(collected),
            bg: "bg-[#E2FFE6]",
            color: "text-emerald-600",
            Icon: CheckCircle2,
          },
          {
            label: "Pending Payments",
            value: pendingPaymentsCount,
            bg: "bg-[#FFF3CB]",
            color: "text-amber-600",
            Icon: Banknote,
          },
          {
            label: "Closed Orders",
            value: closedOrdersCount,
            bg: "bg-[#E9EDFF]",
            color: "text-indigo-600",
            Icon: Package,
          },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ───────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === tab
                ? "bg-[#0B2C66] text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab}
            {tab === "Payment Pending" && pendingPaymentsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingPaymentsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          <DollarSign className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          No invoices yet. Orders appear here automatically after delivery confirmation.
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          No orders match this filter.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Delivery Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3">Order Status</th>
                  <th className="px-5 py-3">Payment Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(order => {
                  const isPending = order.status === "Payment Verification Pending";
                  const isClosed  = order.status === "Order Closed";
                  const paymentDate = isClosed ? (order.deliveredDate ?? "27 Jun 2026") : null;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0B2C66]">
                        {order.id}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-violet-700">
                        {order.invoiceNumber ?? "—"}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">
                        {order.branch}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {order.deliveredDate ?? order.date}
                        {order.deliveredTime && (
                          <span className="ml-1 text-slate-400">{order.deliveredTime}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-800">
                        {fmt(Math.round(order.value * 1.05))}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentStatusBadge(order.status as WorkflowLifecycleStatus)}`}>
                          {derivePaymentStatus(order.status as WorkflowLifecycleStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusBadge(order.status as WorkflowLifecycleStatus)}`}>
                          {deriveOrderStatus(order.status as WorkflowLifecycleStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {paymentDate ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewOrder(order)}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                            View Invoice
                          </button>
                          {isPending && (
                            <button
                              onClick={() => handleMarkPaymentReceived(order.id)}
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

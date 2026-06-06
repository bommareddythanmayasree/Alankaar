import { useMemo, useState } from "react";
import { CreditCard, FileText, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_TRACKING_ORDERS } from "../../../shared/data/branch-mock-data";
import { useOrders } from "../../../app/branch/branch-context";
import { useWarehouseForBranch } from "../../../app/warehouse/warehouse-context";

type TrackingStatus =
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Payment Completed"
  | "Packed"
  | "Dispatched"
  | "In Transit"
  | "Delivered";

const SIDEBAR_LABELS = [
  "Dashboard",
  "Employee Management",
  "Product Catalog",
  "Shopping Cart",
  "Checkout",
  "Order Tracking",
  "Order History",
  "Notifications",
  "Settings",
] as const;

const TIMELINE: TrackingStatus[] = [
  "Pending Approval",
  "Approved",
  "Payment Completed",
  "Packed",
  "Dispatched",
  "In Transit",
  "Delivered",
];

function statusColor(status: string) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  if (status === "Approved" || status === "Payment Completed") return "bg-indigo-100 text-indigo-700";
  if (status === "Pending Approval") return "bg-amber-100 text-amber-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderTrackingPage() {
  const { orders: contextOrders, payOrder } = useOrders();
  const { invoices } = useWarehouseForBranch();

  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [invoicePreviewOrderId, setInvoicePreviewOrderId] = useState<string | null>(null);

  // Merge context orders (new) with seed orders, context orders first
  const allOrders = useMemo(() => {
    const mapped = contextOrders.map((o) => ({
      orderId: o.orderId,
      orderDate: o.orderDate,
      expectedDelivery: o.expectedDelivery,
      currentStatus: o.currentStatus as TrackingStatus,
      amount: o.amount,
      branch: o.branch,
      items: o.items,
      statusHistory: o.statusHistory,
      paymentCompleted: o.paymentCompleted,
      invoiceNumber: o.invoiceNumber,
      paymentMethod: o.paymentMethod,
    }));
    // Map seed orders to new status format (they have "Order Placed" → "Approved" → etc.)
    const seedMapped = BRANCH_TRACKING_ORDERS.map((o) => {
      const mappedStatus = o.currentStatus === ("Order Placed" as string)
        ? "Pending Approval"
        : o.currentStatus;
      return {
        ...o,
        currentStatus: mappedStatus as TrackingStatus,
        paymentCompleted: false,
        invoiceNumber: undefined,
        paymentMethod: undefined,
      };
    });
    return [...mapped, ...seedMapped];
  }, [contextOrders]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const effectiveId = selectedOrderId ?? allOrders[0]?.orderId;
  const selected = allOrders.find((o) => o.orderId === effectiveId) ?? allOrders[0];
  const currentIdx = useMemo(
    () => TIMELINE.indexOf(selected?.currentStatus as TrackingStatus),
    [selected]
  );

  // Find invoice for selected order
  const invoice = useMemo(
    () => invoices.find((inv) => inv.orderId === selected?.orderId),
    [invoices, selected]
  );

  const isApproved =
    selected?.currentStatus === "Approved" ||
    selected?.currentStatus === "Payment Completed" ||
    selected?.currentStatus === "Packed" ||
    selected?.currentStatus === "Dispatched" ||
    selected?.currentStatus === "In Transit" ||
    selected?.currentStatus === "Delivered";

  const canPay =
    isApproved &&
    !selected?.paymentCompleted &&
    selected?.currentStatus !== "Delivered" &&
    selected?.currentStatus !== "Payment Completed";

  const handlePay = async () => {
    if (!selected) return;
    setPayingOrderId(selected.orderId);
    await new Promise((r) => setTimeout(r, 1200));
    payOrder(selected.orderId);
    setPayingOrderId(null);
  };

  if (!selected) return null;

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Order Tracking")}>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Timeline */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Status Timeline</h3>
            <select
              value={effectiveId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
            >
              {allOrders.map((order) => (
                <option key={order.orderId} value={order.orderId}>
                  {order.orderId}
                </option>
              ))}
            </select>
          </div>

          {/* Visual timeline */}
          <div className="overflow-x-auto">
            <div className="flex min-w-[700px] items-start gap-0">
              {TIMELINE.map((status, idx) => {
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={status} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && (
                        <div className={`h-1 flex-1 ${done ? "bg-[#0A3A92]" : "bg-slate-200"}`} />
                      )}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold border-2 ${
                          isCurrent
                            ? "border-[#0A3A92] bg-[#0A3A92] text-white ring-4 ring-[#0A3A92]/20"
                            : done
                            ? "border-[#0A3A92] bg-[#0A3A92] text-white"
                            : "border-slate-300 bg-white text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < TIMELINE.length - 1 && (
                        <div
                          className={`h-1 flex-1 ${
                            done && idx < currentIdx ? "bg-[#0A3A92]" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-center text-xs ${
                        done ? "font-semibold text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval pending info box */}
          {selected.currentStatus === "Pending Approval" && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Waiting for warehouse approval</p>
              <p className="mt-1 text-xs text-amber-700">
                Payment and invoice will be available once the warehouse approves your order.
              </p>
            </div>
          )}

          {/* Rejected info box */}
          {selected.currentStatus === "Rejected" && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="font-semibold">Order Rejected</p>
              <p className="mt-1 text-xs text-rose-700">
                This order was rejected by the warehouse. Please place a new order.
              </p>
            </div>
          )}

          {/* Status history */}
          {selected.statusHistory.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Status History</h4>
              <div className="space-y-2">
                {selected.statusHistory.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm"
                  >
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#0A3A92]" />
                    <div>
                      <span className="font-semibold text-slate-800">{h.status}</span>
                      <span className="ml-2 text-slate-500 text-xs">{h.timestamp}</span>
                      <span className="ml-2 text-xs text-slate-400">by {h.by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Order Details */}
        <aside className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="text-xl font-semibold">Order Details</h3>
          <div className="mt-3 space-y-2 text-sm">
            <DetailRow label="Order ID" value={selected.orderId} />
            <DetailRow label="Branch" value={selected.branch} />
            <DetailRow label="Order Date" value={selected.orderDate} />
            <DetailRow label="Expected Delivery" value={selected.expectedDelivery} />
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(
                  selected.currentStatus
                )}`}
              >
                {selected.currentStatus}
              </span>
            </div>
            <DetailRow
              label="Total Amount"
              value={`₹${new Intl.NumberFormat("en-IN").format(selected.amount)}`}
            />
            {selected.paymentMethod && (
              <DetailRow label="Payment Method" value={selected.paymentMethod} />
            )}
            {selected.invoiceNumber && (
              <DetailRow label="Invoice" value={selected.invoiceNumber} />
            )}
          </div>

          {/* Invoice + Pay buttons — only shown after approval */}
          {isApproved && (
            <div className="mt-4 space-y-2">
              {invoice && (
                <button
                  onClick={() => setInvoicePreviewOrderId(selected.orderId)}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#0A3A92] px-4 py-2.5 text-sm font-semibold text-[#0A3A92] hover:bg-[#EEF4FF]"
                >
                  <FileText className="h-4 w-4" />
                  View Invoice
                </button>
              )}
              {canPay && (
                <button
                  onClick={handlePay}
                  disabled={payingOrderId === selected.orderId}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#0A3A92] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#083173] disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  {payingOrderId === selected.orderId ? "Processing..." : "Pay Now"}
                </button>
              )}
              {selected.paymentCompleted && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 font-semibold text-center">
                  ✓ Payment Completed
                </div>
              )}
            </div>
          )}

          <div className="mt-4 rounded-md border border-slate-200 bg-[#F8FAFD] p-3">
            <p className="mb-2 text-sm font-semibold">Products</p>
            <div className="space-y-1.5">
              {selected.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm text-slate-700"
                >
                  <span>{item.name}</span>
                  <span className="text-slate-500">x {item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Invoice Preview Modal */}
      {invoicePreviewOrderId && invoice && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[820px] rounded-xl border border-slate-200 bg-white p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice — {invoice.invoiceNumber}</h3>
              <button
                onClick={() => setInvoicePreviewOrderId(null)}
                className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#0A3A92]">ALANKAR ERP</p>
                  <p className="text-sm text-slate-600">Warehouse Invoice</p>
                </div>
                <div className="text-right text-sm">
                  <p><span className="font-semibold">Invoice:</span> {invoice.invoiceNumber}</p>
                  <p><span className="font-semibold">Order:</span> {invoice.orderId}</p>
                  <p><span className="font-semibold">Branch:</span> {invoice.branch}</p>
                  <p><span className="font-semibold">Date:</span> {invoice.issuedDate}</p>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFD] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.product} className="border-t border-slate-100">
                      <td className="px-2 py-2">{item.product}</td>
                      <td className="px-2 py-2">{item.quantity}</td>
                      <td className="px-2 py-2">&#8377;{item.price}</td>
                      <td className="px-2 py-2">&#8377;{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto max-w-[260px] text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({invoice.gstPercent}%)</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(invoice.gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-[#0A3A92]">
                  <span>Total Amount</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(invoice.totalAmount)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setInvoicePreviewOrderId(null)}
                className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold"
              >
                Close
              </button>
              {canPay && (
                <button
                  onClick={() => { setInvoicePreviewOrderId(null); handlePay(); }}
                  disabled={payingOrderId === selected.orderId}
                  className="h-10 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white hover:bg-[#083173]"
                >
                  Pay Now — &#8377;{new Intl.NumberFormat("en-IN").format(invoice.totalAmount)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

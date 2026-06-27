import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle2, Package, X, Info } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  getDeliveryException,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

function fmt(v: number) { return `₹${v.toLocaleString("en-IN")}`; }

export function InvoiceGenerationPage() {
  const [invoicedOrders, setInvoicedOrders] = useState<WorkflowOrderLive[]>([]);
  const [previewOrder, setPreviewOrder] = useState<WorkflowOrderLive | null>(null);

  const INVOICED_STATUSES: WorkflowLifecycleStatus[] = [
    "Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed",
  ];

  const loadOrders = useCallback(() => {
    const all = getWorkflowOrders();
    setInvoicedOrders(
      all.filter(o => INVOICED_STATUSES.includes(o.status as WorkflowLifecycleStatus))
    );
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

  const paidCount = invoicedOrders.filter(o =>
    o.status === "Payment Completed" || o.status === "Order Closed"
  ).length;
  const pendingCount = invoicedOrders.filter(o =>
    o.status === "Invoice Generated" || o.status === "Payment Pending"
  ).length;

  return (
    <ErpLayout
      title="Invoice Registry"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Invoice Generation")}
    >
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Invoice Registry</h2>
        <p className="mt-1 text-slate-500">Invoices are auto-generated when the delivery rep confirms delivery using actual delivered quantity.</p>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
        <div>
          <span className="font-semibold">Automatic Invoice Generation — </span>
          When the Delivery Representative confirms delivery, the system automatically generates an invoice
          using the actual delivered quantity (e.g. Delivered 8 Kg × Rate = Invoice Amount).
          Difference reports remain available in Delivery Tracking for warehouse resolution.
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600"><FileText size={18} /></div>
          <div className="text-2xl font-bold text-violet-700">{invoicedOrders.length}</div>
          <div className="text-xs text-slate-500">Total Invoices Generated</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Package size={18} /></div>
          <div className="text-2xl font-bold text-amber-700">{pendingCount}</div>
          <div className="text-xs text-slate-500">Invoice Generated / Payment Pending</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></div>
          <div className="text-2xl font-bold text-emerald-700">{paidCount}</div>
          <div className="text-xs text-slate-500">Payment Completed / Closed</div>
        </div>
      </div>

      {invoicedOrders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No invoices yet. Invoices are automatically generated when delivery is confirmed.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <FileText className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-800">Generated Invoices</h3>
            <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{invoicedOrders.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Delivered On</th>
                  <th className="px-5 py-3 text-right">Invoice Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoicedOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-violet-700">{order.invoiceNumber ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#0B2C66]">{order.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{order.branch}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {order.deliveredDate
                        ? <>{order.deliveredDate}{order.deliveredTime ? <span className="ml-1 text-xs text-slate-400">{order.deliveredTime}</span> : null}</>
                        : order.date}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(order.value)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        order.status === "Payment Completed" || order.status === "Order Closed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => setPreviewOrder(order)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[720px] rounded-xl border border-slate-200 bg-white p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button onClick={() => setPreviewOrder(null)} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#0A3A92]">ALANKAR ERP</p>
                  <p className="text-sm text-slate-600">Warehouse Invoice</p>
                </div>
                <div className="text-right text-sm space-y-0.5">
                  <p><span className="font-semibold">Invoice:</span> {previewOrder.invoiceNumber}</p>
                  <p><span className="font-semibold">Order ID:</span> {previewOrder.id}</p>
                  <p><span className="font-semibold">Branch:</span> {previewOrder.branch}</p>
                  <p><span className="font-semibold">Delivered:</span> {previewOrder.deliveredDate ?? previewOrder.date}{previewOrder.deliveredTime ? ` ${previewOrder.deliveredTime}` : ""}</p>
                </div>
              </div>
              <div className="mb-3 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-700">
                Invoice calculated on actual delivered quantity
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2 text-right">Ordered</th>
                    <th className="px-2 py-2 text-right">Delivered</th>
                    <th className="px-2 py-2">Unit</th>
                    <th className="px-2 py-2 text-right">Rate</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewOrder.items.map(item => {
                    const exception = getDeliveryException(previewOrder.id);
                    const excItem = exception?.items.find(e => e.product === item.product);
                    const delivered = excItem ? excItem.receivedQty : (item.approvedQty > 0 ? item.approvedQty : item.orderedQty);
                    const totalOrdered = previewOrder.items.reduce((s, i) => {
                      const exc = exception?.items.find(e => e.product === i.product);
                      return s + (exc ? exc.orderedQty : (i.approvedQty > 0 ? i.approvedQty : i.orderedQty));
                    }, 0);
                    const totalDelivered = previewOrder.items.reduce((s, i) => {
                      const exc = exception?.items.find(e => e.product === i.product);
                      return s + (exc ? exc.receivedQty : (i.approvedQty > 0 ? i.approvedQty : i.orderedQty));
                    }, 0);
                    const unitRate = totalDelivered > 0
                      ? Math.round((previewOrder.value / totalDelivered) * 100) / 100
                      : 0;
                    const amount = Math.round(delivered * unitRate);
                    return (
                      <tr key={item.product} className="border-t border-slate-100">
                        <td className="px-2 py-2">{item.product}</td>
                        <td className="px-2 py-2 text-right text-slate-400">{item.orderedQty}</td>
                        <td className="px-2 py-2 text-right font-semibold text-emerald-700">{delivered}</td>
                        <td className="px-2 py-2">{item.unit}</td>
                        <td className="px-2 py-2 text-right text-slate-500">₹{unitRate.toLocaleString("en-IN")}</td>
                        <td className="px-2 py-2 text-right font-semibold">₹{amount.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 ml-auto max-w-[240px] text-sm">
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0A3A92]">
                  <span>Total (Delivered Qty)</span>
                  <span>{fmt(previewOrder.value)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setPreviewOrder(null)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

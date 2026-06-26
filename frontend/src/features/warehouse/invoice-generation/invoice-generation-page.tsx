import { useState, useEffect, useCallback } from "react";
import { FileText, CheckCircle2, Package, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  setWorkflowOrderInvoice,
  nextDemoInvoiceNumber,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

function fmt(v: number) { return `₹${v.toLocaleString("en-IN")}`; }

export function InvoiceGenerationPage() {
  const [deliveredOrders, setDeliveredOrders] = useState<WorkflowOrderLive[]>([]);
  const [invoicedOrders, setInvoicedOrders] = useState<WorkflowOrderLive[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<WorkflowOrderLive | null>(null);

  const loadOrders = useCallback(() => {
    const all = getWorkflowOrders();
    setDeliveredOrders(all.filter(o => o.status === "Delivered"));
    setInvoicedOrders(all.filter(o =>
      (["Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed"] as WorkflowLifecycleStatus[])
        .includes(o.status as WorkflowLifecycleStatus)
    ));
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
    setTimeout(() => setToast(null), 3000);
  }

  function handleGenerate(orderId: string) {
    const invNo = nextDemoInvoiceNumber();
    setWorkflowOrderInvoice(orderId, invNo);
    showToast(`Invoice ${invNo} generated for ${orderId}`);
    loadOrders();
  }

  return (
    <ErpLayout
      title="Invoice Generation"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Invoice Generation")}
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Invoice Generation</h2>
        <p className="mt-1 text-slate-500">Generate invoices only for delivered orders. Synced from Orders Workflow.</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"><Package size={18} /></div>
          <div className="text-2xl font-bold text-amber-700">{deliveredOrders.length}</div>
          <div className="text-xs text-slate-500">Delivered — Awaiting Invoice</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600"><FileText size={18} /></div>
          <div className="text-2xl font-bold text-violet-700">{invoicedOrders.length}</div>
          <div className="text-xs text-slate-500">Invoices Generated</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></div>
          <div className="text-2xl font-bold text-emerald-700">
            {invoicedOrders.filter(o => o.status === "Payment Completed" || o.status === "Order Closed").length}
          </div>
          <div className="text-xs text-slate-500">Payment Completed</div>
        </div>
      </div>

      {/* Delivered orders awaiting invoice */}
      {deliveredOrders.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 border-b border-amber-200 px-5 py-3">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-amber-800">Delivered Orders — Awaiting Invoice</span>
            <span className="ml-auto rounded-full bg-amber-600 px-2 py-0.5 text-xs font-bold text-white">{deliveredOrders.length}</span>
          </div>
          <div className="divide-y divide-amber-100">
            {deliveredOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B2C66]">{order.id}</span>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-700">Delivered</span>
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-700">{order.branch}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{order.date} · {order.items.length} items · {fmt(order.value)}</div>
                </div>
                <button onClick={() => handleGenerate(order.id)}
                  className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {deliveredOrders.length === 0 && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          {invoicedOrders.length > 0
            ? "All delivered orders have been invoiced."
            : "No delivered orders awaiting invoice. Invoice can only be generated after an order is delivered."}
        </div>
      )}

      {/* Generated invoices */}
      {invoicedOrders.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <FileText className="h-4 w-4 text-violet-600" />
            <h3 className="font-semibold text-slate-800">Generated Invoices</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
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
                    <td className="px-5 py-3 text-slate-500">{order.date}</td>
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
                  <p><span className="font-semibold">Date:</span> {previewOrder.date}</p>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Ordered</th>
                    <th className="px-2 py-2">Approved</th>
                    <th className="px-2 py-2">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {previewOrder.items.map(item => (
                    <tr key={item.product} className="border-t border-slate-100">
                      <td className="px-2 py-2">{item.product}</td>
                      <td className="px-2 py-2">{item.orderedQty}</td>
                      <td className="px-2 py-2 font-semibold text-emerald-700">{item.approvedQty}</td>
                      <td className="px-2 py-2">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto max-w-[240px] text-sm">
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0A3A92]">
                  <span>Total Amount</span>
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

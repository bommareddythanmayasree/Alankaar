import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Package, AlertTriangle, Lock } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  updateWorkflowOrderStatus,
  type WorkflowOrderLive,
} from "../../../shared/lib/demo-store";

function fmt(v: number) { return `₹${v.toLocaleString("en-IN")}`; }

export function OrderClosurePage() {
  const [eligible, setEligible] = useState<WorkflowOrderLive[]>([]);
  const [ineligible, setIneligible] = useState<WorkflowOrderLive[]>([]);
  const [closed, setClosed] = useState<WorkflowOrderLive[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    const all = getWorkflowOrders();
    setEligible(all.filter(o => o.status === "Payment Completed"));
    setIneligible(all.filter(o => o.status === "Invoice Generated" || o.status === "Payment Pending"));
    setClosed(all.filter(o => o.status === "Order Closed"));
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

  function handleClose(orderId: string) {
    updateWorkflowOrderStatus(orderId, "Order Closed");
    showToast(`Order ${orderId} closed successfully`);
    loadOrders();
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Order Closure")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Order Closure</h2>
        <p className="mt-1 text-slate-500">Only Payment Completed orders can be closed. Synced from Orders Workflow.</p>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={18} /></div>
          <div className="text-2xl font-bold text-emerald-700">{eligible.length}</div>
          <div className="text-xs text-slate-500">Ready to Close (Payment Completed)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle size={18} /></div>
          <div className="text-2xl font-bold text-amber-700">{ineligible.length}</div>
          <div className="text-xs text-slate-500">Cannot Close (Payment Pending / Invoice Only)</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"><Package size={18} /></div>
          <div className="text-2xl font-bold text-slate-700">{closed.length}</div>
          <div className="text-xs text-slate-500">Closed Orders</div>
        </div>
      </div>

      {eligible.length > 0 && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="flex items-center gap-2 border-b border-emerald-200 px-5 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-emerald-800">Ready to Close — Payment Completed</span>
            <span className="ml-auto rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{eligible.length}</span>
          </div>
          <div className="divide-y divide-emerald-100">
            {eligible.map(o => (
              <div key={o.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B2C66]">{o.id}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Payment Completed</span>
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-700">{o.branch}</div>
                  <div className="mt-0.5 text-xs text-slate-400">{o.date} · {o.invoiceNumber ?? "—"} · {fmt(o.value)}</div>
                </div>
                <button onClick={() => handleClose(o.id)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  <CheckCircle2 className="h-4 w-4" />
                  Close Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {ineligible.length > 0 && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <Lock className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Cannot Close — Payment Not Completed</span>
            <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{ineligible.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ineligible.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0B2C66]">{o.id}</td>
                    <td className="px-5 py-3 text-slate-700">{o.branch}</td>
                    <td className="px-5 py-3 font-mono text-xs text-violet-700">{o.invoiceNumber ?? "—"}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{fmt(o.value)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.status === "Payment Pending" ? "bg-amber-100 text-amber-700" : "bg-violet-100 text-violet-700"}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
            <XCircle className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-700">Closed Orders</span>
            <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">{closed.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {closed.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#0B2C66]">{o.id}</td>
                    <td className="px-5 py-3 text-slate-700">{o.branch}</td>
                    <td className="px-5 py-3 font-mono text-xs text-violet-700">{o.invoiceNumber ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(o.value)}</td>
                    <td className="px-5 py-3 text-slate-500">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

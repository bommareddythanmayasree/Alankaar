import { useState, useEffect, useCallback } from "react";
import { Banknote, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  updateWorkflowOrderStatus,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

const COLLECTION_STATUSES: WorkflowLifecycleStatus[] = ["Invoice Generated", "Payment Pending", "Payment Completed"];

function statusBadge(status: WorkflowLifecycleStatus) {
  if (status === "Payment Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Payment Pending")   return "bg-amber-100 text-amber-700";
  return "bg-violet-100 text-violet-700";
}

function fmt(v: number) { return `₹${v.toLocaleString("en-IN")}`; }

export function CollectionsPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [filter, setFilter] = useState<string>("All");
  const [toast, setToast] = useState<string | null>(null);

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
    setTimeout(() => setToast(null), 3000);
  }

  function handleMarkPaid(orderId: string) {
    updateWorkflowOrderStatus(orderId, "Payment Completed");
    showToast(`Payment completed for ${orderId}`);
    loadOrders();
  }

  const filters = ["All", "Invoice Generated", "Payment Pending", "Payment Completed"];
  const rows = filter === "All" ? orders : orders.filter(o => o.status === filter);

  const totalValue    = orders.reduce((s, o) => s + o.value, 0);
  const totalPaid     = orders.filter(o => o.status === "Payment Completed").reduce((s, o) => s + o.value, 0);
  const totalPending  = orders.filter(o => o.status !== "Payment Completed").reduce((s, o) => s + o.value, 0);
  const collectionPct = totalValue > 0 ? Math.round((totalPaid / totalValue) * 100) : 0;

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Collections")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Collections Dashboard</h2>
        <p className="mt-1 text-slate-500">Invoice Generated and Payment Pending orders — synced from Orders Workflow.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Invoiced",   value: fmt(totalValue),        bg: "bg-[#E9EDFF]", color: "text-indigo-600",  Icon: Banknote },
          { label: "Collected",        value: fmt(totalPaid),         bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: CheckCircle2 },
          { label: "Outstanding",      value: fmt(totalPending),      bg: "bg-[#FFE6D2]", color: "text-orange-600",  Icon: AlertCircle },
          { label: "Collection %",     value: `${collectionPct}%`,    bg: "bg-[#FFF3CB]", color: "text-amber-600",   Icon: CreditCard },
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

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f ? "bg-[#0B2C66] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No orders in collections. Orders appear here when Invoice Generated, Payment Pending, or Payment Completed.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Invoice No.</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{order.branch}</div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#0B2C66]">{order.id}</td>
                    <td className="px-5 py-3 font-mono text-xs text-violet-700">{order.invoiceNumber ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{order.date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">{fmt(order.value)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status as WorkflowLifecycleStatus)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {(order.status === "Invoice Generated" || order.status === "Payment Pending") && (
                        <button onClick={() => handleMarkPaid(order.id)}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                          Mark Paid
                        </button>
                      )}
                    </td>
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

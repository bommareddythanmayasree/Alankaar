import { useState, useEffect, useCallback } from "react";
import { History, Search, Banknote, Smartphone, AlertCircle } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  getWorkflowOrders,
  getCurrentDemoBranchName,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

// Statuses to show in Payment History
const HISTORY_STATUSES: WorkflowLifecycleStatus[] = ["Payment Completed", "Order Closed"];

const STATUS_COLORS: Record<string, string> = {
  "Payment Completed": "bg-emerald-100 text-emerald-700",
  "Order Closed":      "bg-slate-100 text-slate-600",
};

export function PaymentHistoryPage() {
  const currentBranch = getCurrentDemoBranchName();
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(() => {
    const all = getWorkflowOrders().filter(o =>
      o.branch === currentBranch &&
      HISTORY_STATUSES.includes(o.status as WorkflowLifecycleStatus)
    );
    setOrders(all);
  }, [currentBranch]);

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
    };
  }, [loadOrders]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      (o.invoiceNumber ?? "").toLowerCase().includes(q)
    );
  });

  const totalCollected = orders.filter(o => o.status === "Payment Completed" || o.status === "Order Closed")
    .reduce((s, o) => s + o.value, 0);
  const completedCount = orders.filter(o => o.status === "Payment Completed").length;
  const closedCount    = orders.filter(o => o.status === "Order Closed").length;

  function fmt(v: number) { return `\u20B9${v.toLocaleString("en-IN")}`; }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Payment History")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Payment History</h2>
        <p className="mt-1 text-slate-500">Completed payment records for {currentBranch}.</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{fmt(totalCollected)}</div>
            <div className="text-xs text-slate-500">Total Collected</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Smartphone className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{completedCount}</div>
            <div className="text-xs text-slate-500">Payment Completed</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
            <Banknote className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{closedCount}</div>
            <div className="text-xs text-slate-500">Orders Closed</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2">
        <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID, invoice, or status..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{o.date}</td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{o.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-violet-700">{o.invoiceNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(o.value)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[o.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    {orders.length === 0
                      ? "No completed payments yet. Orders appear here when Payment Completed or Order Closed."
                      : "No transactions match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Payment history populates automatically when the warehouse marks orders as Payment Completed or Order Closed.
        </div>
      )}
    </ErpLayout>
  );
}

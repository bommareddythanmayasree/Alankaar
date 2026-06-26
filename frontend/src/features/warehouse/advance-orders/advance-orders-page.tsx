import { useState } from "react";
import { Zap } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { DEMO_ADVANCE_ORDERS, DEMO_URGENT_ORDERS } from "../../../shared/data/demo-mock-data";


type Tab = "Today" | "Tomorrow" | "Future";

const TODAY = "Jun 17, 2026";
const TOMORROW = "Jun 18, 2026";

function priorityBadge(p: string) {
  return p === "Urgent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";
}
function statusBadge(s: string) {
  if (s === "Confirmed") return "bg-emerald-100 text-emerald-700";
  if (s === "Processing") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}
function urgentStatusBadge(s: string) {
  if (s === "Dispatched") return "bg-emerald-100 text-emerald-700";
  if (s === "In Production") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

export function WarehouseAdvanceOrdersPage() {
  const [tab, setTab] = useState<Tab>("Today");
  const tabs: Tab[] = ["Today", "Tomorrow", "Future"];

  const filtered = DEMO_ADVANCE_ORDERS.filter(o => {
    if (tab === "Today") return o.deliveryDate === TODAY;
    if (tab === "Tomorrow") return o.deliveryDate === TOMORROW;
    return o.deliveryDate !== TODAY && o.deliveryDate !== TOMORROW;
  });

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Advance Orders")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Advance Orders</h2>
        <p className="mt-1 text-slate-500">Pre-planned orders for upcoming deliveries including festival and bulk orders.</p>
      </div>

      {/* Urgent Orders Section */}
      {DEMO_URGENT_ORDERS.length > 0 && (
        <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-800">URGENT ORDERS — Requires Immediate Action</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {DEMO_URGENT_ORDERS.map(u => (
              <div key={u.id} className="rounded-lg border border-red-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-red-600">{u.id}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgentStatusBadge(u.status)}`}>{u.status}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">{u.branch}</div>
                <div className="text-sm text-slate-600">{u.product} — {u.qty} {u.unit}</div>
                <div className="mt-1 text-xs text-slate-500">{u.reason} · {u.requestedAt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            {t}
            <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">
              {DEMO_ADVANCE_ORDERS.filter(o => {
                if (t === "Today") return o.deliveryDate === TODAY;
                if (t === "Tomorrow") return o.deliveryDate === TOMORROW;
                return o.deliveryDate !== TODAY && o.deliveryDate !== TOMORROW;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-center">Qty</th>
                <th className="px-5 py-3">Delivery Date</th>
                <th className="px-5 py-3">Occasion</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-400">No advance orders for this period.</td></tr>
              )}
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1B4DB1]">{o.id}</td>
                  <td className="px-5 py-3 text-slate-700">{o.branch}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{o.product}</td>
                  <td className="px-5 py-3 text-center font-semibold text-slate-800">{o.qty} {o.unit}</td>
                  <td className="px-5 py-3 text-slate-600">{o.deliveryDate}</td>
                  <td className="px-5 py-3 text-slate-500">{o.occasion ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadge(o.priority)}`}>
                      {o.priority === "Urgent" && <Zap className="h-3 w-3" />}
                      {o.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(o.status)}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}



import { useState } from "react";
import { CalendarClock, Plus, Zap } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import { DEMO_ADVANCE_ORDERS } from "../../../shared/data/demo-mock-data";
import { getCurrentDemoBranchName } from "../../../shared/lib/demo-store";


type Tab = "Today" | "Tomorrow" | "Future Orders";
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

export function BranchAdvanceOrdersPage() {
  const currentBranch = getCurrentDemoBranchName();
  const myAdvanceOrders = DEMO_ADVANCE_ORDERS.filter(o => o.branch === currentBranch);

  const [tab, setTab] = useState<Tab>("Today");
  const [showForm, setShowForm] = useState(false);
  const tabs: Tab[] = ["Today", "Tomorrow", "Future Orders"];

  const filtered = myAdvanceOrders.filter(o => {
    if (tab === "Today") return o.deliveryDate === TODAY;
    if (tab === "Tomorrow") return o.deliveryDate === TOMORROW;
    return o.deliveryDate !== TODAY && o.deliveryDate !== TOMORROW;
  });

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Advance Orders")}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Advance Orders</h2>
          <p className="mt-1 text-slate-500">Place and track advance orders for festivals, events, and bulk requirements.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#092757]">
          <Plus className="h-4 w-4" />
          Place Advance Order
        </button>
      </div>

      {/* Festival Banner */}
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Upcoming Festival Orders</p>
            <p className="text-sm text-amber-700">Kaju Katli — 50 Kg for Festival (Jun 17) · Mysore Pak — 18 Kg (Jun 25)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {tabs.map(t => {
          const count = myAdvanceOrders.filter(o => {
            if (t === "Today") return o.deliveryDate === TODAY;
            if (t === "Tomorrow") return o.deliveryDate === TOMORROW;
            return o.deliveryDate !== TODAY && o.deliveryDate !== TOMORROW;
          }).length;
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
              {t} <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-3 rounded-xl border border-slate-200 bg-white py-10 text-center text-slate-400">
            No advance orders for this period.
          </div>
        )}
        {filtered.map(o => (
          <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
              <span className="font-mono text-xs font-semibold text-[#1B4DB1]">{o.id}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${priorityBadge(o.priority)}`}>
                {o.priority === "Urgent" && <Zap className="h-3 w-3" />}{o.priority}
              </span>
            </div>
            <div className="mb-1 text-lg font-semibold text-slate-800">{o.product}</div>
            <div className="mb-3 text-2xl font-bold text-[#0B2C66]">{o.qty} {o.unit}</div>
            {o.occasion && (
              <div className="mb-3 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">{o.occasion}</div>
            )}
            <div className="space-y-1 text-sm text-slate-500">
              <div>Branch: <span className="font-medium text-slate-700">{o.branch}</span></div>
              <div>Delivery: <span className="font-medium text-slate-700">{o.deliveryDate}</span></div>
            </div>
            <div className="mt-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(o.status)}`}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Simple place order modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Place Advance Order</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Product</label>
                <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B2C66]">
                  <option>Kaju Katli</option><option>Kalakand</option><option>Rasgulla</option><option>Milk Cake</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Quantity (Kg)</label>
                <input type="number" defaultValue={10} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B2C66]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Delivery Date</label>
                <input type="date" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B2C66]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Priority</label>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg border-2 border-slate-200 py-2 text-sm font-semibold text-slate-600">Normal</button>
                  <button className="flex-1 rounded-lg border-2 border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700">Urgent</button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Occasion (optional)</label>
                <input placeholder="e.g. Festival, Wedding, Bulk" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0B2C66]" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg bg-[#0B2C66] py-2 text-sm font-semibold text-white hover:bg-[#092757]">Place Order</button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}



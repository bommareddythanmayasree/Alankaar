import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { DEMO_ADVANCE_ORDERS, DEMO_URGENT_ORDERS } from "../../../shared/data/demo-mock-data";
import { getWorkflowOrders, type WorkflowOrderLive } from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

type Tab = "Today" | "Tomorrow" | "Future";

// ── Normalised row shape shown in the table ───────────────────────────────────
type AdvanceRow = {
  id: string;
  branch: string;
  product: string;
  qty: number;
  unit: string;
  deliveryDate: string;
  occasion: string | undefined;
  priority: "Normal" | "Urgent";
  status: string;
  value: number | undefined; // only for live orders
};

// ── Derive today / tomorrow labels from real clock ────────────────────────────
function dateLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
const TODAY_LABEL = dateLabel(new Date());
const TOMORROW_LABEL = dateLabel(new Date(Date.now() + 86_400_000));

// ── Map live WorkflowOrderLive → AdvanceRow[] ─────────────────────────────────
// One WorkflowOrderLive can contain multiple items; we show a row per item.
function liveToRows(o: WorkflowOrderLive): AdvanceRow[] {
  return o.items.map((item) => ({
    id: o.advanceOrderId ?? o.id,
    branch: o.branch,
    product: item.product,
    qty: item.orderedQty,
    unit: item.unit,
    deliveryDate: o.deliveryDate ?? o.date,
    occasion: o.occasion,
    priority: o.priority,
    status: o.status,
    value: o.value,
  }));
}

// ── Map DEMO_ADVANCE_ORDERS → AdvanceRow ──────────────────────────────────────
function mockToRow(o: typeof DEMO_ADVANCE_ORDERS[number]): AdvanceRow {
  return {
    id: o.id,
    branch: o.branch,
    product: o.product,
    qty: o.qty,
    unit: o.unit,
    deliveryDate: o.deliveryDate,
    occasion: o.occasion,
    priority: o.priority,
    status: o.status,
    value: undefined,
  };
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
function priorityBadge(p: string) {
  return p === "Urgent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";
}

function statusBadge(s: string) {
  if (s === "Confirmed" || s === "Approved" || s === "Delivered" || s === "Order Closed") return "bg-emerald-100 text-emerald-700";
  if (s === "Processing" || s === "Production Started" || s === "Added To Production" || s === "Production Completed") return "bg-blue-100 text-blue-700";
  if (s === "Ready For Dispatch" || s === "Morning Dispatch" || s === "Evening Dispatch" || s === "In Transit") return "bg-violet-100 text-violet-700";
  if (s === "Rejected") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function urgentStatusBadge(s: string) {
  if (s === "Dispatched") return "bg-emerald-100 text-emerald-700";
  if (s === "In Production") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

// ── Component ─────────────────────────────────────────────────────────────────
export function WarehouseAdvanceOrdersPage() {
  const [tab, setTab] = useState<Tab>("Today");
  const tabs: Tab[] = ["Today", "Tomorrow", "Future"];

  // Read live workflow advance orders and re-render on storage changes
  const [rows, setRows] = useState<AdvanceRow[]>(() => buildRows());

  function buildRows(): AdvanceRow[] {
    const live = getWorkflowOrders().filter((o) => o.isAdvanceOrder === true);
    if (live.length > 0) {
      return live.flatMap(liveToRows);
    }
    // Fallback to static mock data when no live advance orders exist
    return DEMO_ADVANCE_ORDERS.map(mockToRow);
  }

  useEffect(() => {
    const handler = () => setRows(buildRows());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // ── Tab filtering ───────────────────────────────────────────────────────────
  function matchTab(deliveryDate: string, t: Tab) {
    if (t === "Today") return deliveryDate === TODAY_LABEL;
    if (t === "Tomorrow") return deliveryDate === TOMORROW_LABEL;
    return deliveryDate !== TODAY_LABEL && deliveryDate !== TOMORROW_LABEL;
  }

  const filtered = rows.filter((r) => matchTab(r.deliveryDate, tab));
  const countFor = (t: Tab) => rows.filter((r) => matchTab(r.deliveryDate, t)).length;

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
            {DEMO_URGENT_ORDERS.map((u) => (
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
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            {t}
            <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs">{countFor(t)}</span>
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
                <th className="px-5 py-3">Workflow Status</th>
                <th className="px-5 py-3 text-right">Order Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">No advance orders for this period.</td>
                </tr>
              )}
              {filtered.map((o, idx) => (
                <tr key={`${o.id}-${idx}`} className="hover:bg-slate-50">
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
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">
                    {o.value != null ? formatCurrency(o.value) : "—"}
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

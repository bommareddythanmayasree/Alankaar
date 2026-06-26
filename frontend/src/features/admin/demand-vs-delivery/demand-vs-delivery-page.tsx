import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import { DEMO_DEMAND_TREND, DEMO_WEEKLY_TREND, DEMO_MONTHLY_TREND } from "../../../shared/data/demo-mock-data";

type Period = "Daily" | "Weekly" | "Monthly";

export function DemandVsDeliveryPage() {
  const [period, setPeriod] = useState<Period>("Daily");

  const data = period === "Daily" ? DEMO_DEMAND_TREND : period === "Weekly" ? DEMO_WEEKLY_TREND : DEMO_MONTHLY_TREND;
  const xKey = period === "Daily" ? "day" : period === "Weekly" ? "week" : "month";

  const totalReq = data.reduce((s, d) => s + (d as { requested: number }).requested, 0);
  const totalDel = data.reduce((s, d) => s + (d as { delivered: number }).delivered, 0);
  const totalCan = data.reduce((s, d) => s + (d as { cancelled: number }).cancelled, 0);
  const fulfillment = Math.round((totalDel / totalReq) * 100);

  return (
    <ErpLayout sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Demand vs Delivery")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Demand vs Delivery Analytics</h2>
        <p className="mt-1 text-slate-500">Compare requested, delivered, and cancelled quantities over time.</p>
      </div>

      {/* Period Selector */}
      <div className="mb-5 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["Daily", "Weekly", "Monthly"] as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${period === p ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Summary pills */}
      <div className="mb-5 flex flex-wrap gap-3">
        {[
          { label: "Requested", value: totalReq.toLocaleString("en-IN"), color: "bg-indigo-100 text-indigo-700" },
          { label: "Delivered", value: totalDel.toLocaleString("en-IN"), color: "bg-emerald-100 text-emerald-700" },
          { label: "Cancelled", value: totalCan.toLocaleString("en-IN"), color: "bg-orange-100 text-orange-700" },
          { label: "Fulfillment", value: `${fulfillment}%`, color: fulfillment >= 90 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-full px-4 py-2 text-sm font-semibold ${s.color}`}>
            {s.label}: <span className="ml-1">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">{period} Comparison — Requested vs Delivered vs Cancelled</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data as unknown[]} margin={{ left: 0, right: 8 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => period === "Monthly" ? `?${(Number(v) / 100000).toFixed(1)}L` : Number(v) > 10000 ? `?${(Number(v) / 1000).toFixed(0)}k` : v.toString()} />
              <Tooltip formatter={(v: unknown) => Number(v) > 10000 ? `?${Number(v).toLocaleString("en-IN")}` : String(v)} />
              <Legend />
              <Bar dataKey="requested" name="Requested" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">{period} Trend — Fulfillment Pattern</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data as unknown[]} margin={{ left: 0, right: 8 }}>
              <CartesianGrid stroke="#EEF2F7" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => Number(v) > 10000 ? `?${(Number(v) / 1000).toFixed(0)}k` : v.toString()} />
              <Tooltip formatter={(v: unknown) => Number(v) > 10000 ? `?${Number(v).toLocaleString("en-IN")}` : String(v)} />
              <Legend />
              <Line dataKey="requested" name="Requested" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ErpLayout>
  );
}



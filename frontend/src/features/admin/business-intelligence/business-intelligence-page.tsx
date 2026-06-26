import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, TrendingDown, Banknote, Package, CreditCard, AlertCircle } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import { DEMO_BI_SUMMARY, DEMO_DEMAND_TREND } from "../../../shared/data/demo-mock-data";

const s = DEMO_BI_SUMMARY;

const KPI_CARDS = [
  { label: "Total Demand",      value: s.totalDemand,      icon: Package,    bg: "bg-[#E9EDFF]", color: "text-indigo-600" },
  { label: "Delivered",         value: s.totalDelivered,   icon: TrendingUp, bg: "bg-[#E2FFE6]", color: "text-emerald-600" },
  { label: "Cancelled",         value: s.totalCancelled,   icon: TrendingDown, bg: "bg-[#FFE6D2]", color: "text-orange-600" },
  { label: "Revenue",           value: s.totalRevenue,     icon: Banknote,   bg: "bg-[#FFF3CB]", color: "text-amber-600" },
  { label: "Collections",       value: s.totalCollections, icon: CreditCard, bg: "bg-[#E2FFE6]", color: "text-emerald-600" },
  { label: "Outstanding",       value: s.totalOutstanding, icon: AlertCircle, bg: "bg-[#FFE0E0]", color: "text-red-500" },
];

export function BusinessIntelligencePage() {
  return (
    <ErpLayout sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Business Intelligence")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Business Intelligence — Executive Dashboard</h2>
        <p className="mt-1 text-slate-500">Real-time overview of demand, delivery, revenue, and collections across all branches.</p>
      </div>

      {/* REQ 12: KPI Cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {KPI_CARDS.map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <div className="text-base font-semibold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Fulfillment Rate Highlight */}
      <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-800">Overall Fulfillment Rate</p>
            <p className="text-xs text-emerald-600 mt-0.5">Based on today's orders across all branches</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-emerald-700">{s.fulfillmentPct}</span>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-emerald-200">
          <div className="h-3 rounded-full bg-emerald-500" style={{ width: s.fulfillmentPct }} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Daily Demand vs Delivery (This Week)</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEMO_DEMAND_TREND} margin={{ left: 0, right: 8 }}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `?${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: unknown) => `?${Number(v).toLocaleString("en-IN")}`} />
                <Legend />
                <Line dataKey="requested" name="Requested" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line dataKey="cancelled" name="Cancelled" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Collections vs Outstanding</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { branch: "Gandhi Nagar", collected: 0, outstanding: 12200 },
                { branch: "Gayatri Nagar", collected: 1800, outstanding: 0 },
                { branch: "Ayyappa Nagar", collected: 3150, outstanding: 8500 },
                { branch: "Mutyalammapadu", collected: 0, outstanding: 1120 },
                { branch: "Gannavaram", collected: 2700, outstanding: 0 },
                { branch: "Machavaram", collected: 680, outstanding: 680 },
              ]} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid horizontal={false} stroke="#EEF2F7" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `?${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="branch" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v: unknown) => `?${Number(v).toLocaleString("en-IN")}`} />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}



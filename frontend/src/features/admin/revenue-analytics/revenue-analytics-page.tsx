import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

const revenueSummary = [
  { title: "Total Revenue", value: "₹98,76,430", note: "+12.8% vs last month", positive: true },
  { title: "Total Orders", value: "3,482", note: "+8.1% vs last month", positive: true },
  { title: "Average Order Value", value: "₹2,836", note: "+4.2% vs last month", positive: true },
  { title: "Refunds", value: "₹1,24,580", note: "+1.3% vs last month", positive: false },
];

const revenueTrendData = [
  { month: "Jan", thisYear: 620000, lastYear: 510000 },
  { month: "Feb", thisYear: 680000, lastYear: 540000 },
  { month: "Mar", thisYear: 710000, lastYear: 590000 },
  { month: "Apr", thisYear: 760000, lastYear: 620000 },
  { month: "May", thisYear: 840000, lastYear: 690000 },
  { month: "Jun", thisYear: 910000, lastYear: 750000 },
];

const revenueByBranch = [
  { branch: "Gandhi Nagar", revenue: 1830000 },
  { branch: "Benz Circle", revenue: 1520000 },
  { branch: "Ayyappa Nagar", revenue: 1365000 },
  { branch: "Patamata", revenue: 1090000 },
  { branch: "Gayatri Nagar", revenue: 955000 },
  { branch: "Kanuru", revenue: 820000 },
  { branch: "Narasaraopet", revenue: 680000 },
];

const revenueByCategory = [
  { name: "Sweets", value: 46, color: "#1D4ED8" },
  { name: "Bakery", value: 28, color: "#F59E0B" },
  { name: "Snacks", value: 16, color: "#22C55E" },
  { name: "Beverages", value: 7, color: "#06B6D4" },
  { name: "Others", value: 3, color: "#94A3B8" },
];

const revenueByPaymentMethod = [
  { name: "UPI", value: 42, color: "#2563EB" },
  { name: "Credit Card", value: 22, color: "#16A34A" },
  { name: "Debit Card", value: 18, color: "#F97316" },
  { name: "Net Banking", value: 10, color: "#8B5CF6" },
  { name: "Bank Transfer", value: 8, color: "#64748B" },
];

export function RevenueAnalyticsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Revenue Analytics")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {revenueSummary.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-1 text-[34px] font-semibold leading-tight text-slate-900">{card.value}</p>
            <p className={`mt-1 text-xs ${card.positive ? "text-emerald-600" : "text-red-600"}`}>{card.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Revenue Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueTrendData}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(value) => `₹${new Intl.NumberFormat("en-IN").format(Number(value ?? 0))}`} />
                <Bar dataKey="lastYear" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="thisYear" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
              <span className="text-slate-600">This Year</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#93C5FD]" />
              <span className="text-slate-600">Last Year</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Revenue By Branch</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByBranch} layout="vertical" margin={{ left: 30, right: 10 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="branch" tick={{ fontSize: 12 }} width={90} />
                <Tooltip formatter={(value) => `₹${new Intl.NumberFormat("en-IN").format(Number(value ?? 0))}`} />
                <Bar dataKey="revenue" fill="#0A3A92" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Revenue By Category</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByCategory} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                  {revenueByCategory.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendRows rows={revenueByCategory} />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Revenue By Payment Method</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByPaymentMethod} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95}>
                  {revenueByPaymentMethod.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <LegendRows rows={revenueByPaymentMethod} />
        </section>
      </div>
    </ErpLayout>
  );
}

function LegendRows({ rows }: { rows: { name: string; value: number; color: string }[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {rows.map((item) => (
        <div key={item.name} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-700">{item.name}</span>
          </div>
          <span className="font-semibold text-slate-800">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}


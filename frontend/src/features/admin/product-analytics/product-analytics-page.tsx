import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

const fastMovingProducts = [
  { name: "Rasgulla", units: 1240, growth: "+18%" },
  { name: "Milk Bread", units: 980, growth: "+14%" },
  { name: "Kaju Katli", units: 860, growth: "+11%" },
  { name: "Veg Puff", units: 790, growth: "+8%" },
];

const slowMovingProducts = [
  { name: "Fruit Biscuit", units: 95, decline: "-12%" },
  { name: "Dry Cake Slice", units: 82, decline: "-10%" },
  { name: "Butter Toast", units: 76, decline: "-9%" },
  { name: "Mix Cookies", units: 64, decline: "-8%" },
];

const topSellingProducts = [
  { name: "Rasgulla", revenue: 235000 },
  { name: "Kaju Katli", revenue: 180000 },
  { name: "Gulab Jamun", revenue: 145000 },
  { name: "Milk Cake", revenue: 120000 },
  { name: "Dry Fruit Laddu", revenue: 60000 },
];

const categoryDistribution = [
  { name: "Sweets", value: 41, color: "#1D4ED8" },
  { name: "Bakery", value: 34, color: "#F59E0B" },
  { name: "Snacks", value: 16, color: "#22C55E" },
  { name: "Others", value: 9, color: "#94A3B8" },
];

const productTrend = [
  { month: "Jan", fast: 340, slow: 112, top: 420 },
  { month: "Feb", fast: 380, slow: 105, top: 470 },
  { month: "Mar", fast: 410, slow: 99, top: 520 },
  { month: "Apr", fast: 470, slow: 93, top: 610 },
  { month: "May", fast: 520, slow: 87, top: 680 },
  { month: "Jun", fast: 590, slow: 84, top: 760 },
];

export function ProductAnalyticsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Products Analytics")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Fast Moving Products</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fastMovingProducts} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="units" fill="#1D4ED8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Slow Moving Products</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slowMovingProducts} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                <Tooltip />
                <Bar dataKey="units" fill="#EF4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Top Selling Products</h3>
          <div className="space-y-3">
            {topSellingProducts.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-[#F8FAFD] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#0A3A92]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatInr(item.revenue)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-3">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Category Distribution</h3>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3}>
                  {categoryDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 space-y-1.5">
            {categoryDistribution.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span>{c.name}</span>
                </div>
                <span className="font-semibold">{c.value}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Product Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productTrend}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="fast" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.15} />
                <Area type="monotone" dataKey="slow" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="top" stroke="#16A34A" fill="#16A34A" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

function formatInr(value: number) {
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}


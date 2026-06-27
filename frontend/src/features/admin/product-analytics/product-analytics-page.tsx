import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

// unit: "Kg" for sweets/mithai, "pcs" for bakery/snacks
const fastMovingProducts = [
  { name: "Rasgulla",   qty: 1200, unit: "Kg",  growth: "+18%" },
  { name: "Milk Bread", qty: 980,  unit: "pcs", growth: "+14%" },
  { name: "Kaju Katli", qty: 850,  unit: "Kg",  growth: "+11%" },
  { name: "Veg Puff",   qty: 700,  unit: "pcs", growth: "+8%"  },
];

const slowMovingProducts = [
  { name: "Fruit Biscuit",  qty: 95, unit: "pcs", decline: "-12%" },
  { name: "Dry Cake Slice", qty: 82, unit: "pcs", decline: "-10%" },
  { name: "Butter Toast",   qty: 76, unit: "pcs", decline: "-9%"  },
  { name: "Mix Cookies",    qty: 64, unit: "pcs", decline: "-8%"  },
];

const profitableProducts = [
  { name: "Kaju Katli",      revenue: 235000, profit: 115000, margin: 49 },
  { name: "Rasgulla",        revenue: 180000, profit:  85000, margin: 47 },
  { name: "Milk Bread",      revenue: 145000, profit:  60000, margin: 41 },
  { name: "Gulab Jamun",     revenue: 120000, profit:  44000, margin: 37 },
  { name: "Dry Fruit Laddu", revenue:  60000, profit:  18000, margin: 30 },
];

const categoryDistribution = [
  { name: "Sweets",  value: 41, color: "#1D4ED8" },
  { name: "Bakery",  value: 34, color: "#F59E0B" },
  { name: "Snacks",  value: 16, color: "#22C55E" },
  { name: "Others",  value:  9, color: "#94A3B8" },
];

const productTrend = [
  { month: "Jan", fast: 340, slow: 112, top: 420 },
  { month: "Feb", fast: 380, slow: 105, top: 470 },
  { month: "Mar", fast: 410, slow:  99, top: 520 },
  { month: "Apr", fast: 470, slow:  93, top: 610 },
  { month: "May", fast: 520, slow:  87, top: 680 },
  { month: "Jun", fast: 590, slow:  84, top: 760 },
];

// Map product name → unit for tooltip formatting
const productUnitMap: Record<string, string> = {
  "Rasgulla":       "Kg",
  "Milk Bread":     "pcs",
  "Kaju Katli":     "Kg",
  "Veg Puff":       "pcs",
  "Fruit Biscuit":  "pcs",
  "Dry Cake Slice": "pcs",
  "Butter Toast":   "pcs",
  "Mix Cookies":    "pcs",
};

// Custom tooltip for fast/slow moving charts
function ProductTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const unit = productUnitMap[label ?? ""] ?? "pcs";
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow">
      <p className="font-medium text-slate-800">{label}</p>
      <p className="text-slate-600">
        {payload[0].value} <span className="font-semibold">{unit}</span>
      </p>
    </div>
  );
}

export function ProductAnalyticsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Products Analytics")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Fast Moving */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Fast Moving Products</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fastMovingProducts} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip content={<ProductTooltip />} />
                <Bar dataKey="qty" name="Quantity" fill="#1D4ED8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3">
            {fastMovingProducts.map((p) => (
              <span key={p.name} className="text-xs text-slate-500">
                {p.name}: <span className="font-semibold text-slate-700">{p.qty} {p.unit}</span>
                <span className="ml-1 text-emerald-600">{p.growth}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Slow Moving */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Slow Moving Products</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slowMovingProducts} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} />
                <Tooltip content={<ProductTooltip />} />
                <Bar dataKey="qty" name="Quantity" fill="#EF4444" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3">
            {slowMovingProducts.map((p) => (
              <span key={p.name} className="text-xs text-slate-500">
                {p.name}: <span className="font-semibold text-slate-700">{p.qty} {p.unit}</span>
                <span className="ml-1 text-red-500">{p.decline}</span>
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Highest Margin */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-5">
          <h3 className="mb-4 text-base font-semibold text-slate-900">Highest Margin Products</h3>
          <div className="space-y-3">
            {profitableProducts.map((item, index) => {
              const badgeColor =
                item.margin >= 45 ? "bg-emerald-100 text-emerald-700"
                : item.margin >= 35 ? "bg-amber-100 text-amber-700"
                : "bg-rose-100 text-rose-700";
              const barColor =
                item.margin >= 45 ? "bg-emerald-500"
                : item.margin >= 35 ? "bg-amber-500"
                : "bg-rose-500";
              return (
                <div key={item.name} className="rounded-lg border border-slate-200 bg-[#F8FAFD] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#0A3A92]">
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeColor}`}>
                      {item.margin}% Margin
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Revenue: {formatInr(item.revenue)}</span>
                    <span>Profit: {formatInr(item.profit)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${item.margin}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Distribution */}
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

        {/* Product Trend */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Product Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productTrend}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="fast" name="Fast Moving" stroke="#1D4ED8" fill="#1D4ED8" fillOpacity={0.15} />
                <Area type="monotone" dataKey="slow" name="Slow Moving" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="top"  name="Top Products" stroke="#16A34A" fill="#16A34A" fillOpacity={0.1} />
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

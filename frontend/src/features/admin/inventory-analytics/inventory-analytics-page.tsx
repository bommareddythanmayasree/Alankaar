import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

const summaryCards = [
  { title: "Total Stock Items", value: "12,450", note: "+3.2% vs last month", positive: true },
  { title: "Available Stock", value: "10,980", note: "+2.4% vs last month", positive: true },
  { title: "Reserved Stock", value: "1,120", note: "+0.9% vs last month", positive: true },
  { title: "Low Stock Items", value: "54", note: "+1.7% vs last month", positive: false },
];

const stockTrend = [
  { month: "Jan", stockIn: 2100, stockOut: 1450 },
  { month: "Feb", stockIn: 2350, stockOut: 1620 },
  { month: "Mar", stockIn: 2520, stockOut: 1710 },
  { month: "Apr", stockIn: 2680, stockOut: 1830 },
  { month: "May", stockIn: 2890, stockOut: 1960 },
  { month: "Jun", stockIn: 3050, stockOut: 2050 },
];

const stockByCategory = [
  { name: "Sweets", value: 38, color: "#1D4ED8" },
  { name: "Bakery", value: 26, color: "#F59E0B" },
  { name: "Snacks", value: 18, color: "#22C55E" },
  { name: "Beverages", value: 10, color: "#06B6D4" },
  { name: "Others", value: 8, color: "#94A3B8" },
];

const lowStockAlerts = [
  { product: "Milk Bread", category: "Bakery", availableQty: 15, minimumQty: 40, status: "Critical" },
  { product: "Fruit Biscuit", category: "Snacks", availableQty: 12, minimumQty: 30, status: "Low" },
  { product: "Kaju Katli", category: "Sweets", availableQty: 18, minimumQty: 35, status: "Low" },
  { product: "Cold Coffee", category: "Beverages", availableQty: 10, minimumQty: 28, status: "Critical" },
  { product: "Dry Fruit Laddu", category: "Sweets", availableQty: 22, minimumQty: 32, status: "Low" },
];

export function InventoryAnalyticsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Inventory Analytics")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-1 text-[36px] font-semibold leading-tight text-slate-900">{card.value}</p>
            <p className={`mt-1 text-xs ${card.positive ? "text-emerald-600" : "text-red-600"}`}>{card.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Stock Overview Chart</h3>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockTrend}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="stockIn" name="Stock In" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
              <span className="text-slate-600">Stock In</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-slate-600">Stock Out</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Stock By Category</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockByCategory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {stockByCategory.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            {stockByCategory.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Low Stock Alerts Table</h3>
          <button className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Available Quantity</th>
                <th className="px-3 py-3">Minimum Quantity</th>
                <th className="px-3 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStockAlerts.map((row) => (
                <tr key={row.product} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-800">{row.product}</td>
                  <td className="px-3 py-3 text-slate-700">{row.category}</td>
                  <td className="px-3 py-3 text-slate-700">{row.availableQty}</td>
                  <td className="px-3 py-3 text-slate-700">{row.minimumQty}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        row.status === "Critical" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </ErpLayout>
  );
}


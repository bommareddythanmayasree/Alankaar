import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import { DEMO_PRODUCT_PERFORMANCE } from "../../../shared/data/demo-mock-data";

export function ProductPerformancePage() {
  return (
    <ErpLayout sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Product Performance")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Product Performance Analytics</h2>
        <p className="mt-1 text-slate-500">Demand, delivery, revenue, and shortages per product.</p>
      </div>

      {/* Summary chart */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Demand vs Delivery by Product</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_PRODUCT_PERFORMANCE} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid horizontal={false} stroke="#EEF2F7" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="product" tick={{ fontSize: 12 }} width={110} />
              <Tooltip />
              <Legend />
              <Bar dataKey="demand" name="Demand" fill="#6366f1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="delivery" name="Delivered" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Revenue by Product</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_PRODUCT_PERFORMANCE} margin={{ left: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey="product" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `?${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => `?${Number(v).toLocaleString("en-IN")}`} />
              <Bar dataKey="revenue" name="Revenue" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Product Performance Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Demand</th>
                <th className="px-5 py-3 text-right">Delivered</th>
                <th className="px-5 py-3 text-right">Revenue</th>
                <th className="px-5 py-3 text-right">Shortage</th>
                <th className="px-5 py-3 text-center">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_PRODUCT_PERFORMANCE.map(p => {
                const pct = Math.round((p.delivery / p.demand) * 100);
                return (
                  <tr key={p.product} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{p.product}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{p.demand}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{p.delivery}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">₹{p.revenue.toLocaleString("en-IN")}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${p.shortage > 0 ? "text-red-600" : "text-emerald-600"}`}>{p.shortage}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pct >= 95 ? "bg-emerald-100 text-emerald-700" : pct >= 88 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{pct}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}



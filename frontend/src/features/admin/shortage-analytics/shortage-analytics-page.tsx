import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import { DEMO_SHORTAGE_ANALYTICS } from "../../../shared/data/demo-mock-data";

export function ShortageAnalyticsPage() {
  const totalShortage = DEMO_SHORTAGE_ANALYTICS.reduce((s, p) => s + p.shortage, 0);
  const worstProduct = DEMO_SHORTAGE_ANALYTICS[0];

  return (
    <ErpLayout sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Shortage Analytics")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Shortage Analytics</h2>
        <p className="mt-1 text-slate-500">Top products with highest unfulfilled demand across all branches.</p>
      </div>

      {/* Alert Banner */}
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-800">Highest Shortage: {worstProduct.product}</p>
          <p className="text-sm text-amber-700">{worstProduct.shortage} units short ({worstProduct.pct} shortage rate) — Review production planning for immediate action.</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
          Total Shortage: {totalShortage} units
        </div>
        <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-700">
          Products Affected: {DEMO_SHORTAGE_ANALYTICS.length}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Shortage by Product (Units)</h3>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DEMO_SHORTAGE_ANALYTICS} margin={{ left: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF2F7" />
              <XAxis dataKey="product" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="shortage" name="Shortage" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Top Shortage Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 text-right">Requested</th>
                <th className="px-5 py-3 text-right">Delivered</th>
                <th className="px-5 py-3 text-right">Shortage</th>
                <th className="px-5 py-3 text-center">Shortage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_SHORTAGE_ANALYTICS.map((p, i) => (
                <tr key={p.product} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    <span className="flex items-center gap-2">
                      {i === 0 && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                      {p.product}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600">{p.requested}</td>
                  <td className="px-5 py-3 text-right text-emerald-700">{p.delivered}</td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">{p.shortage}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-red-400" style={{ width: p.pct }} />
                      </div>
                      <span className="text-xs font-semibold text-red-600">{p.pct}</span>
                    </div>
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



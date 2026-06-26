import { Download, CheckCircle2, XCircle, BarChart3, ClipboardList } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { DEMO_EOD } from "../../../shared/data/demo-mock-data";


const e = DEMO_EOD;

export function EodClosurePage() {
  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "End of Day Closure")}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">End of Day Closure</h2>
          <p className="mt-1 text-slate-500">Daily operational summary for {e.date}.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#092757]">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Orders", value: e.totalOrders, bg: "bg-[#E9EDFF]", color: "text-indigo-600", Icon: ClipboardList },
          { label: "Delivered Qty", value: `${e.deliveredQty} units`, bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: CheckCircle2 },
          { label: "Cancelled Qty", value: `${e.cancelledQty} units`, bg: "bg-[#FFE6D2]", color: "text-orange-600", Icon: XCircle },
          { label: "Fulfillment %", value: `${e.fulfillmentPct}%`, bg: "bg-[#FFF3CB]", color: "text-amber-600", Icon: BarChart3 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Fulfillment bar */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Overall Fulfillment Rate</h3>
          <span className={`text-lg font-bold ${e.fulfillmentPct >= 90 ? "text-emerald-600" : e.fulfillmentPct >= 80 ? "text-amber-600" : "text-red-600"}`}>{e.fulfillmentPct}%</span>
        </div>
        <div className="h-4 w-full rounded-full bg-slate-100">
          <div className={`h-4 rounded-full ${e.fulfillmentPct >= 90 ? "bg-emerald-500" : e.fulfillmentPct >= 80 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${e.fulfillmentPct}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>0%</span><span>Target: 90%</span><span>100%</span>
        </div>
      </div>

      {/* Daily Reports Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Branch-Wise Daily Report</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3 text-center">Orders</th>
                <th className="px-5 py-3 text-right">Delivered</th>
                <th className="px-5 py-3 text-right">Cancelled</th>
                <th className="px-5 py-3 text-center">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {e.reports.map(r => {
                const pct = parseInt(r.fulfillment);
                return (
                  <tr key={r.branch} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.branch}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.orders}</td>
                    <td className="px-5 py-3 text-right text-emerald-700 font-medium">{r.delivered}</td>
                    <td className="px-5 py-3 text-right text-red-600">{r.cancelled}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pct >= 95 ? "bg-emerald-100 text-emerald-700" : pct >= 85 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {r.fulfillment}
                      </span>
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



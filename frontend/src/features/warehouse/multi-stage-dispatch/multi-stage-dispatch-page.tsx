import { Truck, Package, Clock, CheckCircle2 } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { DEMO_DISPATCH_BATCHES, type DispatchBatch } from "../../../shared/data/demo-mock-data";


function slotColor(slot: DispatchBatch["slot"]) {
  return slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700";
}

function statusIcon(status: DispatchBatch["status"]) {
  if (status === "Delivered") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === "In Transit") return <Truck className="h-5 w-5 text-sky-500" />;
  return <Clock className="h-5 w-5 text-amber-500" />;
}

function statusBadge(status: DispatchBatch["status"]) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
}

export function MultiStageDispatchPage() {
  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Multi-Stage Dispatch")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Multi-Stage Dispatch</h2>
        <p className="mt-1 text-slate-500">Today's dispatch batches across morning, afternoon, and evening slots.</p>
      </div>

      {/* Timeline */}
      <div className="relative mb-6">
        <div className="flex items-center gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-5">
          {DEMO_DISPATCH_BATCHES.map((batch, i) => (
            <div key={batch.batchId} className="flex items-center">
              <div className="flex flex-col items-center min-w-[160px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-white shadow-md">
                  {statusIcon(batch.status)}
                </div>
                <div className="mt-2 text-center">
                  <div className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${slotColor(batch.slot)}`}>{batch.slot}</div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{batch.time}</div>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(batch.status)}`}>{batch.status}</span>
                </div>
              </div>
              {i < DEMO_DISPATCH_BATCHES.length - 1 && (
                <div className="flex-1 h-1 bg-slate-200 mx-2 min-w-[40px]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Batch Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {DEMO_DISPATCH_BATCHES.map(batch => (
          <div key={batch.batchId} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${slotColor(batch.slot)}`}>{batch.slot} Dispatch</span>
                <div className="mt-1 text-lg font-semibold text-slate-800">{batch.time}</div>
                <div className="text-xs text-slate-500">{batch.batchId}</div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                {statusIcon(batch.status)}
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products</p>
              {batch.items.map(item => (
                <div key={item.product} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{item.product}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{item.qty} {item.unit}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Branches</p>
              <div className="flex flex-wrap gap-1.5">
                {batch.branches.map(b => (
                  <span key={b} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{b}</span>
                ))}
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(batch.status)}`}>
                {statusIcon(batch.status)}
                {batch.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-800">Today's Dispatch Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Batch ID</th>
                <th className="px-5 py-3">Slot</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Products</th>
                <th className="px-5 py-3">Branches</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_DISPATCH_BATCHES.map(b => (
                <tr key={b.batchId} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">{b.batchId}</td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${slotColor(b.slot)}`}>{b.slot}</span></td>
                  <td className="px-5 py-3 text-slate-600">{b.time}</td>
                  <td className="px-5 py-3 text-slate-600">{b.items.map(i => i.product).join(", ")}</td>
                  <td className="px-5 py-3 text-slate-600">{b.branches.length} branches</td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(b.status)}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}



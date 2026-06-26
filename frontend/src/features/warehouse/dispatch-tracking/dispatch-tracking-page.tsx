import { useState, useMemo, useEffect, useCallback } from "react";
import { Truck, Package, CheckCircle2, Clock, ArrowRight, Sun, Moon } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { WORKFLOW_ORDERS } from "../../../shared/data/workflow-mock-data";
import {
  getWorkflowOrders,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

// Static mock dispatch orders derived from WORKFLOW_ORDERS
const MOCK_DISPATCH_ORDERS: WorkflowOrderLive[] = WORKFLOW_ORDERS
  .filter(o =>
    ["Ready For Dispatch", "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered"].includes(o.status)
  )
  .map(o => ({
    id: o.id,
    branch: o.branch,
    date: o.date,
    time: o.time,
    priority: o.priority,
    value: o.value,
    status: o.status as WorkflowLifecycleStatus,
    items: o.items.map(i => ({
      product: i.product,
      orderedQty: i.orderedQty,
      approvedQty: i.approvedQty,
      rejectedQty: i.rejectedQty,
      unit: i.unit,
    })),
  }));

type DispatchStatus = "Ready For Dispatch" | "Morning Dispatch" | "Evening Dispatch" | "In Transit" | "Delivered";
const DISPATCH_STATUSES: WorkflowLifecycleStatus[] = ["Ready For Dispatch", "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered"];
const LIFECYCLE: DispatchStatus[] = ["Ready For Dispatch", "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered"];

type FilterOption = "All" | "Morning Dispatch" | "Evening Dispatch" | "In Transit" | "Delivered";

function statusClass(status: WorkflowLifecycleStatus) {
  if (status === "Ready For Dispatch") return "bg-amber-100 text-amber-700";
  if (status === "Morning Dispatch")   return "bg-amber-100 text-amber-700";
  if (status === "Evening Dispatch")   return "bg-indigo-100 text-indigo-700";
  if (status === "In Transit")         return "bg-sky-100 text-sky-700";
  if (status === "Delivered")          return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-600";
}

function statusIcon(status: WorkflowLifecycleStatus) {
  if (status === "Delivered")        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "In Transit")       return <Truck className="h-4 w-4 text-sky-500" />;
  if (status === "Morning Dispatch" || status === "Evening Dispatch") return <Package className="h-4 w-4 text-indigo-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

export function DispatchTrackingPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [filter, setFilter] = useState<FilterOption>("All");

  const loadOrders = useCallback(() => {
    const liveOrders = getWorkflowOrders().filter(o => DISPATCH_STATUSES.includes(o.status as WorkflowLifecycleStatus));
    // Merge: live orders take precedence; mock orders fill in any not already present
    const liveIds = new Set(liveOrders.map(o => o.id));
    const merged = [
      ...liveOrders,
      ...MOCK_DISPATCH_ORDERS.filter(o => !liveIds.has(o.id)),
    ];
    setOrders(merged);
    setSelectedOrderId(prev => {
      if (!prev && merged.length > 0) return merged[0].id;
      if (prev && !merged.find(o => o.id === prev) && merged.length > 0) return merged[0].id;
      return prev;
    });
  }, []);

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
    };
  }, [loadOrders]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) ?? orders[0];

  const filteredOrders = useMemo(() => {
    if (filter === "All")              return orders;
    if (filter === "Morning Dispatch") return orders.filter(o => o.status === "Morning Dispatch");
    if (filter === "Evening Dispatch") return orders.filter(o => o.status === "Evening Dispatch");
    if (filter === "In Transit")       return orders.filter(o => o.status === "In Transit");
    if (filter === "Delivered")        return orders.filter(o => o.status === "Delivered");
    return orders;
  }, [filter, orders]);

  const currentIdx = selectedOrder ? LIFECYCLE.indexOf(selectedOrder.status as DispatchStatus) : -1;

  const counts = useMemo(() => ({
    readyForDispatch: orders.filter(o => o.status === "Ready For Dispatch").length,
    morning:          orders.filter(o => o.status === "Morning Dispatch").length,
    evening:          orders.filter(o => o.status === "Evening Dispatch").length,
    inTransit:        orders.filter(o => o.status === "In Transit").length,
    delivered:        orders.filter(o => o.status === "Delivered").length,
  }), [orders]);

  const FILTER_TABS: { label: FilterOption; value: number; bg: string; text: string; Icon: React.ElementType }[] = [
    { label: "All",              value: orders.length,          bg: "bg-slate-100",   text: "text-slate-700",   Icon: Package },
    { label: "Morning Dispatch", value: counts.morning,         bg: "bg-amber-50",    text: "text-amber-700",   Icon: Sun },
    { label: "Evening Dispatch", value: counts.evening,         bg: "bg-indigo-50",   text: "text-indigo-700",  Icon: Moon },
    { label: "In Transit",       value: counts.inTransit,       bg: "bg-sky-50",      text: "text-sky-700",     Icon: Truck },
    { label: "Delivered",        value: counts.delivered,       bg: "bg-emerald-50",  text: "text-emerald-700", Icon: CheckCircle2 },
  ];

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Dispatch Tracking")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Dispatch Tracking</h2>
        <p className="mt-1 text-slate-500">Real-time tracking of dispatches — synced from Orders Workflow.</p>
      </div>

      {/* Summary KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "Ready For Dispatch", value: counts.readyForDispatch, bg: "bg-amber-50",   color: "text-amber-600",   Icon: Clock },
          { label: "Morning Dispatch",   value: counts.morning,          bg: "bg-amber-50",   color: "text-amber-700",   Icon: Sun },
          { label: "Evening Dispatch",   value: counts.evening,          bg: "bg-indigo-50",  color: "text-indigo-600",  Icon: Moon },
          { label: "In Transit",         value: counts.inTransit,        bg: "bg-sky-50",     color: "text-sky-600",     Icon: Truck },
          { label: "Delivered",          value: counts.delivered,        bg: "bg-emerald-50", color: "text-emerald-600", Icon: CheckCircle2 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${c.bg}`}>
              <c.Icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No orders currently in dispatch. Orders appear here when they reach Ready For Dispatch status in Orders Workflow.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Timeline detail panel */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-4">
            <h3 className="mb-4 text-base font-semibold text-slate-800">Dispatch Timeline</h3>
            <div className="mb-4">
              <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0A3A92]">
                {orders.map(o => (
                  <option key={o.id} value={o.id}>{o.id} — {o.branch}</option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <>
                <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-[#1B4DB1]">{selectedOrder.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 grid grid-cols-2 gap-y-1.5 text-slate-600">
                    <span className="text-slate-500">Branch</span>
                    <span className="font-medium text-right">{selectedOrder.branch}</span>
                    <span className="text-slate-500">Priority</span>
                    <span className="font-medium text-right">{selectedOrder.priority}</span>
                    <span className="text-slate-500">Value</span>
                    <span className="font-medium text-right">₹{selectedOrder.value.toLocaleString("en-IN")}</span>
                    <span className="text-slate-500">Items</span>
                    <span className="font-medium text-right">{selectedOrder.items.length} products</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {LIFECYCLE.map((step, idx) => {
                    const done      = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        {idx > 0 && <ArrowRight className="hidden h-3 w-3" />}
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent ? "bg-[#0A3A92] text-white ring-2 ring-[#0A3A92]/20"
                          : done     ? "bg-[#0A3A92] text-white"
                          :            "bg-slate-100 text-slate-400"
                        }`}>{idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          {statusIcon(step)}
                          <span className={`text-sm ${done ? "font-semibold text-slate-800" : "text-slate-400"}`}>{step}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {/* Table */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
            <h3 className="mb-3 text-base font-semibold text-slate-800">Dispatch Orders</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {FILTER_TABS.map(tab => (
                <button key={tab.label} onClick={() => setFilter(tab.label)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors border
                    ${filter === tab.label ? `${tab.bg} ${tab.text} border-current` : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"}`}>
                  <tab.Icon className="h-3.5 w-3.5" />
                  {tab.label}
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === tab.label ? "bg-white/60" : "bg-slate-100"}`}>
                    {tab.value}
                  </span>
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Order ID</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedOrderId(order.id)}
                          className="font-mono text-xs font-semibold text-[#1B4DB1] hover:underline">
                          {order.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.branch}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${order.priority === "Urgent" ? "text-red-600" : "text-slate-500"}`}>{order.priority}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.items.length}</td>
                      <td className="px-4 py-3 text-slate-700">₹{order.value.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                          {statusIcon(order.status)}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </ErpLayout>
  );
}

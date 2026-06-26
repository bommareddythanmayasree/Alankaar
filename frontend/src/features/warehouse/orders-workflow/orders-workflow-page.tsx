import { useState, useEffect, useCallback } from "react";
import {
  Zap, CheckCircle2, Clock, ChevronRight, ArrowRight,
  Package, GitBranch, AlertTriangle, Factory,
  BarChart3, ChevronDown,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  WORKFLOW_ORDERS,
  PRODUCTION_REQUIREMENTS,
} from "../../../shared/data/workflow-mock-data";
import {
  getWorkflowOrders,
  initWorkflowOrders,
  updateWorkflowOrderStatus,
  setWorkflowOrderInvoice,
  nextDemoInvoiceNumber,
  type WorkflowLifecycleStatus,
  type WorkflowOrderLive,
} from "../../../shared/lib/demo-store";

// Seed localStorage from static mock data on first load
const STATIC_SEED: WorkflowOrderLive[] = WORKFLOW_ORDERS.map(o => ({
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

// ── Workflow Steps ────────────────────────────────────────────────────────────
const WORKFLOW_STEPS: WorkflowLifecycleStatus[] = [
  "Order Placed", "Under Review", "Approved", "Added To Production",
  "Production Started", "Production Completed", "Ready For Dispatch",
  "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
  "Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed",
];

// Map WorkflowLifecycleStatus → next allowed status
const NEXT_STATUS: Partial<Record<WorkflowLifecycleStatus, WorkflowLifecycleStatus>> = {
  "Order Placed":        "Under Review",
  "Under Review":        "Approved",
  "Approved":            "Added To Production",
  "Added To Production": "Production Started",
  "Production Started":  "Production Completed",
  "Production Completed":"Ready For Dispatch",
  "Ready For Dispatch":  "Morning Dispatch",
  "Morning Dispatch":    "In Transit",
  "Evening Dispatch":    "In Transit",
  "In Transit":          "Delivered",
  "Delivered":           "Invoice Generated",
  "Invoice Generated":   "Payment Pending",
  "Payment Pending":     "Payment Completed",
  "Payment Completed":   "Order Closed",
};

// Dispatch options for "Ready For Dispatch" → choose slot
const DISPATCH_SLOTS: WorkflowLifecycleStatus[] = ["Morning Dispatch", "Evening Dispatch"];

function stepIndex(s: WorkflowLifecycleStatus) { return WORKFLOW_STEPS.indexOf(s); }

function statusColors(s: WorkflowLifecycleStatus) {
  if (s === "Order Closed")         return { card: "border-slate-300 bg-slate-50/60",     badge: "bg-slate-200 text-slate-700",     dot: "bg-slate-500" };
  if (s === "Payment Completed")    return { card: "border-emerald-200 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600" };
  if (s === "Payment Pending")      return { card: "border-orange-200 bg-orange-50/30",   badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" };
  if (s === "Invoice Generated")    return { card: "border-violet-200 bg-violet-50/30",   badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" };
  if (s === "Delivered")            return { card: "border-teal-200 bg-teal-50/30",       badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "In Transit")           return { card: "border-sky-200 bg-sky-50/30",         badge: "bg-sky-100 text-sky-700",         dot: "bg-sky-500" };
  if (s === "Evening Dispatch")     return { card: "border-indigo-200 bg-indigo-50/30",   badge: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500" };
  if (s === "Morning Dispatch")     return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  if (s === "Ready For Dispatch")   return { card: "border-emerald-200 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  if (s === "Production Completed") return { card: "border-cyan-200 bg-cyan-50/30",       badge: "bg-cyan-100 text-cyan-700",       dot: "bg-cyan-500" };
  if (s === "Production Started")   return { card: "border-blue-200 bg-blue-50/30",       badge: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" };
  if (s === "Added To Production")  return { card: "border-indigo-200 bg-indigo-50/30",   badge: "bg-indigo-100 text-indigo-700",   dot: "bg-indigo-500" };
  if (s === "Approved")             return { card: "border-teal-200 bg-teal-50/30",       badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Under Review")         return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
  return { card: "border-slate-200 bg-white", badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
}

function priorityBadge(p: string) {
  return p === "Urgent"
    ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
    : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600";
}

function getActionLabel(status: WorkflowLifecycleStatus): string {
  const map: Partial<Record<WorkflowLifecycleStatus, string>> = {
    "Order Placed":         "Move to Under Review",
    "Under Review":         "Approve Order",
    "Approved":             "Add To Production",
    "Added To Production":  "Start Production",
    "Production Started":   "Mark Production Completed",
    "Production Completed": "Mark Ready For Dispatch",
    "Ready For Dispatch":   "Dispatch",
    "Morning Dispatch":     "Mark In Transit",
    "Evening Dispatch":     "Mark In Transit",
    "In Transit":           "Mark Delivered",
    "Delivered":            "Generate Invoice",
    "Invoice Generated":    "Mark Payment Pending",
    "Payment Pending":      "Mark Payment Completed",
    "Payment Completed":    "Close Order",
  };
  return map[status] ?? "";
}

// ── Mini Timeline component ───────────────────────────────────────────────────
function WorkflowTimeline({ currentStatus }: { currentStatus: WorkflowLifecycleStatus }) {
  const current = stepIndex(currentStatus);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${isCurrent ? "border-[#0B2C66] bg-[#0B2C66] text-white ring-2 ring-[#0B2C66]/20" : done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-400"}`}>
                {done && !isCurrent ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`mt-1 whitespace-nowrap text-center text-[9px] leading-tight ${done ? "font-semibold text-slate-700" : "text-slate-400"}`} style={{ maxWidth: 64 }}>{step}</span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 w-8 flex-shrink-0 ${i < current ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Production Impact Panel ───────────────────────────────────────────────────
function ProductionImpact({ order }: { order: WorkflowOrderLive }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Production Contribution from this Order</p>
      {order.items.filter(i => i.approvedQty > 0).map(item => {
        const req = PRODUCTION_REQUIREMENTS.find(r => r.product === item.product);
        const total = req?.totalRequiredKg ?? item.approvedQty;
        const pct = Math.round((item.approvedQty / total) * 100);
        return (
          <div key={item.product} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                  <Package className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.product}</div>
                  <div className="text-xs text-slate-500">This order: +{item.approvedQty} {item.unit}</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <div className="text-right">
                <div className="text-sm font-bold text-[#0B2C66]">{total} {item.unit}</div>
                <div className="text-xs text-slate-500">Total Required Today</div>
              </div>
            </div>
            <div className="mt-2">
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>This order's share</span>
                <span className="font-semibold text-indigo-600">{pct}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function OrdersWorkflowPage() {
  // Seed on first render
  useEffect(() => { initWorkflowOrders(STATIC_SEED); }, []);

  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"request" | "approval" | "production">("request");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkflowLifecycleStatus>("All");
  const [showDispatchSlot, setShowDispatchSlot] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadOrders = useCallback(() => {
    const live = getWorkflowOrders();
    if (live.length === 0) {
      initWorkflowOrders(STATIC_SEED);
      setOrders(STATIC_SEED);
      setSelectedId(prev => prev || STATIC_SEED[0]?.id || "");
    } else {
      setOrders(live);
      setSelectedId(prev => prev || live[0]?.id || "");
    }
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

  const selected = orders.find(o => o.id === selectedId) ?? orders[0];
  const filtered = statusFilter === "All" ? orders : orders.filter(o => o.status === statusFilter);

  const counts: Record<string, number> = {};
  orders.forEach(o => { counts[o.status] = (counts[o.status] ?? 0) + 1; });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleAdvance(slot?: WorkflowLifecycleStatus) {
    if (!selected) return;
    const current = selected.status;
    let next: WorkflowLifecycleStatus | undefined;

    if (current === "Ready For Dispatch" && slot) {
      next = slot;
      setShowDispatchSlot(false);
    } else if (current === "Delivered") {
      // Generate invoice
      const invNo = nextDemoInvoiceNumber();
      setWorkflowOrderInvoice(selected.id, invNo);
      showToast(`Invoice ${invNo} generated for ${selected.id}`);
      loadOrders();
      return;
    } else {
      next = NEXT_STATUS[current];
    }

    if (!next) return;
    updateWorkflowOrderStatus(selected.id, next);
    showToast(`${selected.id} → ${next}`);
    loadOrders();
  }

  if (!selected) return null;

  const actionLabel = getActionLabel(selected.status);
  const canAdvance = !!NEXT_STATUS[selected.status] || selected.status === "Delivered";
  const isReadyForDispatch = selected.status === "Ready For Dispatch";

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Orders Workflow")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Orders Workflow</h2>
        <p className="mt-1 text-slate-500">
          Master control — advance orders through the full lifecycle. Changes sync to all pages instantly.
        </p>
      </div>

      {/* Pipeline strip */}
      <div className="mb-5 flex items-stretch gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {[
          { label: "Order Placed",         color: "text-slate-600",   bg: "bg-slate-50" },
          { label: "Under Review",         color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Approved",             color: "text-teal-700",    bg: "bg-teal-50" },
          { label: "Added To Production",  color: "text-indigo-700",  bg: "bg-indigo-50" },
          { label: "Production Started",   color: "text-blue-700",    bg: "bg-blue-50" },
          { label: "Production Completed", color: "text-cyan-700",    bg: "bg-cyan-50" },
          { label: "Ready For Dispatch",   color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Morning Dispatch",     color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Evening Dispatch",     color: "text-indigo-700",  bg: "bg-indigo-50" },
          { label: "In Transit",           color: "text-sky-700",     bg: "bg-sky-50" },
          { label: "Delivered",            color: "text-teal-700",    bg: "bg-teal-50" },
          { label: "Invoice Generated",    color: "text-violet-700",  bg: "bg-violet-50" },
          { label: "Payment Pending",      color: "text-orange-700",  bg: "bg-orange-50" },
          { label: "Payment Completed",    color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Order Closed",         color: "text-slate-600",   bg: "bg-slate-100" },
        ].map((stage) => (
          <button key={stage.label}
            onClick={() => setStatusFilter(statusFilter === stage.label as WorkflowLifecycleStatus ? "All" : stage.label as WorkflowLifecycleStatus)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-3 transition-colors hover:bg-slate-50 ${statusFilter === stage.label ? stage.bg : ""}`}>
            <span className={`text-xl font-bold ${stage.color}`}>{counts[stage.label] ?? 0}</span>
            <span className="text-center text-[10px] leading-tight text-slate-500">{stage.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Order list */}
        <div className="space-y-2 xl:col-span-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              {statusFilter === "All" ? `All Orders (${orders.length})` : `${statusFilter} (${filtered.length})`}
            </h3>
            {statusFilter !== "All" && (
              <button onClick={() => setStatusFilter("All")} className="text-xs text-[#0B2C66] hover:underline">Clear filter</button>
            )}
          </div>
          {filtered.map(order => {
            const colors = statusColors(order.status);
            const isSelected = order.id === selectedId;
            return (
              <button key={order.id} onClick={() => { setSelectedId(order.id); setActiveTab("request"); setShowDispatchSlot(false); }}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${isSelected ? "border-[#0B2C66] shadow-md" : `border ${colors.card}`}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0B2C66]">{order.id}</span>
                      {order.priority === "Urgent" && (
                        <span className={priorityBadge("Urgent")}><Zap className="h-2.5 w-2.5" />Urgent</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                      <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                      {order.branch}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{order.time} · {order.items.length} items</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-slate-800">&#8377;{order.value.toLocaleString("en-IN")}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors.badge}`}>{order.status}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-0.5">
                  {WORKFLOW_STEPS.map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= stepIndex(order.status) ? "bg-[#0B2C66]" : "bg-slate-100"}`} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="rounded-xl border border-slate-200 bg-white xl:col-span-8">
          <div className="border-b border-slate-100 px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-[#0B2C66]">{selected.id}</span>
                  <span className={priorityBadge(selected.priority)}>
                    {selected.priority === "Urgent" && <Zap className="h-3 w-3" />}
                    {selected.priority}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors(selected.status).badge}`}>{selected.status}</span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" />{selected.branch}</span>
                  <span><Clock className="inline h-3.5 w-3.5 mr-1" />{selected.time}</span>
                  <span className="font-semibold text-slate-800">&#8377;{selected.value.toLocaleString("en-IN")}</span>
                </div>
              </div>
              {/* Action button */}
              {canAdvance && selected.status !== "Order Closed" && (
                <div className="relative">
                  {isReadyForDispatch && !showDispatchSlot ? (
                    <button onClick={() => setShowDispatchSlot(true)}
                      className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
                      <ChevronRight className="h-4 w-4" />
                      Dispatch
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  ) : isReadyForDispatch && showDispatchSlot ? (
                    <div className="flex gap-2">
                      {DISPATCH_SLOTS.map(slot => (
                        <button key={slot} onClick={() => handleAdvance(slot)}
                          className="rounded-lg bg-[#0B2C66] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors">
                          {slot}
                        </button>
                      ))}
                      <button onClick={() => setShowDispatchSlot(false)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-500 hover:bg-slate-50">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => handleAdvance()}
                      className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
                      <ChevronRight className="h-4 w-4" />
                      {actionLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4">
              <WorkflowTimeline currentStatus={selected.status} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(["request", "approval", "production"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-[#0B2C66] text-[#0B2C66]" : "text-slate-500 hover:text-slate-700"}`}>
                {tab === "request" ? "Order Request" : tab === "approval" ? "Approval" : "Production Impact"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === "request" && (
              <div>
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <InfoBox label="Branch" value={selected.branch} />
                  <InfoBox label="Requested Time" value={selected.time} />
                  <InfoBox label="Priority" value={selected.priority} highlight={selected.priority === "Urgent"} />
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Ordered Qty</th>
                      <th className="px-4 py-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.items.map(item => (
                      <tr key={item.product}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-800">{item.orderedQty}</td>
                        <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "approval" && (
              <div>
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  <span>Warehouse reviews available stock and approves/rejects quantities before adding to production.</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3 text-right">Ordered</th>
                      <th className="px-4 py-3 text-right">Approved</th>
                      <th className="px-4 py-3 text-right">Rejected</th>
                      <th className="px-4 py-3">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selected.items.map(item => (
                      <tr key={item.product}>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{item.orderedQty}</td>
                        <td className="px-4 py-3 text-right"><span className={`font-semibold ${item.approvedQty > 0 ? "text-emerald-600" : "text-slate-400"}`}>{item.approvedQty}</span></td>
                        <td className="px-4 py-3 text-right"><span className={`font-semibold ${item.rejectedQty > 0 ? "text-red-500" : "text-slate-400"}`}>{item.rejectedQty}</span></td>
                        <td className="px-4 py-3 text-slate-500">{item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selected.items.some(i => i.rejectedQty > 0) && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Some quantities were partially rejected due to stock constraints.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "production" && (
              <div>
                {selected.items.some(i => i.approvedQty > 0) ? (
                  <ProductionImpact order={selected} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Factory className="mb-3 h-10 w-10" />
                    <p className="text-sm">Production impact visible after approval.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErpLayout>
  );
}

function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  Zap, CheckCircle2, Clock, ChevronRight,
  GitBranch, AlertTriangle,
  BarChart3, Plus, Package,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { formatCurrency } from "../../../shared/utils/format-currency";
import {
  WORKFLOW_ORDERS,
} from "../../../shared/data/workflow-mock-data";
import {
  getWorkflowOrders,
  updateWorkflowOrderStatus,
  getDriverPool,
  getVehiclePool,
  resetDriverVehiclePool,
  addDispatchBatch,
  getDispatchBatchesForOrder,
  getUnassignedOrderProducts,
  markBatchInTransit,
  type WorkflowLifecycleStatus,
  type WorkflowOrderLive,
  type DriverRecord,
  type VehicleRecord,
  type DispatchBatch,
  type DispatchBatchProduct,
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
  invoiceNumber: o.invoiceNumber,
  deliveredDate: o.deliveredDate,
}));

// ── Workflow Steps ────────────────────────────────────────────────────────────
const WORKFLOW_STEPS: WorkflowLifecycleStatus[] = [
  "Order Placed", "Under Review", "Approved", "Added To Production",
  "Production Started", "Production Completed", "Ready For Dispatch",
  "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
  "Partially Delivered", "Awaiting Invoice", "Invoice Generated",
  "Payment Pending", "Payment Completed", "Order Closed",
];

// Map WorkflowLifecycleStatus → next allowed status (for non-approve/reject advance)
const NEXT_STATUS: Partial<Record<WorkflowLifecycleStatus, WorkflowLifecycleStatus>> = {
  "Order Placed":        "Under Review",
  "Approved":            "Added To Production",
  "Added To Production": "Production Started",
  "Production Started":  "Production Completed",
  "Production Completed":"Ready For Dispatch",
  // "Ready For Dispatch" → handled via multi-batch dispatch modal
  // "Delivered" → "Awaiting Invoice" via Delivery Tracking batch confirmation
  // "Awaiting Invoice" → "Invoice Generated" → "Payment Pending" via Invoice Generation page
  // "Payment Pending" → "Payment Completed" → auto "Order Closed" via Collections page
};

// Statuses that show Approve / Reject instead of (or alongside) Advance
const VERIFICATION_STATUSES: WorkflowLifecycleStatus[] = ["Order Placed", "Under Review"];

// Dispatch slot options
const DISPATCH_SLOT_OPTIONS: Array<"Morning" | "Evening"> = ["Morning", "Evening"];

function stepIndex(s: WorkflowLifecycleStatus) { return WORKFLOW_STEPS.indexOf(s); }

function statusColors(s: WorkflowLifecycleStatus) {
  if (s === "Order Closed")         return { card: "border-slate-300 bg-slate-50/60",     badge: "bg-slate-200 text-slate-700",     dot: "bg-slate-500" };
  if (s === "Rejected")             return { card: "border-red-200 bg-red-50/40",          badge: "bg-red-100 text-red-700",          dot: "bg-red-500" };
  if (s === "Payment Completed")    return { card: "border-emerald-200 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-600" };
  if (s === "Payment Pending")      return { card: "border-orange-200 bg-orange-50/30",   badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" };
  if (s === "Invoice Generated")    return { card: "border-violet-200 bg-violet-50/30",   badge: "bg-violet-100 text-violet-700",   dot: "bg-violet-500" };
  if (s === "Awaiting Invoice")     return { card: "border-orange-200 bg-orange-50/30",   badge: "bg-orange-100 text-orange-700",   dot: "bg-orange-500" };
  if (s === "Delivered")            return { card: "border-teal-200 bg-teal-50/30",       badge: "bg-teal-100 text-teal-700",       dot: "bg-teal-500" };
  if (s === "Partially Delivered")  return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" };
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
    "Approved":             "Add To Production",
    "Added To Production":  "Start Production",
    "Production Started":   "Mark Production Completed",
    "Production Completed": "Mark Ready For Dispatch",
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export function OrdersWorkflowPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"request" | "approval" | "batches">("request");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkflowLifecycleStatus>("All");
  const [toast, setToast] = useState<string | null>(null);

  // Batch dispatch modal state
  const [batchModal, setBatchModal] = useState<boolean>(false);
  const [batchSlot, setBatchSlot] = useState<"Morning" | "Evening">("Morning");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  // Product selection for the batch
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  // Dispatch batches for selected order
  const [batches, setBatches] = useState<DispatchBatch[]>([]);

  const loadOrders = useCallback(() => {
    const live = getWorkflowOrders();
    const mockIds = new Set(STATIC_SEED.map(o => o.id));
    const liveIds = new Set(live.map(o => o.id));
    const newLiveOrders = live.filter(o => !mockIds.has(o.id));
    const mergedMock = STATIC_SEED.map(o => liveIds.has(o.id) ? live.find(l => l.id === o.id)! : o);
    const merged = [...newLiveOrders, ...mergedMock];
    setOrders(merged);
    setSelectedId(prev => prev || merged[0]?.id || "");
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

  // Load batches for selected order
  useEffect(() => {
    if (selected) {
      setBatches(getDispatchBatchesForOrder(selected.id));
    }
  }, [selected, orders]);

  // Also refresh batches on storage events
  const loadBatches = useCallback(() => {
    if (selected) setBatches(getDispatchBatchesForOrder(selected.id));
  }, [selected]);
  useEffect(() => {
    window.addEventListener("storage", loadBatches);
    return () => window.removeEventListener("storage", loadBatches);
  }, [loadBatches]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleApprove() {
    if (!selected) return;
    updateWorkflowOrderStatus(selected.id, "Approved");
    showToast(`${selected.id} → Approved`);
    loadOrders();
  }

  function handleReject() {
    if (!selected) return;
    updateWorkflowOrderStatus(selected.id, "Rejected");
    showToast(`${selected.id} → Rejected`);
    loadOrders();
  }

  function handleAdvance() {
    if (!selected) return;
    const next = NEXT_STATUS[selected.status];
    if (!next) return;
    updateWorkflowOrderStatus(selected.id, next);
    showToast(`${selected.id} → ${next}`);
    loadOrders();
  }

  function openBatchModal() {
    if (!selected) return;
    setDrivers(getDriverPool().filter(d => d.status === "Available"));
    setVehicles(getVehiclePool().filter(v => v.status === "Available"));
    setSelectedDriver("");
    setSelectedVehicle("");
    setBatchSlot("Morning");
    // Only pre-select products NOT already assigned to another batch
    const unassigned = getUnassignedOrderProducts(selected.id, selected.items);
    setSelectedProducts(new Set(unassigned.map(i => i.product)));
    setBatchModal(true);
  }

  function handleCreateBatch() {
    if (!selected || !selectedDriver || !selectedVehicle || selectedProducts.size === 0) return;
    const products: DispatchBatchProduct[] = selected.items
      .filter(i => selectedProducts.has(i.product))
      .map(i => ({
        product: i.product,
        unit: i.unit,
        qty: i.approvedQty > 0 ? i.approvedQty : i.orderedQty,
      }));
    const batch = addDispatchBatch(selected.id, batchSlot, selectedDriver, selectedVehicle, products);
    if (batch) {
      showToast(`Batch ${batch.batchNumber} (${batchSlot}) created for ${selected.id}`);
      setBatchModal(false);
      setBatches(getDispatchBatchesForOrder(selected.id));
      setActiveTab("batches");
      loadOrders();
    }
  }

  function handleAdvanceBatch(batchId: string, currentStatus: DispatchBatch["status"]) {
    // Batches can only advance to "In Transit" from here.
    // "Delivered" is set exclusively via the Delivery Tracking confirm-delivery workflow.
    if (currentStatus !== "Scheduled") return;
    // markBatchInTransit updates the batch AND derives the order status — no direct order mutation.
    markBatchInTransit(batchId);
    showToast(`Batch → In Transit`);
    setBatches(getDispatchBatchesForOrder(selected!.id));
    loadOrders();
  }

  function handleResetPool() {
    resetDriverVehiclePool();
    setDrivers(getDriverPool().filter(d => d.status === "Available"));
    setVehicles(getVehiclePool().filter(v => v.status === "Available"));
    setSelectedDriver("");
    setSelectedVehicle("");
  }

  if (!selected) return null;

  const actionLabel = getActionLabel(selected.status);
  const isVerificationStatus = VERIFICATION_STATUSES.includes(selected.status);
  const canAdvance = !isVerificationStatus && !!NEXT_STATUS[selected.status];
  const isReadyForDispatch = selected.status === "Ready For Dispatch";
  const isRejected = selected.status === "Rejected";

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
          { label: "Rejected",             color: "text-red-700",     bg: "bg-red-50" },
          { label: "Added To Production",  color: "text-indigo-700",  bg: "bg-indigo-50" },
          { label: "Production Started",   color: "text-blue-700",    bg: "bg-blue-50" },
          { label: "Production Completed", color: "text-cyan-700",    bg: "bg-cyan-50" },
          { label: "Ready For Dispatch",   color: "text-emerald-700", bg: "bg-emerald-50" },
          { label: "Morning Dispatch",     color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Evening Dispatch",     color: "text-indigo-700",  bg: "bg-indigo-50" },
          { label: "In Transit",           color: "text-sky-700",     bg: "bg-sky-50" },
          { label: "Delivered",            color: "text-teal-700",    bg: "bg-teal-50" },
          { label: "Partially Delivered", color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Invoice Generated",   color: "text-violet-700",  bg: "bg-violet-50" },
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
              <button key={order.id} onClick={() => { setSelectedId(order.id); setActiveTab("request"); }}
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
                    <div className="text-sm font-semibold text-slate-800">{formatCurrency(order.value)}</div>
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
                  <span className="font-semibold text-slate-800">{formatCurrency(selected.value)}</span>
                </div>
              </div>
              {/* Action buttons */}
              {isVerificationStatus && !isRejected && (
                <div className="flex gap-2">
                  <button onClick={handleApprove}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                  <button onClick={handleReject}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                    <AlertTriangle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              )}
              {canAdvance && selected.status !== "Order Closed" && (
                <div className="relative">
                  <button onClick={handleAdvance}
                    className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                    {actionLabel}
                  </button>
                </div>
              )}
              {isReadyForDispatch && (
                <button onClick={openBatchModal}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                  <Plus className="h-4 w-4" />
                  Add Dispatch Batch
                </button>
              )}
            </div>
            <div className="mt-4">
              <WorkflowTimeline currentStatus={selected.status} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(["request", "approval", "batches"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-[#0B2C66] text-[#0B2C66]" : "text-slate-500 hover:text-slate-700"}`}>
                {tab === "request" ? "Order Request" : tab === "approval" ? "Approval" : `Dispatch Batches${batches.length > 0 ? ` (${batches.length})` : ""}`}
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
                {/* Order Placed — waiting for review to begin */}
                {selected.status === "Order Placed" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">Waiting for warehouse review.</p>
                    <p className="mt-1 text-xs text-slate-400">Move the order to "Under Review" to begin the approval process.</p>
                  </div>
                )}

                {/* Under Review — show product list for review, no approved products yet */}
                {selected.status === "Under Review" && (
                  <div>
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      <BarChart3 className="h-4 w-4 text-amber-500" />
                      <span>Review the requested products and quantities, then approve or reject the order using the buttons above.</span>
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Products Under Review</p>
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
                    <p className="mt-4 text-center text-xs text-slate-400">Products will appear here after approval.</p>
                  </div>
                )}

                {/* Rejected — show rejection state, no approved products */}
                {selected.status === "Rejected" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="mb-3 h-10 w-10 text-red-300" />
                    <p className="text-sm font-semibold text-red-600">Order Rejected</p>
                    <p className="mt-1 text-xs text-slate-400">This order was rejected and will not proceed to production.</p>
                  </div>
                )}

                {/* Approved or beyond — show approved products and enable Add to Production */}
                {selected.status !== "Order Placed" && selected.status !== "Under Review" && selected.status !== "Rejected" && (
                  <div>
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Order approved. Products are confirmed and ready for production.</span>
                    </div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Approved Products</p>
                    <ul className="space-y-1">
                      {selected.items.map(item => (
                        <li key={item.product} className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                          {item.product}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "batches" && (
              <div className="space-y-4">
                {batches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Package className="mb-2 h-8 w-8" />
                    <p className="text-sm text-slate-500">No dispatch batches created yet.</p>
                    {isReadyForDispatch && (
                      <button onClick={openBatchModal}
                        className="mt-3 flex items-center gap-1 rounded-lg bg-[#0B2C66] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors">
                        <Plus className="h-3.5 w-3.5" />Add First Batch
                      </button>
                    )}
                  </div>
                ) : (
                  batches.map(batch => {
                    const batchStatusColor =
                      batch.status === "Delivered" ? "bg-emerald-100 text-emerald-700"
                      : batch.status === "In Transit" ? "bg-sky-100 text-sky-700"
                      : "bg-amber-100 text-amber-700";
                    return (
                      <div key={batch.batchId} className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Batch {batch.batchNumber}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${batch.slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                              {batch.slot} Dispatch
                            </span>
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${batchStatusColor}`}>
                              {batch.status}
                            </span>
                          </div>
                          {batch.status === "Scheduled" && (
                            <button
                              onClick={() => handleAdvanceBatch(batch.batchId, batch.status)}
                              className="rounded-lg bg-[#0B2C66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors">
                              Mark In Transit
                            </button>
                          )}
                          {batch.status === "In Transit" && (
                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                              Awaiting Delivery Confirmation
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 text-xs">
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[10px] text-slate-400 uppercase">Driver</p>
                            <p className="font-semibold text-slate-800">{batch.driverName}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[10px] text-slate-400 uppercase">Vehicle</p>
                            <p className="font-semibold text-slate-800">{batch.vehicleNumber}</p>
                          </div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-[10px] text-slate-400 uppercase">Dispatch Time</p>
                            <p className="font-semibold text-slate-800">{batch.dispatchTime}</p>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Products in this batch</p>
                          <div className="space-y-1">
                            {batch.products.map(p => (
                              <div key={p.product} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                                <span className="text-slate-800">{p.product}</span>
                                <span className="text-xs text-slate-500">{p.qty} {p.unit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {isReadyForDispatch && batches.length > 0 && (() => {
                  const unassigned = getUnassignedOrderProducts(selected!.id, selected!.items);
                  if (unassigned.length === 0) return null;
                  return (
                    <button onClick={openBatchModal}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-[#0B2C66] hover:text-[#0B2C66] transition-colors">
                      <Plus className="h-4 w-4" />Add Another Batch
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Dispatch Batch Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Create Dispatch Batch</h3>
                <p className="text-xs text-slate-500 mt-0.5">Order {selected?.id} — Batch {batches.length + 1}</p>
              </div>
              <button onClick={() => setBatchModal(false)} className="text-xl leading-none text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              {/* Slot selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dispatch Slot</label>
                <div className="flex gap-2">
                  {DISPATCH_SLOT_OPTIONS.map(slot => (
                    <button key={slot} onClick={() => setBatchSlot(slot)}
                      className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-colors ${batchSlot === slot ? "border-[#0B2C66] bg-[#EEF4FF] text-[#0B2C66]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      {slot} Dispatch
                    </button>
                  ))}
                </div>
              </div>

              {/* Product selection — only unassigned products shown */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Products in this batch <span className="text-red-500">*</span>
                </label>
                {(() => {
                  const unassigned = getUnassignedOrderProducts(selected!.id, selected!.items);
                  const assigned = selected!.items.filter(i => !unassigned.find(u => u.product === i.product));
                  return (
                    <div className="space-y-1.5">
                      {unassigned.map(item => (
                        <button key={item.product}
                          onClick={() => {
                            setSelectedProducts(prev => {
                              const next = new Set(prev);
                              if (next.has(item.product)) next.delete(item.product);
                              else next.add(item.product);
                              return next;
                            });
                          }}
                          className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${selectedProducts.has(item.product) ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                          <span className="font-medium text-slate-800">{item.product}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{item.approvedQty > 0 ? item.approvedQty : item.orderedQty} {item.unit}</span>
                            <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${selectedProducts.has(item.product) ? "border-[#0B2C66] bg-[#0B2C66]" : "border-slate-300"}`}>
                              {selectedProducts.has(item.product) && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                          </div>
                        </button>
                      ))}
                      {assigned.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Already in another batch</p>
                          {assigned.map(item => (
                            <div key={item.product}
                              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm opacity-50 cursor-not-allowed">
                              <span className="font-medium text-slate-500">{item.product}</span>
                              <span className="text-xs text-slate-400">Assigned</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {unassigned.length === 0 && (
                        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">All products are already assigned to batches.</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Driver Selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select Driver</label>
                {drivers.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No available drivers right now.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {drivers.map(d => (
                      <button key={d.id} onClick={() => setSelectedDriver(d.id)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${selectedDriver === d.id ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <div className="text-left">
                          <p className="font-semibold text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-400">{d.phone}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Available</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select Vehicle</label>
                {vehicles.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No available vehicles right now.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {vehicles.map(v => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v.id)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${selectedVehicle === v.id ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <div className="text-left">
                          <p className="font-semibold text-slate-800">{v.number}</p>
                          <p className="text-xs text-slate-400">{v.type}</p>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Available</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(drivers.length === 0 || vehicles.length === 0) && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-2">Reset the pool to make drivers and vehicles available again.</p>
                  <button onClick={handleResetPool}
                    className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors">
                    Reset Driver &amp; Vehicle Pool
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setBatchModal(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleCreateBatch}
                disabled={!selectedDriver || !selectedVehicle || selectedProducts.size === 0}
                className="flex-1 rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#092757] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
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

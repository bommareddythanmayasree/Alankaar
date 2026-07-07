import { useState, useEffect, useCallback } from "react";
import {
  Zap, CheckCircle2, Clock, ChevronRight,
  GitBranch, AlertTriangle, X,
  BarChart3, Plus, Package, ThumbsUp, ThumbsDown, FileText,
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
  submitOrderReview,
  getReviewLog,
  type WorkflowLifecycleStatus,
  type WorkflowOrderLive,
  type DriverRecord,
  type VehicleRecord,
  type DispatchBatch,
  type DispatchBatchProduct,
  type OrderReviewItem,
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
  "Order Placed", "Under Review", "Pending Review",
  "Approved", "Partially Approved", "Rejected", "Resubmitted",
  "Added To Production", "Production Started", "Production Completed", "Ready For Dispatch",
  "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
  "Partially Delivered", "Awaiting Invoice", "Invoice Generated",
  "Payment Pending", "Payment Completed", "Order Closed",
];

// Map WorkflowLifecycleStatus → next allowed status
const NEXT_STATUS: Partial<Record<WorkflowLifecycleStatus, WorkflowLifecycleStatus>> = {
  "Order Placed":        "Under Review",
  "Resubmitted":         "Under Review",
  "Approved":            "Added To Production",
  "Added To Production": "Production Started",
  "Production Started":  "Production Completed",
  "Production Completed":"Ready For Dispatch",
};

// Statuses where warehouse reviews (shows Review Panel instead of simple approve/reject)
const REVIEW_STATUSES: WorkflowLifecycleStatus[] = ["Under Review", "Resubmitted"];
// Statuses where we show "Move to Under Review" button
const ADVANCE_TO_REVIEW_STATUSES: WorkflowLifecycleStatus[] = ["Order Placed"];

const REJECTION_REASONS = [
  "Out of Stock",
  "Production Capacity Full",
  "Raw Material Shortage",
  "Seasonal Product",
  "Factory Closed",
  "Holiday",
  "Other",
];

const DISPATCH_SLOT_OPTIONS: Array<"Morning" | "Evening"> = ["Morning", "Evening"];

function stepIndex(s: WorkflowLifecycleStatus) { return WORKFLOW_STEPS.indexOf(s); }

function statusColors(s: WorkflowLifecycleStatus) {
  if (s === "Order Closed")           return { card: "border-slate-300 bg-slate-50/60",     badge: "bg-slate-200 text-slate-700" };
  if (s === "Rejected")               return { card: "border-red-200 bg-red-50/40",          badge: "bg-red-100 text-red-700" };
  if (s === "Partially Approved")     return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700" };
  if (s === "Resubmitted")            return { card: "border-violet-200 bg-violet-50/30",   badge: "bg-violet-100 text-violet-700" };
  if (s === "Payment Completed")      return { card: "border-emerald-200 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" };
  if (s === "Payment Pending")        return { card: "border-orange-200 bg-orange-50/30",   badge: "bg-orange-100 text-orange-700" };
  if (s === "Invoice Generated")      return { card: "border-violet-200 bg-violet-50/30",   badge: "bg-violet-100 text-violet-700" };
  if (s === "Awaiting Invoice")       return { card: "border-orange-200 bg-orange-50/30",   badge: "bg-orange-100 text-orange-700" };
  if (s === "Delivered")              return { card: "border-teal-200 bg-teal-50/30",       badge: "bg-teal-100 text-teal-700" };
  if (s === "Partially Delivered")    return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700" };
  if (s === "In Transit")             return { card: "border-sky-200 bg-sky-50/30",         badge: "bg-sky-100 text-sky-700" };
  if (s === "Evening Dispatch")       return { card: "border-indigo-200 bg-indigo-50/30",   badge: "bg-indigo-100 text-indigo-700" };
  if (s === "Morning Dispatch")       return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700" };
  if (s === "Ready For Dispatch")     return { card: "border-emerald-200 bg-emerald-50/40", badge: "bg-emerald-100 text-emerald-700" };
  if (s === "Production Completed")   return { card: "border-cyan-200 bg-cyan-50/30",       badge: "bg-cyan-100 text-cyan-700" };
  if (s === "Production Started")     return { card: "border-blue-200 bg-blue-50/30",       badge: "bg-blue-100 text-blue-700" };
  if (s === "Added To Production")    return { card: "border-indigo-200 bg-indigo-50/30",   badge: "bg-indigo-100 text-indigo-700" };
  if (s === "Approved")               return { card: "border-teal-200 bg-teal-50/30",       badge: "bg-teal-100 text-teal-700" };
  if (s === "Pending Review")         return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700" };
  if (s === "Under Review")           return { card: "border-amber-200 bg-amber-50/30",     badge: "bg-amber-100 text-amber-700" };
  return { card: "border-slate-200 bg-white", badge: "bg-slate-100 text-slate-600" };
}

function priorityBadge(p: string) {
  return p === "Urgent"
    ? "inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700"
    : "inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600";
}

function getActionLabel(status: WorkflowLifecycleStatus): string {
  const map: Partial<Record<WorkflowLifecycleStatus, string>> = {
    "Order Placed":         "Move to Under Review",
    "Resubmitted":          "Move to Under Review",
    "Approved":             "Add To Production",
    "Added To Production":  "Start Production",
    "Production Started":   "Mark Production Completed",
    "Production Completed": "Mark Ready For Dispatch",
  };
  return map[status] ?? "";
}

// ── InfoBox helper ────────────────────────────────────────────────────────────
function InfoBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${highlight ? "text-red-600" : "text-slate-800"}`}>{value}</p>
    </div>
  );
}

// ── Mini Timeline component ───────────────────────────────────────────────────
function WorkflowTimeline({ currentStatus }: { currentStatus: WorkflowLifecycleStatus }) {
  // Use a simplified linear display (skip branching statuses from main flow)
  const mainSteps: WorkflowLifecycleStatus[] = [
    "Order Placed", "Under Review", "Approved", "Added To Production",
    "Production Started", "Production Completed", "Ready For Dispatch",
    "Morning Dispatch", "Evening Dispatch", "In Transit", "Delivered",
    "Awaiting Invoice", "Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed",
  ];
  // For special statuses show where they fit
  const effectiveStatus: WorkflowLifecycleStatus =
    currentStatus === "Pending Review" ? "Under Review"
    : currentStatus === "Partially Approved" || currentStatus === "Resubmitted" ? "Under Review"
    : currentStatus === "Rejected" ? "Under Review"
    : currentStatus === "Partially Delivered" ? "Delivered"
    : currentStatus === "Payment Verification Pending" ? "Payment Pending"
    : currentStatus;
  const current = mainSteps.indexOf(effectiveStatus);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {mainSteps.map((step, i) => {
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
            {i < mainSteps.length - 1 && (
              <div className={`mb-4 h-0.5 w-8 flex-shrink-0 ${i < current ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reject entire order modal ─────────────────────────────────────────────────
function RejectOrderModal({
  orderId,
  onConfirm,
  onClose,
}: {
  orderId: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [custom, setCustom] = useState("");
  const finalReason = reason === "Other" ? custom.trim() : reason;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Reject Entire Order</h3>
            <p className="mt-0.5 text-xs text-slate-500">Order {orderId} — this cannot be undone</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Rejection Reason <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {REJECTION_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${reason === r ? "border-red-400 bg-red-50 text-red-700 font-semibold" : "border-slate-200 hover:bg-slate-50 text-slate-700"}`}>
                {r}
              </button>
            ))}
          </div>
          {reason === "Other" && (
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Describe the reason..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-red-400 h-20 resize-none"
            />
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            disabled={!finalReason}
            onClick={() => finalReason && onConfirm(finalReason)}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40 transition-colors">
            Reject Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Panel ──────────────────────────────────────────────────────────────
type ReviewState = {
  decision: "Approved" | "Rejected";
  approvedQty: number;
  rejectionReason: string;
};

function ReviewPanel({
  order,
  onSubmit,
  onFullReject,
}: {
  order: WorkflowOrderLive;
  onSubmit: (items: OrderReviewItem[]) => void;
  onFullReject: () => void;
}) {
  const [rows, setRows] = useState<ReviewState[]>(() =>
    order.items.map(i => ({ decision: "Approved", approvedQty: i.orderedQty, rejectionReason: "" }))
  );

  function setDecision(idx: number, decision: "Approved" | "Rejected") {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, decision } : r));
  }
  function setQty(idx: number, qty: number) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, approvedQty: Math.max(1, qty) } : r));
  }
  function setRejectionReason(idx: number, reason: string) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, rejectionReason: reason } : r));
  }

  const approvedCount = rows.filter(r => r.decision === "Approved").length;
  const rejectedCount = rows.filter(r => r.decision === "Rejected").length;

  const outcome = rejectedCount === 0 ? "Full Approval"
    : approvedCount === 0 ? "Full Rejection"
    : "Partial Approval";

  const outcomeColor = outcome === "Full Approval" ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : outcome === "Full Rejection" ? "text-red-700 bg-red-50 border-red-200"
    : "text-amber-700 bg-amber-50 border-amber-200";

  function canSubmit() {
    return rows.every(r =>
      r.decision === "Approved" || (r.decision === "Rejected" && r.rejectionReason.trim().length > 0)
    );
  }

  function handleSubmit() {
    if (!canSubmit()) return;
    const items: OrderReviewItem[] = order.items.map((item, idx) => ({
      product: item.product,
      unit: item.unit,
      orderedQty: item.orderedQty,
      decision: rows[idx].decision,
      approvedQty: rows[idx].decision === "Approved" ? rows[idx].approvedQty : 0,
      rejectionReason: rows[idx].decision === "Rejected" ? rows[idx].rejectionReason : undefined,
    }));
    onSubmit(items);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${outcomeColor}`}>
          <span className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${outcomeColor}`}>
            Outcome: {outcome}
          </span>
          <span className="text-xs text-slate-400">
            ({approvedCount} approved · {rejectedCount} rejected)
          </span>
        </div>
        <button onClick={onFullReject}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors">
          <ThumbsDown className="h-3.5 w-3.5" />
          Reject Entire Order
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3 text-right">Ordered</th>
              <th className="px-4 py-3 text-center">Decision</th>
              <th className="px-4 py-3 text-right">Approved Qty</th>
              <th className="px-4 py-3">Rejection Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => {
              const row = rows[idx];
              const isRejected = row.decision === "Rejected";
              return (
                <tr key={item.product} className={isRejected ? "bg-red-50/40" : ""}>
                  <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{item.orderedQty} {item.unit}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDecision(idx, "Approved")}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${!isRejected ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        <ThumbsUp className="h-3 w-3" />Approve
                      </button>
                      <button onClick={() => setDecision(idx, "Rejected")}
                        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${isRejected ? "border-red-400 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
                        <ThumbsDown className="h-3 w-3" />Reject
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!isRejected ? (
                      <input
                        type="number"
                        min={1}
                        max={item.orderedQty}
                        value={row.approvedQty}
                        onChange={e => setQty(idx, Number(e.target.value))}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-[#0B2C66]"
                      />
                    ) : (
                      <span className="text-xs text-red-400 font-medium">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isRejected ? (
                      <select
                        value={row.rejectionReason}
                        onChange={e => setRejectionReason(idx, e.target.value)}
                        className={`w-full rounded-lg border px-2 py-1.5 text-sm outline-none focus:border-red-400 ${!row.rejectionReason ? "border-red-300 bg-red-50" : "border-slate-200"}`}>
                        <option value="">Select reason *</option>
                        {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!canSubmit() && (
        <p className="text-xs text-red-600 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          All rejected products must have a reason before submitting.
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          disabled={!canSubmit()}
          onClick={handleSubmit}
          className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a2559] disabled:opacity-40 transition-colors">
          <FileText className="h-4 w-4" />
          Submit Review
        </button>
      </div>
    </div>
  );
}

// ── Review Log component ──────────────────────────────────────────────────────
function ReviewLog({ orderId }: { orderId: string }) {
  const entries = getReviewLog(orderId);

  // Seed demo log entries for demo orders so client demo looks populated
  const demoLogs: Record<string, Array<{ timestamp: string; actor: "Warehouse" | "Branch"; action: string; detail?: string }>> = {
    "ORD-DEMO-PA": [
      { timestamp: "Jun 21, 2026, 09:16 AM", actor: "Warehouse", action: "Reduced Boondi Laddu quantity", detail: "30 Kg → 15 Kg" },
      { timestamp: "Jun 21, 2026, 09:15 AM", actor: "Warehouse", action: "Rejected Mysore Pak", detail: "Out of Stock" },
      { timestamp: "Jun 21, 2026, 09:15 AM", actor: "Warehouse", action: "Approved Kaju Katli" },
    ],
    "ORD-DEMO-FR": [
      { timestamp: "Jun 21, 2026, 09:32 AM", actor: "Warehouse", action: "Rejected Gulab Jamun", detail: "Production Capacity Full" },
      { timestamp: "Jun 21, 2026, 09:31 AM", actor: "Warehouse", action: "Rejected Dry Fruit Barfi", detail: "Factory Closed" },
    ],
    "ORD-DEMO-FA": [
      { timestamp: "Jun 21, 2026, 09:02 AM", actor: "Warehouse", action: "Approved Boondi Laddu" },
      { timestamp: "Jun 21, 2026, 09:02 AM", actor: "Warehouse", action: "Approved Mysore Pak" },
      { timestamp: "Jun 21, 2026, 09:01 AM", actor: "Warehouse", action: "Approved Kaju Katli" },
    ],
    "ORD-DEMO-RS": [
      { timestamp: "Jun 21, 2026, 09:50 AM", actor: "Branch", action: "Resubmitted Order", detail: "Branch revised and resubmitted for warehouse review" },
      { timestamp: "Jun 21, 2026, 09:48 AM", actor: "Branch", action: "Rejected Accept Changes" },
      { timestamp: "Jun 21, 2026, 09:47 AM", actor: "Warehouse", action: "Rejected Milk Bread", detail: "Production Capacity Full" },
      { timestamp: "Jun 21, 2026, 09:46 AM", actor: "Warehouse", action: "Approved Rasgulla" },
      { timestamp: "Jun 21, 2026, 09:46 AM", actor: "Warehouse", action: "Approved Kalakand" },
    ],
  };

  const displayEntries = entries.length > 0 ? entries : (demoLogs[orderId] ?? []);

  if (displayEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <FileText className="mb-2 h-7 w-7" />
        <p className="text-sm text-slate-500">No review activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayEntries.map((entry, i) => (
        <div key={i} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
          <div className="flex flex-col items-center gap-1 pt-0.5">
            <div className={`h-2 w-2 rounded-full flex-shrink-0 ${entry.actor === "Warehouse" ? "bg-[#0B2C66]" : "bg-amber-500"}`} />
            {i < displayEntries.length - 1 && <div className="w-0.5 flex-1 bg-slate-200" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${entry.actor === "Warehouse" ? "bg-[#0B2C66]/10 text-[#0B2C66]" : "bg-amber-100 text-amber-700"}`}>
                {entry.actor}
              </span>
              <span className="text-slate-700 font-medium">{entry.action}</span>
            </div>
            {entry.detail && <p className="mt-0.5 text-xs text-slate-500">{entry.detail}</p>}
            <p className="mt-1 text-[10px] text-slate-400">{entry.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function OrdersWorkflowPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"request" | "review" | "batches" | "log">("request");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkflowLifecycleStatus>("All");
  const [toast, setToast] = useState<string | null>(null);

  // Reject order modal
  const [rejectModal, setRejectModal] = useState(false);

  // Batch dispatch modal state
  const [batchModal, setBatchModal] = useState<boolean>(false);
  const [batchSlot, setBatchSlot] = useState<"Morning" | "Evening">("Morning");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (selected) setBatches(getDispatchBatchesForOrder(selected.id));
  }, [selected, orders]);

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

  // Handle "Move to Under Review" or other simple advances
  function handleAdvance() {
    if (!selected) return;
    const next = NEXT_STATUS[selected.status];
    if (!next) return;
    updateWorkflowOrderStatus(selected.id, next);
    showToast(`${selected.id} → ${next}`);
    loadOrders();
  }

  // Handle full approval (from review panel — all products approved)
  function handleReviewSubmit(items: OrderReviewItem[]) {
    if (!selected) return;
    submitOrderReview(selected.id, items);
    showToast(`${selected.id} → Review Submitted`);
    loadOrders();
    setActiveTab("log");
  }

  // Handle full rejection via modal
  function handleFullReject(reason: string) {
    if (!selected) return;
    submitOrderReview(
      selected.id,
      selected.items.map(item => ({
        product: item.product,
        unit: item.unit,
        orderedQty: item.orderedQty,
        decision: "Rejected" as const,
        approvedQty: 0,
        rejectionReason: reason,
      })),
      reason,
    );
    setRejectModal(false);
    showToast(`${selected.id} → Rejected`);
    loadOrders();
    setActiveTab("log");
  }

  function openBatchModal() {
    if (!selected) return;
    setDrivers(getDriverPool().filter(d => d.status === "Available"));
    setVehicles(getVehiclePool().filter(v => v.status === "Available"));
    setSelectedDriver("");
    setSelectedVehicle("");
    setBatchSlot("Morning");
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
    if (currentStatus !== "Scheduled") return;
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

  const isReviewStatus = REVIEW_STATUSES.includes(selected.status);
  const isAdvanceToReview = ADVANCE_TO_REVIEW_STATUSES.includes(selected.status);
  const canAdvance = !isReviewStatus && !!NEXT_STATUS[selected.status];
  const isReadyForDispatch = selected.status === "Ready For Dispatch";
  const isRejected = selected.status === "Rejected";
  const isPartiallyApproved = selected.status === "Partially Approved";
  const actionLabel = getActionLabel(selected.status);

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Orders Workflow")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {rejectModal && selected && (
        <RejectOrderModal
          orderId={selected.id}
          onConfirm={handleFullReject}
          onClose={() => setRejectModal(false)}
        />
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Orders Workflow</h2>
        <p className="mt-1 text-slate-500">Master control — advance orders through the full lifecycle.</p>
      </div>

      {/* Pipeline strip */}
      <div className="mb-5 flex items-stretch gap-0 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {[
          { label: "Order Placed",         color: "text-slate-600",   bg: "bg-slate-50" },
          { label: "Under Review",         color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Partially Approved",   color: "text-amber-700",   bg: "bg-amber-50" },
          { label: "Resubmitted",          color: "text-violet-700",  bg: "bg-violet-50" },
          { label: "Approved",             color: "text-teal-700",    bg: "bg-teal-50" },
          { label: "Rejected",             color: "text-red-700",     bg: "bg-red-50" },
          { label: "Added To Production",  color: "text-indigo-700",  bg: "bg-indigo-50" },
          { label: "Production Started",   color: "text-blue-700",    bg: "bg-blue-50" },
          { label: "Production Completed", color: "text-cyan-700",    bg: "bg-cyan-50" },
          { label: "Ready For Dispatch",   color: "text-emerald-700", bg: "bg-emerald-50" },
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
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
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
              <div className="flex flex-wrap gap-2">
                {isReviewStatus && (
                  <button onClick={() => setActiveTab("review")}
                    className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors">
                    <BarChart3 className="h-4 w-4" />
                    Review Order
                  </button>
                )}
                {canAdvance && !isReadyForDispatch && (
                  <button onClick={handleAdvance}
                    className="flex items-center gap-2 rounded-lg bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors">
                    <ChevronRight className="h-4 w-4" />
                    {actionLabel}
                  </button>
                )}
                {isReadyForDispatch && (
                  <button onClick={openBatchModal}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Dispatch Batch
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4">
              <WorkflowTimeline currentStatus={selected.status} />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(["request", "review", "batches", "log"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "border-b-2 border-[#0B2C66] text-[#0B2C66]" : "text-slate-500 hover:text-slate-700"}`}>
                {tab === "request" ? "Order Request"
                  : tab === "review" ? "Review Panel"
                  : tab === "batches" ? `Batches${batches.length > 0 ? ` (${batches.length})` : ""}`
                  : "Review Log"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── ORDER REQUEST TAB ── */}
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

            {/* ── REVIEW PANEL TAB ── */}
            {activeTab === "review" && (
              <div>
                {isReviewStatus && (
                  <ReviewPanel
                    order={selected}
                    onSubmit={handleReviewSubmit}
                    onFullReject={() => setRejectModal(true)}
                  />
                )}
                {selected.status === "Order Placed" && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock className="mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">Move to "Under Review" first.</p>
                    <p className="mt-1 text-xs text-slate-400">Use the "Move to Under Review" button above to begin the review process.</p>
                  </div>
                )}
                {selected.status === "Approved" && (
                  <div>
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Order fully approved. All products confirmed for production.</span>
                    </div>
                    <ul className="space-y-1">
                      {selected.items.map(item => (
                        <li key={item.product} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {item.product}
                          </div>
                          <span className="text-xs text-slate-500">{item.approvedQty} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {isPartiallyApproved && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Partial approval submitted. Awaiting branch response.</span>
                    </div>
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-right">Ordered</th>
                          <th className="px-4 py-3 text-right">Approved</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selected.items.map(item => {
                          const approved = item.approvedQty > 0;
                          return (
                            <tr key={item.product}>
                              <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{item.orderedQty} {item.unit}</td>
                              <td className="px-4 py-3 text-right font-semibold">{approved ? item.approvedQty : 0} {item.unit}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${approved ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                  {approved ? "Approved" : "Rejected"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {isRejected && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertTriangle className="mb-3 h-10 w-10 text-red-300" />
                    <p className="text-sm font-semibold text-red-600">Order Rejected by Warehouse</p>
                    <p className="mt-1 text-xs text-slate-400">Branch has been notified. They may resubmit or cancel the order.</p>
                  </div>
                )}
                {!isReviewStatus && !["Order Placed","Approved","Partially Approved","Rejected"].includes(selected.status) && (
                  <div>
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Order approved and in progress. Products confirmed for production.</span>
                    </div>
                    <ul className="space-y-1">
                      {selected.items.filter(i => i.approvedQty > 0).map(item => (
                        <li key={item.product} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2.5 text-sm">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            {item.product}
                          </div>
                          <span className="text-xs text-slate-500">{item.approvedQty} {item.unit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ── BATCHES TAB ── */}
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
                            <button onClick={() => handleAdvanceBatch(batch.batchId, batch.status)}
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
                          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Products</p>
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

            {/* ── REVIEW LOG TAB ── */}
            {activeTab === "log" && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Review History</p>
                <ReviewLog orderId={selected.id} />
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

              {/* Product selection */}
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
                    </div>
                  );
                })()}
              </div>

              {/* Driver Selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select Driver</label>
                {drivers.length === 0 ? (
                  <div className="space-y-2">
                    <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No available drivers. Reset the pool to continue.</p>
                    <button onClick={handleResetPool} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">Reset Driver/Vehicle Pool</button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {drivers.map(d => (
                      <button key={d.id} onClick={() => setSelectedDriver(d.id)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${selectedDriver === d.id ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 hover:bg-slate-50"}`}>
                        <span className="font-medium text-slate-800">{d.name}</span>
                        <span className="text-xs text-slate-400">{d.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Select Vehicle</label>
                {vehicles.length === 0 ? (
                  <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">No available vehicles.</p>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {vehicles.map(v => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v.id)}
                        className={`w-full flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-colors ${selectedVehicle === v.id ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 hover:bg-slate-50"}`}>
                        <span className="font-medium text-slate-800">{v.number}</span>
                        <span className="text-xs text-slate-400">{v.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setBatchModal(false)} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleCreateBatch}
                disabled={!selectedDriver || !selectedVehicle || selectedProducts.size === 0}
                className="flex-1 rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#0a2559] disabled:opacity-40 transition-colors">
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

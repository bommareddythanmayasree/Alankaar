import { useState, useEffect, useRef } from "react";
import {
  Package, GitBranch, Clock, CheckCircle2, PlayCircle,
  Hash, Calendar, AlertCircle, X, ChevronRight, Edit3, Plus, Minus,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  initWorkflowOrders,
  updateWorkflowOrderStatus,
  getProductionProgress,
  setProductionQty,
  type WorkflowLifecycleStatus,
  type WorkflowOrderLive,
} from "../../../shared/lib/demo-store";
import { WORKFLOW_ORDERS } from "../../../shared/data/workflow-mock-data";
import { formatCurrency } from "../../../shared/utils/format-currency";

// ── Statuses that count as "needs production" ─────────────────────────────────
const PRODUCTION_STATUSES: WorkflowLifecycleStatus[] = [
  "Approved",
  "Added To Production",
  "Production Started",
  "Production Completed",
];

// ── Map workflow status → display status ──────────────────────────────────────
function mapToDisplayStatus(
  statuses: WorkflowLifecycleStatus[]
): "Waiting Production" | "In Production" | "Completed" {
  const set = new Set(statuses);
  if (set.has("Production Completed")) return "Completed";
  if (set.has("Production Started") || set.has("Added To Production")) return "In Production";
  return "Waiting Production";
}

// ── Product aggregation type ──────────────────────────────────────────────────
type ProductEntry = {
  product: string;
  totalQty: number;
  unit: string;
  orderCount: number;
  branchSet: Set<string>;
  branches: { branch: string; qty: number; unit: string; orderId: string; order: WorkflowOrderLive }[];
  displayStatus: "Waiting Production" | "In Production" | "Completed";
  relatedOrderIds: string[];
};

function buildProductEntries(): ProductEntry[] {
  const liveOrders = getWorkflowOrders().filter((o) =>
    PRODUCTION_STATUSES.includes(o.status as WorkflowLifecycleStatus)
  );

  const map: Record<string, ProductEntry> = {};

  liveOrders.forEach((order) => {
    order.items.forEach((item) => {
      const qty = item.approvedQty > 0 ? item.approvedQty : item.orderedQty;
      if (!map[item.product]) {
        map[item.product] = {
          product: item.product,
          totalQty: 0,
          unit: item.unit,
          orderCount: 0,
          branchSet: new Set(),
          branches: [],
          displayStatus: "Waiting Production",
          relatedOrderIds: [],
        };
      }
      map[item.product].totalQty += qty;
      map[item.product].branchSet.add(order.branch);
      map[item.product].branches.push({ branch: order.branch, qty, unit: item.unit, orderId: order.id, order });
    });
  });

  Object.values(map).forEach((entry) => {
    const distinctOrders = new Set(entry.branches.map((b) => b.orderId));
    entry.orderCount = distinctOrders.size;
    entry.relatedOrderIds = [...distinctOrders];

    const statuses = entry.branches.map((b) => b.order.status as WorkflowLifecycleStatus);
    entry.displayStatus = mapToDisplayStatus(statuses);
  });

  return Object.values(map);
}

// ── Status badge styles ───────────────────────────────────────────────────────
function statusStyle(s: "Waiting Production" | "In Production" | "Completed") {
  if (s === "Completed")     return "bg-teal-100 text-teal-700";
  if (s === "In Production") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

function statusIcon(s: "Waiting Production" | "In Production" | "Completed") {
  if (s === "Completed")     return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (s === "In Production") return <PlayCircle className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

// ── Side Panel ────────────────────────────────────────────────────────────────
type PanelBranch = {
  branch: string; qty: number; unit: string; orderId: string; order: WorkflowOrderLive;
};

function BranchSidePanel({ entry, onClose }: { entry: PanelBranch; onClose: () => void }) {
  const order = entry.order;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 bg-[#F5F7FF] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-indigo-500" />
              <span className="text-base font-semibold text-slate-800">{entry.branch}</span>
            </div>
            <div className="mt-0.5 text-xs text-slate-500">{entry.orderId}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Order ID</div>
              <div className="text-sm font-semibold text-[#0B2C66]">{order.id}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Priority</div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${order.priority === "Urgent" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {order.priority === "Urgent" && <AlertCircle className="mr-1 h-3 w-3" />}
                {order.priority}
              </span>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Requested Time</div>
              <div className="flex items-center gap-1 text-sm text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{order.date}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{order.time}</div>
            </div>
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Order Value</div>
              <div className="text-sm font-semibold text-slate-800">{formatCurrency(order.value)}</div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Workflow Status</div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
              ${order.status === "Production Completed" ? "bg-teal-100 text-teal-700"
              : order.status === "Production Started" || order.status === "Added To Production" ? "bg-blue-100 text-blue-700"
              : "bg-amber-100 text-amber-700"}`}>
              {order.status}
            </span>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Ordered Products</div>
            <div className="space-y-2">
              {order.items.map((item) => {
                const qty = item.approvedQty > 0 ? item.approvedQty : item.orderedQty;
                return (
                  <div key={item.product} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{item.product}</span>
                    </div>
                    <span className="text-sm font-bold text-[#0B2C66]">{qty} {item.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Update Production Modal ───────────────────────────────────────────────────
function UpdateProductionModal({
  product, unit, totalQty, currentProduced, onClose, onSave,
}: {
  product: string; unit: string; totalQty: number; currentProduced: number;
  onClose: () => void; onSave: (qty: number) => void;
}) {
  const [value, setValue] = useState(currentProduced);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const clamped = Math.min(Math.max(0, value), totalQty);
  const pct = totalQty > 0 ? Math.round((clamped / totalQty) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-base font-semibold text-slate-800">Update Production</div>
            <div className="text-xs text-slate-500 mt-0.5">{product}</div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Quantity controls */}
          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Produced Quantity</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setValue((v) => Math.max(0, v - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                ref={inputRef}
                type="number"
                min={0}
                max={totalQty}
                value={value}
                onChange={(e) => setValue(Math.min(totalQty, Math.max(0, Number(e.target.value) || 0)))}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-base font-bold text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                onClick={() => setValue((v) => Math.min(totalQty, v + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 text-center text-xs text-slate-400">Max: {totalQty} {unit}</div>
          </div>

          {/* Preview progress */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Required: <span className="font-semibold text-slate-700">{totalQty} {unit}</span></span>
              <span>Produced: <span className="font-semibold text-slate-700">{clamped} {unit}</span></span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ${clamped >= totalQty ? "bg-teal-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Remaining: <span className="font-semibold text-slate-700">{Math.max(0, totalQty - clamped)} {unit}</span></span>
              <span className={`font-bold ${clamped >= totalQty ? "text-teal-600" : "text-indigo-600"}`}>{pct}%</span>
            </div>
          </div>

          {clamped >= totalQty && (
            <div className="flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Production will be marked as Completed and eligible for Dispatch.
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(clamped); onClose(); }}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            Save Progress
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({
  entry, producedQty, onUpdateProduction,
}: {
  entry: ProductEntry;
  producedQty: number;
  onUpdateProduction: (entry: ProductEntry) => void;
}) {
  const [selectedBranch, setSelectedBranch] = useState<PanelBranch | null>(null);

  const required = entry.totalQty;
  const produced = Math.min(producedQty, required);
  const remaining = Math.max(0, required - produced);
  const pct = required > 0 ? Math.round((produced / required) * 100) : 0;
  const isCompleted = produced >= required;

  // Compute effective display status: if progress says 100%, show Completed
  const effectiveStatus: "Waiting Production" | "In Production" | "Completed" =
    isCompleted ? "Completed" : produced > 0 ? "In Production" : entry.displayStatus;

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {/* Card Header — unchanged layout */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 flex-shrink-0">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800">{entry.product}</div>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                <span>{entry.orderCount} {entry.orderCount === 1 ? "order" : "orders"}</span>
                <span>·</span>
                <span>{entry.branchSet.size} {entry.branchSet.size === 1 ? "branch" : "branches"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden text-right md:block">
              <div className="text-lg font-bold text-slate-800">{entry.totalQty} {entry.unit}</div>
              <div className="text-xs text-slate-500">To Produce Today</div>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(effectiveStatus)}`}>
              {statusIcon(effectiveStatus)}
              {effectiveStatus}
            </span>
          </div>
        </div>

        {/* Production Progress Section */}
        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Production Progress</p>
            <button
              onClick={() => onUpdateProduction(entry)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Edit3 className="h-3 w-3" />
              Update Production
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Required</div>
              <div className="text-sm font-bold text-slate-800">{required} {entry.unit}</div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-center">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-400 mb-0.5">Produced</div>
              <div className="text-sm font-bold text-blue-700">{produced} {entry.unit}</div>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-center ${remaining === 0 ? "border-teal-100 bg-teal-50" : "border-orange-100 bg-orange-50"}`}>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${remaining === 0 ? "text-teal-400" : "text-orange-400"}`}>Remaining</div>
              <div className={`text-sm font-bold ${remaining === 0 ? "text-teal-700" : "text-orange-700"}`}>{remaining} {entry.unit}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-teal-500" : "bg-indigo-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-600">{produced} / {required} {entry.unit}</span>
              <span className={`font-bold ${isCompleted ? "text-teal-600" : "text-indigo-600"}`}>{pct}%</span>
            </div>
          </div>

          {isCompleted && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              Production Completed — eligible for Dispatch Tracking
            </div>
          )}
        </div>

        {/* Demand From — unchanged */}
        <div className="border-t border-slate-100 px-5 pb-4 pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Demand From</p>
          <div className="flex flex-wrap gap-2">
            {entry.branches.map((b, idx) => (
              <button
                key={`${b.branch}-${b.orderId}-${idx}`}
                onClick={() => setSelectedBranch(b)}
                className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors"
              >
                <GitBranch className="h-3 w-3" />
                {b.branch}
                <span className="font-bold">{b.qty} {b.unit}</span>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Hash className="h-3 w-3 text-slate-400" />
            <span>Total:</span>
            <span className="font-bold text-slate-700">{entry.totalQty} {entry.unit}</span>
            <span className="text-slate-400">
              (= {entry.branches.map(b => `${b.qty}`).join(" + ")} {entry.unit})
            </span>
          </div>
        </div>
      </div>

      {selectedBranch && (
        <BranchSidePanel entry={selectedBranch} onClose={() => setSelectedBranch(null)} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProductionPlanningPage() {
  const [entries, setEntries] = useState<ProductEntry[]>(() => buildProductEntries());
  const [progressMap, setProgressMap] = useState<Record<string, number>>(() => getProductionProgress());
  const [updateTarget, setUpdateTarget] = useState<ProductEntry | null>(null);

  useEffect(() => {
    initWorkflowOrders(
      WORKFLOW_ORDERS.map((o) => ({
        id: o.id,
        branch: o.branch,
        date: o.date,
        time: o.time,
        priority: o.priority,
        value: o.value,
        status: o.status as WorkflowLifecycleStatus,
        items: o.items.map((i) => ({
          product: i.product,
          orderedQty: i.orderedQty,
          approvedQty: i.approvedQty,
          rejectedQty: i.rejectedQty,
          unit: i.unit,
        })),
      }))
    );
    function sync() {
      setEntries(buildProductEntries());
      setProgressMap(getProductionProgress());
    }
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  function handleSaveProduction(entry: ProductEntry, qty: number) {
    setProductionQty(entry.product, qty);
    const newMap = { ...progressMap, [entry.product]: qty };
    setProgressMap(newMap);

    // If 100% produced, advance all related orders to "Production Completed"
    if (qty >= entry.totalQty) {
      entry.relatedOrderIds.forEach((orderId) => {
        updateWorkflowOrderStatus(orderId, "Production Completed");
      });
      setEntries(buildProductEntries());
    } else if (qty > 0) {
      // Mark as "Production Started" if not already past that stage
      entry.relatedOrderIds.forEach((orderId) => {
        const live = getWorkflowOrders().find((o) => o.id === orderId);
        if (live && (live.status === "Approved" || live.status === "Added To Production")) {
          updateWorkflowOrderStatus(orderId, "Production Started");
        }
      });
      setEntries(buildProductEntries());
    }
  }

  const totalProducts = entries.length;
  const waiting   = entries.filter((e) => {
    const p = progressMap[e.product] ?? 0;
    return p === 0 && e.displayStatus === "Waiting Production";
  }).length;
  const inProd    = entries.filter((e) => {
    const p = progressMap[e.product] ?? 0;
    return p > 0 && p < e.totalQty;
  }).length;
  const completed = entries.filter((e) => {
    const p = progressMap[e.product] ?? 0;
    return p >= e.totalQty && e.totalQty > 0;
  }).length;

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Production Planning")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Production Planning</h2>
        <p className="mt-1 text-slate-500">
          What needs to be produced today, derived from approved branch orders.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Products To Produce",   value: totalProducts, bg: "bg-[#E9EDFF]", color: "text-indigo-600",  Icon: Package },
          { label: "Waiting Production",    value: waiting,       bg: "bg-[#FFF3CB]", color: "text-amber-600",   Icon: Clock },
          { label: "In Production",         value: inProd,        bg: "bg-[#E0F2FE]", color: "text-sky-600",     Icon: PlayCircle },
          { label: "Production Completed",  value: completed,     bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: CheckCircle2 },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm font-medium text-slate-600">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Product cards */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No approved orders requiring production</p>
          <p className="mt-1 text-xs text-slate-400">Orders move here once approved in the workflow.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <ProductCard
              key={entry.product}
              entry={entry}
              producedQty={progressMap[entry.product] ?? 0}
              onUpdateProduction={setUpdateTarget}
            />
          ))}
        </div>
      )}

      {/* Update Production Modal */}
      {updateTarget && (
        <UpdateProductionModal
          product={updateTarget.product}
          unit={updateTarget.unit}
          totalQty={updateTarget.totalQty}
          currentProduced={progressMap[updateTarget.product] ?? 0}
          onClose={() => setUpdateTarget(null)}
          onSave={(qty) => {
            handleSaveProduction(updateTarget, qty);
            setUpdateTarget(null);
          }}
        />
      )}
    </ErpLayout>
  );
}

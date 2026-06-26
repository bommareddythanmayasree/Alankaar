import { useState, useEffect } from "react";
import {
  ChevronRight, ChevronDown, Factory, Package, GitBranch,
  Clock, CheckCircle2, Truck, PlayCircle, Sun, Moon,
  User, Hash, Timer, BarChart3,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  PRODUCTION_REQUIREMENTS,
  PRODUCTION_BATCHES,
  type ProductionRequirement,
  type BatchStatus,
} from "../../../shared/data/workflow-mock-data";
import {
  getWorkflowOrders,
  initWorkflowOrders,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";
import { WORKFLOW_ORDERS } from "../../../shared/data/workflow-mock-data";

// Statuses that belong in Production Planning
const PRODUCTION_STATUSES: WorkflowLifecycleStatus[] = [
  "Approved", "Added To Production", "Production Started", "Production Completed",
];

// Statuses that should be REMOVED from production totals
const POST_PRODUCTION_STATUSES: WorkflowLifecycleStatus[] = [
  "Ready For Dispatch", "Morning Dispatch", "Evening Dispatch",
  "In Transit", "Delivered", "Invoice Generated",
  "Payment Pending", "Payment Completed", "Order Closed",
];

// ── Build production requirements from live workflow orders ───────────────────
function buildLiveRequirements(base: ProductionRequirement[]): ProductionRequirement[] {
  const liveOrders = getWorkflowOrders().filter(o =>
    PRODUCTION_STATUSES.includes(o.status as WorkflowLifecycleStatus)
  );

  if (liveOrders.length === 0) return base;

  // Aggregate qty by product
  const byProduct: Record<string, { totalQty: number; branches: { branch: string; qty: number; unit: string; orderId: string }[] }> = {};
  liveOrders.forEach(order => {
    order.items.forEach(item => {
      const qty = item.approvedQty > 0 ? item.approvedQty : item.orderedQty;
      if (!byProduct[item.product]) byProduct[item.product] = { totalQty: 0, branches: [] };
      byProduct[item.product].totalQty += qty;
      byProduct[item.product].branches.push({ branch: order.branch, qty, unit: item.unit, orderId: order.id });
    });
  });

  // Replace base requirements with live data for matching products
  const updated = base.map(req => {
    const live = byProduct[req.product];
    if (!live) return req;
    return {
      ...req,
      totalRequiredKg: live.totalQty,
      totalOrders: liveOrders.filter(o => o.items.some(i => i.product === req.product)).length,
      branches: [...new Set(live.branches.map(b => b.branch))],
      branchBreakdown: live.branches,
    };
  });

  // Add products that exist in live orders but not in base
  Object.keys(byProduct).forEach(productName => {
    if (!base.some(r => r.product === productName)) {
      const live = byProduct[productName];
      updated.push({
        product: productName,
        totalRequiredKg: live.totalQty,
        producedKg: 0,
        totalOrders: liveOrders.filter(o => o.items.some(i => i.product === productName)).length,
        branches: [...new Set(live.branches.map(b => b.branch))],
        branchBreakdown: live.branches,
        status: "Not Started",
        lifecycleStage: "Planning",
        morningBatch: 0,
        eveningBatch: 0,
        batchNumber: "—",
        supervisor: "—",
        eta: "—",
      });
    }
  });

  // Remove products where all orders are past production (Ready For Dispatch+)
  return updated.filter(req => {
    const postProduction = getWorkflowOrders().filter(o =>
      POST_PRODUCTION_STATUSES.includes(o.status as WorkflowLifecycleStatus) &&
      o.items.some(i => i.product === req.product)
    );
    const inProduction = getWorkflowOrders().filter(o =>
      PRODUCTION_STATUSES.includes(o.status as WorkflowLifecycleStatus) &&
      o.items.some(i => i.product === req.product)
    );
    // Keep if any order for this product is still in production
    if (inProduction.length > 0) return true;
    // Also keep base items (not from live orders) regardless
    if (base.some(b => b.product === req.product)) return true;
    return postProduction.length === 0;
  });
}

// ── Status helpers ────────────────────────────────────────────────────────────
function statusBadge(s: BatchStatus) {
  if (s === "Ready For Dispatch") return "bg-emerald-100 text-emerald-700";
  if (s === "Completed")          return "bg-teal-100 text-teal-700";
  if (s === "In Production")      return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

function statusIcon(s: BatchStatus) {
  if (s === "Ready For Dispatch") return <Truck className="h-4 w-4 text-emerald-600" />;
  if (s === "Completed")          return <CheckCircle2 className="h-4 w-4 text-teal-600" />;
  if (s === "In Production")      return <PlayCircle className="h-4 w-4 text-blue-600" />;
  return <Clock className="h-4 w-4 text-amber-600" />;
}

function slotIcon(slot: string) {
  if (slot === "Morning") return <Sun className="h-5 w-5 text-amber-500" />;
  return <Moon className="h-5 w-5 text-indigo-500" />;
}

function slotBg(slot: string) {
  if (slot === "Morning") return "bg-amber-50 border-amber-200";
  return "bg-indigo-50 border-indigo-200";
}

// ── Demand from branches (expandable) ────────────────────────────────────────
const PRIMARY_BRANCHES = ["Gandhi Nagar", "Gayatri Nagar", "Ayyappa Nagar", "Patamata"];
const MAX_VISIBLE = 4;

function DemandFromBranches({ breakdown }: { breakdown: ProductionRequirement["branchBreakdown"] }) {
  const [showAll, setShowAll] = useState(false);

  const visible   = breakdown.slice(0, MAX_VISIBLE);
  const hidden    = breakdown.slice(MAX_VISIBLE);
  const hasMore   = hidden.length > 0;

  return (
    <div className="mt-2">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Demand From</p>
      <div className="flex flex-wrap gap-1.5">
        {visible.map(b => (
          <BranchChip key={b.branch} b={b} />
        ))}

        {/* Expanded branches */}
        {showAll && hidden.map(b => (
          <BranchChip key={b.branch} b={b} />
        ))}

        {/* Toggle button */}
        {hasMore && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center rounded-full bg-slate-200 hover:bg-slate-300 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors"
          >
            {showAll ? "Show Less" : `+${hidden.length} more`}
          </button>
        )}
      </div>
    </div>
  );
}

function BranchChip({ b }: { b: { branch: string; qty: number; unit: string } }) {
  const isPrimary = PRIMARY_BRANCHES.includes(b.branch);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium
      ${isPrimary
        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
        : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      <GitBranch className="h-2.5 w-2.5" />
      {b.branch}
      <span className="font-bold">{b.qty} {b.unit}</span>
    </span>
  );
}

// ── Batch info strip ──────────────────────────────────────────────────────────
function BatchInfoStrip({ req }: { req: ProductionRequirement }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-[#F5F7FF] border border-indigo-100 px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Hash className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-slate-400">Batch:</span>
        <span className="font-bold text-[#0B2C66]">{req.batchNumber}</span>
      </div>
      <div className="h-3.5 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <User className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-slate-400">Supervisor:</span>
        <span className="font-semibold text-slate-700">{req.supervisor}</span>
      </div>
      <div className="h-3.5 w-px bg-slate-200" />
      <div className="flex items-center gap-1.5 text-xs text-slate-600">
        <Timer className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-slate-400">ETA:</span>
        <span className={`font-semibold ${req.eta === "Ready" || req.eta === "Completed" ? "text-emerald-600" : "text-slate-700"}`}>
          {req.eta}
        </span>
      </div>
    </div>
  );
}

// ── Production metrics ────────────────────────────────────────────────────────
function ProductionMetrics({ req }: { req: ProductionRequirement }) {
  const remaining = req.totalRequiredKg - req.producedKg;
  const pct = req.totalRequiredKg > 0
    ? Math.round((req.producedKg / req.totalRequiredKg) * 100)
    : 0;

  return (
    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Production Metrics</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white border border-slate-100 px-3 py-2 text-center">
          <div className="text-base font-bold text-slate-800">{req.totalRequiredKg} Kg</div>
          <div className="text-[10px] text-slate-500">Required Qty</div>
        </div>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-center">
          <div className="text-base font-bold text-emerald-700">{req.producedKg} Kg</div>
          <div className="text-[10px] text-emerald-500">Produced Qty</div>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-center">
          <div className="text-base font-bold text-amber-700">{remaining} Kg</div>
          <div className="text-[10px] text-amber-500">Remaining Qty</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[10px] text-slate-500">
          <span>Progress</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductionCard({ req, expanded, onToggle }: {
  req: ProductionRequirement;
  expanded: boolean;
  onToggle: () => void;
}) {
  const totalBatched = req.morningBatch + req.eveningBatch;
  const pct = Math.round((totalBatched / req.totalRequiredKg) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 flex-shrink-0">
            <Package className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-base font-semibold text-slate-800">{req.product}</div>
            <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
              <span>{req.totalOrders} orders</span>
              <span>·</span>
              <span>{req.branches.length} branches</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden text-right md:block">
            <div className="text-lg font-bold text-slate-800">{req.totalRequiredKg} Kg</div>
            <div className="text-xs text-slate-500">Total Required</div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(req.status)}`}>
            {req.status}
          </span>
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400" />
            : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {/* Always-visible body */}
      <div className="px-5 pb-4">
        <DemandFromBranches breakdown={req.branchBreakdown} />
        <BatchInfoStrip req={req} />
        <ProductionMetrics req={req} />

        {/* Batch coverage bar */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <div className="flex-1">
            <div className="mb-1 flex justify-between">
              <span>Batch coverage</span>
              <span className="font-semibold">
                {totalBatched} / {req.totalRequiredKg} Kg ({Math.min(100, pct)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          {req.morningBatch > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
              Morning {req.morningBatch} Kg
            </span>
          )}
          {req.eveningBatch > 0 && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
              Evening {req.eveningBatch} Kg
            </span>
          )}
        </div>
      </div>

      {/* Expanded: full branch breakdown table */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Full Branch Breakdown
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {req.branchBreakdown.map(b => (
              <div
                key={b.branch}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{b.branch}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-[#0B2C66]">{b.qty} {b.unit}</span>
                  <div className="text-[10px] text-slate-400">{b.orderId}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProductionPlanningPage() {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"plan" | "batches">("plan");
  const [requirements, setRequirements] = useState<ProductionRequirement[]>(() => buildLiveRequirements(PRODUCTION_REQUIREMENTS));

  // Sync on storage changes and focus
  useEffect(() => {
    initWorkflowOrders(WORKFLOW_ORDERS.map(o => ({
      id: o.id, branch: o.branch, date: o.date, time: o.time, priority: o.priority,
      value: o.value, status: o.status as WorkflowLifecycleStatus,
      items: o.items.map(i => ({ product: i.product, orderedQty: i.orderedQty, approvedQty: i.approvedQty, rejectedQty: i.rejectedQty, unit: i.unit })),
    })));
    function sync() { setRequirements(buildLiveRequirements(PRODUCTION_REQUIREMENTS)); }
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const totalRequired = requirements.reduce((s, r) => s + r.totalRequiredKg, 0);
  const totalProduced = requirements.reduce((s, r) => s + r.producedKg, 0);
  const inProd        = requirements.filter(r => r.status === "In Production").length;
  const ready         = requirements.filter(r => r.status === "Ready For Dispatch").length;
  const completed     = requirements.filter(r => r.status === "Completed").length;

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Production Planning")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Production Planning</h2>
        <p className="mt-1 text-slate-500">
          Today's production requirements aggregated from all approved branch orders.
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Required Today",    value: `${totalRequired} Kg`, sub: "Across all products",     bg: "bg-[#E9EDFF]", color: "text-indigo-600",  Icon: Factory },
          { label: "Currently In Production", value: inProd,                sub: `${totalProduced} Kg produced`, bg: "bg-[#E0F2FE]", color: "text-sky-600",    Icon: BarChart3 },
          { label: "Production Completed",    value: completed,             sub: "Ready to pack",           bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: CheckCircle2 },
          { label: "Ready For Dispatch",      value: ready,                 sub: "Awaiting vehicle",        bg: "bg-[#FFF3CB]", color: "text-amber-600",   Icon: Truck },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm font-medium text-slate-600">{c.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActiveView("plan")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${activeView === "plan" ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
        >
          Production Plan
        </button>
        <button
          onClick={() => setActiveView("batches")}
          className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${activeView === "batches" ? "bg-white text-[#0B2C66] shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
        >
          Production Batches
        </button>
      </div>

      {/* Production Plan view */}
      {activeView === "plan" && (
        <div className="space-y-3">
          {requirements.map(req => (
            <ProductionCard
              key={req.product}
              req={req}
              expanded={expandedProduct === req.product}
              onToggle={() => setExpandedProduct(expandedProduct === req.product ? null : req.product)}
            />
          ))}
        </div>
      )}

      {/* Batches view */}
      {activeView === "batches" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PRODUCTION_BATCHES.map(batch => (
            <div key={batch.slot} className={`rounded-xl border ${slotBg(batch.slot)} p-5`}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {slotIcon(batch.slot)}
                  <div>
                    <div className="font-semibold text-slate-800">{batch.slot} Batch</div>
                    <div className="text-xs text-slate-500">{batch.time}</div>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(batch.status)}`}>
                  {batch.status}
                </span>
              </div>

              <div className="space-y-2">
                {batch.items.map(item => (
                  <div key={item.product} className="rounded-lg border border-white/80 bg-white px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-sm font-medium text-slate-800">{item.product}</span>
                      </div>
                      <span className="text-sm font-bold text-[#0B2C66]">{item.requiredQty} {item.unit}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
                      <div className="rounded bg-slate-50 px-2 py-1 text-center">
                        <div className="font-semibold text-slate-700">{item.requiredQty}</div>
                        <div className="text-slate-400">Required</div>
                      </div>
                      <div className="rounded bg-emerald-50 px-2 py-1 text-center">
                        <div className="font-semibold text-emerald-700">{item.preparedQty}</div>
                        <div className="text-emerald-500">Produced</div>
                      </div>
                      <div className="rounded bg-amber-50 px-2 py-1 text-center">
                        <div className="font-semibold text-amber-700">{item.pendingQty}</div>
                        <div className="text-amber-500">Remaining</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {statusIcon(item.prodStatus)}
                      <span className={`text-xs font-semibold ${statusBadge(item.prodStatus).replace("bg-", "text-").replace("-100", "-700")}`}>
                        {item.prodStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-white/70 p-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-slate-700">{batch.items.reduce((s, i) => s + i.requiredQty, 0)}</div>
                  <div className="text-slate-500">Required</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-emerald-700">{batch.items.reduce((s, i) => s + i.preparedQty, 0)}</div>
                  <div className="text-slate-500">Produced</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-amber-700">{batch.items.reduce((s, i) => s + i.pendingQty, 0)}</div>
                  <div className="text-slate-500">Remaining</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ErpLayout>
  );
}

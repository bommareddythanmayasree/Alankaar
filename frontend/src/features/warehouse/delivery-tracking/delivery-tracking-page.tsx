import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Truck, AlertTriangle, CheckCircle2, ClipboardList, ChevronDown, ChevronRight } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getDispatchBatches,
  getBatchDeliveryConfirmations,
  confirmBatchDelivery,
  getWorkflowOrders,
  LOGISTICS_REASONS,
  type DispatchBatch,
  type DispatchBatchProduct,
  type ProductDeliveryLine,
  type ProductDeliveryStatus,
  type BatchDeliveryConfirmation,
} from "../../../shared/lib/demo-store";
import { WORKFLOW_ORDERS } from "../../../shared/data/workflow-mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: ProductDeliveryStatus | "Delivered Successfully") {
  const map: Record<string, string> = {
    "Delivered Successfully": "bg-emerald-100 text-emerald-700",
    "Delivered":              "bg-emerald-100 text-emerald-700",
    "Partial Delivery":       "bg-amber-100 text-amber-700",
    "Pending Delivery":       "bg-sky-100 text-sky-700",
    "Not Delivered":          "bg-red-100 text-red-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

function batchStatusBadge(status: DispatchBatch["status"]) {
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  if (status === "Delivered")  return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700"; // Scheduled
}

// ── Batch Delivery Confirm Modal ──────────────────────────────────────────────
function BatchDeliveryConfirmModal({
  batch,
  onClose,
  onConfirm,
}: {
  batch: DispatchBatch;
  onClose: () => void;
  onConfirm: (lines: ProductDeliveryLine[]) => void;
}) {
  const [lines, setLines] = useState<ProductDeliveryLine[]>(
    batch.products.map(p => ({
      product: p.product,
      unit: p.unit,
      orderedQty: p.qty,
      loadedQty: p.qty,
      deliveredQty: p.qty,
      pendingQty: 0,
      status: "Delivered" as ProductDeliveryStatus,
      reason: "",
    }))
  );

  function updateLine(idx: number, patch: Partial<ProductDeliveryLine>) {
    setLines(prev => {
      const next = [...prev];
      const updated = { ...next[idx], ...patch };
      const deliveredQty = updated.deliveredQty;
      const loadedQty = updated.loadedQty;
      updated.pendingQty = Math.max(0, loadedQty - deliveredQty);
      if (deliveredQty >= loadedQty) {
        updated.status = "Delivered";
        updated.reason = "";
      } else if (deliveredQty === 0) {
        updated.status = "Not Delivered";
      } else {
        updated.status = "Partial Delivery";
      }
      next[idx] = updated;
      return next;
    });
  }

  const hasException = lines.some(l => l.pendingQty > 0);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-3xl rounded-xl border border-slate-200 bg-white max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Confirm Batch Delivery</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {batch.batchId} — Batch {batch.batchNumber} — {batch.driverName} / {batch.vehicleNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500">Enter actual quantities delivered for each product in this batch.</p>

          {lines.map((line, idx) => (
            <div key={line.product} className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">{line.product}</span>
                <span className="text-xs text-slate-400">Loaded: {line.loadedQty} {line.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs text-slate-500">Delivered Qty</span>
                  <input
                    type="number"
                    min={0}
                    max={line.loadedQty}
                    value={line.deliveredQty}
                    onChange={e => updateLine(idx, { deliveredQty: Number(e.target.value) })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-[#0A3A92]"
                  />
                </label>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Pending Qty</span>
                  <div className={`rounded-md border px-2 py-1.5 text-sm font-semibold ${line.pendingQty > 0 ? "border-amber-200 text-amber-700 bg-amber-50" : "border-slate-200 text-slate-400 bg-slate-50"}`}>
                    {line.pendingQty} {line.unit}
                  </div>
                </div>
              </div>

              {line.pendingQty > 0 && (
                <label className="block space-y-1">
                  <span className="text-xs text-slate-500">Reason for Pending Qty</span>
                  <select
                    value={line.reason}
                    onChange={e => updateLine(idx, { reason: e.target.value })}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-[#0A3A92]"
                  >
                    <option value="">Select reason…</option>
                    {LOGISTICS_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
              )}

              <div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(line.status)}`}>
                  {line.status}
                </span>
              </div>
            </div>
          ))}

          {hasException && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              Some items have pending quantities. Please select a reason for each.
            </div>
          )}

          <button
            onClick={() => onConfirm(lines)}
            className="w-full rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors"
          >
            Confirm Batch Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order-level status derived from its batches ───────────────────────────────
function deriveOrderStatus(batches: DispatchBatch[]): string {
  const statuses = batches.map(b => b.status);
  if (statuses.every(s => s === "Delivered")) return "Delivered";
  if (statuses.some(s => s === "In Transit")) return "In Transit";
  if (statuses.some(s => s === "Delivered")) return "Partially Delivered";
  return "Scheduled";
}

function orderStatusBadge(status: string) {
  if (status === "Delivered")          return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit")         return "bg-sky-100 text-sky-700";
  if (status === "Partially Delivered") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-500";
}

// ── Batch action area: conditionally renders confirm button, delivered badge,
//    or "not yet dispatched" indicator based on batch status ──────────────────
function BatchAction({
  batch,
  onConfirm,
}: {
  batch: DispatchBatch;
  onConfirm: (batch: DispatchBatch) => void;
}) {
  if (batch.status === "In Transit") {
    return (
      <button
        onClick={() => onConfirm(batch)}
        className="rounded-md bg-[#0B2C66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors flex-shrink-0"
      >
        Confirm Delivery
      </button>
    );
  }

  if (batch.status === "Delivered") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 flex-shrink-0">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Delivered
      </span>
    );
  }

  // Scheduled — not yet dispatched
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 flex-shrink-0 cursor-not-allowed" title="Batch must be marked In Transit before delivery can be confirmed">
      Awaiting Dispatch
    </span>
  );
}

// ── Expandable Order Group ────────────────────────────────────────────────────
function OrderBatchGroup({
  orderId,
  branch,
  batches,
  onConfirm,
}: {
  orderId: string;
  branch: string;
  batches: DispatchBatch[];
  onConfirm: (batch: DispatchBatch) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overallStatus = deriveOrderStatus(batches);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Order header row */}
      <div
        className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          }
          <span className="font-mono font-bold text-[#0B2C66] text-sm">{orderId}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400">Dispatch Batches: {batches.length}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${orderStatusBadge(overallStatus)}`}>
            {overallStatus}
          </span>
          <span className="text-xs text-[#0B2C66] font-medium">
            {expanded ? "▲ Hide Batches" : "▼ View Batches"}
          </span>
        </div>
      </div>

      {/* Batch cards */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {batches.map(batch => (
            <div key={batch.batchId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#1B4DB1]">{batch.batchId}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${batch.slot === "Morning" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {batch.slot} Dispatch
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${batchStatusBadge(batch.status)}`}>
                      {batch.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Driver: {batch.driverName} &nbsp;·&nbsp; {batch.vehicleNumber}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    <span className="font-medium text-slate-700">Products:</span>
                    <ul className="mt-1 space-y-0.5 list-none pl-0">
                      {batch.products.map((p: DispatchBatchProduct) => (
                        <li key={p.product} className="before:content-['•'] before:mr-1.5 before:text-slate-400">
                          {p.product} — {p.qty} {p.unit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <BatchAction batch={batch} onConfirm={onConfirm} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single confirmed batch row (shown inside an expanded order group) ──────────
function ConfirmedBatchItem({ conf }: { conf: BatchDeliveryConfirmation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Batch header */}
      <div
        className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          {expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            : <ChevronRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          }
          <span className="font-mono text-xs font-bold text-[#1B4DB1]">Batch {conf.batchNumber}</span>
          <span className="text-xs text-slate-400">{conf.confirmedAt}</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500">
            Invoice Value: <span className="font-semibold text-slate-800">₹{conf.invoicedValue.toLocaleString("en-IN")}</span>
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusBadge(conf.overallStatus)}`}>
            {conf.overallStatus}
          </span>
          {conf.overallStatus === "Delivered Successfully" || conf.overallStatus === "Delivered"
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            : <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          }
        </div>
      </div>

      {/* Product details table */}
      {expanded && (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2 text-right">Ordered</th>
                <th className="px-4 py-2 text-right">Loaded</th>
                <th className="px-4 py-2 text-right">Delivered</th>
                <th className="px-4 py-2 text-right">Pending</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conf.lines.map(line => (
                <tr key={line.product} className={line.pendingQty > 0 ? "bg-amber-50/30" : ""}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{line.product}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{line.orderedQty} {line.unit}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{line.loadedQty} {line.unit}</td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${line.deliveredQty < line.loadedQty ? "text-amber-600" : "text-emerald-600"}`}>
                    {line.deliveredQty} {line.unit}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold ${line.pendingQty > 0 ? "text-red-600" : "text-slate-400"}`}>
                    {line.pendingQty > 0 ? `${line.pendingQty} ${line.unit}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{line.reason || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge(line.status)}`}>
                      {line.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Confirmed order group: groups all batch records belonging to one order ─────
function ConfirmedOrderGroup({
  orderId,
  branch,
  orderedValue,
  batches,
}: {
  orderId: string;
  branch: string;
  orderedValue: number;
  batches: BatchDeliveryConfirmation[];
}) {
  const [expanded, setExpanded] = useState(false);
  const totalInvoiced = batches.reduce((s, b) => s + b.invoicedValue, 0);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      {/* Order header */}
      <div
        className="flex items-center justify-between gap-3 flex-wrap px-5 py-4 cursor-pointer hover:bg-slate-50 select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded
            ? <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
            : <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
          }
          <div className="min-w-0">
            <span className="font-mono font-bold text-[#0B2C66] text-sm">{orderId}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 flex-wrap">
          <div className="text-xs text-slate-600 space-x-3">
            <span>
              Ordered Value: <span className="font-semibold text-slate-800">₹{orderedValue.toLocaleString("en-IN")}</span>
            </span>
            <span>
              Invoice Value: <span className="font-semibold text-slate-800">₹{totalInvoiced.toLocaleString("en-IN")}</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">{batches.length} Batch Record{batches.length !== 1 ? "s" : ""}</span>
          <span className="text-xs text-[#0B2C66] font-medium">
            {expanded ? "▲ Hide Batch Records" : "▼ View Batch Records"}
          </span>
        </div>
      </div>

      {/* Individual batch records */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {batches.map(conf => (
            <ConfirmedBatchItem key={conf.batchId} conf={conf} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function DeliveryConfirmationPage() {
  const [allBatches, setAllBatches] = useState<DispatchBatch[]>([]);
  const [confirmedBatches, setConfirmedBatches] = useState<BatchDeliveryConfirmation[]>([]);
  const [confirmingBatch, setConfirmingBatch] = useState<DispatchBatch | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [branchByOrder, setBranchByOrder] = useState<Record<string, string>>({});
  const [valueByOrder, setValueByOrder] = useState<Record<string, number>>({});

  const load = useCallback(() => {
    const batches = getDispatchBatches();
    const allConfs = getBatchDeliveryConfirmations();
    const confirmedBatchIds = new Set(allConfs.map(c => c.batchId));

    // Show all non-confirmed batches (Scheduled + In Transit) so warehouse
    // users can see every batch. Delivered batches are shown via confirmed records.
    setAllBatches(
      batches.filter(b => b.status !== "Delivered" && !confirmedBatchIds.has(b.batchId))
    );
    setConfirmedBatches(allConfs);

    const liveOrders = getWorkflowOrders();
    const map: Record<string, string> = {};
    const valMap: Record<string, number> = {};
    // Seed static branch names first so live orders (which may be a subset) override them
    WORKFLOW_ORDERS.forEach(o => { map[o.id] = o.branch; });
    liveOrders.forEach(o => { map[o.id] = o.branch; valMap[o.id] = o.value; });
    setBranchByOrder(map);
    setValueByOrder(valMap);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleConfirm(lines: ProductDeliveryLine[]) {
    if (!confirmingBatch) return;
    confirmBatchDelivery(confirmingBatch.batchId, lines);
    setConfirmingBatch(null);
    showToast(`Batch ${confirmingBatch.batchId} delivery confirmed.`);
    load();
  }

  const inTransitCount  = allBatches.filter(b => b.status === "In Transit").length;
  const awaitingCount   = allBatches.length;
  const partialCount    = confirmedBatches.filter(c => c.overallStatus === "Partial Delivery").length;
  const deliveredCount  = confirmedBatches.filter(c =>
    c.overallStatus === "Delivered Successfully" || c.overallStatus === "Delivered"
  ).length;

  // Group visible batches by orderId
  const grouped = new Map<string, DispatchBatch[]>();
  allBatches.forEach(b => {
    const list = grouped.get(b.orderId) ?? [];
    list.push(b);
    grouped.set(b.orderId, list);
  });

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Delivery Confirmation")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Delivery Confirmation</h2>
        <p className="mt-1 text-slate-500">
          Confirm deliveries per dispatch batch. Order status is derived automatically from all batch statuses.
        </p>
      </div>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "In Transit",            value: inTransitCount,  bg: "bg-sky-50",     color: "text-sky-600",     Icon: Truck },
          { label: "Awaiting Confirmation", value: awaitingCount,   bg: "bg-amber-50",   color: "text-amber-600",   Icon: ClipboardList },
          { label: "Partial Delivery",      value: partialCount,    bg: "bg-orange-50",  color: "text-orange-600",  Icon: AlertTriangle },
          { label: "Delivered",             value: deliveredCount,  bg: "bg-emerald-50", color: "text-emerald-600", Icon: PackageCheck },
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

      {/* All active batches grouped by order */}
      {grouped.size > 0 && (
        <div className="mb-6 rounded-xl border border-sky-200 bg-white">
          <div className="flex items-center gap-2 border-b border-sky-100 bg-sky-50 px-5 py-3 rounded-t-xl">
            <Truck className="h-4 w-4 text-sky-600" />
            <span className="font-semibold text-sky-800">Dispatch Batches — Delivery Confirmation</span>
            <span className="ml-auto rounded-full bg-sky-600 px-2 py-0.5 text-xs font-bold text-white">{allBatches.length}</span>
          </div>
          {[...grouped.entries()].map(([orderId, batches]) => (
            <OrderBatchGroup
              key={orderId}
              orderId={orderId}
              branch={branchByOrder[orderId] ?? ""}
              batches={batches}
              onConfirm={setConfirmingBatch}
            />
          ))}
        </div>
      )}

      {grouped.size === 0 && confirmedBatches.length === 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500">
          No dispatch batches awaiting confirmation. Batches will appear here once created from Orders Workflow.
        </div>
      )}

      {/* Confirmed batch records — grouped by order */}
      {confirmedBatches.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <PackageCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-slate-800">Batch Delivery Records</h3>
            <p className="ml-1 text-xs text-slate-400">Click an order to expand batch records</p>
            <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-600">
              {confirmedBatches.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {(() => {
              const groupedConf = new Map<string, BatchDeliveryConfirmation[]>();
              confirmedBatches.forEach(c => {
                const list = groupedConf.get(c.orderId) ?? [];
                list.push(c);
                groupedConf.set(c.orderId, list);
              });
              return [...groupedConf.entries()].map(([orderId, batches]) => (
                <ConfirmedOrderGroup
                  key={orderId}
                  orderId={orderId}
                  branch={branchByOrder[orderId] ?? batches[0]?.branch ?? "—"}
                  orderedValue={valueByOrder[orderId] ?? 0}
                  batches={batches}
                />
              ));
            })()}
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmingBatch && (
        <BatchDeliveryConfirmModal
          batch={confirmingBatch}
          onClose={() => setConfirmingBatch(null)}
          onConfirm={handleConfirm}
        />
      )}
    </ErpLayout>
  );
}

// Backwards-compat alias
export { DeliveryConfirmationPage as DeliveryTrackingPage };

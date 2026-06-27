import { useState, useEffect, useCallback } from "react";
import {
  Package, RotateCcw, CheckCircle2, Clock, ArrowUpRight,
  AlertTriangle, AlertCircle, Info,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  getTrayDispatches, getTrayReturns, saveTrayReturn, getCurrentDemoBranchName,
  type TrayDispatch, type TrayReturn, type TrayReturnStatus,
} from "../../../shared/lib/demo-store";

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TrayReturnStatus, {
  badge: string;
  icon: React.ReactNode;
  row?: string;
}> = {
  "Returned": {
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  },
  "Partial Return": {
    badge: "bg-orange-100 text-orange-700",
    icon: <ArrowUpRight className="h-4 w-4 text-orange-500" />,
    row: "bg-orange-50/30",
  },
  "Inspection Required": {
    badge: "bg-red-100 text-red-700",
    icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    row: "bg-red-50/30",
  },
  "Ready for Return": {
    badge: "bg-amber-100 text-amber-700",
    icon: <ArrowUpRight className="h-4 w-4 text-amber-500" />,
  },
  "Received": {
    badge: "bg-sky-100 text-sky-700",
    icon: <Clock className="h-4 w-4 text-sky-500" />,
  },
};

function StatusBadge({ status }: { status: TrayReturnStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <div className="flex items-center gap-1.5">
      {cfg.icon}
      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
        {status}
      </span>
    </div>
  );
}

// ── Note tag ─────────────────────────────────────────────────────────────────

function NoteTag({ text, color }: { text: string; color: "orange" | "red" }) {
  const cls = color === "red"
    ? "bg-red-50 text-red-600 border-red-100"
    : "bg-orange-50 text-orange-600 border-orange-100";
  return (
    <div className={`mt-1.5 flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium ${cls}`}>
      <Info className="h-3 w-3 shrink-0" />
      {text}
    </div>
  );
}

// ── Return Submit Modal ───────────────────────────────────────────────────────
function SubmitReturnModal({
  dispatch, existing, onClose, onSave,
}: {
  dispatch: TrayDispatch;
  existing: TrayReturn | undefined;
  onClose: () => void;
  onSave: (returning: number) => void;
}) {
  const pending = dispatch.traysSent - (existing?.traysReturned ?? 0);
  const [qty, setQty] = useState(pending);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Return Trays</h3>
            <p className="text-xs text-slate-500 mt-0.5">{dispatch.orderId} — {dispatch.branch}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Trays Received</p>
              <p className="text-xl font-bold text-slate-800">{dispatch.traysSent}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs text-amber-600">Pending Return</p>
              <p className="text-xl font-bold text-amber-700">{pending}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Number of Trays Returning</label>
            <input
              type="number" min={1} max={pending}
              value={qty}
              onChange={e => setQty(Math.min(pending, Math.max(1, +e.target.value)))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave(qty)}
            disabled={qty < 1}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Submit Return
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Action button per status ──────────────────────────────────────────────────

function ActionButton({
  status,
  pending,
  onReturn,
  onReturnRemaining,
  onReportDamage,
}: {
  status: TrayReturnStatus;
  pending: number;
  onReturn: () => void;
  onReturnRemaining: () => void;
  onReportDamage: () => void;
}) {
  if (status === "Returned") {
    return <span className="text-xs text-slate-400">—</span>;
  }
  if (status === "Partial Return") {
    return (
      <button
        onClick={onReturnRemaining}
        className="flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100"
      >
        <RotateCcw className="h-3 w-3" /> Return Remaining
      </button>
    );
  }
  if (status === "Inspection Required") {
    return (
      <button
        onClick={onReportDamage}
        className="flex items-center gap-1 rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
      >
        <AlertCircle className="h-3 w-3" /> Report Damage
      </button>
    );
  }
  if (pending > 0) {
    return (
      <button
        onClick={onReturn}
        className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
      >
        <RotateCcw className="h-3 w-3" /> Return Trays
      </button>
    );
  }
  return <span className="text-xs text-slate-400">—</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TrayReturnsPage() {
  const branchName = getCurrentDemoBranchName();
  const [dispatches, setDispatches] = useState<TrayDispatch[]>([]);
  const [returns, setReturns]       = useState<TrayReturn[]>([]);
  const [submitting, setSubmitting] = useState<TrayDispatch | null>(null);
  const [toast, setToast]           = useState("");

  const load = useCallback(() => {
    const allDispatches = getTrayDispatches().filter(d => d.branch === branchName);
    setDispatches(allDispatches);
    setReturns(getTrayReturns().filter(r => r.branch === branchName));
  }, [branchName]);

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function handleSubmit(qty: number) {
    if (!submitting) return;
    const existing = returns.find(r => r.dispatchId === submitting.id);
    const alreadyReturned = existing?.traysReturned ?? 0;
    const newTotal = alreadyReturned + qty;
    const pending = submitting.traysSent - alreadyReturned;
    const isComplete = newTotal >= submitting.traysSent;
    const status: TrayReturnStatus = isComplete ? "Returned" : "Partial Return";

    const ret: TrayReturn = existing
      ? { ...existing, traysReturned: newTotal, status, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
      : {
          id: `TR-${Date.now()}`,
          dispatchId: submitting.id,
          orderId: submitting.orderId,
          branch: submitting.branch,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          traysReceived: submitting.traysSent,
          traysReturned: qty,
          damaged: 0,
          missing: Math.max(0, pending - qty),
          status,
        };

    saveTrayReturn(ret);
    setSubmitting(null);
    load();
    showToast(`${qty} tray(s) submitted for return.`);
  }

  // Summary totals
  const totalReceived = dispatches.reduce((s, d) => s + d.traysSent, 0);
  const totalReturned = returns.reduce((s, r) => s + r.traysReturned, 0);
  const pendingTrays  = totalReceived - totalReturned;

  const kpiCards = [
    { label: "Trays Received", value: totalReceived, color: "bg-blue-50 text-blue-700",       icon: <Package className="h-5 w-5" /> },
    { label: "Trays Returned", value: totalReturned, color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: "Pending Trays",  value: pendingTrays,  color: "bg-amber-50 text-amber-700",     icon: <RotateCcw className="h-5 w-5" /> },
  ];

  const sidebar = buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Tray Returns");

  // note lookup per order
  const NOTES: Record<string, { text: string; color: "orange" | "red" }> = {
    "ORD-2026-018": { text: "2 trays still at branch waiting for pickup.", color: "orange" },
    "ORD-2026-021": { text: "1 tray damaged during unloading, 1 tray missing.", color: "red" },
    "ORD-2026-031": { text: "3 trays still at branch, scheduled for next pickup.", color: "orange" },
    "ORD-2026-033": { text: "2 trays damaged, 1 tray unaccounted for.", color: "red" },
    "ORD-2026-036": { text: "3 trays held back — delivery vehicle unavailable.", color: "orange" },
  };

  return (
    <ErpLayout sidebarItems={sidebar} title="Tray Returns">
      <p className="text-sm text-slate-500 -mt-2 mb-4">Manage tray returns for {branchName}</p>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {kpiCards.map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
            <div className={`h-9 w-9 rounded-lg ${c.color} grid place-items-center`}>{c.icon}</div>
            <p className="text-2xl font-bold text-slate-800">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(["Returned", "Partial Return", "Inspection Required"] as TrayReturnStatus[]).map(s => (
          <div key={s} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-xs text-slate-600">
            {STATUS_CFG[s].icon}
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Dispatch / return table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Products Received & Tray Status</h2>
          <span className="text-xs text-slate-400">{dispatches.length} dispatch records</span>
        </div>

        {dispatches.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No tray dispatches for {branchName} yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  {["Order ID", "Date", "Trays Received", "Trays Returned", "Pending", "Status", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dispatches.map(d => {
                  const ret = returns.find(r => r.dispatchId === d.id);
                  const returned       = ret?.traysReturned ?? 0;
                  const pending        = d.traysSent - returned;
                  const currentStatus: TrayReturnStatus = ret?.status ?? "Received";
                  const rowHighlight   = STATUS_CFG[currentStatus].row ?? "";
                  const note           = NOTES[d.orderId];

                  return (
                    <tr key={d.id} className={`border-b border-slate-50 hover:bg-slate-50/50 ${rowHighlight}`}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{d.orderId}</td>
                      <td className="px-4 py-3 text-slate-500">{d.date}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{d.traysSent}</td>
                      <td className="px-4 py-3 text-emerald-700">{returned}</td>
                      <td className="px-4 py-3">
                        <span className={pending > 0 ? "font-semibold text-amber-700" : "text-slate-400"}>{pending}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <StatusBadge status={currentStatus} />
                          {note && <NoteTag text={note.text} color={note.color} />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ActionButton
                          status={currentStatus}
                          pending={pending}
                          onReturn={() => setSubmitting(d)}
                          onReturnRemaining={() => setSubmitting(d)}
                          onReportDamage={() => showToast(`Damage report filed for ${d.orderId}.`)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {submitting && (
        <SubmitReturnModal
          dispatch={submitting}
          existing={returns.find(r => r.dispatchId === submitting.id)}
          onClose={() => setSubmitting(null)}
          onSave={handleSubmit}
        />
      )}
    </ErpLayout>
  );
}

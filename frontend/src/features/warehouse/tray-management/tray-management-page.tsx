import { useState, useEffect, useCallback } from "react";
import {
  Package, ArrowDownLeft, AlertTriangle, CheckCircle2, RotateCcw,
  Plus, ChevronRight,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getTrayDispatches, getTrayReturns, getTraySummary, recordTrayReturn,
  saveTrayDispatch, getTrayConfig, setTrayConfig,
  type TrayDispatch, type TrayReturn, type TraySummary,
} from "../../../shared/lib/demo-store";

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusBadge(status: TrayReturn["status"]) {
  const cfg = {
    "Received":             "bg-sky-100 text-sky-700",
    "Ready for Return":     "bg-amber-100 text-amber-700",
    "Returned":             "bg-emerald-100 text-emerald-700",
    "Inspection Required":  "bg-rose-100 text-rose-700",
    "Partial Return":       "bg-orange-100 text-orange-700",
  }[status];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg}`}>{status}</span>;
}

// ── Return Entry Modal ────────────────────────────────────────────────────────
function ReturnModal({
  dispatch, existingReturn, onClose, onSave,
}: {
  dispatch: TrayDispatch;
  existingReturn: TrayReturn | undefined;
  onClose: () => void;
  onSave: (returned: number, damaged: number, missing: number) => void;
}) {
  const [returned, setReturned] = useState(existingReturn?.traysReturned ?? dispatch.traysSent);
  const [damaged, setDamaged]   = useState(existingReturn?.damaged ?? 0);
  const [missing, setMissing]   = useState(existingReturn?.missing ?? 0);

  const net = returned - damaged - missing;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Record Tray Return</h3>
            <p className="text-xs text-slate-500 mt-0.5">{dispatch.orderId} — {dispatch.branch}</p>
          </div>
          <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
            Trays Sent: <span className="font-semibold text-slate-800">{dispatch.traysSent}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Trays Returned", value: returned, set: setReturned, max: dispatch.traysSent },
              { label: "Damaged",        value: damaged,  set: setDamaged,  max: returned },
              { label: "Missing",        value: missing,  set: setMissing,  max: returned },
            ].map(f => (
              <div key={f.label}>
                <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                <input
                  type="number" min={0} max={f.max}
                  value={f.value}
                  onChange={e => f.set(Math.min(f.max, Math.max(0, +e.target.value)))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-2 text-sm">
            <span className="text-blue-600">Net returned to warehouse: </span>
            <span className="font-semibold text-blue-800">{Math.max(0, net)} trays</span>
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onSave(returned, damaged, missing)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Tray Modal ───────────────────────────────────────────────────────
function DispatchModal({
  onClose, onSave,
}: {
  onClose: () => void;
  onSave: (orderId: string, branch: string, traysSent: number) => void;
}) {
  const [orderId, setOrderId] = useState("");
  const [branch, setBranch]   = useState("");
  const [trays, setTrays]     = useState(1);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Record Tray Dispatch</h3>
          <button onClick={onClose} className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        </div>
        <div className="p-5 space-y-4">
          {[
            { label: "Order ID", value: orderId, set: setOrderId, placeholder: "e.g. ORD-2026-011" },
            { label: "Branch",   value: branch,  set: setBranch,  placeholder: "e.g. Gandhi Nagar" },
          ].map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
              <input
                value={f.value}
                onChange={e => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Trays Sent</label>
            <input
              type="number" min={1}
              value={trays}
              onChange={e => setTrays(Math.max(1, +e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="border-t border-slate-100 px-5 py-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            disabled={!orderId.trim() || !branch.trim()}
            onClick={() => onSave(orderId.trim(), branch.trim(), trays)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Save Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export function TrayManagementPage() {
  const [dispatches, setDispatches] = useState<TrayDispatch[]>([]);
  const [returns, setReturns]       = useState<TrayReturn[]>([]);
  const [summary, setSummary]       = useState<TraySummary>({ totalTrays: 200, availableTrays: 0, traysAtBranches: 0, pendingReturns: 0, damagedTrays: 0 });
  const [returning, setReturning]   = useState<TrayDispatch | null>(null);
  const [addDispatch, setAddDispatch] = useState(false);
  const [editTotal, setEditTotal]   = useState(false);
  const [totalInput, setTotalInput] = useState(200);
  const [toast, setToast]           = useState("");

  const load = useCallback(() => {
    setDispatches(getTrayDispatches());
    setReturns(getTrayReturns());
    setSummary(getTraySummary());
    setTotalInput(getTrayConfig().totalTrays);
  }, []);

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

  function handleReturn(returned: number, damaged: number, missing: number) {
    if (!returning) return;
    recordTrayReturn(returning.id, returned, damaged, missing);
    setReturning(null);
    load();
    showToast("Tray return recorded successfully.");
  }

  function handleDispatch(orderId: string, branch: string, traysSent: number) {
    saveTrayDispatch({ id: `TD-${Date.now()}`, orderId, branch, traysSent, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) });
    setAddDispatch(false);
    load();
    showToast(`Dispatch recorded: ${traysSent} trays → ${branch}`);
  }

  function handleSaveTotal() {
    setTrayConfig({ totalTrays: totalInput });
    setEditTotal(false);
    load();
  }

  const kpiCards = [
    { label: "Total Trays",     value: summary.totalTrays,     color: "bg-blue-50  text-blue-700",   icon: <Package className="h-5 w-5" /> },
    { label: "Available Trays", value: summary.availableTrays, color: "bg-emerald-50 text-emerald-700", icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: "At Branches",     value: summary.traysAtBranches, color: "bg-indigo-50 text-indigo-700",  icon: <ArrowDownLeft className="h-5 w-5" /> },
    { label: "Pending Returns", value: summary.pendingReturns,  color: "bg-amber-50 text-amber-700",   icon: <RotateCcw className="h-5 w-5" /> },
    { label: "Damaged Trays",   value: summary.damagedTrays,    color: "bg-red-50   text-red-700",     icon: <AlertTriangle className="h-5 w-5" /> },
  ];

  const sidebar = buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Tray Management");

  return (
    <ErpLayout sidebarItems={sidebar} title="Tray Management">
      {/* Subtitle */}
      <p className="text-sm text-slate-500 -mt-2 mb-4">Track reusable trays across all branches</p>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpiCards.map(c => (
          <div key={c.label} className={`rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2`}>
            <div className={`h-9 w-9 rounded-lg ${c.color} grid place-items-center`}>{c.icon}</div>
            <p className="text-2xl font-bold text-slate-800">{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setAddDispatch(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Record Dispatch
        </button>
        {editTotal ? (
          <div className="flex items-center gap-2">
            <input
              type="number" min={1}
              value={totalInput}
              onChange={e => setTotalInput(+e.target.value)}
              className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <button onClick={handleSaveTotal} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">Save</button>
            <button onClick={() => setEditTotal(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditTotal(true)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Edit Total Trays
          </button>
        )}
      </div>

      {/* Dispatch + Returns Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Dispatch & Return Ledger</h2>
          <span className="text-xs text-slate-400">{dispatches.length} dispatches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                {["Dispatch ID", "Order ID", "Branch", "Date", "Trays Sent", "Returned", "Damaged", "Missing", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispatches.map(d => {
                const ret = returns.find(r => r.dispatchId === d.id);
                return (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{d.orderId}</td>
                    <td className="px-4 py-3 text-slate-700">{d.branch}</td>
                    <td className="px-4 py-3 text-slate-500">{d.date}</td>
                    <td className="px-4 py-3 font-semibold text-blue-700">{d.traysSent}</td>
                    <td className="px-4 py-3 text-emerald-700">{ret?.traysReturned ?? "—"}</td>
                    <td className="px-4 py-3 text-red-600">{ret?.damaged ?? "—"}</td>
                    <td className="px-4 py-3 text-amber-600">{ret?.missing ?? "—"}</td>
                    <td className="px-4 py-3">{ret ? statusBadge(ret.status) : <span className="text-xs text-slate-400">Pending</span>}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setReturning(d)}
                        className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {ret?.status === "Returned" ? "Update" : "Return"}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {returning && (
        <ReturnModal
          dispatch={returning}
          existingReturn={returns.find(r => r.dispatchId === returning.id)}
          onClose={() => setReturning(null)}
          onSave={handleReturn}
        />
      )}
      {addDispatch && <DispatchModal onClose={() => setAddDispatch(false)} onSave={handleDispatch} />}
    </ErpLayout>
  );
}

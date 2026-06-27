import { useState, useEffect, useCallback } from "react";
import {
  Package, CheckCircle2, RotateCcw, AlertTriangle, TrendingDown, ArrowDownLeft,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import {
  getTraySummary, getBranchTrayLedger,
  type TraySummary, type BranchTrayLedger,
} from "../../../shared/lib/demo-store";

// ── Helpers ───────────────────────────────────────────────────────────────────
function pct(a: number, total: number) {
  if (total === 0) return 0;
  return Math.round((a / total) * 100);
}

function BarCell({ value, max }: { value: number; max: number }) {
  const w = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs text-slate-600">{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TrayAnalyticsPage() {
  const [summary, setSummary] = useState<TraySummary>({ totalTrays: 200, availableTrays: 0, traysAtBranches: 0, pendingReturns: 0, damagedTrays: 0 });
  const [ledger, setLedger]   = useState<BranchTrayLedger[]>([]);

  const load = useCallback(() => {
    setSummary(getTraySummary());
    setLedger(getBranchTrayLedger());
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("focus", load); };
  }, [load]);

  const kpis = [
    { label: "Total Trays",      value: summary.totalTrays,      sub: "Company owned",     color: "bg-blue-600",    icon: <Package className="h-5 w-5 text-white" /> },
    { label: "Available",        value: summary.availableTrays,  sub: `${pct(summary.availableTrays, summary.totalTrays)}% available`, color: "bg-emerald-600", icon: <CheckCircle2 className="h-5 w-5 text-white" /> },
    { label: "At Branches",      value: summary.traysAtBranches, sub: `${pct(summary.traysAtBranches, summary.totalTrays)}% deployed`, color: "bg-indigo-600",  icon: <ArrowDownLeft className="h-5 w-5 text-white" /> },
    { label: "Pending Return",   value: summary.pendingReturns,  sub: "Awaiting collection",color: "bg-amber-500",   icon: <RotateCcw className="h-5 w-5 text-white" /> },
    { label: "Damaged",          value: summary.damagedTrays,    sub: "Write-offs",          color: "bg-red-600",     icon: <AlertTriangle className="h-5 w-5 text-white" /> },
  ];

  const maxSent = Math.max(...ledger.map(b => b.traysSent), 1);

  const sidebar = buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Tray Analytics");

  return (
    <ErpLayout sidebarItems={sidebar} title="Tray Analytics">
      {/* Subtitle */}
      <p className="text-sm text-slate-500 -mt-2 mb-4">Company-wide tray balance and branch-wise ledger</p>
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
            <div className={`h-9 w-9 rounded-lg ${k.color} grid place-items-center`}>{k.icon}</div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{k.value}</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{k.label}</p>
              <p className="text-[11px] text-slate-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visual: tray utilisation bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Tray Utilisation</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-4 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${pct(summary.availableTrays, summary.totalTrays)}%` }}
              title={`Available: ${summary.availableTrays}`}
            />
            <div
              className="h-full bg-indigo-400 transition-all"
              style={{ width: `${pct(summary.traysAtBranches, summary.totalTrays)}%` }}
              title={`At Branches: ${summary.traysAtBranches}`}
            />
            <div
              className="h-full bg-red-400 transition-all"
              style={{ width: `${pct(summary.damagedTrays, summary.totalTrays)}%` }}
              title={`Damaged: ${summary.damagedTrays}`}
            />
          </div>
        </div>
        <div className="flex gap-5 mt-2.5 text-xs text-slate-500">
          {[
            { label: "Available",   color: "bg-emerald-500", value: summary.availableTrays },
            { label: "At Branches", color: "bg-indigo-400",  value: summary.traysAtBranches },
            { label: "Damaged",     color: "bg-red-400",     value: summary.damagedTrays },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${l.color}`} />
              {l.label}: <span className="font-semibold text-slate-700">{l.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Branch-wise Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Branch-wise Tray Ledger</h2>
          <span className="text-xs text-slate-400">{ledger.length} branches</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                {["Branch", "Trays Sent", "Trays Returned", "Damaged", "Missing", "Current at Branch", "Pending Return"].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    No tray data available.
                  </td>
                </tr>
              ) : (
                ledger.map(b => (
                  <tr key={b.branch} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{b.branch}</td>
                    <td className="px-4 py-3">
                      <BarCell value={b.traysSent} max={maxSent} />
                    </td>
                    <td className="px-4 py-3 text-emerald-700">{b.traysReturned}</td>
                    <td className="px-4 py-3">
                      {b.damaged > 0
                        ? <span className="font-semibold text-red-600">{b.damaged}</span>
                        : <span className="text-slate-400">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      {b.missing > 0
                        ? <span className="font-semibold text-amber-600">{b.missing}</span>
                        : <span className="text-slate-400">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${b.currentAtBranch > 0 ? "text-indigo-700" : "text-slate-400"}`}>
                        {b.currentAtBranch}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {b.pendingReturn > 0 ? (
                        <div className="flex items-center gap-1 text-amber-700">
                          <TrendingDown className="h-3.5 w-3.5" />
                          <span className="font-semibold">{b.pendingReturn}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger formula note */}
      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 text-xs text-blue-700">
        <span className="font-semibold">Ledger formula: </span>
        Opening Balance + Trays Sent − Trays Returned = Current Trays at Branch
      </div>
    </ErpLayout>
  );
}

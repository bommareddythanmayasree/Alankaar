/**
 * DEMO BRANCH SELECTOR (REQ 20 — Multi Branch Login)
 * Shown after branch login. Lets demo users pick which branch persona to simulate.
 * Does NOT modify actual authentication — uses localStorage to persist demo branch selection.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, CheckCircle2, ShoppingBag, CreditCard, Bell, ArrowRight } from "lucide-react";
import { DEMO_BRANCH_ACCOUNTS } from "../../../shared/data/demo-mock-data";
import alankarLogo from "../../../assets/alankar-logo.png";

export const DEMO_BRANCH_KEY = "demo_branch_id";

export function DemoBranchSelectorPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  function selectBranch(id: string) {
    localStorage.setItem(DEMO_BRANCH_KEY, id);
    navigate("/branch/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        <img src={alankarLogo} alt="Alankar" className="mx-auto mb-4 h-16 object-contain" />
        <h1 className="text-2xl font-bold text-slate-800">Select Branch</h1>
        <p className="mt-1 text-slate-500">Choose a branch to simulate its portal experience.</p>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
        {DEMO_BRANCH_ACCOUNTS.map(branch => (
          <button
            key={branch.id}
            onClick={() => setSelected(branch.id)}
            className={`group relative rounded-2xl border-2 bg-white p-5 text-left transition-all hover:shadow-md ${selected === branch.id ? "border-[#0B2C66] shadow-md" : "border-slate-200"}`}
          >
            {selected === branch.id && (
              <CheckCircle2 className="absolute right-4 top-4 h-5 w-5 text-[#0B2C66]" />
            )}

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E9EDFF]">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>

            <div className="mb-1 text-lg font-bold text-slate-800">{branch.name}</div>
            <div className="mb-3 text-sm text-slate-500">{branch.manager}</div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                  <ShoppingBag className="h-3 w-3" />Orders
                </div>
                <div className="mt-0.5 text-sm font-bold text-slate-800">{branch.stats.orders}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                  <CreditCard className="h-3 w-3" />Pending
                </div>
                <div className="mt-0.5 text-xs font-bold text-red-600">{branch.stats.outstanding}</div>
              </div>
              <div className="rounded-lg bg-slate-50 p-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                  <Bell className="h-3 w-3" />Alerts
                </div>
                <div className="mt-0.5 text-sm font-bold text-amber-600">{branch.stats.notifications}</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-400">{branch.stats.deliveredValue} delivered today</div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-6">
          <button
            onClick={() => selectBranch(selected)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C66] px-8 py-3 font-semibold text-white hover:bg-[#092757]"
          >
            Enter {DEMO_BRANCH_ACCOUNTS.find(b => b.id === selected)?.name} Portal
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        Demo mode — Each branch shows its own orders, payments, deliveries, and notifications.
      </p>
    </div>
  );
}



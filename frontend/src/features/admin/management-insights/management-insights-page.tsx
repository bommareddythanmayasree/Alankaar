import { Sparkles, TrendingUp, AlertTriangle, AlertCircle, Lightbulb, ArrowRight } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import { DEMO_AI_INSIGHTS } from "../../../shared/data/demo-mock-data";

function insightIcon(type: string) {
  if (type === "trend") return <TrendingUp className="h-5 w-5" />;
  if (type === "warning") return <AlertCircle className="h-5 w-5" />;
  if (type === "alert") return <AlertTriangle className="h-5 w-5" />;
  return <Lightbulb className="h-5 w-5" />;
}

function insightColors(severity: string) {
  if (severity === "high") return { card: "border-red-200 bg-red-50/50", icon: "bg-red-100 text-red-600", badge: "bg-red-100 text-red-700", title: "text-red-900" };
  if (severity === "medium") return { card: "border-amber-200 bg-amber-50/50", icon: "bg-amber-100 text-amber-600", badge: "bg-amber-100 text-amber-700", title: "text-amber-900" };
  return { card: "border-blue-200 bg-blue-50/30", icon: "bg-blue-100 text-blue-600", badge: "bg-blue-100 text-blue-700", title: "text-blue-900" };
}

export function ManagementInsightsPage() {
  return (
    <ErpLayout sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Management Insights")}>
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">AI Management Insights</h2>
            <p className="text-slate-500">Intelligent analysis and actionable recommendations for business decisions.</p>
          </div>
        </div>
      </div>

      {/* Last updated */}
      <div className="mb-5 flex items-center gap-2 text-xs text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span>Insights generated: Jun 17, 2026 · 11:45 AM</span>
      </div>

      {/* Severity summary pills */}
      <div className="mb-5 flex gap-3">
        {[
          { label: "High Priority", count: DEMO_AI_INSIGHTS.filter(i => i.severity === "high").length, color: "bg-red-100 text-red-700" },
          { label: "Medium Priority", count: DEMO_AI_INSIGHTS.filter(i => i.severity === "medium").length, color: "bg-amber-100 text-amber-700" },
          { label: "Low Priority", count: DEMO_AI_INSIGHTS.filter(i => i.severity === "low").length, color: "bg-blue-100 text-blue-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${s.color}`}>
            {s.count} {s.label}
          </div>
        ))}
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {DEMO_AI_INSIGHTS.map(insight => {
          const colors = insightColors(insight.severity);
          return (
            <div key={insight.id} className={`rounded-xl border ${colors.card} p-5`}>
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}>
                  {insightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className={`font-semibold ${colors.title}`}>{insight.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colors.badge}`}>{insight.severity}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{insight.body}</p>
                  <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B2C66] hover:underline">
                    {insight.action} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>These insights are generated based on current mock data patterns for demonstration purposes. In the production system, these will be powered by real-time analytics and machine learning models.</span>
      </div>
    </ErpLayout>
  );
}



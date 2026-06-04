import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

type Impact = "High Impact" | "Medium Impact" | "Low Impact";

const recommendationStats = [
  { title: "Total Recommendations", value: "12", subtitle: "This Month" },
  { title: "High Impact", value: "6", subtitle: "Potential high revenue impact" },
  { title: "Potential Revenue Impact", value: "₹8,45,000", subtitle: "Expected this month" },
  { title: "Accuracy Score", value: "92.4%", subtitle: "AI Prediction Accuracy" },
];

const recommendations = [
  {
    section: "Demand Forecast",
    title: "Milk Bread demand is expected to increase by 18% next month.",
    details: [
      { label: "Forecast Period", value: "June 2024" },
      { label: "Confidence", value: "89%" },
    ],
    impact: "High Impact" as Impact,
    border: "border-[#2563EB]/45",
    badge: "bg-[#E8F0FF] text-[#1E40AF]",
  },
  {
    section: "Product Recommendation",
    title: "Increase production of Rasgulla as it shows high demand in Vijayawada, Guntur and Visakhapatnam.",
    details: [
      { label: "Demand Increase", value: "25%" },
      { label: "Potential Revenue", value: "₹2,35,000" },
    ],
    impact: "High Impact" as Impact,
    border: "border-[#16A34A]/45",
    badge: "bg-[#E8F8ED] text-[#166534]",
  },
  {
    section: "Investment Suggestion",
    title: "Invest ₹2,00,000 in Bakery Category to get better profit margin.",
    details: [
      { label: "Expected ROI", value: "22%" },
      { label: "Time Period", value: "6 Months" },
    ],
    impact: "Medium Impact" as Impact,
    border: "border-[#F59E0B]/50",
    badge: "bg-[#FFF5E8] text-[#9A6700]",
  },
  {
    section: "Branch Expansion",
    title: "High potential area found in Rajahmundry. Recommended to open new branch.",
    details: [
      { label: "Suggested Location", value: "Rajahmundry, AP" },
      { label: "Potential Revenue", value: "₹3,20,000/Month" },
    ],
    impact: "High Impact" as Impact,
    border: "border-[#22C55E]/45",
    badge: "bg-[#EBFDF1] text-[#166534]",
  },
  {
    section: "New Product Launch",
    title: "Rasmalai demand increasing by 25% in nearby branches. Recommend launching Premium Rasmalai.",
    details: [
      { label: "Expected Demand", value: "High" },
      { label: "Potential Revenue", value: "₹1,65,000" },
    ],
    impact: "Medium Impact" as Impact,
    border: "border-[#7C3AED]/45",
    badge: "bg-[#F3EBFF] text-[#5B21B6]",
  },
  {
    section: "Discontinue Suggestion",
    title: "Fruit Biscuit has low sales for 3 consecutive months. Consider discontinuing.",
    details: [
      { label: "Sales Drop", value: "-30%" },
      { label: "Impact", value: "Low" },
    ],
    impact: "Low Impact" as Impact,
    border: "border-[#EF4444]/45",
    badge: "bg-[#FFEAEA] text-[#B91C1C]",
  },
];

export function AiRecommendationsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "AI Recommendations")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {recommendationStats.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-1 text-[34px] font-semibold leading-tight text-slate-900">{card.value}</p>
            <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {recommendations.map((item) => (
          <article key={item.section} className={`rounded-xl border bg-white p-4 ${item.border}`}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{item.section}</h3>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${impactClass(item.impact)}`}>{item.impact}</span>
            </div>

            <p className="min-h-[76px] text-[15px] leading-6 text-slate-800">{item.title}</p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {item.details.map((d) => (
                <div key={d.label} className="rounded-lg bg-[#F8FAFD] px-3 py-2">
                  <p className="text-[11px] text-slate-500">{d.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{d.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${item.badge}`}>Confidence: {confidenceValue(item.impact)}</span>
              <button className="text-sm font-semibold text-[#0A3A92]">View Details →</button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        These recommendations are generated using AI based on historical data, current trends and market analysis.
      </div>
    </ErpLayout>
  );
}

function confidenceValue(impact: Impact) {
  if (impact === "High Impact") return "89%";
  if (impact === "Medium Impact") return "82%";
  return "74%";
}

function impactClass(impact: Impact) {
  if (impact === "High Impact") return "bg-emerald-100 text-emerald-700";
  if (impact === "Medium Impact") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}


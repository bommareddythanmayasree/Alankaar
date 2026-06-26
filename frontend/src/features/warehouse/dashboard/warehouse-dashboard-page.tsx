import { type ReactNode, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Factory,
  GitBranch,
  Package,
  PackageCheck,
  PackagePlus,
  PlayCircle,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import {
  WAREHOUSE_SUMMARY,
  WAREHOUSE_RECENT_ORDERS,
} from "../../../shared/data/warehouse-mock-data";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import { DEMO_EOD } from "../../../shared/data/demo-mock-data";
import { OPS_COMMAND_CENTER, URGENT_ORDERS_DASHBOARD, PRODUCTION_DEMAND, WORKFLOW_DASHBOARD_KPI } from "../../../shared/data/workflow-mock-data";
import { useNavigate } from "react-router-dom";

const s = WAREHOUSE_SUMMARY;

type KpiCard = {
  title: string;
  value: string | number;
  note: string;
  bg: string;
  iconColor: string;
  icon: ReactNode;
};

// ── Production Performance KPIs ─────────────────────────────────────────────
const productionPerformanceCards: KpiCard[] = [
  {
    title: "Total Kg Produced Today",
    value: "482 Kg",
    note: "Across all product lines",
    bg: "bg-[#E9EDFF]",
    iconColor: "text-indigo-600",
    icon: <Package size={22} />,
  },
  {
    title: "Orders Completed Today",
    value: 34,
    note: "Fully fulfilled",
    bg: "bg-[#E2FFE6]",
    iconColor: "text-emerald-600",
    icon: <CheckCircle size={22} />,
  },
  {
    title: "Dispatch Success Rate",
    value: "94%",
    note: "Morning + Evening",
    bg: "bg-[#E0F2FE]",
    iconColor: "text-sky-600",
    icon: <Truck size={22} />,
  },
];

const orderCards: KpiCard[] = [
  {
    title: "Pending Orders",
    value: s.pendingOrders,
    note: "Requires action",
    bg: "bg-[#FFF3CB]",
    iconColor: "text-amber-600",
    icon: <ClipboardList size={22} />,
  },
  {
    title: "Approved Orders",
    value: s.approvedOrders,
    note: "Ready to pack",
    bg: "bg-[#E9EDFF]",
    iconColor: "text-indigo-600",
    icon: <CheckCircle size={22} />,
  },
  {
    title: "Dispatched Orders",
    value: s.dispatchedOrders,
    note: "In transit",
    bg: "bg-[#E0F2FE]",
    iconColor: "text-sky-600",
    icon: <Truck size={22} />,
  },
  {
    title: "Delivered Orders",
    value: s.deliveredOrders,
    note: "Completed",
    bg: "bg-[#E2FFE6]",
    iconColor: "text-emerald-600",
    icon: <PackageCheck size={22} />,
  },
];

const warehouseCards: KpiCard[] = [
  {
    title: "Today's Dispatches",
    value: s.todaysDispatches,
    note: "Sent today",
    bg: "bg-[#E2FFE6]",
    iconColor: "text-emerald-600",
    icon: <Truck size={22} />,
  },
  {
    title: "Today's Receipts",
    value: s.todaysReceipts,
    note: "Received today",
    bg: "bg-[#FFF3CB]",
    iconColor: "text-amber-600",
    icon: <PackagePlus size={22} />,
  },
  {
    title: "Active Branch Requests",
    value: s.activeBranchRequests,
    note: "Pending approval",
    bg: "bg-[#E9EDFF]",
    iconColor: "text-indigo-600",
    icon: <GitBranch size={22} />,
  },
  {
    title: "Rejected Requests",
    value: s.rejectedRequests,
    note: "This month",
    bg: "bg-[#FFE6D2]",
    iconColor: "text-rose-600",
    icon: <XCircle size={22} />,
  },
];

function KpiCardItem({ card }: { card: KpiCard }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${card.bg} ${card.iconColor}`}>
        {card.icon}
      </div>
      <div className="text-sm text-slate-500">{card.title}</div>
      <div className="text-[36px] font-semibold leading-tight">{card.value}</div>
      <div className="text-sm text-slate-500">{card.note}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

// ── Mock data for new production widgets ────────────────────────────────────
const PRODUCTION_QUEUE = [
  { branch: "Gandhi Nagar",   product: "Mysore Pak",      qtyRequired: "40 Kg" },
  { branch: "Gayatri Nagar",  product: "Kaju Katli",      qtyRequired: "25 Kg" },
  { branch: "Ayyappa Nagar",  product: "Boondi Laddu",    qtyRequired: "60 Kg" },
  { branch: "Patamata",       product: "Dry Fruit Barfi", qtyRequired: "30 Kg" },
  { branch: "Gannavaram",     product: "Gulab Jamun",     qtyRequired: "50 Kg" },
];

const PRODUCTION_BATCHES = [
  { batchId: "B-2401", product: "Mysore Pak",   progress: 75 },
  { batchId: "B-2402", product: "Kaju Katli",   progress: 42 },
  { batchId: "B-2403", product: "Boondi Laddu", progress: 90 },
  { batchId: "B-2404", product: "Gulab Jamun",  progress: 18 },
];

const DISPATCH_QUEUE = {
  morning: [
    { branch: "Benz Circle",   items: 6, status: "Ready" },
    { branch: "Governorpet",   items: 4, status: "Packing" },
    { branch: "Auto Nagar",    items: 5, status: "Ready" },
  ],
  evening: [
    { branch: "Kanuru",        items: 7, status: "Pending" },
    { branch: "Poranki",       items: 3, status: "Pending" },
    { branch: "Patamata",      items: 5, status: "Pending" },
  ],
};

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function dispatchStatusBadge(status: string) {
  if (status === "Ready")   return "bg-emerald-100 text-emerald-700";
  if (status === "Packing") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export function WarehouseDashboardPage() {
  const navigate = useNavigate();
  const [expandedDemand, setExpandedDemand] = useState<string | null>(null);
  const ops = OPS_COMMAND_CENTER;

  return (
    <ErpLayout
      title="Dashboard"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Dashboard")}
    >
      <p className="mb-5 text-slate-500">Overview of your warehouse operations</p>

      {/* ── Operations Command Center ──────────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-[#0B2C66]/20 bg-gradient-to-r from-[#0B2C66] to-[#1a4fa0] p-4 text-white">
        <div className="mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-300" />
          <span className="text-sm font-bold tracking-wide text-white">TODAY'S OPERATIONS</span>
          <button onClick={() => navigate("/warehouse/orders-workflow")}
            className="ml-auto rounded-lg bg-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/25 transition-colors">
            Open Workflow &rarr;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          {[
            { label: "Orders",           value: ops.totalOrders,       accent: "bg-white/10" },
            { label: "Production",       value: ops.totalProduction,   accent: "bg-white/10" },
            { label: "Morning Dispatch", value: ops.morningDispatch,   accent: "bg-amber-500/20" },
            { label: "Evening Dispatch", value: ops.eveningDispatch,   accent: "bg-indigo-500/20" },
            { label: "Collections",      value: ops.collections,       accent: "bg-emerald-500/20" },
            { label: "Outstanding",      value: ops.outstanding,       accent: "bg-orange-500/20" },
            { label: "Urgent Orders",    value: ops.urgentOrders,      accent: "bg-red-500/30" },
          ].map(c => (
            <div key={c.label} className={`rounded-lg ${c.accent} px-3 py-2.5`}>
              <div className="text-lg font-bold leading-tight">{c.value}</div>
              <div className="text-[11px] text-white/70">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Urgent Orders ──────────────────────────────────────────────── */}
      <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50">
        <div className="flex items-center gap-2 border-b border-red-200 px-5 py-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="font-bold text-red-800 tracking-wide">URGENT ORDERS — Requires Immediate Action</span>
          <span className="ml-auto rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{URGENT_ORDERS_DASHBOARD.length}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          {URGENT_ORDERS_DASHBOARD.map((u, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-white p-3">
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-bold text-red-600">{u.orderId}</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">URGENT</span>
              </div>
              <div className="mt-1.5 text-sm font-semibold text-slate-800">{u.branch}</div>
              <div className="text-sm text-slate-600">{u.product} — <span className="font-bold text-[#0B2C66]">{u.qty} {u.unit}</span></div>
              <div className="mt-2 text-xs text-red-600 font-semibold">Required Before: {u.requiredBefore}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── New Workflow Stage KPIs ─────────────────────────────────────── */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "In Production",              value: WORKFLOW_DASHBOARD_KPI.inProduction,              bg: "bg-blue-50",    color: "text-blue-700",    icon: <Factory size={20} /> },
          { label: "Ready For Dispatch",         value: WORKFLOW_DASHBOARD_KPI.readyForDispatch,          bg: "bg-emerald-50", color: "text-emerald-700", icon: <PackageCheck size={20} /> },
          { label: "In Transit",                 value: WORKFLOW_DASHBOARD_KPI.inTransit,                 bg: "bg-sky-50",     color: "text-sky-700",     icon: <Truck size={20} /> },
          { label: "Delivered — Awaiting Invoice", value: WORKFLOW_DASHBOARD_KPI.deliveredAwaitingInvoice, bg: "bg-violet-50",  color: "text-violet-700",  icon: <ClipboardList size={20} /> },
          { label: "Payment Pending",            value: WORKFLOW_DASHBOARD_KPI.paymentPending,            bg: "bg-orange-50",  color: "text-orange-700",  icon: <AlertTriangle size={20} /> },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              {c.icon}
            </div>
            <div className={`text-3xl font-bold leading-tight ${c.color}`}>{c.value}</div>
            <div className="mt-0.5 text-xs text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Today's Production Requirements ────────────────────────────── */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-800">TODAY'S PRODUCTION REQUIREMENTS</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Total:</span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
              {PRODUCTION_DEMAND.reduce((s, p) => s + p.totalKg, 0)} Kg
            </span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {PRODUCTION_DEMAND.map(item => (
            <div key={item.product}>
              <button onClick={() => setExpandedDemand(expandedDemand === item.product ? null : item.product)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                    <Package size={16} className="text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-800">{item.product}</span>
                  <span className="text-xs text-slate-400">{item.branchBreakdown.length} branches</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#0B2C66]">{item.totalKg} Kg</span>
                  {expandedDemand === item.product
                    ? <ChevronDown size={16} className="text-slate-400" />
                    : <ChevronRight size={16} className="text-slate-400" />}
                </div>
              </button>
              {expandedDemand === item.product && (
                <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {item.branchBreakdown.map(b => (
                      <div key={b.branch} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <span className="text-sm text-slate-700">{b.branch}</span>
                        <span className="font-bold text-[#0B2C66] text-sm">{b.qty} {b.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Production Performance ──────────────────────────────────────── */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Production Performance</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {productionPerformanceCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Orders</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orderCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Warehouse</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {warehouseCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      {/* ── Daily Reporting Summary ──────────────────────────────────────── */}
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Daily Summary — {DEMO_EOD.date}</h2>
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Orders",  value: DEMO_EOD.totalOrders,                 bg: "bg-[#E9EDFF]", color: "text-indigo-600",  Icon: ClipboardList },
          { label: "Delivered Qty", value: `${DEMO_EOD.deliveredQty} units`,     bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: CheckCircle2 },
          { label: "Cancelled Qty", value: `${DEMO_EOD.cancelledQty} units`,     bg: "bg-[#FFE6D2]", color: "text-orange-600",  Icon: XCircle },
          { label: "Fulfillment %", value: `${DEMO_EOD.fulfillmentPct}%`,        bg: "bg-[#FFF3CB]", color: "text-amber-600",   Icon: BarChart3 },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bottom panels ───────────────────────────────────────────────── */}
      <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-12">

        {/* Recent Orders */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-7">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Orders</h3>
            <button className="rounded-md border border-[#0A3A92]/40 px-3 py-1.5 text-sm font-semibold text-[#0A3A92]">
              View All Orders
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Branch Name</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {WAREHOUSE_RECENT_ORDERS.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{r.id}</td>
                  <td className="px-3 py-3">{r.branch}</td>
                  <td className="px-3 py-3">{r.date}</td>
                  <td className="px-3 py-3">{r.items}</td>
                  <td className="px-3 py-3">{r.amount}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="space-y-4 xl:col-span-5">

          {/* Production Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Production Queue</h3>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{PRODUCTION_QUEUE.length} items</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-2">Branch</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Qty Required</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTION_QUEUE.map((q, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-700">{q.branch}</td>
                    <td className="px-3 py-2 font-semibold text-slate-800">{q.product}</td>
                    <td className="px-3 py-2 font-bold text-[#0B2C66]">{q.qtyRequired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Production Batches Running */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Production Batches Running</h3>
              <span className="text-xs text-slate-400">{PRODUCTION_BATCHES.length} active</span>
            </div>
            <div className="space-y-3">
              {PRODUCTION_BATCHES.map((b) => (
                <div key={b.batchId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{b.batchId}</span>
                      <span className="text-slate-700">{b.product}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{b.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${progressColor(b.progress)} transition-all`}
                      style={{ width: `${b.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispatch Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Dispatch Queue</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* Morning */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Morning</span>
                </div>
                <div className="space-y-1.5">
                  {DISPATCH_QUEUE.morning.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-amber-50 px-2 py-1.5">
                      <span className="text-xs text-slate-700">{d.branch}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${dispatchStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Evening */}
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <span className="text-xs font-bold uppercase tracking-wide text-indigo-700">Evening</span>
                </div>
                <div className="space-y-1.5">
                  {DISPATCH_QUEUE.evening.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md bg-indigo-50 px-2 py-1.5">
                      <span className="text-xs text-slate-700">{d.branch}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${dispatchStatusBadge(d.status)}`}>
                        {d.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>
      </div>
    </ErpLayout>
  );
}

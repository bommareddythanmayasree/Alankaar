import { type ReactNode } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle,
  ClipboardList,
  GitBranch,
  IndianRupee,
  Package,
  PackageCheck,
  PackagePlus,
  Truck,
  XCircle,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import {
  WAREHOUSE_SUMMARY,
  WAREHOUSE_PIE_DATA,
  WAREHOUSE_RECENT_ORDERS,
  WAREHOUSE_LOW_STOCK,
} from "../../../shared/data/warehouse-mock-data";

const SIDEBAR_LABELS = [
  "Dashboard",
  "Stock Management",
  "Stock Logs",
  "Order Verification",
  "Order Management",
  "Invoice Generation",
  "Dispatch Tracking",
  "Notifications",
  "Settings",
] as const;

const s = WAREHOUSE_SUMMARY;

type KpiCard = {
  title: string;
  value: string | number;
  note: string;
  bg: string;
  iconColor: string;
  icon: ReactNode;
};

const inventoryCards: KpiCard[] = [
  {
    title: "Total Products",
    value: s.totalProducts,
    note: "+12 this month",
    bg: "bg-[#E9EDFF]",
    iconColor: "text-indigo-600",
    icon: <Package size={22} />,
  },
  {
    title: "Total Stock Qty",
    value: s.totalStockQuantity.toLocaleString("en-IN"),
    note: "Units in warehouse",
    bg: "bg-[#FFF3CB]",
    iconColor: "text-amber-600",
    icon: <Boxes size={22} />,
  },
  {
    title: "Inventory Value",
    value: s.inventoryValue,
    note: "Estimated value",
    bg: "bg-[#E2FFE6]",
    iconColor: "text-emerald-600",
    icon: <IndianRupee size={22} />,
  },
  {
    title: "Low Stock Items",
    value: s.lowStockItems,
    note: "Need restocking",
    bg: "bg-[#FFE6D2]",
    iconColor: "text-orange-600",
    icon: <AlertTriangle size={22} />,
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

const total = WAREHOUSE_PIE_DATA.reduce((sum, d) => sum + d.value, 0);

type PiePayload = { name: string; value: number; color: string };

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: PiePayload }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = ((d.value / total) * 100).toFixed(1);
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow">
      <p className="font-semibold">{d.name}</p>
      <p className="text-slate-600">Qty: {d.value} ({pct}%)</p>
    </div>
  );
}

export function WarehouseDashboardPage() {
  return (
    <ErpLayout
      title="Dashboard"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Dashboard")}
    >
      <p className="mb-5 text-slate-500">Overview of your warehouse operations</p>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Inventory</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {inventoryCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Orders</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orderCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Warehouse</h2>
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {warehouseCards.map((card) => <KpiCardItem key={card.title} card={card} />)}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-12">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Inventory Summary</h3>
              <button className="rounded-md bg-slate-100 px-2 py-1 text-xs">This Month</button>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={WAREHOUSE_PIE_DATA}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {WAREHOUSE_PIE_DATA.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-xs text-slate-700">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
              <button className="text-sm font-semibold text-[#0A3A92]">View All</button>
            </div>
            <div className="space-y-2">
              {WAREHOUSE_LOW_STOCK.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-md bg-[#F7FAFD] px-3 py-2">
                  <span className="text-sm">{item.name}</span>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    Qty: {item.qty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

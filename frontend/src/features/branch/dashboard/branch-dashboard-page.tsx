import { ClipboardList, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import {
  BRANCH_NAME,
  BRANCH_MANAGER_NAME,
  BRANCH_MANAGER_EMAIL,
  BRANCH_MANAGER_PHONE,
  BRANCH_CODE,
  BRANCH_SUMMARY,
  BRANCH_RECENT_ORDERS,
} from "../../../shared/data/branch-mock-data";

const SIDEBAR_LABELS = [
  "Dashboard",
  "Employee Management",
  "Product Catalog",
  "Shopping Cart",
  "Checkout",
  "Order Tracking",
  "Order History",
  "Notifications",
  "Settings",
] as const;

const s = BRANCH_SUMMARY;

const quickCards = [
  { title: "Total Orders", value: s.totalOrders, note: "All time", color: "bg-[#E9EDFF]", icon: <ClipboardList className="h-5 w-5" />, iconColor: "text-indigo-600" },
  { title: "Pending Orders", value: s.pendingOrders, note: "Awaiting approval", color: "bg-[#FFF3CB]", icon: <ShoppingBag className="h-5 w-5" />, iconColor: "text-amber-600" },
  { title: "In Transit", value: s.inTransitOrders, note: "Being delivered", color: "bg-[#E0F2FE]", icon: <Truck className="h-5 w-5" />, iconColor: "text-sky-600" },
  { title: "Delivered", value: s.deliveredOrders, note: "Completed", color: "bg-[#E2FFE6]", icon: <PackageCheck className="h-5 w-5" />, iconColor: "text-emerald-600" },
];

function statusClass(status: string) {
  if (status === "Approved" || status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  return "bg-amber-100 text-amber-700";
}

export function BranchDashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Dashboard")}
    >
      {/* Greeting */}
      <div className="mb-5">
        <h2 className="text-[28px] font-semibold text-slate-800">
          {greeting}, <span className="text-[#0A3A92]">{BRANCH_NAME} Branch</span>
        </h2>
        <p className="mt-1 text-slate-500">Place orders, track status, and manage your branch operations.</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickCards.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full ${card.color} ${card.iconColor}`}>
              {card.icon}
            </div>
            <div className="text-sm text-slate-500">{card.title}</div>
            <div className="text-[36px] font-semibold leading-tight">{card.value}</div>
            <div className="text-sm text-slate-500">{card.note}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Branch Info + Recent Orders */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-lg font-semibold">Branch Information</h3>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <InfoItem title="Branch" value={BRANCH_NAME} />
            <InfoItem title="Branch Code" value={BRANCH_CODE} />
            <InfoItem title="Manager" value={BRANCH_MANAGER_NAME} />
            <InfoItem title="Phone" value={BRANCH_MANAGER_PHONE} />
          </div>

          <h3 className="mb-3 text-lg font-semibold">Recent Orders</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-2">Order ID</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {BRANCH_RECENT_ORDERS.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{r.id}</td>
                  <td className="px-3 py-3">{r.date}</td>
                  <td className="px-3 py-3">{r.items} items</td>
                  <td className="px-3 py-3">&#8377;{r.amount.toLocaleString("en-IN")}</td>
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

        {/* Branch Performance Summary */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-4 text-lg font-semibold">Branch Performance</h3>
          <div className="space-y-3">
            <PerfRow label="Orders This Month" value={String(s.ordersThisMonth)} />
            <PerfRow label="Monthly Purchase Value" value={`&#8377;${s.monthlyPurchaseValue.toLocaleString("en-IN")}`} />
            <PerfRow label="Pending Deliveries" value={String(s.pendingDeliveries)} />
            <PerfRow label="Inventory Value" value={s.inventoryValue} />
            <PerfRow label="Cart Value" value={s.cartValue} />
          </div>

          <div className="mt-5 rounded-lg bg-[#F0F4FF] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{BRANCH_MANAGER_NAME}</p>
            <p className="text-xs text-slate-600">{BRANCH_MANAGER_EMAIL}</p>
            <p className="text-xs text-slate-600">{BRANCH_MANAGER_PHONE}</p>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

function InfoItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function PerfRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: value }} />
    </div>
  );
}

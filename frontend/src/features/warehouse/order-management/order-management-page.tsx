import { useMemo, useState } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_ORDER_MANAGEMENT } from "../../../shared/data/warehouse-mock-data";

type LifecycleStatus = "Pending" | "Approved" | "Packed" | "Dispatched" | "In Transit" | "Delivered";

type ManagedOrder = {
  id: string;
  branch: string;
  date: string;
  items: number;
  amount: number;
  status: LifecycleStatus;
};

const statuses: LifecycleStatus[] = ["Pending", "Approved", "Packed", "Dispatched", "In Transit", "Delivered"];

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

function statusClass(status: LifecycleStatus) {
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Packed") return "bg-indigo-100 text-indigo-700";
  if (status === "Dispatched") return "bg-cyan-100 text-cyan-700";
  if (status === "In Transit") return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

export function OrderManagementPage() {
  const [orders, setOrders] = useState<ManagedOrder[]>(WAREHOUSE_ORDER_MANAGEMENT as ManagedOrder[]);
  const [selectedId, setSelectedId] = useState(WAREHOUSE_ORDER_MANAGEMENT[0].id);
  const [statusFilter, setStatusFilter] = useState<"All" | LifecycleStatus>("All");
  const [branchFilter, setBranchFilter] = useState("All Branches");

  const selected = orders.find((o) => o.id === selectedId) ?? orders[0];

  const branches = useMemo(() => ["All Branches", ...Array.from(new Set(orders.map((o) => o.branch)))], [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const statusOk = statusFilter === "All" ? true : o.status === statusFilter;
      const branchOk = branchFilter === "All Branches" ? true : o.branch === branchFilter;
      return statusOk && branchOk;
    });
  }, [orders, statusFilter, branchFilter]);

  const updateStatus = (orderId: string, nextStatus: LifecycleStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
  };

  return (
    <ErpLayout
      title="Order Management"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Order Management")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Status Timeline</h3>
          <div className="mb-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
            <p className="text-xs text-slate-500">Selected Order: <span className="font-semibold text-[#1B4DB1]">{selected.id}</span></p>
            <p className="text-xs text-slate-500">Branch: <span className="font-semibold text-slate-800">{selected.branch}</span></p>
          </div>
          <div className="space-y-2">
            {statuses.map((status, idx) => {
              const currentIndex = statuses.indexOf(selected.status);
              const done = idx <= currentIndex;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-[#0A3A92] text-white" : "bg-slate-200 text-slate-600"}`}>
                    {idx + 1}
                  </span>
                  <span className={`text-sm ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Update Status</h3>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "All" | LifecycleStatus)}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
              >
                <option value="All">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className={`border-t border-slate-100 ${order.id === selectedId ? "bg-[#EEF3FF]" : ""}`}>
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">
                      <button onClick={() => setSelectedId(order.id)} className="hover:underline">
                        {order.id}
                      </button>
                    </td>
                    <td className="px-3 py-3">{order.branch}</td>
                    <td className="px-3 py-3">{order.date}</td>
                    <td className="px-3 py-3">{order.items} items</td>
                    <td className="px-3 py-3">&#8377;{new Intl.NumberFormat("en-IN").format(order.amount)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value as LifecycleStatus)}
                        className="h-9 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-[#0A3A92]"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

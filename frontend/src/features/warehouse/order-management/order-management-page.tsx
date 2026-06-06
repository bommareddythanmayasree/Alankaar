import { useMemo, useState } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_ORDER_MANAGEMENT } from "../../../shared/data/warehouse-mock-data";
import { useWarehouse } from "../../../app/warehouse/warehouse-context";

type LifecycleStatus = "Pending" | "Approved" | "Packed" | "Dispatched" | "In Transit" | "Delivered";

type ManagedOrder = {
  id: string;
  branch: string;
  date: string;
  items: number;
  amount: number;
  status: LifecycleStatus;
  paymentStatus?: "Pending" | "Completed";
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

/** Map verification order status to management lifecycle status */
function toLifecycleStatus(status: string): LifecycleStatus {
  if (status === "Approved" || status === "Partial") return "Approved";
  if (status === "Rejected") return "Pending";
  return "Pending";
}

export function OrderManagementPage() {
  const { orders: verificationOrders, dispatchOrder } = useWarehouse();
  const [localOrders, setLocalOrders] = useState<ManagedOrder[]>(WAREHOUSE_ORDER_MANAGEMENT as ManagedOrder[]);
  const [selectedId, setSelectedId] = useState(WAREHOUSE_ORDER_MANAGEMENT[0].id);
  const [statusFilter, setStatusFilter] = useState<"All" | LifecycleStatus>("All");
  const [branchFilter, setBranchFilter] = useState("All Branches");
  const [dispatchWarning, setDispatchWarning] = useState<string | null>(null);

  // Merge verification orders that are approved/partial into management list
  const mergedOrders = useMemo<ManagedOrder[]>(() => {
    const verifiedIds = new Set(localOrders.map((o) => o.id));
    const fromVerification: ManagedOrder[] = verificationOrders
      .filter((vo) => (vo.status === "Approved" || vo.status === "Partial") && !verifiedIds.has(vo.id))
      .map((vo) => ({
        id: vo.id,
        branch: vo.branch,
        date: vo.date,
        items: vo.itemsCount,
        amount: vo.amount,
        status: "Approved" as LifecycleStatus,
        paymentStatus: vo.paymentStatus,
      }));

    // Sync payment status for existing orders from verification context
    const synced = localOrders.map((lo) => {
      const vo = verificationOrders.find((v) => v.id === lo.id);
      if (vo) return { ...lo, paymentStatus: vo.paymentStatus };
      return lo;
    });

    return [...fromVerification, ...synced];
  }, [verificationOrders, localOrders]);

  const selected = mergedOrders.find((o) => o.id === selectedId) ?? mergedOrders[0];
  const branches = useMemo(() => ["All Branches", ...Array.from(new Set(mergedOrders.map((o) => o.branch)))], [mergedOrders]);

  const filteredOrders = useMemo(() => {
    return mergedOrders.filter((o) => {
      const statusOk = statusFilter === "All" ? true : o.status === statusFilter;
      const branchOk = branchFilter === "All Branches" ? true : o.branch === branchFilter;
      return statusOk && branchOk;
    });
  }, [mergedOrders, statusFilter, branchFilter]);

  const updateStatus = (orderId: string, nextStatus: LifecycleStatus) => {
    const order = mergedOrders.find((o) => o.id === orderId);

    // Block dispatch if payment not completed
    if (
      (nextStatus === "Dispatched" || nextStatus === "Packed") &&
      order?.paymentStatus !== "Completed"
    ) {
      setDispatchWarning(orderId);
      return;
    }

    if (nextStatus === "Dispatched") {
      dispatchOrder(orderId);
    }

    setLocalOrders((prev) => {
      const exists = prev.find((o) => o.id === orderId);
      if (exists) return prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
      // Add from merged if not in local
      if (order) return [{ ...order, status: nextStatus }, ...prev];
      return prev;
    });
  };

  return (
    <ErpLayout
      title="Order Management"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Order Management")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Status Timeline</h3>
          {selected && (
            <>
              <div className="mb-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
                <p className="text-xs text-slate-500">
                  Selected Order: <span className="font-semibold text-[#1B4DB1]">{selected.id}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Branch: <span className="font-semibold text-slate-800">{selected.branch}</span>
                </p>
                {selected.paymentStatus && (
                  <p className="mt-1 text-xs">
                    Payment:{" "}
                    <span
                      className={`font-semibold ${
                        selected.paymentStatus === "Completed" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {selected.paymentStatus === "Completed" ? "✓ Received" : "Pending"}
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                {statuses.map((status, idx) => {
                  const currentIndex = statuses.indexOf(selected.status);
                  const done = idx <= currentIndex;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          done ? "bg-[#0A3A92] text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className={`text-sm ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
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
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`border-t border-slate-100 ${order.id === selectedId ? "bg-[#EEF3FF]" : ""}`}
                  >
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
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {order.paymentStatus ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            order.paymentStatus === "Completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.paymentStatus === "Completed" ? "Paid" : "Unpaid"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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

      {/* Payment required warning modal */}
      {dispatchWarning && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
          <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-lg font-semibold text-rose-700">Payment Required</h3>
            <p className="text-sm text-slate-600">
              Order <span className="font-semibold">{dispatchWarning}</span> cannot be dispatched or packed until the branch completes payment.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDispatchWarning(null)}
                className="h-10 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

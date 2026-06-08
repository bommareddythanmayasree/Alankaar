import { useMemo, useState, useEffect } from "react";
import { Eye, Search } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_HISTORY_ORDERS, type BranchOrderStatus } from "../../../shared/data/branch-mock-data";
import { getDemoOrder, getDemoTrackingStatus } from "../../../shared/lib/demo-store";

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

function statusBadge(status: string) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Approved" || status === "Payment Completed") return "bg-indigo-100 text-indigo-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderHistoryPage() {
  const [statusFilter, setStatusFilter] = useState<"All" | BranchOrderStatus>("All");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [demoRow, setDemoRow] = useState<any | null>(null);

  useEffect(() => {
    function sync() {
      const order = getDemoOrder();
      const trackStatus = getDemoTrackingStatus();
      if (!order) { setDemoRow(null); return; }
      const displayAmount = order.approvedAmount ?? order.amount;
      const displayStatus = order.isPartial && trackStatus !== "Pending Approval" && trackStatus !== "Rejected"
        ? "Partially Approved"
        : trackStatus === "Pending Approval" ? "Pending" : trackStatus;
      setDemoRow({
        orderId: order.id,
        branchName: order.branch,
        date: order.orderDate,
        items: order.items.length,
        amount: displayAmount,
        status: displayStatus,
        deliveryDate: order.expectedDelivery,
        invoiceNumber: order.invoiceNumber ?? undefined,
        isPartial: order.isPartial ?? false,
        requestedItems: order.items.map((i) => ({
          name: i.name,
          requested: i.requested,
          approved: i.approved ?? Math.min(i.requested, i.available),
        })),
      });
    }
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  // Merge demo order with seed orders
  const allOrders = useMemo(() => {
    if (demoRow) return [demoRow, ...BRANCH_HISTORY_ORDERS];
    return [...BRANCH_HISTORY_ORDERS];
  }, [demoRow]);

  const filtered = useMemo(() => {
    let rows = allOrders;
    if (statusFilter !== "All") rows = rows.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((o) => [o.orderId, o.branchName, o.status].join(" ").toLowerCase().includes(q));
    }
    return rows;
  }, [allOrders, statusFilter, search]);

  const visible = filtered.slice(0, visibleCount);

  const summaryCards = [
    { label: "All Orders", value: allOrders.length, color: "text-[#0A3A92]", filter: "All" as const },
    { label: "Pending", value: allOrders.filter((o) => o.status === "Pending" || o.status === "Pending Approval").length, color: "text-amber-600", filter: "Pending" as BranchOrderStatus },
    { label: "Approved", value: allOrders.filter((o) => o.status === "Approved" || o.status === "Payment Completed").length, color: "text-indigo-600", filter: "Approved" as BranchOrderStatus },
    { label: "In Transit", value: allOrders.filter((o) => o.status === "In Transit").length, color: "text-sky-600", filter: "In Transit" as BranchOrderStatus },
    { label: "Delivered", value: allOrders.filter((o) => o.status === "Delivered").length, color: "text-emerald-600", filter: "Delivered" as BranchOrderStatus },
  ];

  return (
    <ErpLayout
      
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Order History")}
    >
      <p className="mb-4 text-slate-500">View and track all your branch orders</p>

      {/* Summary cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryCards.map((card) => (
          <button key={card.label} type="button"
            onClick={() => setStatusFilter(card.filter === "All" ? "All" : card.filter as BranchOrderStatus)}
            className={`rounded-xl border bg-white p-4 text-left hover:border-[#0A3A92]/30 transition-colors ${statusFilter === card.filter || (card.filter === "All" && statusFilter === "All") ? "border-[#0A3A92]" : "border-slate-200"}`}>
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className={`text-[32px] font-semibold leading-tight ${card.color}`}>{card.value}</p>
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..."
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "All" | BranchOrderStatus)}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Order ID</th>
                <th className="px-3 py-3">Branch</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Items</th>
                <th className="px-3 py-3">Amount</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Delivery Date</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.orderId} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-[#0A3A92]">{row.orderId}</td>
                  <td className="px-3 py-3">{row.branchName}</td>
                  <td className="px-3 py-3">{row.date}</td>
                  <td className="px-3 py-3">{row.items} items</td>
                  <td className="px-3 py-3 font-medium">&#8377;{row.amount.toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{row.deliveryDate || "—"}</td>
                  <td className="px-3 py-3">
                    <button
  type="button"
  onClick={() => setSelectedOrder(row)}
  className="rounded-md border border-slate-200 p-2 text-[#0A3A92] hover:bg-slate-50"
>
  <Eye className="h-4 w-4" />
</button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {visibleCount < filtered.length && (
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setVisibleCount((c) => c + 6)}
              className="rounded-md bg-[#0A3A92] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#083173]">
              Load More
            </button>
          </div>
        )}
      </section>
      {selectedOrder && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

      <div className="border-b border-slate-200 px-6 py-4">
        <h3 className="text-xl font-semibold text-slate-900">
          Order Details
        </h3>
        <p className="text-sm text-slate-500">
          Complete order information
        </p>
      </div>

      <div className="space-y-5 p-6">

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Order ID</p>
            <p className="font-semibold">{selectedOrder.orderId}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Branch</p>
            <p className="font-semibold">{selectedOrder.branchName}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Order Date</p>
            <p className="font-semibold">{selectedOrder.date}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Delivery Date</p>
            <p className="font-semibold">
              {selectedOrder.deliveryDate || "Not Assigned"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Items</p>
            <p className="font-semibold">
              {selectedOrder.items}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Amount</p>
            <p className="font-semibold text-[#0A3A92]">
              ₹{selectedOrder.amount.toLocaleString("en-IN")}
            </p>
            {selectedOrder.isPartial && (
              <p className="mt-0.5 text-[10px] text-orange-600 font-medium">Approved amount only</p>
            )}
          </div>
        </div>

        {selectedOrder.isPartial && selectedOrder.requestedItems?.length > 0 && (
          <div>
            <h4 className="mb-2 font-semibold text-slate-900 text-sm">Item Breakdown (Partial Fulfillment)</h4>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 space-y-2">
              {selectedOrder.requestedItems.map((item: { name: string; requested: number; approved: number }) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="text-slate-500">
                    Approved: <span className="font-semibold text-orange-700">{item.approved}</span>
                    <span className="text-slate-400"> / Requested: {item.requested}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-4 font-semibold text-slate-900">
            Order Status Timeline
          </h4>

          <div className="flex items-center justify-between">
            {[
              "Pending",
              "Approved",
              "In Transit",
              "Delivered",
            ].map((step, index) => {
              const currentIndex = [
                "Pending",
                "Approved",
                "In Transit",
                "Delivered",
              ].indexOf(selectedOrder.status);

              const completed = index <= currentIndex;

              return (
                <div
                  key={step}
                  className="flex flex-1 flex-col items-center"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                      completed
                        ? "bg-[#0A3A92] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <p className="mt-2 text-xs text-center text-slate-600">
                    {step}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="rounded-lg bg-[#0A3A92] px-5 py-2 text-sm font-semibold text-white hover:bg-[#083173]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  </div>
)}
    </ErpLayout>
  );
}

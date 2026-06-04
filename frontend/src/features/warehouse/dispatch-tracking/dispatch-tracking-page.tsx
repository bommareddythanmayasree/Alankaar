import { useMemo, useState } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_DISPATCH_ORDERS } from "../../../shared/data/warehouse-mock-data";

type DispatchStatus = "Packed" | "Dispatched" | "In Transit" | "Delivered";

const timelineStatuses: DispatchStatus[] = ["Packed", "Dispatched", "In Transit", "Delivered"];

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

function statusClass(status: DispatchStatus) {
  if (status === "Packed") return "bg-indigo-100 text-indigo-700";
  if (status === "Dispatched") return "bg-cyan-100 text-cyan-700";
  if (status === "In Transit") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export function DispatchTrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(WAREHOUSE_DISPATCH_ORDERS[0].orderId);
  const [statusFilter, setStatusFilter] = useState<"All" | DispatchStatus>("All");

  const selectedOrder = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.orderId === selectedOrderId) ?? WAREHOUSE_DISPATCH_ORDERS[0];

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return WAREHOUSE_DISPATCH_ORDERS;
    return WAREHOUSE_DISPATCH_ORDERS.filter((o) => o.currentStatus === statusFilter);
  }, [statusFilter]);

  return (
    <ErpLayout
      title="Dispatch Tracking"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Dispatch Tracking")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Timeline panel */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Timeline</h3>
          <div className="mb-4 rounded-md bg-[#F8FAFD] px-3 py-3 text-sm space-y-1">
            <p className="font-semibold text-slate-800">{selectedOrder.orderId}</p>
            <p className="text-slate-600">{selectedOrder.branch}</p>
            <p className="text-slate-500">Dispatch: {selectedOrder.dispatchDate} {selectedOrder.dispatchTime}</p>
            <p className="text-slate-500">Expected: {selectedOrder.expectedDelivery}</p>
            {selectedOrder.actualDelivery && (
              <p className="text-emerald-600 font-medium">Delivered: {selectedOrder.actualDelivery}</p>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2">
              <p className="text-slate-600">
                <span className="font-medium">Vehicle:</span> {selectedOrder.vehicleNumber}
              </p>
              <p className="text-slate-600">
                <span className="font-medium">Driver:</span> {selectedOrder.driverName}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {timelineStatuses.map((status, index) => {
              const currentIndex = timelineStatuses.indexOf(selectedOrder.currentStatus as DispatchStatus);
              const done = index <= currentIndex;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      done ? "bg-[#0A3A92] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className={`text-sm ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Dispatch table */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Dispatch Table</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | DispatchStatus)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
            >
              <option value="All">All Status</option>
              {timelineStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Dispatch Date</th>
                  <th className="px-3 py-3">Vehicle No.</th>
                  <th className="px-3 py-3">Driver</th>
                  <th className="px-3 py-3">Expected Delivery</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.orderId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">
                      <button onClick={() => setSelectedOrderId(order.orderId)} className="hover:underline">
                        {order.orderId}
                      </button>
                    </td>
                    <td className="px-3 py-3">{order.branch}</td>
                    <td className="px-3 py-3">{order.dispatchDate}</td>
                    <td className="px-3 py-3">{order.vehicleNumber}</td>
                    <td className="px-3 py-3">{order.driverName}</td>
                    <td className="px-3 py-3">{order.expectedDelivery}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.currentStatus as DispatchStatus)}`}>
                        {order.currentStatus}
                      </span>
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

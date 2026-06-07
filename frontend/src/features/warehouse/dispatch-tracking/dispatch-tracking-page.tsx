import { useMemo, useState, useEffect } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_DISPATCH_ORDERS } from "../../../shared/data/warehouse-mock-data";
import {
  getDemoOrder,
  getDemoTrackingStatus,
  advanceDispatch,
  type DemoOrder,
  type DemoTrackingStatus,
} from "../../../shared/lib/demo-store";
import { useWarehouse } from "../../../app/warehouse/warehouse-context";

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

function statusClass(status: string) {
  if (status === "Packed") return "bg-indigo-100 text-indigo-700";
  if (status === "Dispatched") return "bg-cyan-100 text-cyan-700";
  if (status === "In Transit") return "bg-blue-100 text-blue-700";
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

// Which dispatch stages are accessible from each current stage
const NEXT_STAGES: Record<DemoTrackingStatus, DispatchStatus | null> = {
  "Payment Completed": "Packed",
  "Packed": "Dispatched",
  "Dispatched": "In Transit",
  "In Transit": "Delivered",
  "Delivered": null,
  "Pending Approval": null,
  "Approved": null,
  "Rejected": null,
};

export function DispatchTrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState(WAREHOUSE_DISPATCH_ORDERS[0].orderId);
  const [statusFilter, setStatusFilter] = useState<"All" | DispatchStatus>("All");
  const [demoOrder, setDemoOrder] = useState<DemoOrder | null>(null);
  const [demoStatus, setDemoStatus] = useState<DemoTrackingStatus>("Pending Approval");
  const [toast, setToast] = useState<string | null>(null);

  const { dispatchOrder } = useWarehouse();

  function sync() {
    setDemoOrder(getDemoOrder());
    setDemoStatus(getDemoTrackingStatus());
  }

  useEffect(() => {
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const selectedOrder = WAREHOUSE_DISPATCH_ORDERS.find((o) => o.orderId === selectedOrderId) ?? WAREHOUSE_DISPATCH_ORDERS[0];

  const filteredOrders = useMemo(() => {
    if (statusFilter === "All") return WAREHOUSE_DISPATCH_ORDERS;
    return WAREHOUSE_DISPATCH_ORDERS.filter((o) => o.currentStatus === statusFilter);
  }, [statusFilter]);

  // Eligible to dispatch only if payment is done
  const dispatchEligible =
    demoOrder &&
    demoOrder.status === "Approved" &&
    (demoStatus === "Payment Completed" ||
      demoStatus === "Packed" ||
      demoStatus === "Dispatched" ||
      demoStatus === "In Transit");

  const nextStage = dispatchEligible ? NEXT_STAGES[demoStatus] : null;

  function handleAdvance() {
    if (!demoOrder || !nextStage) return;
    advanceDispatch(demoOrder.id, nextStage);
    setDemoStatus(nextStage);
    showToast(`Order ${demoOrder.id} marked as ${nextStage}`);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Current dispatch step index for demo order
  const demoDispatchIdx = timelineStatuses.indexOf(demoStatus as DispatchStatus);

  return (
    <ErpLayout
      title="Dispatch Tracking"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Dispatch Tracking")}
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* ── Demo order dispatch panel (shown when payment is completed) ── */}
      {demoOrder && dispatchEligible && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">
                {demoOrder.id}
                <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">LIVE ORDER</span>
              </p>
              <p className="text-sm text-slate-600">{demoOrder.branch} · ₹{new Intl.NumberFormat("en-IN").format(demoOrder.amount)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(demoStatus)}`}>
              {demoStatus}
            </span>
          </div>

          {/* Timeline */}
          <div className="mb-3 flex items-start gap-0">
            {timelineStatuses.map((s, idx) => {
              const done = idx <= demoDispatchIdx;
              const isCurrent = idx === demoDispatchIdx;
              return (
                <div key={s} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {idx > 0 && <div className={`h-1 flex-1 ${done ? "bg-[#0A3A92]" : "bg-slate-200"}`} />}
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 ${
                      isCurrent ? "border-[#0A3A92] bg-[#0A3A92] text-white ring-2 ring-[#0A3A92]/20"
                        : done ? "border-[#0A3A92] bg-[#0A3A92] text-white"
                        : "border-slate-300 bg-white text-slate-400"
                    }`}>{idx + 1}</div>
                    {idx < timelineStatuses.length - 1 && <div className={`h-1 flex-1 ${done && idx < demoDispatchIdx ? "bg-[#0A3A92]" : "bg-slate-200"}`} />}
                  </div>
                  <span className={`mt-1 text-center text-[11px] ${done ? "font-semibold text-slate-800" : "text-slate-400"}`}>{s}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 mt-1">
            {demoStatus === "Payment Completed" && (
              <button
                onClick={() => { advanceDispatch(demoOrder.id, "Packed"); setDemoStatus("Packed"); showToast(`Order ${demoOrder.id} marked as Packed`); }}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Pack Order
              </button>
            )}
            {demoStatus === "Packed" && (
              <button
                onClick={() => {
                  advanceDispatch(demoOrder.id, "Dispatched");
                  // Deduct stock via warehouse context
                  dispatchOrder(demoOrder.id);
                  setDemoStatus("Dispatched");
                  showToast(`Order ${demoOrder.id} marked as Dispatched — stock deducted`);
                }}
                className="rounded-md bg-[#0A3A92] px-4 py-2 text-sm font-semibold text-white hover:bg-[#083173]"
              >
                Dispatch Order
              </button>
            )}
            {(demoStatus === "Dispatched") && (
              <button
                onClick={handleAdvance}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Mark In Transit
              </button>
            )}
            {(demoStatus === "In Transit") && (
              <button
                onClick={handleAdvance}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Mark Delivered
              </button>
            )}
          </div>
          {(demoStatus as string) === "Delivered" && (
            <p className="mt-1 text-sm font-semibold text-emerald-700">✓ Order Delivered</p>
          )}
        </div>
      )}

      {demoOrder && demoOrder.status === "Approved" && demoStatus === "Approved" && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Awaiting payment from branch before dispatch can begin.
        </div>
      )}

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
              <p className="text-slate-600"><span className="font-medium">Vehicle:</span> {selectedOrder.vehicleNumber}</p>
              <p className="text-slate-600"><span className="font-medium">Driver:</span> {selectedOrder.driverName}</p>
            </div>
          </div>
          <div className="space-y-2">
            {timelineStatuses.map((status, index) => {
              const currentIndex = timelineStatuses.indexOf(selectedOrder.currentStatus as DispatchStatus);
              const done = index <= currentIndex;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-[#0A3A92] text-white" : "bg-slate-200 text-slate-600"}`}>
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
              {timelineStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
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
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.currentStatus)}`}>
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

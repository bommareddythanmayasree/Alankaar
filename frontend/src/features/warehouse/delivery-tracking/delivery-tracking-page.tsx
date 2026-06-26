import { useState, useEffect, useCallback } from "react";
import { PackageCheck, Clock, Truck } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getWorkflowOrders,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

const DELIVERY_STATUSES: WorkflowLifecycleStatus[] = ["In Transit", "Delivered"];

function statusBadge(status: WorkflowLifecycleStatus) {
  if (status === "Delivered")  return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

export function DeliveryTrackingPage() {
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);

  const loadOrders = useCallback(() => {
    const filtered = getWorkflowOrders().filter(o =>
      DELIVERY_STATUSES.includes(o.status as WorkflowLifecycleStatus)
    );
    setOrders(filtered);
  }, []);

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
    };
  }, [loadOrders]);

  const delivered  = orders.filter(o => o.status === "Delivered").length;
  const inTransit  = orders.filter(o => o.status === "In Transit").length;

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Delivery Tracking")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Delivery Confirmation Tracking</h2>
        <p className="mt-1 text-slate-500">Orders in transit and delivered — synced from Orders Workflow.</p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "In Transit", value: inTransit, bg: "bg-[#E0F2FE]", color: "text-sky-600",     Icon: Truck },
          { label: "Delivered",  value: delivered, bg: "bg-[#E2FFE6]", color: "text-emerald-600", Icon: PackageCheck },
          { label: "Total",      value: orders.length, bg: "bg-[#E9EDFF]", color: "text-indigo-600", Icon: Clock },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${c.bg} ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-semibold text-slate-800">{c.value}</div>
            <div className="text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No orders currently in transit or delivered. Orders appear here when they reach In Transit or Delivered status in Orders Workflow.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-semibold text-slate-800">Delivery Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3 text-right">Value</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-[#1B4DB1]">{order.id}</td>
                    <td className="px-5 py-3 text-slate-700">{order.branch}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${order.priority === "Urgent" ? "text-red-600" : "text-slate-500"}`}>{order.priority}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div className="space-y-0.5">
                        {order.items.map(item => (
                          <div key={item.product} className="text-xs">
                            {item.product}: {item.approvedQty > 0 ? item.approvedQty : item.orderedQty} {item.unit}
                            {item.rejectedQty > 0 && (
                              <span className="ml-1 text-red-500">(-{item.rejectedQty} rejected)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-800">₹{order.value.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

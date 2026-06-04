import { useMemo, useState } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_TRACKING_ORDERS } from "../../../shared/data/branch-mock-data";
import { useOrders } from "../../../app/branch/branch-context";

type TrackingStatus = "Order Placed" | "Approved" | "Packed" | "Dispatched" | "In Transit" | "Delivered";

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

const TIMELINE: TrackingStatus[] = ["Order Placed", "Approved", "Packed", "Dispatched", "In Transit", "Delivered"];

function statusColor(status: TrackingStatus) {
  if (status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "In Transit") return "bg-sky-100 text-sky-700";
  if (status === "Approved") return "bg-indigo-100 text-indigo-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderTrackingPage() {
  const { orders: contextOrders } = useOrders();

  // Merge context orders (new) with seed orders, context orders first
  const allOrders = useMemo(() => {
    const mapped = contextOrders.map((o) => ({
      orderId: o.orderId,
      orderDate: o.orderDate,
      expectedDelivery: o.expectedDelivery,
      currentStatus: o.currentStatus as TrackingStatus,
      amount: o.amount,
      branch: o.branch,
      items: o.items,
      statusHistory: o.statusHistory,
    }));
    return [...mapped, ...BRANCH_TRACKING_ORDERS];
  }, [contextOrders]);

  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const effectiveId = selectedOrderId ?? allOrders[0]?.orderId;
  const selected = allOrders.find((o) => o.orderId === effectiveId) ?? allOrders[0];
  const currentIdx = useMemo(() => TIMELINE.indexOf(selected?.currentStatus as TrackingStatus), [selected]);

  if (!selected) return null;

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Order Tracking")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Timeline */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Status Timeline</h3>
            <select value={effectiveId} onChange={(e) => setSelectedOrderId(e.target.value)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]">
              {allOrders.map((order) => (
                <option key={order.orderId} value={order.orderId}>{order.orderId}</option>
              ))}
            </select>
          </div>

          {/* Visual timeline */}
          <div className="overflow-x-auto">
            <div className="flex min-w-[560px] items-start gap-0">
              {TIMELINE.map((status, idx) => {
                const done = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={status} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      {idx > 0 && <div className={`h-1 flex-1 ${done ? "bg-[#0A3A92]" : "bg-slate-200"}`} />}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold border-2 ${
                        isCurrent ? "border-[#0A3A92] bg-[#0A3A92] text-white ring-4 ring-[#0A3A92]/20"
                          : done ? "border-[#0A3A92] bg-[#0A3A92] text-white"
                          : "border-slate-300 bg-white text-slate-400"
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < TIMELINE.length - 1 && <div className={`h-1 flex-1 ${done && idx < currentIdx ? "bg-[#0A3A92]" : "bg-slate-200"}`} />}
                    </div>
                    <span className={`mt-2 text-center text-xs ${done ? "font-semibold text-slate-900" : "text-slate-500"}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status history */}
          {selected.statusHistory.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-3 text-sm font-semibold text-slate-700">Status History</h4>
              <div className="space-y-2">
                {selected.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#0A3A92]" />
                    <div>
                      <span className="font-semibold text-slate-800">{h.status}</span>
                      <span className="ml-2 text-slate-500 text-xs">{h.timestamp}</span>
                      <span className="ml-2 text-xs text-slate-400">by {h.by}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Order Details */}
        <aside className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="text-xl font-semibold">Order Details</h3>
          <div className="mt-3 space-y-2 text-sm">
            <DetailRow label="Order ID" value={selected.orderId} />
            <DetailRow label="Branch" value={selected.branch} />
            <DetailRow label="Order Date" value={selected.orderDate} />
            <DetailRow label="Expected Delivery" value={selected.expectedDelivery} />
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <span className="text-slate-500">Status</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor(selected.currentStatus as TrackingStatus)}`}>
                {selected.currentStatus}
              </span>
            </div>
            <DetailRow label="Total Amount" value={`Rs.${new Intl.NumberFormat("en-IN").format(selected.amount)}`} />
          </div>

          <div className="mt-4 rounded-md border border-slate-200 bg-[#F8FAFD] p-3">
            <p className="mb-2 text-sm font-semibold">Products</p>
            <div className="space-y-1.5">
              {selected.items.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm text-slate-700">
                  <span>{item.name}</span>
                  <span className="text-slate-500">x {item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </ErpLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

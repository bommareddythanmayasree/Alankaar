import { useMemo, useState } from "react";
import { Check, Eye, Search, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_ORDER_VERIFICATION } from "../../../shared/data/warehouse-mock-data";

type VerifyStatus = "Pending" | "Approved" | "Rejected";

type OrderItem = { name: string; requested: number; available: number };

type VerificationOrder = {
  id: string;
  branch: string;
  date: string;
  itemsCount: number;
  amount: number;
  status: VerifyStatus;
  rejectionReason?: string;
  items: OrderItem[];
};

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

function statusClass(status: VerifyStatus) {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderVerificationPage() {
  const [orders, setOrders] = useState<VerificationOrder[]>(WAREHOUSE_ORDER_VERIFICATION as VerificationOrder[]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(WAREHOUSE_ORDER_VERIFICATION[0].id);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => [o.id, o.branch, o.status].join(" ").toLowerCase().includes(q));
  }, [orders, search]);

  const selected = orders.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  const approveOrder = (id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "Approved" as VerifyStatus, rejectionReason: undefined } : o)));
  };

  const startReject = (id: string) => { setRejectingId(id); setRejectReason(""); };

  const confirmReject = () => {
    if (!rejectingId || !rejectReason.trim()) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === rejectingId ? { ...o, status: "Rejected" as VerifyStatus, rejectionReason: rejectReason.trim() } : o))
    );
    setRejectingId(null);
  };

  return (
    <ErpLayout
      title="Order Verification"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Order Verification")}
    >
      <p className="mb-4 text-slate-600">Review and verify branch orders</p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="relative w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]"
              />
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
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{order.id}</td>
                    <td className="px-3 py-3">{order.branch}</td>
                    <td className="px-3 py-3">{order.date}</td>
                    <td className="px-3 py-3">{order.itemsCount} items</td>
                    <td className="px-3 py-3">&#8377;{new Intl.NumberFormat("en-IN").format(order.amount)}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedId(order.id)} className="rounded p-2 text-slate-500 hover:bg-slate-100">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => approveOrder(order.id)} disabled={order.status !== "Pending"} className="rounded p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => startReject(order.id)} disabled={order.status !== "Pending"} className="rounded p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-30">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Order Details</h3>
          {selected ? (
            <>
              <div className="mb-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
                <p className="font-semibold text-slate-800">{selected.id}</p>
                <p className="text-slate-600">{selected.branch}</p>
              </div>
              <div className="space-y-2">
                {selected.items.map((item) => {
                  const canApprove = item.available >= item.requested;
                  return (
                    <div key={item.name} className="rounded-md border border-slate-200 p-3">
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <p className="text-xs text-slate-500">Requested</p>
                          <p className="font-medium">{item.requested}</p>
                        </div>
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <p className="text-xs text-slate-500">Available</p>
                          <p className="font-medium">{item.available}</p>
                        </div>
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${canApprove ? "text-emerald-600" : "text-rose-600"}`}>
                        {canApprove ? "Sufficient stock" : "Insufficient stock"}
                      </p>
                    </div>
                  );
                })}
              </div>
              {selected.status === "Rejected" && selected.rejectionReason ? (
                <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <span className="font-semibold">Reason:</span> {selected.rejectionReason}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select an order to view details.</p>
          )}
        </section>
      </div>

      {rejectingId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
          <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-2 text-lg font-semibold">Reject Order</h3>
            <p className="mb-3 text-sm text-slate-600">Rejection reason is required.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Enter rejection reason..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0A3A92]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setRejectingId(null)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button onClick={confirmReject} disabled={!rejectReason.trim()} className="h-10 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">
                Reject Order
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ErpLayout>
  );
}

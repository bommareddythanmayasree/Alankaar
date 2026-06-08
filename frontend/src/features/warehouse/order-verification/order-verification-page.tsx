import { useMemo, useState, useEffect } from "react";
import { AlertTriangle, Check, Mail, Search, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_ORDER_VERIFICATION } from "../../../shared/data/warehouse-mock-data";
import {
  getDemoOrder,
  approveOrder as demoApprove,
  rejectOrder as demoReject,
  type DemoOrder,
} from "../../../shared/lib/demo-store";
import { useWarehouse } from "../../../app/warehouse/warehouse-context";

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

type VerifyStatus = "Pending" | "Approved" | "Rejected" | "Partial";

type OrderRow = {
  id: string;
  branch: string;
  date: string;
  itemsCount: number;
  amount: number;
  status: VerifyStatus;
  rejectionReason?: string;
  items: { name: string; requested: number; available: number; approved?: number }[];
  partialFulfillment?: boolean;
  emailSent?: boolean;
  paymentStatus?: "Pending" | "Completed";
  invoiceNumber?: string;
  isDemo?: boolean;
};

function seedOrders(): OrderRow[] {
  return WAREHOUSE_ORDER_VERIFICATION.map((o) => ({
    ...o,
    status: o.status as VerifyStatus,
    partialFulfillment: false,
    emailSent: false,
    paymentStatus: undefined,
    invoiceNumber: undefined,
    isDemo: false,
  }));
}

function demoToRow(d: DemoOrder): OrderRow {
  return {
    id: d.id,
    branch: d.branch,
    date: d.date,
    itemsCount: d.itemsCount,
    amount: d.amount,
    status: d.status === "Rejected" ? "Rejected" : d.status === "Approved" ? "Approved" : "Pending",
    items: d.items,
    partialFulfillment: false,
    emailSent: false,
    paymentStatus: d.paymentStatus === "Paid" ? "Completed" : (d.status === "Approved" ? "Pending" : undefined),
    invoiceNumber: d.invoiceNumber ?? undefined,
    isDemo: true,
  };
}

function statusClass(status: VerifyStatus) {
  if (status === "Approved") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-rose-100 text-rose-700";
  if (status === "Partial") return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderVerificationPage() {
  // Local state: mutable list of orders (mock + demo)
  const [orders, setOrders] = useState<OrderRow[]>(() => {
    const base = seedOrders();
    const demo = getDemoOrder();
    if (demo) return [demoToRow(demo), ...base];
    return base;
  });

  const { approveOrder: warehouseApprove, addOrderFromBranch, orders: contextOrders } = useWarehouse();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(orders[0]?.id ?? "");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveConfirm, setApproveConfirm] = useState<OrderRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Re-read localStorage whenever page gains focus (handles cross-tab / navigation)
  useEffect(() => {
    function sync() {
      const demo = getDemoOrder();
      setOrders(() => {
        const base = seedOrders();
        if (!demo) return base;
        return [demoToRow(demo), ...base];
      });
    }
    window.addEventListener("focus", sync);
    // Also run immediately on mount to catch orders placed before navigation
    sync();
    return () => window.removeEventListener("focus", sync);
  }, []);

  // Sync approved/rejected status from warehouse context back into local display state
  useEffect(() => {
    if (contextOrders.length === 0) return;
    setOrders((prev) =>
      prev.map((local) => {
        const ctx = contextOrders.find((c) => c.id === local.id);
        if (!ctx) return local;
        return {
          ...local,
          status: ctx.status as VerifyStatus,
          items: ctx.items,
          partialFulfillment: ctx.partialFulfillment,
          paymentStatus: ctx.paymentStatus,
          invoiceNumber: ctx.invoiceNumber,
        };
      })
    );
  }, [contextOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => [o.id, o.branch, o.status].join(" ").toLowerCase().includes(q));
  }, [orders, search]);

  const selected = orders.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  function hasShortage(order: OrderRow) {
    return order.items.some((item) => item.available < item.requested);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleApproveClick = (order: OrderRow) => {
    if (hasShortage(order)) {
      setApproveConfirm(order);
    } else {
      doApprove(order);
    }
  };

  function doApprove(order: OrderRow) {
    if (order.isDemo) {
      // Ensure the demo order is registered in warehouse context so approveOrder can find it
      const alreadyInContext = contextOrders.some((c) => c.id === order.id);
      if (!alreadyInContext) {
        addOrderFromBranch({
          id: order.id,
          branch: order.branch,
          date: order.date,
          itemsCount: order.itemsCount,
          amount: order.amount,
          status: "Pending",
          items: order.items,
          partialFulfillment: false,
          emailSent: false,
          paymentStatus: undefined,
          invoiceNumber: undefined,
        });
      }
      // This is the call that actually deducts stock, persists to localStorage,
      // and creates stock logs — it must not be skipped.
      warehouseApprove(order.id);
      // Also update demo-store tracking status
      demoApprove(order.id, order.branch);
    } else {
      // Non-demo (mock) orders: update local state directly
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== order.id) return o;
          const isPartial = hasShortage(o);
          const resolved = o.items.map((item) => ({
            ...item,
            approved: Math.min(item.requested, item.available),
          }));
          return {
            ...o,
            status: isPartial ? ("Partial" as VerifyStatus) : ("Approved" as VerifyStatus),
            items: resolved,
            partialFulfillment: isPartial,
            paymentStatus: "Pending" as const,
          };
        })
      );
    }
    showToast(`Order ${order.id} approved successfully`);
  }

  const confirmApprove = () => {
    if (!approveConfirm) return;
    doApprove(approveConfirm);
    setApproveConfirm(null);
  };

  const startReject = (id: string) => { setRejectingId(id); setRejectReason(""); };

  const confirmReject = () => {
    if (!rejectingId || !rejectReason.trim()) return;
    const order = orders.find((o) => o.id === rejectingId);
    if (order?.isDemo) demoReject(rejectingId, rejectReason.trim());
    setOrders((prev) =>
      prev.map((o) =>
        o.id === rejectingId
          ? { ...o, status: "Rejected" as VerifyStatus, rejectionReason: rejectReason.trim() }
          : o
      )
    );
    showToast(`Order ${rejectingId} rejected`);
    setRejectingId(null);
  };

  return (
    <ErpLayout
      title="Order Verification"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Order Verification")}
    >
      <p className="mb-4 text-slate-600">Review and verify branch orders</p>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ── Left: Order List ── */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-4">
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

          <div className="overflow-x-auto overflow-y-visible">
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
                  <tr
                    key={order.id}
                    onClick={() => setSelectedId(order.id)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      selectedId === order.id
                        ? "bg-[#EEF3FF] border-l-4 border-l-[#0A3A92]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1] underline">
                      {order.id}
                      {order.isDemo && order.status === "Pending" && (
                        <span className="ml-2 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          NEW
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{order.branch}</td>
                    <td className="px-3 py-3">{order.date}</td>
                    <td className="px-3 py-3">{order.itemsCount} items</td>
                    <td className="px-3 py-3">&#8377;{new Intl.NumberFormat("en-IN").format(order.amount)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                        {order.partialFulfillment && (
                          <span title="Partial fulfillment"><AlertTriangle className="h-3.5 w-3.5 text-orange-500" /></span>
                        )}
                        {order.emailSent && (
                          <span title="Email sent"><Mail className="h-3.5 w-3.5 text-blue-500" /></span>
                        )}
                        {(order.status === "Approved" || order.status === "Partial") && order.paymentStatus === "Completed" && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Paid</span>
                        )}
                        {(order.status === "Approved" || order.status === "Partial") && order.paymentStatus === "Pending" && (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Unpaid</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApproveClick(order); }}
                          disabled={order.status !== "Pending"}
                          className="rounded p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-30"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startReject(order.id); }}
                          disabled={order.status !== "Pending"}
                          className="rounded p-2 text-rose-700 hover:bg-rose-50 disabled:opacity-30"
                          title="Reject"
                        >
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

        {/* ── Right: Order Details ── */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Order Details</h3>
          {selected ? (
            <>
              <div className="mb-3 rounded-md bg-[#F8FAFD] px-3 py-2 text-sm">
                <p className="font-semibold text-slate-800">{selected.id}</p>
                <p className="text-slate-600">{selected.branch}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(selected.status)}`}>
                    {selected.status}
                  </span>
                  {selected.partialFulfillment && (
                    <span className="text-xs text-orange-600 font-medium">Partial fulfillment</span>
                  )}
                </div>
                {selected.invoiceNumber && (
                  <p className="mt-2 text-xs text-slate-500">
                    Invoice: <span className="font-semibold text-slate-700">{selected.invoiceNumber}</span>
                  </p>
                )}
                {(selected.status === "Approved" || selected.status === "Partial") && (
                  <div className="mt-2">
                    {selected.paymentStatus === "Completed" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        ✓ Payment Received — Ready for dispatch
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        Awaiting payment from branch
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {selected.items.map((item) => {
                  const isShortage = item.available < item.requested;
                  const approvedQty = item.approved ?? (isShortage ? item.available : item.requested);
                  return (
                    <div key={item.name} className={`rounded-md border p-3 ${isShortage ? "border-orange-200 bg-orange-50" : "border-slate-200"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        {isShortage && <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <p className="text-xs text-slate-500">Requested</p>
                          <p className="font-medium">{item.requested}</p>
                        </div>
                        <div className="rounded bg-slate-50 px-2 py-1">
                          <p className="text-xs text-slate-500">Available</p>
                          <p className={`font-medium ${isShortage ? "text-rose-600" : "text-slate-800"}`}>{item.available}</p>
                        </div>
                        <div className={`rounded px-2 py-1 ${isShortage ? "bg-orange-100" : "bg-emerald-50"}`}>
                          <p className="text-xs text-slate-500">Approved</p>
                          <p className={`font-medium ${isShortage ? "text-orange-700" : "text-emerald-700"}`}>{approvedQty}</p>
                        </div>
                      </div>
                      {isShortage ? (
                        <p className="mt-2 text-xs font-semibold text-orange-600">
                          ⚠ Only {item.available} units available — partial fulfillment.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-emerald-600">✓ Sufficient stock</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {selected.status === "Rejected" && selected.rejectionReason && (
                <div className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <span className="font-semibold">Reason:</span> {selected.rejectionReason}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Select an order to view details.</p>
          )}
        </section>
      </div>

      {/* ── Partial Fulfillment Modal ── */}
      {approveConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/35 p-4">
          <div className="w-full max-w-[480px] rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold">Partial Fulfillment Warning</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Some items in order <span className="font-semibold">{approveConfirm.id}</span> have insufficient stock.
              The system will approve available quantities only.
            </p>
            <div className="mb-4 space-y-2">
              {approveConfirm.items.filter((i) => i.available < i.requested).map((item) => (
                <div key={item.name} className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-slate-600">
                    Requested: <span className="font-medium">{item.requested}</span>
                    {" · "}
                    Available: <span className="font-medium text-rose-600">{item.available}</span>
                    {" · "}
                    Will approve: <span className="font-medium text-orange-700">{item.available}</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setApproveConfirm(null)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button onClick={confirmApprove} className="h-10 rounded-md bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600">
                Approve Partial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectingId && (
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
      )}
    </ErpLayout>
  );
}

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, CreditCard, Smartphone, Banknote, AlertCircle, Eye, Receipt } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  getWorkflowOrders,
  getCurrentDemoBranchName,
  getDeliveryException,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";

// ── Types ─────────────────────────────────────────────────────────────────────
type PaymentMethod = "UPI" | "Net Banking" | "Cash Collection";
type PaymentIntent = "Ready To Pay" | "Will Pay Later" | "Payment Pending" | "Payment Completed";

type MockPaymentOrder = WorkflowOrderLive & { isMock: true };

// ── Demo mock records (never synced, always appended below live data) ──────────
const MOCK_PAYMENT_ORDERS: MockPaymentOrder[] = [
  {
    isMock: true,
    id: "ORD-2026-105",
    branch: "Benz Circle",
    date: "2026-06-20",
    time: "10:00",
    priority: "Normal",
    status: "Payment Pending",
    value: 5800,
    invoiceNumber: "INV-2026-3011",
    items: [
      { product: "Kaju Katli", orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "kg" },
      { product: "Gulab Jamun", orderedQty: 5, approvedQty: 5, rejectedQty: 0, unit: "kg" },
    ],
  },
  {
    isMock: true,
    id: "ORD-2026-112",
    branch: "Patamata",
    date: "2026-06-22",
    time: "11:30",
    priority: "Normal",
    status: "Invoice Generated",
    value: 7400,
    invoiceNumber: "INV-2026-3015",
    items: [
      { product: "Boondi Laddu", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "kg" },
      { product: "Mysore Pak", orderedQty: 8, approvedQty: 8, rejectedQty: 0, unit: "kg" },
    ],
  },
  {
    isMock: true,
    id: "ORD-2026-118",
    branch: "Governorpet",
    date: "2026-06-24",
    time: "09:15",
    priority: "Normal",
    status: "Invoice Generated",
    value: 3250,
    invoiceNumber: "INV-2026-3020",
    items: [
      { product: "Rasmalai", orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "kg" },
      { product: "Butter Cookies", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "kg" },
    ],
  },
];

const PAYMENT_METHODS: PaymentMethod[] = ["UPI", "Net Banking", "Cash Collection"];
const INTENT_OPTIONS: PaymentIntent[] = ["Ready To Pay", "Will Pay Later", "Payment Pending", "Payment Completed"];

// Statuses that should appear on Payment Status page
const PAYMENT_STATUS_STATUSES: WorkflowLifecycleStatus[] = [
  "Invoice Generated",
  "Payment Pending",
  "Payment Completed",
  "Order Closed",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number) { return `\u20B9${v.toLocaleString("en-IN")}`; }

function statusColor(status: WorkflowLifecycleStatus) {
  if (status === "Order Closed" || status === "Payment Completed") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status === "Payment Pending")    return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "Invoice Generated")  return "bg-violet-100 text-violet-700 border-violet-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function intentColor(i: PaymentIntent) {
  if (i === "Ready To Pay")      return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (i === "Will Pay Later")    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (i === "Payment Completed") return "bg-teal-100 text-teal-700 border-teal-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function methodIcon(m: PaymentMethod) {
  if (m === "UPI")         return <Smartphone className="h-4 w-4" />;
  if (m === "Net Banking") return <CreditCard className="h-4 w-4" />;
  return <Banknote className="h-4 w-4" />;
}

const FLOW_STEPS: WorkflowLifecycleStatus[] = [
  "Invoice Generated",
  "Payment Pending",
  "Payment Completed",
];

function buildSteps(order: WorkflowOrderLive) {
  const isComplete = order.status === "Payment Completed" || order.status === "Order Closed";
  const idx = isComplete ? FLOW_STEPS.length : FLOW_STEPS.indexOf(order.status as WorkflowLifecycleStatus);
  return FLOW_STEPS.map((step, i) => ({
    label: step,
    done: i < (isComplete ? FLOW_STEPS.length : idx),
    current: !isComplete && i === idx,
  }));
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ order, onClose }: { order: WorkflowOrderLive; onClose: () => void }) {
  // order.value is the final payable amount (inclusive of GST)
  const total = order.value;
  const subtotal = Math.round(total / 1.05);
  const tax = total - subtotal;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Invoice</h3>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">&#10005;</button>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Invoice No.</span><span className="font-semibold">{order.invoiceNumber ?? "—"}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span className="font-semibold">{order.id}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Branch</span><span className="font-semibold">{order.branch}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-semibold">{order.date}</span></div>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Products</p>
        <div className="mb-4 space-y-1">
          {(() => {
            const exception = getDeliveryException(order.id);
            return order.items.map(p => {
              const excItem = exception?.items.find(e => e.product === p.product);
              const deliveredQty = excItem
                ? excItem.receivedQty
                : (p.approvedQty > 0 ? p.approvedQty : p.orderedQty);
              return (
                <div key={p.product} className="flex justify-between rounded bg-slate-50 px-3 py-1.5 text-sm">
                  <span className="text-slate-700">{p.product} &mdash; {deliveredQty} {p.unit}</span>
                </div>
              );
            });
          })()}
        </div>

        <div className="space-y-1.5 border-t border-b border-slate-100 py-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-600">Tax (5%)</span><span>{fmt(tax)}</span></div>
        </div>

        <div className="mt-3 flex justify-between text-base font-bold">
          <span>Total Amount</span><span className="text-[#0B2C66]">{fmt(total)}</span>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
          <button className="flex-1 rounded-lg bg-[#0B2C66] py-2 text-sm font-semibold text-white hover:bg-[#092757]">Download PDF</button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSuccess }: {
  order: WorkflowOrderLive;
  onClose: () => void;
  onSuccess: (id: string, isVerification: boolean) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<PaymentMethod>("UPI");

  function confirm() {
    onSuccess(order.id, method === "Cash Collection");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Make Payment</h3>
          <button onClick={onClose} className="text-xl leading-none text-slate-400 hover:text-slate-600">&#10005;</button>
        </div>

        <div className="mb-5 flex items-center gap-2">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step >= n ? "bg-[#0B2C66] text-white" : "bg-slate-100 text-slate-400"}`}>{n}</div>
              {n < 2 && <div className={`h-0.5 w-8 ${step > n ? "bg-[#0B2C66]" : "bg-slate-200"}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-slate-500">{step === 1 ? "Select Method" : "Confirm"}</span>
        </div>

        {step === 1 && (
          <>
            <div className="mb-4 rounded-lg bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Order</span><span className="font-semibold">{order.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span className="font-bold text-red-600">{fmt(order.value)}</span></div>
            </div>
            <p className="mb-3 text-sm font-semibold text-slate-600">Select Payment Method</p>
            <div className="space-y-2 mb-5">
              {PAYMENT_METHODS.map(m => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${method === m ? "border-[#0B2C66] bg-[#EEF4FF]" : "border-slate-200 hover:bg-slate-50"}`}>
                  {methodIcon(m)}
                  <span className={`font-medium text-sm ${method === m ? "text-[#0B2C66]" : "text-slate-700"}`}>{m}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="w-full rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#092757]">Continue</button>
          </>
        )}

        {step === 2 && (
          <>
            {method === "UPI" && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">UPI Details</p>
                <p className="text-sm font-mono font-semibold text-[#0B2C66]">alankaar.foods@paytm</p>
                <p className="text-xs text-slate-500">Scan QR or use UPI ID to pay {fmt(order.value)}</p>
              </div>
            )}
            {method === "Net Banking" && (
              <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">You will be redirected to your bank&apos;s secure portal to complete the payment of {fmt(order.value)}.</p>
              </div>
            )}
            {method === "Cash Collection" && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-700">Cash Collection Request</p>
                </div>
                <p className="text-xs text-amber-600">A collection executive will visit your branch within 24 hours to collect {fmt(order.value)}.</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Back</button>
              <button onClick={confirm} className="flex-1 rounded-lg bg-[#0B2C66] py-2.5 text-sm font-semibold text-white hover:bg-[#092757]">
                {method === "Cash Collection" ? "Request Collection" : "Pay Now"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function PaymentStatusPage() {
  const currentBranch = getCurrentDemoBranchName();
  const [orders, setOrders] = useState<WorkflowOrderLive[]>([]);
  const [intentMap, setIntentMap] = useState<Record<string, PaymentIntent>>({});
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [successMap, setSuccessMap] = useState<Record<string, "normal" | "verification">>({});

  const loadOrders = useCallback(() => {
    const live = getWorkflowOrders().filter(o =>
      o.branch === currentBranch &&
      PAYMENT_STATUS_STATUSES.includes(o.status as WorkflowLifecycleStatus)
    );
    // Append mock records below live ones; they appear for all branches (demo purposes)
    setOrders([...live, ...MOCK_PAYMENT_ORDERS]);
  }, [currentBranch]);

  useEffect(() => {
    loadOrders();
    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
    };
  }, [loadOrders]);

  const invoiceOrder = orders.find(o => o.id === invoiceId) ?? null;
  const paymentOrder = orders.find(o => o.id === paymentId) ?? null;

  const totalValue       = orders.reduce((s, o) => s + o.value, 0);
  const totalPaid        = orders.filter(o => o.status === "Order Closed" || o.status === "Payment Completed").reduce((s, o) => s + o.value, 0);
  const totalOutstanding = orders.filter(o => o.status !== "Order Closed" && o.status !== "Payment Completed").reduce((s, o) => s + o.value, 0);

  function handleSuccess(orderId: string, isVerification: boolean) {
    setPaymentId(null);
    setSuccessMap(m => ({ ...m, [orderId]: isVerification ? "verification" : "normal" }));
    setTimeout(() => setSuccessMap(m => { const n = { ...m }; delete n[orderId]; return n; }), 6000);
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Payment Status")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Payment Status</h2>
        <p className="mt-1 text-slate-500">Track delivered order payments and manage payment workflows.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { label: "Total Value",   value: totalValue,       color: "text-indigo-600",  bar: "bg-indigo-400" },
          { label: "Outstanding",   value: totalOutstanding, color: "text-amber-600",   bar: "bg-amber-400" },
          { label: "Collected",     value: totalPaid,        color: "text-teal-600",    bar: "bg-teal-400" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className={`mb-2 h-1.5 w-10 rounded-full ${c.bar}`} />
            <div className={`text-xl font-bold ${c.color}`}>{fmt(c.value)}</div>
            <div className="mt-0.5 text-sm text-slate-500">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Order Cards */}
      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
          No orders in payment workflow. Orders appear here when Invoice Generated, Payment Pending, or Order Closed.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const intent: PaymentIntent =
              order.status === "Payment Completed" || order.status === "Order Closed"
                ? "Payment Completed"
                : order.status === "Invoice Generated"
                  ? (intentMap[order.id] ?? "Ready To Pay")
                  : (intentMap[order.id] ?? (
                      (order as MockPaymentOrder).isMock && order.id === "ORD-2026-112" ? "Will Pay Later" :
                      (order as MockPaymentOrder).isMock && order.id === "ORD-2026-118" ? "Ready To Pay" :
                      "Payment Pending"
                    ));
            const steps = buildSteps(order);
            const banner = successMap[order.id];

            return (
              <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-5">

                {/* Success banner */}
                {banner && (
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">
                      {banner === "verification"
                        ? "Payment submitted and awaiting verification."
                        : "Payment recorded successfully."}
                    </p>
                  </div>
                )}

                {/* Header row */}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#0B2C66]">{order.id}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor(order.status as WorkflowLifecycleStatus)}`}>
                      {order.status}
                    </span>
                    {(order as MockPaymentOrder).isMock && (
                      <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">Demo</span>
                    )}
                    <span className="text-xs text-slate-500">{order.branch} &middot; {order.date}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-slate-500">Value: <strong className="text-slate-800">{fmt(order.value)}</strong></span>
                    {order.invoiceNumber && (
                      <span className="text-slate-500">Invoice: <strong className="text-violet-700">{order.invoiceNumber}</strong></span>
                    )}
                  </div>
                </div>

                {/* Payment flow timeline */}
                <div className="mb-4 overflow-x-auto">
                  <div className="flex min-w-max items-start gap-0">
                    {steps.map((step, i) => (
                      <div key={step.label} className="flex items-center">
                        <div className="flex flex-col items-center" style={{ minWidth: 80 }}>
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                            step.done    ? "border-emerald-500 bg-emerald-500 text-white" :
                            step.current ? "border-amber-500 bg-amber-500 text-white" :
                                           "border-slate-300 bg-white"
                          }`}>
                            {step.done    ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                             step.current ? <Clock className="h-3.5 w-3.5" /> :
                                            <span className="text-[9px] font-bold text-slate-400">{i + 1}</span>}
                          </div>
                          <span className={`mt-1 text-center text-[9px] leading-tight px-0.5 ${
                            step.done    ? "text-emerald-600 font-medium" :
                            step.current ? "text-amber-600 font-medium" : "text-slate-400"
                          }`}>{step.label}</span>
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`mb-4 h-0.5 w-8 shrink-0 ${steps[i + 1].done || steps[i + 1].current ? "bg-emerald-300" : "bg-slate-200"}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setInvoiceId(order.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Eye className="h-3.5 w-3.5" />View Invoice
                  </button>

                  {order.status !== "Payment Completed" && order.status !== "Order Closed" && !banner && (
                    <button onClick={() => setPaymentId(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0B2C66] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#092757]">
                      <Receipt className="h-3.5 w-3.5" />Proceed To Payment
                    </button>
                  )}

                  <div className="ml-auto flex flex-wrap gap-1.5">
                    {INTENT_OPTIONS.map(opt => (
                      <button key={opt}
                        onClick={() => setIntentMap(m => ({ ...m, [order.id]: opt }))}
                        disabled={order.status === "Payment Completed"}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-all disabled:cursor-default ${intent === opt ? intentColor(opt) : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceId(null)} />}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentId(null)}
          onSuccess={handleSuccess}
        />
      )}
    </ErpLayout>
  );
}

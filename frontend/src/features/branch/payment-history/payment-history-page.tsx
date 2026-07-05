import { useState, useEffect, useCallback } from "react";
import { History, Search, Banknote, Smartphone, AlertCircle } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  getWorkflowOrders,
  getCurrentDemoBranchName,
  type WorkflowOrderLive,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

// Statuses to show in Payment History
const HISTORY_STATUSES: WorkflowLifecycleStatus[] = ["Payment Completed", "Order Closed"];

const STATUS_COLORS: Record<string, string> = {
  "Payment Completed": "bg-emerald-100 text-emerald-700",
  "Order Closed":      "bg-slate-100 text-slate-600",
};

const METHOD_COLORS: Record<string, string> = {
  "Cash":          "bg-green-50 text-green-700",
  "UPI":           "bg-violet-50 text-violet-700",
  "Card":          "bg-blue-50 text-blue-700",
  "Bank Transfer": "bg-amber-50 text-amber-700",
  "Net Banking":   "bg-cyan-50 text-cyan-700",
};

// ── Static mock payment records ────────────────────────────────────────────
interface MockPaymentRecord {
  id: string;
  date: string;
  orderId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  status: "Payment Completed" | "Order Closed";
  transactionRef: string;
  collectedBy: string;
}

const MOCK_PAYMENTS: MockPaymentRecord[] = [
  {
    id: "mock-1",
    date: "2026-07-04",
    orderId: "ORD-2026-0041",
    invoiceNumber: "INV-2026-1045",
    amount: 15670,
    paymentMethod: "UPI",
    status: "Order Closed",
    transactionRef: "UPI/261850234512",
    collectedBy: "Ravi Kumar",
  },
  {
    id: "mock-2",
    date: "2026-07-04",
    orderId: "ORD-2026-0038",
    invoiceNumber: "INV-2026-1042",
    amount: 8900,
    paymentMethod: "Cash",
    status: "Payment Completed",
    transactionRef: "CASH/260704/038",
    collectedBy: "Meena Rao",
  },
  {
    id: "mock-3",
    date: "2026-07-03",
    orderId: "ORD-2026-0035",
    invoiceNumber: "INV-2026-1039",
    amount: 22100,
    paymentMethod: "Bank Transfer",
    status: "Order Closed",
    transactionRef: "NEFT/HDFC/261703/4892",
    collectedBy: "Suresh Nair",
  },
  {
    id: "mock-4",
    date: "2026-07-03",
    orderId: "ORD-2026-0033",
    invoiceNumber: "INV-2026-1037",
    amount: 12430,
    paymentMethod: "Net Banking",
    status: "Order Closed",
    transactionRef: "NBNK/SBI/261703/7731",
    collectedBy: "Priya Menon",
  },
  {
    id: "mock-5",
    date: "2026-07-03",
    orderId: "ORD-2026-0031",
    invoiceNumber: "INV-2026-1034",
    amount: 4850,
    paymentMethod: "UPI",
    status: "Payment Completed",
    transactionRef: "UPI/261603219847",
    collectedBy: "Ravi Kumar",
  },
  {
    id: "mock-6",
    date: "2026-07-02",
    orderId: "ORD-2026-0028",
    invoiceNumber: "INV-2026-1031",
    amount: 18250,
    paymentMethod: "Card",
    status: "Order Closed",
    transactionRef: "POS/ICICI/261702/CC9934",
    collectedBy: "Deepak Sharma",
  },
  {
    id: "mock-7",
    date: "2026-07-02",
    orderId: "ORD-2026-0025",
    invoiceNumber: "INV-2026-1028",
    amount: 9600,
    paymentMethod: "Cash",
    status: "Payment Completed",
    transactionRef: "CASH/260702/025",
    collectedBy: "Meena Rao",
  },
  {
    id: "mock-8",
    date: "2026-07-01",
    orderId: "ORD-2026-0021",
    invoiceNumber: "INV-2026-1024",
    amount: 31400,
    paymentMethod: "Bank Transfer",
    status: "Order Closed",
    transactionRef: "RTGS/AXIS/261701/9203",
    collectedBy: "Suresh Nair",
  },
  {
    id: "mock-9",
    date: "2026-07-01",
    orderId: "ORD-2026-0019",
    invoiceNumber: "INV-2026-1022",
    amount: 7350,
    paymentMethod: "UPI",
    status: "Payment Completed",
    transactionRef: "UPI/261501098234",
    collectedBy: "Priya Menon",
  },
  {
    id: "mock-10",
    date: "2026-06-30",
    orderId: "ORD-2026-0016",
    invoiceNumber: "INV-2026-1019",
    amount: 14920,
    paymentMethod: "Net Banking",
    status: "Order Closed",
    transactionRef: "NBNK/KOTAK/260630/4412",
    collectedBy: "Deepak Sharma",
  },
  {
    id: "mock-11",
    date: "2026-06-30",
    orderId: "ORD-2026-0014",
    invoiceNumber: "INV-2026-1017",
    amount: 6200,
    paymentMethod: "Card",
    status: "Payment Completed",
    transactionRef: "POS/HDFC/260630/DC7781",
    collectedBy: "Ravi Kumar",
  },
  {
    id: "mock-12",
    date: "2026-06-29",
    orderId: "ORD-2026-0011",
    invoiceNumber: "INV-2026-1014",
    amount: 26750,
    paymentMethod: "Bank Transfer",
    status: "Order Closed",
    transactionRef: "NEFT/ICICI/260629/8854",
    collectedBy: "Suresh Nair",
  },
];

// Unified row type for rendering
interface PaymentRow {
  _key: string;
  date: string;
  orderId: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  status: string;
  transactionRef: string;
  collectedBy: string;
}

function liveOrderToRow(o: WorkflowOrderLive): PaymentRow {
  return {
    _key: o.id,
    date: o.date,
    orderId: o.id,
    invoiceNumber: o.invoiceNumber ?? "—",
    amount: o.value,
    paymentMethod: (o as unknown as { paymentMethod?: string }).paymentMethod ?? "—",
    status: o.status,
    transactionRef: (o as unknown as { transactionRef?: string }).transactionRef ?? "—",
    collectedBy: (o as unknown as { collectedBy?: string }).collectedBy ?? "—",
  };
}

function mockToRow(m: MockPaymentRecord): PaymentRow {
  return {
    _key: m.id,
    date: m.date,
    orderId: m.orderId,
    invoiceNumber: m.invoiceNumber,
    amount: m.amount,
    paymentMethod: m.paymentMethod,
    status: m.status,
    transactionRef: m.transactionRef,
    collectedBy: m.collectedBy,
  };
}

export function PaymentHistoryPage() {
  const currentBranch = getCurrentDemoBranchName();
  const [liveOrders, setLiveOrders] = useState<WorkflowOrderLive[]>([]);
  const [search, setSearch] = useState("");

  const loadOrders = useCallback(() => {
    const all = getWorkflowOrders().filter(o =>
      o.branch === currentBranch &&
      HISTORY_STATUSES.includes(o.status as WorkflowLifecycleStatus)
    );
    setLiveOrders(all);
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

  // Merge mock + live rows, sorted newest first
  const allRows: PaymentRow[] = [
    ...liveOrders.map(liveOrderToRow),
    ...MOCK_PAYMENTS.map(mockToRow),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const filtered = allRows.filter(r => {
    const q = search.toLowerCase();
    return (
      r.orderId.toLowerCase().includes(q) ||
      r.invoiceNumber.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q) ||
      r.paymentMethod.toLowerCase().includes(q) ||
      r.transactionRef.toLowerCase().includes(q)
    );
  });

  // Summary calculations
  const totalCollected = allRows.reduce((s, r) => s + r.amount, 0);
  const completedCount = allRows.filter(r => r.status === "Payment Completed").length;
  const closedCount    = allRows.filter(r => r.status === "Order Closed").length;

  function fmt(v: number) { return formatCurrency(v); }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Payment History")}>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Payment History</h2>
        <p className="mt-1 text-slate-500">Completed payment records for {currentBranch}.</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <History className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{fmt(totalCollected)}</div>
            <div className="text-xs text-slate-500">Total Collected</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Smartphone className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{completedCount}</div>
            <div className="text-xs text-slate-500">Payments Completed</div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
            <Banknote className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="text-xl font-semibold text-slate-800">{closedCount}</div>
            <div className="text-xs text-slate-500">Orders Closed</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2">
        <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID, invoice, method, or status..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Transaction Ref / UTR</th>
                <th className="px-4 py-3">Collected By</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r._key} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{r.date}</td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{r.orderId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-violet-700">{r.invoiceNumber}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmt(r.amount)}</td>
                  <td className="px-4 py-3">
                    {r.paymentMethod !== "—" ? (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${METHOD_COLORS[r.paymentMethod] ?? "bg-slate-100 text-slate-600"}`}>
                        {r.paymentMethod}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.transactionRef}</td>
                  <td className="px-4 py-3 text-slate-600">{r.collectedBy}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No transactions match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {allRows.length === 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Payment history populates automatically when the warehouse marks orders as Payment Completed or Order Closed.
        </div>
      )}
    </ErpLayout>
  );
}

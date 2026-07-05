import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";
import {
  getOrdersReadyForInvoice,
  generateInvoiceForOrder,
  getInvoices,
  getInvoiceLines,
  getInvoiceSubtotal,
  getInvoiceAmount,
  getWorkflowOrders,
  getDispatchBatchesForOrder,
  type OrderReadyForInvoice,
  type InvoiceRecord,
  type WorkflowLifecycleStatus,
} from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

function fmt(v: number) { return formatCurrency(v); }

// ── Static mock data ──────────────────────────────────────────────────────────

const MOCK_AWAITING = [
  { orderId: "ORD-78162", branch: "Gandhi Nagar",  totalBatches: 3, deliveredBatches: 2, remainingBatches: 1 },
  { orderId: "ORD-78155", branch: "Benz Circle",   totalBatches: 2, deliveredBatches: 1, remainingBatches: 1 },
  { orderId: "ORD-78148", branch: "Patamata",      totalBatches: 4, deliveredBatches: 3, remainingBatches: 1 },
  { orderId: "ORD-78141", branch: "Gayatri Nagar", totalBatches: 2, deliveredBatches: 1, remainingBatches: 1 },
  { orderId: "ORD-78136", branch: "Machavaram",    totalBatches: 3, deliveredBatches: 1, remainingBatches: 2 },
  { orderId: "ORD-78129", branch: "Kanuru",        totalBatches: 2, deliveredBatches: 1, remainingBatches: 1 },
];

const MOCK_INVOICES = [
  { invoiceNumber: "INV-2026-0041", orderId: "ORD-78140", branch: "Gunadala",      invoiceDate: "05 Jul 2026", amount: 18450, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0040", orderId: "ORD-78133", branch: "Governorpet",   invoiceDate: "04 Jul 2026", amount: 12870, paymentStatus: "Payment Pending"   },
  { invoiceNumber: "INV-2026-0039", orderId: "ORD-78121", branch: "Singh Nagar",   invoiceDate: "03 Jul 2026", amount: 22310, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0038", orderId: "ORD-78115", branch: "Poranki",       invoiceDate: "02 Jul 2026", amount: 9680,  paymentStatus: "Invoice Generated" },
  { invoiceNumber: "INV-2026-0037", orderId: "ORD-78108", branch: "Vinchipeta",    invoiceDate: "01 Jul 2026", amount: 15200, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0036", orderId: "ORD-78099", branch: "Gannavaram",    invoiceDate: "30 Jun 2026", amount: 8950,  paymentStatus: "Payment Pending"   },
  { invoiceNumber: "INV-2026-0035", orderId: "ORD-78090", branch: "Auto Nagar",    invoiceDate: "28 Jun 2026", amount: 31200, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0034", orderId: "ORD-78081", branch: "Ayyappa Nagar", invoiceDate: "27 Jun 2026", amount: 14500, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0033", orderId: "ORD-78072", branch: "Prasadampadu",  invoiceDate: "26 Jun 2026", amount: 11340, paymentStatus: "Payment Pending"   },
  { invoiceNumber: "INV-2026-0032", orderId: "ORD-78063", branch: "Narasaraopet",  invoiceDate: "25 Jun 2026", amount: 19870, paymentStatus: "Payment Completed" },
];

const BASE_REVENUE = { today: 48750, weekly: 231300, monthly: 892400 };

// ── Types ─────────────────────────────────────────────────────────────────────

const INVOICED_STATUSES: WorkflowLifecycleStatus[] = [
  "Invoice Generated", "Payment Pending", "Payment Verification Pending",
  "Payment Completed", "Order Closed",
];

type AwaitingRow = {
  orderId: string;
  branch: string;
  totalBatches: number;
  deliveredBatches: number;
  remainingBatches: number;
  progress: number;
  statusLabel: string;
  canGenerate: boolean;
  isLive: boolean;
};

// ── Derive live rows from workflow state ──────────────────────────────────────

function buildAwaitingRows(invoicedIds: Set<string>, readyIds: Set<string>): AwaitingRow[] {
  const orders = getWorkflowOrders();
  const liveRows: AwaitingRow[] = [];

  for (const order of orders) {
    if (INVOICED_STATUSES.includes(order.status as WorkflowLifecycleStatus)) continue;
    if (invoicedIds.has(order.id)) continue;
    if (readyIds.has(order.id)) continue; // already in "Ready for Invoice" section

    const batches = getDispatchBatchesForOrder(order.id);
    if (batches.length === 0) continue;

    const totalBatches = batches.length;
    const deliveredBatches = batches.filter(b => b.status === "Delivered").length;
    if (deliveredBatches === 0) continue; // need at least 1 delivered batch to appear

    const remainingBatches = totalBatches - deliveredBatches;
    const progress = Math.round((deliveredBatches / totalBatches) * 100);

    let statusLabel: string;
    if (remainingBatches === 0) {
      statusLabel = "All Batches Delivered – Awaiting Invoice";
    } else if (remainingBatches === 1) {
      statusLabel = "Waiting for Final Batch";
    } else {
      statusLabel = "Waiting for Remaining Deliveries";
    }

    liveRows.push({
      orderId: order.id,
      branch: order.branch,
      totalBatches,
      deliveredBatches,
      remainingBatches,
      progress,
      statusLabel,
      // Generate Invoice only when all batches delivered AND order is "Awaiting Invoice"
      canGenerate: remainingBatches === 0 && (order.status as WorkflowLifecycleStatus) === "Awaiting Invoice",
      isLive: true,
    });
  }

  const liveIds = new Set(liveRows.map(r => r.orderId));

  const mockRows: AwaitingRow[] = MOCK_AWAITING
    .filter(o => !invoicedIds.has(o.orderId) && !liveIds.has(o.orderId))
    .map(o => ({
      ...o,
      progress: Math.round((o.deliveredBatches / o.totalBatches) * 100),
      statusLabel: o.remainingBatches === 1 ? "Waiting for Final Batch" : "Waiting for Remaining Deliveries",
      canGenerate: false,
      isLive: false,
    }));

  return [...liveRows, ...mockRows];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function paymentBadge(status: string) {
  if (status === "Paid" || status === "Payment Completed" || status === "Order Closed")
    return "bg-emerald-100 text-emerald-700";
  if (status === "Overdue")
    return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

// ── Invoice Preview Modal ─────────────────────────────────────────────────────
function PreviewModal({ entry, onClose, onGenerate }: {
  entry: OrderReadyForInvoice | InvoiceRecord;
  onClose: () => void;
  onGenerate?: () => void;
}) {
  const isPending = "lines" in entry && !("invoiceNumber" in entry);
  let lines: Array<{ product: string; unit: string; deliveredQty: number; unitPrice: number; lineTotal: number }> = [];
  let subtotal = 0, total = 0, orderId = "", branch = "";
  let invoiceNumber: string | undefined, deliveredDate: string | undefined, batchCount: number | undefined;

  if (isPending) {
    const o = entry as OrderReadyForInvoice;
    orderId = o.orderId; branch = o.branch; deliveredDate = o.lastDeliveredAt;
    lines = o.lines; subtotal = o.subtotal; total = o.total; batchCount = o.batchCount;
  } else {
    const inv = entry as InvoiceRecord;
    orderId = inv.orderId; branch = inv.branch; invoiceNumber = inv.invoiceNumber;
    deliveredDate = inv.deliveredDate; batchCount = inv.batchCount;
    lines = getInvoiceLines(orderId); subtotal = getInvoiceSubtotal(orderId); total = getInvoiceAmount(orderId);
  }
  const tax = Math.round(subtotal * 0.05);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
      <div className="w-full max-w-[720px] rounded-xl border border-slate-200 bg-white p-5 max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isPending ? "Invoice Preview" : "Invoice Detail"}
            {batchCount != null && batchCount > 0 && (
              <span className="ml-2 text-sm text-slate-500">— {batchCount} batch{batchCount !== 1 ? "es" : ""}</span>
            )}
          </h3>
          <button onClick={onClose} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-2xl font-bold text-[#0A3A92]">ALANKAR</p>
              <p className="text-sm text-slate-600">Warehouse Invoice</p>
            </div>
            <div className="text-right text-sm space-y-0.5">
              <p><span className="font-semibold">Invoice:</span> {invoiceNumber ?? "DRAFT"}</p>
              <p><span className="font-semibold">Order ID:</span> {orderId}</p>
              <p><span className="font-semibold">Branch:</span> {branch}</p>
              <p><span className="font-semibold">Delivered:</span> {deliveredDate ?? "—"}</p>
            </div>
          </div>
          <div className="mb-3 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-700">
            Invoice calculated on actual delivered quantities across all batches.
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-2 py-2">Product</th>
                <th className="px-2 py-2 text-right">Delivered</th>
                <th className="px-2 py-2">Unit</th>
                <th className="px-2 py-2 text-right">Unit Price</th>
                <th className="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(line => (
                <tr key={line.product} className="border-t border-slate-100">
                  <td className="px-2 py-2">{line.product}</td>
                  <td className="px-2 py-2 text-right font-semibold text-emerald-700">{line.deliveredQty}</td>
                  <td className="px-2 py-2">{line.unit}</td>
                  <td className="px-2 py-2 text-right text-slate-500">{formatCurrency(line.unitPrice)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto max-w-[260px] text-sm space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span><span className="font-semibold text-slate-800">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax (5%)</span><span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0A3A92]">
              <span>Total Payable</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {isPending && onGenerate && (
            <button
              onClick={() => { onGenerate(); onClose(); }}
              className="rounded-md bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559]"
            >
              Generate Invoice
            </button>
          )}
          <button onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type GeneratedInvoiceRow = {
  invoiceNumber: string;
  orderId: string;
  branch: string;
  invoiceDate: string;
  amount: number;
  paymentStatus: string;
};

export function InvoiceGenerationPage() {
  const [tick, setTick] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [previewEntry, setPreviewEntry] = useState<OrderReadyForInvoice | InvoiceRecord | null>(null);
  // IDs of live orders removed from awaiting after invoice generation this session
  const [dismissedLiveIds, setDismissedLiveIds] = useState<Set<string>>(new Set());
  // Invoices generated this session (prepended to MOCK_INVOICES)
  const [sessionInvoices, setSessionInvoices] = useState<GeneratedInvoiceRow[]>([]);

  // Re-render on storage changes
  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener("storage", handler);
    window.addEventListener("demo-store-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("demo-store-change", handler);
    };
  }, []);

  // Derive live awaiting rows from workflow state
  const awaitingRows = useCallback((): AwaitingRow[] => {
    const invoicedIds = new Set(sessionInvoices.map(i => i.orderId));
    dismissedLiveIds.forEach(id => invoicedIds.add(id));
    const readyIds = new Set(getOrdersReadyForInvoice().map(o => o.orderId));
    return buildAwaitingRows(invoicedIds, readyIds);
  }, [tick, dismissedLiveIds, sessionInvoices]); // eslint-disable-line react-hooks/exhaustive-deps

  const readyOrders = getOrdersReadyForInvoice();
  const mergedAwaitingOrders = awaitingRows();
  const recentInvoices: GeneratedInvoiceRow[] = [...sessionInvoices, ...MOCK_INVOICES];

  function handleGenerate(orderId: string) {
    const invoiceNumber = generateInvoiceForOrder(orderId);
    if (!invoiceNumber) return;
    const order = getWorkflowOrders().find(o => o.id === orderId);
    const newInvoice: GeneratedInvoiceRow = {
      invoiceNumber,
      orderId,
      branch: order?.branch ?? "—",
      invoiceDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, " "),
      amount: getInvoiceAmount(orderId),
      paymentStatus: "Payment Pending",
    };
    setSessionInvoices(prev => [newInvoice, ...prev]);
    setDismissedLiveIds(prev => new Set([...prev, orderId]));
    setToast(`Invoice ${invoiceNumber} generated successfully`);
    setTimeout(() => setToast(null), 3000);
    setTick(t => t + 1);
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Invoice Generation")}>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
      {previewEntry && (
        <PreviewModal
          entry={previewEntry}
          onClose={() => setPreviewEntry(null)}
          onGenerate={"lines" in previewEntry && !("invoiceNumber" in previewEntry)
            ? () => handleGenerate((previewEntry as OrderReadyForInvoice).orderId)
            : undefined}
        />
      )}

      {/* Header */}
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-slate-800">Invoice Generation</h2>
        <p className="text-sm text-slate-500">Generate and manage invoices for delivered orders</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Awaiting Invoice", value: mergedAwaitingOrders.length, color: "text-amber-600" },
          { label: "Ready to Invoice", value: readyOrders.length, color: "text-emerald-600" },
          { label: "Generated Today", value: sessionInvoices.length, color: "text-sky-600" },
          { label: "Total Invoices", value: recentInvoices.length, color: "text-[#0A3A92]" },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {([["Today", BASE_REVENUE.today], ["This Week", BASE_REVENUE.weekly], ["This Month", BASE_REVENUE.monthly]] as [string, number][]).map(([label, val]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{label}'s Revenue</p>
            <p className="text-xl font-bold text-slate-800">{fmt(val)}</p>
          </div>
        ))}
      </div>

      {/* Ready for Invoice */}
      {readyOrders.length > 0 && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-white">
          <div className="border-b border-emerald-100 px-5 py-3">
            <h3 className="font-semibold text-emerald-700">Ready for Invoice ({readyOrders.length})</h3>
            <p className="text-xs text-slate-500">All batches delivered — invoice can be generated now</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2">Order ID</th>
                  <th className="px-4 py-2">Branch</th>
                  <th className="px-4 py-2">Batches</th>
                  <th className="px-4 py-2">Delivered</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {readyOrders.map(order => (
                  <tr key={order.orderId} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-[#0A3A92]">{order.orderId}</td>
                    <td className="px-4 py-2">{order.branch}</td>
                    <td className="px-4 py-2">{order.batchCount}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{order.lastDeliveredAt}</td>
                    <td className="px-4 py-2 font-semibold text-emerald-700">{fmt(order.total)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewEntry(order)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                        >Preview</button>
                        <button
                          onClick={() => handleGenerate(order.orderId)}
                          className="rounded bg-[#0B2C66] px-2 py-1 text-xs font-semibold text-white hover:bg-[#0a2559]"
                        >Generate Invoice</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Awaiting Invoice */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">Orders Awaiting Invoice ({mergedAwaitingOrders.length})</h3>
          <p className="text-xs text-slate-500">Orders with partial or pending batch deliveries</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">Branch</th>
                <th className="px-4 py-2 text-center">Total Batches</th>
                <th className="px-4 py-2 text-center">Delivered</th>
                <th className="px-4 py-2 text-center">Remaining</th>
                <th className="px-4 py-2">Progress</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mergedAwaitingOrders.map(row => (
                <tr key={row.orderId} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-[#0A3A92]">{row.orderId}</td>
                  <td className="px-4 py-2">{row.branch}</td>
                  <td className="px-4 py-2 text-center">{row.totalBatches}</td>
                  <td className="px-4 py-2 text-center text-emerald-700 font-semibold">{row.deliveredBatches}</td>
                  <td className="px-4 py-2 text-center text-amber-700 font-semibold">{row.remainingBatches}</td>
                  <td className="px-4 py-2 w-32">
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${row.progress}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{row.progress}%</p>
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{row.statusLabel}</span>
                  </td>
                  <td className="px-4 py-2">
                    {row.canGenerate ? (
                      <button
                        onClick={() => handleGenerate(row.orderId)}
                        className="rounded bg-[#0B2C66] px-2 py-1 text-xs font-semibold text-white hover:bg-[#0a2559]"
                      >Generate Invoice</button>
                    ) : (
                      <span className="text-xs text-slate-400">Waiting for delivery</span>
                    )}
                  </td>
                </tr>
              ))}
              {mergedAwaitingOrders.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">No orders awaiting invoice</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recently Generated Invoices */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">Recently Generated Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-2">Invoice #</th>
                <th className="px-4 py-2">Order ID</th>
                <th className="px-4 py-2">Branch</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2">Payment Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv.invoiceNumber} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs font-semibold text-[#0A3A92]">{inv.invoiceNumber}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{inv.orderId}</td>
                  <td className="px-4 py-2">{inv.branch}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs">{inv.invoiceDate}</td>
                  <td className="px-4 py-2 text-right font-semibold">{fmt(inv.amount)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentBadge(inv.paymentStatus)}`}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const rec = getInvoices().find(r => r.invoiceNumber === inv.invoiceNumber);
                        if (rec) setPreviewEntry(rec);
                      }}
                      className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                    >View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}

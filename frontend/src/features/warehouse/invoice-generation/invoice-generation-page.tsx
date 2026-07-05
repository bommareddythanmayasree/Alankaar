import { useState, useEffect, useCallback } from "react";
import {
  FileText, CheckCircle2, Package, X, Clock, AlertCircle, Layers,
  RefreshCw, TrendingUp, ChevronRight, Banknote,
} from "lucide-react";
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
  type OrderReadyForInvoice,
  type InvoiceRecord,
} from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

function fmt(v: number) { return formatCurrency(v); }

const AWAITING_ORDERS = [
  { orderId: "ORD-78162", branch: "Koramangala Branch",  totalBatches: 3, deliveredBatches: 2, remainingBatches: 1, expectedStatus: "Waiting for Evening Dispatch" },
  { orderId: "ORD-78155", branch: "Indiranagar Branch",  totalBatches: 2, deliveredBatches: 1, remainingBatches: 1, expectedStatus: "Waiting for Afternoon Dispatch" },
  { orderId: "ORD-78148", branch: "Jayanagar Branch",    totalBatches: 4, deliveredBatches: 3, remainingBatches: 1, expectedStatus: "Waiting for Final Batch" },
];

const MOCK_INVOICES = [
  { invoiceNumber: "INV-2026-0041", orderId: "ORD-78140", branch: "MG Road Branch",     invoiceDate: "05 Jul 2026", amount: 18450, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0040", orderId: "ORD-78133", branch: "Koramangala Branch", invoiceDate: "04 Jul 2026", amount: 12870, paymentStatus: "Payment Pending"   },
  { invoiceNumber: "INV-2026-0039", orderId: "ORD-78121", branch: "Whitefield Branch",  invoiceDate: "03 Jul 2026", amount: 22310, paymentStatus: "Payment Completed" },
  { invoiceNumber: "INV-2026-0038", orderId: "ORD-78115", branch: "Indiranagar Branch", invoiceDate: "02 Jul 2026", amount: 9680,  paymentStatus: "Invoice Generated" },
  { invoiceNumber: "INV-2026-0037", orderId: "ORD-78108", branch: "Jayanagar Branch",   invoiceDate: "01 Jul 2026", amount: 15200, paymentStatus: "Payment Completed" },
];

const REVENUE = { today: 48750, weekly: 231300, monthly: 892400 };

const WORKFLOW_STEPS = ["Order Created","Production","Dispatch","Delivery Confirmation","Invoice Generated","Collections"];

function paymentBadge(status: string) {
  if (status === "Paid" || status === "Payment Completed" || status === "Order Closed") return "bg-emerald-100 text-emerald-700";
  if (status === "Overdue") return "bg-red-100 text-red-700";
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
            {batchCount != null && batchCount > 0 && <span className="ml-2 text-sm text-slate-500">— {batchCount} batch{batchCount !== 1 ? "es" : ""}</span>}
          </h3>
          <button onClick={onClose} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"><X className="h-4 w-4" /></button>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="mb-4 flex items-start justify-between">
            <div><p className="text-2xl font-bold text-[#0A3A92]">ALANKAR</p><p className="text-sm text-slate-600">Warehouse Invoice</p></div>
            <div className="text-right text-sm space-y-0.5">
              <p><span className="font-semibold">Invoice:</span> {invoiceNumber ?? "DRAFT"}</p>
              <p><span className="font-semibold">Order ID:</span> {orderId}</p>
              <p><span className="font-semibold">Branch:</span> {branch}</p>
              <p><span className="font-semibold">Delivered:</span> {deliveredDate ?? "—"}</p>
            </div>
          </div>
          <div className="mb-3 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2 text-xs text-sky-700">
            Invoice calculated on actual delivered quantities across all batches. Undelivered quantities are not billed.
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
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-semibold text-slate-800">{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-slate-500"><span>Tax (5%)</span><span>{fmt(tax)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-[#0A3A92]"><span>Total Payable</span><span>{fmt(total)}</span></div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {isPending && onGenerate && (
            <button onClick={() => { onGenerate(); onClose(); }} className="rounded-md bg-[#0B2C66] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a2559]">
              Generate Invoice
            </button>
          )}
          <button onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50">Close</button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { CreditCard, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_INVOICE_DATA } from "../../../shared/data/warehouse-mock-data";
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

/** Normalised shape used in this page (static + dynamic share the same fields) */
type InvoiceRow = {
  invoiceNumber: string;
  orderId?: string;
  branch: string;
  gstPercent: number;
  issuedDate: string;
  items: { product: string; quantity: number; price: number }[];
  paymentStatus?: "Pending" | "Completed";
};

export function InvoiceGenerationPage() {
  const { invoices: dynamicInvoices, orders, markPaymentComplete } = useWarehouse();

  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  // Merge dynamic invoices (created on order approval) with static mock data
  const allInvoices = useMemo<InvoiceRow[]>(() => {
    const dynamic: InvoiceRow[] = dynamicInvoices.map((inv) => {
      // Look up payment status from the matching order
      const order = orders.find((o) => o.id === inv.orderId);
      return {
        invoiceNumber: inv.invoiceNumber,
        orderId: inv.orderId,
        branch: inv.branch,
        gstPercent: inv.gstPercent,
        issuedDate: inv.issuedDate,
        items: inv.items,
        paymentStatus: order?.paymentStatus ?? "Pending",
      };
    });
    const staticRows: InvoiceRow[] = WAREHOUSE_INVOICE_DATA.map((inv) => ({
      invoiceNumber: inv.invoiceNumber,
      branch: inv.branch,
      gstPercent: inv.gstPercent,
      issuedDate: inv.issuedDate,
      items: inv.items,
      paymentStatus: undefined, // static/seed invoices have no live payment state
    }));
    return [...dynamic, ...staticRows];
  }, [dynamicInvoices, orders]);

  const effectiveNo = selectedInvoiceNo ?? allInvoices[0]?.invoiceNumber;
  const selected = allInvoices.find((inv) => inv.invoiceNumber === effectiveNo) ?? allInvoices[0];

  const subtotal = useMemo(
    () => selected?.items.reduce((sum, item) => sum + item.quantity * item.price, 0) ?? 0,
    [selected]
  );
  const gstAmount = Math.round((subtotal * (selected?.gstPercent ?? 5)) / 100);
  const totalAmount = subtotal + gstAmount;

  const canPay = selected?.paymentStatus === "Pending" && !!selected?.orderId;

  const handlePay = async () => {
    if (!selected?.orderId) return;
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1000));
    markPaymentComplete(selected.orderId);
    setPaying(false);
  };

  const onDownloadPdf = () => {
    if (!selected) return;
    const rows = selected.items
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.product} | Qty: ${item.quantity} | Price: Rs.${item.price} | Total: Rs.${item.quantity * item.price}`
      )
      .join("\n");
    const text =
      `ALANKAR ERP - INVOICE\n\n` +
      `Invoice Number: ${selected.invoiceNumber}\n` +
      (selected.orderId ? `Order ID: ${selected.orderId}\n` : "") +
      `Branch: ${selected.branch}\n` +
      `Issued Date: ${selected.issuedDate}\n` +
      `Payment Status: ${selected.paymentStatus ?? "N/A"}\n\n` +
      `Items:\n${rows}\n\n` +
      `Subtotal: Rs.${subtotal}\n` +
      `GST (${selected.gstPercent}%): Rs.${gstAmount}\n` +
      `Total Amount: Rs.${totalAmount}\n`;
    const blob = new Blob([text], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selected.invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <ErpLayout
      title="Invoice Generation"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Invoice Generation")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ── Left panel ── */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Select Invoice</h3>
          <select
            value={effectiveNo ?? ""}
            onChange={(e) => setSelectedInvoiceNo(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            {allInvoices.map((inv) => (
              <option key={inv.invoiceNumber} value={inv.invoiceNumber}>
                {inv.invoiceNumber} — {inv.branch}
              </option>
            ))}
          </select>

          {selected && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-[#F8FAFD] p-3 text-sm space-y-1">
              <p><span className="font-semibold">Invoice:</span> {selected.invoiceNumber}</p>
              {selected.orderId && (
                <p><span className="font-semibold">Order ID:</span> {selected.orderId}</p>
              )}
              <p><span className="font-semibold">Branch:</span> {selected.branch}</p>
              <p><span className="font-semibold">Date:</span> {selected.issuedDate}</p>
              {selected.paymentStatus && (
                <p>
                  <span className="font-semibold">Payment: </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      selected.paymentStatus === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {selected.paymentStatus === "Completed" ? "Paid" : "Pending"}
                  </span>
                </p>
              )}
            </div>
          )}

          <div className="mt-5 space-y-2">
            <button
              onClick={() => setPreviewOpen(true)}
              className="h-10 w-full rounded-md border border-[#0A3A92] bg-white text-sm font-semibold text-[#0A3A92] hover:bg-[#EEF4FF]"
            >
              Preview Invoice
            </button>
            <button
              onClick={onDownloadPdf}
              className="h-10 w-full rounded-md bg-[#0A3A92] text-sm font-semibold text-white hover:bg-[#083173]"
            >
              Download PDF
            </button>
          </div>
        </section>

        {/* ── Right panel: invoice details ── */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Invoice Details</h3>
            {selected?.paymentStatus && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selected.paymentStatus === "Completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {selected.paymentStatus === "Completed" ? "Paid" : "Payment Pending"}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Unit Price</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected?.items.map((item) => (
                  <tr key={item.product} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium">{item.product}</td>
                    <td className="px-3 py-3">{item.quantity}</td>
                    <td className="px-3 py-3">&#8377;{new Intl.NumberFormat("en-IN").format(item.price)}</td>
                    <td className="px-3 py-3">&#8377;{new Intl.NumberFormat("en-IN").format(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 ml-auto w-full max-w-[320px] space-y-2 rounded-lg border border-slate-200 bg-[#F8FAFD] p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">&#8377;{new Intl.NumberFormat("en-IN").format(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">GST ({selected?.gstPercent ?? 5}%)</span>
              <span className="font-semibold">&#8377;{new Intl.NumberFormat("en-IN").format(gstAmount)}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total Amount</span>
              <span className="text-lg font-bold text-[#0A3A92]">
                &#8377;{new Intl.NumberFormat("en-IN").format(totalAmount)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Preview modal ── */}
      {previewOpen && selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[820px] rounded-xl border border-slate-200 bg-white p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#0A3A92]">ALANKAR ERP</p>
                  <p className="text-sm text-slate-600">Warehouse Invoice</p>
                </div>
                <div className="text-right text-sm space-y-0.5">
                  <p><span className="font-semibold">Invoice:</span> {selected.invoiceNumber}</p>
                  {selected.orderId && (
                    <p><span className="font-semibold">Order ID:</span> {selected.orderId}</p>
                  )}
                  <p><span className="font-semibold">Branch:</span> {selected.branch}</p>
                  <p><span className="font-semibold">Date:</span> {selected.issuedDate}</p>
                  {selected.paymentStatus && (
                    <p>
                      <span className="font-semibold">Payment:</span>{" "}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          selected.paymentStatus === "Completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selected.paymentStatus === "Completed" ? "Paid" : "Pending"}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Items table */}
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFD] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Unit Price</th>
                    <th className="px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((item) => (
                    <tr key={item.product} className="border-t border-slate-100">
                      <td className="px-2 py-2">{item.product}</td>
                      <td className="px-2 py-2">{item.quantity}</td>
                      <td className="px-2 py-2">&#8377;{item.price}</td>
                      <td className="px-2 py-2">&#8377;{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 ml-auto max-w-[260px] text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({selected.gstPercent}%)</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(gstAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-[#0A3A92]">
                  <span>Total Amount</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPreviewOpen(false)}
                className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => { setPreviewOpen(false); onDownloadPdf(); }}
                className="h-10 rounded-md border border-[#0A3A92] px-4 text-sm font-semibold text-[#0A3A92] hover:bg-[#EEF4FF]"
              >
                Download PDF
              </button>
              {canPay && (
                <button
                  onClick={() => { setPreviewOpen(false); handlePay(); }}
                  disabled={paying}
                  className="flex h-10 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <CreditCard className="h-4 w-4" />
                  Pay Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

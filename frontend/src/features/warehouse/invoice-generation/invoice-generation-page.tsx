import { useMemo, useState } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_INVOICE_DATA } from "../../../shared/data/warehouse-mock-data";

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

export function InvoiceGenerationPage() {
  const [selectedInvoiceNo, setSelectedInvoiceNo] = useState(WAREHOUSE_INVOICE_DATA[0].invoiceNumber);
  const [previewOpen, setPreviewOpen] = useState(false);

  const selectedInvoice = WAREHOUSE_INVOICE_DATA.find((inv) => inv.invoiceNumber === selectedInvoiceNo) ?? WAREHOUSE_INVOICE_DATA[0];

  const subtotal = useMemo(
    () => selectedInvoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [selectedInvoice]
  );
  const gstAmount = Math.round((subtotal * selectedInvoice.gstPercent) / 100);
  const totalAmount = subtotal + gstAmount;

  const onDownloadMockPdf = () => {
    const rows = selectedInvoice.items
      .map((item, idx) => `${idx + 1}. ${item.product} | Qty: ${item.quantity} | Price: Rs.${item.price} | Total: Rs.${item.quantity * item.price}`)
      .join("\n");
    const text = `ALANKAR ERP - INVOICE\n\nInvoice Number: ${selectedInvoice.invoiceNumber}\nBranch: ${selectedInvoice.branch}\nIssued Date: ${selectedInvoice.issuedDate}\n\nItems:\n${rows}\n\nSubtotal: Rs.${subtotal}\nGST (${selectedInvoice.gstPercent}%): Rs.${gstAmount}\nTotal Amount: Rs.${totalAmount}\n`;
    const blob = new Blob([text], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedInvoice.invoiceNumber}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <ErpLayout
      title="Invoice Generation"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Invoice Generation")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-lg font-semibold">Select Invoice</h3>
          <select
            value={selectedInvoiceNo}
            onChange={(e) => setSelectedInvoiceNo(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            {WAREHOUSE_INVOICE_DATA.map((inv) => (
              <option key={inv.invoiceNumber} value={inv.invoiceNumber}>
                {inv.invoiceNumber} - {inv.branch}
              </option>
            ))}
          </select>

          <div className="mt-4 rounded-lg border border-slate-200 bg-[#F8FAFD] p-3 text-sm">
            <p><span className="font-semibold">Invoice:</span> {selectedInvoice.invoiceNumber}</p>
            <p><span className="font-semibold">Branch:</span> {selectedInvoice.branch}</p>
            <p><span className="font-semibold">Date:</span> {selectedInvoice.issuedDate}</p>
          </div>

          <div className="mt-5 space-y-2">
            <button onClick={() => setPreviewOpen(true)} className="h-10 w-full rounded-md border border-[#0A3A92] bg-white text-sm font-semibold text-[#0A3A92]">
              Preview Invoice
            </button>
            <button onClick={onDownloadMockPdf} className="h-10 w-full rounded-md bg-[#0A3A92] text-sm font-semibold text-white">
              Download PDF
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-lg font-semibold">Invoice Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Products</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.items.map((item) => (
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
              <span className="text-slate-600">GST ({selectedInvoice.gstPercent}%)</span>
              <span className="font-semibold">&#8377;{new Intl.NumberFormat("en-IN").format(gstAmount)}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total Amount</span>
              <span className="text-lg font-bold text-[#0A3A92]">&#8377;{new Intl.NumberFormat("en-IN").format(totalAmount)}</span>
            </div>
          </div>
        </section>
      </div>

      {previewOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[820px] rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button onClick={() => setPreviewOpen(false)} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold">Close</button>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#0A3A92]">ALANKAR ERP</p>
                  <p className="text-sm text-slate-600">Warehouse Invoice</p>
                </div>
                <div className="text-right text-sm">
                  <p><span className="font-semibold">Invoice:</span> {selectedInvoice.invoiceNumber}</p>
                  <p><span className="font-semibold">Branch:</span> {selectedInvoice.branch}</p>
                  <p><span className="font-semibold">Date:</span> {selectedInvoice.issuedDate}</p>
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFD] text-slate-500">
                  <tr>
                    <th className="px-2 py-2">Products</th>
                    <th className="px-2 py-2">Quantity</th>
                    <th className="px-2 py-2">Price</th>
                    <th className="px-2 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.product} className="border-t border-slate-100">
                      <td className="px-2 py-2">{item.product}</td>
                      <td className="px-2 py-2">{item.quantity}</td>
                      <td className="px-2 py-2">&#8377;{item.price}</td>
                      <td className="px-2 py-2">&#8377;{item.quantity * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto max-w-[260px] text-sm">
                <p className="flex justify-between"><span>Subtotal</span><span>&#8377;{new Intl.NumberFormat("en-IN").format(subtotal)}</span></p>
                <p className="flex justify-between"><span>GST ({selectedInvoice.gstPercent}%)</span><span>&#8377;{new Intl.NumberFormat("en-IN").format(gstAmount)}</span></p>
                <p className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-bold text-[#0A3A92]">
                  <span>Total Amount</span>
                  <span>&#8377;{new Intl.NumberFormat("en-IN").format(totalAmount)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ErpLayout>
  );
}

part2 = r'''
// Inline Batch Delivery Confirmation
// Products come exclusively from batch.products -- never from order.items.
function BatchDeliveryConfirmSection({
  batch,
  onConfirm,
}: {
  batch: DispatchBatch;
  onConfirm: (lines: ProductDeliveryLine[]) => void;
}) {
  const [lines, setLines] = useState<ProductDeliveryLine[]>(
    batch.products.map(p => ({
      product: p.product,
      unit: p.unit,
      orderedQty: p.qty,
      loadedQty: p.qty,
      deliveredQty: p.qty,
      pendingQty: 0,
      status: "Delivered" as ProductDeliveryStatus,
      reason: "",
    }))
  );

  function updateLine(idx: number, deliveredQty: number) {
    setLines(prev => {
      const next = [...prev];
      const updated = { ...next[idx] };
      updated.deliveredQty = Math.max(0, Math.min(deliveredQty, updated.loadedQty));
      updated.pendingQty = Math.max(0, updated.loadedQty - updated.deliveredQty);
      updated.status = deriveProductStatus(updated.loadedQty, updated.deliveredQty);
      if (updated.status === "Delivered") updated.reason = "";
      next[idx] = updated;
      return next;
    });
  }

  function updateReason(idx: number, reason: string) {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], reason };
      return next;
    });
  }

  const canConfirm = lines.every(l => l.pendingQty === 0 || l.reason.trim() !== "");

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-slate-500">
        Enter actual delivered quantities. Ordered and Loaded are read-only. Pending is
        auto-calculated. A reason is required when Pending &gt; 0.
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Product</th>
              <th className="px-3 py-2.5 text-right font-semibold">Ordered</th>
              <th className="px-3 py-2.5 text-right font-semibold">Loaded</th>
              <th className="px-3 py-2.5 text-right font-semibold">Delivered</th>
              <th className="px-3 py-2.5 text-right font-semibold">Pending</th>
              <th className="px-3 py-2.5 text-center font-semibold">Status</th>
              <th className="px-3 py-2.5 text-left font-semibold">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={line.product} className={line.pendingQty > 0 ? "bg-amber-50/40" : "bg-white"}>
                <td className="px-3 py-2.5 font-medium text-slate-800">{line.product}</td>
                <td className="px-3 py-2.5 text-right text-slate-500">{line.orderedQty} {line.unit}</td>
                <td className="px-3 py-2.5 text-right text-slate-500">{line.loadedQty} {line.unit}</td>
                <td className="px-3 py-2.5 text-right">
                  <input
                    type="number"
                    min={0}
                    max={line.loadedQty}
                    value={line.deliveredQty}
                    onChange={e => updateLine(idx, Number(e.target.value))}
                    className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-[#0A3A92] focus:ring-1 focus:ring-[#0A3A92]/20"
                  />
                  <span className="ml-1 text-xs text-slate-400">{line.unit}</span>
                </td>
                <td className={`px-3 py-2.5 text-right font-semibold text-xs ${line.pendingQty > 0 ? "text-red-500" : "text-slate-300"}`}>
                  {line.pendingQty > 0 ? `${line.pendingQty} ${line.unit}` : "\u2014"}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${productStatusBadge(line.status)}`}>
                    {line.status}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  {line.pendingQty > 0 ? (
                    <select
                      value={line.reason}
                      onChange={e => updateReason(idx, e.target.value)}
                      className={`w-full rounded-md border px-2 py-1 text-xs outline-none focus:border-[#0A3A92] ${!line.reason ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}
                    >
                      <option value="">Select reason...</option>
                      {LOGISTICS_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  ) : (
                    <span className="text-xs text-slate-300">\u2014</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!canConfirm && (
        <p className="text-xs text-amber-600">Select a reason for every product with pending quantity before confirming.</p>
      )}
      <button
        onClick={() => onConfirm(lines)}
        disabled={!canConfirm}
        className="rounded-lg bg-[#0B2C66] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a2559] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm Delivery
      </button>
    </div>
  );
}
'''

with open('frontend/src/features/warehouse/delivery-tracking/delivery-tracking-page.tsx', 'a', encoding='utf-8') as f:
    f.write(part2)

print("Part 2 done")

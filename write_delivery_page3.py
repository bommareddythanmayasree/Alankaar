part3 = r'''
// Order Batch Row -- sequential confirmation enforced
function OrderBatchRow({
  order,
  batches,
  onAdvanceBatch,
  onConfirmBatch,
}: {
  order: WorkflowOrderLive;
  batches: DispatchBatch[];
  onAdvanceBatch: (batchId: string, current: DispatchBatch["status"]) => void;
  onConfirmBatch: (batch: DispatchBatch, lines: ProductDeliveryLine[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [confirmingBatchId, setConfirmingBatchId] = useState<string | null>(null);

  const sorted = [...batches].sort((a, b) => a.batchNumber - b.batchNumber);
  const allDelivered = sorted.length > 0 && sorted.every(b => b.status === "Delivered");
  const anyInTransit = sorted.some(b => b.status === "In Transit");
  const activeBatch = sorted.find(b => b.status !== "Delivered") ?? null;

  return (
    <div className="border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 px-5 py-3 flex-wrap">
        <button onClick={() => setExpanded(v => !v)} className="flex items-center gap-1 text-slate-400 hover:text-slate-600">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <span className="font-mono text-sm font-bold text-[#1B4DB1]">{order.id}</span>
        <span className="text-sm text-slate-700">{order.branch}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
          allDelivered ? "bg-emerald-100 text-emerald-700"
          : anyInTransit ? "bg-sky-100 text-sky-700"
          : "bg-amber-100 text-amber-700"
        }`}>
          {allDelivered ? "All Delivered" : anyInTransit ? "In Transit" : "Scheduled"}
        </span>
        <span className="text-xs text-slate-400">{sorted.length} batch{sorted.length !== 1 ? "es" : ""}</span>
        <span className="ml-auto text-sm font-semibold text-slate-800">{formatCurrency(order.value)}</span>
      </div>

      {expanded && (
        <div className="px-5 pb-4 space-y-3">
          {sorted.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No dispatch batches created yet for this order.</p>
          ) : (
            sorted.map(batch => {
              const isActive = activeBatch?.batchId === batch.batchId;
              const isConfirming = confirmingBatchId === batch.batchId;

              if (!isActive && batch.status === "Scheduled") {
                return (
                  <div key={batch.batchId} className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-400 text-sm">Batch {batch.batchNumber}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${slotBadge(batch.slot)}`}>
                        {batch.slot} Dispatch
                      </span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-400">
                        Waiting for Next Dispatch
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      This batch will become available after Batch {batch.batchNumber - 1} is confirmed and the warehouse dispatches it.
                    </p>
                  </div>
                );
              }

              return (
                <div key={batch.batchId} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-700 text-sm">Batch {batch.batchNumber}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${slotBadge(batch.slot)}`}>
                        {batch.slot} Dispatch
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${batchStatusBadge(batch.status)}`}>
                        {batch.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isActive && batch.status === "Scheduled" && (
                        <button onClick={() => onAdvanceBatch(batch.batchId, batch.status)}
                          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors">
                          Mark In Transit
                        </button>
                      )}
                      {isActive && batch.status === "In Transit" && !isConfirming && (
                        <button onClick={() => setConfirmingBatchId(batch.batchId)}
                          className="rounded-md bg-[#0B2C66] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0a2559] transition-colors">
                          Confirm Delivery
                        </button>
                      )}
                      {isActive && batch.status === "In Transit" && isConfirming && (
                        <button onClick={() => setConfirmingBatchId(null)}
                          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          Cancel
                        </button>
                      )}
                      {batch.status === "Delivered" && (
                        <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />Delivered
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Delivery Status</p>
                      <p className={`font-semibold ${
                        batch.status === "Delivered" ? "text-emerald-700"
                        : batch.status === "In Transit" ? "text-sky-700"
                        : "text-amber-700"
                      }`}>{batch.status}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Delivery Confirmation</p>
                      <p className={`font-semibold ${batch.status === "Delivered" ? "text-emerald-700" : "text-slate-500"}`}>
                        {batch.status === "Delivered" ? "Confirmed" : "Waiting for Delivery Confirmation"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Representative</p>
                      <p className="font-semibold text-slate-800">{batch.driverName}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Vehicle</p>
                      <p className="font-semibold text-slate-800">{batch.vehicleNumber}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Dispatch Time</p>
                      <p className="font-semibold text-slate-800">{batch.dispatchTime || "\u2014"}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Dispatch Type</p>
                      <p className="font-semibold text-slate-800">{batch.slot} Dispatch</p>
                    </div>
                  </div>

                  {batch.status !== "Delivered" && (
                    <div>
                      <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Products in this batch</p>
                      <div className="flex flex-wrap gap-1.5">
                        {batch.products.map(p => (
                          <span key={p.product} className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            <Package className="h-3 w-3 text-slate-400" />{p.product}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isActive && isConfirming && batch.status === "In Transit" && (
                    <BatchDeliveryConfirmSection
                      batch={batch}
                      onConfirm={lines => {
                        setConfirmingBatchId(null);
                        onConfirmBatch(batch, lines);
                      }}
                    />
                  )}

                  {batch.status === "Delivered" && batch.deliveryLines && batch.deliveryLines.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-emerald-200">
                      <table className="w-full text-xs">
                        <thead className="bg-emerald-50 text-[10px] uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-3 py-2 text-left">Product</th>
                            <th className="px-3 py-2 text-right">Ordered</th>
                            <th className="px-3 py-2 text-right">Delivered</th>
                            <th className="px-3 py-2 text-right">Pending</th>
                            <th className="px-3 py-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100">
                          {batch.deliveryLines.map(l => (
                            <tr key={l.product} className="bg-white hover:bg-emerald-50/30">
                              <td className="px-3 py-2 font-medium text-slate-800">{l.product}</td>
                              <td className="px-3 py-2 text-right text-slate-500">{l.orderedQty} {l.unit}</td>
                              <td className={`px-3 py-2 text-right font-semibold ${l.deliveredQty < l.orderedQty ? "text-amber-600" : "text-emerald-600"}`}>
                                {l.deliveredQty} {l.unit}
                              </td>
                              <td className={`px-3 py-2 text-right ${l.pendingQty > 0 ? "text-red-500 font-semibold" : "text-slate-300"}`}>
                                {l.pendingQty > 0 ? `${l.pendingQty} ${l.unit}` : "\u2014"}
                              </td>
                              <td className="px-3 py-2 text-slate-500">{l.reason || "\u2014"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {batch.status === "Delivered" && (() => {
                    const nextBatch = sorted.find(b => b.batchNumber === batch.batchNumber + 1);
                    if (!nextBatch || nextBatch.status !== "Scheduled") return null;
                    return (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs text-sky-700 font-medium">
                        Dispatch Next Batch \u2014 Waiting for warehouse to dispatch Batch {nextBatch.batchNumber} ({nextBatch.slot} Dispatch)
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
'''

with open('frontend/src/features/warehouse/delivery-tracking/delivery-tracking-page.tsx', 'a', encoding='utf-8') as f:
    f.write(part3)

print("Part 3 done")

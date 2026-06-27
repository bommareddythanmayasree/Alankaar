/**
 * REVIEW ORDER — Branch Portal
 * Rebranded from "Shopping Cart".
 * Displays the pending order with quantities and priorities before submitting to warehouse.
 * Route: /branch/shopping-cart (unchanged)
 */
import { useMemo, useState } from "react";
import { Zap, Trash2, ClipboardList, ChevronRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import { useCart } from "../../../app/branch/branch-context";
import { getProductUnit } from "../../../shared/utils/product-units";

type Priority = "Normal" | "Urgent";

export function ShoppingCartPage() {
  const navigate = useNavigate();
  const { cartItems, removeItem } = useCart();

  const [priorities, setPriorities] = useState<Record<string, Priority>>({});

  const totalProducts = cartItems.length;
  const totalQty = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const estimatedValue = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems]);
  const urgentItems = cartItems.filter(i => (priorities[i.id] ?? "Normal") === "Urgent");

  function togglePriority(id: string) {
    setPriorities(prev => ({
      ...prev,
      [id]: (prev[id] ?? "Normal") === "Normal" ? "Urgent" : "Normal",
    }));
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Shopping Cart")}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Review Order</h2>
          <p className="mt-1 text-slate-500">Confirm products and set priorities before submitting to warehouse.</p>
        </div>
        <button onClick={() => navigate("/branch/product-catalog")}
          className="text-sm font-semibold text-[#0B2C66] hover:underline">
          ← Back to Place Order
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">No items in your order.</p>
          <button onClick={() => navigate("/branch/product-catalog")}
            className="mt-4 rounded-xl bg-[#0B2C66] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#092757]">
            Go to Place Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Order table */}
          <section className="xl:col-span-8">
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-800">Order Items — {totalProducts} Products</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Product</th>
                      <th className="px-5 py-3 text-right">Qty</th>
                      <th className="px-5 py-3 text-center">Priority</th>
                      <th className="px-5 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.map(item => {
                      const priority = priorities[item.id] ?? "Normal";
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50 ${priority === "Urgent" ? "bg-red-50/40" : ""}`}>
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-800">{item.name}</div>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-slate-700">{item.quantity} {getProductUnit(item.name)}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => togglePriority(item.id)}
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                                priority === "Urgent"
                                  ? "border-red-300 bg-red-100 text-red-700"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-[#0B2C66] hover:text-[#0B2C66]"
                              }`}>
                              {priority === "Urgent" && <Zap className="h-3 w-3" />}
                              {priority}
                            </button>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => removeItem(item.id)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Urgent summary */}
            {urgentItems.length > 0 && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700 text-sm">Urgent Items ({urgentItems.length})</span>
                </div>
                <p className="text-xs text-red-600">These will be flagged for priority production and dispatch at warehouse.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {urgentItems.map(i => (
                    <span key={i.id} className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      {i.name} × {i.quantity} {getProductUnit(i.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </section>

          {/* Summary sidebar */}
          <aside className="xl:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-800">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Products</span>
                  <span className="font-semibold">{totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Quantity</span>
                  <span className="font-semibold">{totalQty} units</span>
                </div>
                {urgentItems.length > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Urgent Items</span>
                    <span className="font-semibold">{urgentItems.length}</span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-3 flex justify-between">
                  <span className="text-slate-500">Est. Order Value</span>
                  <span className="text-lg font-bold text-[#0B2C66]">₹{estimatedValue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="inline h-3.5 w-3.5 mr-1" />
                Final value depends on warehouse approval and delivery.
              </div>

              <button onClick={() => {
                sessionStorage.setItem("orderPriorities", JSON.stringify(priorities));
                navigate("/branch/checkout");
              }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C66] py-3 text-sm font-semibold text-white hover:bg-[#092757]">
                Proceed to Submit Order <ChevronRight className="h-4 w-4" />
              </button>
              <button onClick={() => navigate("/branch/product-catalog")}
                className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                ← Modify Order
              </button>
            </div>
          </aside>
        </div>
      )}
    </ErpLayout>
  );
}



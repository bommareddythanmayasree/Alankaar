import { useMemo } from "react";
import { Minus, Plus, ShieldCheck, Truck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { useCart } from "../../../app/branch/branch-context";

const SIDEBAR_LABELS = [
  "Dashboard",
  "Employee Management",
  "Product Catalog",
  "Shopping Cart",
  "Checkout",
  "Order Tracking",
  "Order History",
  "Notifications",
  "Settings",
] as const;

const GST_PERCENT = 5;

export function ShoppingCartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQty, removeItem } = useCart();

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const gstAmount = useMemo(() => Number(((subtotal * GST_PERCENT) / 100).toFixed(2)), [subtotal]);
  const grandTotal = useMemo(() => Number((subtotal + gstAmount).toFixed(2)), [subtotal, gstAmount]);
  const totalItems = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  return (
    <ErpLayout
      title="Shopping Cart"
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Shopping Cart")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xl font-semibold">Your Cart <span className="text-slate-500 text-base">({cartItems.length} Products)</span></h3>
            <button onClick={() => navigate("/branch/product-catalog")} className="text-sm font-semibold text-[#0A3A92]">
              &larr; Continue Shopping
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Quantity</th>
                  <th className="px-3 py-3">Subtotal</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="h-14 w-20 rounded-md object-cover" />
                        <span className="font-semibold text-slate-900">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">&#8377;{item.price.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center rounded-md border border-slate-200">
                        <button onClick={() => updateQty(item.id, -1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="grid h-8 w-8 place-items-center text-slate-600 hover:bg-slate-50">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold">&#8377;{(item.price * item.quantity).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <button onClick={() => removeItem(item.id)} className="rounded p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {cartItems.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-slate-500">Your cart is empty. Add products from the catalog.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-[#F8FAFD] p-4">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#0A3A92]" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <ShieldCheck className="h-4 w-4 text-[#0A3A92]" />
              <span>100% Verified</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Truck className="h-4 w-4 text-[#0A3A92]" />
              <span>Fast Delivery</span>
            </div>
          </div>
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-4">
          <h3 className="text-xl font-semibold text-slate-900">Order Summary</h3>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Items</span>
              <span className="font-semibold">{totalItems}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold">&#8377;{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">GST ({GST_PERCENT}%)</span>
              <span className="font-semibold">&#8377;{gstAmount.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-slate-800">Grand Total</span>
              <span className="text-3xl font-bold text-[#0A3A92]">&#8377;{grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/branch/checkout")}
            disabled={cartItems.length === 0}
            className="mt-6 h-11 w-full rounded-md bg-[#0A3A92] text-sm font-semibold text-white hover:bg-[#083173] disabled:opacity-50"
          >
            Proceed to Checkout
          </button>
          <p className="mt-3 text-xs text-slate-500">You will receive email confirmation once your order is placed.</p>
        </aside>
      </div>
    </ErpLayout>
  );
}

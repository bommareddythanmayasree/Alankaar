import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { useCart, useOrders } from "../../../app/branch/branch-context";

type PaymentMethod = "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Bank Transfer";

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

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [isPaying, setIsPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const gstAmount = useMemo(() => Number(((subtotal * GST_PERCENT) / 100).toFixed(2)), [subtotal]);
  const totalAmount = useMemo(() => Number((subtotal + gstAmount).toFixed(2)), [subtotal, gstAmount]);
  const totalQty = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return;
    setIsPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const order = placeOrder(cartItems);
    clearCart();
    setOrderId(order.orderId);
    setIsPaying(false);
  };

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Checkout")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-xl font-semibold">Order Summary</h3>
          {cartItems.length === 0 && !orderId ? (
            <p className="py-6 text-center text-slate-500">Your cart is empty. <button onClick={() => navigate("/branch/product-catalog")} className="text-[#0A3A92] font-semibold">Go to catalog</button></p>
          ) : (
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
                  {(orderId ? [] : cartItems).map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium">{item.name}</td>
                      <td className="px-3 py-3">{item.quantity}</td>
                      <td className="px-3 py-3">&#8377;{item.price.toFixed(2)}</td>
                      <td className="px-3 py-3">&#8377;{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!orderId && (
            <div className="mt-5 rounded-lg border border-slate-200 bg-[#F8FAFD] p-4">
              <h4 className="mb-3 text-base font-semibold">Select Payment Method</h4>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(["UPI", "Credit Card", "Debit Card", "Net Banking", "Bank Transfer"] as PaymentMethod[]).map((pm) => (
                  <button key={pm} onClick={() => setMethod(pm)}
                    className={`h-10 rounded-md border px-3 text-sm font-semibold ${method === pm ? "border-[#0A3A92] bg-[#EEF4FF] text-[#0A3A92]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {pm}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-4">
          <h3 className="text-xl font-semibold">Payment Summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Items</span>
              <span className="font-semibold">{totalQty}</span>
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
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Total Amount</span>
              <span className="text-3xl font-bold text-[#0A3A92]">&#8377;{totalAmount.toFixed(2)}</span>
            </div>
            {!orderId && (
              <div className="rounded-md bg-[#F8FAFD] px-3 py-2 text-xs text-slate-600">
                Method: <span className="font-semibold text-slate-800">{method}</span>
              </div>
            )}
          </div>
          {!orderId ? (
            <button
              onClick={handlePlaceOrder}
              disabled={isPaying || cartItems.length === 0}
              className="mt-5 h-11 w-full rounded-md bg-[#0A3A92] text-sm font-semibold text-white disabled:opacity-60 hover:bg-[#083173]"
            >
              {isPaying ? "Processing..." : "Place Order"}
            </button>
          ) : (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold">Order Placed Successfully</p>
              </div>
              <p className="text-sm text-slate-700"><span className="font-semibold">Order ID:</span> {orderId}</p>
              <div className="mt-3 flex flex-col gap-2">
                <button onClick={() => navigate("/branch/order-tracking")} className="h-9 w-full rounded-md bg-[#0A3A92] text-xs font-semibold text-white hover:bg-[#083173]">
                  Track Order
                </button>
                <button onClick={() => navigate("/branch/order-history")} className="h-9 w-full rounded-md border border-[#0A3A92] text-xs font-semibold text-[#0A3A92] hover:bg-[#EEF4FF]">
                  View Order History
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </ErpLayout>
  );
}

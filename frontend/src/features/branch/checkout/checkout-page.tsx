/**
 * SUBMIT ORDER — Branch Portal
 * Rebranded from "Checkout".
 * Shows final order summary, urgent items, lifecycle preview, then submits to warehouse.
 * Route: /branch/checkout (unchanged)
 */
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Zap, Package, Truck, CreditCard, PlayCircle, ClipboardList, ChevronRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import { useCart } from "../../../app/branch/branch-context";
import { placeOrder as demoPlaceOrder, getCurrentDemoBranchName, saveSubmittedOrder, saveWarehouseOrder, saveWorkflowOrder } from "../../../shared/lib/demo-store";
import { useWarehouseProducts } from "../../../app/warehouse/warehouse-context";
import { getProductUnit } from "../../../shared/utils/product-units";

const LIFECYCLE_STEPS = [
  { label: "Order Submitted",      icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Warehouse Review",     icon: <Package className="h-4 w-4" /> },
  { label: "Approved",             icon: <CheckCircle2 className="h-4 w-4" /> },
  { label: "Production Started",   icon: <PlayCircle className="h-4 w-4" /> },
  { label: "Ready For Dispatch",   icon: <Truck className="h-4 w-4" /> },
  { label: "Morning / Evening Dispatch", icon: <Truck className="h-4 w-4" /> },
  { label: "Delivered",            icon: <CheckCircle2 className="h-4 w-4" /> },
  { label: "Bill Generated",       icon: <CreditCard className="h-4 w-4" /> },
  { label: "Payment Pending",      icon: <Clock className="h-4 w-4" /> },
  { label: "Payment Completed",    icon: <CreditCard className="h-4 w-4" /> },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const warehouseProducts = useWarehouseProducts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const totalQty = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const estimatedValue = useMemo(() => cartItems.reduce((s, i) => s + i.price * i.quantity, 0), [cartItems]);

  // Items flagged urgent kept from cart (simplified: no direct priority state here)
  const urgentItems = cartItems.filter(i => i.quantity >= 10); // treat high-qty as urgent for demo

  async function handleSubmitOrder() {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const newOrderId = `ORD-${Math.floor(7000 + Math.random() * 1000)}`;
    const now = new Date();
    const orderDate = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const expectedDate = new Date(now);
    expectedDate.setDate(expectedDate.getDate() + 1);
    const expectedDelivery = expectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const currentBranch = getCurrentDemoBranchName();

    // Read slot and priorities saved from Review Order step
    const slotRaw = sessionStorage.getItem("orderSlot") ?? "Morning Dispatch";
    const dispatchSlot = (slotRaw === "Evening Dispatch" ? "Evening Dispatch" : "Morning Dispatch") as "Morning Dispatch" | "Evening Dispatch";
    const prioritiesRaw = sessionStorage.getItem("orderPriorities");
    const priorities: Record<string, "Normal" | "Urgent"> = prioritiesRaw ? JSON.parse(prioritiesRaw) : {};

    const demoItems = cartItems.map(i => {
      const stock = warehouseProducts?.find(s => s.productName.toLowerCase() === i.name.toLowerCase());
      return { name: i.name, requested: i.quantity, available: stock ? stock.currentStock : i.quantity };
    });

    demoPlaceOrder(newOrderId, currentBranch, demoItems, estimatedValue, "NEFT", orderDate, expectedDelivery);

    // Save to submitted orders for My Orders page
    saveSubmittedOrder({
      orderId: newOrderId,
      branch: currentBranch,
      timestamp: orderDate + " " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      dispatchSlot,
      status: "Warehouse Review",
      items: cartItems.map(i => ({
        name: i.name,
        qty: i.quantity,
        priority: priorities[i.id] ?? "Normal",
      })),
    });

    // Save to warehouseOrders for Warehouse Order Verification ↔ Branch My Orders sync
    const orderItems = cartItems.map(i => ({
      name: i.name,
      qty: i.quantity,
      priority: (priorities[i.id] ?? "Normal") as "Normal" | "Urgent",
    }));
    saveWarehouseOrder({
      orderId: newOrderId,
      branch: currentBranch,
      products: orderItems,
      quantity: cartItems.reduce((s, i) => s + i.quantity, 0),
      priority: orderItems.some(i => i.priority === "Urgent") ? "Urgent" : "Normal",
      dispatchSlot,
      status: "Under Review",
      createdAt: now.toISOString(),
      amount: estimatedValue,
    });

    // Save to workflowOrders so Orders Workflow page picks it up immediately
    saveWorkflowOrder({
      id: newOrderId,
      branch: currentBranch,
      date: orderDate,
      time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
      priority: orderItems.some(i => i.priority === "Urgent") ? "Urgent" : "Normal",
      value: estimatedValue,
      status: "Order Placed",
      items: cartItems.map(i => ({
        product: i.name,
        orderedQty: i.quantity,
        approvedQty: 0,
        rejectedQty: 0,
        unit: getProductUnit(i.name),
      })),
    });

    // Clear session data
    sessionStorage.removeItem("orderSlot");
    sessionStorage.removeItem("orderPriorities");

    clearCart();
    setOrderId(newOrderId);
    setIsSubmitting(false);
  }

  // Success screen
  if (orderId) {
    return (
      <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Checkout")}>
        <div className="mx-auto max-w-2xl">
          {/* Success banner */}
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-800">Order Submitted!</h2>
            <p className="mt-1 text-emerald-700">Your order has been sent to warehouse for review.</p>
            <div className="mt-3 inline-block rounded-xl bg-emerald-100 px-4 py-2">
              <span className="text-sm text-emerald-600">Order ID: </span>
              <span className="font-bold text-emerald-800 font-mono">{orderId}</span>
            </div>
          </div>

          {/* Status */}
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">Awaiting Warehouse Approval</p>
                <p className="text-sm text-amber-700 mt-0.5">Warehouse will review and approve your order. You'll see it in My Orders once it enters production.</p>
              </div>
            </div>
          </div>

          {/* Order lifecycle */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-slate-800">What happens next</h3>
            <div className="space-y-3">
              {LIFECYCLE_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    i === 0 ? "border-emerald-500 bg-emerald-500 text-white"
                    : i === 1 ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}>
                    {step.icon}
                  </div>
                  <span className={`text-sm ${i === 0 ? "font-bold text-emerald-700" : i === 1 ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                    {step.label}
                    {i === 0 && <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Done</span>}
                    {i === 1 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Current</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/branch/my-orders")}
              className="flex-1 rounded-xl bg-[#0B2C66] py-3 text-sm font-semibold text-white hover:bg-[#092757]">
              Track in My Orders →
            </button>
            <button onClick={() => navigate("/branch/product-catalog")}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Place Another Order
            </button>
          </div>
        </div>
      </ErpLayout>
    );
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Checkout")}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Submit Order</h2>
          <p className="mt-1 text-slate-500">Final review before submitting to warehouse for approval.</p>
        </div>
        <button onClick={() => navigate("/branch/shopping-cart")}
          className="text-sm font-semibold text-[#0B2C66] hover:underline">
          ← Back to Review Order
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center">
          <p className="text-slate-500">Nothing to submit.</p>
          <button onClick={() => navigate("/branch/product-catalog")}
            className="mt-4 rounded-xl bg-[#0B2C66] px-6 py-2.5 text-sm font-semibold text-white">
            Go to Place Order
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left: summary + products */}
          <section className="xl:col-span-8 space-y-4">
            {/* Products */}
            <div className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-semibold text-slate-800">Order Products</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left">Product</th>
                    <th className="px-5 py-3 text-right">Quantity</th>
                    <th className="px-5 py-3 text-right">Est. Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800">{item.name}</div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">{item.quantity} {getProductUnit(item.name)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-700">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Urgent items */}
            {urgentItems.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700 text-sm">Urgent Items — {urgentItems.length}</span>
                </div>
                <p className="text-xs text-red-600 mb-2">These will be prioritised in production and dispatch.</p>
                <div className="flex flex-wrap gap-2">
                  {urgentItems.map(i => (
                    <span key={i.id} className="rounded-full bg-red-100 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      <Zap className="inline h-3 w-3 mr-0.5" />{i.name} × {i.quantity} {getProductUnit(i.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Order lifecycle preview */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-800">Order Lifecycle</h3>
              <div className="flex items-center gap-0 overflow-x-auto pb-2">
                {LIFECYCLE_STEPS.map((step, i) => (
                  <div key={step.label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                        {step.icon}
                      </div>
                      <span className="mt-1.5 text-[10px] text-slate-400 text-center leading-tight whitespace-nowrap" style={{ maxWidth: 70 }}>
                        {step.label}
                      </span>
                    </div>
                    {i < LIFECYCLE_STEPS.length - 1 && (
                      <div className="mb-5 h-0.5 w-10 bg-slate-200 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right: submission panel */}
          <aside className="xl:col-span-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-slate-800">Submission Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Products</span>
                  <span className="font-semibold">{cartItems.length}</span>
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
                  <span className="text-xl font-bold text-[#0B2C66]">₹{estimatedValue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                <Star className="inline h-3.5 w-3.5 mr-1" />
                Payment will be settled after delivery and invoice generation.
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C66] py-3.5 text-sm font-bold text-white hover:bg-[#092757] disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    Submitting Order...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    SUBMIT ORDER
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Your order will be reviewed and approved by warehouse before production begins.
              </p>
            </div>
          </aside>
        </div>
      )}
    </ErpLayout>
  );
}



import { useState, useEffect, useMemo, useRef } from "react";
import { CalendarClock, Plus, Zap, Calendar, Package, CheckCircle2, Clock } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import {
  getCurrentDemoBranchName,
  getWorkflowOrders,
  saveWorkflowOrder,
  type WorkflowOrderLive,
} from "../../../shared/lib/demo-store";
import { formatCurrency } from "../../../shared/utils/format-currency";

// Complete product list matching Product Catalog — frontend constant, no backend needed
const CATALOG_PRODUCTS: { product: string; price: number }[] = [
  // Sweets
  { product: "Kaju Katli",        price: 680 },
  { product: "Kalakand",          price: 520 },
  { product: "Milk Cake",         price: 600 },
  { product: "Mysore Pak",        price: 480 },
  { product: "Rasgulla",          price: 280 },
  { product: "Gulab Jamun",       price: 260 },
  { product: "Dry Fruit Laddu",   price: 560 },
  { product: "Motichoor Laddu",   price: 380 },
  { product: "Boondi Laddu",      price: 340 },
  { product: "Rasmalai",          price: 320 },
  { product: "Badusha",           price: 360 },
  { product: "Dry Fruit Barfi",   price: 740 },
  // Bakery
  { product: "Milk Bread",        price: 45  },
  { product: "Brown Bread",       price: 55  },
  { product: "Veg Puff",          price: 25  },
  { product: "Egg Puff",          price: 30  },
  { product: "Cream Roll",        price: 40  },
  { product: "Chocolate Cake",    price: 850 },
  { product: "Fruit Cake",        price: 780 },
  { product: "Cup Cake",          price: 60  },
  { product: "Rusk",              price: 120 },
  { product: "Butter Cookies",    price: 180 },
  { product: "Chocolate Cookies", price: 220 },
  { product: "Plum Cake",         price: 720 },
  // Snacks
  { product: "Samosa",            price: 20  },
  { product: "Veg Roll",          price: 45  },
  { product: "Spring Roll",       price: 65  },
  { product: "Khara Bun",         price: 35  },
  { product: "Sandwich",          price: 70  },
  { product: "Cutlet",            price: 40  },
  { product: "Burger",            price: 120 },
  { product: "Pizza Slice",       price: 90  },
  // Beverages
  { product: "Badam Milk",        price: 50  },
  { product: "Tea",               price: 20  },
  { product: "Coffee",            price: 30  },
  { product: "Apple Juice",       price: 70  },
  { product: "Lassi",             price: 45  },
  { product: "Mango Juice",       price: 60  },
  { product: "Orange Juice",      price: 60  },
  { product: "Cold Coffee",       price: 110 },
  { product: "Milkshake",         price: 90  },
  // Seasonal
  { product: "Seasonal Gift Box", price: 599 },
];

type Tab = "Today" | "Tomorrow" | "Future Orders";
const TODAY = "Jun 17, 2026";
const TOMORROW = "Jun 18, 2026";

const OCCASIONS = ["None", "Wedding", "Festival", "Birthday", "Corporate", "Other"];

interface PlacedAdvanceOrder {
  advanceOrderId: string;
  workflowOrderId: string;
  product: string;
  qty: number;
  occasion: string;
  deliveryDate: string;
  priority: "Normal" | "Urgent";
  placedAt: string;
}

function deliveryDateForTab(tab: Tab): string {
  if (tab === "Today") return TODAY;
  if (tab === "Tomorrow") return TOMORROW;
  return "Jun 25, 2026";
}

function tabBorder(tab: Tab, active: boolean): string {
  if (!active) return "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100";
  if (tab === "Today") return "bg-red-100 text-red-700 border-red-200";
  if (tab === "Tomorrow") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-indigo-100 text-indigo-700 border-indigo-200";
}

export function BranchAdvanceOrdersPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [product, setProduct] = useState(() => CATALOG_PRODUCTS[0].product);
  const [qty, setQty] = useState(5);
  const [occasion, setOccasion] = useState("None");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [customDate, setCustomDate] = useState("2026-06-25");
  const [productSearch, setProductSearch] = useState(CATALOG_PRODUCTS[0].product);
  const [comboOpen, setComboOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<PlacedAdvanceOrder[]>([]);
  const currentBranch = getCurrentDemoBranchName();

  // Build a price lookup from the frontend product constant
  const priceMap = useMemo(() =>
    Object.fromEntries(CATALOG_PRODUCTS.map(p => [p.product, p.price])),
    []
  );

  // Filtered products for combobox
  const filteredProducts = useMemo(() =>
    CATALOG_PRODUCTS.filter(p =>
      p.product.toLowerCase().startsWith(productSearch.toLowerCase())
    ),
    [productSearch]
  );

  // Close combobox on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
        // If typed text doesn't match selected product, reset to selected
        setProductSearch(product);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [product]);

  // Load previously placed advance orders for this branch from workflow store
  useEffect(() => {
    const all = getWorkflowOrders();
    const mine = all
      .filter(o => o.branch === currentBranch && o.isAdvanceOrder)
      .map(o => ({
        advanceOrderId: o.advanceOrderId ?? o.id,
        workflowOrderId: o.id,
        product: o.items[0]?.product ?? "—",
        qty: o.items[0]?.orderedQty ?? 0,
        occasion: o.occasion ?? "None",
        deliveryDate: o.deliveryDate ?? "—",
        priority: o.priority,
        placedAt: o.date + " " + o.time,
      }));
    setPlaced(mine);
  }, [currentBranch]);

  async function handlePlaceOrder() {
    if (qty <= 0) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));

    const now = new Date();
    const orderId = `ADV-${Math.floor(1000 + Math.random() * 9000)}`;
    const advId = `ADV-ID-${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

    const parsedDelivery = activeTab === "Future Orders"
      ? new Date(customDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : deliveryDateForTab(activeTab);

    const pricePerUnit = priceMap[product] ?? 400;
    const value = pricePerUnit * qty;

    const workflowOrder: WorkflowOrderLive = {
      id: orderId,
      branch: currentBranch,
      date: dateStr,
      time: timeStr,
      priority,
      value,
      status: "Order Placed",
      items: [{
        product,
        orderedQty: qty,
        approvedQty: 0,
        rejectedQty: 0,
        unit: "Kg",
      }],
      isAdvanceOrder: true,
      advanceOrderId: advId,
      occasion: occasion === "None" ? undefined : occasion,
      deliveryDate: parsedDelivery,
    };

    saveWorkflowOrder(workflowOrder);

    const newEntry: PlacedAdvanceOrder = {
      advanceOrderId: advId,
      workflowOrderId: orderId,
      product,
      qty,
      occasion,
      deliveryDate: parsedDelivery,
      priority,
      placedAt: dateStr + " " + timeStr,
    };

    setPlaced(prev => [newEntry, ...prev]);
    setSubmitting(false);
    setProduct(CATALOG_PRODUCTS[0].product);
    setProductSearch(CATALOG_PRODUCTS[0].product);
    setQty(5);
    setOccasion("None");
    setPriority("Normal");
  }

  const tabs: Tab[] = ["Today", "Tomorrow", "Future Orders"];

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Advance Orders")}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <CalendarClock className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Advance Orders</h2>
          <p className="text-sm text-slate-500">Schedule future orders for delivery on specific dates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left – Place Order Form */}
        <section className="xl:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Place Advance Order</h3>
            </div>

            {/* Delivery date tabs */}
            <div className="mb-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Delivery Date</p>
              <div className="flex gap-2 flex-wrap">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${tabBorder(tab, activeTab === tab)}`}
                  >
                    {tab === "Today" && TODAY}
                    {tab === "Tomorrow" && TOMORROW}
                    {tab === "Future Orders" && "Future Orders"}
                  </button>
                ))}
              </div>
              {activeTab === "Future Orders" && (
                <input
                  type="date"
                  value={customDate}
                  min="2026-06-19"
                  onChange={e => setCustomDate(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              )}
            </div>

            {/* Product */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Product</label>
              <div className="relative" ref={comboRef}>
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setComboOpen(true);
                  }}
                  onFocus={() => setComboOpen(true)}
                  placeholder="Search product..."
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                />
                {comboOpen && (
                  <ul className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-slate-400">No matching products found.</li>
                    ) : (
                      filteredProducts.map(p => (
                        <li
                          key={p.product}
                          onMouseDown={() => {
                            setProduct(p.product);
                            setProductSearch(p.product);
                            setComboOpen(false);
                          }}
                          className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700 ${
                            p.product === product ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-700"
                          }`}
                        >
                          {p.product}
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Quantity (Kg)</label>
              <input
                type="number"
                min={1}
                max={500}
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* Occasion */}
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Occasion (Optional)</label>
              <select
                value={occasion}
                onChange={e => setOccasion(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Priority</label>
              <div className="flex gap-2">
                {(["Normal", "Urgent"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                      priority === p
                        ? p === "Urgent"
                          ? "border-red-300 bg-red-50 text-red-700"
                          : "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {p === "Urgent" && <Zap className="inline h-3 w-3 mr-1" />}
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 flex justify-between text-sm">
              <span className="text-indigo-600">Estimated Value</span>
              <span className="font-bold text-indigo-800">
                {formatCurrency((priceMap[product] ?? 400) * qty)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C66] py-3 text-sm font-bold text-white hover:bg-[#092757] disabled:opacity-60"
            >
              {submitting
                ? <><Clock className="h-4 w-4 animate-spin" /> Placing Order...</>
                : <><CheckCircle2 className="h-4 w-4" /> Place Advance Order</>}
            </button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700">
                <p className="font-semibold mb-0.5">Delivery Date</p>
                <p>
                  {activeTab === "Future Orders"
                    ? new Date(customDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : deliveryDateForTab(activeTab)}
                </p>
                <p className="mt-1 text-amber-600">
                  Your order enters the standard workflow immediately and is tracked in My Orders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right – Placed Advance Orders */}
        <section className="xl:col-span-7">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Your Advance Orders</h3>
              </div>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                {placed.length} orders
              </span>
            </div>

            {placed.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarClock className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-400 text-sm">No advance orders placed yet.</p>
                <p className="text-slate-400 text-xs mt-1">Use the form to schedule your first advance order.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {placed.map(o => (
                  <div key={o.advanceOrderId} className="px-5 py-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 text-sm">{o.product}</span>
                          <span className="rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                            Advance Order
                          </span>
                          {o.priority === "Urgent" && (
                            <span className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700 flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5" /> Urgent
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                          <span>{o.qty} Kg</span>
                          {o.occasion && o.occasion !== "None" && (
                            <span className="text-violet-600 font-medium">{o.occasion}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Delivery: {o.deliveryDate}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                          <span>ID: {o.advanceOrderId}</span>
                          <span>·</span>
                          <span>Workflow: {o.workflowOrderId}</span>
                          <span>·</span>
                          <span>{o.placedAt}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="inline-block rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          Order Placed
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatCurrency((priceMap[o.product] ?? 400) * o.qty)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

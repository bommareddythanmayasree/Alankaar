/**
 * PLACE ORDER — Branch Portal
 * Rebranded from "Product Catalog" to an internal ordering workflow.
 * Shows order intelligence: Previous Qty, Last Week Avg, Suggested Qty.
 * Route: /branch/product-catalog (unchanged)
 */
import { useMemo, useState } from "react";
import { ShoppingBag, Zap, ChevronRight, TrendingUp, CalendarClock, Star, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import { useCart } from "../../../app/branch/branch-context";
import { useActiveProducts } from "../../../shared/hooks/use-active-products";
import { getUnitLabel, PRODUCT_CATEGORY_MAP } from "../../../shared/utils/product-units";
import { getProductSellingPrice } from "../../../shared/lib/demo-store";

// Product images import
import kalakandImg from "../../../assets/products/kalakand.jpg";
import milkCakeImg from "../../../assets/products/milk-cake.jpg";
import kajuKatliImg from "../../../assets/products/kaju-katli.jpg";
import rasgullaImg from "../../../assets/products/rasgulla.jpg";
import gulabJamunImg from "../../../assets/products/gulab-jamun.jpg";
import dryFruitLadduImg from "../../../assets/products/dry-fruit-laddu.jpg";
import mysorePakImg from "../../../assets/products/mysore-pak.jpg";
import milkBreadImg from "../../../assets/products/milk-bread.jpg";
import vegPuffImg from "../../../assets/products/veg-puff.jpg";
import eggPuffImg from "../../../assets/products/egg-puff.jpg";
import creamRollImg from "../../../assets/products/cream-roll.jpg";
import samosaImg from "../../../assets/products/samosa.jpg";
import boondiLadduImg from "../../../assets/products/boondi-laddu.jpg";
import motichoorLadduImg from "../../../assets/products/motichoor-laddu.jpg";
import badamMilkImg from "../../../assets/products/badam-milk.jpg";
import teaImg from "../../../assets/products/tea.jpg";
import coffeeImg from "../../../assets/products/coffee.jpg";
import appleJuiceImg from "../../../assets/products/apple-juice.jpg";
import lassiImg from "../../../assets/products/lassi.jpg";
import brownBreadImg from "../../../assets/products/brown-bread.jpg";
import rasmalaiImg from "../../../assets/products/rasmalai.jpg";
import badushaImg from "../../../assets/products/badusha.jpg";
import dryFruitBarfiImg from "../../../assets/products/dry-fruit-barfi.jpg";
import chocolateCakeImg from "../../../assets/products/chocolate-cake.jpg";
import fruitCakeImg from "../../../assets/products/fruit-cake.jpg";
import cupCakeImg from "../../../assets/products/cup-cake.jpg";
import ruskImg from "../../../assets/products/rusk.jpg";
import butterCookiesImg from "../../../assets/products/butter-cookies.jpg";
import chocolateCookiesImg from "../../../assets/products/chocolate-cookies.jpg";
import plumCakeImg from "../../../assets/products/plum-cake.jpg";
import vegRollImg from "../../../assets/products/veg-roll.jpg";
import springRollImg from "../../../assets/products/spring-roll.jpg";
import kharaBunImg from "../../../assets/products/khara-bun.jpg";
import sandwichImg from "../../../assets/products/sandwich.jpg";
import cutletImg from "../../../assets/products/cutlet.jpg";
import burgerImg from "../../../assets/products/burger.jpg";
import pizzaSliceImg from "../../../assets/products/pizza-slice.jpg";
import mangoJuiceImg from "../../../assets/products/mango-juice.jpg";
import orangeJuiceImg from "../../../assets/products/orange-juice.jpg";
import coldCoffeeImg from "../../../assets/products/cold-coffee.jpg";
import milkshakeImg from "../../../assets/products/milkshake.jpg";
import seasonalGiftBoxImg from "../../../assets/products/seasonal-gift-box.jpg";

type Priority = "Normal" | "Urgent";

type OrderLine = {
  product: string;
  unit: string;
  qty: number;
  priority: Priority;
  PreviousQty: number;
  lastWeekAvg: number;
  suggestedQty: number;
  badge?: string;
};

const CATEGORIES = ["All", "Sweets", "Snacks", "Bakery", "Beverages", "Seasonal"];

// Product images mapping
const PRODUCT_IMAGES: Record<string, string> = {
  "Kalakand": kalakandImg,
  "Milk Cake": milkCakeImg,
  "Kaju Katli": kajuKatliImg,
  "Rasgulla": rasgullaImg,
  "Gulab Jamun": gulabJamunImg,
  "Dry Fruit Laddu": dryFruitLadduImg,
  "Mysore Pak": mysorePakImg,
  "Boondi Laddu": boondiLadduImg,
  "Motichoor Laddu": motichoorLadduImg,
  "Rasmalai": rasmalaiImg,
  "Badusha": badushaImg,
  "Dry Fruit Barfi": dryFruitBarfiImg,
  "Milk Bread": milkBreadImg,
  "Brown Bread": brownBreadImg,
  "Cream Roll": creamRollImg,
  "Chocolate Cake": chocolateCakeImg,
  "Fruit Cake": fruitCakeImg,
  "Cup Cake": cupCakeImg,
  "Rusk": ruskImg,
  "Butter Cookies": butterCookiesImg,
  "Chocolate Cookies": chocolateCookiesImg,
  "Plum Cake": plumCakeImg,
  "Veg Puff": vegPuffImg,
  "Egg Puff": eggPuffImg,
  "Samosa": samosaImg,
  "Veg Roll": vegRollImg,
  "Spring Roll": springRollImg,
  "Khara Bun": kharaBunImg,
  "Sandwich": sandwichImg,
  "Cutlet": cutletImg,
  "Burger": burgerImg,
  "Pizza Slice": pizzaSliceImg,
  "Badam Milk": badamMilkImg,
  "Tea": teaImg,
  "Coffee": coffeeImg,
  "Apple Juice": appleJuiceImg,
  "Lassi": lassiImg,
  "Mango Juice": mangoJuiceImg,
  "Orange Juice": orangeJuiceImg,
  "Cold Coffee": coldCoffeeImg,
  "Milkshake": milkshakeImg,
  "Seasonal Gift Box": seasonalGiftBoxImg,
};

function badgeStyle(badge: string) {
  if (badge === "Festival Order") return "bg-amber-100 text-amber-700 border-amber-200";
  if (badge === "Weekend Demand") return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function badgeIcon(badge: string) {
  if (badge === "Festival Order") return <Star className="h-3 w-3" />;
  if (badge === "Weekend Demand") return <TrendingUp className="h-3 w-3" />;
  return <CalendarClock className="h-3 w-3" />;
}

function OrderCard({
  line,
  onChange,
}: {
  line: OrderLine;
  onChange: (product: string, qty: number, priority: Priority) => void;
}) {
  const unit = line.unit || getUnitLabel(PRODUCT_CATEGORY_MAP[line.product] ?? "");
  return (
    <div className={`rounded-xl border bg-white transition-shadow hover:shadow-md ${line.priority === "Urgent" ? "border-red-200" : "border-slate-200"}`}>
      {/* Product Image */}
      <div className="mb-3 h-[110px] w-full overflow-hidden rounded-t-xl">
        <img
          src={PRODUCT_IMAGES[line.product]}
          alt={line.product}
          className="h-full w-full object-cover"
        />
      </div>
      
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-slate-800">{line.product}</h4>
            <p className="text-xs text-slate-500">{PRODUCT_CATEGORY_MAP[line.product] ?? "General"}</p>
          </div>
          {line.badge && (
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeStyle(line.badge)}`}>
              {badgeIcon(line.badge)}{line.badge}
            </span>
          )}
        </div>

        {/* Order intelligence */}
        <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2.5 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Previous</p>
            <p className="text-sm font-bold text-slate-700">{line.PreviousQty} {unit}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Avg / Week</p>
            <p className="text-sm font-bold text-slate-700">{line.lastWeekAvg} {unit}</p>
          </div>
          <div>
            <p className="text-[10px] text-indigo-500 uppercase tracking-wide font-semibold">Suggested</p>
            <p className="text-sm font-bold text-indigo-600">{line.suggestedQty} {unit}</p>
          </div>
        </div>

        {/* Qty input */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Today's Order Qty ({unit})</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange(line.product, Math.max(0, line.qty - 1), line.priority)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-lg"
            >−</button>
            <input
              type="number"
              min={0}
              value={line.qty === 0 ? "" : line.qty}
              onChange={e => onChange(line.product, Math.max(0, Number(e.target.value) || 0), line.priority)}
              placeholder="0"
              className="h-8 w-16 rounded-lg border border-slate-200 text-center text-sm font-semibold outline-none focus:border-[#0B2C66]"
            />
            <button
              onClick={() => onChange(line.product, line.qty + 1, line.priority)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-lg"
            >+</button>
            <button
              onClick={() => onChange(line.product, line.suggestedQty, line.priority)}
              className="ml-auto rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100"
            >Use Suggested</button>
          </div>
        </div>

        {/* Priority */}
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Priority</p>
          <div className="flex gap-2">
            <button
              onClick={() => onChange(line.product, line.qty, "Normal")}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${line.priority === "Normal" ? "border-[#0B2C66] bg-[#0B2C66] text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >Normal</button>
            <button
              onClick={() => onChange(line.product, line.qty, "Urgent")}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${line.priority === "Urgent" ? "border-red-500 bg-red-500 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            ><Zap className="inline h-3 w-3 mr-0.5" />Urgent</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCatalogPage() {
  const navigate = useNavigate();
  const { addToCart, cartItems, setQty, removeItem } = useCart();
  const [category, setCategory] = useState("All");
  const activeProducts = useActiveProducts();
  const [orderLines, setOrderLines] = useState<Record<string, OrderLine>>(() => {
    const map: Record<string, OrderLine> = {};
    activeProducts.forEach(i => {
      map[i.product] = { ...i, qty: 0, priority: "Normal" };
    });
    return map;
  });

  // Sync orderLines when new products are approved dynamically
  useMemo(() => {
    setOrderLines(prev => {
      const next = { ...prev };
      activeProducts.forEach(i => {
        if (!next[i.product]) {
          next[i.product] = { ...i, qty: 0, priority: "Normal" };
        }
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProducts]);

  function handleChange(product: string, qty: number, priority: Priority) {
    setOrderLines(prev => ({ ...prev, [product]: { ...prev[product], qty, priority } }));
    const existing = cartItems.find(c => c.name === product);
    if (qty === 0) {
      if (existing) removeItem(existing.id);
    } else if (existing) {
      setQty(existing.id, qty);
    } else {
      addToCart({ id: product, name: product, price: getProductSellingPrice(product) }, qty);
    }
  }

  const filtered = useMemo(() => {
    return activeProducts.filter(i =>
      category === "All" ? true : (PRODUCT_CATEGORY_MAP[i.product] ?? "General") === category
    );
  }, [category, activeProducts]);

  const orderedLines = Object.values(orderLines).filter(l => l.qty > 0);
  const totalQty = orderedLines.reduce((s, l) => s + l.qty, 0);
  const urgentCount = orderedLines.filter(l => l.priority === "Urgent").length;
  const hasOrder = orderedLines.length > 0;

  function handleReviewOrder() {
    navigate("/branch/shopping-cart");
  }

  return (
    <ErpLayout sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Product Catalog")}>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">Place Order</h2>
          <p className="mt-1 text-slate-500">Select products and quantities for today's branch order to warehouse.</p>
        </div>
        {hasOrder && (
          <button onClick={handleReviewOrder}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C66] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#092757]">
            <ShoppingBag className="h-4 w-4" />
            Review Order ({orderedLines.length} items)
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {urgentCount > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <Zap className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {urgentCount} urgent item{urgentCount > 1 ? "s" : ""} in this order — will be flagged for warehouse priority handling.
          </p>
        </div>
      )}

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-700">
          Enter quantities for each product. Use "Suggested" to apply our recommended quantities based on your weekly average.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Category sidebar */}
        <aside className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-600 uppercase tracking-wide">Category</h3>
          <div className="space-y-1">
            {CATEGORIES.map(cat => {
              const count = cat === "All"
                ? activeProducts.length
                : activeProducts.filter(i => (PRODUCT_CATEGORY_MAP[i.product] ?? "General") === cat).length;
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${category === cat ? "bg-[#E9EDFF] font-semibold text-[#0B2C66]" : "text-slate-600 hover:bg-slate-50"}`}>
                  <span>{cat}</span>
                  <span className="text-xs text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>

          {hasOrder && (
            <div className="mt-5 rounded-xl border border-[#0B2C66]/20 bg-[#E9EDFF] p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0B2C66]">Order Summary</p>
              <div className="space-y-1 text-xs text-slate-700">
                <div className="flex justify-between"><span>Products</span><span className="font-bold">{orderedLines.length}</span></div>
                <div className="flex justify-between"><span>Total Qty</span><span className="font-bold">{totalQty} units</span></div>
                {urgentCount > 0 && (
                  <div className="flex justify-between text-red-600"><span>Urgent</span><span className="font-bold">{urgentCount}</span></div>
                )}
              </div>
              <button onClick={handleReviewOrder}
                className="mt-3 w-full rounded-lg bg-[#0B2C66] py-1.5 text-xs font-semibold text-white hover:bg-[#092757]">
                Review Order →
              </button>
            </div>
          )}
        </aside>

        {/* Product grid */}
        <section className="xl:col-span-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(item => (
              <OrderCard
                key={item.product}
                line={orderLines[item.product] ?? { ...item, qty: 0, priority: "Normal" }}
                onChange={handleChange}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Sticky bottom bar */}
      {hasOrder && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-6 py-3 shadow-lg md:left-64">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-600">{orderedLines.length} products selected</span>
              <span className="font-semibold text-slate-800">Total: {totalQty} units</span>
              {urgentCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                  <Zap className="h-3.5 w-3.5" />{urgentCount} urgent
                </span>
              )}
            </div>
            <button onClick={handleReviewOrder}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B2C66] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#092757]">
              Review Order <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

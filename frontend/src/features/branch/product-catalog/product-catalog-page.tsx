import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_CATALOG_PRODUCTS, type CatalogCategory } from "../../../shared/data/branch-mock-data";
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

const PAGE_SIZE = 8;

export function ProductCatalogPage() {
  const { addToCart } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | CatalogCategory>("All");
  const [sortBy, setSortBy] = useState<"Popular" | "Price Low to High" | "Price High to Low" | "Stock High to Low">("Popular");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let items = BRANCH_CATALOG_PRODUCTS.filter((p) => {
      const byQuery = [p.name, p.category, p.code].join(" ").toLowerCase().includes(q);
      const byCategory = category === "All" ? true : p.category === category;
      return byQuery && byCategory;
    });
    if (sortBy === "Price Low to High") items = [...items].sort((a, b) => a.price - b.price);
    if (sortBy === "Price High to Low") items = [...items].sort((a, b) => b.price - a.price);
    if (sortBy === "Stock High to Low") items = [...items].sort((a, b) => b.stock - a.stock);
    return items;
  }, [query, category, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const countByCategory = (cat: string) => {
    if (cat === "All") return BRANCH_CATALOG_PRODUCTS.length;
    return BRANCH_CATALOG_PRODUCTS.filter((p) => p.category === cat).length;
  };

  return (
    <ErpLayout
      
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Product Catalog")}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-3">
          <h3 className="mb-3 text-base font-semibold">Categories</h3>
          <div className="space-y-1.5 text-sm">
            {(["All", "Sweets", "Bakery", "Snacks", "Seasonal","Beverages"] as const).map((cat) => (
              <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left ${category === cat ? "bg-[#EEF4FF] font-semibold text-[#0A3A92]" : "text-slate-600 hover:bg-slate-50"}`}>
                <span>{cat}</span>
                <span className="text-xs text-slate-400">{countByCategory(cat)}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-9">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[420px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search products..."
                className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Sort:</span>
              <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]">
                <option>Popular</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
                <option>Stock High to Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pageItems.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img src={product.image} alt={product.name} className="h-[180px] w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{product.name}</h4>
                      <p className="text-xs text-slate-500">{product.code}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${product.stock > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {product.stock > 0 ? "In Stock" : "Out"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                  <p className="mt-1 text-[20px] font-bold text-slate-900">&#8377;{product.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Stock: {product.stock}</p>
                  <button className="mt-2 h-8 w-full rounded-md bg-[#0A3A92] text-xs font-semibold text-white hover:bg-[#083173]" onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}>Add To Cart</button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i + 1} onClick={() => setPage(i + 1)}
                className={`h-8 min-w-8 rounded-md border px-2 text-sm ${safePage === i + 1 ? "border-[#0A3A92] bg-[#0A3A92] text-white" : "border-slate-200 text-slate-700"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

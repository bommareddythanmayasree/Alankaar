import { useMemo, useState, type ReactNode } from "react";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_STOCK_ITEMS, type StockCategory } from "../../../shared/data/warehouse-mock-data";

type StockStatus = "Active" | "Inactive";

type StockItem = {
  id: string;
  productName: string;
  category: StockCategory;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  status: StockStatus;
  batchNumber: string;
  expiryDate: string;
};

type FormState = Omit<StockItem, "id">;

const emptyForm: FormState = {
  productName: "",
  category: "Sweets",
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  unit: "pcs",
  costPrice: 0,
  sellingPrice: 0,
  supplier: "",
  batchNumber: "",
  expiryDate: "",
  status: "Active",
};

const CATEGORIES: StockCategory[] = ["Bakery Products", "Sweets", "Snacks", "Beverages", "Seasonal Products"];

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

function stockIndicator(item: StockItem): { label: string; cls: string } | null {
  if (item.currentStock === 0) return { label: "Out of Stock", cls: "bg-red-100 text-red-700" };
  if (item.currentStock <= item.minimumStock) return { label: "Low Stock", cls: "bg-amber-100 text-amber-700" };
  const today = new Date();
  const expiry = new Date(item.expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 30) return { label: "Near Expiry", cls: "bg-orange-100 text-orange-700" };
  return null;
}

export function WarehouseStockManagementPage() {
  const [rows, setRows] = useState<StockItem[]>(WAREHOUSE_STOCK_ITEMS as StockItem[]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<StockItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const bySearch = [row.id, row.productName, row.category, row.supplier].join(" ").toLowerCase().includes(search.toLowerCase());
      const byCategory = category === "All Categories" ? true : row.category === category;
      return bySearch && byCategory;
    });
  }, [rows, search, category]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDrawerOpen(true); };

  const openEdit = (row: StockItem) => {
    setEditingId(row.id);
    setForm({
      productName: row.productName,
      category: row.category,
      currentStock: row.currentStock,
      minimumStock: row.minimumStock,
      maximumStock: row.maximumStock,
      unit: row.unit,
      costPrice: row.costPrice,
      sellingPrice: row.sellingPrice,
      supplier: row.supplier,
      batchNumber: row.batchNumber,
      expiryDate: row.expiryDate,
      status: row.status,
    });
    setDrawerOpen(true);
  };

  const saveForm = () => {
    if (!form.productName || !form.supplier) return;
    if (editingId) {
      setRows((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...form } : r)));
    } else {
      const nextId = `PRD-${String(1000 + rows.length + 1)}`;
      setRows((prev) => [{ id: nextId, ...form }, ...prev]);
    }
    setDrawerOpen(false);
  };

  return (
    <ErpLayout
      title="Stock Management"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Stock Management")}
    >
      <p className="mb-4 text-slate-600">Manage your products and stock levels</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            <option>All Categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Product ID</th>
                <th className="px-3 py-3">Product Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Current Stock</th>
                <th className="px-3 py-3">Min / Max</th>
                <th className="px-3 py-3">Cost Price</th>
                <th className="px-3 py-3">Selling Price</th>
                <th className="px-3 py-3">Supplier</th>
                <th className="px-3 py-3">Expiry</th>
                <th className="px-3 py-3">Indicator</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const indicator = stockIndicator(row);
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{row.id}</td>
                    <td className="px-3 py-3">{row.productName}</td>
                    <td className="px-3 py-3">{row.category}</td>
                    <td className="px-3 py-3 font-medium">{row.currentStock} {row.unit}</td>
                    <td className="px-3 py-3 text-slate-500">{row.minimumStock} / {row.maximumStock}</td>
                    <td className="px-3 py-3">&#8377;{row.costPrice}</td>
                    <td className="px-3 py-3">&#8377;{row.sellingPrice}</td>
                    <td className="px-3 py-3">{row.supplier}</td>
                    <td className="px-3 py-3 text-slate-600">{row.expiryDate}</td>
                    <td className="px-3 py-3">
                      {indicator ? (
  <span
    className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap min-w-[90px] ${indicator.cls}`}
  >
    {indicator.label}
  </span>
) : (
  <span
    className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap min-w-[90px] bg-emerald-100 text-emerald-700"
  >
    OK
  </span>
)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewing(row)} className="rounded p-2 text-slate-500 hover:bg-slate-100">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(row)} className="rounded p-2 text-blue-600 hover:bg-blue-50">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setRows((prev) => prev.filter((x) => x.id !== row.id))} className="rounded p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
          <div className="h-full w-full max-w-[440px] overflow-y-auto border-l border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Product" : "Add New Product"}</h3>
              <button onClick={() => setDrawerOpen(false)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Product Name">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.productName} onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))} />
              </Field>
              <Field label="Category">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as StockCategory }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Current Stock">
                <input type="number" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.currentStock} onChange={(e) => setForm((s) => ({ ...s, currentStock: Number(e.target.value) }))} />
              </Field>
              <Field label="Minimum Stock">
                <input type="number" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.minimumStock} onChange={(e) => setForm((s) => ({ ...s, minimumStock: Number(e.target.value) }))} />
              </Field>
              <Field label="Maximum Stock">
                <input type="number" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.maximumStock} onChange={(e) => setForm((s) => ({ ...s, maximumStock: Number(e.target.value) }))} />
              </Field>
              <Field label="Unit">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.unit} onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))} />
              </Field>
              <Field label="Cost Price (Rs.)">
                <input type="number" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.costPrice} onChange={(e) => setForm((s) => ({ ...s, costPrice: Number(e.target.value) }))} />
              </Field>
              <Field label="Selling Price (Rs.)">
                <input type="number" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.sellingPrice} onChange={(e) => setForm((s) => ({ ...s, sellingPrice: Number(e.target.value) }))} />
              </Field>
              <Field label="Batch Number">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.batchNumber} onChange={(e) => setForm((s) => ({ ...s, batchNumber: e.target.value }))} />
              </Field>
              <Field label="Expiry Date">
                <input type="date" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.expiryDate} onChange={(e) => setForm((s) => ({ ...s, expiryDate: e.target.value }))} />
              </Field>
              <Field label="Supplier">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.supplier} onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))} />
              </Field>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as StockStatus }))}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setDrawerOpen(false)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button onClick={saveForm} className="h-10 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">Save Product</button>
            </div>
          </div>
        </div>
      ) : null}

      {viewing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="w-full max-w-[560px] rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <button onClick={() => setViewing(null)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Product ID" value={viewing.id} />
              <Detail label="Product Name" value={viewing.productName} />
              <Detail label="Category" value={viewing.category} />
              <Detail label="Current Stock" value={`${viewing.currentStock} ${viewing.unit}`} />
              <Detail label="Minimum Stock" value={`${viewing.minimumStock}`} />
              <Detail label="Maximum Stock" value={`${viewing.maximumStock}`} />
              <Detail label="Cost Price" value={`Rs.${viewing.costPrice}`} />
              <Detail label="Selling Price" value={`Rs.${viewing.sellingPrice}`} />
              <Detail label="Supplier" value={viewing.supplier} />
              <Detail label="Batch Number" value={viewing.batchNumber} />
              <Detail label="Expiry Date" value={viewing.expiryDate} />
              <Detail label="Status" value={viewing.status} />
            </div>
          </div>
        </div>
      ) : null}
    </ErpLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Eye, ImageIcon, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { useWarehouse, type StockItem, type StockStatus } from "../../../app/warehouse/warehouse-context";
import { PRODUCT_IMAGE_MAP, getProductImage } from "../../../shared/utils/product-images";
import type { StockCategory } from "../../../shared/data/warehouse-mock-data";

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
  performedBy: "Warehouse Admin",
  image: "",
};

const CATEGORIES: StockCategory[] = ["Bakery Products", "Sweets", "Snacks", "Beverages", "Seasonal Products"];

/** Available product names from the image map for "select existing image" */
const AVAILABLE_IMAGE_NAMES = Object.keys(PRODUCT_IMAGE_MAP).map(
  (k) => k.charAt(0).toUpperCase() + k.slice(1)
);

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
  if (item.expiryDate) {
    const today = new Date();
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return { label: "Near Expiry", cls: "bg-orange-100 text-orange-700" };
  }
  return null;
}

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23F1F5F9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%2394A3B8'%3ENo Image%3C/text%3E%3C/svg%3E";

export function WarehouseStockManagementPage() {
  const { products, addProductPendingApproval, updateProduct, deleteProduct } = useWarehouse();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [approvalFilter, setApprovalFilter] = useState<"All" | "Approved" | "Pending" | "Rejected">("All");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<StockItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageMode, setImageMode] = useState<"select" | "upload">("select");
  const [imageSelectQuery, setImageSelectQuery] = useState("");
  const [pendingToast, setPendingToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRows = useMemo(() => {
    return products.filter((row) => {
      const bySearch = [row.id, row.productName, row.category].join(" ").toLowerCase().includes(search.toLowerCase());
      const byCategory = category === "All Categories" ? true : row.category === category;
      const rowApproval = row.approvalStatus ?? "Approved";
      const byApproval = approvalFilter === "All" ? true : rowApproval === approvalFilter;
      return bySearch && byCategory && byApproval;
    });
  }, [products, search, category, approvalFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, image: "" });
    setImageMode("select");
    setImageSelectQuery("");
    setDrawerOpen(true);
  };

  const openEdit = (row: StockItem) => {
    setEditingId(row.id);
    setForm({ ...row });
    setImageMode("select");
    setImageSelectQuery("");
    setDrawerOpen(true);
  };

  const saveForm = () => {
    if (!form.productName) return;
    const finalImage = form.image || getProductImage(form.productName);
    const finalForm = { ...form, image: finalImage };
    if (editingId) {
      updateProduct(editingId, finalForm);
    } else {
      // New product goes through Admin Approval flow
      addProductPendingApproval(finalForm);
      setPendingToast(`"${form.productName}" submitted for admin approval. It will appear in the catalog once approved.`);
      setTimeout(() => setPendingToast(null), 5000);
    }
    setDrawerOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setForm((s) => ({ ...s, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const filteredImageNames = useMemo(() => {
    const q = imageSelectQuery.toLowerCase();
    return AVAILABLE_IMAGE_NAMES.filter((n) => n.toLowerCase().includes(q));
  }, [imageSelectQuery]);

  return (
    <ErpLayout
      title="Stock Management"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Stock Management")}
    >
      <p className="mb-4 text-slate-600">Manage your products and stock levels</p>

      {/* Pending approval toast */}
      {pendingToast && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">⏳ Pending Approval:</span> {pendingToast}
        </div>
      )}

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
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as "All" | "Approved" | "Pending" | "Rejected")}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            <option value="All">All Approvals</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Approval</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Image</th>
                <th className="px-3 py-3">Product ID</th>
                <th className="px-3 py-3">Product Name</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Current Stock</th>
                <th className="px-3 py-3">Min / Max</th>
                <th className="px-3 py-3">Cost Price</th>
                <th className="px-3 py-3">Selling Price</th>
                <th className="px-3 py-3">Performed By</th>
                <th className="px-3 py-3">Expiry</th>
                <th className="px-3 py-3">Indicator</th>
                <th className="px-3 py-3">Approval</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const indicator = stockIndicator(row);
                return (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="px-3 py-3">
                      <img
                        src={row.image || PLACEHOLDER}
                        alt={row.productName}
                        className="h-10 w-14 rounded object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                      />
                    </td>
                    <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{row.id}</td>
                    <td className="px-3 py-3">{row.productName}</td>
                    <td className="px-3 py-3">{row.category}</td>
                    <td className="px-3 py-3 font-medium">{row.currentStock} {row.unit}</td>
                    <td className="px-3 py-3 text-slate-500">{row.minimumStock} / {row.maximumStock}</td>
                    <td className="px-3 py-3">&#8377;{row.costPrice}</td>
                    <td className="px-3 py-3">&#8377;{row.sellingPrice}</td>
                    <td className="px-3 py-3 text-slate-700">{row.performedBy}</td>
                    <td className="px-3 py-3 text-slate-600">{row.expiryDate}</td>
                    <td className="px-3 py-3">
                      {indicator ? (
                        <span className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap min-w-[90px] ${indicator.cls}`}>
                          {indicator.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap min-w-[90px] bg-emerald-100 text-emerald-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {row.approvalStatus === "Pending" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          ⏳ Pending
                        </span>
                      ) : row.approvalStatus === "Rejected" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          ✕ Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          ✓ Approved
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
                        <button onClick={() => deleteProduct(row.id)} className="rounded p-2 text-red-600 hover:bg-red-50">
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

      {/* ── Add / Edit Drawer ── */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
          <div className="h-full w-full max-w-[460px] overflow-y-auto border-l border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Product" : "Add New Product"}</h3>
              {!editingId && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Requires Admin Approval
                </span>
              )}
              <button onClick={() => setDrawerOpen(false)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3">
              {/* ── Image Section ── */}
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Product Image
                </p>
                {/* Preview */}
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={form.image || getProductImage(form.productName) || PLACEHOLDER}
                    alt="preview"
                    className="h-16 w-20 rounded object-cover border border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImageMode("select")}
                      className={`h-8 rounded px-3 text-xs font-semibold border ${imageMode === "select" ? "bg-[#0A3A92] text-white border-[#0A3A92]" : "border-slate-200 text-slate-600"}`}
                    >
                      Select Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode("upload")}
                      className={`h-8 rounded px-3 text-xs font-semibold border ${imageMode === "upload" ? "bg-[#0A3A92] text-white border-[#0A3A92]" : "border-slate-200 text-slate-600"}`}
                    >
                      Upload New
                    </button>
                  </div>
                </div>

                {imageMode === "select" ? (
                  <div>
                    <input
                      value={imageSelectQuery}
                      onChange={(e) => setImageSelectQuery(e.target.value)}
                      placeholder="Search product images..."
                      className="mb-2 h-9 w-full rounded-md border border-slate-200 px-3 text-xs outline-none focus:border-[#0A3A92]"
                    />
                    <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto">
                      {filteredImageNames.slice(0, 40).map((name) => {
                        const imgSrc = getProductImage(name);
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setForm((s) => ({ ...s, image: imgSrc }))}
                            className={`rounded border p-1 text-center ${form.image === imgSrc ? "border-[#0A3A92] ring-1 ring-[#0A3A92]" : "border-slate-200 hover:border-slate-400"}`}
                            title={name}
                          >
                            <img src={imgSrc} alt={name} className="h-10 w-full rounded object-cover" />
                            <p className="mt-0.5 text-[9px] text-slate-500 truncate">{name}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 w-full rounded-md border border-dashed border-slate-300 text-xs text-slate-500 hover:border-[#0A3A92] hover:text-[#0A3A92]"
                    >
                      Click to upload image (JPG, PNG, WebP)
                    </button>
                  </div>
                )}
              </div>

              <Field label="Product Name">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.productName} onChange={(e) => setForm((s) => ({ ...s, productName: e.target.value }))} />
              </Field>
              <Field label="Category">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.category} onChange={(e) => setForm((s) => ({ ...s, category: e.target.value as StockCategory }))}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Performed By">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.performedBy} onChange={(e) => setForm((s) => ({ ...s, performedBy: e.target.value }))} />
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
              <Field label="Supplier">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.supplier} onChange={(e) => setForm((s) => ({ ...s, supplier: e.target.value }))} />
              </Field>
              <Field label="Batch Number">
                <input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.batchNumber} onChange={(e) => setForm((s) => ({ ...s, batchNumber: e.target.value }))} />
              </Field>
              <Field label="Expiry Date">
                <input type="date" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.expiryDate} onChange={(e) => setForm((s) => ({ ...s, expiryDate: e.target.value }))} />
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

      {/* ── View Modal ── */}
      {viewing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="w-full max-w-[580px] rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Details</h3>
              <button onClick={() => setViewing(null)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            {/* Product image in modal */}
            <div className="mb-4 flex justify-center">
              <img
                src={viewing.image || PLACEHOLDER}
                alt={viewing.productName}
                className="h-28 w-40 rounded-lg object-cover border border-slate-200"
                onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
              />
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
              <Detail label="Performed By" value={viewing.performedBy} />
              <Detail label="Supplier" value={viewing.supplier} />
              <Detail label="Batch Number" value={viewing.batchNumber} />
              <Detail label="Expiry Date" value={viewing.expiryDate} />
              <Detail label="Status" value={viewing.status} />
              <Detail
                label="Approval Status"
                value={viewing.approvalStatus === "Pending" ? "⏳ Pending Admin Approval" : viewing.approvalStatus === "Rejected" ? "✕ Rejected" : "✓ Approved"}
              />
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

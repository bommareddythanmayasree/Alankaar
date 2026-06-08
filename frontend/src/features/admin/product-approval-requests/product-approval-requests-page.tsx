import { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";
import {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  getProductAuditTrail,
  getAdminNotifs,
  type DemoPendingProduct,
  type DemoProductAuditEntry,
} from "../../../shared/lib/demo-store";
import { useWarehouseForBranch } from "../../../app/warehouse/warehouse-context";

const STATUS_BADGE: Record<DemoPendingProduct["status"], { label: string; cls: string }> = {
  Pending: { label: "Pending Approval", cls: "bg-amber-100 text-amber-700" },
  Approved: { label: "Approved",        cls: "bg-emerald-100 text-emerald-700" },
  Rejected: { label: "Rejected",        cls: "bg-rose-100 text-rose-700" },
};

export function ProductApprovalRequestsPage() {
  const [products, setProducts] = useState<DemoPendingProduct[]>([]);
  const [auditTrail, setAuditTrail] = useState<DemoProductAuditEntry[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const { approveProductFromAdmin, rejectProductFromAdmin } = useWarehouseForBranch();

  const reload = () => {
    const all = getPendingProducts();
    setProducts(all);
    setPendingCount(all.filter((p) => p.status === "Pending").length);
    setAuditTrail(getProductAuditTrail());
  };

  useEffect(() => {
    reload();
  }, []);

  const handleApprove = (id: string) => {
    approveProduct(id);
    // Sync approval to warehouse context using the canonical product ID
    approveProductFromAdmin(id);
    reload();
  };

  const handleRejectConfirm = () => {
    if (!rejectModal) return;
    rejectProduct(rejectModal.id, rejectReason || "No reason provided");
    // Sync rejection to warehouse context using the canonical product ID
    rejectProductFromAdmin(rejectModal.id);
    setRejectModal(null);
    setRejectReason("");
    reload();
  };

  const adminNotifs = getAdminNotifs();
  const pendingNotifCount = adminNotifs.filter((n) => n.type === "product_pending" && !n.read).length;

  return (
    <ErpLayout
      title="Product Approval Requests"
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Product Approval Requests")}
    >
      <p className="mb-4 text-slate-600">
        Review and approve or reject products submitted by the Warehouse for catalog listing.
      </p>

      {/* Pending count banner */}
      {pendingCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">⏳ {pendingCount} product{pendingCount > 1 ? "s" : ""} awaiting your approval.</span>
          {pendingNotifCount > 0 && (
            <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
              {pendingNotifCount} new notification{pendingNotifCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">All Submitted Products</h2>
        {products.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No product approval requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Product Name</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Price</th>
                  <th className="px-3 py-3">Stock Qty</th>
                  <th className="px-3 py-3">Created By</th>
                  <th className="px-3 py-3">Submitted At</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const badge = STATUS_BADGE[p.status];
                  return (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="px-3 py-3 font-medium text-slate-800">{p.productName}</td>
                      <td className="px-3 py-3 text-slate-600">{p.category}</td>
                      <td className="px-3 py-3">&#8377;{p.price}</td>
                      <td className="px-3 py-3">{p.stock} {p.unit}</td>
                      <td className="px-3 py-3 text-slate-600">Warehouse Admin</td>
                      <td className="px-3 py-3 text-slate-500 text-xs">{p.createdAt}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {p.status === "Pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: p.id, name: p.productName })}
                              className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : p.status === "Approved" ? (
                          <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>
                        ) : (
                          <span className="text-xs text-rose-600 font-semibold">✕ Rejected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Trail */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Audit Trail</h2>
        {auditTrail.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Product Name</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3">Approved/Rejected By</th>
                  <th className="px-3 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditTrail.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{entry.productName}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.action === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{entry.performedBy}</td>
                    <td className="px-3 py-3 text-slate-500 text-xs">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-[440px] rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-1 text-base font-semibold text-slate-900">Reject Product</h3>
            <p className="mb-4 text-sm text-slate-500">
              Rejecting <span className="font-semibold text-slate-700">"{rejectModal.name}"</span>. Provide a reason (optional):
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Pricing too high, incomplete details..."
              rows={3}
              className="mb-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0A3A92] resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="h-9 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="h-9 rounded-md bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </ErpLayout>
  );
}

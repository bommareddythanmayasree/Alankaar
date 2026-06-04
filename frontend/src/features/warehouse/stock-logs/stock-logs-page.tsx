import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Search } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_STOCK_LOGS } from "../../../shared/data/warehouse-mock-data";

type LogAction = "Stock In" | "Stock Out" | "Stock Adjustment";
type DateFilter = "Today" | "This Week" | "This Month" | "Custom";

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

function actionClass(action: LogAction) {
  if (action === "Stock In") return "bg-emerald-100 text-emerald-700";
  if (action === "Stock Out") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function ActionIcon({ action }: { action: LogAction }) {
  if (action === "Stock In") return <ArrowDownCircle className="h-3.5 w-3.5" />;
  if (action === "Stock Out") return <ArrowUpCircle className="h-3.5 w-3.5" />;
  return <RefreshCw className="h-3.5 w-3.5" />;
}

function exportCSV(rows: typeof WAREHOUSE_STOCK_LOGS) {
  const header = "Log ID,Product,Action,Quantity,Date,Performed By,Remarks";
  const lines = rows.map((r) =>
    [r.logId, r.product, r.action, r.quantity, r.date, r.performedBy, `"${r.remarks}"`].join(",")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "stock-logs.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportXLSX(rows: typeof WAREHOUSE_STOCK_LOGS) {
  // Simple TSV-based approach (opens in Excel)
  const header = "Log ID\tProduct\tAction\tQuantity\tDate\tPerformed By\tRemarks";
  const lines = rows.map((r) =>
    [r.logId, r.product, r.action, r.quantity, r.date, r.performedBy, r.remarks].join("\t")
  );
  const blob = new Blob([[header, ...lines].join("\n")], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "stock-logs.xlsx";
  link.click();
  URL.revokeObjectURL(link.href);
}

export function StockLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"All" | LogAction>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("This Month");

  const filteredLogs = useMemo(() => {
    return WAREHOUSE_STOCK_LOGS.filter((log) => {
      const matchSearch = [log.logId, log.product, log.performedBy, log.remarks]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchAction = actionFilter === "All" ? true : log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [search, actionFilter]);

  return (
    <ErpLayout
      title="Stock Logs"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Stock Logs")}
    >
      <p className="mb-4 text-slate-600">Track all stock-in, stock-out and adjustment operations</p>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {/* Filters row */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[280px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as "All" | LogAction)}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            <option value="All">All Actions</option>
            <option value="Stock In">Stock In</option>
            <option value="Stock Out">Stock Out</option>
            <option value="Stock Adjustment">Stock Adjustment</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="Custom">Custom Range</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => exportCSV(filteredLogs)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportXLSX(filteredLogs)}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Export XLSX
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Log ID</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3">Action</th>
                <th className="px-3 py-3">Quantity</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Performed By</th>
                <th className="px-3 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.logId} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{log.logId}</td>
                  <td className="px-3 py-3 font-medium">{log.product}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${actionClass(log.action as LogAction)}`}>
                      <ActionIcon action={log.action as LogAction} />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className={log.quantity < 0 ? "text-rose-600 font-semibold" : "text-slate-800"}>
                      {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{log.date}</td>
                  <td className="px-3 py-3">{log.performedBy}</td>
                  <td className="px-3 py-3 text-slate-500">{log.remarks}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No logs found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ErpLayout>
  );
}

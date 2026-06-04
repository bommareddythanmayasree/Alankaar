import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";

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

export function WarehouseSettingsPage() {
  return (
    <ErpLayout
      title="Settings"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage warehouse admin profile and alerts</p>
      <SettingsForm roleLabel="Warehouse Admin" />
    </ErpLayout>
  );
}

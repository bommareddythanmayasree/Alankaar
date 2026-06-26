import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_SIDEBAR_LABELS } from "../../../shared/data/warehouse-mock-data";

export function WarehouseSettingsPage() {
  return (
    <ErpLayout
      title="Settings"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...WAREHOUSE_SIDEBAR_LABELS], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage warehouse admin profile and alerts</p>
      <SettingsForm roleLabel="Warehouse Admin" />
    </ErpLayout>
  );
}



import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";

const ADMIN_SIDEBAR = [
  "Dashboard",
  "Employee Management",
  "Branch Management",
  "Products Analytics",
  "Inventory Analytics",
  "Revenue Analytics",
  "Order Analytics",
  "AI Recommendations",
  "Notifications",
  "Settings",
] as const;

export function AdminSettingsPage() {
  return (
    <ErpLayout
      title="Settings"
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage your account and notification preferences</p>
      <SettingsForm roleLabel="Super Admin" />
    </ErpLayout>
  );
}

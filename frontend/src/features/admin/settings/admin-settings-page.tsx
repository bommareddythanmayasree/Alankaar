import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

export function AdminSettingsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage your account and notification preferences</p>
      <SettingsForm roleLabel="Alankar Administrator" />
    </ErpLayout>
  );
}

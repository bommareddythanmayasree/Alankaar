import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";


export function BranchSettingsPage() {
  return (
    <ErpLayout
      title="Settings"
      sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage your branch profile and preferences</p>
      <SettingsForm roleLabel="Branch Manager" />
    </ErpLayout>
  );
}



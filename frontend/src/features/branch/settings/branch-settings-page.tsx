import { ErpLayout } from "../../shared/erp-layout";
import { SettingsForm } from "../../shared/settings-form";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";

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

export function BranchSettingsPage() {
  return (
    <ErpLayout
      title="Settings"
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Settings")}
    >
      <p className="mb-5 text-slate-500">Manage your branch profile and preferences</p>
      <SettingsForm roleLabel="Branch Manager" />
    </ErpLayout>
  );
}

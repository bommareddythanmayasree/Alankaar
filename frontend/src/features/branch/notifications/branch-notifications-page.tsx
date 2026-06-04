import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { NotificationsList } from "../../shared/notifications-list";
import { BRANCH_NOTIFICATIONS_DATA } from "../../../shared/data/branch-mock-data";

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

export function BranchNotificationsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Updates about your branch orders, stock, and deliveries</p>
      <div className="max-w-3xl">
        <NotificationsList items={BRANCH_NOTIFICATIONS_DATA} />
      </div>
    </ErpLayout>
  );
}

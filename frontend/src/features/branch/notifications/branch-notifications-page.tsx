import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { NotificationsList } from "../../shared/notifications-list";
import { BRANCH_NOTIFICATIONS_DATA } from "../../../shared/data/branch-mock-data";
import { useWarehouseForBranch } from "../../../app/warehouse/warehouse-context";
import type { AppNotification } from "../../../shared/data/notifications-mock";

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
  const { branchNotifications } = useWarehouseForBranch();

  // Live notifications (from order workflow) prepended to static mock data
  const allNotifications: AppNotification[] = [
    ...branchNotifications,
    ...BRANCH_NOTIFICATIONS_DATA,
  ];

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Updates about your branch orders, stock, and deliveries</p>
      <div className="max-w-3xl">
        <NotificationsList items={allNotifications} />
      </div>
    </ErpLayout>
  );
}

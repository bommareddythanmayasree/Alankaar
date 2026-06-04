import { ErpLayout } from "../../shared/erp-layout";
import { NotificationsList } from "../../shared/notifications-list";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_NOTIFICATIONS } from "../../../shared/data/notifications-mock";

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

export function WarehouseNotificationsPage() {
  return (
    <ErpLayout
      title="Notifications"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Warehouse alerts for orders, stock, and dispatch</p>
      <div className="max-w-3xl">
        <NotificationsList items={WAREHOUSE_NOTIFICATIONS} />
      </div>
    </ErpLayout>
  );
}

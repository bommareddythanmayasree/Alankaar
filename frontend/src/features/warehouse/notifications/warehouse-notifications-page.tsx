import { ErpLayout } from "../../shared/erp-layout";
import { NotificationsList } from "../../shared/notifications-list";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_NOTIFICATIONS } from "../../../shared/data/notifications-mock";
import { useWarehouse } from "../../../app/warehouse/warehouse-context";
import type { AppNotification } from "../../../shared/data/notifications-mock";

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
  const { warehouseNotifications } = useWarehouse();

  // Live notifications prepended to static mock data
  const allNotifications: AppNotification[] = [
    ...warehouseNotifications,
    ...WAREHOUSE_NOTIFICATIONS,
  ];

  return (
    <ErpLayout
      title="Notifications"
      sidebarItems={buildSidebar(WAREHOUSE_NAV, [...SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Warehouse alerts for orders, stock, and dispatch</p>
      <div className="max-w-3xl">
        <NotificationsList items={allNotifications} />
      </div>
    </ErpLayout>
  );
}

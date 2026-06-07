import { useState, useEffect } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { NotificationsList } from "../../shared/notifications-list";
import { WAREHOUSE_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { WAREHOUSE_NOTIFICATIONS } from "../../../shared/data/notifications-mock";
import { getWarehouseNotifs, type DemoNotif } from "../../../shared/lib/demo-store";
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

function demoNotifToApp(n: DemoNotif): AppNotification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp,
    read: n.read,
  };
}

export function WarehouseNotificationsPage() {
  const [liveNotifs, setLiveNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    function sync() {
      setLiveNotifs(getWarehouseNotifs().map(demoNotifToApp));
    }
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const allNotifications: AppNotification[] = [...liveNotifs, ...WAREHOUSE_NOTIFICATIONS];

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

import { ErpLayout } from "../../shared/erp-layout";
import { NotificationsList } from "../../shared/notifications-list";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_NOTIFICATIONS } from "../../../shared/data/notifications-mock";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

export function AdminNotificationsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Stay updated with orders, stock, and system alerts</p>
      <div className="max-w-3xl">
        <NotificationsList items={ADMIN_NOTIFICATIONS} />
      </div>
    </ErpLayout>
  );
}

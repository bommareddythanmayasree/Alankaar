import { useState, useEffect } from "react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { BRANCH_SIDEBAR_LABELS } from "../../../shared/data/branch-mock-data";
import { NotificationsList } from "../../shared/notifications-list";
import { BRANCH_NOTIFICATIONS_DATA } from "../../../shared/data/branch-mock-data";
import { getBranchNotifs, type DemoNotif } from "../../../shared/lib/demo-store";
import type { AppNotification } from "../../../shared/data/notifications-mock";


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

export function BranchNotificationsPage() {
  const [liveNotifs, setLiveNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    function sync() {
      setLiveNotifs(getBranchNotifs().map(demoNotifToApp));
    }
    sync();
    window.addEventListener("focus", sync);
    return () => window.removeEventListener("focus", sync);
  }, []);

  const allNotifications: AppNotification[] = [...liveNotifs, ...BRANCH_NOTIFICATIONS_DATA];

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...BRANCH_SIDEBAR_LABELS], "Notifications")}
    >
      <p className="mb-5 text-slate-500">Updates about your branch orders, stock, and deliveries</p>
      <div className="max-w-3xl">
        <NotificationsList items={allNotifications} />
      </div>
    </ErpLayout>
  );
}



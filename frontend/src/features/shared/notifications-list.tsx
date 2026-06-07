import { Bell, CheckCircle2, CreditCard, FileText, Package, XCircle } from "lucide-react";
import type { AppNotification, NotificationType } from "../../shared/data/notifications-mock";

function iconFor(type: NotificationType) {
  if (type === "order_approved") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (type === "order_rejected") return <XCircle className="h-5 w-5 text-red-600" />;
  if (type === "stock_updated") return <Package className="h-5 w-5 text-blue-600" />;
  if (type === "delivery") return <CheckCircle2 className="h-5 w-5 text-teal-600" />;
  if (type === "invoice_generated") return <FileText className="h-5 w-5 text-indigo-600" />;
  if (type === "payment_received") return <CreditCard className="h-5 w-5 text-emerald-600" />;
  return <Bell className="h-5 w-5 text-amber-600" />;
}

function accentFor(type: NotificationType) {
  if (type === "order_approved") return "border-l-emerald-500 bg-emerald-50/40";
  if (type === "order_rejected") return "border-l-red-500 bg-red-50/40";
  if (type === "stock_updated") return "border-l-blue-500 bg-blue-50/40";
  if (type === "delivery") return "border-l-teal-500 bg-teal-50/40";
  if (type === "invoice_generated") return "border-l-indigo-500 bg-indigo-50/40";
  if (type === "payment_received") return "border-l-emerald-500 bg-emerald-50/40";
  return "border-l-amber-500 bg-amber-50/40";
}

export function NotificationsList({ items }: { items: AppNotification[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article
          key={item.id}
          className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${accentFor(item.type)} ${item.read ? "opacity-85" : ""}`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">{iconFor(item.type)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                {!item.read ? <span className="rounded-full bg-[#0A3A92] px-2 py-0.5 text-[10px] font-semibold text-white">New</span> : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.message}</p>
              <p className="mt-2 text-xs text-slate-500">{item.timestamp}</p>
            </div>
          </div>
        </article>
      ))}
      <div className="pt-2 text-center">
        <button type="button" className="text-sm font-semibold text-[#0A3A92] hover:underline">
          View All Notifications
        </button>
      </div>
    </div>
  );
}

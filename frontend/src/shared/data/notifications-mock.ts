export type NotificationType = "order_approved" | "stock_updated" | "order_rejected" | "order_pending" | "delivery";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export const ADMIN_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    type: "order_approved",
    title: "Order Approved",
    message: "Order ORD-1254 from Vijayawada Branch has been approved.",
    timestamp: "May 20, 2024, 11:15 AM",
    read: false,
  },
  {
    id: "n2",
    type: "stock_updated",
    title: "Stock Updated",
    message: "Milk Bread stock has been updated by warehouse.",
    timestamp: "May 19, 2024, 09:30 AM",
    read: false,
  },
  {
    id: "n3",
    type: "order_rejected",
    title: "Order Rejected",
    message: "Order ORD-0999 from Guntur Branch has been rejected.",
    timestamp: "May 19, 2024, 04:30 PM",
    read: true,
  },
  {
    id: "n4",
    type: "delivery",
    title: "Delivery Completed",
    message: "Order ORD-1240 has been delivered to Rajahmundry Branch.",
    timestamp: "May 18, 2024, 06:45 PM",
    read: true,
  },
];

export const WAREHOUSE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "w1",
    type: "order_pending",
    title: "New Order Received",
    message: "Branch Vijayawada Branch 1 placed order ORD-1003 (12 items).",
    timestamp: "May 20, 2024, 10:30 AM",
    read: false,
  },
  {
    id: "w2",
    type: "stock_updated",
    title: "Low Stock Alert",
    message: "Milk Bread quantity is below minimum threshold (15 units left).",
    timestamp: "May 20, 2024, 09:00 AM",
    read: false,
  },
  {
    id: "w3",
    type: "order_approved",
    title: "Dispatch Reminder",
    message: "Order ORD-1001 is approved and ready for dispatch.",
    timestamp: "May 19, 2024, 03:15 PM",
    read: true,
  },
];

export const BRANCH_NOTIFICATIONS: AppNotification[] = [
  {
    id: "b1",
    type: "order_approved",
    title: "Order Approved",
    message: "Your order ORD-1003 has been approved.",
    timestamp: "May 20, 2024, 11:15 AM",
    read: false,
  },
  {
    id: "b2",
    type: "stock_updated",
    title: "Stock Updated",
    message: "Milk Bread stock has been updated by warehouse.",
    timestamp: "May 19, 2024, 09:30 AM",
    read: false,
  },
  {
    id: "b3",
    type: "order_rejected",
    title: "Order Rejected",
    message: "Your order ORD-0999 has been rejected.",
    timestamp: "May 19, 2024, 04:30 PM",
    read: true,
  },
];

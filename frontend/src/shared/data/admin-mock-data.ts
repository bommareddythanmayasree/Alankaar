// Centralized Admin Mock Data — used across Dashboard, Analytics pages
// Keep values consistent across all Admin Portal pages.

export const ADMIN_SUMMARY = {
  totalRevenue: "₹98,76,430",
  totalOrders: 3482,
  totalProducts: 120,
  totalBranches: 17,
  totalStockValue: "₹78,50,000",
  pendingOrders: 145,
  approvedOrders: 978,
  rejectedOrders: 120,
  deliveredOrders: 856,
  averageOrderValue: "₹2,836",
  refunds: "₹1,24,580",
};

export const ADMIN_REVENUE_TREND = [
  { month: "Jan", thisYear: 620000, lastYear: 510000 },
  { month: "Feb", thisYear: 680000, lastYear: 540000 },
  { month: "Mar", thisYear: 710000, lastYear: 590000 },
  { month: "Apr", thisYear: 760000, lastYear: 620000 },
  { month: "May", thisYear: 840000, lastYear: 690000 },
  { month: "Jun", thisYear: 910000, lastYear: 750000 },
];

export const ADMIN_TOP_PRODUCTS = [
  { name: "Milk Bread", revenue: 525000 },
  { name: "Rasgulla", revenue: 480000 },
  { name: "Kaju Katli", revenue: 420000 },
  { name: "Veg Puff", revenue: 310000 },
  { name: "Gulab Jamun", revenue: 285000 },
];

export const ADMIN_ORDERS_TREND = [
  { month: "Jan", thisYear: 180, lastYear: 150 },
  { month: "Feb", thisYear: 195, lastYear: 162 },
  { month: "Mar", thisYear: 210, lastYear: 175 },
  { month: "Apr", thisYear: 228, lastYear: 188 },
  { month: "May", thisYear: 245, lastYear: 205 },
  { month: "Jun", thisYear: 265, lastYear: 220 },
];

export const ADMIN_STOCK_TREND = [
  { month: "Jan", stockIn: 2100, stockOut: 1450 },
  { month: "Feb", stockIn: 2350, stockOut: 1620 },
  { month: "Mar", stockIn: 2520, stockOut: 1710 },
  { month: "Apr", stockIn: 2680, stockOut: 1830 },
  { month: "May", stockIn: 2890, stockOut: 1960 },
  { month: "Jun", stockIn: 3050, stockOut: 2050 },
];

// Canonical sidebar label list for Admin Portal (no Employee Management)
export const ADMIN_SIDEBAR_LABELS = [
  "Dashboard",
  "Branch Management",
  "Products Analytics",
  "Inventory Analytics",
  "Revenue Analytics",
  "Order Analytics",
  "AI Recommendations",
  "Notifications",
  "Settings",
] as const;

export type AdminSidebarLabel = typeof ADMIN_SIDEBAR_LABELS[number];

// ============================================================
// DEMO MOCK DATA — All 20 requirements
// Pure frontend mock data for client demonstration.
// No backend changes required.
// ============================================================

// ── Shared branch list ────────────────────────────────────────────────────────
export const DEMO_BRANCHES = [
  "Gandhi Nagar",
  "Mutyalammapadu",
  "Gayatri Nagar",
  "Ayyappa Nagar",
  "Gannavaram",
  "Machavaram",
  "Gunadala",
  "Governerpet",
] as const;
export type DemoBranch = (typeof DEMO_BRANCHES)[number];

// ── REQ 1: Production Planning ────────────────────────────────────────────────
export type ProductionItem = {
  id: string;
  product: string;
  plannedQty: number;
  unit: string;
  status: "Planned" | "In Production" | "Ready";
  branchBreakdown: { branch: DemoBranch; qty: number; pendingItems: string[] }[];
};

export const DEMO_PRODUCTION_PLAN: ProductionItem[] = [
  {
    id: "PP-001", product: "Kalakand", plannedQty: 15, unit: "Kg", status: "In Production",
    branchBreakdown: [
      { branch: "Gandhi Nagar", qty: 3, pendingItems: ["Kalakand 500g × 6", "Kalakand 1Kg × 2"] },
      { branch: "Gayatri Nagar", qty: 4, pendingItems: ["Kalakand 1Kg × 4"] },
      { branch: "Ayyappa Nagar", qty: 3, pendingItems: ["Kalakand 500g × 6"] },
      { branch: "Gunadala", qty: 5, pendingItems: ["Kalakand 1Kg × 5"] },
    ],
  },
  {
    id: "PP-002", product: "Milk Cake", plannedQty: 10, unit: "Kg", status: "Planned",
    branchBreakdown: [
      { branch: "Mutyalammapadu", qty: 3, pendingItems: ["Milk Cake 500g × 6"] },
      { branch: "Gannavaram", qty: 4, pendingItems: ["Milk Cake 1Kg × 4"] },
      { branch: "Machavaram", qty: 3, pendingItems: ["Milk Cake 500g × 6"] },
    ],
  },
  {
    id: "PP-003", product: "Rasgulla", plannedQty: 20, unit: "Kg", status: "Ready",
    branchBreakdown: [
      { branch: "Governerpet", qty: 6, pendingItems: ["Rasgulla Can × 12"] },
      { branch: "Ayyappa Nagar", qty: 7, pendingItems: ["Rasgulla Can × 14"] },
      { branch: "Gandhi Nagar", qty: 7, pendingItems: ["Rasgulla Can × 14"] },
    ],
  },
  {
    id: "PP-004", product: "Gulab Jamun", plannedQty: 12, unit: "Kg", status: "Planned",
    branchBreakdown: [
      { branch: "Gayatri Nagar", qty: 4, pendingItems: ["Gulab Jamun Can × 8"] },
      { branch: "Gannavaram", qty: 4, pendingItems: ["Gulab Jamun Can × 8"] },
      { branch: "Gunadala", qty: 4, pendingItems: ["Gulab Jamun Can × 8"] },
    ],
  },
  {
    id: "PP-005", product: "Kaju Katli", plannedQty: 8, unit: "Kg", status: "In Production",
    branchBreakdown: [
      { branch: "Gandhi Nagar", qty: 3, pendingItems: ["Kaju Katli Box 250g × 12"] },
      { branch: "Machavaram", qty: 5, pendingItems: ["Kaju Katli Box 500g × 10"] },
    ],
  },
];

// ── REQ 2: Multi-Stage Dispatch ───────────────────────────────────────────────
export type DispatchBatch = {
  batchId: string;
  slot: "Morning" | "Evening";
  time: string;
  status: "Scheduled" | "In Transit" | "Delivered";
  items: { product: string; qty: number; unit: string }[];
  branches: DemoBranch[];
};

export const DEMO_DISPATCH_BATCHES: DispatchBatch[] = [
  {
    batchId: "DB-001", slot: "Morning", time: "07:00 AM", status: "Delivered",
    items: [{ product: "Kalakand", qty: 8, unit: "Kg" }, { product: "Milk Cake", qty: 5, unit: "Kg" }],
    branches: ["Gandhi Nagar", "Gayatri Nagar"],
  },

  {
    batchId: "DB-003", slot: "Evening", time: "05:00 PM", status: "Scheduled",
    items: [{ product: "Rasgulla", qty: 14, unit: "Kg" }, { product: "Gulab Jamun", qty: 8, unit: "Kg" }],
    branches: ["Governerpet", "Machavaram", "Gunadala"],
  },
];

// ── REQ 3 & 4: Delivery Tracking & Order Closure ──────────────────────────────
export type DeliveryRecord = {
  orderId: string;
  branch: DemoBranch;
  product: string;
  ordered: number;
  approved: number;
  dispatched: number;
  delivered: number;
  unit: string;
  difference: number;
  status: "Completed" | "Short Supply" | "Pending";
};

export const DEMO_DELIVERY_RECORDS: DeliveryRecord[] = [
  { orderId: "ORD-2101", branch: "Gandhi Nagar",     product: "Kalakand",    ordered: 4,   approved: 4,   dispatched: 4,   delivered: 3.5, unit: "Kg",  difference: 0.5, status: "Short Supply" },
  { orderId: "ORD-2102", branch: "Gayatri Nagar",    product: "Milk Cake",   ordered: 3,   approved: 3,   dispatched: 3,   delivered: 3,   unit: "Kg",  difference: 0,   status: "Completed" },
  { orderId: "ORD-2103", branch: "Ayyappa Nagar",    product: "Rasgulla",    ordered: 6,   approved: 6,   dispatched: 5.5, delivered: 5.5, unit: "Kg",  difference: 0.5, status: "Short Supply" },
  { orderId: "ORD-2104", branch: "Mutyalammapadu",   product: "Gulab Jamun", ordered: 4,   approved: 4,   dispatched: 4,   delivered: 4,   unit: "Kg",  difference: 0,   status: "Completed" },
  { orderId: "ORD-2105", branch: "Gannavaram",       product: "Milk Bread",  ordered: 100, approved: 100, dispatched: 90,  delivered: 90,  unit: "pcs", difference: 10,  status: "Short Supply" },
  { orderId: "ORD-2106", branch: "Machavaram",       product: "Kaju Katli",  ordered: 2,   approved: 2,   dispatched: 2,   delivered: 2,   unit: "Kg",  difference: 0,   status: "Completed" },
  { orderId: "ORD-2107", branch: "Gunadala",         product: "Veg Puff",    ordered: 80,  approved: 70,  dispatched: 70,  delivered: 65,  unit: "pcs", difference: 15,  status: "Short Supply" },
  { orderId: "ORD-2108", branch: "Governerpet",      product: "Kalakand",    ordered: 3,   approved: 3,   dispatched: 0,   delivered: 0,   unit: "Kg",  difference: 3,   status: "Pending" },
];

// REQ 4 – Order closure summary
export const DEMO_ORDER_CLOSURE = {
  date: "Jun 17, 2026",
  totalOrdered: 10, totalDelivered: 7, totalCancelled: 3,
  closureStatus: "Completed With Short Supply" as const,
  orders: [
    { orderId: "ORD-2101", branch: "Gandhi Nagar",   ordered: 4, delivered: 3.5, cancelled: 0.5, unit: "Kg" },
    { orderId: "ORD-2102", branch: "Gayatri Nagar",  ordered: 3, delivered: 3,   cancelled: 0,   unit: "Kg" },
    { orderId: "ORD-2103", branch: "Ayyappa Nagar",  ordered: 6, delivered: 5.5, cancelled: 0.5, unit: "Kg" },
    { orderId: "ORD-2108", branch: "Governerpet",    ordered: 3, delivered: 0,   cancelled: 3,   unit: "Kg" },
  ],
};

// ── REQ 5: End of Day Closure ─────────────────────────────────────────────────
export const DEMO_EOD = {
  date: "Jun 17, 2026",
  totalOrders: 24,
  deliveredQty: 187.5, // Kg + pcs aggregated
  cancelledQty: 18.5,
  fulfillmentPct: 91,
  reports: [
    { branch: "Gandhi Nagar",   orders: 4, delivered: "28 Kg", cancelled: "2 Kg",   fulfillment: "93%" },
    { branch: "Mutyalammapadu", orders: 3, delivered: "22 Kg", cancelled: "1 Kg",   fulfillment: "96%" },
    { branch: "Gayatri Nagar",  orders: 3, delivered: "18 Kg", cancelled: "0 Kg",   fulfillment: "100%" },
    { branch: "Ayyappa Nagar",  orders: 4, delivered: "30 Kg", cancelled: "3 Kg",   fulfillment: "91%" },
    { branch: "Gannavaram",     orders: 3, delivered: "20 Kg", cancelled: "4 Kg",   fulfillment: "83%" },
    { branch: "Machavaram",     orders: 3, delivered: "25 Kg", cancelled: "2 Kg",   fulfillment: "93%" },
    { branch: "Gunadala",       orders: 2, delivered: "28 Kg", cancelled: "4 Kg",   fulfillment: "88%" },
    { branch: "Governerpet",    orders: 2, delivered: "17 Kg", cancelled: "2.5 Kg", fulfillment: "87%" },
  ],
};

// ── REQ 6 & 7 & 8 & 9 & 10: Payment ─────────────────────────────────────────
export type PaymentStatus = "Pending" | "Partial" | "Completed" | "Will Pay Later";

export type PaymentRecord = {
  orderId: string;
  branch: DemoBranch;
  deliveredValue: number;
  billableValue: number;
  cancelledValue: number;
  outstandingValue: number;
  paidAmount: number;
  status: PaymentStatus;
  date: string;
};

export const DEMO_PAYMENT_RECORDS: PaymentRecord[] = [
  { orderId: "ORD-2101", branch: "Gandhi Nagar",   date: "Jun 17, 2026", deliveredValue: 2450, billableValue: 2450, cancelledValue: 350,  outstandingValue: 2450, paidAmount: 0,    status: "Pending" },
  { orderId: "ORD-2102", branch: "Gayatri Nagar",  date: "Jun 17, 2026", deliveredValue: 1800, billableValue: 1800, cancelledValue: 0,    outstandingValue: 900,  paidAmount: 900,  status: "Partial" },
  { orderId: "ORD-2103", branch: "Ayyappa Nagar",  date: "Jun 17, 2026", deliveredValue: 3150, billableValue: 3150, cancelledValue: 280,  outstandingValue: 0,    paidAmount: 3150, status: "Completed" },
  { orderId: "ORD-2104", branch: "Mutyalammapadu", date: "Jun 17, 2026", deliveredValue: 1120, billableValue: 1120, cancelledValue: 0,    outstandingValue: 1120, paidAmount: 0,    status: "Will Pay Later" },
  { orderId: "ORD-2105", branch: "Gannavaram",     date: "Jun 17, 2026", deliveredValue: 2700, billableValue: 2700, cancelledValue: 300,  outstandingValue: 0,    paidAmount: 2700, status: "Completed" },
  { orderId: "ORD-2106", branch: "Machavaram",     date: "Jun 17, 2026", deliveredValue: 1360, billableValue: 1360, cancelledValue: 0,    outstandingValue: 680,  paidAmount: 680,  status: "Partial" },
  { orderId: "ORD-2107", branch: "Gunadala",       date: "Jun 17, 2026", deliveredValue: 2050, billableValue: 2050, cancelledValue: 375,  outstandingValue: 2050, paidAmount: 0,    status: "Pending" },
  { orderId: "ORD-2108", branch: "Governerpet",    date: "Jun 17, 2026", deliveredValue: 1620, billableValue: 1620, cancelledValue: 1890, outstandingValue: 0,    paidAmount: 1620, status: "Completed" },
];

export const DEMO_PAYMENT_HISTORY = [
  // ── Other branches ─────────────────────────────────────────────────────────
  { id: "PAY-001", date: "Jun 17, 2026", branch: "Gayatri Nagar",  amount: 900,  method: "UPI",   reference: "UPI202606170001", status: "Completed" as const, orderId: "ORD-4521", collectedBy: "" },
  { id: "PAY-002", date: "Jun 17, 2026", branch: "Ayyappa Nagar",  amount: 3150, method: "Cash",  reference: "CSH202606170002", status: "Completed" as const, orderId: "ORD-4522", collectedBy: "Ravi Kumar" },
  { id: "PAY-003", date: "Jun 17, 2026", branch: "Gannavaram",     amount: 2700, method: "NEFT",  reference: "NFT202606170003", status: "Completed" as const, orderId: "ORD-4523", collectedBy: "" },
  { id: "PAY-004", date: "Jun 16, 2026", branch: "Machavaram",     amount: 680,  method: "UPI",   reference: "UPI202606160004", status: "Completed" as const, orderId: "ORD-4524", collectedBy: "" },
  { id: "PAY-005", date: "Jun 16, 2026", branch: "Governerpet",    amount: 1620, method: "Cash",  reference: "CSH202606160005", status: "Completed" as const, orderId: "ORD-4525", collectedBy: "Suresh Babu" },
  { id: "PAY-007", date: "Jun 15, 2026", branch: "Mutyalammapadu", amount: 1400, method: "UPI",   reference: "UPI202606150007", status: "Completed" as const, orderId: "ORD-4527", collectedBy: "" },
  // ── Gandhi Nagar ───────────────────────────────────────────────────────────
  { id: "PAY-GN-001", date: "Jun 20, 2026", branch: "Gandhi Nagar", amount: 5800,  method: "Cash",         reference: "CSH202606200001", status: "Completed"             as const, orderId: "ORD-4801", collectedBy: "Suresh Babu" },
  { id: "PAY-GN-002", date: "Jun 20, 2026", branch: "Gandhi Nagar", amount: 2450,  method: "Cash",         reference: "CSH202606200002", status: "Completed"             as const, orderId: "ORD-4802", collectedBy: "Ravi Kumar" },
  { id: "PAY-GN-003", date: "Jun 20, 2026", branch: "Gandhi Nagar", amount: 1200,  method: "UPI",          reference: "UPI202606200003", status: "Verification Pending"  as const, orderId: "ORD-4803", collectedBy: "" },
  { id: "PAY-GN-004", date: "Jun 19, 2026", branch: "Gandhi Nagar", amount: 12600, method: "Cash",         reference: "CSH202606190004", status: "Completed"             as const, orderId: "ORD-4784", collectedBy: "Delivery Staff" },
  { id: "PAY-GN-005", date: "Jun 19, 2026", branch: "Gandhi Nagar", amount: 8400,  method: "NEFT",         reference: "NFT202606190005", status: "Completed"             as const, orderId: "ORD-4785", collectedBy: "" },
  { id: "PAY-GN-006", date: "Jun 19, 2026", branch: "Gandhi Nagar", amount: 3200,  method: "Cash",         reference: "CSH202606190006", status: "Partial Payment"       as const, orderId: "ORD-4786", collectedBy: "Field Executive" },
  { id: "PAY-GN-007", date: "Jun 18, 2026", branch: "Gandhi Nagar", amount: 22000, method: "Net Banking",  reference: "NB2026061900007", status: "Completed"             as const, orderId: "ORD-4769", collectedBy: "" },
  { id: "PAY-GN-008", date: "Jun 18, 2026", branch: "Gandhi Nagar", amount: 15800, method: "Cash",         reference: "CSH202606180008", status: "Completed"             as const, orderId: "ORD-4770", collectedBy: "Ravi Kumar" },
  { id: "PAY-GN-009", date: "Jun 18, 2026", branch: "Gandhi Nagar", amount: 4500,  method: "Cash",         reference: "CSH202606180009", status: "Verification Pending"  as const, orderId: "ORD-4771", collectedBy: "Suresh Babu" },
  { id: "PAY-GN-010", date: "Jun 17, 2026", branch: "Gandhi Nagar", amount: 9800,  method: "Cash",         reference: "CSH202606170010", status: "Completed"             as const, orderId: "ORD-4752", collectedBy: "Delivery Staff" },
  { id: "PAY-GN-011", date: "Jun 17, 2026", branch: "Gandhi Nagar", amount: 2800,  method: "UPI",          reference: "UPI202606170011", status: "Failed"                as const, orderId: "ORD-4753", collectedBy: "" },
  { id: "PAY-GN-012", date: "Jun 16, 2026", branch: "Gandhi Nagar", amount: 6600,  method: "Cash",         reference: "CSH202606160012", status: "Completed"             as const, orderId: "ORD-4735", collectedBy: "Field Executive" },
  { id: "PAY-GN-013", date: "Jun 16, 2026", branch: "Gandhi Nagar", amount: 1800,  method: "NEFT",         reference: "NFT202606160013", status: "Completed"             as const, orderId: "ORD-4736", collectedBy: "" },
  { id: "PAY-GN-014", date: "Jun 15, 2026", branch: "Gandhi Nagar", amount: 11200, method: "Cash",         reference: "CSH202606150014", status: "Completed"             as const, orderId: "ORD-4718", collectedBy: "Ravi Kumar" },
  { id: "PAY-GN-015", date: "Jun 15, 2026", branch: "Gandhi Nagar", amount: 3750,  method: "Net Banking",  reference: "NB2026061500015", status: "Cancelled"             as const, orderId: "ORD-4719", collectedBy: "" },
];

// ── REQ 11 & 12 & 13 & 14 & 15: Admin Business Intelligence ──────────────────
export const DEMO_BI_SUMMARY = {
  totalDemand: "₹2,84,500",
  totalDelivered: "₹2,59,400",
  totalCancelled: "₹25,100",
  totalRevenue: "₹2,59,400",
  totalCollections: "₹1,94,550",
  totalOutstanding: "₹64,850",
  requestedValue: "₹2,84,500",
  deliveredValue: "₹2,59,400",
  fulfillmentPct: "91.2%",
  cancelledValue: "₹25,100",
};

export const DEMO_DEMAND_TREND = [
  { day: "Mon",  requested: 38000, delivered: 35000, cancelled: 3000 },
  { day: "Tue",  requested: 42000, delivered: 39500, cancelled: 2500 },
  { day: "Wed",  requested: 45000, delivered: 40000, cancelled: 5000 },
  { day: "Thu",  requested: 40000, delivered: 38500, cancelled: 1500 },
  { day: "Fri",  requested: 52000, delivered: 48000, cancelled: 4000 },
  { day: "Sat",  requested: 68000, delivered: 62000, cancelled: 6000 },
  { day: "Sun",  requested: 72000, delivered: 65000, cancelled: 7000 },
];

export const DEMO_WEEKLY_TREND = [
  { week: "W1",  requested: 240000, delivered: 220000, cancelled: 20000 },
  { week: "W2",  requested: 268000, delivered: 250000, cancelled: 18000 },
  { week: "W3",  requested: 290000, delivered: 260000, cancelled: 30000 },
  { week: "W4",  requested: 310000, delivered: 285000, cancelled: 25000 },
];

export const DEMO_MONTHLY_TREND = [
  { month: "Jan", requested: 920000, delivered: 850000, cancelled: 70000 },
  { month: "Feb", requested: 980000, delivered: 915000, cancelled: 65000 },
  { month: "Mar", requested: 1050000, delivered: 970000, cancelled: 80000 },
  { month: "Apr", requested: 1100000, delivered: 1020000, cancelled: 80000 },
  { month: "May", requested: 1180000, delivered: 1090000, cancelled: 90000 },
  { month: "Jun", requested: 1250000, delivered: 1140000, cancelled: 110000 },
];

export const DEMO_PRODUCT_PERFORMANCE = [
  { product: "Kalakand",     demand: 185, delivery: 168, revenue: 114240, shortage: 17 },
  { product: "Milk Cake",    demand: 142, delivery: 130, revenue: 78000,  shortage: 12 },
  { product: "Rasgulla",     demand: 320, delivery: 298, revenue: 83440,  shortage: 22 },
  { product: "Kaju Katli",   demand: 95,  delivery: 88,  revenue: 59840,  shortage: 7 },
  { product: "Gulab Jamun",  demand: 248, delivery: 235, revenue: 61100,  shortage: 13 },
  { product: "Milk Bread",   demand: 1850, delivery: 1720, revenue: 77400, shortage: 130 },
  { product: "Veg Puff",     demand: 1420, delivery: 1280, revenue: 32000, shortage: 140 },
  { product: "Dry Fruit Laddu", demand: 78, delivery: 70, revenue: 39200, shortage: 8 },
];

// REQ 15 – Top shortages
export const DEMO_SHORTAGE_ANALYTICS = [
  { product: "Veg Puff",     requested: 1420, delivered: 1280, shortage: 140, pct: "9.9%" },
  { product: "Milk Bread",   requested: 1850, delivered: 1720, shortage: 130, pct: "7.0%" },
  { product: "Rasgulla",     requested: 320,  delivered: 298,  shortage: 22,  pct: "6.9%" },
  { product: "Kalakand",     requested: 185,  delivered: 168,  shortage: 17,  pct: "9.2%" },
  { product: "Gulab Jamun",  requested: 248,  delivered: 235,  shortage: 13,  pct: "5.2%" },
  { product: "Milk Cake",    requested: 142,  delivered: 130,  shortage: 12,  pct: "8.5%" },
  { product: "Kaju Katli",   requested: 95,   delivered: 88,   shortage: 7,   pct: "7.4%" },
];

// REQ 16 – AI Insights
export const DEMO_AI_INSIGHTS = [
  { id: 1, type: "trend",   severity: "high",   title: "Kalakand Demand Surge",           body: "Kalakand demand has increased by 25% over the last 7 days across Gandhi Nagar and Gayatri Nagar branches. Consider increasing production by 5 Kg daily.", action: "Increase Production" },
  { id: 2, type: "warning", severity: "high",   title: "Outstanding Collections Rising",  body: "Outstanding payment collections have grown by 18% this week. ₹64,850 pending from 3 branches. Gandhi Nagar and Gunadala are the highest contributors.", action: "View Collections" },
  { id: 3, type: "alert",   severity: "medium", title: "Fulfillment Rate Below 85%",      body: "Gannavaram branch fulfillment rate dropped to 83% today due to Veg Puff stock shortage. Review production planning for snack category.", action: "Review Planning" },
  { id: 4, type: "insight", severity: "low",    title: "Weekend Demand Spike Predicted",  body: "Based on historical patterns, weekend demand is expected to increase by 35%. Pre-plan dispatch for Saturday and Sunday batches.", action: "Plan Dispatch" },
  { id: 5, type: "trend",   severity: "low",    title: "Kaju Katli Festival Opportunity", body: "Upcoming festival period shows 40% higher Kaju Katli orders historically. Advance orders for this product can improve fulfillment significantly.", action: "View Advance Orders" },
];

// ── REQ 18: Advance Orders ────────────────────────────────────────────────────
export type AdvanceOrder = {
  id: string;
  branch: DemoBranch;
  product: string;
  qty: number;
  unit: string;
  orderDate: string;
  deliveryDate: string;
  occasion?: string;
  priority: "Normal" | "Urgent";
  status: "Confirmed" | "Pending" | "Processing";
};

export const DEMO_ADVANCE_ORDERS: AdvanceOrder[] = [
  { id: "ADV-001", branch: "Gandhi Nagar",   product: "Kaju Katli",    qty: 50,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 17, 2026", occasion: "Festival",  priority: "Urgent",  status: "Processing" },
  { id: "ADV-002", branch: "Ayyappa Nagar",  product: "Kalakand",      qty: 20,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 17, 2026", priority: "Normal",    status: "Confirmed" },
  { id: "ADV-003", branch: "Gayatri Nagar",  product: "Dry Fruit Laddu", qty: 15, unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 18, 2026", priority: "Normal",  status: "Pending" },
  { id: "ADV-004", branch: "Mutyalammapadu", product: "Rasgulla",      qty: 30,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 18, 2026", priority: "Normal",    status: "Confirmed" },
  { id: "ADV-005", branch: "Gannavaram",     product: "Milk Cake",     qty: 12,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 18, 2026", priority: "Urgent",    status: "Processing" },
  { id: "ADV-006", branch: "Governerpet",    product: "Kaju Katli",    qty: 25,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 20, 2026", occasion: "Wedding",   priority: "Urgent",  status: "Confirmed" },
  { id: "ADV-007", branch: "Machavaram",     product: "Gulab Jamun",   qty: 40,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 22, 2026", priority: "Normal",    status: "Pending" },
  { id: "ADV-008", branch: "Gunadala",       product: "Mysore Pak",    qty: 18,  unit: "Kg", orderDate: "Jun 17, 2026", deliveryDate: "Jun 25, 2026", occasion: "Festival",  priority: "Normal",  status: "Pending" },
];

// ── REQ 19: Urgent Orders ─────────────────────────────────────────────────────
export const DEMO_URGENT_ORDERS = [
  { id: "URG-001", branch: "Gandhi Nagar",   product: "Kaju Katli",  qty: 5,  unit: "Kg",  requestedAt: "08:15 AM", reason: "Festival Rush",    status: "Acknowledged" as const },
  { id: "URG-002", branch: "Gannavaram",     product: "Milk Cake",   qty: 3,  unit: "Kg",  requestedAt: "09:30 AM", reason: "Urgent Retail",    status: "In Production" as const },
  { id: "URG-003", branch: "Governerpet",    product: "Kalakand",    qty: 4,  unit: "Kg",  requestedAt: "10:00 AM", reason: "Bulk Customer",    status: "Dispatched" as const },
];

// ── REQ 20: Multi-Branch Demo Accounts ───────────────────────────────────────
export const DEMO_BRANCH_ACCOUNTS = [
  {
    id: "BR-1", name: "Gandhi Nagar", manager: "Ravi Kumar",   email: "gandhinagar@alankar.com",  password: "demo1234",
    stats: { orders: 14, deliveredValue: "₹38,450", outstanding: "₹12,200", notifications: 3 },
  },
  {
    id: "BR-2", name: "Gayatri Nagar", manager: "Prasad Rao", email: "gayatrinagar@alankar.com", password: "demo1234",
    stats: { orders: 11, deliveredValue: "₹28,100", outstanding: "₹0",      notifications: 1 },
  },
  {
    id: "BR-3", name: "Ayyappa Nagar", manager: "Venkat Reddy", email: "ayyappanagar@alankar.com", password: "demo1234",
    stats: { orders: 16, deliveredValue: "₹45,200", outstanding: "₹8,500",  notifications: 5 },
  },
  {
    id: "BR-4", name: "Gannavaram",  manager: "Kiran Varma",  email: "gannavaram@alankar.com",   password: "demo1234",
    stats: { orders: 9,  deliveredValue: "₹22,800", outstanding: "₹4,150",  notifications: 2 },
  },
] as const;



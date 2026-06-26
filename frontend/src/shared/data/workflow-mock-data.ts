// ============================================================
// WORKFLOW MOCK DATA --- Connected Branchâ†’Warehouseâ†’Production flow
// All 5 Phase-1 requirements share this single data source.
// ============================================================

export type WorkflowStatus =
  | "Order Placed"
  | "Under Review"
  | "Approved"
  | "Added To Production"
  | "Production Started"
  | "Production Completed"
  | "Ready For Dispatch"
  | "Morning Dispatch"
  | "Evening Dispatch"
  | "In Transit"
  | "Delivered"
  | "Invoice Generated"
  | "Payment Pending"
  | "Payment Completed"
  | "Order Closed";

export type OrderPriority = "Normal" | "Urgent";

export type WorkflowOrderItem = {
  product: string;
  orderedQty: number;
  approvedQty: number;
  rejectedQty: number;
  unit: string;
};

export type WorkflowOrder = {
  id: string;
  branch: string;
  date: string;
  time: string;
  priority: OrderPriority;
  value: number;
  status: WorkflowStatus;
  items: WorkflowOrderItem[];
};

export const WORKFLOW_ORDERS: WorkflowOrder[] = [
  // ── Order Placed ─────────────────────────────────────────────────────────
  {
    id: "ORD-2026-007",
    branch: "Gunadala",
    date: "Jun 21, 2026",
    time: "09:30 AM",
    priority: "Normal",
    value: 4200,
    status: "Order Placed",
    items: [
      { product: "Kalakand",   orderedQty: 5, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Kaju Katli", orderedQty: 3, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-008",
    branch: "Governorpet",
    date: "Jun 21, 2026",
    time: "09:45 AM",
    priority: "Normal",
    value: 3800,
    status: "Order Placed",
    items: [
      { product: "Dry Fruit Laddu", orderedQty: 4, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",       orderedQty: 3, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Under Review ─────────────────────────────────────────────────────────
  {
    id: "ORD-2026-005",
    branch: "Gannavaram",
    date: "Jun 21, 2026",
    time: "08:45 AM",
    priority: "Normal",
    value: 5400,
    status: "Under Review",
    items: [
      { product: "Rasgulla",    orderedQty: 10, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 8,  approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-006",
    branch: "Machavaram",
    date: "Jun 21, 2026",
    time: "09:10 AM",
    priority: "Normal",
    value: 6750,
    status: "Under Review",
    items: [
      { product: "Milk Bread", orderedQty: 120, approvedQty: 0, rejectedQty: 0, unit: "pcs" },
      { product: "Veg Puff",   orderedQty: 80,  approvedQty: 0, rejectedQty: 0, unit: "pcs" },
    ],
  },
  // ── Approved ─────────────────────────────────────────────────────────────
  {
    id: "ORD-2026-004",
    branch: "Ayappa Nagar",
    date: "Jun 21, 2026",
    time: "08:20 AM",
    priority: "Urgent",
    value: 15600,
    status: "Approved",
    items: [
      { product: "Kaju Katli", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Kalakand",   orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",  orderedQty: 6,  approvedQty: 4,  rejectedQty: 2, unit: "Kg" },
    ],
  },
  // ── Added To Production ───────────────────────────────────────────────────
  {
    id: "ORD-2026-003",
    branch: "Gayatri Nagar",
    date: "Jun 21, 2026",
    time: "08:00 AM",
    priority: "Normal",
    value: 7200,
    status: "Added To Production",
    items: [
      { product: "Kalakand",        orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
      { product: "Dry Fruit Laddu", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Production Started ────────────────────────────────────────────────────
  {
    id: "ORD-2026-002",
    branch: "Gandhi Nagar",
    date: "Jun 21, 2026",
    time: "07:30 AM",
    priority: "Normal",
    value: 9800,
    status: "Production Started",
    items: [
      { product: "Kaju Katli",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, approvedQty: 80, rejectedQty: 0, unit: "pcs" },
    ],
  },
  {
    id: "ORD-2026-009",
    branch: "Patamata",
    date: "Jun 21, 2026",
    time: "07:50 AM",
    priority: "Normal",
    value: 6200,
    status: "Production Started",
    items: [
      { product: "Kalakand",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 5,  approvedQty: 5,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Production Completed ──────────────────────────────────────────────────
  {
    id: "ORD-2026-010",
    branch: "Kanuru",
    date: "Jun 21, 2026",
    time: "07:00 AM",
    priority: "Normal",
    value: 8400,
    status: "Production Completed",
    items: [
      { product: "Rasgulla",    orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Ready For Dispatch ────────────────────────────────────────────────────
  {
    id: "ORD-2026-001",
    branch: "Benz Circle",
    date: "Jun 21, 2026",
    time: "07:15 AM",
    priority: "Urgent",
    value: 12500,
    status: "Ready For Dispatch",
    items: [
      { product: "Kalakand",  orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 5,  approvedQty: 3,  rejectedQty: 2, unit: "Kg" },
      { product: "Rasgulla",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-011",
    branch: "Poranki",
    date: "Jun 21, 2026",
    time: "07:05 AM",
    priority: "Normal",
    value: 5800,
    status: "Ready For Dispatch",
    items: [
      { product: "Dry Fruit Laddu", orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
      { product: "Kaju Katli",      orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Morning Dispatch ──────────────────────────────────────────────────────
  {
    id: "ORD-2026-012",
    branch: "Gunadala",
    date: "Jun 21, 2026",
    time: "06:45 AM",
    priority: "Normal",
    value: 4600,
    status: "Morning Dispatch",
    items: [
      { product: "Milk Bread", orderedQty: 100, approvedQty: 100, rejectedQty: 0, unit: "pcs" },
      { product: "Veg Puff",   orderedQty: 60,  approvedQty: 60,  rejectedQty: 0, unit: "pcs" },
    ],
  },
  // ── Evening Dispatch ──────────────────────────────────────────────────────
  {
    id: "ORD-2026-013",
    branch: "Machavaram",
    date: "Jun 21, 2026",
    time: "06:30 AM",
    priority: "Normal",
    value: 7100,
    status: "Evening Dispatch",
    items: [
      { product: "Gulab Jamun", orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Rasgulla",    orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── In Transit ───────────────────────────────────────────────────────────
  {
    id: "ORD-2026-014",
    branch: "Governorpet",
    date: "Jun 21, 2026",
    time: "06:00 AM",
    priority: "Normal",
    value: 6300,
    status: "In Transit",
    items: [
      { product: "Kalakand",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 4,  approvedQty: 4,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-015",
    branch: "Kanuru",
    date: "Jun 21, 2026",
    time: "05:55 AM",
    priority: "Normal",
    value: 5100,
    status: "In Transit",
    items: [
      { product: "Kaju Katli",  orderedQty: 5, approvedQty: 5, rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Delivered (awaiting invoice) ─────────────────────────────────────────
  {
    id: "ORD-2026-016",
    branch: "Gandhi Nagar",
    date: "Jun 21, 2026",
    time: "05:30 AM",
    priority: "Normal",
    value: 11200,
    status: "Delivered",
    items: [
      { product: "Kalakand",   orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Rasgulla",   orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread", orderedQty: 60, approvedQty: 60, rejectedQty: 0, unit: "pcs" },
    ],
  },
  {
    id: "ORD-2026-017",
    branch: "Gayatri Nagar",
    date: "Jun 21, 2026",
    time: "05:45 AM",
    priority: "Urgent",
    value: 8900,
    status: "Delivered",
    items: [
      { product: "Kaju Katli",  orderedQty: 8, approvedQty: 7, rejectedQty: 1, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-018",
    branch: "Patamata",
    date: "Jun 20, 2026",
    time: "06:00 AM",
    priority: "Normal",
    value: 7600,
    status: "Delivered",
    items: [
      { product: "Dry Fruit Laddu", orderedQty: 8, approvedQty: 8, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",       orderedQty: 5, approvedQty: 5, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Invoice Generated ─────────────────────────────────────────────────────
  {
    id: "ORD-2026-019",
    branch: "Benz Circle",
    date: "Jun 20, 2026",
    time: "05:30 AM",
    priority: "Normal",
    value: 9400,
    status: "Invoice Generated",
    items: [
      { product: "Kalakand",  orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 6,  approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Payment Pending ───────────────────────────────────────────────────────
  {
    id: "ORD-2026-020",
    branch: "Gannavaram",
    date: "Jun 20, 2026",
    time: "05:00 AM",
    priority: "Normal",
    value: 6800,
    status: "Payment Pending",
    items: [
      { product: "Rasgulla",    orderedQty: 10, approvedQty: 9, rejectedQty: 1, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 7,  approvedQty: 7, rejectedQty: 0, unit: "Kg" },
    ],
  },
  {
    id: "ORD-2026-021",
    branch: "Poranki",
    date: "Jun 20, 2026",
    time: "06:15 AM",
    priority: "Normal",
    value: 4900,
    status: "Payment Pending",
    items: [
      { product: "Kaju Katli", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread", orderedQty: 80, approvedQty: 80, rejectedQty: 0, unit: "pcs" },
    ],
  },
  // ── Payment Completed ─────────────────────────────────────────────────────
  {
    id: "ORD-2026-022",
    branch: "Gandhi Nagar",
    date: "Jun 19, 2026",
    time: "07:30 AM",
    priority: "Normal",
    value: 9800,
    status: "Payment Completed",
    items: [
      { product: "Kaju Katli",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, approvedQty: 80, rejectedQty: 0, unit: "pcs" },
    ],
  },
  {
    id: "ORD-2026-023",
    branch: "Machavaram",
    date: "Jun 19, 2026",
    time: "07:00 AM",
    priority: "Normal",
    value: 5600,
    status: "Payment Completed",
    items: [
      { product: "Kalakand",  orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
    ],
  },
  // ── Order Closed ──────────────────────────────────────────────────────────
  {
    id: "ORD-2026-024",
    branch: "Ayappa Nagar",
    date: "Jun 19, 2026",
    time: "07:15 AM",
    priority: "Normal",
    value: 7200,
    status: "Order Closed",
    items: [
      { product: "Dry Fruit Laddu", orderedQty: 6, approvedQty: 6, rejectedQty: 0, unit: "Kg" },
      { product: "Rasgulla",        orderedQty: 8, approvedQty: 8, rejectedQty: 0, unit: "Kg" },
    ],
  },
];

// â”€â”€ Production Requirement aggregation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Totals across all approved orders for today's production plan.
export type ProductionLifecycleStage =
  | "Planning"
  | "Ingredients Allocated"
  | "Production Started"
  | "Quality Check"
  | "Packed"
  | "Ready For Dispatch";

export const PRODUCTION_LIFECYCLE_STAGES: ProductionLifecycleStage[] = [
  "Planning",
  "Ingredients Allocated",
  "Production Started",
  "Quality Check",
  "Packed",
  "Ready For Dispatch",
];

export type ProductionRequirement = {
  product: string;
  totalRequiredKg: number;
  producedKg: number;
  totalOrders: number;
  branches: string[];
  branchBreakdown: { branch: string; qty: number; unit: string; orderId: string }[];
  status: "Not Started" | "In Production" | "Completed" | "Ready For Dispatch";
  lifecycleStage: ProductionLifecycleStage;
  morningBatch: number;
  eveningBatch: number;
  batchNumber: string;
  supervisor: string;
  eta: string;
};

export const PRODUCTION_REQUIREMENTS: ProductionRequirement[] = [
  {
    product: "Kalakand",
    totalRequiredKg: 85,
    producedKg: 60,
    totalOrders: 12,
    branches: ["Gandhi Nagar", "Gayatri Nagar", "Ayyappa Nagar", "Patamata", "Gunadala", "Poranki", "Kanuru"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 10, unit: "Kg", orderId: "ORD-2026-001" },
      { branch: "Gayatri Nagar", qty: 6,  unit: "Kg", orderId: "ORD-2026-003" },
      { branch: "Ayyappa Nagar", qty: 8,  unit: "Kg", orderId: "ORD-2026-004" },
      { branch: "Patamata",      qty: 5,  unit: "Kg", orderId: "ORD-2026-005" },
      { branch: "Poranki",       qty: 18, unit: "Kg", orderId: "ORD-2026-009" },
      { branch: "Kanuru",        qty: 15, unit: "Kg", orderId: "ORD-2026-010" },
      { branch: "Gannavaram",    qty: 23, unit: "Kg", orderId: "ORD-2026-011" },
    ],
    status: "In Production",
    lifecycleStage: "Production Started",
    morningBatch: 40,
    eveningBatch: 20,
    batchNumber: "BT-2026-141",
    supervisor: "Ravi Kumar",
    eta: "03:00 PM",
  },
  {
    product: "Milk Cake",
    totalRequiredKg: 42,
    producedKg: 25,
    totalOrders: 5,
    branches: ["Gandhi Nagar", "Ayyappa Nagar", "Patamata", "Gannavaram", "Gunadala"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 3,  unit: "Kg", orderId: "ORD-2026-001" },
      { branch: "Ayyappa Nagar", qty: 4,  unit: "Kg", orderId: "ORD-2026-004" },
      { branch: "Patamata",      qty: 3,  unit: "Kg", orderId: "ORD-2026-008" },
      { branch: "Gannavaram",    qty: 12, unit: "Kg", orderId: "ORD-2026-012" },
      { branch: "Gunadala",      qty: 20, unit: "Kg", orderId: "ORD-2026-013" },
    ],
    status: "In Production",
    lifecycleStage: "Quality Check",
    morningBatch: 15,
    eveningBatch: 17,
    batchNumber: "BT-2026-142",
    supervisor: "Srinivas Rao",
    eta: "04:30 PM",
  },
  {
    product: "Kaju Katli",
    totalRequiredKg: 68,
    producedKg: 0,
    totalOrders: 8,
    branches: ["Gandhi Nagar", "Ayyappa Nagar", "Gunadala", "Patamata", "Governorpet", "Machavaram"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 8,  unit: "Kg", orderId: "ORD-2026-002" },
      { branch: "Ayyappa Nagar", qty: 12, unit: "Kg", orderId: "ORD-2026-004" },
      { branch: "Gunadala",      qty: 3,  unit: "Kg", orderId: "ORD-2026-007" },
      { branch: "Patamata",      qty: 15, unit: "Kg", orderId: "ORD-2026-014" },
      { branch: "Governorpet",   qty: 20, unit: "Kg", orderId: "ORD-2026-015" },
      { branch: "Machavaram",    qty: 10, unit: "Kg", orderId: "ORD-2026-016" },
    ],
    status: "Not Started",
    lifecycleStage: "Ingredients Allocated",
    morningBatch: 0,
    eveningBatch: 38,
    batchNumber: "BT-2026-143",
    supervisor: "Lakshmi Devi",
    eta: "07:00 PM",
  },
  {
    product: "Rasgulla",
    totalRequiredKg: 58,
    producedKg: 58,
    totalOrders: 7,
    branches: ["Gandhi Nagar", "Gayatri Nagar", "Gannavaram", "Machavaram", "Benz Circle"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 8,  unit: "Kg", orderId: "ORD-2026-001" },
      { branch: "Gayatri Nagar", qty: 10, unit: "Kg", orderId: "ORD-2026-005" },
      { branch: "Gannavaram",    qty: 12, unit: "Kg", orderId: "ORD-2026-017" },
      { branch: "Machavaram",    qty: 14, unit: "Kg", orderId: "ORD-2026-018" },
      { branch: "Benz Circle",   qty: 14, unit: "Kg", orderId: "ORD-2026-019" },
    ],
    status: "Completed",
    lifecycleStage: "Packed",
    morningBatch: 30,
    eveningBatch: 0,
    batchNumber: "BT-2026-144",
    supervisor: "Ravi Kumar",
    eta: "Completed",
  },
  {
    product: "Gulab Jamun",
    totalRequiredKg: 48,
    producedKg: 48,
    totalOrders: 6,
    branches: ["Gandhi Nagar", "Gayatri Nagar", "Ayyappa Nagar", "Patamata"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 12, unit: "Kg", orderId: "ORD-2026-002" },
      { branch: "Gayatri Nagar", qty: 8,  unit: "Kg", orderId: "ORD-2026-005" },
      { branch: "Poranki",       qty: 14, unit: "Kg", orderId: "ORD-2026-020" },
      { branch: "Kanuru",        qty: 14, unit: "Kg", orderId: "ORD-2026-021" },
    ],
    status: "Ready For Dispatch",
    lifecycleStage: "Ready For Dispatch",
    morningBatch: 25,
    eveningBatch: 0,
    batchNumber: "BT-2026-145",
    supervisor: "Srinivas Rao",
    eta: "Ready",
  },
  {
    product: "Dry Fruit Laddu",
    totalRequiredKg: 32,
    producedKg: 0,
    totalOrders: 4,
    branches: ["Gayatri Nagar", "Patamata", "Gannavaram", "Benz Circle"],
    branchBreakdown: [
      { branch: "Gayatri Nagar", qty: 4,  unit: "Kg", orderId: "ORD-2026-003" },
      { branch: "Patamata",      qty: 4,  unit: "Kg", orderId: "ORD-2026-008" },
      { branch: "Gannavaram",    qty: 12, unit: "Kg", orderId: "ORD-2026-022" },
      { branch: "Benz Circle",   qty: 12, unit: "Kg", orderId: "ORD-2026-023" },
    ],
    status: "Not Started",
    lifecycleStage: "Planning",
    morningBatch: 0,
    eveningBatch: 32,
    batchNumber: "BT-2026-146",
    supervisor: "Lakshmi Devi",
    eta: "08:00 PM",
  },
  {
    product: "Mysore Pak",
    totalRequiredKg: 36,
    producedKg: 36,
    totalOrders: 5,
    branches: ["Gandhi Nagar", "Ayyappa Nagar", "Patamata", "Kanuru", "Poranki"],
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 8,  unit: "Kg", orderId: "ORD-2026-024" },
      { branch: "Ayyappa Nagar", qty: 6,  unit: "Kg", orderId: "ORD-2026-025" },
      { branch: "Patamata",      qty: 10, unit: "Kg", orderId: "ORD-2026-026" },
      { branch: "Kanuru",        qty: 7,  unit: "Kg", orderId: "ORD-2026-027" },
      { branch: "Poranki",       qty: 5,  unit: "Kg", orderId: "ORD-2026-028" },
    ],
    status: "Ready For Dispatch",
    lifecycleStage: "Ready For Dispatch",
    morningBatch: 36,
    eveningBatch: 0,
    batchNumber: "BT-2026-147",
    supervisor: "Ravi Kumar",
    eta: "Ready",
  },
];
export type BatchStatus = "Not Started" | "In Production" | "Completed" | "Ready For Dispatch";

export type ProductionBatch = {
  slot: "Morning" | "Evening";
  time: string;
  status: BatchStatus;
  items: { product: string; requiredQty: number; preparedQty: number; pendingQty: number; unit: string; prodStatus: BatchStatus }[];
};

export const PRODUCTION_BATCHES: ProductionBatch[] = [
  {
    slot: "Morning",
    time: "06:00 AM --- 12:00 PM",
    status: "Ready For Dispatch",
    items: [
      { product: "Kalakand",    requiredQty: 40, preparedQty: 40, pendingQty: 0,  unit: "Kg",  prodStatus: "Ready For Dispatch" },
      { product: "Milk Cake",   requiredQty: 25, preparedQty: 25, pendingQty: 0,  unit: "Kg",  prodStatus: "Completed" },
      { product: "Rasgulla",    requiredQty: 58, preparedQty: 58, pendingQty: 0,  unit: "Kg",  prodStatus: "Ready For Dispatch" },
      { product: "Gulab Jamun", requiredQty: 48, preparedQty: 48, pendingQty: 0,  unit: "Kg",  prodStatus: "Ready For Dispatch" },
      { product: "Milk Bread",  requiredQty: 200, preparedQty: 200, pendingQty: 0, unit: "pcs", prodStatus: "Completed" },
    ],
  },
  {
    slot: "Evening",
    time: "02:00 PM - 08:00 PM",
    status: "In Production",
    items: [
      { product: "Kalakand",       requiredQty: 45, preparedQty: 20, pendingQty: 25, unit: "Kg",  prodStatus: "In Production" },
      { product: "Kaju Katli",     requiredQty: 68, preparedQty: 30, pendingQty: 38, unit: "Kg",  prodStatus: "In Production" },
      { product: "Milk Cake",      requiredQty: 17, preparedQty: 0,  pendingQty: 17, unit: "Kg",  prodStatus: "Not Started" },
      { product: "Dry Fruit Laddu",requiredQty: 32, preparedQty: 0,  pendingQty: 32, unit: "Kg",  prodStatus: "Not Started" },
    ],
  },
];

// â”€â”€ Dashboard workflow KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const WORKFLOW_DASHBOARD_KPI = {
  todaysOrders: 24,
  pendingApprovals: 8,
  productionRequired: "275 Kg",
  inProduction: 5,
  readyForDispatch: 4,
  inTransit: 2,
  deliveredAwaitingInvoice: 3,
  paymentPending: 2,
};

// â”€â”€ Operations Command Center â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const OPS_COMMAND_CENTER = {
  totalOrders: 24,
  totalProduction: "275 Kg",
  morningDispatch: 12,
  eveningDispatch: 9,
  collections: "₹42,000",
  outstanding: "₹18,500",
  urgentOrders: 4,
};

// â”€â”€ Urgent Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const URGENT_ORDERS_DASHBOARD = [
  { orderId: "ORD-2026-001", branch: "Benz Circle",    product: "Kalakand",   qty: 10, unit: "Kg",  requiredBefore: "10:00 AM" },
  { orderId: "ORD-2026-004", branch: "Ayyappa Nagar",  product: "Kaju Katli", qty: 12, unit: "Kg",  requiredBefore: "11:00 AM" },
  { orderId: "ORD-2026-004", branch: "Ayyappa Nagar",  product: "Kalakand",   qty: 8,  unit: "Kg",  requiredBefore: "11:00 AM" },
  { orderId: "ORD-2026-009", branch: "Patamata",       product: "Milk Cake",  qty: 6,  unit: "Kg",  requiredBefore: "12:00 PM" },
];

// â”€â”€ Production Demand Aggregator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type ProductionDemandItem = {
  product: string;
  totalKg: number;
  branchBreakdown: { branch: string; qty: number; unit: string }[];
};

export const PRODUCTION_DEMAND: ProductionDemandItem[] = [
  {
    product: "Kalakand",
    totalKg: 85,
    branchBreakdown: [
      { branch: "Benz Circle",   qty: 20, unit: "Kg" },
      { branch: "Ayyappa Nagar", qty: 15, unit: "Kg" },
      { branch: "Gayatri Nagar", qty: 30, unit: "Kg" },
      { branch: "Gunadala",      qty: 20, unit: "Kg" },
    ],
  },
  {
    product: "Milk Cake",
    totalKg: 42,
    branchBreakdown: [
      { branch: "Benz Circle",   qty: 12, unit: "Kg" },
      { branch: "Ayyappa Nagar", qty: 10, unit: "Kg" },
      { branch: "Governerpet",   qty: 8,  unit: "Kg" },
      { branch: "Gannavaram",    qty: 12, unit: "Kg" },
    ],
  },
  {
    product: "Kaju Katli",
    totalKg: 31,
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 8,  unit: "Kg" },
      { branch: "Ayyappa Nagar", qty: 12, unit: "Kg" },
      { branch: "Gunadala",      qty: 11, unit: "Kg" },
    ],
  },
  {
    product: "Rasgulla",
    totalKg: 58,
    branchBreakdown: [
      { branch: "Benz Circle",   qty: 8,  unit: "Kg" },
      { branch: "Gannavaram",    qty: 18, unit: "Kg" },
      { branch: "Machavaram",    qty: 16, unit: "Kg" },
      { branch: "Governerpet",   qty: 16, unit: "Kg" },
    ],
  },
  {
    product: "Gulab Jamun",
    totalKg: 48,
    branchBreakdown: [
      { branch: "Gandhi Nagar",  qty: 12, unit: "Kg" },
      { branch: "Gannavaram",    qty: 8,  unit: "Kg" },
      { branch: "Poranki",       qty: 14, unit: "Kg" },
      { branch: "Kanuru",        qty: 14, unit: "Kg" },
    ],
  },
  {
    product: "Dry Fruit Laddu",
    totalKg: 32,
    branchBreakdown: [
      { branch: "Gayatri Nagar", qty: 8,  unit: "Kg" },
      { branch: "Auto Nagar",    qty: 12, unit: "Kg" },
      { branch: "Benz Circle",   qty: 12, unit: "Kg" },
    ],
  },
];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// BRANCH PORTAL PHASE-2 --- My Orders enriched data
// Same orders as warehouse workflow --- branch views same lifecycle.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export type BranchOrderLifecycle =
  | "Order Placed"
  | "Warehouse Review"
  | "Approved"
  | "Added To Production"
  | "Production Started"
  | "Production Completed"
  | "Ready For Dispatch"
  | "Morning Dispatch"
  | "Evening Dispatch"
  | "In Transit"
  | "Delivered"
  | "Invoice Generated"
  | "Payment Pending"
  | "Payment Completed"
  | "Order Closed";

export type DispatchSlot = {
  slot: "Morning" | "Evening";
  representative: string;
  vehicle: string;
  products: { name: string; qty: number; unit: string }[];
  status: "Scheduled" | "Dispatched" | "Delivered";
  time: string;
};

export type DeliveryLine = {
  product: string;
  orderedQty: number;
  deliveredQty: number;
  receivedQty: number;
  differenceQty: number;
  unit: string;
  reason?: string;
};

export type PaymentIntent = "Ready To Pay" | "Will Pay Later" | "Payment Pending" | "Payment Completed";

export type PaymentHistoryEntry = {
  date: string;
  amount: number;
  method: string;
  reference: string;
  status: "Completed" | "Pending";
};

export type BranchOrderDetail = {
  orderId: string;
  branch: string;
  orderDate: string;
  orderTime: string;
  expectedDelivery: string;
  priority: OrderPriority;
  lifecycleStatus: BranchOrderLifecycle;
  orderValue: number;
  deliveredValue: number;
  cancelledValue: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentIntent: PaymentIntent;
  invoiceNumber?: string;
  scenario: "full-delivery" | "partial-delivery" | "urgent" | "festival" | "payment-pending" | "payment-completed";
  items: WorkflowOrderItem[];
  dispatches: DispatchSlot[];
  deliveries: DeliveryLine[];
  paymentHistory: PaymentHistoryEntry[];
  timelineEvents: { label: BranchOrderLifecycle; timestamp: string; done: boolean; current: boolean }[];
};

// â”€â”€ All lifecycle steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ALL_STEPS: BranchOrderLifecycle[] = [
  "Order Placed", "Warehouse Review", "Approved", "Added To Production",
  "Production Started", "Production Completed", "Ready For Dispatch",
  "Morning Dispatch", "Evening Dispatch", "In Transit",
  "Delivered", "Invoice Generated", "Payment Pending", "Payment Completed", "Order Closed",
];

function buildTimeline(current: BranchOrderLifecycle, timestamps: Partial<Record<BranchOrderLifecycle, string>>) {
  const idx = ALL_STEPS.indexOf(current);
  return ALL_STEPS.map((step, i) => ({
    label: step,
    timestamp: timestamps[step] ?? (i < idx ? "Jun 17, 2026" : "---"),
    done: i < idx,
    current: i === idx,
  }));
}

// â”€â”€ Branch My Orders --- 6 real business scenarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const BRANCH_MY_ORDERS: BranchOrderDetail[] = [
  // â”€â”€ 1. READY FOR DISPATCH (urgent, Benz Circle = ORD-2026-001) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    orderId: "ORD-2026-001",
    branch: "Benz Circle",
    orderDate: "Jun 17, 2026",
    orderTime: "07:15 AM",
    expectedDelivery: "Jun 17, 2026 --- 04:00 PM",
    priority: "Urgent",
    lifecycleStatus: "Ready For Dispatch",
    orderValue: 12500,
    deliveredValue: 0,
    cancelledValue: 1800,
    paidAmount: 0,
    outstandingAmount: 10700,
    paymentIntent: "Payment Pending",
    invoiceNumber: undefined,
    scenario: "urgent",
    items: [
      { product: "Kalakand",  orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake", orderedQty: 5,  approvedQty: 3,  rejectedQty: 2, unit: "Kg" },
      { product: "Rasgulla",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "06:30 AM", representative: "Ramesh Kumar",
        vehicle: "AP 16 AB 1234",
        products: [{ name: "Kalakand", qty: 10, unit: "Kg" }, { name: "Rasgulla", qty: 8, unit: "Kg" }],
        status: "Scheduled",
      },
      {
        slot: "Morning", time: "06:00 AM", representative: "Suresh Rao",
        vehicle: "AP 29 BX 7734",
        products: [{ name: "Milk Cake", qty: 3, unit: "Kg" }],
        status: "Scheduled",
      },
    ],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Ready For Dispatch", {
      "Order Placed": "Jun 17, 2026 07:15 AM",
      "Warehouse Review": "Jun 17, 2026 07:30 AM",
      "Approved": "Jun 17, 2026 08:00 AM",
      "Added To Production": "Jun 17, 2026 08:15 AM",
      "Production Started": "Jun 17, 2026 09:00 AM",
    }),
  },

  // â”€â”€ 2. FULLY DELIVERED + PAYMENT COMPLETED (Gandhi Nagar = ORD-2026-002) â”€â”€
  {
    orderId: "ORD-2026-002",
    branch: "Gandhi Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "07:30 AM",
    expectedDelivery: "Jun 17, 2026 --- 12:00 PM",
    priority: "Normal",
    lifecycleStatus: "Payment Completed",
    orderValue: 9800,
    deliveredValue: 9800,
    cancelledValue: 0,
    paidAmount: 9800,
    outstandingAmount: 0,
    paymentIntent: "Payment Completed",
    invoiceNumber: "INV-2026-2001",
    scenario: "payment-completed",
    items: [
      { product: "Kaju Katli",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, approvedQty: 80, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "08:00 AM", representative: "Venkat Reddy",
        vehicle: "AP 29 CR 1190",
        products: [{ name: "Kaju Katli", qty: 8, unit: "Kg" }, { name: "Gulab Jamun", qty: 12, unit: "Kg" }, { name: "Milk Bread", qty: 80, unit: "pcs" }],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Kaju Katli",  orderedQty: 8,  deliveredQty: 8,  receivedQty: 7.9, differenceQty: 0.1, unit: "Kg", reason: "Weight variation" },
      { product: "Gulab Jamun", orderedQty: 12, deliveredQty: 12, receivedQty: 12,  differenceQty: 0,   unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, deliveredQty: 80, receivedQty: 80,  differenceQty: 0,   unit: "pcs" },
    ],
    paymentHistory: [
      { date: "Jun 17, 2026", amount: 9800, method: "UPI", reference: "UPI202606170201", status: "Completed" },
    ],
    timelineEvents: buildTimeline("Payment Completed", {
      "Order Placed": "Jun 17, 2026 07:30 AM",
      "Warehouse Review": "Jun 17, 2026 07:45 AM",
      "Approved": "Jun 17, 2026 08:00 AM",
      "Added To Production": "Jun 17, 2026 08:10 AM",
      "Production Started": "Jun 17, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 17, 2026 10:30 AM",
      "Morning Dispatch": "Jun 17, 2026 11:00 AM",
      "Delivered": "Jun 17, 2026 11:50 AM",
      "Invoice Generated": "Jun 17, 2026 12:00 PM",
      "Payment Completed": "Jun 17, 2026 12:15 PM",
    }),
  },

  // â”€â”€ 3. PARTIAL DELIVERY + PAYMENT PENDING (Gayatri Nagar = ORD-2026-003) â”€â”€
  {
    orderId: "ORD-2026-003",
    branch: "Gayatri Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "08:00 AM",
    expectedDelivery: "Jun 17, 2026 --- 02:00 PM",
    priority: "Normal",
    lifecycleStatus: "Invoice Generated",
    orderValue: 7200,
    deliveredValue: 5040,
    cancelledValue: 2160,
    paidAmount: 0,
    outstandingAmount: 5040,
    paymentIntent: "Payment Pending",
    invoiceNumber: "INV-2026-2002",
    scenario: "partial-delivery",
    items: [
      { product: "Kalakand",       orderedQty: 6, approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
      { product: "Dry Fruit Laddu", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "09:00 AM", representative: "Naresh Babu",
        vehicle: "AP 29 AT 4521",
        products: [{ name: "Kalakand", qty: 4, unit: "Kg" }, { name: "Dry Fruit Laddu", qty: 3, unit: "Kg" }],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Kalakand",       orderedQty: 6, deliveredQty: 4, receivedQty: 4,  differenceQty: 2, unit: "Kg", reason: "Short supply from production" },
      { product: "Dry Fruit Laddu", orderedQty: 4, deliveredQty: 3, receivedQty: 3, differenceQty: 1, unit: "Kg", reason: "Stock unavailable" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Invoice Generated", {
      "Order Placed": "Jun 17, 2026 08:00 AM",
      "Warehouse Review": "Jun 17, 2026 08:15 AM",
      "Approved": "Jun 17, 2026 08:30 AM",
      "Added To Production": "Jun 17, 2026 08:45 AM",
      "Production Started": "Jun 17, 2026 09:30 AM",
      "Ready For Dispatch": "Jun 17, 2026 11:00 AM",
      "Morning Dispatch": "Jun 17, 2026 11:30 AM",
      "Delivered": "Jun 17, 2026 01:45 PM",
      "Invoice Generated": "Jun 17, 2026 02:00 PM",
    }),
  },

  // â”€â”€ 4. PRODUCTION STARTED + URGENT (Ayyappa Nagar = ORD-2026-004) â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    orderId: "ORD-2026-004",
    branch: "Ayyappa Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "08:20 AM",
    expectedDelivery: "Jun 17, 2026 --- 05:00 PM",
    priority: "Urgent",
    lifecycleStatus: "Production Started",
    orderValue: 15600,
    deliveredValue: 0,
    cancelledValue: 1400,
    paidAmount: 0,
    outstandingAmount: 14200,
    paymentIntent: "Payment Pending",
    invoiceNumber: undefined,
    scenario: "urgent",
    items: [
      { product: "Kaju Katli", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Kalakand",   orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",  orderedQty: 6,  approvedQty: 4,  rejectedQty: 2, unit: "Kg" },
    ],
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Production Started", {
      "Order Placed": "Jun 17, 2026 08:20 AM",
      "Warehouse Review": "Jun 17, 2026 08:35 AM",
      "Approved": "Jun 17, 2026 09:00 AM",
      "Added To Production": "Jun 17, 2026 09:15 AM",
    }),
  },

  // â”€â”€ 5. FESTIVAL ADVANCE ORDER (Gunadala = ORD-2026-007) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    orderId: "ORD-2026-007",
    branch: "Gunadala",
    orderDate: "Jun 17, 2026",
    orderTime: "09:30 AM",
    expectedDelivery: "Jun 20, 2026 --- 08:00 AM",
    priority: "Normal",
    lifecycleStatus: "Warehouse Review",
    orderValue: 4200,
    deliveredValue: 0,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: 4200,
    paymentIntent: "Will Pay Later",
    invoiceNumber: undefined,
    scenario: "festival",
    items: [
      { product: "Kalakand",   orderedQty: 5,  approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Kaju Katli", orderedQty: 3,  approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Warehouse Review", {
      "Order Placed": "Jun 17, 2026 09:30 AM",
    }),
  },

  // â”€â”€ 6. DELIVERED PARTIAL + PAYMENT PENDING (Gannavaram = ORD-2026-005) â”€â”€â”€â”€
  {
    orderId: "ORD-2026-005",
    branch: "Gannavaram",
    orderDate: "Jun 17, 2026",
    orderTime: "08:45 AM",
    expectedDelivery: "Jun 17, 2026 --- 03:00 PM",
    priority: "Normal",
    lifecycleStatus: "Delivered",
    orderValue: 5400,
    deliveredValue: 4050,
    cancelledValue: 1350,
    paidAmount: 0,
    outstandingAmount: 4050,
    paymentIntent: "Ready To Pay",
    invoiceNumber: "INV-2026-2003",
    scenario: "payment-pending",
    items: [
      { product: "Rasgulla",    orderedQty: 10, approvedQty: 7,  rejectedQty: 3, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [
      {
        slot: "Evening", time: "05:00 PM", representative: "Kiran Varma",
        vehicle: "AP 29 DM 3312",
        products: [{ name: "Rasgulla", qty: 7, unit: "Kg" }, { name: "Gulab Jamun", qty: 8, unit: "Kg" }],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Rasgulla",    orderedQty: 10, deliveredQty: 7, receivedQty: 7,   differenceQty: 3, unit: "Kg", reason: "Short supply --- 3 Kg cancelled" },
      { product: "Gulab Jamun", orderedQty: 8,  deliveredQty: 8, receivedQty: 7.8, differenceQty: 0.2, unit: "Kg", reason: "Weight variation" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Delivered", {
      "Order Placed": "Jun 17, 2026 08:45 AM",
      "Warehouse Review": "Jun 17, 2026 09:00 AM",
      "Approved": "Jun 17, 2026 09:30 AM",
      "Added To Production": "Jun 17, 2026 09:45 AM",
      "Production Started": "Jun 17, 2026 10:30 AM",
      "Ready For Dispatch": "Jun 17, 2026 12:00 PM",
      "Morning Dispatch": "Jun 17, 2026 12:30 PM",
    }),
  },
];

// â”€â”€ Per-item production status visible to branch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type BranchProductionStatus = {
  product: string;
  status: "Awaiting Production" | "In Production" | "Completed" | "Ready For Dispatch";
  pct: number;
};

export const BRANCH_PRODUCTION_STATUS: Record<string, BranchProductionStatus[]> = {
  "ORD-2026-001": [
    { product: "Kalakand",  status: "Ready For Dispatch", pct: 100 },
    { product: "Milk Cake", status: "In Production",      pct: 65 },
    { product: "Rasgulla",  status: "Ready For Dispatch", pct: 100 },
  ],
  "ORD-2026-002": [
    { product: "Kaju Katli",  status: "Ready For Dispatch", pct: 100 },
    { product: "Gulab Jamun", status: "Ready For Dispatch", pct: 100 },
    { product: "Milk Bread",  status: "Ready For Dispatch", pct: 100 },
  ],
  "ORD-2026-004": [
    { product: "Kaju Katli", status: "In Production",       pct: 40 },
    { product: "Kalakand",   status: "In Production",       pct: 75 },
    { product: "Milk Cake",  status: "Awaiting Production", pct: 0 },
  ],
};

// â”€â”€ Branch dashboard workflow KPI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const BRANCH_WORKFLOW_KPI = {
  todaysOrders: 6,
  inProduction: 2,
  readyForDispatch: 1,
  pendingDeliveries: 1,
  outstandingPayments: "₹19,990",
  advanceOrders: 1,
};

// ── Branch Order Intelligence — per-product history hints shown in Place Order ──
export type OrderIntelligence = {
  product: string;
  unit: string;
  PreviousQty: number;
  lastWeekAvg: number;
  suggestedQty: number;
  badge?: "Festival Order" | "Weekend Demand" | "Special Event";
};

export const BRANCH_ORDER_INTELLIGENCE: OrderIntelligence[] = [
  { product: "Kalakand",        unit: "Kg",  PreviousQty: 8,   lastWeekAvg: 7,   suggestedQty: 10 },
  { product: "Milk Cake",       unit: "Kg",  PreviousQty: 4,   lastWeekAvg: 4,   suggestedQty: 5 },
  { product: "Kaju Katli",      unit: "Kg",  PreviousQty: 6,   lastWeekAvg: 5,   suggestedQty: 8,  badge: "Festival Order" },
  { product: "Rasgulla",        unit: "Kg",  PreviousQty: 10,  lastWeekAvg: 9,   suggestedQty: 12 },
  { product: "Gulab Jamun",     unit: "Kg",  PreviousQty: 8,   lastWeekAvg: 8,   suggestedQty: 10 },
  { product: "Dry Fruit Laddu", unit: "Kg",  PreviousQty: 3,   lastWeekAvg: 3,   suggestedQty: 4 },
  { product: "Mysore Pak",      unit: "Kg",  PreviousQty: 2,   lastWeekAvg: 2,   suggestedQty: 3 },
  { product: "Milk Bread",      unit: "pcs", PreviousQty: 80,  lastWeekAvg: 75,  suggestedQty: 100, badge: "Weekend Demand" },
  { product: "Veg Puff",        unit: "pcs", PreviousQty: 60,  lastWeekAvg: 55,  suggestedQty: 80 },
  { product: "Egg Puff",        unit: "pcs", PreviousQty: 40,  lastWeekAvg: 38,  suggestedQty: 50 },
  { product: "Cream Roll",      unit: "pcs", PreviousQty: 30,  lastWeekAvg: 28,  suggestedQty: 40 },
  { product: "Samosa",          unit: "pcs", PreviousQty: 50,  lastWeekAvg: 45,  suggestedQty: 60 },
  { product: "Boondi Laddu",    unit: "Kg",  PreviousQty: 3,   lastWeekAvg: 3,   suggestedQty: 4,  badge: "Festival Order" },
  { product: "Motichoor Laddu", unit: "Kg",  PreviousQty: 4,   lastWeekAvg: 3,   suggestedQty: 5 },
  { product: "Badam Milk",      unit: "ltr", PreviousQty: 10,  lastWeekAvg: 10,  suggestedQty: 12 },
  { product: "Tea",             unit: "ltr", PreviousQty: 20,  lastWeekAvg: 18,  suggestedQty: 25 },
  { product: "Coffee",          unit: "ltr", PreviousQty: 15,  lastWeekAvg: 14,  suggestedQty: 18 },
  { product: "Apple Juice",     unit: "ltr", PreviousQty: 6,   lastWeekAvg: 5,   suggestedQty: 8 },
  { product: "Lassi",           unit: "ltr", PreviousQty: 8,   lastWeekAvg: 7,   suggestedQty: 10 },
  { product: "Brown Bread",     unit: "pcs", PreviousQty: 40,  lastWeekAvg: 38,  suggestedQty: 50 },
];

// ── Additional BRANCH_MY_ORDERS for Gayatri Nagar, Ayyappa Nagar, Gannavaram ──
export const EXTRA_BRANCH_ORDERS: BranchOrderDetail[] = [
  // ── Gayatri Nagar — Regular daily order (delivered, payment pending) ──
  {
    orderId: "ORD-2026-101",
    branch: "Gayatri Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "07:45 AM",
    expectedDelivery: "Jun 17, 2026 — 01:00 PM",
    priority: "Normal",
    lifecycleStatus: "Delivered",
    orderValue: 6800,
    deliveredValue: 6800,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: 6800,
    paymentIntent: "Ready To Pay",
    invoiceNumber: "INV-2026-3001",
    scenario: "payment-pending",
    items: [
      { product: "Kalakand",    orderedQty: 6,  approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 60, approvedQty: 60, rejectedQty: 0, unit: "pcs" },
      { product: "Veg Puff",    orderedQty: 50, approvedQty: 50, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [{
      slot: "Morning", time: "10:00 AM", representative: "Prasad Rao",
      vehicle: "AP 29 GR 5521",
      products: [{ name: "Kalakand", qty: 6, unit: "Kg" }, { name: "Milk Bread", qty: 60, unit: "pcs" }, { name: "Veg Puff", qty: 50, unit: "pcs" }],
      status: "Delivered",
    }],
    deliveries: [
      { product: "Kalakand",   orderedQty: 6,  deliveredQty: 6,  receivedQty: 6,  differenceQty: 0, unit: "Kg" },
      { product: "Milk Bread", orderedQty: 60, deliveredQty: 60, receivedQty: 60, differenceQty: 0, unit: "pcs" },
      { product: "Veg Puff",   orderedQty: 50, deliveredQty: 50, receivedQty: 50, differenceQty: 0, unit: "pcs" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Delivered", {
      "Order Placed": "Jun 17, 2026 07:45 AM",
      "Warehouse Review": "Jun 17, 2026 08:00 AM",
      "Approved": "Jun 17, 2026 08:15 AM",
      "Added To Production": "Jun 17, 2026 08:30 AM",
      "Production Started": "Jun 17, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 17, 2026 09:45 AM",
      "Morning Dispatch": "Jun 17, 2026 10:00 AM",
    }),
  },

  // ── Gayatri Nagar — Festival order (under review) ──
  {
    orderId: "ORD-2026-102",
    branch: "Gayatri Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "09:15 AM",
    expectedDelivery: "Jun 20, 2026 — 08:00 AM",
    priority: "Urgent",
    lifecycleStatus: "Warehouse Review",
    orderValue: 14500,
    deliveredValue: 0,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: 14500,
    paymentIntent: "Payment Pending",
    invoiceNumber: undefined,
    scenario: "festival",
    items: [
      { product: "Kaju Katli",      orderedQty: 25, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Boondi Laddu",    orderedQty: 15, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Motichoor Laddu", orderedQty: 10, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Warehouse Review", {
      "Order Placed": "Jun 17, 2026 09:15 AM",
    }),
  },

  // ── Gayatri Nagar — Bulk order fully paid ──
  {
    orderId: "ORD-2026-103",
    branch: "Gayatri Nagar",
    orderDate: "Jun 16, 2026",
    orderTime: "08:00 AM",
    expectedDelivery: "Jun 16, 2026 — 12:00 PM",
    priority: "Normal",
    lifecycleStatus: "Payment Completed",
    orderValue: 8900,
    deliveredValue: 8900,
    cancelledValue: 0,
    paidAmount: 8900,
    outstandingAmount: 0,
    paymentIntent: "Payment Completed",
    invoiceNumber: "INV-2026-3002",
    scenario: "payment-completed",
    items: [
      { product: "Rasgulla",    orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [{
      slot: "Morning", time: "09:30 AM", representative: "Suresh Rao",
      vehicle: "AP 29 GR 5521",
      products: [{ name: "Rasgulla", qty: 12, unit: "Kg" }, { name: "Gulab Jamun", qty: 10, unit: "Kg" }],
      status: "Delivered",
    }],
    deliveries: [
      { product: "Rasgulla",    orderedQty: 12, deliveredQty: 12, receivedQty: 12, differenceQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 10, deliveredQty: 10, receivedQty: 10, differenceQty: 0, unit: "Kg" },
    ],
    paymentHistory: [{ date: "Jun 16, 2026", amount: 8900, method: "NEFT", reference: "NFT202606160101", status: "Completed" }],
    timelineEvents: buildTimeline("Payment Completed", {
      "Order Placed": "Jun 16, 2026 08:00 AM",
      "Warehouse Review": "Jun 16, 2026 08:15 AM",
      "Approved": "Jun 16, 2026 08:30 AM",
      "Added To Production": "Jun 16, 2026 08:45 AM",
      "Production Started": "Jun 16, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 16, 2026 09:15 AM",
      "Morning Dispatch": "Jun 16, 2026 09:30 AM",
      "Delivered": "Jun 16, 2026 11:45 AM",
      "Invoice Generated": "Jun 16, 2026 12:00 PM",
      "Payment Completed": "Jun 16, 2026 02:00 PM",
    }),
  },

  // ── Ayyappa Nagar — Urgent (production started) — already in BRANCH_MY_ORDERS as ORD-2026-004
  // Adding a normal daily + a delivered order

  // ── Ayyappa Nagar — Daily order fully delivered, payment pending ──
  {
    orderId: "ORD-2026-201",
    branch: "Ayyappa Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "07:00 AM",
    expectedDelivery: "Jun 17, 2026 — 11:00 AM",
    priority: "Normal",
    lifecycleStatus: "Invoice Generated",
    orderValue: 11200,
    deliveredValue: 10500,
    cancelledValue: 700,
    paidAmount: 0,
    outstandingAmount: 10500,
    paymentIntent: "Payment Pending",
    invoiceNumber: "INV-2026-4001",
    scenario: "partial-delivery",
    items: [
      { product: "Kalakand",   orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",  orderedQty: 5,  approvedQty: 4,  rejectedQty: 1, unit: "Kg" },
      { product: "Kaju Katli", orderedQty: 6,  approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
      { product: "Cream Roll", orderedQty: 40, approvedQty: 40, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [{
      slot: "Morning", time: "08:30 AM", representative: "Venkat Reddy",
      vehicle: "AP 29 AN 8812",
      products: [{ name: "Kalakand", qty: 8, unit: "Kg" }, { name: "Milk Cake", qty: 4, unit: "Kg" }, { name: "Kaju Katli", qty: 6, unit: "Kg" }, { name: "Cream Roll", qty: 40, unit: "pcs" }],
      status: "Delivered",
    }],
    deliveries: [
      { product: "Kalakand",   orderedQty: 8,  deliveredQty: 8,  receivedQty: 8,  differenceQty: 0,   unit: "Kg" },
      { product: "Milk Cake",  orderedQty: 5,  deliveredQty: 4,  receivedQty: 4,  differenceQty: 1,   unit: "Kg", reason: "Short supply" },
      { product: "Kaju Katli", orderedQty: 6,  deliveredQty: 6,  receivedQty: 5.9, differenceQty: 0.1, unit: "Kg", reason: "Weight variation" },
      { product: "Cream Roll", orderedQty: 40, deliveredQty: 40, receivedQty: 40, differenceQty: 0,   unit: "pcs" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Invoice Generated", {
      "Order Placed": "Jun 17, 2026 07:00 AM",
      "Warehouse Review": "Jun 17, 2026 07:15 AM",
      "Approved": "Jun 17, 2026 07:30 AM",
      "Added To Production": "Jun 17, 2026 07:45 AM",
      "Production Started": "Jun 17, 2026 08:00 AM",
      "Ready For Dispatch": "Jun 17, 2026 08:15 AM",
      "Morning Dispatch": "Jun 17, 2026 08:30 AM",
      "Delivered": "Jun 17, 2026 10:30 AM",
      "Invoice Generated": "Jun 17, 2026 11:00 AM",
    }),
  },

  // ── Ayyappa Nagar — Weekend special event order ──
  {
    orderId: "ORD-2026-202",
    branch: "Ayyappa Nagar",
    orderDate: "Jun 17, 2026",
    orderTime: "10:00 AM",
    expectedDelivery: "Jun 21, 2026 — 08:00 AM",
    priority: "Normal",
    lifecycleStatus: "Order Placed",
    orderValue: 18000,
    deliveredValue: 0,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: 18000,
    paymentIntent: "Will Pay Later",
    invoiceNumber: undefined,
    scenario: "festival",
    items: [
      { product: "Kaju Katli",      orderedQty: 20, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Dry Fruit Laddu", orderedQty: 10, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Boondi Laddu",    orderedQty: 12, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Rasgulla",        orderedQty: 15, approvedQty: 0, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Order Placed", { "Order Placed": "Jun 17, 2026 10:00 AM" }),
  },

  // ── Gannavaram — Regular order (in production) ──
  {
    orderId: "ORD-2026-301",
    branch: "Gannavaram",
    orderDate: "Jun 17, 2026",
    orderTime: "07:30 AM",
    expectedDelivery: "Jun 17, 2026 — 03:00 PM",
    priority: "Normal",
    lifecycleStatus: "Production Started",
    orderValue: 7600,
    deliveredValue: 0,
    cancelledValue: 0,
    paidAmount: 0,
    outstandingAmount: 7600,
    paymentIntent: "Payment Pending",
    invoiceNumber: undefined,
    scenario: "full-delivery",
    items: [
      { product: "Milk Bread",  orderedQty: 100, approvedQty: 100, rejectedQty: 0, unit: "pcs" },
      { product: "Veg Puff",    orderedQty: 80,  approvedQty: 80,  rejectedQty: 0, unit: "pcs" },
      { product: "Samosa",      orderedQty: 60,  approvedQty: 60,  rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [],
    deliveries: [],
    paymentHistory: [],
    timelineEvents: buildTimeline("Production Started", {
      "Order Placed": "Jun 17, 2026 07:30 AM",
      "Warehouse Review": "Jun 17, 2026 07:45 AM",
      "Approved": "Jun 17, 2026 08:00 AM",
      "Added To Production": "Jun 17, 2026 08:15 AM",
    }),
  },

  // ── Gannavaram — Paid order (Previous) ──
  {
    orderId: "ORD-2026-302",
    branch: "Gannavaram",
    orderDate: "Jun 16, 2026",
    orderTime: "08:00 AM",
    expectedDelivery: "Jun 16, 2026 — 01:00 PM",
    priority: "Normal",
    lifecycleStatus: "Payment Completed",
    orderValue: 5400,
    deliveredValue: 5400,
    cancelledValue: 0,
    paidAmount: 5400,
    outstandingAmount: 0,
    paymentIntent: "Payment Completed",
    invoiceNumber: "INV-2026-5001",
    scenario: "payment-completed",
    items: [
      { product: "Rasgulla",    orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 6,  approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",   orderedQty: 3,  approvedQty: 3,  rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [{
      slot: "Morning", time: "10:30 AM", representative: "Kiran Varma",
      vehicle: "AP 29 GV 2201",
      products: [{ name: "Rasgulla", qty: 8, unit: "Kg" }, { name: "Gulab Jamun", qty: 6, unit: "Kg" }, { name: "Milk Cake", qty: 3, unit: "Kg" }],
      status: "Delivered",
    }],
    deliveries: [
      { product: "Rasgulla",    orderedQty: 8, deliveredQty: 8, receivedQty: 8, differenceQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 6, deliveredQty: 6, receivedQty: 6, differenceQty: 0, unit: "Kg" },
      { product: "Milk Cake",   orderedQty: 3, deliveredQty: 3, receivedQty: 3, differenceQty: 0, unit: "Kg" },
    ],
    paymentHistory: [{ date: "Jun 16, 2026", amount: 5400, method: "UPI", reference: "UPI202606160301", status: "Completed" }],
    timelineEvents: buildTimeline("Payment Completed", {
      "Order Placed": "Jun 16, 2026 08:00 AM",
      "Warehouse Review": "Jun 16, 2026 08:15 AM",
      "Approved": "Jun 16, 2026 08:30 AM",
      "Added To Production": "Jun 16, 2026 08:45 AM",
      "Production Started": "Jun 16, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 16, 2026 10:00 AM",
      "Morning Dispatch": "Jun 16, 2026 10:30 AM",
      "Delivered": "Jun 16, 2026 12:30 PM",
      "Invoice Generated": "Jun 16, 2026 01:00 PM",
      "Payment Completed": "Jun 16, 2026 03:00 PM",
    }),
  },
];

// Merge extra orders into the main list
BRANCH_MY_ORDERS.push(...EXTRA_BRANCH_ORDERS);

// -- Gandhi Nagar - Full lifecycle demo set (10 orders, one per stage) ---------
export const GANDHI_NAGAR_ORDERS: BranchOrderDetail[] = [
  // 1. Warehouse Review
  {
    orderId: "ORD-GN-101", branch: "Gandhi Nagar",
    orderDate: "Jun 19, 2026", orderTime: "07:10 AM",
    expectedDelivery: "Jun 19, 2026 - 01:00 PM",
    priority: "Normal", lifecycleStatus: "Warehouse Review",
    orderValue: 8400, deliveredValue: 0, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 8400,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "full-delivery",
    items: [
      { product: "Kalakand",    orderedQty: 8,  approvedQty: 0, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, approvedQty: 0, rejectedQty: 0, unit: "pcs" },
      { product: "Veg Puff",    orderedQty: 60, approvedQty: 0, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [], deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Warehouse Review", {
      "Order Placed": "Jun 19, 2026 07:10 AM",
    }),
  },

  // 2. Approved
  {
    orderId: "ORD-GN-102", branch: "Gandhi Nagar",
    orderDate: "Jun 19, 2026", orderTime: "07:25 AM",
    expectedDelivery: "Jun 19, 2026 - 01:00 PM",
    priority: "Urgent", lifecycleStatus: "Approved",
    orderValue: 12600, deliveredValue: 0, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 12600,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "urgent",
    items: [
      { product: "Kaju Katli",  orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Cake",   orderedQty: 6,  approvedQty: 5,  rejectedQty: 1, unit: "Kg" },
    ],
    dispatches: [], deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Approved", {
      "Order Placed":     "Jun 19, 2026 07:25 AM",
      "Warehouse Review": "Jun 19, 2026 07:40 AM",
    }),
  },

  // 3. Production Started
  {
    orderId: "ORD-GN-103", branch: "Gandhi Nagar",
    orderDate: "Jun 19, 2026", orderTime: "07:45 AM",
    expectedDelivery: "Jun 19, 2026 - 02:00 PM",
    priority: "Normal", lifecycleStatus: "Production Started",
    orderValue: 7200, deliveredValue: 0, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 7200,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "full-delivery",
    items: [
      { product: "Rasgulla",    orderedQty: 10, approvedQty: 10, rejectedQty: 0, unit: "Kg" },
      { product: "Dry Fruit Laddu", orderedQty: 4, approvedQty: 4, rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [], deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Production Started", {
      "Order Placed":          "Jun 19, 2026 07:45 AM",
      "Warehouse Review":      "Jun 19, 2026 08:00 AM",
      "Approved":              "Jun 19, 2026 08:15 AM",
      "Added To Production":   "Jun 19, 2026 08:30 AM",
    }),
  },

  // 4. Ready For Dispatch
  {
    orderId: "ORD-GN-104", branch: "Gandhi Nagar",
    orderDate: "Jun 19, 2026", orderTime: "06:50 AM",
    expectedDelivery: "Jun 19, 2026 - 11:00 AM",
    priority: "Urgent", lifecycleStatus: "Ready For Dispatch",
    orderValue: 15800, deliveredValue: 0, cancelledValue: 1200,
    paidAmount: 0, outstandingAmount: 14600,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "urgent",
    items: [
      { product: "Kaju Katli",  orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Kalakand",    orderedQty: 10, approvedQty: 8,  rejectedQty: 2, unit: "Kg" },
      { product: "Milk Cake",   orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "10:30 AM", representative: "Venkat Reddy",
        vehicle: "AP 29 CR 1190",
        products: [
          { name: "Kaju Katli", qty: 12, unit: "Kg" },
          { name: "Kalakand",   qty: 8,  unit: "Kg" },
          { name: "Milk Cake",  qty: 8,  unit: "Kg" },
        ],
        status: "Scheduled",
      },
    ],
    deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Ready For Dispatch", {
      "Order Placed":          "Jun 19, 2026 06:50 AM",
      "Warehouse Review":      "Jun 19, 2026 07:05 AM",
      "Approved":              "Jun 19, 2026 07:30 AM",
      "Added To Production":   "Jun 19, 2026 07:45 AM",
      "Production Started":    "Jun 19, 2026 08:00 AM",
    }),
  },

  // 5. Morning Dispatch
  {
    orderId: "ORD-GN-105", branch: "Gandhi Nagar",
    orderDate: "Jun 19, 2026", orderTime: "06:30 AM",
    expectedDelivery: "Jun 19, 2026 - 10:30 AM",
    priority: "Normal", lifecycleStatus: "Morning Dispatch",
    orderValue: 9600, deliveredValue: 0, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 9600,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "full-delivery",
    items: [
      { product: "Milk Bread",  orderedQty: 100, approvedQty: 100, rejectedQty: 0, unit: "pcs" },
      { product: "Cream Roll",  orderedQty: 50,  approvedQty: 50,  rejectedQty: 0, unit: "pcs" },
      { product: "Samosa",      orderedQty: 80,  approvedQty: 80,  rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "09:00 AM", representative: "Ramesh Kumar",
        vehicle: "AP 16 AB 1234",
        products: [
          { name: "Milk Bread", qty: 100, unit: "pcs" },
          { name: "Cream Roll", qty: 50,  unit: "pcs" },
          { name: "Samosa",     qty: 80,  unit: "pcs" },
        ],
        status: "Dispatched",
      },
    ],
    deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Morning Dispatch", {
      "Order Placed":          "Jun 19, 2026 06:30 AM",
      "Warehouse Review":      "Jun 19, 2026 06:45 AM",
      "Approved":              "Jun 19, 2026 07:00 AM",
      "Added To Production":   "Jun 19, 2026 07:15 AM",
      "Production Started":    "Jun 19, 2026 07:30 AM",
      "Ready For Dispatch":    "Jun 19, 2026 08:45 AM",
    }),
  },

  // 6. Evening Dispatch
  {
    orderId: "ORD-GN-106", branch: "Gandhi Nagar",
    orderDate: "Jun 18, 2026", orderTime: "03:00 PM",
    expectedDelivery: "Jun 19, 2026 - 07:00 PM",
    priority: "Normal", lifecycleStatus: "Evening Dispatch",
    orderValue: 11400, deliveredValue: 0, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 11400,
    paymentIntent: "Payment Pending", invoiceNumber: undefined,
    scenario: "full-delivery",
    items: [
      { product: "Gulab Jamun",     orderedQty: 15, approvedQty: 15, rejectedQty: 0, unit: "Kg" },
      { product: "Motichoor Laddu", orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
    ],
    dispatches: [
      {
        slot: "Evening", time: "05:30 PM", representative: "Suresh Rao",
        vehicle: "AP 29 BX 7734",
        products: [
          { name: "Gulab Jamun",     qty: 15, unit: "Kg" },
          { name: "Motichoor Laddu", qty: 8,  unit: "Kg" },
        ],
        status: "Dispatched",
      },
    ],
    deliveries: [], paymentHistory: [],
    timelineEvents: buildTimeline("Evening Dispatch", {
      "Order Placed":          "Jun 18, 2026 03:00 PM",
      "Warehouse Review":      "Jun 18, 2026 03:20 PM",
      "Approved":              "Jun 18, 2026 04:00 PM",
      "Added To Production":   "Jun 18, 2026 04:30 PM",
      "Production Started":    "Jun 18, 2026 05:00 PM",
      "Ready For Dispatch":    "Jun 19, 2026 04:30 PM",
      "Morning Dispatch":      "Jun 19, 2026 04:31 PM",
    }),
  },

  // 7. Delivered
  {
    orderId: "ORD-GN-107", branch: "Gandhi Nagar",
    orderDate: "Jun 18, 2026", orderTime: "08:00 AM",
    expectedDelivery: "Jun 18, 2026 - 01:00 PM",
    priority: "Normal", lifecycleStatus: "Delivered",
    orderValue: 6800, deliveredValue: 6800, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 6800,
    paymentIntent: "Ready To Pay", invoiceNumber: undefined,
    scenario: "payment-pending",
    items: [
      { product: "Kalakand",   orderedQty: 6,  approvedQty: 6,  rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread", orderedQty: 60, approvedQty: 60, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "10:00 AM", representative: "Naresh Babu",
        vehicle: "AP 29 AT 4521",
        products: [{ name: "Kalakand", qty: 6, unit: "Kg" }, { name: "Milk Bread", qty: 60, unit: "pcs" }],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Kalakand",   orderedQty: 6,  deliveredQty: 6,  receivedQty: 6,  differenceQty: 0, unit: "Kg" },
      { product: "Milk Bread", orderedQty: 60, deliveredQty: 60, receivedQty: 60, differenceQty: 0, unit: "pcs" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Delivered", {
      "Order Placed":       "Jun 18, 2026 08:00 AM",
      "Warehouse Review":   "Jun 18, 2026 08:15 AM",
      "Approved":           "Jun 18, 2026 08:30 AM",
      "Added To Production":"Jun 18, 2026 08:45 AM",
      "Production Started": "Jun 18, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 18, 2026 09:45 AM",
      "Morning Dispatch":   "Jun 18, 2026 10:00 AM",
    }),
  },

  // 8. Bill Generated
  {
    orderId: "ORD-GN-108", branch: "Gandhi Nagar",
    orderDate: "Jun 18, 2026", orderTime: "07:30 AM",
    expectedDelivery: "Jun 18, 2026 - 12:00 PM",
    priority: "Normal", lifecycleStatus: "Invoice Generated",
    orderValue: 10200, deliveredValue: 9400, cancelledValue: 800,
    paidAmount: 0, outstandingAmount: 9400,
    paymentIntent: "Payment Pending", invoiceNumber: "INV-2026-GN-108",
    scenario: "partial-delivery",
    items: [
      { product: "Kaju Katli",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 10, approvedQty: 8,  rejectedQty: 2, unit: "Kg" },
      { product: "Cream Roll",  orderedQty: 40, approvedQty: 40, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "09:30 AM", representative: "Venkat Reddy",
        vehicle: "AP 29 CR 1190",
        products: [
          { name: "Kaju Katli",  qty: 8,  unit: "Kg" },
          { name: "Gulab Jamun", qty: 8,  unit: "Kg" },
          { name: "Cream Roll",  qty: 40, unit: "pcs" },
        ],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Kaju Katli",  orderedQty: 8,  deliveredQty: 8,  receivedQty: 8,  differenceQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 10, deliveredQty: 8,  receivedQty: 8,  differenceQty: 2, unit: "Kg", reason: "Short supply" },
      { product: "Cream Roll",  orderedQty: 40, deliveredQty: 40, receivedQty: 40, differenceQty: 0, unit: "pcs" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Invoice Generated", {
      "Order Placed":       "Jun 18, 2026 07:30 AM",
      "Warehouse Review":   "Jun 18, 2026 07:45 AM",
      "Approved":           "Jun 18, 2026 08:00 AM",
      "Added To Production":"Jun 18, 2026 08:10 AM",
      "Production Started": "Jun 18, 2026 08:30 AM",
      "Ready For Dispatch": "Jun 18, 2026 09:15 AM",
      "Morning Dispatch":   "Jun 18, 2026 09:30 AM",
      "Delivered":          "Jun 18, 2026 11:30 AM",
    }),
  },

  // 9. Payment Pending
  {
    orderId: "ORD-GN-109", branch: "Gandhi Nagar",
    orderDate: "Jun 17, 2026", orderTime: "08:00 AM",
    expectedDelivery: "Jun 17, 2026 - 01:00 PM",
    priority: "Normal", lifecycleStatus: "Payment Pending",
    orderValue: 7500, deliveredValue: 7500, cancelledValue: 0,
    paidAmount: 0, outstandingAmount: 7500,
    paymentIntent: "Ready To Pay", invoiceNumber: "INV-2026-GN-109",
    scenario: "payment-pending",
    items: [
      { product: "Milk Cake",   orderedQty: 5,  approvedQty: 5,  rejectedQty: 0, unit: "Kg" },
      { product: "Rasgulla",    orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Veg Puff",    orderedQty: 60, approvedQty: 60, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "10:00 AM", representative: "Ramesh Kumar",
        vehicle: "AP 16 AB 1234",
        products: [
          { name: "Milk Cake", qty: 5, unit: "Kg" },
          { name: "Rasgulla",  qty: 8, unit: "Kg" },
          { name: "Veg Puff",  qty: 60, unit: "pcs" },
        ],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Milk Cake", orderedQty: 5,  deliveredQty: 5,  receivedQty: 5,  differenceQty: 0, unit: "Kg" },
      { product: "Rasgulla",  orderedQty: 8,  deliveredQty: 8,  receivedQty: 8,  differenceQty: 0, unit: "Kg" },
      { product: "Veg Puff",  orderedQty: 60, deliveredQty: 60, receivedQty: 60, differenceQty: 0, unit: "pcs" },
    ],
    paymentHistory: [],
    timelineEvents: buildTimeline("Payment Pending", {
      "Order Placed":       "Jun 17, 2026 08:00 AM",
      "Warehouse Review":   "Jun 17, 2026 08:15 AM",
      "Approved":           "Jun 17, 2026 08:30 AM",
      "Added To Production":"Jun 17, 2026 08:45 AM",
      "Production Started": "Jun 17, 2026 09:00 AM",
      "Ready For Dispatch": "Jun 17, 2026 09:45 AM",
      "Morning Dispatch":   "Jun 17, 2026 10:00 AM",
      "Delivered":          "Jun 17, 2026 12:00 PM",
      "Invoice Generated":     "Jun 17, 2026 12:30 PM",
    }),
  },

  // 10. Payment Completed
  {
    orderId: "ORD-GN-110", branch: "Gandhi Nagar",
    orderDate: "Jun 17, 2026", orderTime: "07:30 AM",
    expectedDelivery: "Jun 17, 2026 - 12:00 PM",
    priority: "Normal", lifecycleStatus: "Payment Completed",
    orderValue: 9800, deliveredValue: 9800, cancelledValue: 0,
    paidAmount: 9800, outstandingAmount: 0,
    paymentIntent: "Payment Completed", invoiceNumber: "INV-2026-GN-110",
    scenario: "payment-completed",
    items: [
      { product: "Kaju Katli",  orderedQty: 8,  approvedQty: 8,  rejectedQty: 0, unit: "Kg" },
      { product: "Gulab Jamun", orderedQty: 12, approvedQty: 12, rejectedQty: 0, unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, approvedQty: 80, rejectedQty: 0, unit: "pcs" },
    ],
    dispatches: [
      {
        slot: "Morning", time: "09:00 AM", representative: "Venkat Reddy",
        vehicle: "AP 29 CR 1190",
        products: [
          { name: "Kaju Katli",  qty: 8,  unit: "Kg" },
          { name: "Gulab Jamun", qty: 12, unit: "Kg" },
          { name: "Milk Bread",  qty: 80, unit: "pcs" },
        ],
        status: "Delivered",
      },
    ],
    deliveries: [
      { product: "Kaju Katli",  orderedQty: 8,  deliveredQty: 8,  receivedQty: 7.9, differenceQty: 0.1, unit: "Kg", reason: "Weight variation" },
      { product: "Gulab Jamun", orderedQty: 12, deliveredQty: 12, receivedQty: 12,  differenceQty: 0,   unit: "Kg" },
      { product: "Milk Bread",  orderedQty: 80, deliveredQty: 80, receivedQty: 80,  differenceQty: 0,   unit: "pcs" },
    ],
    paymentHistory: [
      { date: "Jun 17, 2026", amount: 9800, method: "UPI", reference: "UPI202606170110", status: "Completed" },
    ],
    timelineEvents: buildTimeline("Payment Completed", {
      "Order Placed":       "Jun 17, 2026 07:30 AM",
      "Warehouse Review":   "Jun 17, 2026 07:45 AM",
      "Approved":           "Jun 17, 2026 08:00 AM",
      "Added To Production":"Jun 17, 2026 08:10 AM",
      "Production Started": "Jun 17, 2026 08:30 AM",
      "Ready For Dispatch": "Jun 17, 2026 09:00 AM",
      "Morning Dispatch":   "Jun 17, 2026 09:00 AM",
      "Delivered":          "Jun 17, 2026 11:45 AM",
      "Invoice Generated":     "Jun 17, 2026 12:00 PM",
      "Payment Pending":    "Jun 17, 2026 12:00 PM",
    }),
  },
];

// Merge into BRANCH_MY_ORDERS so all pages pick them up automatically
BRANCH_MY_ORDERS.push(...GANDHI_NAGAR_ORDERS);




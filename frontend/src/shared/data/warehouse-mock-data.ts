// Centralized Warehouse Mock Data — used across all Warehouse Portal pages.
// Branch names are canonical — do NOT change.

export const WAREHOUSE_BRANCHES = [
  "Gandhi Nagar",
  "Mutyal ammapadu",
  "Gayatri Nagar",
  "Ayyappa Nagar",
  "Gannavaram",
  "Machavararam",
  "Gunadala",
  "Governerpet",
  "Singh Nagar",
  "Poranki",
  "Kanuru",
  "Auto Nagar",
  "Benz Circle",
  "Vinchipeta",
  "Prasadampadu",
  "Patamata",
  "Narasaraopet",
] as const;

export type WarehouseBranch = typeof WAREHOUSE_BRANCHES[number];

export const WAREHOUSE_SUMMARY = {
  // Inventory
  totalProducts: 248,
  totalStockQuantity: 14830,
  inventoryValue: "₹42,18,500",
  lowStockItems: 12,
  // Orders
  pendingOrders: 32,
  approvedOrders: 78,
  dispatchedOrders: 45,
  deliveredOrders: 310,
  // Warehouse
  todaysDispatches: 18,
  todaysReceipts: 9,
  activeBranchRequests: 24,
  rejectedRequests: 7,
};

export const WAREHOUSE_PIE_DATA = [
  { name: "Bakery Products", value: 85, color: "#FBBF24" },
  { name: "Sweets", value: 103, color: "#1D4ED8" },
  { name: "Snacks", value: 40, color: "#22C55E" },
  { name: "Beverages", value: 15, color: "#F97316" },
  { name: "Seasonal Products", value: 5, color: "#A855F7" },
];

export const WAREHOUSE_RECENT_ORDERS = [
  { id: "ORD-1001", branch: "Gandhi Nagar", date: "Jun 3, 2026", items: "12 items", amount: "₹12,450", status: "Pending" },
  { id: "ORD-1002", branch: "Ayyappa Nagar", date: "Jun 3, 2026", items: "8 items", amount: "₹8,320", status: "Pending" },
  { id: "ORD-1003", branch: "Gayatri Nagar", date: "Jun 2, 2026", items: "15 items", amount: "₹15,780", status: "Approved" },
  { id: "ORD-1004", branch: "Benz Circle", date: "Jun 2, 2026", items: "6 items", amount: "₹6,240", status: "Approved" },
  { id: "ORD-1005", branch: "Narasaraopet", date: "Jun 1, 2026", items: "10 items", amount: "₹8,050", status: "Rejected" },
];

export const WAREHOUSE_LOW_STOCK = [
  { name: "Milk Bread", qty: 15 },
  { name: "Kaju Katli", qty: 8 },
  { name: "Rasgulla", qty: 11 },
  { name: "Veg Puff", qty: 6 },
];

export const WAREHOUSE_STOCK_ITEMS = [
  {
    id: "PRD-1001",
    productName: "Milk Bread",
    category: "Bakery Products" as const,
    currentStock: 120,
    minimumStock: 50,
    maximumStock: 500,
    unit: "pcs",
    costPrice: 28,
    sellingPrice: 45,
    supplier: "FreshBake Supplies",
    status: "Active" as const,
    batchNumber: "MB-2605-A",
    expiryDate: "2026-07-12",
  },
  {
    id: "PRD-1002",
    productName: "Kaju Katli",
    category: "Sweets" as const,
    currentStock: 8,
    minimumStock: 20,
    maximumStock: 200,
    unit: "boxes",
    costPrice: 480,
    sellingPrice: 680,
    supplier: "Alankar Central Kitchen",
    status: "Active" as const,
    batchNumber: "KK-2605-C",
    expiryDate: "2026-07-20",
  },
  {
    id: "PRD-1003",
    productName: "Rasgulla",
    category: "Sweets" as const,
    currentStock: 150,
    minimumStock: 30,
    maximumStock: 400,
    unit: "cans",
    costPrice: 190,
    sellingPrice: 280,
    supplier: "Sweetline Foods",
    status: "Active" as const,
    batchNumber: "RG-2605-F",
    expiryDate: "2026-07-15",
  },
  {
    id: "PRD-1004",
    productName: "Veg Puff",
    category: "Snacks" as const,
    currentStock: 6,
    minimumStock: 30,
    maximumStock: 300,
    unit: "pcs",
    costPrice: 15,
    sellingPrice: 25,
    supplier: "SnackPro Distributors",
    status: "Active" as const,
    batchNumber: "VP-2605-D",
    expiryDate: "2026-07-10",
  },
  {
    id: "PRD-1005",
    productName: "Mango Juice",
    category: "Beverages" as const,
    currentStock: 80,
    minimumStock: 40,
    maximumStock: 300,
    unit: "bottles",
    costPrice: 45,
    sellingPrice: 70,
    supplier: "FreshDrink Co.",
    status: "Active" as const,
    batchNumber: "MJ-2605-B",
    expiryDate: "2026-09-01",
  },
  {
    id: "PRD-1006",
    productName: "Seasonal Gift Box",
    category: "Seasonal Products" as const,
    currentStock: 30,
    minimumStock: 10,
    maximumStock: 100,
    unit: "boxes",
    costPrice: 350,
    sellingPrice: 599,
    supplier: "Alankar Central Kitchen",
    status: "Active" as const,
    batchNumber: "SGB-2605-E",
    expiryDate: "2026-12-31",
  },
];

export type StockCategory = "Bakery Products" | "Sweets" | "Snacks" | "Beverages" | "Seasonal Products";

export const WAREHOUSE_STOCK_LOGS = [
  {
    logId: "LOG-0001",
    product: "Milk Bread",
    action: "Stock In" as const,
    quantity: 200,
    date: "Jun 4, 2026",
    performedBy: "Ravi Kumar",
    remarks: "Morning delivery from FreshBake",
  },
  {
    logId: "LOG-0002",
    product: "Kaju Katli",
    action: "Stock Out" as const,
    quantity: 40,
    date: "Jun 4, 2026",
    performedBy: "Srinivas P",
    remarks: "Dispatched to Gandhi Nagar",
  },
  {
    logId: "LOG-0003",
    product: "Rasgulla",
    action: "Stock Adjustment" as const,
    quantity: -5,
    date: "Jun 3, 2026",
    performedBy: "Ravi Kumar",
    remarks: "Damaged goods written off",
  },
  {
    logId: "LOG-0004",
    product: "Veg Puff",
    action: "Stock In" as const,
    quantity: 150,
    date: "Jun 3, 2026",
    performedBy: "Lakshmi D",
    remarks: "Restocking from SnackPro",
  },
  {
    logId: "LOG-0005",
    product: "Mango Juice",
    action: "Stock Out" as const,
    quantity: 60,
    date: "Jun 2, 2026",
    performedBy: "Srinivas P",
    remarks: "Dispatched to Benz Circle",
  },
  {
    logId: "LOG-0006",
    product: "Seasonal Gift Box",
    action: "Stock In" as const,
    quantity: 50,
    date: "Jun 2, 2026",
    performedBy: "Lakshmi D",
    remarks: "Pre-season stocking",
  },
  {
    logId: "LOG-0007",
    product: "Milk Bread",
    action: "Stock Out" as const,
    quantity: 100,
    date: "Jun 1, 2026",
    performedBy: "Ravi Kumar",
    remarks: "Dispatched to Patamata, Narasaraopet",
  },
  {
    logId: "LOG-0008",
    product: "Kaju Katli",
    action: "Stock Adjustment" as const,
    quantity: 10,
    date: "Jun 1, 2026",
    performedBy: "Srinivas P",
    remarks: "Inventory reconciliation",
  },
];

export const WAREHOUSE_DISPATCH_ORDERS = [
  {
    orderId: "ORD-1201",
    branch: "Gandhi Nagar",
    dispatchDate: "Jun 4, 2026",
    dispatchTime: "08:30 AM",
    expectedDelivery: "Jun 4, 2026, 12:00 PM",
    actualDelivery: "",
    vehicleNumber: "AP 29 AT 4521",
    driverName: "Naresh Babu",
    currentStatus: "Packed" as const,
  },
  {
    orderId: "ORD-1202",
    branch: "Ayyappa Nagar",
    dispatchDate: "Jun 4, 2026",
    dispatchTime: "09:00 AM",
    expectedDelivery: "Jun 4, 2026, 01:00 PM",
    actualDelivery: "",
    vehicleNumber: "AP 29 BX 7734",
    driverName: "Suresh Rao",
    currentStatus: "Dispatched" as const,
  },
  {
    orderId: "ORD-1203",
    branch: "Gayatri Nagar",
    dispatchDate: "Jun 3, 2026",
    dispatchTime: "10:15 AM",
    expectedDelivery: "Jun 3, 2026, 02:00 PM",
    actualDelivery: "",
    vehicleNumber: "AP 29 CR 1190",
    driverName: "Venkat Reddy",
    currentStatus: "In Transit" as const,
  },
  {
    orderId: "ORD-1204",
    branch: "Benz Circle",
    dispatchDate: "Jun 2, 2026",
    dispatchTime: "07:45 AM",
    expectedDelivery: "Jun 2, 2026, 11:00 AM",
    actualDelivery: "Jun 2, 2026, 10:50 AM",
    vehicleNumber: "AP 29 DM 3312",
    driverName: "Ramu Goud",
    currentStatus: "Delivered" as const,
  },
  {
    orderId: "ORD-1205",
    branch: "Narasaraopet",
    dispatchDate: "Jun 2, 2026",
    dispatchTime: "11:00 AM",
    expectedDelivery: "Jun 2, 2026, 03:30 PM",
    actualDelivery: "",
    vehicleNumber: "AP 29 EP 6645",
    driverName: "Kishore Kumar",
    currentStatus: "In Transit" as const,
  },
];

export const WAREHOUSE_ORDER_MANAGEMENT = [
  { id: "ORD-1101", branch: "Gandhi Nagar", date: "Jun 3, 2026", items: 12, amount: 12450, status: "Pending" as const },
  { id: "ORD-1102", branch: "Ayyappa Nagar", date: "Jun 3, 2026", items: 8, amount: 8320, status: "Approved" as const },
  { id: "ORD-1103", branch: "Gayatri Nagar", date: "Jun 2, 2026", items: 15, amount: 15780, status: "Packed" as const },
  { id: "ORD-1104", branch: "Benz Circle", date: "Jun 2, 2026", items: 6, amount: 6240, status: "Dispatched" as const },
  { id: "ORD-1105", branch: "Narasaraopet", date: "Jun 1, 2026", items: 10, amount: 8050, status: "In Transit" as const },
  { id: "ORD-1106", branch: "Patamata", date: "May 31, 2026", items: 14, amount: 14260, status: "Delivered" as const },
];

export const WAREHOUSE_ORDER_VERIFICATION = [
  {
    id: "ORD-1001",
    branch: "Gandhi Nagar",
    date: "Jun 3, 2026",
    itemsCount: 12,
    amount: 12450,
    status: "Pending" as const,
    items: [
      { name: "Milk Bread", requested: 100, available: 150 },
      { name: "Rasgulla", requested: 60, available: 95 },
    ],
  },
  {
    id: "ORD-1002",
    branch: "Mutyal ammapadu",
    date: "Jun 3, 2026",
    itemsCount: 8,
    amount: 8320,
    status: "Pending" as const,
    items: [
      { name: "Kaju Katli", requested: 40, available: 8 },
      { name: "Milk Bread", requested: 50, available: 120 },
    ],
  },
  {
    id: "ORD-1003",
    branch: "Gayatri Nagar",
    date: "Jun 2, 2026",
    itemsCount: 15,
    amount: 15780,
    status: "Approved" as const,
    items: [{ name: "Dry Fruit Laddu", requested: 50, available: 120 }],
  },
  {
  id: "ORD-1004",
  branch: "Benz Circle",
  date: "Jun 2, 2026",
  itemsCount: 10,
  amount: 9840,
  status: "Pending",
  items: [
    { name: "Milk Cake", requested: 80, available: 120 },
    { name: "Butter Biscuit", requested: 50, available: 65 }
  ]
},
{
  id: "ORD-1005",
  branch: "Patamata",
  date: "Jun 1, 2026",
  itemsCount: 14,
  amount: 12750,
  status: "Pending",
  items: [
    { name: "Rasmalai", requested: 60, available: 90 },
    { name: "Fruit Cake", requested: 40, available: 55 }
  ]
},
{
  id: "ORD-1006",
  branch: "Narasaraopet",
  date: "May 31, 2026",
  itemsCount: 9,
  amount: 7650,
  status: "Approved",
  items: [
    { name: "Dry Fruit Laddu", requested: 35, available: 80 },
    { name: "Veg Puff", requested: 75, available: 120 }
  ]
},
];

export const WAREHOUSE_INVOICE_DATA = [
  {
    invoiceNumber: "INV-2026-1001",
    branch: "Gandhi Nagar",
    gstPercent: 5,
    issuedDate: "2026-06-03",
    items: [
      { product: "Milk Bread", quantity: 100, price: 45 },
      { product: "Rasgulla", quantity: 60, price: 280 },
      { product: "Kaju Katli", quantity: 40, price: 680 },
    ],
  },
  {
    invoiceNumber: "INV-2026-1002",
    branch: "Ayyappa Nagar",
    gstPercent: 5,
    issuedDate: "2026-06-03",
    items: [
      { product: "Veg Puff", quantity: 120, price: 25 },
      { product: "Mango Juice", quantity: 30, price: 70 },
    ],
  },
  {
    invoiceNumber: "INV-2026-1003",
    branch: "Gayatri Nagar",
    gstPercent: 5,
    issuedDate: "2026-06-02",
    items: [
      { product: "Seasonal Gift Box", quantity: 20, price: 599 },
      { product: "Kaju Katli", quantity: 15, price: 680 },
    ],
  },
];

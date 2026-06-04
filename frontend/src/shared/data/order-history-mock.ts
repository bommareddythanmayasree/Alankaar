export type OrderHistoryStatus = "Pending" | "Approved" | "Rejected" | "Delivered";

export type BranchOrderHistoryRow = {
  orderId: string;
  branchName: string;
  date: string;
  items: number;
  amount: number;
  status: OrderHistoryStatus;
};

export const BRANCH_ORDER_SUMMARY = {
  all: 32,
  pending: 12,
  approved: 15,
  rejected: 5,
  delivered: 25,
};

export const BRANCH_ORDER_HISTORY: BranchOrderHistoryRow[] = [
  { orderId: "ORD-1301", branchName: "Gandhi Nagar", date: "Jun 4, 2026", items: 12, amount: 12450, status: "Approved" },
  { orderId: "ORD-1302", branchName: "Gandhi Nagar", date: "Jun 3, 2026", items: 8, amount: 8320, status: "Delivered" },
  { orderId: "ORD-1303", branchName: "Gandhi Nagar", date: "Jun 2, 2026", items: 5, amount: 4750, status: "Pending" },
  { orderId: "ORD-1298", branchName: "Gandhi Nagar", date: "May 30, 2026", items: 9, amount: 7650, status: "Delivered" },
  { orderId: "ORD-1290", branchName: "Gandhi Nagar", date: "May 28, 2026", items: 11, amount: 11230, status: "Approved" },
  { orderId: "ORD-1285", branchName: "Gandhi Nagar", date: "May 25, 2026", items: 7, amount: 5890, status: "Delivered" },
];

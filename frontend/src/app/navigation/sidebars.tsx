import type { ReactNode } from "react";
import {
  LayoutDashboard,
  GitBranch,
  BarChart2,
  PackageSearch,
  TrendingUp,
  ShoppingCart,
  Sparkles,
  Bell,
  Settings,
  Users,
  Package,
  ClipboardList,
  Truck,
  FileText,
  CheckSquare,
  Circle,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  icon: ReactNode;
  to?: string;
  active?: boolean;
};

type SidebarRegistry = Record<string, Omit<SidebarItem, "active">>;

// NOTE: Do not change labels — they drive the exact sidebar UI text.
export const ADMIN_NAV: SidebarRegistry = {
  Dashboard:                    { label: "Dashboard",                    icon: <LayoutDashboard className="h-4 w-4" /> },
  "Branch Management":          { label: "Branch Management",            icon: <GitBranch className="h-4 w-4" /> },
  "Products Analytics":         { label: "Products Analytics",           icon: <BarChart2 className="h-4 w-4" /> },
  "Inventory Analytics":        { label: "Inventory Analytics",          icon: <PackageSearch className="h-4 w-4" /> },
  "Revenue Analytics":          { label: "Revenue Analytics",            icon: <TrendingUp className="h-4 w-4" /> },
  "Order Analytics":            { label: "Order Analytics",              icon: <ShoppingCart className="h-4 w-4" /> },
  "AI Recommendations":         { label: "AI Recommendations",           icon: <Sparkles className="h-4 w-4" /> },
  "Product Approval Requests":  { label: "Product Approval Requests",    icon: <CheckSquare className="h-4 w-4" /> },
  Notifications:                { label: "Notifications",                icon: <Bell className="h-4 w-4" /> },
  Settings:                     { label: "Settings",                     icon: <Settings className="h-4 w-4" /> },
};

export const WAREHOUSE_NAV: SidebarRegistry = {
  Dashboard:           { label: "Dashboard",           icon: <LayoutDashboard className="h-4 w-4" /> },
  Inventory:           { label: "Inventory",           icon: <Package className="h-4 w-4" /> },
  Orders:              { label: "Orders",              icon: <ClipboardList className="h-4 w-4" /> },
  Branches:            { label: "Branches",            icon: <GitBranch className="h-4 w-4" /> },
  Notifications:       { label: "Notifications",       icon: <Bell className="h-4 w-4" /> },
  Reports:             { label: "Reports",             icon: <FileText className="h-4 w-4" /> },
  Settings:            { label: "Settings",            icon: <Settings className="h-4 w-4" /> },
  "Stock Management":  { label: "Stock Management",    icon: <Package className="h-4 w-4" /> },
  "Stock Logs":        { label: "Stock Logs",          icon: <FileText className="h-4 w-4" /> },
  "Order Verification":{ label: "Order Verification",  icon: <CheckSquare className="h-4 w-4" /> },
  "Order Management":  { label: "Order Management",    icon: <ClipboardList className="h-4 w-4" /> },
  "Invoice Generation":{ label: "Invoice Generation",  icon: <FileText className="h-4 w-4" /> },
  "Dispatch Tracking": { label: "Dispatch Tracking",   icon: <Truck className="h-4 w-4" /> },
};

export const BRANCH_NAV: SidebarRegistry = {
  Dashboard:            { label: "Dashboard",           icon: <LayoutDashboard className="h-4 w-4" /> },
  "Employee Management":{ label: "Employee Management", icon: <Users className="h-4 w-4" /> },
  "Product Catalog":    { label: "Product Catalog",     icon: <Package className="h-4 w-4" /> },
  "Shopping Cart":      { label: "Shopping Cart",       icon: <ShoppingCart className="h-4 w-4" /> },
  Checkout:             { label: "Checkout",            icon: <CheckSquare className="h-4 w-4" /> },
  "Order Tracking":     { label: "Order Tracking",      icon: <Truck className="h-4 w-4" /> },
  "Order History":      { label: "Order History",       icon: <FileText className="h-4 w-4" /> },
  Notifications:        { label: "Notifications",       icon: <Bell className="h-4 w-4" /> },
  Settings:             { label: "Settings",            icon: <Settings className="h-4 w-4" /> },
};

export function buildSidebar(
  registry: SidebarRegistry,
  labels: string[],
  activeLabel?: string
): SidebarItem[] {
  return labels.map((label) => {
    const base = registry[label] ?? { label, icon: <Circle className="h-4 w-4" /> };
    return { ...base, active: activeLabel ? label === activeLabel : false };
  });
}

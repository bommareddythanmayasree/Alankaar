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
  Factory,
  CalendarClock,
  PackageCheck,
  XSquare,
  CreditCard,
  History,
  Banknote,
  LineChart,
  AlertTriangle,
  Zap,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  icon: ReactNode;
  to?: string;
  active?: boolean;
};

type SidebarRegistry = Record<string, Omit<SidebarItem, "active">>;

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
  // Demo additions
  "Business Intelligence":      { label: "Business Intelligence",        icon: <LineChart className="h-4 w-4" /> },
  "Demand vs Delivery":         { label: "Demand vs Delivery",           icon: <BarChart2 className="h-4 w-4" /> },
  "Product Performance":        { label: "Product Performance",          icon: <TrendingUp className="h-4 w-4" /> },
  "Shortage Analytics":         { label: "Shortage Analytics",           icon: <AlertTriangle className="h-4 w-4" /> },
  "Management Insights":        { label: "Management Insights",          icon: <Sparkles className="h-4 w-4" /> },
};

export const WAREHOUSE_NAV: SidebarRegistry = {
  Dashboard:              { label: "Dashboard",              icon: <LayoutDashboard className="h-4 w-4" /> },
  Inventory:              { label: "Inventory",              icon: <Package className="h-4 w-4" /> },
  Orders:                 { label: "Orders",                 icon: <ClipboardList className="h-4 w-4" /> },
  Branches:               { label: "Branches",               icon: <GitBranch className="h-4 w-4" /> },
  Notifications:          { label: "Notifications",          icon: <Bell className="h-4 w-4" /> },
  Reports:                { label: "Reports",                icon: <FileText className="h-4 w-4" /> },
  Settings:               { label: "Settings",               icon: <Settings className="h-4 w-4" /> },
  "Order Verification":   { label: "Order Verification",     icon: <CheckSquare className="h-4 w-4" /> },
  "Order Management":     { label: "Order Management",       icon: <ClipboardList className="h-4 w-4" /> },
  "Invoice Generation":   { label: "Invoice Generation",     icon: <FileText className="h-4 w-4" /> },
  "Dispatch Tracking":    { label: "Dispatch Tracking",      icon: <Truck className="h-4 w-4" /> },
  // Demo additions
  "Production Planning":  { label: "Production Planning",    icon: <Factory className="h-4 w-4" /> },
  "Delivery Tracking":    { label: "Delivery Tracking",      icon: <PackageCheck className="h-4 w-4" /> },
  "Order Closure":        { label: "Order Closure",          icon: <XSquare className="h-4 w-4" /> },
  "Collections":          { label: "Collections",            icon: <Banknote className="h-4 w-4" /> },
  "Advance Orders":       { label: "Advance Orders",         icon: <CalendarClock className="h-4 w-4" /> },
  "Orders Workflow":      { label: "Orders Workflow",        icon: <Zap className="h-4 w-4" /> },
};

export const BRANCH_NAV: SidebarRegistry = {
  Dashboard:             { label: "Dashboard",           icon: <LayoutDashboard className="h-4 w-4" /> },
  "Employee Management": { label: "Employee Management", icon: <Users className="h-4 w-4" /> },
  "Product Catalog":     { label: "Product Catalog",     icon: <Package className="h-4 w-4" /> },
  "Shopping Cart":       { label: "Shopping Cart",       icon: <ShoppingCart className="h-4 w-4" /> },
  Checkout:              { label: "Checkout",            icon: <CheckSquare className="h-4 w-4" /> },
  "Order Tracking":      { label: "Order Tracking",      icon: <Truck className="h-4 w-4" /> },
  "Order History":       { label: "Order History",       icon: <FileText className="h-4 w-4" /> },
  Notifications:         { label: "Notifications",       icon: <Bell className="h-4 w-4" /> },
  Settings:              { label: "Settings",            icon: <Settings className="h-4 w-4" /> },
  // Demo additions
  "Payment Status":      { label: "Payment Status",      icon: <CreditCard className="h-4 w-4" /> },
  "Payment History":     { label: "Payment History",     icon: <History className="h-4 w-4" /> },
  "Advance Orders":      { label: "Advance Orders",      icon: <CalendarClock className="h-4 w-4" /> },
  "My Orders":           { label: "My Orders",           icon: <ClipboardList className="h-4 w-4" /> },
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

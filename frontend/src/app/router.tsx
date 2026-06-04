import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/auth-context";
import { LoginPage } from "../features/auth/login-page";
import { AdminDashboardPage } from "../features/admin/dashboard/admin-dashboard-page";
import { BranchManagementPage } from "../features/admin/branch-management/branch-management-page";
import { ProductAnalyticsPage } from "../features/admin/product-analytics/product-analytics-page";
import { InventoryAnalyticsPage } from "../features/admin/inventory-analytics/inventory-analytics-page";
import { RevenueAnalyticsPage } from "../features/admin/revenue-analytics/revenue-analytics-page";
import { AiRecommendationsPage } from "../features/admin/ai-recommendations/ai-recommendations-page";
import { OrderAnalyticsPage } from "../features/admin/order-analytics/order-analytics-page";
import { AdminNotificationsPage } from "../features/admin/notifications/admin-notifications-page";
import { AdminSettingsPage } from "../features/admin/settings/admin-settings-page";
import { WarehouseDashboardPage } from "../features/warehouse/dashboard/warehouse-dashboard-page";
import { WarehouseStockManagementPage } from "../features/warehouse/stock-management/warehouse-stock-management-page";
import { OrderVerificationPage } from "../features/warehouse/order-verification/order-verification-page";
import { OrderManagementPage } from "../features/warehouse/order-management/order-management-page";
import { InvoiceGenerationPage } from "../features/warehouse/invoice-generation/invoice-generation-page";
import { DispatchTrackingPage } from "../features/warehouse/dispatch-tracking/dispatch-tracking-page";
import { StockLogsPage } from "../features/warehouse/stock-logs/stock-logs-page";
import { WarehouseNotificationsPage } from "../features/warehouse/notifications/warehouse-notifications-page";
import { WarehouseSettingsPage } from "../features/warehouse/settings/warehouse-settings-page";
import { EmployeeManagementPage } from "../features/branch/employee-management/employee-management-page";
import { ProductCatalogPage } from "../features/branch/product-catalog/product-catalog-page";
import { ShoppingCartPage } from "../features/branch/shopping-cart/shopping-cart-page";
import { CheckoutPage } from "../features/branch/checkout/checkout-page";
import { OrderTrackingPage } from "../features/branch/order-tracking/order-tracking-page";
import { BranchDashboardPage } from "../features/branch/dashboard/branch-dashboard-page";
import { OrderHistoryPage } from "../features/branch/order-history/order-history-page";
import { BranchNotificationsPage } from "../features/branch/notifications/branch-notifications-page";
import { BranchSettingsPage } from "../features/branch/settings/branch-settings-page";
import { BranchProvider } from "./branch/branch-context";

function AppShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function BranchShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <BranchProvider>{children}</BranchProvider>
    </AppShell>
  );
}

function Protected({ children, role }: { children: React.ReactNode; role: "ADMIN" | "WAREHOUSE_MANAGER" | "BRANCH_MANAGER" }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.user.role !== role) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppShell>
        <Navigate to="/login" replace />
      </AppShell>
    ),
  },
  {
    path: "/login",
    element: (
      <AppShell>
        <LoginPage />
      </AppShell>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <AdminDashboardPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/dashboard",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseDashboardPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/branch-management",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <BranchManagementPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/product-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <ProductAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/inventory-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <InventoryAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/revenue-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <RevenueAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/ai-recommendations",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <AiRecommendationsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/order-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <OrderAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/notifications",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <AdminNotificationsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/settings",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <AdminSettingsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/stock-management",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseStockManagementPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/stock-logs",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <StockLogsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/order-verification",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <OrderVerificationPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/order-management",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <OrderManagementPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/invoice-generation",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <InvoiceGenerationPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/dispatch-tracking",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <DispatchTrackingPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/notifications",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseNotificationsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/warehouse/settings",
    element: (
      <AppShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseSettingsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/branch/employee-management",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <EmployeeManagementPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/product-catalog",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <ProductCatalogPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/shopping-cart",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <ShoppingCartPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/checkout",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <CheckoutPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/order-tracking",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <OrderTrackingPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/order-history",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <OrderHistoryPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/notifications",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <BranchNotificationsPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/settings",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <BranchSettingsPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/dashboard",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <BranchDashboardPage />
        </Protected>
      </BranchShell>
    ),
  },
]);


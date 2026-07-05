import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/auth-context";
import { LoginPage } from "../features/auth/login-page";
import { AdminDashboardPage } from "../features/admin/dashboard/admin-dashboard-page";
import { BranchManagementPage } from "../features/admin/branch-management/branch-management-page";
import { ProductAnalyticsPage } from "../features/admin/product-analytics/product-analytics-page";
import { RevenueAnalyticsPage } from "../features/admin/revenue-analytics/revenue-analytics-page";
import { AiRecommendationsPage } from "../features/admin/ai-recommendations/ai-recommendations-page";
import { OrderAnalyticsPage } from "../features/admin/order-analytics/order-analytics-page";
import { AdminNotificationsPage } from "../features/admin/notifications/admin-notifications-page";
import { AdminSettingsPage } from "../features/admin/settings/admin-settings-page";
// Demo admin pages
import { BusinessIntelligencePage } from "../features/admin/business-intelligence/business-intelligence-page";
import { DemandVsDeliveryPage } from "../features/admin/demand-vs-delivery/demand-vs-delivery-page";
import { ProductPerformancePage } from "../features/admin/product-performance/product-performance-page";
import { ShortageAnalyticsPage } from "../features/admin/shortage-analytics/shortage-analytics-page";
import { ManagementInsightsPage } from "../features/admin/management-insights/management-insights-page";
// Warehouse pages
import { WarehouseDashboardPage } from "../features/warehouse/dashboard/warehouse-dashboard-page";
import { WarehouseStockManagementPage } from "../features/warehouse/stock-management/warehouse-stock-management-page";
import { OrdersWorkflowPage } from "../features/warehouse/orders-workflow/orders-workflow-page";
import { InvoiceGenerationPage } from "../features/warehouse/invoice-generation/invoice-generation-page";
import { DispatchTrackingPage } from "../features/warehouse/dispatch-tracking/dispatch-tracking-page";
import { StockLogsPage } from "../features/warehouse/stock-logs/stock-logs-page";
import { WarehouseNotificationsPage } from "../features/warehouse/notifications/warehouse-notifications-page";
import { WarehouseSettingsPage } from "../features/warehouse/settings/warehouse-settings-page";
// Demo warehouse pages
import { ProductionPlanningPage } from "../features/warehouse/production-planning/production-planning-page";
import { DeliveryTrackingPage, DeliveryConfirmationPage } from "../features/warehouse/delivery-tracking/delivery-tracking-page";
import { CollectionsPage } from "../features/warehouse/collections/collections-page";
import { WarehouseAdvanceOrdersPage } from "../features/warehouse/advance-orders/advance-orders-page";
// Branch pages
import { EmployeeManagementPage } from "../features/branch/employee-management/employee-management-page";
import { ProductCatalogPage } from "../features/branch/product-catalog/product-catalog-page";
import { ShoppingCartPage } from "../features/branch/shopping-cart/shopping-cart-page";
import { CheckoutPage } from "../features/branch/checkout/checkout-page";
import { BranchDashboardPage } from "../features/branch/dashboard/branch-dashboard-page";
import { OrderHistoryPage } from "../features/branch/order-history/order-history-page";
import { BranchNotificationsPage } from "../features/branch/notifications/branch-notifications-page";
import { BranchSettingsPage } from "../features/branch/settings/branch-settings-page";
// Demo branch pages
import { PaymentStatusPage } from "../features/branch/payment-status/payment-status-page";
import { PaymentHistoryPage } from "../features/branch/payment-history/payment-history-page";
import { BranchAdvanceOrdersPage } from "../features/branch/advance-orders/branch-advance-orders-page";
import { DemoBranchSelectorPage } from "../features/branch/demo-branch-selector/demo-branch-selector";
import { MyOrdersPage } from "../features/branch/my-orders/my-orders-page";
import { BranchProvider } from "./branch/branch-context";
// Tray Management
import { TrayManagementPage } from "../features/warehouse/tray-management/tray-management-page";
import { TrayReturnsPage } from "../features/branch/tray-returns/tray-returns-page";
import { TrayAnalyticsPage } from "../features/admin/tray-analytics/tray-analytics-page";

// WarehouseProvider lives in App.tsx above RouterProvider — single instance for all routes.

function AppShell({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function WarehouseShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
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
  if (auth.user.role !== role) {
    // Redirect to the correct dashboard for the user's actual role
    if (auth.user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (auth.user.role === "WAREHOUSE_MANAGER") return <Navigate to="/warehouse/dashboard" replace />;
    if (auth.user.role === "BRANCH_MANAGER") return <Navigate to="/branch/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** Redirects to dashboard if already authenticated, otherwise shows login */
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();
  if (auth) {
    if (auth.user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (auth.user.role === "WAREHOUSE_MANAGER") return <Navigate to="/warehouse/dashboard" replace />;
    if (auth.user.role === "BRANCH_MANAGER") return <Navigate to="/branch/dashboard" replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AppShell>
        <PublicOnly>
          <Navigate to="/login" replace />
        </PublicOnly>
      </AppShell>
    ),
  },
  {
    path: "/login",
    element: (
      <AppShell>
        <PublicOnly>
          <LoginPage />
        </PublicOnly>
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
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseDashboardPage />
        </Protected>
      </WarehouseShell>
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
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseStockManagementPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/stock-logs",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <StockLogsPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/invoice-generation",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <InvoiceGenerationPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/dispatch-tracking",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <DispatchTrackingPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/notifications",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseNotificationsPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/settings",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseSettingsPage />
        </Protected>
      </WarehouseShell>
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
  // ── Demo: Branch selector (REQ 20) ──────────────────────────────────────────
  {
    path: "/branch/select",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <DemoBranchSelectorPage />
        </Protected>
      </BranchShell>
    ),
  },
  // ── Demo: Branch payment & advance orders (REQ 6-9, 18) ──────────────────────
  {
    path: "/branch/payment-status",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <PaymentStatusPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/payment-history",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <PaymentHistoryPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/advance-orders",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <BranchAdvanceOrdersPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/branch/my-orders",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <MyOrdersPage />
        </Protected>
      </BranchShell>
    ),
  },
  // ── Demo: Warehouse pages (REQ 1-5, 10, 18, 19) ──────────────────────────────
  {
    path: "/warehouse/production-planning",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <ProductionPlanningPage />
        </Protected>
      </WarehouseShell>
    ),
  },

  {
    path: "/warehouse/delivery-tracking",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <DeliveryTrackingPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/delivery-confirmation",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <DeliveryConfirmationPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/collections",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <CollectionsPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/advance-orders",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <WarehouseAdvanceOrdersPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/warehouse/orders-workflow",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <OrdersWorkflowPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  // ── Demo: Admin analytics (REQ 11-16) ─────────────────────────────────────────
  {
    path: "/admin/business-intelligence",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <BusinessIntelligencePage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/demand-vs-delivery",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <DemandVsDeliveryPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/product-performance",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <ProductPerformancePage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/shortage-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <ShortageAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
  {
    path: "/admin/management-insights",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <ManagementInsightsPage />
        </Protected>
      </AppShell>
    ),
  },
  // ── Tray Management ────────────────────────────────────────────────────────
  {
    path: "/warehouse/tray-management",
    element: (
      <WarehouseShell>
        <Protected role="WAREHOUSE_MANAGER">
          <TrayManagementPage />
        </Protected>
      </WarehouseShell>
    ),
  },
  {
    path: "/branch/tray-returns",
    element: (
      <BranchShell>
        <Protected role="BRANCH_MANAGER">
          <TrayReturnsPage />
        </Protected>
      </BranchShell>
    ),
  },
  {
    path: "/admin/tray-analytics",
    element: (
      <AppShell>
        <Protected role="ADMIN">
          <TrayAnalyticsPage />
        </Protected>
      </AppShell>
    ),
  },
]);




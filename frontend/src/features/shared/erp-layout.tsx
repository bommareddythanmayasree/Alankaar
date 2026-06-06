import { useState, type ReactNode } from "react";
import { Bell, Home, LogOut, Settings, UserCircle2 } from "lucide-react";
import { cn } from "../../shared/lib/cn";
import { useAuth } from "../../app/auth/auth-context";
import { useLocation, useNavigate } from "react-router-dom";
import alankarLogo from "../../assets/alankar-logo.png";

type SideItem = { label: string; icon: ReactNode; active?: boolean; to?: string };

export function ErpLayout({
  sidebarItems,
  title,
  children,
}: {
  sidebarItems: SideItem[];
  title?: string;
  children: ReactNode;
}) {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");

  const adminRoutes: Record<string, string> = {
    Dashboard: "/admin/dashboard",
    "Branch Management": "/admin/branch-management",
    "Products Analytics": "/admin/product-analytics",
    "Inventory Analytics": "/admin/inventory-analytics",
    "Revenue Analytics": "/admin/revenue-analytics",
    "Order Analytics": "/admin/order-analytics",
    "AI Recommendations": "/admin/ai-recommendations",
    Notifications: "/admin/notifications",
    Settings: "/admin/settings",
  };

  const warehouseRoutes: Record<string, string> = {
    Dashboard: "/warehouse/dashboard",
    Inventory: "/warehouse/stock-management",
    Orders: "/warehouse/order-management",
    Branches: "/warehouse/dashboard",
    Notifications: "/warehouse/notifications",
    Settings: "/warehouse/settings",
    "Stock Management": "/warehouse/stock-management",
    "Stock Logs": "/warehouse/stock-logs",
    "Order Verification": "/warehouse/order-verification",
    "Order Management": "/warehouse/order-management",
    "Invoice Generation": "/warehouse/invoice-generation",
    "Dispatch Tracking": "/warehouse/dispatch-tracking",
  };

  const branchRoutes: Record<string, string> = {
    Dashboard: "/branch/dashboard",
    Home: "/branch/dashboard",
    "Employee Management": "/branch/employee-management",
    Products: "/branch/product-catalog",
    "Product Catalog": "/branch/product-catalog",
    Cart: "/branch/shopping-cart",
    "Shopping Cart": "/branch/shopping-cart",
    Checkout: "/branch/checkout",
    Orders: "/branch/order-history",
    "Order History": "/branch/order-history",
    "Order Tracking": "/branch/order-tracking",
    Notifications: "/branch/notifications",
    Settings: "/branch/settings",
  };

  const resolveRoute = (item: SideItem) => {
    if (item.to) return item.to;
    if (location.pathname.startsWith("/admin")) return adminRoutes[item.label];
    if (location.pathname.startsWith("/warehouse")) return warehouseRoutes[item.label];
    if (location.pathname.startsWith("/branch")) return branchRoutes[item.label];
    return undefined;
  };

  // Profile display: override for admin portal
  const displayName = isAdmin ? "Alankar Administrator" : (auth?.user.name ?? "User");
  const displayEmail = isAdmin ? "admin@alankarsweets.com" : (auth?.user.email ?? "");

  const sidebarWidth = collapsed ? "w-[70px]" : "w-[280px]";

  return (
    <div className="min-h-screen bg-[#F4F6FA]">
      <div className="mx-auto flex max-w-[1600px]">
        <aside
          className={cn(
            "sticky top-0 flex h-screen flex-col bg-[#032D78] text-white transition-all duration-300 ease-in-out overflow-hidden",
            sidebarWidth
          )}
        >
          {/* Logo area */}
          <div
  className={cn(
    "flex items-center transition-all duration-300 ease-in-out",
   collapsed
  ? "justify-center px-2 py-5"
  : "justify-center px-5 py-6 mb-2"
  )}
>
  <img
  src={alankarLogo}
  alt="Alankar"
  className={cn(
    "object-contain transition-all duration-300",
    collapsed
      ? "w-[50px] h-[50px]"
      : "w-[210px] h-[80px] scale-150"
  )}
/>
</div>

          {/* Collapse toggle button */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "mx-auto mb-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 hover:bg-white/20 transition-colors",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed ? "rotate-180" : "")}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Nav items — hidden when collapsed */}
          {!collapsed && (
            <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
              {sidebarItems.map((item) => {
                const to = resolveRoute(item);
                const disabled = !to;
                return (
                  <button
                    key={item.label}
                    onClick={() => { if (to) navigate(to); }}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-medium",
                      item.active ? "bg-[#0D3B90] text-white" : "text-white/90 hover:bg-[#0D3B90]/70",
                      disabled && "cursor-not-allowed opacity-70 hover:bg-transparent"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-white/90">{item.icon}</span>
                      {item.label}
                    </span>
                    {disabled ? (
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/85">
                        Coming Soon
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Spacer when collapsed */}
          {collapsed && <div className="flex-1" />}

          {/* User info + logout — hidden when collapsed */}
          {!collapsed && (
            <div className="mx-3 mb-4 space-y-2">
              <div className="rounded-xl border border-white/15 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <UserCircle2 className="h-9 w-9 shrink-0 text-white/85" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-white/70">{displayEmail}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium text-white/80 hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 px-8 py-6">
          <header className="mb-6 flex items-center justify-between">
            <div>
              {title ? <h1 className="text-[34px] font-semibold text-[#111827]">{title}</h1> : null}
            </div>
            <div className="flex items-center gap-4">
  <button
    onClick={() => {
      const portal = location.pathname.split("/")[1];
      navigate(`/${portal}/dashboard`);
    }}
    className="text-slate-600 transition hover:text-[#0A3A92]"
    title="Dashboard"
  >
    <Home className="h-5 w-5" />
  </button>

  <button
    onClick={() => {
      const portal = location.pathname.split("/")[1];
      navigate(`/${portal}/notifications`);
    }}
    className="relative text-slate-600 transition hover:text-[#0A3A92]"
    title="Notifications"
  >
    <Bell className="h-5 w-5" />
    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
  </button>

  <button
    onClick={() => {
      const portal = location.pathname.split("/")[1];
      navigate(`/${portal}/settings`);
    }}
    className="text-slate-600 transition hover:text-[#0A3A92]"
    title="Settings"
  >
    <Settings className="h-5 w-5" />
  </button>
</div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

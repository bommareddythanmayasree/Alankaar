import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Building2, Sparkles, Store, UserCog } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { useApi } from "../../../shared/lib/api";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

type AdminDashboardResponse = {
  cards: {
    totalRevenuePaise: number;
    totalOrders: number;
    totalProducts: number;
    totalBranches: number;
    totalEmployees: number;
    totalStockValuePaise: number;
    pendingOrders: number;
    deliveredOrders: number;
  };
};

const revenueSeries = [
  { day: "14 May", thisYear: 62000, lastYear: 51000 },
  { day: "15 May", thisYear: 68000, lastYear: 54000 },
  { day: "16 May", thisYear: 71000, lastYear: 59000 },
  { day: "17 May", thisYear: 76000, lastYear: 61000 },
  { day: "18 May", thisYear: 84000, lastYear: 68000 },
  { day: "19 May", thisYear: 92000, lastYear: 74000 },
  { day: "20 May", thisYear: 105000, lastYear: 82000 },
];

const topProducts = [
  ["Milk Bread", "1,240 sold"],
  ["Rasgulla", "1,120 sold"],
  ["Kaju Katli", "980 sold"],
  ["Veg Puff", "920 sold"],
  ["Gulab Jamun", "850 sold"],
];

export function AdminDashboardPage() {
  const api = useApi();

  useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => api.get<AdminDashboardResponse>("/api/dashboard/admin"),
  });

  const cards = useMemo(() => {
    return [
      {
        label: "Total Revenue",
        value: "₹98,76,430",
        icon: <Sparkles className="h-5 w-5 text-[#3559E0]" />,
      },
      {
        label: "Total Orders",
        value: "3,482",
        icon: <Store className="h-5 w-5 text-[#10B981]" />,
      },
      {
        label: "Total Products",
        value: "120",
        icon: <Building2 className="h-5 w-5 text-[#F59E0B]" />,
      },
      {
        label: "Total Branches",
        value: "18",
        icon: <UserCog className="h-5 w-5 text-[#9333EA]" />,
      },
      {
        label: "Total Employees",
        value: "95",
        icon: <UserCog className="h-5 w-5 text-[#0EA5E9]" />,
      },
      {
        label: "Total Stock Value",
        value: "₹78,50,000",
        icon: <Building2 className="h-5 w-5 text-[#16A34A]" />,
      },
      {
        label: "Pending Orders",
        value: "42",
        icon: <Store className="h-5 w-5 text-[#D97706]" />,
      },
      {
        label: "Delivered Orders",
        value: "3,200",
        icon: <Store className="h-5 w-5 text-[#22C55E]" />,
      },
    ];
  }, []);

  const [showAllActivities, setShowAllActivities] = useState(false);

const activities = [
  {
    icon: "🟢",
    text: "Order ORD-2458 approved",
    time: "2 mins ago",
  },
  {
    icon: "🟡",
    text: "Inventory updated for Milk Bread",
    time: "10 mins ago",
  },
  {
    icon: "🔵",
    text: "Dispatch completed to BenzCircle Branch",
    time: "25 mins ago",
  },
  {
    icon: "🟣",
    text: "New branch manager assigned at Gayathri Nagar",
    time: "1 hour ago",
  },
  {
    icon: "🟢",
    text: "Revenue report generated",
    time: "2 hours ago",
  },
];

const visibleActivities = showAllActivities
  ? activities
  : activities.slice(0, 3);

  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Dashboard")}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
              <span>{c.label}</span>
              {c.icon}
            </div>

            <div className="text-[34px] font-semibold text-slate-900">
              {c.value}
            </div>

            <div className="text-xs text-emerald-600">
              ↑ 12.8% from last week
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold">
            Revenue Overview
          </h3>

          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
  <LineChart
    data={revenueSeries}
    margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
  >
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="#E5E7EB"
    />

    <XAxis
      dataKey="day"
      tick={{ fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />

    <YAxis
      tick={{ fontSize: 11 }}
      axisLine={false}
      tickLine={false}
    />

    <Tooltip
      contentStyle={{
        borderRadius: "10px",
        border: "1px solid #E2E8F0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    />

    <Legend />

    <Line
      type="monotone"
      dataKey="thisYear"
      name="This Year"
      stroke="#2B59FF"
      strokeWidth={3}
      activeDot={{ r: 8 }}
      animationDuration={1200}
    />

    <Line
      type="monotone"
      dataKey="lastYear"
      name="Last Year"
      stroke="#6A8BE7"
      strokeWidth={2}
      activeDot={{ r: 6 }}
      animationDuration={1200}
    />
  </LineChart>
</ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-3">
          <h3 className="mb-3 text-base font-semibold">
            Top Selling Products
          </h3>

          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div
                key={p[0]}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs">
                    {i + 1}
                  </span>

                  <span>{p[0]}</span>
                </div>

                <span className="font-medium">{p[1]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-3">
         <h3 className="mb-3 text-base font-semibold">
  Recent Activities
</h3>

<div className="space-y-3">
  {visibleActivities.map((activity, index) => (
    <div
      key={index}
      className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-start gap-2">
        <span>{activity.icon}</span>

        <span className="text-sm text-slate-700">
          {activity.text}
        </span>
      </div>

      <span className="whitespace-nowrap text-xs text-slate-400">
        {activity.time}
      </span>
    </div>
  ))}

  <button
    onClick={() => setShowAllActivities(!showAllActivities)}
    className="mt-2 w-full rounded-lg border border-[#0A3A92]/20 py-2 text-sm font-medium text-[#0A3A92] hover:bg-[#0A3A92]/5"
  >
    {showAllActivities
      ? "Show Less"
      : "View More Activities"}
  </button>
</div>
        </section>
      </div>
    </ErpLayout>
  );
}
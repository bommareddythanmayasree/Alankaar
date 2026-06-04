import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
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
  ["Milk Bread", "₹5,25,000"],
  ["Rasgulla", "₹4,80,000"],
  ["Kaju Katli", "₹4,20,000"],
  ["Veg Puff", "₹3,10,000"],
  ["Gulab Jamun", "₹2,85,000"],
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
              <LineChart data={revenueSeries}>
                <XAxis dataKey="day" />
                <YAxis />
                <Line
                  type="monotone"
                  dataKey="thisYear"
                  stroke="#2B59FF"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="lastYear"
                  stroke="#6A8BE7"
                  strokeWidth={2}
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

          <div className="space-y-3 text-sm text-slate-700">
            <p>Branch order ORD-2458 approved</p>
            <p>Inventory updated for Milk Bread</p>
            <p>Dispatch completed to Guntur Branch</p>
            <p>New branch manager assigned at Vizag</p>
          </div>

          <div className="mt-4 h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueSeries}>
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Bar
                  dataKey="thisYear"
                  fill="#0A3A92"
                  radius={4}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}
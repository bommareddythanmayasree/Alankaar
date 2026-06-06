import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ErpLayout } from "../../shared/erp-layout";
import { ADMIN_NAV, buildSidebar } from "../../../app/navigation/sidebars";
import { ADMIN_SIDEBAR_LABELS } from "../../../shared/data/admin-mock-data";

const orderSummary = [
  { title: "Total Orders", value: "1,243", note: "+8.3% from last week", positive: true },
  { title: "Pending Orders", value: "145", note: "-2.3% from last week", positive: false },
  { title: "Approved Orders", value: "978", note: "+11.8% from last week", positive: true },
  { title: "Rejected Orders", value: "120", note: "-1.6% from last week", positive: false },
  { title: "Delivered Orders", value: "856", note: "+9.7% from last week", positive: true },
];

const orderStatusDistribution = [
  { name: "Pending", value: 11.7, color: "#F59E0B" },
  { name: "Approved", value: 78.7, color: "#22C55E" },
  { name: "Rejected", value: 9.6, color: "#EF4444" },
];

const ordersTrend = [
  { month: "Jan", thisYear: 180, lastYear: 150 },
  { month: "Feb", thisYear: 195, lastYear: 162 },
  { month: "Mar", thisYear: 210, lastYear: 175 },
  { month: "Apr", thisYear: 228, lastYear: 188 },
  { month: "May", thisYear: 245, lastYear: 205 },
  { month: "Jun", thisYear: 265, lastYear: 220 },
];

const topBranchByOrders = [
  { branch: "Gandhi Nagar", orders: 300 },
  { branch: "Benz Circle", orders: 265 },
  { branch: "Ayyappa Nagar", orders: 230 },
  { branch: "Gayatri Nagar", orders: 185 },
  { branch: "Patamata", orders: 160 },
  { branch: "Kanuru", orders: 140 },
  { branch: "Narasaraopet", orders: 110 },
];

const recentOrders = [
  { orderId: "ORD-1254", branch: "Gandhi Nagar", amount: 21430, status: "Approved" },
  { orderId: "ORD-1251", branch: "Benz Circle", amount: 18920, status: "Delivered" },
  { orderId: "ORD-1248", branch: "Ayyappa Nagar", amount: 15680, status: "Dispatched" },
  { orderId: "ORD-1245", branch: "Gayatri Nagar", amount: 13240, status: "Pending" },
  { orderId: "ORD-1242", branch: "Patamata", amount: 10850, status: "Approved" },
];

function statusBadge(status: string) {
  if (status === "Approved" || status === "Delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "Rejected") return "bg-red-100 text-red-700";
  if (status === "Dispatched") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
}

export function OrderAnalyticsPage() {
  return (
    <ErpLayout
      sidebarItems={buildSidebar(ADMIN_NAV, [...ADMIN_SIDEBAR_LABELS], "Order Analytics")}
    >
      

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {orderSummary.map((card) => (
          <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-1 text-[32px] font-semibold leading-tight text-slate-900">{card.value}</p>
            <p className={`mt-1 text-xs ${card.positive ? "text-emerald-600" : "text-red-600"}`}>{card.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Order Status Distribution</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderStatusDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                  {orderStatusDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {orderStatusDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-8">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Orders Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ordersTrend}>
                <CartesianGrid stroke="#EEF2F7" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="thisYear" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3 }} name="This Year" />
                <Line type="monotone" dataKey="lastYear" stroke="#93C5FD" strokeWidth={2} strokeDasharray="6 4" dot={{ r: 2 }} name="Last Year" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#1D4ED8]" />
              <span className="text-slate-600">This Year</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#93C5FD]" />
              <span className="text-slate-600">Last Year</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Top Branch By Orders</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBranchByOrders} layout="vertical" margin={{ left: 20, right: 10 }}>
                <CartesianGrid stroke="#EEF2F7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="branch" tick={{ fontSize: 12 }} width={90} />
                <Tooltip />
                <Bar dataKey="orders" fill="#0A3A92" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-6">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="bg-[#F8FAFD] text-slate-500">
                <tr>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Branch</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row) => (
                  <tr key={row.orderId} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-[#0A3A92]">{row.orderId}</td>
                    <td className="px-3 py-3 text-slate-700">{row.branch}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">₹{row.amount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ErpLayout>
  );
}

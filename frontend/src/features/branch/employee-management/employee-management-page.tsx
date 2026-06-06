import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ErpLayout } from "../../shared/erp-layout";
import { BRANCH_NAV, buildSidebar } from "../../../app/navigation/sidebars";

type EmployeeRole = "Cashier" | "Sales Staff" | "Inventory Staff" ;
type EmployeeStatus = "Active" | "Inactive";

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  status: EmployeeStatus;
};

const SIDEBAR_LABELS = [
  "Dashboard",
  "Employee Management",
  "Product Catalog",
  "Shopping Cart",
  "Checkout",
  "Order Tracking",
  "Order History",
  "Notifications",
  "Settings",
] as const;

const initialEmployees: Employee[] = [
  { id: "EMP-101", name: "Ravi Kumar", email: "ravi.gandhinagar@alankarsweets.com", phone: "+91 98765 12001", role: "Cashier", status: "Active" },
  { id: "EMP-102", name: "Meena Devi", email: "meena.gandhinagar@alankarsweets.com", phone: "+91 98765 12002", role: "Sales Staff", status: "Active" },
  { id: "EMP-103", name: "Kiran Reddy", email: "kiran.gandhinagar@alankarsweets.com", phone: "+91 98765 12003", role: "Inventory Staff", status: "Active" },
  { id: "EMP-104", name: "Arjun Rao", email: "arjun.gandhinagar@alankarsweets.com", phone: "+91 98765 12004", role: "Sales Staff", status: "Inactive" },
];

type FormState = Omit<Employee, "id">;

const emptyForm: FormState = { name: "", email: "", phone: "", role: "Cashier", status: "Active" };

export function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All Roles" | EmployeeRole>("All Roles");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Employee | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const bySearch = [emp.id, emp.name, emp.email, emp.phone, emp.role, emp.status].join(" ").toLowerCase().includes(search.toLowerCase());
      const byRole = roleFilter === "All Roles" ? true : emp.role === roleFilter;
      return bySearch && byRole;
    });
  }, [employees, search, roleFilter]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDrawerOpen(true); };
  const openEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone, role: emp.role, status: emp.status });
    setDrawerOpen(true);
  };
  const saveEmployee = () => {
    if (!form.name || !form.email || !form.phone) return;
    if (editingId) {
      setEmployees((prev) => prev.map((emp) => (emp.id === editingId ? { ...emp, ...form } : emp)));
    } else {
      const nextId = `EMP-${String(101 + employees.length)}`;
      setEmployees((prev) => [{ id: nextId, ...form }, ...prev]);
    }
    setDrawerOpen(false);
  };

  return (
    <ErpLayout
      sidebarItems={buildSidebar(BRANCH_NAV, [...SIDEBAR_LABELS], "Employee Management")}
    >
      <p className="mb-4 text-slate-600">Manage Gandhi Nagar branch staff</p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..."
              className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#0A3A92]" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "All Roles" | EmployeeRole)}
            className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]">
            <option>All Roles</option>
            <option>Cashier</option>
            <option>Sales Staff</option>
            <option>Inventory Staff</option>
          </select>
          <button onClick={openCreate} className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[#F8FAFD] text-slate-500">
              <tr>
                <th className="px-3 py-3">Employee ID</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-[#1B4DB1]">{emp.id}</td>
                  <td className="px-3 py-3">{emp.name}</td>
                  <td className="px-3 py-3">{emp.email}</td>
                  <td className="px-3 py-3">{emp.phone}</td>
                  <td className="px-3 py-3">{emp.role}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${emp.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewing(emp)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => openEdit(emp)} className="rounded p-2 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setEmployees((prev) => prev.filter((x) => x.id !== emp.id))} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
          <div className="h-full w-full max-w-[420px] overflow-y-auto border-l border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Employee" : "Add Employee"}</h3>
              <button onClick={() => setDrawerOpen(false)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Employee Name"><input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} /></Field>
              <Field label="Email"><input type="email" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} /></Field>
              <Field label="Phone"><input className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} /></Field>
              <Field label="Role">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as EmployeeRole }))}>
                  <option>Cashier</option><option>Sales Staff</option><option>Inventory Staff</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as EmployeeStatus }))}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </Field>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setDrawerOpen(false)} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold">Cancel</button>
              <button onClick={saveEmployee} className="h-10 rounded-md bg-[#0A3A92] px-4 text-sm font-semibold text-white">Save Employee</button>
            </div>
          </div>
        </div>
      ) : null}

      {viewing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
          <div className="w-full max-w-[520px] rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Employee Details</h3>
              <button onClick={() => setViewing(null)} className="rounded p-2 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Employee ID" value={viewing.id} />
              <Detail label="Name" value={viewing.name} />
              <Detail label="Email" value={viewing.email} />
              <Detail label="Phone" value={viewing.phone} />
              <Detail label="Role" value={viewing.role} />
              <Detail label="Status" value={viewing.status} />
            </div>
          </div>
        </div>
      ) : null}
    </ErpLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}

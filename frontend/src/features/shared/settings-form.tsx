import { useState } from "react";
import { useAuth } from "../../app/auth/auth-context";

type SettingsFormProps = {
  roleLabel: string;
};

export function SettingsForm({ roleLabel }: SettingsFormProps) {
  const { auth } = useAuth();
  const [name, setName] = useState(auth?.user.name ?? "User");
  const [email, setEmail] = useState(auth?.user.email ?? "");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Profile Settings</h3>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Full Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email Address</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Phone Number</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Role</span>
            <input value={roleLabel} readOnly className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Notification Preferences</h3>
        <div className="space-y-4 text-sm text-slate-700">
          <label className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
            <span>Email alerts for account activity</span>
            <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
            <span>Order status updates</span>
            <input type="checkbox" checked={orderAlerts} onChange={(e) => setOrderAlerts(e.target.checked)} className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-3">
            <span>Stock and inventory alerts</span>
            <input type="checkbox" checked={stockAlerts} onChange={(e) => setStockAlerts(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Security</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Current Password</span>
            <input type="password" placeholder="Enter current password" className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">New Password</span>
            <input type="password" placeholder="Enter new password" className="h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-[#0A3A92]" />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="rounded-md bg-[#0A3A92] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#083173]">
            Save Changes
          </button>
          <button type="button" className="rounded-md border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

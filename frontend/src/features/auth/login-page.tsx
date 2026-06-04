import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../shared/lib/api";
import { useAuth } from "../../app/auth/auth-context";
import { cn } from "../../shared/lib/cn";
import loginLeftImage from "../../assets/alankar-login-bg.png";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["ADMIN", "WAREHOUSE_MANAGER", "BRANCH_MANAGER"]),
  remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: "ADMIN" | "WAREHOUSE_MANAGER" | "BRANCH_MANAGER";
    branchId?: string | null;
  };
};

export function LoginPage() {
  const api = useApi();
  const { setAuth } = useAuth();
  const nav = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "WAREHOUSE_MANAGER",
      remember: false,
    },
  });

  const login = useMutation({
    mutationFn: (values: FormValues) => api.post<LoginResponse>("/api/auth/login", values),
    onSuccess: (data) => {
      setAuth({ token: data.token, user: data.user });
      if (data.user.role === "ADMIN") nav("/admin/dashboard");
      if (data.user.role === "WAREHOUSE_MANAGER") nav("/warehouse/dashboard");
      if (data.user.role === "BRANCH_MANAGER") nav("/branch/dashboard");
    },
  });

  const selectedRole = form.watch("role");

  return (
    <div
  className="min-h-full w-full flex items-center justify-end px-6 lg:px-24"
style={{
  backgroundImage: `url(${loginLeftImage})`,
  backgroundSize: "100% 100%",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
}}
>
      <div className="w-full max-w-[540px]">
        <div className="rounded-[28px] bg-white/95 backdrop-blur-sm px-10 py-11 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
          <div className="text-center">
            <h1 className="text-[26px] font-bold text-slate-900">
              Welcome Back !!
            </h1>
            <p className="mt-2 text-slate-500">
              Sign in to your account
            </p>
          </div>
  
          <form
            className="mt-8 space-y-5"
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
          >
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-slate-700">
                Email Address
              </label>
  
              <input
                className="h-14 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#0B2C66]"
                placeholder="Enter your email"
                {...form.register("email")}
              />
            </div>
  
            {/* PASSWORD */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[13px] font-semibold text-slate-700">
                  Password
                </label>
  
                <button
                  type="button"
                  className="text-sm text-[#0B2C66]"
                >
                  Forgot Password?
                </button>
              </div>
  
              <input
                type="password"
                className="h-14 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#0B2C66]"
                placeholder="Enter your password"
                {...form.register("password")}
              />
            </div>
  
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                {...form.register("remember")}
              />
              Remember me
            </label>
  
            <button
              type="submit"
              disabled={login.isPending}
              className="h-14 w-full rounded-xl bg-[#0B2C66] font-semibold text-white hover:bg-[#08204d]"
            >
              Login
            </button>
  
            <div className="relative py-4">
              <div className="h-px bg-slate-200" />
  
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 bg-white px-4 text-sm text-slate-500">
                Select your role
              </span>
            </div>
  
            <div className="grid grid-cols-2 gap-4">
  <RoleButton
    label="Warehouse Admin"
    active={selectedRole === "WAREHOUSE_MANAGER"}
    onClick={() => form.setValue("role", "WAREHOUSE_MANAGER")}
    icon="warehouse"
  />

  <RoleButton
    label="Branch User"
    active={selectedRole === "BRANCH_MANAGER"}
    onClick={() => form.setValue("role", "BRANCH_MANAGER")}
    icon="store"
  />
</div>

{/* ADD THIS */}
<div className="mt-4">
  <button
    type="button"
    onClick={() => form.setValue("role", "ADMIN")}
    className={cn(
      "h-12 w-full rounded-xl border font-semibold transition-all",
      selectedRole === "ADMIN"
        ? "border-[#0B2C66] bg-[#EFF4FF] text-[#0B2C66]"
        : "border-slate-300 bg-white text-slate-700"
    )}
  >
    Login as Admin
  </button>
</div>

  
            {login.isError ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {(login.error as { message?: string })?.message ??
                  "Login failed"}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: "warehouse" | "store";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 items-center justify-center gap-2 rounded-lg border text-[12px] font-semibold transition-colors",
        active ? "border-[#0B2C66] bg-[#EFF4FF] text-[#0B2C66]" : "border-slate-200 bg-white text-slate-500"
      )}
    >
      <span className={cn("inline-flex h-5 w-5 items-center justify-center", active ? "text-[#0B2C66]" : "text-slate-400")}>
        {icon === "warehouse" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 9.5 12 4l9 5.5V21H3V9.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M7 21v-7h10v7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5V20H4V7.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M8 20v-7h8v7" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}


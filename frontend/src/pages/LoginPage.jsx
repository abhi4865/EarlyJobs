// src/pages/LoginPage.jsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Rocket, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/api/client";
import Button from "@/components/common/Button";
import { Field, Input } from "@/components/common/Fields";

// ───────── TEMP: demo credentials (delete this block + <DemoLogins /> below before deploying) ─────────
const DEMO_PASSWORD = "password123";
const DEMO_USERS = [
  { label: "Recruiter", email: "abhishek.ybit@gmail.com" },
];

function DemoLogins({ onPick }) {
  return (
    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <p className="flex items-center gap-2 font-semibold text-amber-900"><KeyRound className="h-4 w-4" /> Demo login</p>
      <ul className="mt-2 space-y-1.5">
        {DEMO_USERS.map((u) => (
          <li key={u.email} className="flex items-center justify-between gap-2">
            <span className="min-w-0 text-amber-900">
              <span className="block truncate font-medium">{u.email}</span>
              <span className="text-xs text-amber-700">{u.label} · password: <code className="font-mono">{DEMO_PASSWORD}</code></span>
            </span>
            <button type="button" onClick={() => onPick(u.email, DEMO_PASSWORD)} className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-amber-800 shadow-sm ring-1 ring-amber-200 hover:bg-amber-100">Use</button>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700"><TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> For testing only. Remove before sharing or deploying.</p>
    </div>
  );
}
// ───────── END TEMP ─────────

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return setError("Enter your email and password.");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a1235] via-[#14205a] to-indigo-700 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-2.5"><Rocket className="h-8 w-8 text-indigo-600" /><span className="text-2xl font-semibold text-slate-900">EarlyJobs</span></div>
        <h1 className="text-xl font-bold text-slate-900">Sign in to your account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage jobs, candidates and interviews in one place.</p>

        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>

          <Field label="Password" htmlFor="password">
            <div className="relative">
              <Input
                id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-11"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
        </form>

        {/* TEMP: remove with the block above */}
        <DemoLogins onPick={(email, password) => { setForm({ email, password }); setError(""); }} />
      </div>
    </div>
  );
}
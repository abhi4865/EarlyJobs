// src/pages/LoginPage.jsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage, isMockMode } from "@/api/client";
import Button from "@/components/common/Button";
import { Field, Input } from "@/components/common/Fields";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: isMockMode ? "abhishek.ybit@gmail.com" : "", password: isMockMode ? "password123" : "" });
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
          <Field label="Email" htmlFor="email"><Input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Password" htmlFor="password"><Input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" size="lg" className="w-full" loading={loading}>Sign in</Button>
        </form>
        {isMockMode && <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">Demo mode: the form is pre-filled. Password is <b>password123</b>.</p>}
      </div>
    </div>
  );
}

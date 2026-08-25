import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, Lock, User, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useHospital } from "@/frontend/store/hospitalStore";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Unani Hospital Room Management" },
      { name: "description", content: "Sign in to access your Unani Hospital Room Management workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useHospital();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(usernameOrEmail, password);
      if (res.ok) {
        toast.success(res.message);
        navigate({ to: "/" });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Background Orbs */}
      <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-white shadow-lg shadow-primary/20">
            <Stethoscope className="size-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Unani Hospital
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Room allocation & Patient management workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identity" className="text-sm font-medium text-slate-300">
                Username or Email
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="size-4.5" />
                </span>
                <Input
                  id="identity"
                  type="text"
                  placeholder="admin or receptionist"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="h-11 border-slate-800 bg-slate-950 pl-10 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pass" className="text-sm font-medium text-slate-300">
                  Password
                </Label>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="size-4.5" />
                </span>
                <Input
                  id="pass"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-800 bg-slate-950 pl-10 pr-10 text-white placeholder:text-slate-600 focus-visible:border-primary focus-visible:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full bg-gradient-to-r from-primary to-emerald-600 font-semibold text-white shadow-lg shadow-primary/20 hover:from-primary/95 hover:to-emerald-600/95 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Quick Login Seed Note */}
          <div className="mt-6 flex gap-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-xs text-slate-400">
            <ShieldAlert className="size-5.5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold text-slate-300">Seed Accounts:</p>
              <p className="mt-1">
                Admin: <code className="text-emerald-400">admin</code> / <code className="text-emerald-400">admin</code>
              </p>
              <p className="mt-0.5">
                Staff: <code className="text-emerald-400">receptionist</code> / <code className="text-emerald-400">receptionist</code>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:text-primary/90 transition-colors">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

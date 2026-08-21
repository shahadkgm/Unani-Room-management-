import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Stethoscope, Lock, User, Mail, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useHospital } from "@/frontend/store/hospitalStore";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import type { Role } from "@/shared/types";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register Account — Unani Hospital Room Management" },
      { name: "description", content: "Create a new Admin or Receptionist account for Unani Hospital Room Management." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { registerUser } = useHospital();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("receptionist");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 4) {
      toast.error("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(username, email, role, password);
      if (res.ok) {
        toast.success(res.message);
        toast.info("Please sign in with your new credentials.");
        navigate({ to: "/login" });
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Registration failed. Please try again.");
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
            Create an workspace account
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-username" className="text-sm font-medium text-slate-300">
                Username
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="size-4.5" />
                </span>
                <Input
                  id="reg-username"
                  type="text"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 border-slate-800 bg-slate-950 pl-10 text-white placeholder:text-slate-650 focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-sm font-medium text-slate-300">
                Email Address
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="size-4.5" />
                </span>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="john@unani.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-slate-800 bg-slate-950 pl-10 text-white placeholder:text-slate-650 focus-visible:border-primary focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-role" className="text-sm font-medium text-slate-300">
                Workspace Role
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger id="reg-role" className="h-11 border-slate-800 bg-slate-950 text-white focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-800 bg-slate-900 text-white">
                  <SelectItem value="receptionist">Receptionist (Admissions & Discharges)</SelectItem>
                  <SelectItem value="admin">Admin (Full access incl. Room CRUD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" className="text-sm font-medium text-slate-300">
                Password
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="size-4.5" />
                </span>
                <Input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 border-slate-800 bg-slate-950 pl-10 pr-10 text-white placeholder:text-slate-650 focus-visible:border-primary focus-visible:ring-primary/20"
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
              className="mt-4 h-11 w-full bg-gradient-to-r from-primary to-emerald-600 font-semibold text-white shadow-lg shadow-primary/20 hover:from-primary/95 hover:to-emerald-600/95 transition-all"
            >
              {loading ? "Registering..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/90 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

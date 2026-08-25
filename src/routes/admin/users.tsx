import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, ShieldAlert, ShieldCheck, UserCheck, Users, Database, RotateCcw, AlertTriangle } from "lucide-react";
import { AppShell } from "@/frontend/components/AppShell";
import { useHospital, useStats } from "@/frontend/store/hospitalStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/frontend/components/ui/table";
import { Button } from "@/frontend/components/ui/button";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Unani Hospital Room Management" },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { currentUser, users, dbConnected, resetData, hydrated } = useHospital();
  const stats = useStats();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (hydrated && currentUser && currentUser.role !== "admin") {
      toast.error("Access denied. Admin access only.");
      navigate({ to: "/" });
    }
  }, [currentUser, hydrated, navigate]);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto size-16 text-destructive animate-pulse" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-400">
            You do not have the required permissions to access the Admin Portal.
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link to="/">Go back to Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all admissions and patient records? This will restore the system to its initial seeded state.")) {
      resetData();
      toast.success("System database reset completed.");
    }
  };

  return (
    <AppShell
      title="Admin Portal"
      subtitle="Workspace accounts directory and system database configuration"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Connection Status & Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Database Status
              </p>
              <span className={`grid size-9 place-items-center rounded-xl ${dbConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                <Database className="size-4.5" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold">
              {dbConnected ? "MongoDB Online" : "Local Fallback"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {dbConnected 
                ? "Active connection verified with MongoDB database server." 
                : "Database connection offline. Currently storing all data in client cache."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Users
              </p>
              <span className="grid size-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
                <Users className="size-4.5" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{users.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Workspace operators with sign-in access.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active System Rooms
              </p>
              <span className="grid size-9 place-items-center rounded-xl bg-purple-100 text-purple-700">
                <ShieldCheck className="size-4.5" />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{stats.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently operational hospital wards & rooms.
            </p>
          </div>
        </div>

        {/* User Directory */}
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="text-base font-semibold">User Directory</h3>
            <p className="text-xs text-muted-foreground">Active operator profiles and access scopes.</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access Role</TableHead>
                  <TableHead>Security Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium flex items-center gap-2.5">
                      <div className="grid size-8 place-items-center rounded-lg bg-secondary font-semibold text-xs capitalize text-secondary-foreground">
                        {user.username[0]}
                      </div>
                      {user.username}
                      {user.id === currentUser.id && (
                        <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                          You
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize text-sm font-medium">{user.role}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.role === 'admin' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="size-3 text-rose-600" />
                            Root Access
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-3 text-slate-600" />
                            Operator
                          </>
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* System Administration Settings */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-base font-semibold flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Danger Zone
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            System maintenance operations. Be careful: these operations directly alter system storage.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Reset system data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Reset admissions history, patient directory, and release all current room assignments to seed values.
              </p>
            </div>
            <Button variant="destructive" onClick={handleReset} className="gap-2">
              <RotateCcw className="size-4" />
              Reset Database
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

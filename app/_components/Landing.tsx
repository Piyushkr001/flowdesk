"use client";

import * as React from "react";
import Link from "next/link";
import axios from "axios";
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Bell,
  Users,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

export default function LandingPage() {
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    async function loadMe() {
      try {
        const { data } = await axios.get(`${apiBase()}/api/v1/auth/me`, {
          withCredentials: true,
          headers: { "Cache-Control": "no-store" },
        });
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch {
        if (!mounted) return;
        setUser(null);
      } finally {
        if (!mounted) return;
        setAuthLoading(false);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  const isLoggedIn = !!user;
  const disableCreate = authLoading || isLoggedIn;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-linear-to-b from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          {/* Left */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                <Sparkles className="mr-1 h-4 w-4" />
                FlowDesk
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Real-time Collaboration
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              A professional task manager for teams that move fast.
            </h1>

            <p className="mt-4 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300">
              Create tasks, assign owners, track priorities, and stay aligned with instant updates
              and persistent notifications—built for modern full-stack workflows.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              {/* ✅ Disabled when logged in */}
              <Button
                asChild={!disableCreate}
                size="lg"
                className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                disabled={disableCreate}
              >
                {disableCreate ? (
                  <span className="inline-flex items-center">
                    {authLoading ? "Checking..." : "Already Logged In"}
                  </span>
                ) : (
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                )}
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link href="/login">Login</Link>
              </Button>

              <Button asChild size="lg" variant="ghost" className="rounded-xl">
                <Link href="/dashboard">View Dashboard</Link>
              </Button>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                JWT Auth + secure sessions
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Socket.io real-time updates
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                Clean dashboard + filters
              </div>
            </div>
          </div>

          {/* Right: Preview card */}
          <div className="flex-1 w-full">
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                  <span className="text-slate-900 dark:text-slate-50">Team Overview</span>
                  <Badge variant="secondary" className="rounded-full">
                    Live
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mini stats */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Assigned to me
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      8
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Created by me
                    </div>
                    <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
                      14
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Overdue</div>
                    <div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                      2
                    </div>
                  </div>
                </div>

                <Separator className="my-1" />

                {/* Mini task list */}
                <div className="space-y-3">
                  {[
                    { title: "Review PR: notifications module", meta: "Priority: High • Due: Today" },
                    {
                      title: "Assign tasks for sprint planning",
                      meta: "Priority: Medium • Due: Tomorrow",
                    },
                    { title: "Fix status filter on dashboard", meta: "Priority: Low • Due: Fri" },
                  ].map((t) => (
                    <div
                      key={t.title}
                      className="flex items-start justify-between gap-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-slate-950 p-4"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-50">
                          {t.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                          {t.meta}
                        </div>
                      </div>
                      <Badge className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white">
                        Update
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-sky-500/20 bg-linear-to-r from-sky-500/10 to-indigo-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      <span className="font-semibold">New assignment:</span> “API DTO validation”
                      was assigned to you.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Everything you need to run work, end-to-end.
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
              Designed for collaborative teams—fast filtering, clear priorities, and real-time
              updates without refresh.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/features">Explore Features</Link>
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Team Collaboration"
            desc="Assign tasks, update status, and keep everyone in sync in real time."
          />
          <FeatureCard
            icon={<LayoutDashboard className="h-5 w-5" />}
            title="Smart Dashboard"
            desc="Assigned to me, created by me, and overdue views—always up to date."
          />
          <FeatureCard
            icon={<Bell className="h-5 w-5" />}
            title="Persistent Notifications"
            desc="In-app notifications are stored, so nothing gets missed."
          />
          <FeatureCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Secure Authentication"
            desc="JWT-based sessions with secure storage and best-practice handling."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Polished UX"
            desc="Responsive layout, skeleton loaders, and clean, professional UI."
          />
          <FeatureCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="Filter & Sort"
            desc="Filter by status/priority and sort by due date for clarity."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Start managing work with FlowDesk today.
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
                  Create your account, invite teammates, and track tasks with real-time updates and
                  a modern dashboard.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* ✅ Disabled when logged in */}
                <Button
                  asChild={!disableCreate}
                  size="lg"
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                  disabled={disableCreate}
                >
                  {disableCreate ? (
                    <span>{authLoading ? "Checking..." : "Already Logged In"}</span>
                  ) : (
                    <Link href="/signup">
                      Create Account <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  )}
                </Button>

                <Button asChild size="lg" variant="outline" className="rounded-xl">
                  <Link href="/contact">Talk to Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
            {icon}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-300">{desc}</p>
      </CardContent>
    </Card>
  );
}

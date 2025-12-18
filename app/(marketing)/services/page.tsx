// app/(marketing)/services/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CheckCircle2,
  Filter,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ServicesPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-6xl flex flex-col gap-10">
        {/* Hero */}
        <section className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Services
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Workflow • Tasks • Collaboration
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Everything you need to run execution—end to end.
              </h1>

              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Our services are designed to help individuals and teams plan work, assign ownership,
                stay ahead of deadlines, and keep stakeholders informed with real-time visibility.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                >
                  <Link href="/dashboard/tasks/new">
                    Create a task
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/dashboard">View dashboard</Link>
                </Button>
              </div>
            </div>

            <Card className="w-full lg:w-105 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Delivery outcomes
                </CardTitle>
                <CardDescription>What teams typically improve.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Fewer missed deadlines via due dates + overdue views" />
                <Bullet text="Clear accountability using assigned / created views" />
                <Bullet text="Reduced coordination overhead with live updates" />
                <Bullet text="Faster decision-making with concise stats and signals" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Service Cards */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Core services
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                Modular services you can use together or independently—optimized for speed and clarity.
              </p>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/tasks">Browse tasks</Link>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <ServiceCard
              icon={<LayoutGrid className="h-5 w-5" />}
              title="Task workflow management"
              desc="Create tasks, set status and priority, assign owners, and keep work moving through clear stages."
              points={[
                "Create and edit tasks with validation",
                "Status lanes: todo, in progress, review, completed",
                "Priority signals: low → urgent",
              ]}
            />

            <ServiceCard
              icon={<CalendarClock className="h-5 w-5" />}
              title="Deadline & overdue tracking"
              desc="Prevent delivery surprises with due dates, overdue views, and time-based sorting."
              points={[
                "Due date sorting for daily planning",
                "Overdue view for quick risk detection",
                "Clean date formatting across devices",
              ]}
            />

            <ServiceCard
              icon={<Bell className="h-5 w-5" />}
              title="Notifications & alerts"
              desc="Get notified when work changes—especially when tasks are assigned or updated."
              points={[
                "Unread alerts count for focus",
                "New assignment notifications",
                "Supports bulk updates via reconcile refresh",
              ]}
            />
          </div>
        </section>

        {/* Advanced / Team */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Team services
            </h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Visibility features that make team execution predictable and transparent.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <ServiceCard
              icon={<Users className="h-5 w-5" />}
              title="Team workload insights"
              desc="Understand who is overloaded and what needs attention with member-level workload stats."
              points={[
                "Assigned/created/open counts per member",
                "Overdue signals for escalation",
                "Quick access to member detail views",
              ]}
            />

            <ServiceCard
              icon={<Filter className="h-5 w-5" />}
              title="Filtering & search"
              desc="Find tasks fast using search, status filters, priority filters, and personal views."
              points={[
                "Debounced search for performance",
                "Personal views: assigned, created, overdue, all",
                "Stable pagination and ordering",
              ]}
            />

            <ServiceCard
              icon={<Zap className="h-5 w-5" />}
              title="Real-time updates"
              desc="Keep the UI instantly consistent using Socket.io events with a safe reconciliation refresh."
              points={[
                "Task created/updated/deleted events",
                "Notification upserts with unread delta logic",
                "Throttled refresh to prevent loops",
              ]}
            />
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                How engagement typically works
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Whether you are onboarding a small team or scaling up a workspace, we keep the setup practical and fast.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Step n="01" title="Define workflow" desc="Choose statuses, priorities, and the way tasks should be assigned." />
                <Step n="02" title="Enable visibility" desc="Turn on personal views, filters, and the dashboard overview." />
                <Step n="03" title="Activate real-time" desc="Connect Socket.io/SSE so everyone stays in sync instantly." />
              </div>
            </div>

            <Card className="w-full lg:w-105 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Included in every plan
                </CardTitle>
                <CardDescription>Quality defaults, no surprise complexity.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Responsive UI built with Shadcn components" />
                <Bullet text="Secure server-side session checks" />
                <Bullet text="No-store APIs for fresh, accurate dashboards" />
                <Bullet text="Clear, maintainable code patterns for scaling" />
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Need a custom workflow or additional roles? You can extend services per workspace.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95">
                <Link href="/contact">
                  Talk to us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/support">Get support</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ServiceCard({
  icon,
  title,
  desc,
  points,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  points: string[];
}) {
  return (
    <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <IconBox>{icon}</IconBox>
          <div className="min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{desc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {points.map((p) => (
          <div key={p} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-400" />
            <div className="text-sm text-slate-700 dark:text-slate-200">{p}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-950/30 p-4">
      <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50">{n}</span>
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 dark:text-slate-50">{title}</div>
        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</div>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-400" />
      <div className="text-sm text-slate-700 dark:text-slate-200">{text}</div>
    </div>
  );
}

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-2xl",
        "bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20"
      )}
    >
      {children}
    </div>
  );
}

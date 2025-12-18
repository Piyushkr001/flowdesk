// app/(marketing)/features/page.tsx
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
  ListChecks,
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

export default function FeaturesPage() {
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
                  Features
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Tasks • Notifications • Team
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Built for clarity, speed, and real-time execution.
              </h1>

              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                From personal views (assigned/created/overdue) to live dashboards with Socket.io,
                you get a predictable workflow and visibility you can trust.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                >
                  <Link href="/dashboard">
                    Open dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/dashboard/tasks">Explore tasks</Link>
                </Button>
              </div>
            </div>

            <Card className="w-full lg:w-105 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Platform highlights
                </CardTitle>
                <CardDescription>Quality defaults that scale.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Secure session-guarded APIs (no-store responses)" />
                <Bullet text="Clean enums for status/priority (legacy-safe)" />
                <Bullet text="Live UI updates + reconcile refresh (prevents drift)" />
                <Bullet text="Responsive UI with Shadcn components" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Core features
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                Designed as a cohesive system: creation → ownership → deadlines → visibility → alerts.
              </p>
            </div>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/dashboard/tasks/new">Create task</Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <FeatureCard
                icon={<LayoutGrid className="h-5 w-5" />}
                title="Task lifecycle"
                desc="Structured workflow with clear states and consistent behavior."
                points={[
                  "Statuses: todo, in_progress, review, completed",
                  "Priority levels for quick triage",
                  "Fast create/edit with safe validation",
                ]}
              />

              <FeatureCard
                icon={<CalendarClock className="h-5 w-5" />}
                title="Due dates & overdue view"
                desc="Detect risks early and keep delivery predictable."
                points={[
                  "Due date sorting for daily planning",
                  "Overdue view avoids completed/done tasks",
                  "Readable date formatting across devices",
                ]}
              />

              <FeatureCard
                icon={<Filter className="h-5 w-5" />}
                title="Search & filters"
                desc="Find the right work instantly, even as the workspace grows."
                points={[
                  "Debounced search for performance",
                  "Filters by status and priority",
                  "Personal views: all / assigned / created / overdue",
                ]}
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <FeatureCard
                icon={<Bell className="h-5 w-5" />}
                title="Notifications"
                desc="Stay informed without noise. Unread count stays accurate."
                points={[
                  "New assignment notifications",
                  "Unread counter uses delta logic (prevents double counts)",
                  "Bulk updates reconcile from server truth",
                ]}
              />

              <FeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Real-time updates"
                desc="Instant UI changes with safety nets that keep data correct."
                points={[
                  "Socket.io task events: created/updated/deleted",
                  "Debounced reconcile fetch after events",
                  "Works even if realtime is unavailable",
                ]}
              />

              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Team visibility"
                desc="Understand workload distribution and focus areas."
                points={[
                  "Member list with workload signals",
                  "Assigned/created/open/overdue counts",
                  "Member details page to browse their tasks",
                ]}
              />
            </div>
          </div>
        </section>

        {/* “What you get” + CTA */}
        <section className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:items-start lg:justify-between">
            <div className="flex-1">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                What you get on day one
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Features are intentionally practical: everything is measurable, visible, and easy to operate.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Step n="01" title="A clean dashboard" desc="Overview cards and recent items that update live." />
                <Step n="02" title="A robust tasks page" desc="Filters, search, create/edit sheet, and actions." />
                <Step n="03" title="Team insights" desc="Workload signals and a detail view per member." />
              </div>
            </div>

            <Card className="w-full lg:w-105 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Best for
                </CardTitle>
                <CardDescription>Common use cases.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Student projects and internship deliverables" />
                <Bullet text="Small teams tracking tasks & ownership" />
                <Bullet text="Admins monitoring member workload signals" />
                <Bullet text="Fast-moving workflows that need realtime" />
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Want an “Open task” page, assignee switching, or role-based controls? Add features incrementally.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95">
                <Link href="/dashboard/tasks">
                  Explore tasks
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/support">Support</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Mini section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MiniCard
            icon={<ListChecks className="h-5 w-5" />}
            title="Reliable task stats"
            desc="Counts for assigned/created/open/overdue power dashboards and team signals."
          />
          <MiniCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Safe API patterns"
            desc="No-store responses and server-side session checks to keep data fresh and secure."
          />
          <MiniCard
            icon={<Zap className="h-5 w-5" />}
            title="Realtime-first UX"
            desc="Instant UI updates with reconcile refresh for correctness and stability."
          />
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
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

function MiniCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <IconBox>{icon}</IconBox>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 dark:text-slate-50">{title}</div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</div>
          </div>
        </div>
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

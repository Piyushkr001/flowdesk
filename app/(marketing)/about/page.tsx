// app/(marketing)/about/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users,
  Target,
  Mail,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-6xl flex flex-col gap-10">
        {/* Hero */}
        <section className="flex flex-col gap-6 rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  About
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Secure • Fast • Collaborative
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                We help teams plan, assign, and deliver work with clarity.
              </h1>

              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Our workspace is built for modern task workflows—real-time updates, simple organization,
                and reliable reporting so you always know what’s happening, who owns it, and what’s due next.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                >
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-xl">
                  <Link href="/dashboard/tasks">Explore Tasks</Link>
                </Button>
              </div>
            </div>

            {/* Trust card */}
            <Card className="w-full lg:w-95 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  What we optimize for
                </CardTitle>
                <CardDescription>Principles that guide product decisions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Simple workflows that scale with your team" />
                <Bullet text="Real-time clarity across tasks and notifications" />
                <Bullet text="Secure-by-default access patterns" />
                <Bullet text="Clean UI that stays fast on every device" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Metrics / Highlights */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Built for real workflows
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                From individual productivity to multi-user execution—everything stays structured and easy to track.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <IconBox>
                    <Target className="h-5 w-5" />
                  </IconBox>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">Mission</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Make task tracking and accountability effortless—so teams spend less time coordinating and more time delivering.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <IconBox>
                    <Users className="h-5 w-5" />
                  </IconBox>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-50">Who it’s for</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Teams who want a clean workflow: assign tasks, set deadlines, get notified, and stay aligned—without clutter.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                What you get
              </h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                A set of primitives that help you ship work faster and avoid missed deadlines.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Core capabilities</CardTitle>
                <CardDescription>Designed for daily execution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Personal views: assigned, created, overdue, all" />
                <Bullet text="Status & priority to organize work quickly" />
                <Bullet text="Live updates (Socket.io/SSE) for instant visibility" />
                <Bullet text="Notifications to reduce missed handoffs" />
              </CardContent>
            </Card>

            <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quality and reliability</CardTitle>
                <CardDescription>Stable, secure, and fast.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Bullet text="Server-side auth checks and no-store responses" />
                <Bullet text="Pagination, filtering, and search for scalability" />
                <Bullet text="Optimized UI for mobile and desktop" />
                <Bullet text="Consistent components via Shadcn UI" />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Ready to organize your workflow?
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Create tasks, assign owners, and track deadlines in one place—fully responsive and built for speed.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
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
                <Link href="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact
                </Link>
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Secure-by-default
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Built with Next.js + Shadcn UI
            </div>
          </div>
        </section>
      </div>
    </main>
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

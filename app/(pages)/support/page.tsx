// app/(pages)/support/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  LifeBuoy,
  MessageSquare,
  Mail,
  FileText,
  Clock,
  ShieldCheck,
  ChevronRight,
  Search,
  HelpCircle,
  Bug,
  Settings,
  CreditCard,
  Lock,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Topic = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  tags?: string[];
};

type FAQ = {
  q: string;
  a: React.ReactNode;
  keywords: string[];
};

const TOPICS: Topic[] = [
  {
    icon: <HelpCircle className="h-4 w-4" />,
    title: "Getting started",
    desc: "Setup, onboarding, and first steps.",
    href: "/support/getting-started",
    tags: ["docs", "setup"],
  },
  {
    icon: <Settings className="h-4 w-4" />,
    title: "Account & settings",
    desc: "Profile, preferences, and workspace settings.",
    href: "/support/account",
    tags: ["account", "profile"],
  },
  {
    icon: <Bug className="h-4 w-4" />,
    title: "Troubleshooting",
    desc: "Common issues and quick fixes.",
    href: "/support/troubleshooting",
    tags: ["errors", "fix"],
  },
  {
    icon: <CreditCard className="h-4 w-4" />,
    title: "Billing",
    desc: "Plans, invoices, and payments.",
    href: "/support/billing",
    tags: ["plans", "invoices"],
  },
  {
    icon: <Lock className="h-4 w-4" />,
    title: "Security",
    desc: "Privacy, data, and access controls.",
    href: "/support/security",
    tags: ["privacy", "roles"],
  },
  {
    icon: <FileText className="h-4 w-4" />,
    title: "Documentation",
    desc: "Guides and product reference.",
    href: "/docs",
    tags: ["api", "guides"],
  },
];

const FAQS: FAQ[] = [
  {
    q: "How do I contact support?",
    a: (
      <div className="space-y-2">
        <p>
          Use the quick actions on this page to email support or open a ticket.
          If you have an account, include your workspace name and a short
          description of what you tried.
        </p>
        <p className="text-sm text-muted-foreground">
          Tip: Add screenshots and the exact error message to speed up resolution.
        </p>
      </div>
    ),
    keywords: ["contact", "email", "ticket", "help"],
  },
  {
    q: "What information should I include in a bug report?",
    a: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Steps to reproduce</li>
        <li>Expected vs actual behavior</li>
        <li>Browser / device</li>
        <li>Console or server logs (if available)</li>
        <li>Screenshots or short screen recording</li>
      </ul>
    ),
    keywords: ["bug", "report", "logs", "console", "steps"],
  },
  {
    q: "Where can I find documentation and guides?",
    a: (
      <div className="space-y-2">
        <p>
          You can access product guides in the Documentation section. If you’re
          integrating APIs, check the reference docs and examples.
        </p>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/docs">Open docs</Link>
        </Button>
      </div>
    ),
    keywords: ["docs", "documentation", "guide", "api"],
  },
  {
    q: "How fast will I get a response?",
    a: (
      <div className="space-y-2">
        <p>
          Response times depend on your plan and the issue severity. Critical
          access issues are prioritized.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Badge variant="secondary" className="rounded-full w-fit">
            Typical: 24–48 hours
          </Badge>
          <Badge variant="outline" className="rounded-full w-fit">
            Priority issues handled sooner
          </Badge>
        </div>
      </div>
    ),
    keywords: ["response", "time", "sla", "support hours"],
  },
];

function contains(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export default function SupportPage() {
  const [query, setQuery] = React.useState("");

  const filteredTopics = React.useMemo(() => {
    const q = query.trim();
    if (!q) return TOPICS;

    return TOPICS.filter((t) => {
      const blob = `${t.title} ${t.desc} ${(t.tags || []).join(" ")}`;
      return contains(blob, q);
    });
  }, [query]);

  const filteredFaqs = React.useMemo(() => {
    const q = query.trim();
    if (!q) return FAQS;

    return FAQS.filter((f) => {
      const blob = `${f.q} ${f.keywords.join(" ")}`;
      return contains(blob, q);
    });
  }, [query]);

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
              <ShieldCheck className="h-4 w-4" />
              Support Center
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              How can we help?
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Search help articles, review FAQs, or contact support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              asChild
              className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
            >
              <Link href="mailto:support@example.com?subject=Support%20Request">
                <Mail className="mr-2 h-4 w-4" />
                Email support
              </Link>
            </Button>

            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/contact">
                <MessageSquare className="mr-2 h-4 w-4" />
                Open a ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <Card className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search topics or FAQs (e.g., billing, login, notifications)..."
                  className="h-11 rounded-xl pl-9"
                />
              </div>

              <div className="flex items-center justify-between lg:justify-end gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {filteredTopics.length} topics
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {filteredFaqs.length} FAQs
                </Badge>

                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setQuery("")}
                  disabled={!query.trim()}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="flex flex-col lg:flex-row gap-4">
          <Card className="flex-1 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg inline-flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                Quick actions
              </CardTitle>
              <CardDescription>Fastest ways to get help.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionRow
                icon={<MessageSquare className="h-4 w-4" />}
                title="Open a support ticket"
                desc="Best for account or product issues."
                href="/contact"
              />
              <ActionRow
                icon={<Mail className="h-4 w-4" />}
                title="Email support"
                desc="Include logs and screenshots if possible."
                href="mailto:support@example.com?subject=Support%20Request"
                external
              />
              <ActionRow
                icon={<FileText className="h-4 w-4" />}
                title="Browse documentation"
                desc="API reference and implementation guides."
                href="/docs"
              />
              <ActionRow
                icon={<Clock className="h-4 w-4" />}
                title="Support hours"
                desc="Mon–Fri, 10:00–18:00 (local)."
                href="/support/hours"
              />
            </CardContent>
          </Card>

          <Card className="w-full lg:w-105 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base sm:text-lg">Status</CardTitle>
              <CardDescription>System health and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 rounded-xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-slate-950/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    All systems operational
                  </div>
                  <Badge className="rounded-full">Live</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  If you experience issues, create a ticket with your workspace name and time of occurrence.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="rounded-xl w-full">
                  <Link href="/status">View status page</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl w-full">
                  <Link href="/changelog">Changelog</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Topics */}
        <Card className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Support topics</CardTitle>
            <CardDescription>Pick a category to find the right guidance.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTopics.length === 0 ? (
              <div className="rounded-xl border border-black/5 bg-white/60 p-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/30">
                No topics match your search. Try a different keyword.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredTopics.map((t) => (
                  <Link
                    key={t.title}
                    href={t.href}
                    className="group rounded-xl border border-black/5 bg-white p-4 transition hover:bg-black/5 dark:border-white/10 dark:bg-slate-950 dark:hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
                          {t.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="truncate font-semibold text-slate-900 dark:text-slate-50">
                              {t.title}
                            </div>
                            {(t.tags || []).slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="rounded-full">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {t.desc}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Frequently asked questions</CardTitle>
            <CardDescription>Quick answers to common questions.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <div className="rounded-xl border border-black/5 bg-white/60 p-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/30">
                No FAQs match your search. Try different keywords.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((f, i) => (
                  <AccordionItem key={f.q} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-slate-600 dark:text-slate-300">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Footer note */}
        <Card className="rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Need faster help? Share your exact error message, steps to reproduce, and screenshots.
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/contact">Open a ticket</Link>
              </Button>
              <Button
                asChild
                className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
              >
                <Link href="mailto:support@example.com?subject=Support%20Request" target="_blank">
                  Email support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function ActionRow({
  icon,
  title,
  desc,
  href,
  external,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  external?: boolean;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-black/5 bg-white p-4 hover:bg-black/5 transition dark:border-white/10 dark:bg-slate-950 dark:hover:bg-white/5">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900 dark:text-slate-50">{title}</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{desc}</div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}

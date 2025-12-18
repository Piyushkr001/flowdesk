// app/(pages)/privacy/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Lock,
  ShieldCheck,
  Database,
  Cookie,
  Globe,
  FileText,
  Mail,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type TocItem = { id: string; title: string; icon: React.ReactNode };

const TOC: TocItem[] = [
  { id: "overview", title: "Overview", icon: <FileText className="h-4 w-4" /> },
  { id: "info-we-collect", title: "Information we collect", icon: <Database className="h-4 w-4" /> },
  { id: "how-we-use", title: "How we use information", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "sharing", title: "Sharing and disclosure", icon: <Globe className="h-4 w-4" /> },
  { id: "cookies", title: "Cookies", icon: <Cookie className="h-4 w-4" /> },
  { id: "security", title: "Security", icon: <Lock className="h-4 w-4" /> },
  { id: "retention", title: "Data retention", icon: <Database className="h-4 w-4" /> },
  { id: "rights", title: "Your rights", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "contact", title: "Contact", icon: <Mail className="h-4 w-4" /> },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h2>
        <Button
          variant="outline"
          className="rounded-xl h-9 px-3"
          onClick={() => scrollToId("top")}
        >
          Back to top
        </Button>
      </div>
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300 space-y-3">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const lastUpdated = "Dec 17, 2025"; // update on publish

  return (
    <main id="top" className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
              <Lock className="h-4 w-4" />
              Privacy
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Privacy Policy
            </h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              This policy explains what we collect, how we use it, and the choices you have.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                Last updated: {lastUpdated}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Version 1.0
              </Badge>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/terms">
                <FileText className="mr-2 h-4 w-4" />
                Terms
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
            >
              <Link href="/contact">
                <Mail className="mr-2 h-4 w-4" />
                Contact
              </Link>
            </Button>
          </div>
        </div>

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* TOC */}
          <Card className="w-full lg:w-85 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 h-screen">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">On this page</CardTitle>
              <CardDescription>Jump to a section.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="max-h-105 pr-2">
                <div className="flex flex-col gap-2">
                  {TOC.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToId(item.id)}
                      className={cn(
                        "w-full text-left rounded-xl border border-black/5 dark:border-white/10",
                        "bg-white dark:bg-slate-950 px-3 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
                            {item.icon}
                          </span>
                          <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {item.title}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Content */}
          <Card className="flex-1 rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Policy</CardTitle>
              <CardDescription>
                UI-friendly privacy template. Replace placeholders with your actual data practices and legal language.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <Section id="overview" title="1) Overview">
                <p>
                  This Privacy Policy describes how we collect, use, and share information when you use our
                  Services. By using the Services, you agree to the collection and use of information in
                  accordance with this policy.
                </p>
              </Section>

              <Separator />

              <Section id="info-we-collect" title="2) Information we collect">
                <p>We may collect the following categories of information:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-semibold">Account data:</span> name, email, profile image, workspace role.
                  </li>
                  <li>
                    <span className="font-semibold">Usage data:</span> pages viewed, actions taken, timestamps, diagnostics.
                  </li>
                  <li>
                    <span className="font-semibold">Content you submit:</span> tasks, notes, messages, uploads (as applicable).
                  </li>
                  <li>
                    <span className="font-semibold">Device data:</span> browser type, IP address, approximate location.
                  </li>
                </ul>

                <div className="mt-4 rounded-xl border border-black/5 bg-white/60 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/30">
                  Tip: If you store personal data or handle sensitive categories, explicitly list them here and
                  document your lawful basis and processing purposes.
                </div>
              </Section>

              <Separator />

              <Section id="how-we-use" title="3) How we use information">
                <p>We use information to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide, operate, and maintain the Services</li>
                  <li>Authenticate users and secure accounts</li>
                  <li>Enable collaboration features (e.g., tasks, assignments, notifications)</li>
                  <li>Improve performance, UX, and reliability</li>
                  <li>Respond to requests and provide support</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </Section>

              <Separator />

              <Section id="sharing" title="4) Sharing and disclosure">
                <p>We may share information with:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-semibold">Service providers</span> (hosting, email delivery, analytics) under contract
                  </li>
                  <li>
                    <span className="font-semibold">Your organization/workspace</span> (admins may see certain metadata)
                  </li>
                  <li>
                    <span className="font-semibold">Legal authorities</span> if required by law or to protect rights and safety
                  </li>
                </ul>
                <p>
                  We do not sell personal information in the ordinary course of business. If this changes, we will update
                  this policy and provide required notices.
                </p>
              </Section>

              <Separator />

              <Section id="cookies" title="5) Cookies">
                <p>
                  We use cookies and similar technologies to keep you signed in, remember preferences, and measure usage.
                  You can control cookies via your browser settings; however, disabling cookies may impact functionality.
                </p>
              </Section>

              <Separator />

              <Section id="security" title="6) Security">
                <p>
                  We implement reasonable technical and organizational measures to protect information, including access
                  controls, encryption in transit where supported, and monitoring for abuse.
                </p>
                <p>
                  No method of transmission or storage is 100% secure. You are responsible for safeguarding your credentials.
                </p>
              </Section>

              <Separator />

              <Section id="retention" title="7) Data retention">
                <p>
                  We retain personal information for as long as necessary to provide the Services, comply with legal
                  obligations, resolve disputes, and enforce agreements. Retention periods vary based on data type and
                  business needs.
                </p>
              </Section>

              <Separator />

              <Section id="rights" title="8) Your rights">
                <p>
                  Depending on your location, you may have rights to access, correct, delete, or export your personal
                  information, and to object to certain processing. You can request assistance via Support or Contact.
                </p>
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="outline" className="rounded-xl w-fit">
                    <Link href="/support">Support</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95 w-fit"
                  >
                    <Link href="/contact">Contact</Link>
                  </Button>
                </div>
              </Section>

              <Separator />

              <Section id="contact" title="9) Contact">
                <p>
                  If you have questions about this Privacy Policy or our data practices, contact us using the Contact page
                  or email support.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95">
                    <Link href="/contact">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="mailto:support@example.com?subject=Privacy%20Question" target="_blank">
                      Email support
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 rounded-xl border border-black/5 bg-white/60 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/30">
                  Legal note: For production deployment, confirm compliance requirements (e.g., GDPR/DPDP/CCPA),
                  and have counsel review if needed.
                </div>
              </Section>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

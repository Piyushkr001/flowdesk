// app/(pages)/terms/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  Scale,
  Lock,
  AlertTriangle,
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

type TocItem = {
  id: string;
  title: string;
  icon: React.ReactNode;
};

const TOC: TocItem[] = [
  { id: "intro", title: "Overview", icon: <FileText className="h-4 w-4" /> },
  { id: "eligibility", title: "Eligibility", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "accounts", title: "Accounts", icon: <Lock className="h-4 w-4" /> },
  { id: "acceptable-use", title: "Acceptable use", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "payments", title: "Payments", icon: <Scale className="h-4 w-4" /> },
  { id: "termination", title: "Termination", icon: <AlertTriangle className="h-4 w-4" /> },
  { id: "disclaimer", title: "Disclaimers", icon: <Scale className="h-4 w-4" /> },
  { id: "privacy", title: "Privacy", icon: <Lock className="h-4 w-4" /> },
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

export default function TermsPage() {
  const lastUpdated = "Dec 17, 2025"; // update when you publish changes

  return (
    <main id="top" className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
              <Scale className="h-4 w-4" />
              Terms & Conditions
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Terms of Service
            </h1>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Please read these terms carefully. By using the product, you agree to them.
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
              <Link href="/privacy">
                <Lock className="mr-2 h-4 w-4" />
                Privacy Policy
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
              <CardTitle className="text-base">Agreement</CardTitle>
              <CardDescription>
                This template is a UI-friendly Terms page. Replace placeholders with your actual legal text.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              <Section id="intro" title="1) Overview">
                <p>
                  These Terms of Service (“Terms”) govern your access to and use of our website, applications,
                  and services (“Services”). By accessing or using the Services, you agree to be bound by these Terms.
                </p>
                <p>
                  If you do not agree, do not use the Services. If you are using the Services on behalf of an
                  organization, you represent that you are authorized to accept these Terms on its behalf.
                </p>
              </Section>

              <Separator />

              <Section id="eligibility" title="2) Eligibility">
                <p>
                  You must be legally capable of entering into a binding contract to use the Services.
                  If you are under the age of majority in your jurisdiction, you may only use the Services
                  with consent and supervision of a parent or legal guardian.
                </p>
              </Section>

              <Separator />

              <Section id="accounts" title="3) Accounts">
                <p>
                  You are responsible for maintaining the confidentiality of your account credentials and for
                  all activity that occurs under your account. You agree to notify us immediately of any
                  unauthorized use or security breach.
                </p>
                <p>
                  We may suspend or terminate accounts that violate these Terms or that pose a security risk.
                </p>
              </Section>

              <Separator />

              <Section id="acceptable-use" title="4) Acceptable use">
                <p>You agree not to misuse the Services. Examples of prohibited behavior include:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Attempting unauthorized access to systems or data</li>
                  <li>Disrupting or degrading service availability</li>
                  <li>Uploading malware or harmful code</li>
                  <li>Violating intellectual property rights</li>
                  <li>Using the Services for unlawful activities</li>
                </ul>
              </Section>

              <Separator />

              <Section id="payments" title="5) Payments and subscriptions">
                <p>
                  If you purchase a paid plan, you agree to pay the applicable fees and taxes. Subscription
                  terms, billing cycles, renewal behavior, and cancellation rules will be described at checkout
                  or in your billing settings.
                </p>
                <p>
                  Unless required by law, fees are non-refundable. We may change pricing with reasonable notice.
                </p>
              </Section>

              <Separator />

              <Section id="termination" title="6) Termination">
                <p>
                  You may stop using the Services at any time. We may suspend or terminate your access if you
                  breach these Terms or if required to comply with law or protect the Services and other users.
                </p>
                <p>
                  Upon termination, your right to use the Services ends immediately. Some provisions of these
                  Terms will survive termination (e.g., disclaimers, limitation of liability).
                </p>
              </Section>

              <Separator />

              <Section id="disclaimer" title="7) Disclaimers and limitation of liability">
                <p>
                  The Services are provided “as is” and “as available.” To the maximum extent permitted by law,
                  we disclaim all warranties of any kind, whether express or implied.
                </p>
                <p>
                  To the maximum extent permitted by law, we are not liable for indirect, incidental, special,
                  consequential, or punitive damages, or any loss of profits or revenues.
                </p>
              </Section>

              <Separator />

              <Section id="privacy" title="8) Privacy">
                <p>
                  Our Privacy Policy explains how we collect, use, and protect information. By using the Services,
                  you agree to our data practices described in the Privacy Policy.
                </p>
                <Button asChild variant="outline" className="rounded-xl w-fit">
                  <Link href="/privacy">Read Privacy Policy</Link>
                </Button>
              </Section>

              <Separator />

              <Section id="contact" title="9) Contact">
                <p>
                  If you have questions about these Terms, contact us using the Contact page or email support.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild className="rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95">
                    <Link href="/contact">Contact</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="mailto:support@example.com?subject=Terms%20Question" target="_blank">
                      Email support
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 rounded-xl border border-black/5 bg-white/60 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-slate-950/30">
                  Legal note: If you need production-grade terms, consult qualified legal counsel and adapt this content
                  to your jurisdiction, business model, and data practices.
                </div>
              </Section>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

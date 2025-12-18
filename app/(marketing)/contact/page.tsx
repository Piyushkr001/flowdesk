// app/(marketing)/contact/page.tsx
"use client";

import * as React from "react";
import { Mail, Phone, MapPin, Send, ShieldCheck, Clock } from "lucide-react";
import toast from "react-hot-toast";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// If you have shadcn Textarea component:
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  // honeypot (spam trap) – keep empty
  company: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ContactPage() {
  const [form, setForm] = React.useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
    company: "",
  });
  const [sending, setSending] = React.useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    if (!name) return toast.error("Name is required.");
    if (!email || !isValidEmail(email)) return toast.error("Enter a valid email.");
    if (!subject) return toast.error("Subject is required.");
    if (!message || message.length < 10) return toast.error("Message should be at least 10 characters.");

    setSending(true);
    const tId = toast.loading("Sending message...");

    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, company: form.company }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to send message.");

      toast.dismiss(tId);
      toast.success("Message sent. We’ll get back to you soon.");

      setForm({ name: "", email: "", subject: "", message: "", company: "" });
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-10">
      <div className="mx-auto max-w-6xl flex flex-col gap-8">
        {/* Header */}
        <section className="rounded-3xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Contact
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  Support • Sales • Feedback
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Talk to us
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
                Send us a message and we’ll respond as soon as possible. This form is secure and routed to our support inbox.
              </p>
            </div>

            <div className="w-full lg:w-105">
              <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Response time
                  </CardTitle>
                  <CardDescription>Typical turnaround</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  We usually reply within <span className="font-semibold">24 hours</span> on business days.
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Two-column layout */}
        <section className="flex flex-col lg:flex-row gap-6">
          {/* Form */}
          <Card className="flex-1 rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Send a message</CardTitle>
              <CardDescription>Fill out the form and we’ll reach out.</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="flex flex-col gap-5">
                {/* Honeypot field (hidden) */}
                <input
                  value={form.company}
                  onChange={(e) => set("company", e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      className="h-11 rounded-xl"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Your name"
                    />
                  </div>

                  <div className="flex-1 grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="h-11 rounded-xl"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    className="h-11 rounded-xl"
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    placeholder="e.g., Need help with tasks & notifications"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={form.message}
                    onChange={(e: { target: { value: string; }; }) => set("message", e.target.value)}
                    className={cn(
                      "min-h-35 rounded-xl",
                      "bg-background"
                    )}
                    placeholder="Write your message…"
                  />
                  <p className="text-xs text-muted-foreground">
                    Please include any relevant details (screenshots/errors/steps).
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    By submitting, you agree we may contact you about this request.
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {sending ? "Sending..." : "Send message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info column */}
          <div className="w-full lg:w-105 flex flex-col gap-6">
            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact details</CardTitle>
                <CardDescription>Alternative ways to reach us.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value="support@yourdomain.com" />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value="+91 00000 00000" />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location" value="India (Remote)" />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What happens next</CardTitle>
                <CardDescription>Fast triage and clear follow-up.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <Bullet text="We read your message and categorize it (support/sales/feedback)." />
                <Bullet text="If needed, we’ll ask for logs or a short screen recording." />
                <Bullet text="We follow up with a clear resolution plan." />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
          {value}
        </div>
      </div>
    </div>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
      <div className="text-sm">{text}</div>
    </div>
  );
}

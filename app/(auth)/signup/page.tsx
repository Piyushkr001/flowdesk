"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from "lucide-react";

import GoogleLoginButton from "../_components/GoogleLoginButton";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

// Optional: reusable axios instance
const api = axios.create({
  baseURL: apiBase(), // "" => same-origin (recommended if API is same Next app)
  withCredentials: true,
});

export default function SignupPage() {
  const router = useRouter();
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accept, setAccept] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) return toast.error("Please enter your name.");
    if (!email.trim()) return toast.error("Please enter your email.");
    if (password.trim().length < 6)
      return toast.error("Password must be at least 6 characters.");
    if (!accept) return toast.error("Please accept the Terms and Privacy Policy.");

    setLoading(true);
    const loadingId = toast.loading("Creating your account...");

    try {
      const { data } = await api.post("/api/v1/auth/register", {
        name,
        email,
        password,
      });

      if (!data?.ok) {
        toast.dismiss(loadingId);
        toast.error("Sign up failed. Please try again.");
        return;
      }

      toast.dismiss(loadingId);
      toast.success("Account created successfully!");

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      toast.dismiss(loadingId);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Network error. Please try again.";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-linear-to-b from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Left: marketing */}
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/70 px-3 py-1 text-sm text-slate-700 backdrop-blur dark:border-white/10 dark:bg-slate-950/40 dark:text-slate-200">
              <Zap className="h-4 w-4" />
              Create your FlowDesk workspace
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Get started in minutes.
            </h1>
            <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
              Build a clean workflow, assign tasks, and track delivery with real-time updates.
            </p>

            <div className="mt-6 grid gap-3 max-w-xl">
              <BulletRow text="Role-ready dashboards (assigned, created, overdue)." />
              <BulletRow text="Persistent in-app notifications for assignments." />
              <BulletRow text="Secure authentication and modern UI patterns." />

              <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-50">
                    Security-first
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    Password hashing + cookie-based sessions support.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
              <CardHeader>
                <CardTitle className="text-xl">Sign Up</CardTitle>
                <CardDescription>
                  Create your account to start using FlowDesk.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      className="h-11 rounded-xl"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="h-11 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="At least 6 characters"
                        className="h-11 rounded-xl pr-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-xl"
                        onClick={() => setShowPass((v) => !v)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="accept"
                      checked={accept}
                      onCheckedChange={(v) => setAccept(Boolean(v))}
                    />
                    <Label
                      htmlFor="accept"
                      className="text-sm text-slate-600 dark:text-slate-300 leading-5"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="font-semibold text-sky-700 hover:underline dark:text-sky-300"
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-semibold text-sky-700 hover:underline dark:text-sky-300"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  {/* OR divider */}
                  <div className="relative my-1">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/5 bg-white px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                      or
                    </span>
                  </div>

                  <GoogleLoginButton />

                  <Separator />

                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-semibold text-sky-700 hover:underline dark:text-sky-300"
                    >
                      Login
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

function BulletRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white/70 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <CheckCircle2 className="h-4 w-4 text-sky-700 dark:text-sky-300" />
      <div className="text-sm text-slate-700 dark:text-slate-200">{text}</div>
    </div>
  );
}

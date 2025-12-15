"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, ShieldCheck, Users, Zap } from "lucide-react";

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

export default function LoginPage() {
  const router = useRouter();

  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const loadingId = toast.loading("Signing you in...");

    try {
      const res = await fetch(`${apiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, remember }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.dismiss(loadingId);
        toast.error(data?.message || "Login failed. Please check your credentials.");
        return;
      }

      toast.dismiss(loadingId);
      toast.success("Welcome back!");

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.dismiss(loadingId);
      toast.error("Network error. Please try again.");
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
              <ShieldCheck className="h-4 w-4" />
              Secure sign-in for FlowDesk
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back.
            </h1>

            <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
              Sign in to manage tasks, collaborate in real time, and stay updated
              with persistent notifications.
            </p>

            <div className="mt-6 grid gap-3 max-w-xl">
              <FeatureRow
                icon={<Zap className="h-5 w-5" />}
                title="Real-time updates"
                desc="Task changes sync instantly across sessions."
              />
              <FeatureRow
                icon={<Users className="h-5 w-5" />}
                title="Team collaboration"
                desc="Assign, track, and deliver work with clarity."
              />
              <FeatureRow
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Secure sessions"
                desc="JWT + HttpOnly cookie session support."
              />
            </div>
          </div>

          {/* Right: form */}
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md rounded-2xl border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
              <CardHeader>
                <CardTitle className="text-xl">Login</CardTitle>
                <CardDescription>
                  Enter your credentials to access your dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Input
                        id="password"
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 rounded-xl pr-11"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
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

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={remember}
                        onCheckedChange={(v) => setRemember(Boolean(v))}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm text-slate-600 dark:text-slate-300"
                      >
                        Remember me
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Login"
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
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="font-semibold text-sky-700 hover:underline dark:text-sky-300"
                    >
                      Sign up
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

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white/70 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
      <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-slate-900 dark:text-slate-50">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300">{desc}</div>
      </div>
    </div>
  );
}

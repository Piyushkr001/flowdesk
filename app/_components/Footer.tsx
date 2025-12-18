"use client";

import * as React from "react";
import Link from "next/link";
import {
  Github,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Youtube,
  Instagram,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { XLogoIcon } from "@phosphor-icons/react";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

export default function Footer() {
  const [signedIn, setSignedIn] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Cookie-based auth: include cookies
        const res = await fetch(`${apiBase()}/api/v1/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!mounted) return;

        // If 200 => signed in, else signed out
        setSignedIn(res.ok);
      } catch {
        if (!mounted) return;
        setSignedIn(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="border-t border-black/5 dark:border-white/10 bg-linear-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Top */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Brand */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                FlowDesk
              </div>
              <Badge variant="secondary" className="rounded-full">
                Real-time
              </Badge>
            </div>

            <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-300">
              A professional task manager built for modern teams—real-time collaboration, clean
              dashboards, and persistent notifications.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/features">Features</Link>
              </Button>

              {/* ✅ Disabled when signed in */}
              {signedIn ? (
                <Button size="sm" className="rounded-full" disabled aria-disabled="true">
                  Get Started
                </Button>
              ) : (
                <Button size="sm" className="rounded-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Links */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <FooterCol title="Product">
                <FooterLink href="/features">Features</FooterLink>
                <FooterLink href="/services">Services</FooterLink>
                <FooterLink href="/dashboard">Dashboard</FooterLink>
              </FooterCol>

              <FooterCol title="Company">
                <FooterLink href="/about">About</FooterLink>
                <FooterLink href="/contact">Contact</FooterLink>
                <FooterLink href="/support">Support</FooterLink>
              </FooterCol>

              <FooterCol title="Legal">
                <FooterLink href="/terms">Terms</FooterLink>
                <FooterLink href="/privacy">Privacy</FooterLink>
                <FooterLink href="/cookies">Cookies</FooterLink>
              </FooterCol>
            </div>
          </div>

          {/* Contact + Social */}
          <div className="flex-1">
            <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur p-5">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Contact
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Reach out for support or product questions.
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>support@flowdesk.app</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 00000 00000</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>India</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="icon" className="rounded-xl" asChild>
                  <Link href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub">
                    <Github className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" size="icon" className="rounded-xl" asChild>
                  <Link href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" size="icon" className="rounded-xl" asChild>
                  <Link href="https://twitter.com/" target="_blank" rel="noreferrer" aria-label="Twitter / X">
                    <XLogoIcon className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" size="icon" className="rounded-xl" asChild>
                  <Link href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">
                    <Youtube className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" size="icon" className="rounded-xl" asChild>
                  <Link href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram className="h-4 w-4" />
                  </Link>
                </Button>

                <Button variant="outline" size="sm" className="rounded-xl" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            © {new Date().getFullYear()} FlowDesk. All rights reserved.
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link
              href="/terms"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
            >
              Privacy
            </Link>
            <Link
              href="/support"
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition"
    >
      {children}
    </Link>
  );
}

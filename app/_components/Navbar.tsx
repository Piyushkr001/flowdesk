"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "./ModeToggle";

const menuItems = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Dashboard", link: "/dashboard" },
  { name: "Services", link: "/services" },
  { name: "Features", link: "/features" },
  { name: "Contact", link: "/contact" },
];

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [logoutLoading, setLogoutLoading] = React.useState(false);

  const loadMe = React.useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data } = await axios.get("/api/v1/auth/me", {
        withCredentials: true,
        headers: { "Cache-Control": "no-store" },
      });
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [pathname, loadMe]);

  React.useEffect(() => {
    const onFocus = () => loadMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadMe]);

  async function onLogout() {
    setLogoutLoading(true);
    try {
      await axios.post("/api/v1/auth/logout", {}, { withCredentials: true });
    } finally {
      setUser(null);
      setLogoutLoading(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10">
      <div className="bg-linear-to-r from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/Images/logo/logo_light.svg"
                alt="FlowDesk Logo"
                width={160}
                height={40}
                className="h-9 w-auto dark:hidden"
                priority
              />
              <Image
                src="/Images/logo/logo_dark.svg"
                alt="FlowDesk Logo"
                width={160}
                height={40}
                className="hidden h-9 w-auto dark:block"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {menuItems.map((item) => {
                const active = isActivePath(pathname, item.link);
                return (
                  <Link
                    key={item.name}
                    href={item.link}
                    className={cn(
                      "relative rounded-full px-4 py-2 text-sm font-medium transition",
                      "text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white",
                      "hover:bg-black/5 dark:hover:bg-white/10",
                      active &&
                        "bg-linear-to-r from-sky-500/15 to-indigo-500/15 text-slate-900 dark:text-white ring-1 ring-sky-500/25"
                    )}
                  >
                    {item.name}
                    {active ? (
                      <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-linear-to-r from-sky-500 to-indigo-500" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-2">
              <ModeToggle />
              {authLoading ? (
                <Button variant="ghost" className="rounded-full" disabled>
                  Loading...
                </Button>
              ) : user ? (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  className="rounded-full"
                  disabled={logoutLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutLoading ? "Logging out..." : "Logout"}
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" className="rounded-full">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="rounded-full bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                  >
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              <ModeToggle />
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-black/10 bg-white/70 backdrop-blur hover:bg-white dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[320px] sm:w-90">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <span className="font-extrabold tracking-tight">FlowDesk</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        Menu
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-5 grid gap-2">
                    {menuItems.map((item) => {
                      const active = isActivePath(pathname, item.link);
                      return (
                        <SheetClose asChild key={item.name}>
                          <Button
                            asChild
                            variant="ghost"
                            className={cn(
                              "h-11 justify-start rounded-xl px-4",
                              active &&
                                "bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/25"
                            )}
                          >
                            <Link href={item.link}>{item.name}</Link>
                          </Button>
                        </SheetClose>
                      );
                    })}

                    <Separator className="my-2" />

                    {authLoading ? (
                      <Button className="h-11 rounded-xl" disabled>
                        Loading...
                      </Button>
                    ) : user ? (
                      <Button
                        onClick={onLogout}
                        className="h-11 rounded-xl bg-linear-to-r from-rose-500 to-red-600 text-white hover:opacity-95"
                        disabled={logoutLoading}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {logoutLoading ? "Logging out..." : "Logout"}
                      </Button>
                    ) : (
                      <div className="grid gap-2">
                        <SheetClose asChild>
                          <Button asChild variant="outline" className="h-11 rounded-xl">
                            <Link href="/login">Login</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button
                            asChild
                            className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                          >
                            <Link href="/signup">Sign Up</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

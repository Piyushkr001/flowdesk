"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  ListChecks,
  Bell,
  Users,
  BarChart3,
  Settings,
  LifeBuoy,
  LogOut,
  PanelLeft,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(), // "" is OK (relative to same Next app)
  withCredentials: true,
});

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
};

const NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Tasks", href: "/dashboard/tasks", icon: ListChecks },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    badge: "•",
  },
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const SECONDARY: NavItem[] = [{ label: "Support", href: "/support", icon: LifeBuoy }];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name?: string) {
  const n = (name || "User").trim();
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function SidebarContent({
  pathname,
  user,
  onLogout,
  logoutLoading,
  onNavigate,
}: {
  pathname: string;
  user: SessionUser | null;
  onLogout: () => void;
  logoutLoading: boolean;
  onNavigate?: () => void;
}) {
  const [q, setQ] = React.useState("");

  const filteredNav = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return NAV;
    return NAV.filter((i) => i.label.toLowerCase().includes(query));
  }, [q]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/20">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-extrabold tracking-tight">FlowDesk</div>
            <div className="text-xs text-muted-foreground">Dashboard</div>
          </div>
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search menu..."
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Nav */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          <div className="text-xs font-semibold text-muted-foreground px-2 pb-2">
            Workspace
          </div>

          <div className="grid gap-1">
            {filteredNav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    "h-11 w-full justify-start rounded-xl px-3",
                    active &&
                      "bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/25"
                  )}
                  onClick={onNavigate}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    />
                    <span className="flex-1 text-sm">{item.label}</span>
                    {item.badge ? (
                      <span className="text-xs font-semibold text-sky-600 dark:text-sky-300">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-muted-foreground px-2 pb-2">
              Help
            </div>
            <div className="grid gap-1">
              {SECONDARY.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Button
                    key={item.href}
                    asChild
                    variant="ghost"
                    className={cn(
                      "h-11 w-full justify-start rounded-xl px-3",
                      active &&
                        "bg-linear-to-r from-sky-500/15 to-indigo-500/15 ring-1 ring-sky-500/25"
                    )}
                    onClick={onNavigate}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          active ? "text-foreground" : "text-muted-foreground"
                        )}
                      />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer / user */}
      <div className="p-4">
        {user ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white/70 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-950/40">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{user.name}</div>
                <div className="truncate text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" onClick={onNavigate}>
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    onLogout();
                    onNavigate?.();
                  }}
                  className="text-red-600 focus:text-red-600"
                  disabled={logoutLoading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutLoading ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="grid gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl" onClick={onNavigate}>
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
              onClick={onNavigate}
            >
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const loadMe = React.useCallback(async () => {
    setAuthLoading(true);
    try {
      const { data } = await api.get("/api/v1/auth/me");
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadMe();
  }, [loadMe, pathname]);

  React.useEffect(() => {
    const onFocus = () => loadMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadMe]);

  async function onLogout() {
    setLogoutLoading(true);
    const tId = toast.loading("Logging out...");

    try {
      await api.post("/api/v1/auth/logout", {});
      setUser(null);
      toast.dismiss(tId);
      toast.success("Logged out.");
      router.push("/login");
      router.refresh();
    } catch (err: any) {
      toast.dismiss(tId);
      toast.error(err?.response?.data?.message || "Logout failed.");
    } finally {
      setLogoutLoading(false);
    }
  }

  const Desktop = (
    <aside
      className={cn(
        "hidden lg:flex lg:w-75 lg:flex-col",
        "border-r border-black/5 bg-white/60 backdrop-blur dark:border-white/10 dark:bg-slate-950/30",
        "h-[calc(100vh-64px)] sticky top-16",
        className
      )}
    >
      <SidebarContent
        pathname={pathname}
        user={user}
        onLogout={onLogout}
        logoutLoading={logoutLoading}
      />
    </aside>
  );

  const Mobile = (
    <div className="lg:hidden">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex items-center gap-2">
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
              aria-label="Open sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Dashboard
          </div>
        </div>

        <SheetContent side="left" className="w-[320px] p-0">
          {/* ✅ FIX: SheetContent must include a SheetTitle (DialogTitle) */}
          <SheetHeader className="sr-only">
            <SheetTitle>Dashboard navigation</SheetTitle>
          </SheetHeader>

          <SidebarContent
            pathname={pathname}
            user={user}
            onLogout={onLogout}
            logoutLoading={logoutLoading}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <>
      {Mobile}
      {Desktop}
    </>
  );
}

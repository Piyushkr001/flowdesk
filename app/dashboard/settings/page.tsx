"use client";

import * as React from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  baseURL: apiBase(), // ✅ important for consistency
  withCredentials: true,
  headers: {
    // helps avoid any unexpected intermediate caching
    "Cache-Control": "no-store",
    Pragma: "no-cache",
  },
});

function initials(name?: string) {
  const n = (name || "User").trim();
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function isValidUrlMaybe(value: string) {
  const v = value.trim();
  if (!v) return true; // empty allowed
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function notifySessionUpdated() {
  // ✅ same-tab listeners
  window.dispatchEvent(new Event("flowdesk:session-updated"));

  // ✅ multi-tab listeners
  try {
    const ch = new BroadcastChannel("flowdesk_auth");
    ch.postMessage({ type: "session-updated" });
    ch.close();
  } catch {
    // ignore (older browsers)
  }
}

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [name, setName] = React.useState("");
  const [image, setImage] = React.useState("");

  async function loadProfile() {
    setLoading(true);
    try {
      const { data } = await api.get("/api/v1/users/me");
      const u = (data?.user ?? null) as SessionUser | null;

      setUser(u);
      setName(u?.name ?? "");
      setImage(u?.image ?? "");
    } catch (err: any) {
      setUser(null);

      // Optional: if unauthorized, you can redirect
      if (err?.response?.status === 401) {
        toast.error("Please login to continue.");
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadProfile();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return toast.error("Please login to update your profile.");
    if (!name.trim()) return toast.error("Name is required.");
    if (name.trim().length > 60) return toast.error("Name is too long (max 60).");
    if (!isValidUrlMaybe(image)) return toast.error("Invalid image URL.");

    setSaving(true);
    const t = toast.loading("Saving changes...");

    try {
      const { data } = await api.patch("/api/v1/users/me", {
        name: name.trim(),
        image: image.trim(),
        remember: true,
      });

      const updated = (data?.user ?? null) as SessionUser | null;

      setUser(updated ?? user);
      setName(updated?.name ?? name.trim());
      setImage(updated?.image ?? (image.trim() || ""));

      toast.dismiss(t);
      toast.success("Profile updated.");

      // ✅ make Navbar/Sidebar re-check session + update UI immediately
      notifySessionUpdated();
      router.refresh();
    } catch (err: any) {
      toast.dismiss(t);
      toast.error(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-64px)] px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account details and profile information.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          <Card className="rounded-2xl border-black/5 dark:border-white/10 bg-white/70 dark:bg-slate-950/40 backdrop-blur">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your name and profile image.</CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading profile…</div>
              ) : !user ? (
                <div className="text-sm text-muted-foreground">You are not logged in.</div>
              ) : (
                <form onSubmit={onSave} className="flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <Avatar className="h-14 w-14">
                      <AvatarImage
                        src={image || user.image || undefined}
                        alt={name || user.name}
                      />
                      <AvatarFallback>{initials(name || user.name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          className="h-11 rounded-xl"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="image">Profile Image URL (optional)</Label>
                        <Input
                          id="image"
                          className="h-11 rounded-xl"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input className="h-11 rounded-xl" value={user.email} readOnly />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed in this version.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      onClick={loadProfile}
                      disabled={saving}
                    >
                      Refresh
                    </Button>
                    <Button
                      type="submit"
                      className="h-11 rounded-xl bg-linear-to-r from-sky-500 to-indigo-600 text-white hover:opacity-95"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

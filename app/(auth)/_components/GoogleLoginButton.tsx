"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

const api = axios.create({
  baseURL: apiBase(), // "" => same-origin
  withCredentials: true,
});

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.1-.1-2.2-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.2l-6.3-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.3 39.7 16.1 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3 4.9-5.6 6.3l.1.1 6.3 5.2C39.5 36.3 44 31.4 44 24c0-1.1-.1-2.2-.4-3.5z"
      />
    </svg>
  );
}

export default function GoogleLoginButton({
  remember = true,
}: {
  remember?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async ({ code }) => {
      setLoading(true);
      const tId = toast.loading("Connecting Google account...");

      try {
        const { data } = await api.post("/api/v1/auth/google", {
          code,
          remember,
        });

        if (!data?.ok) {
          throw new Error("Google sign-in failed.");
        }

        toast.dismiss(tId);
        toast.success("Signed in with Google!");

        router.push("/dashboard");
        router.refresh();
      } catch (err: any) {
        toast.dismiss(tId);

        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Google sign-in failed.";

        toast.error(msg);
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error("Google sign-in cancelled or failed.");
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 rounded-xl justify-center gap-2"
      onClick={() => login()}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon className="h-5 w-5" />
      )}
      Continue with Google
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { APP_HOST } from "@/lib/subdomain";
import { navigateToEcosystemSubdomain } from "@/lib/subdomain-session";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function restoreOrRedirect() {
      const isEcosystemSubdomain =
        window.location.hostname !== APP_HOST &&
        window.location.hostname.endsWith(`.${APP_HOST}`);

      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error) {
          history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search,
          );
          if (!cancelled) {
            router.replace("/");
            router.refresh();
          }
          return;
        }
      }

      if (!cancelled && isEcosystemSubdomain) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          router.replace("/");
          router.refresh();
        }
      }
    }

    void restoreOrRedirect();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signin") {
      if (!email || password.length < 6) {
        setMessage("Enter a valid email and a password of at least 6 characters.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const uid = data.user?.id;
      if (uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status, must_change_password")
          .eq("id", uid)
          .single();
        if (profile?.must_change_password) {
          router.push("/setup-password");
          router.refresh();
          return;
        }
        const role = profile?.role;
        const status = profile?.status;
        if (
          (role === "super_admin" || role === "program_admin") &&
          status === "approved"
        ) {
          router.push("/admin");
        } else if (role === "ecosystem_admin" && status === "approved") {
          const { data: staffEcosystem } = await supabase
            .from("ecosystem_staff")
            .select("ecosystem_id, ecosystems!inner(slug)")
            .eq("user_id", uid)
            .eq("role", "ecosystem_admin")
            .limit(1)
            .maybeSingle();
          let slug = staffEcosystem?.ecosystems?.slug;
          if (!slug) {
            const { data: createdEcosystem } = await supabase
              .from("ecosystems")
              .select("slug")
              .eq("created_by", uid)
              .limit(1)
              .maybeSingle();
            slug = createdEcosystem?.slug;
          }
          if (slug && window.location.hostname.toLowerCase() === APP_HOST) {
            const subdomainUrl = `${window.location.protocol}//${slug}.${window.location.host}`;
            await navigateToEcosystemSubdomain(subdomainUrl);
            return;
          }
          if (slug && window.location.hostname.toLowerCase() !== APP_HOST) {
            // Already on the ecosystem subdomain — its root rewrites to the
            // school dashboard.
            router.push("/");
            router.refresh();
            return;
          }
          router.push("/ecosystem");
        } else if (role === "space_admin" && status === "approved") {
          const { data: membership } = await supabase
            .from("space_memberships")
            .select("spaces!inner(slug)")
            .eq("user_id", uid)
            .limit(1)
            .maybeSingle();
          if (membership?.spaces?.slug) {
            router.push(`/spaces/${membership.spaces.slug}`);
          } else {
            router.push("/");
          }
        } else {
          router.push("/");
        }
      }
      router.refresh();
      return;
    }

    // signup — an invitation code is required to join a space
    const code = invitationCode.trim().toUpperCase();
    if (!code) {
      setMessage("An invitation code is required to join a space.");
      setLoading(false);
      return;
    }
    if (!email || password.length < 6 || fullName.trim().length < 2) {
      setMessage("Enter a valid email, a password of at least 6 characters, and your full name.");
      setLoading(false);
      return;
    }

    const { data: info, error: infoError } = await supabase
      .rpc("invitation_code_info", { p_code: code })
      .single();
    if (infoError || !info?.code_valid) {
      setMessage("That invitation code is invalid or has expired.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: email.split("@")[0],
          full_name: fullName,
          invitation_code: code,
          role: "member",
          status: "approved",
          must_change_password: "false",
        },
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>TheGuild</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Sign in to your spaces and ecosystems."
              : "Join a space using an invitation code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input
                    id="full_name"
                    placeholder="Your name"
                    required
                    minLength={2}
                    maxLength={120}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invitation_code">Invitation code</Label>
                  <Input
                    id="invitation_code"
                    placeholder="e.g. MATHLAB"
                    required
                    minLength={4}
                    maxLength={20}
                    pattern="[A-Za-z0-9]+"
                    autoCapitalize="characters"
                    value={invitationCode}
                    onChange={(event) => setInvitationCode(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A code from your space admin — it decides your role in the
                    space.
                  </p>
                </div>
              </>
            ) : null}
            {message ? (
              <p className="text-sm text-destructive">{message}</p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Need an invitation?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => setMode("signup")}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

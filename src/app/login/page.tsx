"use client";

import { useState } from "react";
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    if (mode === "signin") {
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
          .select("must_change_password")
          .eq("id", uid)
          .single();
        if (profile?.must_change_password) {
          router.push("/setup-password");
        } else {
          router.push("/dashboard");
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
    router.push("/dashboard");
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
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invitation_code">Invitation code</Label>
                  <Input
                    id="invitation_code"
                    placeholder="e.g. CIVICLABS"
                    required
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

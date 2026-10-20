import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ApprovalPendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.status === "approved") redirect("/");

  const rejected = profile?.status === "rejected";

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {rejected ? "Account not approved" : "Account awaiting approval"}
          </CardTitle>
          <CardDescription>
            {rejected
              ? "Your account was not approved. Contact the administrator who invited you if you need more information."
              : "Your account is waiting for an administrator to approve it. You can sign in again after approval."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signOut}>
            <Button type="submit" className="w-full">
              Return to sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

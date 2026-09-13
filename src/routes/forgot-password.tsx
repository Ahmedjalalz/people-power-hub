import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, AuthError } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Reset password — People Power Hub" },
    { name: "description", content: "Request a secure People Power Hub password reset link." },
    { property: "og:title", content: "Reset password — People Power Hub" },
    { property: "og:description", content: "Request a secure People Power Hub password reset link." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    
    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      const msg = error instanceof AuthError ? error.message : "Failed to request password reset";
      toast.error(msg);
      setBusy(false);
    }
  };

  return <AuthShell eyebrow="Secure account recovery">
        {success ? (
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-lg bg-success/10 text-success"><MailCheck /></span>
            <h1 className="mt-5 text-3xl font-bold">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              If an account exists with this email, a password reset link has been sent.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">Account help</p>
            <h1 className="mt-2 text-3xl font-bold">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="rounded-lg" />
              </div>
               <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
            <Button asChild variant="link" className="mt-3 w-full"><Link to="/auth">Back to sign in</Link></Button>
          </>
        )}
  </AuthShell>;
}

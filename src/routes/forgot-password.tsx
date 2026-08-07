import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset Password — PeopleLens HR" }] }),
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

  return <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
    <div className="w-full max-w-md"><div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl">
      <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
      
      <div className="relative">
        <div className="mb-6">
          <Button variant="ghost" size="icon" asChild className="mb-4 rounded-full">
            <Link to="/auth">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-pastel-teal">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold">PeopleLens</div>
              <div className="text-xs text-muted-foreground">HR Management</div>
            </div>
          </div>
        </div>

        {success ? (
          <div className="text-center mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists with this email, a password reset link has been sent.
            </p>
            <Button asChild className="w-full mt-6 rounded-xl">
              <Link to="/auth">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
            </form>
          </>
        )}
      </div>
    </div></div>
  </main>;
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/PasswordStrength";
import { resetPassword, AuthError } from "@/lib/auth";

type ResetPasswordSearch = {
  token?: string;
};

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Create New Password — PeopleLens HR" }] }),
  validateSearch: (search: Record<string, unknown>): ResetPasswordSearch => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    };
  },
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    
    if (!token) {
      toast.error("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isPasswordStrong(password)) {
      toast.error("Please ensure your password meets all strength requirements");
      return;
    }

    setBusy(true);
    
    try {
      await resetPassword(password, token);
      setSuccess(true);
    } catch (error: any) {
      const msg = error instanceof AuthError ? error.message : "Failed to reset password";
      toast.error(msg);
      setBusy(false);
    }
  };

  if (!token && !success) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl text-center">
             <h1 className="text-xl font-semibold tracking-tight text-red-500">Invalid Reset Link</h1>
             <p className="mt-2 text-sm text-muted-foreground">The password reset link is invalid or missing the required token.</p>
             <Button asChild className="w-full mt-6 rounded-xl">
               <Link to="/forgot-password">Request a new link</Link>
             </Button>
          </div>
        </div>
      </main>
    );
  }

  return <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
    <div className="w-full max-w-md"><div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl">
      <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
      
      <div className="relative">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-pastel-teal">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-lg font-semibold">PeopleLens</div>
            <div className="text-xs text-muted-foreground">HR Management</div>
          </div>
        </div>

        {success ? (
          <div className="text-center mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">Password reset!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been successfully changed.
            </p>
            <Button asChild className="w-full mt-6 rounded-xl">
              <Link to="/auth">Sign in with new password</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Create new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please enter your new password below.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput id="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" />
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput id="confirmPassword" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={busy || (password !== confirmPassword && confirmPassword.length > 0)}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset password
              </Button>
            </form>
          </>
        )}
      </div>
    </div></div>
  </main>;
}

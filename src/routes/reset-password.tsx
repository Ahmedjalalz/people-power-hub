import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/PasswordStrength";
import { resetPassword, AuthError } from "@/lib/auth";
import { AuthShell } from "@/components/AuthShell";

type ResetPasswordSearch = {
  token?: string;
};

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Create new password — People Power Hub" },
    { name: "description", content: "Choose a new password for your People Power Hub account." },
    { property: "og:title", content: "Create new password — People Power Hub" },
    { property: "og:description", content: "Choose a new password for your People Power Hub account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
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
      <AuthShell eyebrow="Secure account recovery">
          <div className="text-center">
             <h1 className="text-xl font-semibold tracking-tight text-red-500">Invalid Reset Link</h1>
             <p className="mt-2 text-sm text-muted-foreground">The password reset link is invalid or missing the required token.</p>
             <Button asChild className="w-full mt-6 rounded-lg">
               <Link to="/forgot-password">Request a new link</Link>
             </Button>
          </div>
      </AuthShell>
    );
  }

  return <AuthShell eyebrow="Secure account recovery">
        {success ? (
          <div className="text-center mt-6">
            <ShieldCheck className="mx-auto size-12 text-success" />
            <h1 className="mt-5 text-3xl font-bold">Password updated</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your password has been successfully changed.
            </p>
            <Button asChild className="w-full mt-6 rounded-lg">
              <Link to="/auth">Sign in with new password</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">Choose a secure password</p>
            <h1 className="mt-2 text-3xl font-bold">Create a new password</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please enter your new password below.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New Password</Label>
                <PasswordInput id="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-lg" />
                <PasswordStrength password={password} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput id="confirmPassword" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className="rounded-lg" />
              </div>
              <Button type="submit" className="w-full rounded-lg" disabled={busy || (password !== confirmPassword && confirmPassword.length > 0)}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset password
              </Button>
            </form>
          </>
        )}
  </AuthShell>;
}

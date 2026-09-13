import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, ServerCrash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/PasswordStrength";
import { AuthShell } from "@/components/AuthShell";
import { isSignedIn, signup, resendVerification, wakeUpServer, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Create account — People Power Hub" },
    { name: "description", content: "Create your People Power Hub account and start making clearer workforce decisions." },
    { property: "og:title", content: "Create account — People Power Hub" },
    { property: "og:description", content: "Create secure access to your people intelligence workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (isSignedIn()) void navigate({ to: "/", replace: true }); }, [navigate]);

  // Wake up the Render server as soon as the page loads
  useEffect(() => { void wakeUpServer(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setUnverifiedEmail(null);
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!isPasswordStrong(password)) {
      toast.error("Please ensure your password meets all strength requirements");
      return;
    }

    setBusy(true);
    setSlowRequest(false);

    // After 6 s, show the "server waking up" notice
    slowTimer.current = setTimeout(() => setSlowRequest(true), 6_000);

    try {
      await signup(fullName, email, password, confirmPassword);
      toast.success("Account created successfully");
      await navigate({ to: "/check-email", replace: true });
    } catch (error: unknown) {
      const msg = error instanceof AuthError ? (error as AuthError).message : "Failed to sign up";
      const isUnverified = msg.toLowerCase().includes("unverified") || msg.toLowerCase().includes("verify");
      const isDuplicate = msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("duplicate");

      if (isUnverified || isDuplicate) {
        toast.error("An account with this email already exists.");
        setUnverifiedEmail(email);
      } else {
        toast.error(msg);
      }
    } finally {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      setSlowRequest(false);
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    try {
      await resendVerification(unverifiedEmail);
      toast.success("Verification email resent. Please check your inbox.");
      await navigate({ to: "/check-email", replace: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resend verification email";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return <AuthShell eyebrow="A clearer way to support your people">
      <div>
        <p className="text-sm font-semibold text-primary">Get started</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Set up secure access to your workforce insights and decision tools.</p>

        {/* Slow / cold-start notice */}
        {slowRequest && (
          <div role="status" aria-live="polite" className="mt-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
            <ServerCrash className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Still connecting</p>
              <p className="mt-1 text-sm text-muted-foreground">This is taking longer than usual. Your account request is still in progress.</p>
            </div>
          </div>
        )}
        
        {unverifiedEmail && (
          <div role="alert" className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
            <p className="mb-2">If you already created an account but haven't verified your email yet, you can resend the verification link.</p>
            <Button variant="outline" size="sm" onClick={handleResend} disabled={resending} className="w-full rounded-lg bg-white dark:bg-black/20">
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Resend verification email
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" type="text" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" /></div>
          <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput id="confirmPassword" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" aria-invalid={passwordsMismatch} aria-describedby={passwordsMismatch ? "password-match-error" : undefined} />
            {passwordsMismatch && <p id="password-match-error" role="alert" className="text-sm text-destructive">The passwords do not match yet.</p>}
          </div>

          <Button type="submit" className="w-full" disabled={busy || passwordsMismatch}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? (slowRequest ? "Still connecting…" : "Creating account…") : <><span>Create account</span><ArrowRight /></>}
          </Button>
        </form>
        <p className="mt-7 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
  </AuthShell>;
}

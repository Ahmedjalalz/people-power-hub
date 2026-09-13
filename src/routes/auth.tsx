import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, ServerCrash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { AuthShell } from "@/components/AuthShell";
import { isSignedIn, login, resendVerification, wakeUpServer, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Sign in — People Power Hub" },
    { name: "description", content: "Sign in to People Power Hub to understand your workforce and take action." },
    { property: "og:title", content: "Sign in — People Power Hub" },
    { property: "og:description", content: "Secure access to your people intelligence workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect if already signed in
  useEffect(() => { if (isSignedIn()) void navigate({ to: "/", replace: true }); }, [navigate]);

  // Wake up the Render server as soon as the page loads (fire-and-forget)
  useEffect(() => { void wakeUpServer(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setUnverifiedEmail(null);
    setSlowRequest(false);
    setBusy(true);

    // After 6 s, show the "server waking up" notice
    slowTimer.current = setTimeout(() => setSlowRequest(true), 6_000);

    try {
      await login(email, password);
      toast.success("Successfully logged in");
      await navigate({ to: "/", replace: true });
    } catch (error: unknown) {
      const isAuthErr = error instanceof AuthError;
      const msg = isAuthErr ? (error as AuthError).message : "Failed to login";
      const isUnverified = msg.toLowerCase().includes("unverified") || msg.toLowerCase().includes("verify");

      if (isUnverified) {
        toast.error("Please verify your email before logging in.");
        setUnverifiedEmail(email);
      } else {
        toast.error(msg || "Invalid email or password");
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
      setUnverifiedEmail(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resend verification email";
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  return <AuthShell>
      <div>
        <p className="text-sm font-semibold text-primary">Welcome back</p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">Continue to your workspace</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Use your work account to review workforce priorities and continue where you left off.</p>

        {/* Slow / cold-start notice */}
        {slowRequest && (
          <div role="status" aria-live="polite" className="mt-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
            <ServerCrash className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Still connecting</p>
              <p className="mt-1 text-sm text-muted-foreground">This is taking longer than usual. Your sign-in is still in progress.</p>
            </div>
          </div>
        )}

        {unverifiedEmail && (
          <div role="alert" className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-foreground">
            <p className="mb-2">Your email address has not been verified yet. Check your inbox or resend the verification email.</p>
            <Button variant="outline" size="sm" onClick={handleResend} disabled={resending} className="w-full rounded-lg bg-white dark:bg-black/20">
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Resend verification email
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
               <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Forgot password?</Link>
            </div>
            <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? (slowRequest ? "Still connecting…" : "Signing in…") : <><span>Sign in</span><ArrowRight /></>}
          </Button>
        </form>
        <p className="mt-7 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
  </AuthShell>;
}

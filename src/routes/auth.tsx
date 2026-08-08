import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Users, Loader2, ServerCrash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { isSignedIn, login, resendVerification, wakeUpServer, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — PeopleLens HR" }, { name: "description", content: "Sign in to PeopleLens to view HR insights and attrition risk." }] }),
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

  return <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
    <div className="w-full max-w-md"><div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl">
      <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
      <div className="relative"><div className="mb-6 flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-pastel-teal"><Users className="h-5 w-5 text-primary" /></div><div><div className="text-lg font-semibold">PeopleLens</div><div className="text-xs text-muted-foreground">HR Management</div></div></div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your people dashboard.</p>

        {/* Slow / cold-start notice */}
        {slowRequest && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200">
            <ServerCrash className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Server is waking up…</p>
              <p className="mt-0.5 text-xs opacity-80">The backend runs on a free tier and may take up to 60 s to start after inactivity. Please wait — your sign-in is still in progress.</p>
            </div>
          </div>
        )}

        {unverifiedEmail && (
          <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 p-4 text-sm text-amber-900 dark:text-amber-200">
            <p className="mb-2">Your email address has not been verified yet. Check your inbox or resend the verification email.</p>
            <Button variant="outline" size="sm" onClick={handleResend} disabled={resending} className="w-full bg-white dark:bg-black/20">
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Resend verification email
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="rounded-xl" /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <PasswordInput id="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" />
          </div>
          <Button type="submit" className="w-full rounded-xl" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? (slowRequest ? "Waiting for server…" : "Signing in…") : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div></div>
  </main>;
}

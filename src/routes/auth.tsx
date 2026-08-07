import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { isSignedIn, login, resendVerification, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — PeopleLens HR" }, { name: "description", content: "Sign in to PeopleLens to view HR insights and attrition risk." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => { if (isSignedIn()) void navigate({ to: "/", replace: true }); }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setUnverifiedEmail(null);
    setBusy(true);
    
    try {
      await login(email, password);
      toast.success("Successfully logged in");
      await navigate({ to: "/", replace: true });
    } catch (error: any) {
      const msg = error instanceof AuthError ? error.message : "Failed to login";
      const isUnverified = msg.toLowerCase().includes("unverified") || msg.toLowerCase().includes("verify");
      
      if (isUnverified) {
        toast.error("Please verify your email before logging in.");
        setUnverifiedEmail(email);
      } else {
        toast.error("Invalid email or password");
      }
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
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
    <div className="w-full max-w-md"><div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl">
      <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
      <div className="relative"><div className="mb-6 flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-pastel-teal"><Users className="h-5 w-5 text-primary" /></div><div><div className="text-lg font-semibold">PeopleLens</div><div className="text-xs text-muted-foreground">HR Management</div></div></div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your people dashboard.</p>
        
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
          <Button type="submit" className="w-full rounded-xl" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button>
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


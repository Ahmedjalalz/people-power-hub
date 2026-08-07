import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { PasswordStrength, isPasswordStrong } from "@/components/PasswordStrength";
import { isSignedIn, signup, resendVerification, AuthError } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — PeopleLens HR" }, { name: "description", content: "Create an account for PeopleLens to view HR insights and attrition risk." }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => { if (isSignedIn()) void navigate({ to: "/", replace: true }); }, [navigate]);

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
    
    try {
      await signup(fullName, email, password);
      toast.success("Account created successfully");
      await navigate({ to: "/check-email", replace: true });
    } catch (error: any) {
      const msg = error instanceof AuthError ? error.message : "Failed to sign up";
      const isUnverified = msg.toLowerCase().includes("unverified") || msg.toLowerCase().includes("verify");
      const isDuplicate = msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("duplicate");
      
      if (isUnverified || isDuplicate) {
        toast.error("An account with this email already exists.");
        // We assume they might need to verify their email
        setUnverifiedEmail(email);
      } else {
        toast.error(msg);
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
      await navigate({ to: "/check-email", replace: true });
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
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1><p className="mt-1 text-sm text-muted-foreground">Sign up to get started with your people dashboard.</p>
        
        {unverifiedEmail && (
          <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 p-4 text-sm text-amber-900 dark:text-amber-200">
            <p className="mb-2">If you already created an account but haven't verified your email yet, you can resend the verification link.</p>
            <Button variant="outline" size="sm" onClick={handleResend} disabled={resending} className="w-full bg-white dark:bg-black/20">
              {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Resend verification email
            </Button>
          </div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" type="text" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="John Doe" className="rounded-xl" /></div>
          <div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="rounded-xl" /></div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" />
            <PasswordStrength password={password} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput id="confirmPassword" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" />
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={busy || (password !== confirmPassword && confirmPassword.length > 0)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign up</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div></div>
  </main>;
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSignedIn, signIn, TEST_USER } from "@/lib/local-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — PeopleLens HR" }, { name: "description", content: "Sign in to PeopleLens to view HR insights and attrition risk." }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isSignedIn()) void navigate({ to: "/", replace: true }); }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const error = signIn(email, password);
    if (error) { toast.error(error); setBusy(false); return; }
    await navigate({ to: "/", replace: true });
  };

  return <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
    <div className="w-full max-w-md"><div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl">
      <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
      <div className="relative"><div className="mb-6 flex items-center gap-2"><div className="grid h-10 w-10 place-items-center rounded-xl bg-pastel-teal"><Users className="h-5 w-5 text-primary" /></div><div><div className="text-lg font-semibold">PeopleLens</div><div className="text-xs text-muted-foreground">HR Management</div></div></div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your people dashboard.</p>
        <form onSubmit={submit} className="mt-6 space-y-4"><div className="space-y-1.5"><Label htmlFor="email">Work email</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="rounded-xl" /></div><div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="rounded-xl" /></div><Button type="submit" className="w-full rounded-xl" disabled={busy}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Sign in</Button></form>
        <p className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">Testing credentials:<br /><span className="font-medium text-foreground">{TEST_USER.email}</span><br /><span className="font-medium text-foreground">{TEST_USER.password}</span></p>
      </div>
    </div></div>
  </main>;
}

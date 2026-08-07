import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/check-email")({
  head: () => ({ meta: [{ title: "Check Your Email — PeopleLens HR" }] }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-7 shadow-xl text-center">
          <div aria-hidden className="blob pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-pastel-teal opacity-60 blur-3xl" />
          
          <div className="relative flex flex-col items-center">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-pastel-teal/30">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              We've sent a verification link to your email address. Please verify your account before logging in.
            </p>

            <div className="mt-8 w-full space-y-3">
              <Button asChild className="w-full rounded-xl">
                <Link to="/auth">Return to sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

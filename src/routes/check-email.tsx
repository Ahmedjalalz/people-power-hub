import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";

export const Route = createFileRoute("/check-email")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Check your email — People Power Hub" },
    { name: "description", content: "Confirm your email to finish setting up People Power Hub." },
    { property: "og:title", content: "Check your email — People Power Hub" },
    { property: "og:description", content: "Confirm your email to finish setting up People Power Hub." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckEmailPage,
});

function CheckEmailPage() {
  return (
    <AuthShell eyebrow="One last step">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 grid h-16 w-16 place-items-center rounded-lg bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold">Check your email</h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              We've sent a verification link to your email address. Please verify your account before logging in.
            </p>

            <div className="mt-8 w-full space-y-3">
              <Button asChild className="w-full rounded-lg">
                <Link to="/auth">Return to sign in</Link>
              </Button>
            </div>
          </div>
    </AuthShell>
  );
}

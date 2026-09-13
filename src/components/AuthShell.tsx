import { Link } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
};

export function AuthShell({ children, eyebrow = "People operations, made clearer" }: AuthShellProps) {
  return (
    <main className="min-h-dvh bg-background p-3 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:min-h-[calc(100dvh-3rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div aria-hidden className="absolute -right-20 top-24 size-72 rotate-12 rounded-[3rem] border border-primary-foreground/15" />
          <div aria-hidden className="absolute bottom-24 right-16 size-36 rotate-45 rounded-3xl bg-primary-foreground/10" />
          <div className="relative z-10">
            <Link to="/auth" className="inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-foreground text-primary shadow-sm">
                <Users className="size-5" />
              </span>
              <span>
                <span className="block text-lg font-bold">People Power Hub</span>
                <span className="block text-xs text-primary-foreground/75">HR intelligence workspace</span>
              </span>
            </Link>
            <div className="mt-20 max-w-lg">
              <p className="text-sm font-semibold text-primary-foreground/75">{eyebrow}</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight xl:text-5xl">
                Make confident people decisions, without decoding the data.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/80">
                See what needs attention, understand why it matters, and move directly to the right next step.
              </p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: "Secure access" },
              { icon: Sparkles, label: "Clear insights" },
              { icon: HeartHandshake, label: "Human decisions" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="border-t border-primary-foreground/20 pt-4 text-sm text-primary-foreground/80">
                <Icon className="mb-2 size-4" />
                {label}
              </div>
            ))}
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-16">
          <div className="w-full max-w-md page-enter">
            <Link to="/auth" className="mb-10 inline-flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Users className="size-5" /></span>
              <span className="font-bold text-foreground">People Power Hub</span>
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
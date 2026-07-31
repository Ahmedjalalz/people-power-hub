import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CenterPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onBack?: () => void;
  size?: "md" | "lg";
  children: ReactNode;
};

export function CenterPanel({
  open,
  onOpenChange,
  title,
  description,
  onBack,
  size = "md",
  children,
}: CenterPanelProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="panel-veil fixed inset-0 z-50 bg-foreground/25 backdrop-blur-md" />
        <DialogPrimitive.Content
          className={cn(
            "panel-content fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
            "max-h-[86vh] overflow-y-auto rounded-3xl border bg-card p-6 shadow-2xl",
            size === "lg" ? "max-w-4xl" : "max-w-2xl",
          )}
        >
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-pastel-teal hover:text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-xl font-semibold tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-pastel-rose hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

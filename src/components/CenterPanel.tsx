import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CenterPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string;
  onBack?: () => void;
  size?: "md" | "lg";
  children: ReactNode;
};

export function CenterPanel({
  open,
  onOpenChange,
  onClose,
  title,
  description,
  onBack,
  size = "md",
  children,
}: CenterPanelProps) {
  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose?.();
        }
        onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          onClick={handleClose}
          className="panel-veil fixed inset-0 z-50 cursor-pointer bg-foreground/45 backdrop-blur-sm"
        />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Content
            onEscapeKeyDown={() => {
              handleClose();
            }}
            className={cn(
              "panel-content pointer-events-auto w-full focus:outline-none",
               "max-h-[90dvh] overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-2xl sm:p-7",
              size === "lg" ? "max-w-4xl" : "max-w-2xl",
            )}
          >
            <div className="flex items-start gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                   className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="text-xl font-bold tracking-tight text-foreground">
                  {title}
                </DialogPrimitive.Title>
                {description && (
                  <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </DialogPrimitive.Description>
                )}
              </div>
              <DialogPrimitive.Close
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                 className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <div className="mt-5">{children}</div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

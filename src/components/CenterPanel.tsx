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
          className="panel-veil fixed inset-0 z-50 bg-foreground/30 backdrop-blur-lg cursor-pointer"
        />
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPrimitive.Content
            onEscapeKeyDown={() => {
              handleClose();
            }}
            className={cn(
              "panel-content pointer-events-auto w-full",
              "max-h-[88vh] overflow-y-auto rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl",
              size === "lg" ? "max-w-4xl" : "max-w-2xl",
            )}
          >
            <div className="flex items-start gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/80 text-muted-foreground transition-all hover:bg-muted hover:text-foreground hover:scale-105 active:scale-95 cursor-pointer"
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
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted/80 text-muted-foreground transition-all hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 active:scale-95 cursor-pointer"
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

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const modalVariants = cva(
  // Base styles
  "modal bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200",
  {
    variants: {
      size: {
        sm: "modal-sm max-w-md",
        default: "max-w-2xl",
        lg: "modal-lg max-w-4xl",
        xl: "modal-xl max-w-6xl",
        fullscreen: "modal-fullscreen",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  open?: boolean;
  onClose?: () => void;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ className, size, open, onClose, children, ...props }, ref) => {
    // Close on Escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open && onClose) {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [open, onClose]);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    if (!open) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <div className="modal-container fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            ref={ref}
            className={cn(
              modalVariants({ size, className }),
              "animate-slide-in-up w-full max-h-[90vh]"
            )}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            {...props}
          >
            {children}
          </div>
        </div>
      </>
    );
  }
);
Modal.displayName = "Modal";

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
>(({ className, children, onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("modal-header px-6 py-5 flex items-center justify-between flex-shrink-0", className)}
    {...props}
  >
    <div className="flex-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
));
ModalHeader.displayName = "ModalHeader";

const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("modal-body px-6 py-4 overflow-y-auto flex-1", className)}
    {...props}
  />
));
ModalBody.displayName = "ModalBody";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("modal-footer px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0", className)}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-2xl font-bold text-white", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/80 mt-1", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
};

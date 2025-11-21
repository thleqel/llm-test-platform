import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Base styles
  "input w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/15 disabled:bg-gray-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "border-gray-300 hover:border-purple-300 focus:border-purple-500",
        error: "input-error border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-red-500/10",
        success: "input-success border-green-300 hover:border-green-400 focus:border-green-500 focus:ring-green-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

const textareaVariants = cva(
  // Base styles
  "textarea w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/15 disabled:bg-gray-50 disabled:cursor-not-allowed resize-vertical min-h-[100px]",
  {
    variants: {
      variant: {
        default: "border-gray-300 hover:border-purple-300 focus:border-purple-500",
        error: "border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-red-500/10",
        success: "border-green-300 hover:border-green-400 focus:border-green-500 focus:ring-green-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

const selectVariants = cva(
  // Base styles
  "select w-full px-4 py-2.5 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/15 disabled:bg-gray-50 disabled:cursor-not-allowed appearance-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "border-gray-300 hover:border-purple-300 focus:border-purple-500",
        error: "border-red-300 hover:border-red-400 focus:border-red-500 focus:ring-red-500/10",
        success: "border-green-300 hover:border-green-400 focus:border-green-500 focus:ring-green-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectVariants> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <select
        className={cn(selectVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("input-label block text-sm font-semibold text-gray-700 mb-2", className)}
    {...props}
  />
));
Label.displayName = "Label";

const FormHint = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("input-hint text-xs text-gray-600 mt-1.5", className)}
    {...props}
  />
));
FormHint.displayName = "FormHint";

const FormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("input-error-text text-xs text-red-600 mt-1.5 flex items-center gap-1", className)}
    {...props}
  />
));
FormError.displayName = "FormError";

export { Input, Textarea, Select, Label, FormHint, FormError };

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Base styles
  "badge inline-flex items-center gap-1 rounded-lg font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        purple: "badge-purple",
        green: "badge-green",
        red: "badge-red",
        yellow: "badge-yellow",
        gray: "badge-gray",
        blue: "badge-blue",
        indigo: "badge-indigo",
        pink: "badge-pink",
      },
      size: {
        sm: "badge-sm",
        default: "px-2.5 py-1 text-xs",
        lg: "badge-lg",
      },
      dot: {
        true: "badge-dot",
      },
    },
    defaultVariants: {
      variant: "purple",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot, className }))}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };

import * as React from "react";
import { cn } from "../../lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "amber" | "muted" | "danger";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-900",
    muted: "bg-slate-100 text-slate-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", variants[variant], className)}
      {...props}
    />
  );
}

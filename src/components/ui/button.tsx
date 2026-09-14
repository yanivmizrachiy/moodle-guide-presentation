import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "default"|"ghost"|"outline"|"secondary"|"destructive"; size?: "sm"|"md"|"lg"|"icon" };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant="default", size="md", asChild=false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const v = { default:"bg-primary text-primary-foreground hover:opacity-90", ghost:"hover:bg-accent hover:text-accent-foreground", outline:"border bg-background hover:bg-accent", secondary:"bg-secondary text-secondary-foreground", destructive:"bg-destructive text-destructive-foreground" }[variant];
  const s = { sm:"h-8 px-3 text-xs", md:"h-10 px-4 py-2", lg:"h-11 px-6", icon:"h-10 w-10" }[size];
  return <Comp ref={ref} className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50", v, s, className)} {...props} />;
});
Button.displayName = "Button";

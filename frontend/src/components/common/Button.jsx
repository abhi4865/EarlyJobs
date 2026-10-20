// src/components/common/Button.jsx
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-700",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  soft: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  "danger-outline": "border border-red-200 bg-white text-red-600 hover:bg-red-50",
};
const sizes = { sm: "h-8 gap-1.5 px-3 text-sm", md: "h-10 gap-2 px-4 text-sm", lg: "h-11 gap-2 px-5 text-sm", icon: "h-9 w-9" };

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, disabled, className, children, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
export default Button;

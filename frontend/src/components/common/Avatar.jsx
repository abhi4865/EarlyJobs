// src/components/common/Avatar.jsx
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const tones = [
  "bg-blue-100 text-blue-600", "bg-fuchsia-100 text-fuchsia-600", "bg-orange-100 text-orange-600", "bg-slate-200 text-slate-700",
  "bg-violet-100 text-violet-600", "bg-emerald-100 text-emerald-600", "bg-rose-100 text-rose-600", "bg-amber-100 text-amber-600",
];
const toneFor = (name = "") => tones[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % tones.length];
const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base", xl: "h-14 w-14 text-xl" };

export default function Avatar({ name, size = "md", className }) {
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", toneFor(name), sizes[size], className)}>
      {initials(name)}
    </span>
  );
}

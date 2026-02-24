import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({ children, variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";
  const variants = { primary: "bg-white text-gray-950 hover:bg-gray-200", secondary: "border border-gray-700 text-gray-300 hover:border-gray-400", ghost: "text-gray-400 hover:text-white" };
  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3 text-base" };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}

import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export default function Input({ label, error, className, ...props }: InputProps) {
  return <div className="flex flex-col gap-1">{label && <label className="text-sm font-medium text-gray-300">{label}</label>}<input className={cn("w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition", error && "border-red-500", className)} {...props} />{error && <p className="text-xs text-red-400">{error}</p>}</div>;
}

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
interface CardProps extends HTMLAttributes<HTMLDivElement> {}
export default function Card({ children, className, ...props }: CardProps) {
  return <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)} {...props}>{children}</div>;
}

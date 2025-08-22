"use client";
import { cn } from "@/lib/utils";

type Props = { className?: string };

export function Skeleton({ className }: Props) {
  return (
    <span className={cn("inline-block animate-pulse rounded-md bg-white/10", className)} />
  );
}



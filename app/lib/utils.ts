import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseLeadScore(leadScore?: string | null) {
  if (!leadScore) return NaN;
  const [valuePart] = leadScore.split("/");
  return parseFloat(valuePart);
}

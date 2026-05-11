import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0
  }).format(value);
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function fmt(value: number, digits = 0) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: digits
  }).format(value);
}

import React from "react";
import { getInitials } from "@/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarColor = "blue" | "purple" | "green" | "red" | "yellow" | "gray";

export interface AvatarProps {
  /** Full name — initials are derived automatically */
  name: string;
  size?: AvatarSize;
  color?: AvatarColor;
  className?: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const sizeMap: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "h-6 w-6",   text: "text-[10px]" },
  sm: { container: "h-8 w-8",   text: "text-xs" },
  md: { container: "h-10 w-10", text: "text-sm" },
  lg: { container: "h-14 w-14", text: "text-lg" },
  xl: { container: "h-16 w-16", text: "text-xl" },
};

const colorMap: Record<AvatarColor, string> = {
  blue:   "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  green:  "bg-green-100 text-green-700",
  red:    "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  gray:   "bg-gray-100 text-gray-600",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Avatar({
  name,
  size = "sm",
  color = "blue",
  className = "",
}: AvatarProps) {
  const { container, text } = sizeMap[size];
  const colors = colorMap[color];
  const initials = getInitials(name);

  return (
    <div
      className={[
        "shrink-0 inline-flex items-center justify-center rounded-full font-bold select-none",
        container,
        text,
        colors,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}

export default Avatar;

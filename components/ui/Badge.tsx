import React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BadgeColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "cyan"
  | "pink"
  | "orange"
  | "gray";

export interface BadgeProps {
  color?: BadgeColor;
  /** Show a small pulsing dot before the label */
  dot?: boolean;
  /** Make the dot pulse (for "in progress" states) */
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

// ─── Color map ────────────────────────────────────────────────────────────────

const colorMap: Record<BadgeColor, { badge: string; dot: string }> = {
  blue:   { badge: "bg-blue-100 text-blue-700 border-blue-200",     dot: "bg-blue-500" },
  green:  { badge: "bg-green-100 text-green-700 border-green-200",  dot: "bg-green-500" },
  red:    { badge: "bg-red-100 text-red-700 border-red-200",        dot: "bg-red-500" },
  yellow: { badge: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-500" },
  purple: { badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  cyan:   { badge: "bg-cyan-100 text-cyan-700 border-cyan-200",     dot: "bg-cyan-500" },
  pink:   { badge: "bg-pink-100 text-pink-700 border-pink-200",     dot: "bg-pink-500" },
  orange: { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  gray:   { badge: "bg-gray-100 text-gray-600 border-gray-200",     dot: "bg-gray-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Badge({
  color = "gray",
  dot = false,
  pulse = false,
  children,
  className = "",
}: BadgeProps) {
  const { badge, dot: dotColor } = colorMap[color];

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        badge,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          className={[
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotColor,
            pulse ? "animate-pulse" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;

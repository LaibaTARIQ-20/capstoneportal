import React from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StatCardColor =
  | "blue" | "purple" | "green" | "red" | "yellow" | "cyan" | "orange" | "gray";

export interface StatCardProps {
  /** Lucide icon element */
  icon: React.ReactNode;
  /** Background / icon tint color */
  color?: StatCardColor;
  /** The big number / value */
  value: React.ReactNode;
  /** Descriptive label below the value */
  label: string;
  /** Optional small sub-text (e.g. "vs last month") */
  hint?: string;
  className?: string;
}

// ─── Color map ────────────────────────────────────────────────────────────────

const colorMap: Record<StatCardColor, { bg: string; icon: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600" },
  green:  { bg: "bg-green-50",  icon: "text-green-600" },
  red:    { bg: "bg-red-50",    icon: "text-red-600" },
  yellow: { bg: "bg-amber-50",  icon: "text-amber-600" },
  cyan:   { bg: "bg-cyan-50",   icon: "text-cyan-600" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600" },
  gray:   { bg: "bg-gray-100",  icon: "text-gray-500" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  icon,
  color = "blue",
  value,
  label,
  hint,
  className = "",
}: StatCardProps) {
  const { bg, icon: iconColor } = colorMap[color];

  return (
    <div
      className={[
        "rounded-2xl border border-gray-100 bg-white px-6 py-6 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`mb-3 inline-flex rounded-xl p-2 ${bg}`}>
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ size?: number; className?: string }>, {
              size: 20,
              className: iconColor,
            })
          : icon}
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default StatCard;

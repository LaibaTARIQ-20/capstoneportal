import React from "react";
import { InlineSpinner } from "./Spinner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"   // blue  – main actions
  | "success"   // green – save / import
  | "danger"    // red   – delete
  | "outline"   // gray border – cancel / secondary
  | "ghost";    // text only – back links, subtle actions

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and disables the button */
  loading?: boolean;
  /** Loading label override (e.g. "Saving…") */
  loadingLabel?: string;
  /** Icon rendered to the LEFT of the label */
  icon?: React.ReactNode;
  /** Icon rendered to the RIGHT of the label */
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

// ─── Style maps ────────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 border border-transparent shadow-sm",
  success:
    "bg-green-600 text-white hover:bg-green-700 border border-transparent shadow-sm",
  danger:
    "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm",
  outline:
    "bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50",
  ghost:
    "bg-transparent text-gray-500 hover:text-gray-900 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

const iconSizeClasses: Record<ButtonSize, number> = {
  sm: 13,
  md: 15,
  lg: 17,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel,
  icon,
  iconRight,
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <>
          <InlineSpinner />
          {loadingLabel ?? children}
        </>
      ) : (
        <>
          {icon && (
            <span className="shrink-0" style={{ lineHeight: 0 }}>
              {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<{ size?: number }>, {
                    size: iconSizeClasses[size],
                  })
                : icon}
            </span>
          )}
          {children}
          {iconRight && (
            <span className="shrink-0" style={{ lineHeight: 0 }}>
              {React.isValidElement(iconRight)
                ? React.cloneElement(iconRight as React.ReactElement<{ size?: number }>, {
                    size: iconSizeClasses[size],
                  })
                : iconRight}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default Button;

import React from "react";

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps {
  children: React.ReactNode;
  /** Remove overflow-hidden (needed when a dropdown overflows the card) */
  noOverflow?: boolean;
  className?: string;
}

export function Card({ children, noOverflow = false, className = "" }: CardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        noOverflow ? "" : "overflow-hidden",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────

export interface CardHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional element rendered to the right (e.g. a Button) */
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = "" }: CardHeaderProps) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3",
        "border-b border-gray-100 bg-gray-50 px-6 py-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── CardBody ─────────────────────────────────────────────────────────────────

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div className={`px-6 py-6 ${className}`}>{children}</div>
  );
}

// ─── CardFooter ───────────────────────────────────────────────────────────────

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={[
        "border-t border-gray-100 px-6 py-4 flex items-center gap-3",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// ─── InfoCard (icon + label + value detail tile) ──────────────────────────────

export interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  /** The value to display. Pass null / undefined to show "—" */
  value?: React.ReactNode;
  /** Span 2 columns on sm screens */
  wide?: boolean;
  className?: string;
}

export function InfoCard({ icon, label, value, wide = false, className = "" }: InfoCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
        wide ? "sm:col-span-2" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
        {icon}
        {label}
      </div>
      <div className="text-base font-bold text-gray-900">
        {value ?? "—"}
      </div>
    </div>
  );
}

export default Card;

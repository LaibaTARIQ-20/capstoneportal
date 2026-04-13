import React from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "./Button";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  /** Main heading */
  title: string;
  /** Optional sub-text below the title */
  subtitle?: string;
  /**
   * Optional action area — rendered to the right.
   * Pass a <Button> or any ReactNode.
   */
  action?: React.ReactNode;
  /**
   * If provided, renders a ghost "← Back" button above the title.
   * Pass either a URL string (used with router.push) or a click handler.
   */
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Extra class on the outer container */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  onBack,
  backLabel = "Back",
  className = "",
}: PageHeaderProps) {
  const showBack = !!(backHref || onBack);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    if (backHref) window.location.href = backHref;
  };

  return (
    <div className={`mb-6 ${className}`}>
      {showBack && (
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft />}
          onClick={handleBack}
          className="mb-4 -ml-1 text-gray-500"
        >
          {backLabel}
        </Button>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export default PageHeader;

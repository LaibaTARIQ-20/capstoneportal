import React from "react";

// ─── Shared style tokens (also exported for use in editCell / DataTable) ───────

export const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

export const labelCls =
  "block mb-2 text-xs font-bold uppercase tracking-wide text-gray-600";

export const errorCls = "mt-1.5 text-xs text-red-500 font-medium";
export const hintCls  = "mt-1.5 text-xs text-gray-400";

// ─── FormField ────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Marks the field as required (adds * to label) */
  required?: boolean;
  /** Validation error message */
  error?: string;
  /** Helper text shown below the field when no error */
  hint?: string;
  /** Extra class on the wrapper div */
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className={labelCls}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className={errorCls}>{error}</p>
      ) : hint ? (
        <p className={hintCls}>{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = "", ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={[
        inputCls,
        error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  )
);
Input.displayName = "Input";

// ─── Select ───────────────────────────────────────────────────────────────────

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, placeholder, className = "", ...props }, ref) => (
    <select
      ref={ref}
      {...props}
      className={[
        inputCls,
        error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = "Select";

// ─── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      {...props}
      className={[
        inputCls,
        "min-h-[100px] resize-y",
        error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  )
);
Textarea.displayName = "Textarea";

export default FormField;

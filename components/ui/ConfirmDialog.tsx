"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "red" | "blue" | "green";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "red",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const colorMap = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    green: "bg-green-600 hover:bg-green-700",
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div
          className={`mb-4 inline-flex rounded-xl p-3 ${
            confirmColor === "red"
              ? "bg-red-50"
              : confirmColor === "green"
                ? "bg-green-50"
                : "bg-blue-50"
          }`}
        >
          <AlertTriangle
            size={22}
            className={
              confirmColor === "red"
                ? "text-red-600"
                : confirmColor === "green"
                  ? "text-green-600"
                  : "text-blue-600"
            }
          />
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>

        {/* Message */}
        <p className="mb-6 text-sm text-gray-600 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-colors ${colorMap[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

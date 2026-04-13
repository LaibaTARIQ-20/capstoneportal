/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from "react-hook-form";
import { Search, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Check, X } from "lucide-react";
import { InlineSpinner } from "./Spinner";

// ─── Column Definition ─────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  /** Unique key for the column (also used for sorting) */
  key: string;
  /** Header label */
  header: string;
  /** Optional fixed width (e.g. "w-10" tailwind class or inline style) */
  className?: string;
  /** Whether this column is sortable */
  sortable?: boolean;
  /**
   * Render function for the cell in read mode.
   * @param row     The data row
   * @param index   Row index (0-based within the visible/filtered set)
   */
  cell: (row: T, index: number) => React.ReactNode;
  /**
   * Optional render function for the cell in EDIT mode.
   * Receives the row and the react-hook-form instance so you can wire
   * <input {...form.register("fieldName")} /> directly.
   * If omitted for a column, the read cell is shown even during editing.
   */
  editCell?: (row: T, form: UseFormReturn<any>) => React.ReactNode;
}

// ─── Bulk Action ───────────────────────────────────────────────────────────────

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  /** Called with the array of selected IDs */
  onClick: (selectedIds: string[]) => void | Promise<void>;
  /** Tailwind color classes e.g. "bg-red-600 hover:bg-red-700 text-white" */
  colorClass?: string;
  /** Show a loading spinner while the action is in-flight */
  loading?: boolean;
}

// ─── Toolbar Action ────────────────────────────────────────────────────────────

export interface ToolbarAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
}

// ─── Main Props ────────────────────────────────────────────────────────────────

export interface DataTableProps<T extends Record<string, any>> {
  /** The dataset to display */
  data: T[];

  /** Column definitions */
  columns: ColumnDef<T>[];

  /**
   * The property of T that uniquely identifies each row.
   * @default "id"
   */
  rowIdKey?: keyof T;

  // ── Search ────────────────────────────────────────────────────────────────
  /** Whether to show the search bar */
  searchable?: boolean;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /**
   * Keys of T whose values are included when filtering by search query.
   * If omitted all string values of the row are searched.
   */
  searchFields?: (keyof T)[];

  // ── Count badge ───────────────────────────────────────────────────────────
  /** Singular label used in the record count badge (e.g. "project", "member") */
  countLabel?: string;

  // ── Row selection ─────────────────────────────────────────────────────────
  /** Show checkboxes for row selection */
  selectable?: boolean;
  /** Callback fired whenever the selection changes */
  onSelectionChange?: (ids: string[]) => void;

  // ── Bulk actions ──────────────────────────────────────────────────────────
  /**
   * Actions shown in the toolbar when at least one row is selected.
   * Each action receives the array of selected row IDs.
   */
  bulkActions?: BulkAction[];

  // ── Toolbar ───────────────────────────────────────────────────────────────
  /** Slot rendered to the LEFT of the search bar */
  toolbarLeft?: React.ReactNode;
  /** Slot rendered to the RIGHT side of the toolbar (after count badge) */
  toolbarRight?: React.ReactNode;
  /** Standalone action buttons always visible in the toolbar */
  toolbarActions?: ToolbarAction[];

  // ── Inline editing (react-hook-form) ─────────────────────────────────────
  /** Allow rows to be edited inline using react-hook-form */
  allowInlineEdit?: boolean;
  /**
   * Called when the user saves an edited row.
   * Receives the row ID and the form values.
   */
  onSaveRow?: (id: string, values: FieldValues) => Promise<void>;
  /**
   * Produce the default form values when a row enters edit mode.
   * Defaults to returning the row itself.
   */
  editDefaultValues?: (row: T) => DefaultValues<FieldValues>;

  // ── Custom action cell ────────────────────────────────────────────────────
  /**
   * Render custom action buttons for each row.
   * If `allowInlineEdit` is true, Save / Cancel are prepended automatically
   * while the row is in edit mode.
   */
  renderRowActions?: (
    row: T,
    ctx: {
      isEditing: boolean;
      startEdit: () => void;
      cancelEdit: () => void;
    }
  ) => React.ReactNode;

  // ── Empty state ───────────────────────────────────────────────────────────
  /** Message shown when no rows match the current search */
  emptyMessage?: string;
  /** Optional icon/illustration shown in the empty state */
  emptyIcon?: React.ReactNode;

  // ── Loading ───────────────────────────────────────────────────────────────
  loading?: boolean;

  // ── Misc ──────────────────────────────────────────────────────────────────
  /** Extra className applied to the outermost container */
  className?: string;
  /** Function to apply custom styles to a row based on its data */
  rowClassName?: (row: T) => string;
}

// ─── Sort State ────────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc" | null;
interface SortState {
  key: string;
  dir: SortDir;
}

// ─── Internal: Inline Edit Row ─────────────────────────────────────────────────

interface EditRowProps<T extends Record<string, any>> {
  row: T;
  columns: ColumnDef<T>[];
  rowId: string;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
  renderRowActions?: DataTableProps<T>["renderRowActions"];
  editDefaultValues?: (row: T) => DefaultValues<FieldValues>;
  onSaveRow?: (id: string, values: FieldValues) => Promise<void>;
  onCancelEdit: () => void;
  index: number;
}

function EditableRow<T extends Record<string, any>>({
  row,
  columns,
  rowId,
  selectable,
  selected,
  onToggle,
  renderRowActions,
  editDefaultValues,
  onSaveRow,
  onCancelEdit,
  index,
}: EditRowProps<T>) {
  const form = useForm<FieldValues>({
    defaultValues: editDefaultValues ? editDefaultValues(row) : (row as DefaultValues<FieldValues>),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const values = form.getValues();
    if (!onSaveRow) { onCancelEdit(); return; }
    setSaving(true);
    try {
      await onSaveRow(rowId, values);
      onCancelEdit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className={`transition-colors ${selected ? "bg-blue-50" : "hover:bg-gray-50/80"}`}>
      {selectable && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="rounded border-gray-300 cursor-pointer accent-blue-600"
          />
        </td>
      )}

      {columns.map((col) => (
        <td key={col.key} className={`px-5 py-3 ${col.className ?? ""}`}>
          {col.editCell ? col.editCell(row, form) : col.cell(row, index)}
        </td>
      ))}

      {/* Actions cell while editing */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
          {/* Save / Cancel prepended */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {saving ? <InlineSpinner /> : <Check size={13} />}
            Save
          </button>
          <button
            onClick={onCancelEdit}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={13} />
            Cancel
          </button>
          {/* Consumer-supplied actions (shown in edit mode too if they want) */}
          {renderRowActions?.(row, {
            isEditing: true,
            startEdit: () => {},
            cancelEdit: onCancelEdit,
          })}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  rowIdKey = "id" as keyof T,
  // search
  searchable = true,
  searchPlaceholder = "Search…",
  searchFields,
  // count
  countLabel = "record",
  // selection
  selectable = false,
  onSelectionChange,
  // bulk
  bulkActions = [],
  // toolbar
  toolbarLeft,
  toolbarRight,
  toolbarActions = [],
  // inline edit
  allowInlineEdit = false,
  onSaveRow,
  editDefaultValues,
  // actions
  renderRowActions,
  // empty
  emptyMessage = "No records found.",
  emptyIcon,
  // misc
  loading = false,
  className = "",
  rowClassName,
}: DataTableProps<T>) {
  // ── Local state ─────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortState>({ key: "", dir: null });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bulkLoadingIdx, setBulkLoadingIdx] = useState<number | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getRowId = useCallback(
    (row: T): string => String(row[rowIdKey]),
    [rowIdKey]
  );

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) => {
      const fields = searchFields ?? (Object.keys(row) as (keyof T)[]);
      return fields.some((f) => String(row[f] ?? "").toLowerCase().includes(q));
    });
  }, [data, search, searchFields]);

  // ── Sort ─────────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sort.key || !sort.dir) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String(a[sort.key] ?? "");
      const bv = String(b[sort.key] ?? "");
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sort]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return { key: "", dir: null };
    });
  };

  // ── Selection ─────────────────────────────────────────────────────────────────
  const toggleAll = () => {
    if (selected.size === sorted.length) {
      const next = new Set<string>();
      setSelected(next);
      onSelectionChange?.([]);
    } else {
      const next = new Set(sorted.map(getRowId));
      setSelected(next);
      onSelectionChange?.(Array.from(next));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  // ── Bulk action handler ────────────────────────────────────────────────────────
  const handleBulkAction = async (action: BulkAction, idx: number) => {
    setBulkLoadingIdx(idx);
    try {
      await action.onClick(Array.from(selected));
      setSelected(new Set());
      onSelectionChange?.([]);
    } finally {
      setBulkLoadingIdx(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────────
  const allSelected = sorted.length > 0 && selected.size === sorted.length;
  const hasActions = !!renderRowActions || allowInlineEdit;
  const totalCols =
    columns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  // ── Sort icon ──────────────────────────────────────────────────────────────────
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort.key !== colKey) return <ChevronsUpDown size={13} className="text-gray-300" />;
    if (sort.dir === "asc") return <ChevronUp size={13} className="text-blue-500" />;
    return <ChevronDown size={13} className="text-blue-500" />;
  };

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-3.5">
        {/* Left slot */}
        {toolbarLeft}

        {/* Search */}
        {searchable && (
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>
        )}

        {/* Count badge */}
        <p className="text-sm font-medium text-gray-400 whitespace-nowrap">
          {sorted.length}{" "}
          {sorted.length === 1 ? countLabel : `${countLabel}s`}
        </p>

        {/* Bulk actions (visible when rows are selected) */}
        {selectable && selected.size > 0 &&
          bulkActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleBulkAction(action, idx)}
              disabled={bulkLoadingIdx === idx}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                action.colorClass ??
                "bg-gray-800 hover:bg-gray-900 text-white"
              }`}
            >
              {bulkLoadingIdx === idx ? (
                <InlineSpinner />
              ) : (
                action.icon
              )}
              {action.label} ({selected.size})
            </button>
          ))}

        {/* Always-visible toolbar actions */}
        <div className="flex items-center gap-2 ml-auto">
          {toolbarActions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                action.colorClass ?? "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          {/* Right slot */}
          {toolbarRight}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400 text-sm">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
            Loading…
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-gray-400 gap-3">
            {emptyIcon && <div className="text-gray-300">{emptyIcon}</div>}
            {emptyMessage}
          </div>
        ) : (
          <table className="w-full text-sm">
            {/* Head */}
            <thead className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {selectable && (
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-gray-300 cursor-pointer accent-blue-600"
                    />
                  </th>
                )}

                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-5 py-3 text-left ${col.className ?? ""} ${
                      col.sortable ? "cursor-pointer select-none" : ""
                    }`}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                ))}

                {hasActions && (
                  <th className="px-5 py-3 text-left">Actions</th>
                )}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-50">
              {sorted.map((row, index) => {
                const id = getRowId(row);
                const isEditing = editingId === id;

                // Fully controlled editable row
                if (isEditing && allowInlineEdit) {
                  return (
                    <EditableRow
                      key={id}
                      row={row}
                      columns={columns}
                      rowId={id}
                      selectable={selectable}
                      selected={selected.has(id)}
                      onToggle={() => toggleOne(id)}
                      renderRowActions={renderRowActions}
                      editDefaultValues={editDefaultValues}
                      onSaveRow={onSaveRow}
                      onCancelEdit={() => setEditingId(null)}
                      index={index}
                    />
                  );
                }

                // Normal read row
                return (
                  <tr
                    key={id}
                    className={`transition-colors ${
                      selected.has(id)
                        ? "bg-blue-50"
                        : "hover:bg-gray-50/80"
                    } ${rowClassName ? rowClassName(row) : ""}`}
                  >
                    {selectable && (
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleOne(id)}
                          className="rounded border-gray-300 cursor-pointer accent-blue-600"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-3.5 ${col.className ?? ""}`}
                      >
                        {col.cell(row, index)}
                      </td>
                    ))}

                    {hasActions && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {renderRowActions?.(row, {
                            isEditing: false,
                            startEdit: () => setEditingId(id),
                            cancelEdit: () => setEditingId(null),
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer: total count ──────────────────────────────────────────────── */}
      {sorted.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-2.5 text-xs text-gray-400 flex items-center justify-between">
          <span>
            {sorted.length !== data.length
              ? `Showing ${sorted.length} of ${data.length} ${data.length === 1 ? countLabel : `${countLabel}s`}`
              : `${data.length} ${data.length === 1 ? countLabel : `${countLabel}s`} total`}
          </span>
          {selectable && selected.size > 0 && (
            <span className="font-medium text-blue-600">
              {selected.size} selected
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default DataTable;

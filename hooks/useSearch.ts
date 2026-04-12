import { useState, useMemo } from "react";

export function useSearch<T>(items: T[], fields: (keyof T)[]) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const val = item[field];
        return typeof val === "string" && val.toLowerCase().includes(q);
      })
    );
  }, [items, fields, query]);

  return { query, setQuery, filtered };
}
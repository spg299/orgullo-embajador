import { useMemo, useState } from "react";

export interface SortState<T> {
  field: keyof T;
  direction: "asc" | "desc";
}

interface UseDataTableOptions<T> {
  data: T[];
  searchableFields: (keyof T)[];
  initialSort?: SortState<T>;
  pageSize?: number;
}

// Strips accents so "gomez" matches "Gómez" — expected behavior for a
// Spanish-language admin UI with lots of accented names/places.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a ?? "").localeCompare(String(b ?? ""), "es");
}

// Search + sort + pagination over a plain in-memory array — every admin
// dataset here is small (a handful to a few dozen rows), so this stays
// entirely client-side rather than pulling in a table library. Filtering by
// a specific field (status/availability/role) is left to each page's own
// state, applied to `data` *before* it's passed in here — this hook only
// owns search/sort/paginate.
export function useDataTable<T>({
  data,
  searchableFields,
  initialSort,
  pageSize = 10,
}: UseDataTableOptions<T>) {
  const [search, setSearchRaw] = useState("");
  const [sort, setSort] = useState<SortState<T> | null>(initialSort ?? null);
  const [page, setPage] = useState(1);

  function setSearch(value: string) {
    setSearchRaw(value);
    setPage(1);
  }

  function toggleSort(field: keyof T) {
    setSort((prev) => {
      if (!prev || prev.field !== field) return { field, direction: "asc" };
      if (prev.direction === "asc") return { field, direction: "desc" };
      return null;
    });
  }

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const needle = normalize(search.trim());
    return data.filter((row) =>
      searchableFields.some((field) => normalize(String(row[field] ?? "")).includes(needle)),
    );
  }, [data, search, searchableFields]);

  const sortedData = useMemo(() => {
    if (!sort) return filteredData;
    const sorted = [...filteredData].sort((a, b) => compareValues(a[sort.field], b[sort.field]));
    return sort.direction === "desc" ? sorted.reverse() : sorted;
  }, [filteredData, sort]);

  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedData = useMemo(
    () => sortedData.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sortedData, safePage, pageSize],
  );

  return {
    search,
    setSearch,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    pageCount,
    pagedData,
    filteredData: sortedData,
    totalCount: data.length,
    resultCount: sortedData.length,
  };
}

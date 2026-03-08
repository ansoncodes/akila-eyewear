"use client";

import type { Category, Collection, FrameShape } from "@/types/api";

interface ProductFiltersProps {
  categories: Category[];
  collections: Collection[];
  frameShapes: FrameShape[];
  filters: {
    category?: string;
    collection?: string;
    frame_shape?: string;
    gender?: string;
    min_price?: string;
    max_price?: string;
  };
  onChange: (next: ProductFiltersProps["filters"]) => void;
}

export default function ProductFilters({ categories, collections, frameShapes, filters, onChange }: ProductFiltersProps) {
  function setValue(key: keyof ProductFiltersProps["filters"], value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function reset() {
    onChange({});
  }

  return (
    <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="text-lg font-semibold text-white">Filters</h3>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-slate-400">Category</label>
        <select
          value={filters.category ?? ""}
          onChange={(e) => setValue("category", e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-slate-400">Collection</label>
        <select
          value={filters.collection ?? ""}
          onChange={(e) => setValue("collection", e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {collections.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-slate-400">Frame Shape</label>
        <select
          value={filters.frame_shape ?? ""}
          onChange={(e) => setValue("frame_shape", e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {frameShapes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wide text-slate-400">Gender</label>
        <select
          value={filters.gender ?? ""}
          onChange={(e) => setValue("gender", e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        >
          <option value="">All</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Unisex">Unisex</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Min Price</label>
          <input
            type="number"
            value={filters.min_price ?? ""}
            onChange={(e) => setValue("min_price", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wide text-slate-400">Max Price</label>
          <input
            type="number"
            value={filters.max_price ?? ""}
            onChange={(e) => setValue("max_price", e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="300"
          />
        </div>
      </div>

      <button
        onClick={reset}
        className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 hover:border-white hover:text-white"
      >
        Reset Filters
      </button>
    </aside>
  );
}

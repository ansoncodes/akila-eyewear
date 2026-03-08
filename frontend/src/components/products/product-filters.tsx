"use client";

import { Search } from "lucide-react";

import type { Category, Collection, FrameShape } from "@/types/api";

interface ProductFiltersProps {
  categories: Category[];
  collections: Collection[];
  frameShapes: FrameShape[];
  filters: {
    search?: string;
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

  const underlineInputClass =
    "w-full border-b border-[#ddd] bg-transparent pb-2 text-sm text-[#2b2521] outline-none placeholder:text-[#b5aca5]";
  const labelClass = "text-[11px] uppercase tracking-[0.16em] text-[#999]";

  return (
    <aside className="space-y-7">
      <div className="space-y-2">
        <label className={labelClass}>Search</label>
        <div className="flex items-center gap-2 border-b border-[#ddd] pb-2">
          <Search className="h-4 w-4 text-[#a09a95]" strokeWidth={1.5} />
          <input
            type="text"
            value={filters.search ?? ""}
            onChange={(e) => setValue("search", e.target.value)}
            className="w-full bg-transparent text-sm text-[#2b2521] outline-none placeholder:text-[#b5aca5]"
            placeholder="Search frames..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Category</label>
        <select value={filters.category ?? ""} onChange={(e) => setValue("category", e.target.value)} className={underlineInputClass}>
          <option value="">All</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Collection</label>
        <select value={filters.collection ?? ""} onChange={(e) => setValue("collection", e.target.value)} className={underlineInputClass}>
          <option value="">All</option>
          {collections.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Frame Shape</label>
        <select value={filters.frame_shape ?? ""} onChange={(e) => setValue("frame_shape", e.target.value)} className={underlineInputClass}>
          <option value="">All</option>
          {frameShapes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Gender</label>
        <select value={filters.gender ?? ""} onChange={(e) => setValue("gender", e.target.value)} className={underlineInputClass}>
          <option value="">All</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
          <option value="Unisex">Unisex</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>Price Range</label>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <input
            type="number"
            value={filters.min_price ?? ""}
            onChange={(e) => setValue("min_price", e.target.value)}
            className={underlineInputClass}
            placeholder="Min"
          />
          <span className="text-[#b4a79f]">-</span>
          <input
            type="number"
            value={filters.max_price ?? ""}
            onChange={(e) => setValue("max_price", e.target.value)}
            className={underlineInputClass}
            placeholder="Max"
          />
        </div>
      </div>

      <button onClick={reset} className="text-sm font-medium text-[#C4714F] transition hover:opacity-75">
        Reset Filters
      </button>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Watch,
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { products as productsApi } from "@/lib/api";
import type { Product } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

const conditionLabel: Record<string, string> = {
  unworn: "Unworn",
  pre_owned: "Pre-Owned",
};

const availabilityConfig: Record<string, { label: string; color: string }> = {
  ready_stock: { label: "Ready Stock", color: "#10B981" },
  pre_order: { label: "Pre-Order", color: "#F59E0B" },
  sold: { label: "Sold", color: "#EF4444" },
};

export default function ProductsPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCondition, setFilterCondition] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: "24" };
      if (search) params.search = search;
      if (filterBrand) params.brand = filterBrand;
      if (filterCondition) params.condition = filterCondition;
      const res = await productsApi.list(params);
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, search, filterBrand, filterCondition]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const productList: Product[] = data?.data || [];
  const totalPages = data?.last_page || 1;

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <Watch className="h-7 w-7 text-violet-500" />
            Products
          </h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            Luxury watch inventory catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-theme-border overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "grid" ? "bg-violet-500 text-white" : "bg-theme-bg-card text-theme-text-secondary hover:bg-theme-bg-hover"}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-violet-500 text-white" : "bg-theme-bg-card text-theme-text-secondary hover:bg-theme-bg-hover"}`}
            >
              List
            </button>
          </div>
          {can("products.create") && (
            <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search by brand, model, or reference..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-theme-border bg-theme-bg-card py-2.5 pl-10 pr-4 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={filterBrand}
          onChange={(e) => { setFilterBrand(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Brands</option>
          <option value="ROLEX">Rolex</option>
          <option value="PATEK PHILIPPE">Patek Philippe</option>
          <option value="AUDEMARS PIGUET">Audemars Piguet</option>
          <option value="RICHARD MILLE">Richard Mille</option>
          <option value="HUBLOT">Hublot</option>
          <option value="VACHERON CONSTANTIN">Vacheron Constantin</option>
          <option value="PANERAI">Panerai</option>
          <option value="F.P.JOURNE">F.P.Journe</option>
          <option value="JACOB & CO">Jacob & Co</option>
        </select>
        <select
          value={filterCondition}
          onChange={(e) => { setFilterCondition(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Conditions</option>
          <option value="unworn">Unworn</option>
          <option value="pre_owned">Pre-Owned</option>
        </select>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-theme-border bg-theme-bg-card p-4">
                <div className="aspect-square rounded-xl bg-theme-bg-secondary mb-3" />
                <div className="h-4 w-3/4 rounded bg-theme-bg-secondary mb-2" />
                <div className="h-3 w-1/2 rounded bg-theme-bg-secondary" />
              </div>
            ))
          ) : productList.length === 0 ? (
            <div className="col-span-full py-12 text-center text-theme-text-muted">
              No products found.
            </div>
          ) : (
            productList.map((p) => {
              const avail = availabilityConfig[p.availability] || availabilityConfig.ready_stock;
              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card transition-all hover:shadow-lg hover:border-violet-500/30"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-theme-bg-secondary p-4">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={`${p.brand} ${p.model}`}
                        className="h-full w-full object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Watch className="h-16 w-16 text-theme-text-muted/30" />
                      </div>
                    )}
                    {/* Status badge */}
                    <span
                      className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: avail.color }}
                    >
                      {avail.label}
                    </span>
                    {/* Condition badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {conditionLabel[p.condition] || p.condition}
                    </span>
                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                      <button className="rounded-full bg-white p-2 text-gray-800 shadow-lg hover:bg-violet-50">
                        <Eye className="h-4 w-4" />
                      </button>
                      {can("products.update") && (
                        <button className="rounded-full bg-white p-2 text-gray-800 shadow-lg hover:bg-violet-50">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">
                      {p.brand}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-theme-text line-clamp-1">
                      {p.model}
                    </h3>
                    {p.reference_number && (
                      <p className="mt-0.5 text-xs text-theme-text-muted">
                        Ref. {p.reference_number}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {p.case_size && (
                        <span className="rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] text-theme-text-muted">
                          {p.case_size}
                        </span>
                      )}
                      {p.movement_type && (
                        <span className="rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] text-theme-text-muted">
                          {p.movement_type}
                        </span>
                      )}
                      {p.year && (
                        <span className="rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] text-theme-text-muted">
                          {p.year}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        {p.discount_price ? (
                          <>
                            <p className="text-xs text-theme-text-muted line-through">
                              {formatPrice(p.price)}
                            </p>
                            <p className="text-sm font-bold text-violet-500">
                              {formatPrice(p.discount_price)}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-theme-text">
                            {formatPrice(p.price)}
                          </p>
                        )}
                      </div>
                      {p.discount_percent && p.discount_percent > 0 && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                          -{p.discount_percent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                  <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Ref. Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Condition</th>
                  <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Availability</th>
                  <th className="px-4 py-3 text-right font-semibold text-theme-text-muted">Price</th>
                  <th className="px-4 py-3 text-right font-semibold text-theme-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-theme-text-muted">
                      Loading products...
                    </td>
                  </tr>
                ) : productList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-theme-text-muted">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  productList.map((p) => {
                    const avail = availabilityConfig[p.availability] || availabilityConfig.ready_stock;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-theme-bg-hover/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-theme-bg-secondary overflow-hidden">
                              {p.image_url ? (
                                <img src={p.image_url} alt="" className="h-full w-full object-contain" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Watch className="h-5 w-5 text-theme-text-muted/30" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">{p.brand}</p>
                              <p className="font-medium text-theme-text">{p.model}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-theme-text-secondary">{p.reference_number || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-theme-text-secondary">{conditionLabel[p.condition] || p.condition}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${avail.color}15`, color: avail.color }}>
                            {avail.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-theme-text">
                          {formatPrice(p.discount_price || p.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text"><Eye className="h-4 w-4" /></button>
                            {can("products.update") && (
                              <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text"><Edit2 className="h-4 w-4" /></button>
                            )}
                            {can("products.delete") && (
                              <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-theme-text-muted">
            Page {data?.current_page || 1} of {totalPages} · {data?.total || 0} total
          </p>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-theme-border px-3 py-1.5 text-xs font-medium text-theme-text disabled:opacity-50 hover:bg-theme-bg-hover"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-theme-border px-3 py-1.5 text-xs font-medium text-theme-text disabled:opacity-50 hover:bg-theme-bg-hover"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Target,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Clock,
} from "lucide-react";
import { leads as leadsApi, leadSources as sourcesApi } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Lead, LeadSource, LeadStatus } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  junk: { label: "Junk", color: "#6B7280", bg: "#6B728015" },
  cold: { label: "Cold", color: "#3B82F6", bg: "#3B82F615" },
  mql: { label: "MQL", color: "#F59E0B", bg: "#F59E0B15" },
  hot: { label: "Hot", color: "#EF4444", bg: "#EF444415" },
  deal_won: { label: "Deal Won", color: "#10B981", bg: "#10B98115" },
  deal_lost: { label: "Deal Lost", color: "#6B7280", bg: "#6B728015" },
};

export default function LeadsPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterSource) params.source_id = filterSource;
      const res = await leadsApi.list(params);
      setData(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterSource, perPage]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    sourcesApi.list().then((r) => setSources(r.data || [])).catch(() => {});
  }, []);

  const leadList: Lead[] = data?.data || [];
  const totalPages = data?.last_page || 1;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 px-2">
          <Target size={52} className="text-violet-500 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Leads</h1>
            <p className="mt-0.5 text-sm text-theme-text-muted">Track and manage your sales leads</p>
          </div>
        </div>
        {can("leads.create") && (
          <button className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors">
            <Plus className="h-4 w-4" />
            Create Lead
          </button>
        )}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setFilterStatus(""); setPage(1); }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filterStatus === "" ? "bg-violet-500 text-white" : "bg-theme-bg-card border border-theme-border text-theme-text-secondary hover:bg-theme-bg-hover"
          }`}
        >
          All
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setFilterStatus(key); setPage(1); }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === key ? "text-white" : "text-theme-text-secondary border border-theme-border hover:bg-theme-bg-hover"
            }`}
            style={filterStatus === key ? { backgroundColor: cfg.color } : {}}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-theme-border bg-theme-bg-card py-2.5 pl-10 pr-4 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none"
        >
          <option value="">All Sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Lead</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Value</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Assigned</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Sub-Leads</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Created</th>
                <th className="px-4 py-3 text-right font-semibold text-theme-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-theme-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      Loading leads...
                    </div>
                  </td>
                </tr>
              ) : leadList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-theme-text-muted">
                    No leads found.
                  </td>
                </tr>
              ) : (
                leadList.map((l) => {
                  const cfg = statusConfig[l.status] || statusConfig.cold;
                  return (
                    <tr key={l.id} className="transition-colors hover:bg-theme-bg-hover/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-theme-text">{l.title}</p>
                        {l.outlet && (
                          <p className="mt-0.5 text-xs text-theme-text-muted">{l.outlet.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-theme-text">{l.customer?.name || "—"}</p>
                        <p className="text-xs text-theme-text-muted">{l.customer?.phone || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {l.source ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: `${l.source.color}15`, color: l.source.color }}
                          >
                            {l.source.name}
                          </span>
                        ) : (
                          <span className="text-xs text-theme-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-theme-text">
                        {l.value > 0 ? formatCurrency(l.value) : "—"}
                      </td>
                      <td className="px-4 py-3 text-theme-text-secondary">
                        {(l as any).assigned_to_user?.full_name || (l.assigned_to ? "Assigned" : "—")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-theme-bg-secondary text-xs font-medium text-theme-text-secondary">
                          {l.sub_leads_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-theme-text-muted">
                          <Clock className="h-3 w-3" />
                          {new Date(l.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                            <Eye className="h-4 w-4" />
                          </button>
                          {can("leads.update") && (
                            <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {can("leads.delete") && (
                            <button className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* Pagination */}
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={data?.total || 0}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
        />
      </div>
    </div>
  );
}

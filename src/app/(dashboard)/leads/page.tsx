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
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  leads as leadsApi,
  leadStatuses as leadStatusesApi,
  leadSources as sourcesApi,
  customers as customersApi,
  companies as companiesApi,
  outlets as outletsApi,
  users as usersApi,
} from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { Lead, LeadSource, LeadStatus, Company, Outlet } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

interface LeadForm {
  title: string;
  customer_id: string;
  status_id: string;
  source_id: string;
  value: string;
  assigned_to: string;
  company_id: string;
  outlet_id: string;
}

const emptyForm: LeadForm = {
  title: "",
  customer_id: "",
  status_id: "",
  source_id: "",
  value: "",
  assigned_to: "",
  company_id: "",
  outlet_id: "",
};

export default function LeadsPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [statusList, setStatusList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [outletList, setOutletList] = useState<Outlet[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const isProcessing = !!loadingEditId || deleting || submitting;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (search) params.search = search;
      if (filterStatus) params.status_id = filterStatus;
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
    leadStatusesApi.list().then((r) => setStatusList(r.data || [])).catch(() => {});
    sourcesApi.list().then((r) => setSources(r.data || [])).catch(() => {});
    customersApi.list({ per_page: "200" }).then((r) => setCustomerList(r.data?.data || [])).catch(() => {});
    companiesApi.list().then((r) => setCompanyList(r.data || [])).catch(() => {});
    outletsApi.list().then((r) => setOutletList(r.data || [])).catch(() => {});
    usersApi.list({ per_page: "200" }).then((r) => setSalesList(r.data?.data || [])).catch(() => {});
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredOutlets = form.company_id
    ? outletList.filter((o: any) => o.company_id === form.company_id)
    : outletList;

  const openCreateModal = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (lead: any) => {
    setLoadingEditId(lead.id);
    try {
      setEditingLead(lead);
      setForm({
        title: lead.title || "",
        customer_id: lead.customer_id || "",
        status_id: lead.status_id || "",
        source_id: lead.source_id || "",
        value: lead.value ? lead.value.toString() : "",
        assigned_to: lead.assigned_to || "",
        company_id: lead.company_id || "",
        outlet_id: lead.outlet_id || "",
      });
      setErrors({});
      setShowModal(true);
    } finally {
      setLoadingEditId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingLead(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Lead title is required.";
    if (!form.status_id) errs.status_id = "Status is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const updateField = (field: keyof LeadForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = { ...form };
      if (!payload.customer_id) delete payload.customer_id;
      if (!payload.source_id) delete payload.source_id;
      if (!payload.assigned_to) delete payload.assigned_to;
      if (!payload.company_id) delete payload.company_id;
      if (!payload.outlet_id) delete payload.outlet_id;
      if (payload.value) payload.value = parseFloat(payload.value);
      else payload.value = 0;

      if (editingLead) {
        await leadsApi.update(editingLead.id, payload);
        setToast({ type: "success", message: `Lead "${form.title}" updated.` });
      } else {
        await leadsApi.create(payload);
        setToast({ type: "success", message: `Lead "${form.title}" created.` });
      }
      closeModal();
      fetchLeads();
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to save lead." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await leadsApi.delete(deleteTarget.id);
      setToast({ type: "success", message: "Lead deleted." });
      setDeleteTarget(null);
      fetchLeads();
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to delete lead." });
    } finally {
      setDeleting(false);
    }
  };

  const leadList: Lead[] = data?.data || [];
  const totalPages = data?.last_page || 1;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed right-4 top-20 z-60 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right duration-300 ${toast.type === "success" ? "border-green-500/20 bg-green-500/10 text-green-600" : "border-red-500/20 bg-red-500/10 text-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} title="Dismiss notification" aria-label="Dismiss notification" className="ml-2 rounded p-0.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
      )}
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
          <button onClick={openCreateModal} disabled={isProcessing} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
        {statusList.map((cfg) => {
          const btnStyle = filterStatus === cfg.id ? { backgroundColor: cfg.color } : undefined;
          return (
          <button
            key={cfg.id}
            onClick={() => { setFilterStatus(cfg.id); setPage(1); }}
            className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              filterStatus === cfg.id
                ? "bg-theme-bg-hover text-white shadow-sm ring-1 ring-black/5"
                : "text-theme-text-muted hover:bg-theme-bg-hover/50 hover:text-theme-text"
            }`}
            style={btnStyle}
          >
            {cfg.name}
          </button>
          );
        })}
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
          aria-label="Filter by source"
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
                  const cfg = statusList.find(s => s.id === l.status_id) || { name: 'Unknown', color: '#6B7280' };
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
                        {(() => {
                          const statusStyle = { backgroundColor: cfg.color + "15", color: cfg.color };
                          return (
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={statusStyle}
                            >
                              {cfg.name}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {l.source ? (() => {
                          const sourceStyle = { backgroundColor: `${l.source.color}15`, color: l.source.color };
                          return (
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                              style={sourceStyle}
                            >
                              {l.source.name}
                            </span>
                          );
                        })() : (
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
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-theme-bg-secondary text-xs font-medium text-theme-text-secondary">
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
                          <button title="View lead" aria-label="View lead" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                            <Eye className="h-4 w-4" />
                          </button>
                          {can("leads.update") && (
                            <button onClick={() => openEditModal(l)} disabled={isProcessing} title="Edit lead" aria-label="Edit lead" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text disabled:opacity-50 disabled:cursor-not-allowed">
                              {loadingEditId === l.id ? <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> : <Edit2 className="h-4 w-4" />}
                            </button>
                          )}
                          {can("leads.delete") && (
                            <button onClick={() => setDeleteTarget(l)} disabled={isProcessing} title="Delete lead" aria-label="Delete lead" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed">
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" aria-label="Close" onClick={closeModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl" autoComplete="off">
            <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-theme-text">{editingLead ? "Edit Lead" : "Create Lead"}</h2>
                <p className="text-xs text-theme-text-muted">{editingLead ? "Update lead information" : "Add a new lead to your pipeline"}</p>
              </div>
              <button type="button" onClick={closeModal} title="Close modal" aria-label="Close modal" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Lead Title *</label>
                <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Interested in Rolex Submariner" className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${errors.title ? "border-red-500 focus:ring-red-500" : "border-theme-border focus:border-violet-500 focus:ring-violet-500"}`} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Customer</label>
                  <SearchableSelect options={customerList.map((c: any) => ({ value: c.id, label: c.name }))} value={form.customer_id} onChange={(v) => updateField("customer_id", v)} placeholder="Select customer..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Value (IDR)</label>
                  <input type="text" value={form.value ? new Intl.NumberFormat("id-ID").format(Number(form.value)) : ""} onChange={(e) => updateField("value", e.target.value.replace(/\D/g, ""))} placeholder="e.g. 15.000.000" className="w-full rounded-xl border border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Status *</label>
                  <SearchableSelect options={statusList.map((s) => ({ value: s.id, label: s.name }))} value={form.status_id} onChange={(v) => updateField("status_id", v)} placeholder="Select status..." error={!!errors.status_id} />
                  {errors.status && <p className="mt-1 text-xs text-red-500">{errors.status}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Source</label>
                  <SearchableSelect options={sources.map(s => ({ value: s.id, label: s.name }))} value={form.source_id} onChange={(v) => updateField("source_id", v)} placeholder="Select source..." />
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Assigned To</label>
                <SearchableSelect options={salesList.map((s: any) => ({ value: s.id, label: s.full_name }))} value={form.assigned_to} onChange={(v) => updateField("assigned_to", v)} placeholder="Select agent..." />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Company</label>
                  <SearchableSelect options={companyList.map(c => ({ value: c.id, label: c.name }))} value={form.company_id} onChange={(v) => { updateField("company_id", v); updateField("outlet_id", ""); }} placeholder="Select company..." />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Outlet / Branch</label>
                  <SearchableSelect options={filteredOutlets.map((o: any) => ({ value: o.id, label: o.name }))} value={form.outlet_id} onChange={(v) => updateField("outlet_id", v)} placeholder={form.company_id ? "Select outlet..." : "Select company first"} disabled={!form.company_id} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button type="button" onClick={closeModal} disabled={submitting} className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium hover:bg-theme-bg-hover disabled:opacity-50 text-theme-text">Cancel</button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingLead ? "Save Changes" : "Create Lead"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" onClick={() => setDeleteTarget(null)} aria-label="Close delete confirmation" className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-theme-text">Delete Lead</h3>
              <p className="mt-2 text-sm text-theme-text-muted">Are you sure you want to delete this lead? This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium hover:bg-theme-bg-hover disabled:opacity-50 text-theme-text">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

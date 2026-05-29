"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, MapPin, Plus, Edit2, Trash2, Users, ChevronDown, ChevronRight, Store, Loader2, AlertCircle, CheckCircle, X } from "lucide-react";
import { companies as companiesApi, outlets as outletsApi } from "@/lib/api";
import type { Company, Outlet } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

export default function CompanyPage() {
  const { can } = usePermissions();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [outletMap, setOutletMap] = useState<Record<string, Outlet[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', code: '', email: '', phone: '', address: '', is_active: true });

  const [showOutletModal, setShowOutletModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletForm, setOutletForm] = useState({ company_id: '', name: '', code: '', city: '', phone: '', address: '', is_active: true });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'company' | 'outlet', id: string, name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const isProcessing = submitting || deleting;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, outRes] = await Promise.all([
        companiesApi.list(),
        outletsApi.list()
      ]);
      setCompanies(compRes.data || []);
      
      const map: Record<string, Outlet[]> = {};
      (outRes.data || []).forEach((o: Outlet) => {
        if (!map[o.company_id]) map[o.company_id] = [];
        map[o.company_id].push(o);
      });
      setOutletMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleExpand = (id: string) => {
    setExpandedCompany((prev) => (prev === id ? null : id));
  };

  // Company Modal Handlers
  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        name: company.name || '',
        code: company.code || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        is_active: company.is_active !== false
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({ name: '', code: '', email: '', phone: '', address: '', is_active: true });
    }
    setShowCompanyModal(true);
  };

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name || !companyForm.code) {
      setToast({ type: 'error', message: 'Name and Code are required.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...companyForm,
        is_active: companyForm.is_active ? 1 : 0
      };
      if (editingCompany) {
        await companiesApi.update(editingCompany.id, payload);
        setToast({ type: 'success', message: 'Company updated successfully.' });
      } else {
        await companiesApi.create(payload);
        setToast({ type: 'success', message: 'Company created successfully.' });
      }
      setShowCompanyModal(false);
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to save company.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Outlet Modal Handlers
  const openOutletModal = (outlet?: Outlet, companyId?: string) => {
    if (outlet) {
      setEditingOutlet(outlet);
      setOutletForm({
        company_id: outlet.company_id || '',
        name: outlet.name || '',
        code: outlet.code || '',
        city: outlet.city || '',
        phone: outlet.phone || '',
        address: outlet.address || '',
        is_active: outlet.is_active !== false
      });
    } else {
      setEditingOutlet(null);
      setOutletForm({ 
        company_id: companyId || (companies.length === 1 ? companies[0].id : ''), 
        name: '', code: '', city: '', phone: '', address: '', is_active: true 
      });
    }
    setShowOutletModal(true);
  };

  const handleOutletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletForm.name || !outletForm.code || !outletForm.company_id || !outletForm.city) {
      setToast({ type: 'error', message: 'Company, Name, Code, and City are required.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...outletForm,
        is_active: outletForm.is_active ? 1 : 0
      };
      if (editingOutlet) {
        await outletsApi.update(editingOutlet.id, payload);
        setToast({ type: 'success', message: 'Outlet updated successfully.' });
      } else {
        await outletsApi.create(payload);
        setToast({ type: 'success', message: 'Outlet created successfully.' });
      }
      setShowOutletModal(false);
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to save outlet.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Handler
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'company') {
        await companiesApi.delete(deleteTarget.id);
        setToast({ type: 'success', message: 'Company deleted successfully.' });
      } else {
        await outletsApi.delete(deleteTarget.id);
        setToast({ type: 'success', message: 'Outlet deleted successfully.' });
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'Failed to delete.' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-4 top-20 z-60 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right duration-300 ${
          toast.type === "success"
            ? "border-green-500/20 bg-green-500/10 text-green-600"
            : "border-red-500/20 bg-red-500/10 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} title="Dismiss notification" aria-label="Dismiss notification" className="ml-2 rounded p-0.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <Building2 className="h-7 w-7 text-violet-500" /> Company
          </h1>
          <p className="mt-1 text-sm text-theme-text-muted">
            Manage companies and their branch outlets
          </p>
        </div>
        <div className="flex gap-2">
          {can("outlets.create") && (
            <button disabled={isProcessing} onClick={() => openOutletModal()} className="inline-flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg-card px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover transition-colors disabled:opacity-50">
              <Store className="h-4 w-4" /> Add Outlet
            </button>
          )}
          {can("companies.create") && (
            <button disabled={isProcessing} onClick={() => openCompanyModal()} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors disabled:opacity-50">
              <Plus className="h-4 w-4" /> Add Company
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {companies.map((company) => {
          const outlets = outletMap[company.id] || [];
          const isExpanded = expandedCompany === company.id;

          return (
            <div
              key={company.id}
              className="overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm transition-all"
            >
              {/* Company Row */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleExpand(company.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleExpand(company.id);
                  }
                }}
                className="flex w-full items-start sm:items-center gap-3 sm:gap-4 p-4 text-left transition-colors hover:bg-theme-bg-hover/50 cursor-pointer"
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 mt-0.5 sm:mt-0">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="font-semibold text-theme-text text-sm sm:text-base leading-tight">{company.name}</h3>
                    <span className="rounded bg-theme-bg-secondary px-2 py-0.5 text-[10px] font-semibold text-theme-text-muted">
                      {company.code}
                    </span>
                    {company.is_active ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">Active</span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">Inactive</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-text-muted">
                    {company.email && <span className="truncate max-w-37.5 sm:max-w-none">{company.email}</span>}
                    {company.phone && <span className="truncate">{company.phone}</span>}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Store className="h-3 w-3" /> {outlets.length} outlets
                    </span>
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Users className="h-3 w-3" /> {company.users_count ?? 0} users
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 mt-0.5 sm:mt-0">
                  {can("companies.update") && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openCompanyModal(company); }}
                      disabled={isProcessing}
                      title="Edit company"
                      aria-label="Edit company"
                      className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text disabled:opacity-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                  {can("companies.delete") && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: 'company', id: company.id, name: company.name }); }}
                      disabled={isProcessing}
                      title="Delete company"
                      aria-label="Delete company"
                      className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-theme-text-muted" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-theme-text-muted" />
                  )}
                </div>
              </div>

              {/* Outlets */}
              {isExpanded && outlets.length > 0 && (
                <div className="border-t border-theme-border bg-theme-bg-secondary/30">
                  <div className="divide-y divide-theme-border">
                    {outlets.map((outlet) => (
                      <div key={outlet.id} className="flex items-start sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 transition-colors hover:bg-theme-bg-hover/30">
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 mt-0.5 sm:mt-0">
                          <MapPin className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <p className="font-medium text-theme-text text-sm sm:text-base leading-tight">{outlet.name}</p>
                            <span className="rounded bg-theme-bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-theme-text-muted">
                              {outlet.code}
                            </span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-theme-text-muted">
                            <span className="truncate">{outlet.city}</span>
                            {outlet.phone && <span className="truncate">{outlet.phone}</span>}
                            <span className="flex items-center gap-1 whitespace-nowrap"><Users className="h-3 w-3" /> {outlet.users_count ?? 0}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5 sm:mt-0 flex-wrap sm:flex-nowrap justify-end">
                          {outlet.is_active ? (
                            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500">Active</span>
                          ) : (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-500">Inactive</span>
                          )}
                          {can("outlets.update") && (
                            <button disabled={isProcessing} onClick={() => openOutletModal(outlet)} title="Edit outlet" aria-label="Edit outlet" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text disabled:opacity-50">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {can("outlets.delete") && (
                            <button disabled={isProcessing} onClick={() => setDeleteTarget({ type: 'outlet', id: outlet.id, name: outlet.name })} title="Delete outlet" aria-label="Delete outlet" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isExpanded && outlets.length === 0 && (
                <div className="border-t border-theme-border px-6 py-8 text-center text-sm text-theme-text-muted">
                  No outlets found for this company.
                  {can("outlets.create") && (
                    <button onClick={() => openOutletModal(undefined, company.id)} className="ml-2 text-violet-500 hover:underline">Add Outlet</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" aria-label="Close" onClick={() => setShowCompanyModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <form onSubmit={handleCompanySubmit} className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
              <h2 className="text-lg font-bold text-theme-text">{editingCompany ? "Edit Company" : "Add Company"}</h2>
              <button type="button" onClick={() => setShowCompanyModal(false)} title="Close" aria-label="Close" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Name *</label>
                <input type="text" required aria-label="Company name" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Code *</label>
                <input type="text" required aria-label="Company code" value={companyForm.code} onChange={(e) => setCompanyForm({ ...companyForm, code: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Email</label>
                <input type="email" aria-label="Company email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Phone</label>
                <input type="text" aria-label="Company phone" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Address</label>
                <textarea aria-label="Company address" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="companyActive" checked={companyForm.is_active} onChange={(e) => setCompanyForm({ ...companyForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 dark:border-theme-border text-violet-600 focus:ring-violet-500" />
                <label htmlFor="companyActive" className="text-sm font-medium text-theme-text">Active Status</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button type="button" disabled={submitting} onClick={() => setShowCompanyModal(false)} className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Outlet Modal */}
      {showOutletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" aria-label="Close" onClick={() => setShowOutletModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <form onSubmit={handleOutletSubmit} className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
              <h2 className="text-lg font-bold text-theme-text">{editingOutlet ? "Edit Outlet" : "Add Outlet"}</h2>
              <button type="button" onClick={() => setShowOutletModal(false)} title="Close" aria-label="Close" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text"><X className="h-5 w-5" /></button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Company *</label>
                <select required aria-label="Company" value={outletForm.company_id} onChange={(e) => setOutletForm({ ...outletForm, company_id: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none">
                  <option value="">Select a company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Name *</label>
                <input type="text" required aria-label="Outlet name" value={outletForm.name} onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Code *</label>
                <input type="text" required aria-label="Outlet code" value={outletForm.code} onChange={(e) => setOutletForm({ ...outletForm, code: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">City *</label>
                <input type="text" required aria-label="Outlet city" value={outletForm.city} onChange={(e) => setOutletForm({ ...outletForm, city: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Phone</label>
                <input type="text" aria-label="Outlet phone" value={outletForm.phone} onChange={(e) => setOutletForm({ ...outletForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase">Address</label>
                <textarea aria-label="Outlet address" value={outletForm.address} onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 dark:border-theme-border bg-theme-bg-card dark:bg-theme-bg px-4 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="outletActive" checked={outletForm.is_active} onChange={(e) => setOutletForm({ ...outletForm, is_active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 dark:border-theme-border text-violet-600 focus:ring-violet-500" />
                <label htmlFor="outletActive" className="text-sm font-medium text-theme-text">Active Status</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button type="button" disabled={submitting} onClick={() => setShowOutletModal(false)} className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" aria-label="Close" onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-theme-text">Delete {deleteTarget.type === 'company' ? 'Company' : 'Outlet'}</h3>
              <p className="mt-2 text-sm text-theme-text-muted">
                Are you sure you want to delete <strong className="text-theme-text">{deleteTarget.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-red-700 disabled:opacity-50">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

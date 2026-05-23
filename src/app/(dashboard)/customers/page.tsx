"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  UserCircle, Plus, Search, Phone, Mail, MapPin,
  Edit2, Trash2, Eye, X, Loader2, AlertCircle, CheckCircle,
  UserCheck, UserX, Building2, ChevronDown, Check,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { useResizableColumns } from '@/hooks/use-resizable-columns';
import {
  customers as customersApi,
  customerStatuses as statusesApi,
  outlets as outletsApi,
  users as usersApi,
  companies as companiesApi,
  indonesiaAddress as regionApi,
} from "@/lib/api";
import type { Customer, CustomerStatus, Outlet, Company } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { TablePagination } from "@/components/ui/table-pagination";

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  province_code: string;
  city_code: string;
  district_code: string;
  village_code: string;
  rt: string;
  rw: string;
  postal_code: string;
  company_id: string;
  outlet_id: string;
  assigned_sales_id: string;
  status_id: string;
  source: string;
}

const emptyForm: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  province_code: "",
  city_code: "",
  district_code: "",
  village_code: "",
  rt: "",
  rw: "",
  postal_code: "",
  company_id: "",
  outlet_id: "",
  assigned_sales_id: "",
  status_id: "",
  source: "",
};

const sourceOptions = [
  "Walk-in",
  "Referral",
  "Social Media",
  "Website",
  "Phone Call",
  "WhatsApp",
  "Exhibition",
  "Other",
];

const formatPhoneForDisplay = (phone: string) => {
  if (!phone) return "—";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = clean.substring(1);
  } else if (clean.startsWith("62")) {
    clean = clean.substring(2);
  }

  if (clean.length >= 9) {
    const part1 = clean.substring(0, 3);
    const part2 = clean.substring(3, 7);
    const part3 = clean.substring(7);
    return `+62 ${part1}-${part2}-${part3}`;
  }
  return `+62 ${clean}`;
};

const CUSTOMER_COLUMN_COUNT = 7;

export default function CustomersPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<CustomerStatus[]>([]);
  const [outletList, setOutletList] = useState<Outlet[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Sort
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Resizable columns
  const {
    initialized: colsReady,
    isResizing,
    tableRef,
    getThStyle,
    getTdStyle,
    renderHandle,
  } = useResizableColumns({
    columnCount: CUSTOMER_COLUMN_COUNT,
    minWidth: 60,
    storageKey: 'customers-table',
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (search) params.search = search;
      if (filterStatus) params.status_id = filterStatus;
      if (filterOutlet) params.outlet_id = filterOutlet;
      if (sortField) {
        params.sort = sortField;
        params.direction = sortDirection;
      }
      const res = await customersApi.list(params);
      setData(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search, filterStatus, filterOutlet, sortField, sortDirection, perPage]);

  function handleSort(field: string) {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField('');
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1);
  }

  function renderSortIcon(field: string) {
    if (sortField === field) {
      return sortDirection === 'asc'
        ? <ArrowUp className="h-3.5 w-3.5 rt-sort-icon rt-sort-active" />
        : <ArrowDown className="h-3.5 w-3.5 rt-sort-icon rt-sort-active" />;
    }
    return <ArrowUpDown className="h-3.5 w-3.5 rt-sort-icon" />;
  }

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    statusesApi.list().then((r) => setStatuses(r.data || [])).catch(() => {});
    outletsApi.list().then((r) => setOutletList(r.data || [])).catch(() => {});
    companiesApi.list().then((r) => setCompanyList(r.data || [])).catch(() => {});
    usersApi.list({ per_page: "200" }).then((r) => setSalesList(r.data?.data || [])).catch(() => {});
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Indonesia address cascading state
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  const customerList: Customer[] = data?.data || [];
  const totalPages = data?.last_page || 1;

  const filteredOutlets = form.company_id
    ? outletList.filter((o: any) => o.company_id === form.company_id)
    : outletList;

  // Fetch provinces on mount + whenever modal opens (retry if empty)
  useEffect(() => {
    if (provinces.length === 0) {
      regionApi.provinces()
        .then((r) => {
          console.log('[Region] Provinces loaded:', r.data?.length);
          setProvinces(r.data || []);
        })
        .catch((err) => {
          console.error('[Region] Failed to load provinces:', err);
        });
    }
  }, [showModal]);

  // Cascade: province -> cities
  useEffect(() => {
    if (!form.province_code) { setCities([]); return; }
    setLoadingCities(true);
    regionApi.cities(form.province_code)
      .then((r) => setCities(r.data || []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [form.province_code]);

  // Cascade: city -> districts
  useEffect(() => {
    if (!form.city_code) { setDistricts([]); return; }
    setLoadingDistricts(true);
    regionApi.districts(form.city_code)
      .then((r) => setDistricts(r.data || []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [form.city_code]);

  // Cascade: district -> villages
  useEffect(() => {
    if (!form.district_code) { setVillages([]); return; }
    setLoadingVillages(true);
    regionApi.villages(form.district_code)
      .then((r) => setVillages(r.data || []))
      .catch(() => setVillages([]))
      .finally(() => setLoadingVillages(false));
  }, [form.district_code]);

  // Auto-fill postal code when village is selected
  useEffect(() => {
    if (!form.village_code || villages.length === 0) return;
    const v = villages.find((v: any) => v.code === form.village_code);
    if (v?.postal_code && !form.postal_code) {
      setForm((prev) => ({ ...prev, postal_code: v.postal_code }));
    }
  }, [form.village_code, villages]);

  // ── Modal handlers ──
  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setCities([]); setDistricts([]); setVillages([]);
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = async (customer: any) => {
    setEditingCustomer(customer);

    // Format phone number to strip leading 0 or +62/62 for input
    let phoneVal = customer.phone || "";
    if (phoneVal.startsWith("+62")) {
      phoneVal = phoneVal.substring(3);
    } else if (phoneVal.startsWith("62")) {
      phoneVal = phoneVal.substring(2);
    } else if (phoneVal.startsWith("0")) {
      phoneVal = phoneVal.substring(1);
    }
    phoneVal = phoneVal.replace(/\D/g, "");

    setForm({
      name: customer.name || "",
      phone: phoneVal,
      email: customer.email || "",
      address: customer.address || "",
      province_code: customer.province_code || "",
      city_code: customer.city_code || "",
      district_code: customer.district_code || "",
      village_code: customer.village_code || "",
      rt: customer.rt || "",
      rw: customer.rw || "",
      postal_code: customer.postal_code || "",
      company_id: customer.company_id || "",
      outlet_id: customer.outlet_id || "",
      assigned_sales_id: customer.assigned_sales_id || "",
      status_id: customer.status_id || "",
      source: customer.source || "",
    });

    // Pre-load cascading data for edit
    if (customer.province_code) {
      try {
        const cityRes = await regionApi.cities(customer.province_code);
        setCities(cityRes.data || []);
        if (customer.city_code) {
          const distRes = await regionApi.districts(customer.city_code);
          setDistricts(distRes.data || []);
          if (customer.district_code) {
            const vilRes = await regionApi.villages(customer.district_code);
            setVillages(vilRes.data || []);
          }
        }
      } catch { /* ignore */ }
    }

    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
    setCities([]); setDistricts([]); setVillages([]);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Customer name is required.";

    const phoneTrim = form.phone.trim();
    if (!phoneTrim) {
      errs.phone = "Phone number is required.";
    } else if (phoneTrim.length < 8 || phoneTrim.length > 13) {
      errs.phone = "Phone number must be between 8 and 13 digits.";
    }

    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email format.";
    }

    if (!form.province_code) errs.province_code = "Province is required.";
    if (!form.city_code) errs.city_code = "City/Regency is required.";
    if (!form.district_code) errs.district_code = "District is required.";
    if (!form.village_code) errs.village_code = "Village is required.";
    if (!form.status_id) errs.status_id = "Status is required.";
    if (!form.source) errs.source = "Source is required.";
    if (!form.company_id) errs.company_id = "Company is required.";
    if (!form.outlet_id) errs.outlet_id = "Outlet/Branch is required.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = { ...form };
      // Remove only optional fields
      if (!payload.assigned_sales_id) delete payload.assigned_sales_id;
      if (!payload.address) delete payload.address;
      if (!payload.rt) delete payload.rt;
      if (!payload.rw) delete payload.rw;
      if (!payload.postal_code) delete payload.postal_code;

      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        setToast({ type: "success", message: `Customer "${form.name}" has been updated.` });
      } else {
        await customersApi.create(payload);
        setToast({ type: "success", message: `Customer "${form.name}" has been created.` });
      }
      closeModal();
      fetchCustomers();
    } catch (err: any) {
      const msg = err?.message || "An error occurred. Please try again.";
      setToast({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customersApi.delete(deleteTarget.id);
      setToast({ type: "success", message: `Customer "${deleteTarget.name}" has been deleted.` });
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to delete customer." });
    } finally {
      setDeleting(false);
    }
  };

  const updateField = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="space-y-6">
      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`fixed right-4 top-20 z-[60] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right duration-300 ${
          toast.type === "success"
            ? "border-green-500/20 bg-green-500/10 text-green-600"
            : "border-red-500/20 bg-red-500/10 text-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-2 rounded p-0.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 px-2">
          <UserCircle size={52} className="text-violet-500 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Customers Contact</h1>
            <p className="mt-0.5 text-sm text-theme-text-muted">Manage your customer database</p>
          </div>
        </div>
        {can("customers.create") && (
          <button onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
          <input type="text" placeholder="Search by name, phone, or email..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-theme-border bg-theme-bg-card py-2.5 pl-10 pr-4 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterOutlet} onChange={(e) => { setFilterOutlet(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text focus:border-violet-500 focus:outline-none">
          <option value="">All Outlets</option>
          {outletList.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="rt-wrapper">
          <table ref={tableRef} className={`rt-table w-full text-sm${colsReady ? ' rt-fixed' : ''}`}>
            <thead>
              <tr>
                <th className="text-left rt-sortable" style={getThStyle(0)} onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">Customer {renderSortIcon('name')}</span>
                  {renderHandle(0)}
                </th>
                <th className="text-left rt-sortable" style={getThStyle(1)} onClick={() => handleSort('phone')}>
                  <span className="flex items-center gap-1">Contact {renderSortIcon('phone')}</span>
                  {renderHandle(1)}
                </th>
                <th className="text-left rt-sortable" style={getThStyle(2)} onClick={() => handleSort('status')}>
                  <span className="flex items-center gap-1">Status {renderSortIcon('status')}</span>
                  {renderHandle(2)}
                </th>
                <th className="text-left rt-sortable" style={getThStyle(3)} onClick={() => handleSort('outlet')}>
                  <span className="flex items-center gap-1">Outlet {renderSortIcon('outlet')}</span>
                  {renderHandle(3)}
                </th>
                <th className="text-left rt-sortable" style={getThStyle(4)} onClick={() => handleSort('assigned_sales')}>
                  <span className="flex items-center gap-1">Assigned Sales {renderSortIcon('assigned_sales')}</span>
                  {renderHandle(4)}
                </th>
                <th className="text-left rt-sortable" style={getThStyle(5)} onClick={() => handleSort('source')}>
                  <span className="flex items-center gap-1">Source {renderSortIcon('source')}</span>
                  {renderHandle(5)}
                </th>
                <th className="text-right" style={getThStyle(6)}>
                  <span>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-theme-text-muted">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : customerList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-theme-text-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customerList.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-theme-bg-hover/50">
                    <td className="px-4 py-3 rt-cell" style={getTdStyle(0)}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-semibold text-violet-500">
                          {c.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-theme-text truncate">{c.name}</p>
                          {c.address && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-theme-text-muted truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {c.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 rt-cell" style={getTdStyle(1)}>
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-theme-text">
                          <Phone className="h-3 w-3 text-theme-text-muted shrink-0" /> {formatPhoneForDisplay(c.phone)}
                        </p>
                        {c.email && (
                          <p className="flex items-center gap-1 text-xs text-theme-text-muted">
                            <Mail className="h-3 w-3 shrink-0" /> {c.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 rt-cell" style={getTdStyle(2)}>
                      {c.status ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${c.status.color}15`, color: c.status.color }}>
                          {c.status.name}
                        </span>
                      ) : (
                        <span className="text-xs text-theme-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-theme-text-secondary rt-cell" style={getTdStyle(3)}>
                      {c.outlet?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-theme-text-secondary rt-cell" style={getTdStyle(4)}>
                      {c.assigned_sales?.full_name || "—"}
                    </td>
                    <td className="px-4 py-3 rt-cell" style={getTdStyle(5)}>
                      <span className="text-xs text-theme-text-muted capitalize">
                        {c.source || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" style={getTdStyle(6)}>
                      <div className="flex items-center justify-end gap-1">
                        {can("customers.update") && (
                          <button onClick={() => openEditModal(c)}
                            className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text" title="Edit customer">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {can("customers.delete") && (
                          <button onClick={() => setDeleteTarget(c)}
                            className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500" title="Delete customer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* ══════════════════════════════════════════════════════════════
          CREATE / EDIT CUSTOMER MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <button type="button" aria-label="Close" onClick={closeModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* Panel */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl"
            autoComplete="off"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-theme-text">
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </h2>
                <p className="text-xs text-theme-text-muted">
                  {editingCustomer ? "Update customer information" : "Add a new customer to your database"}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Customer Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. John Doe"
                  autoComplete="off"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${
                    errors.name ? "border-red-500 focus:ring-red-500" : "border-theme-border focus:border-violet-500 focus:ring-violet-500"
                  }`} />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Phone Number *</label>
                <div className={`relative flex rounded-xl border bg-theme-bg focus-within:ring-1 ${
                  errors.phone
                    ? "border-red-500 focus-within:border-red-500 focus-within:ring-red-500"
                    : "border-theme-border focus-within:border-violet-500 focus-within:ring-violet-500"
                }`}>
                  <span className="flex items-center bg-theme-bg-secondary px-3.5 text-sm text-theme-text-muted border-r border-theme-border rounded-l-xl font-medium select-none">
                    +62
                  </span>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/\D/g, "");
                      updateField("phone", cleanVal);
                    }}
                    placeholder="e.g. 81234567890"
                    autoComplete="off"
                    maxLength={13}
                    className="w-full bg-transparent px-4 py-2.5 text-sm text-theme-text placeholder-theme-text-muted focus:outline-none rounded-r-xl"
                  />
                </div>
                <p className="mt-1 text-[11px] text-theme-text-muted">Fill in the rest of the number after +62 (e.g. 812xxxxxx). Min 8, max 13 digits.</p>
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Email Address *</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. john@example.com"
                  autoComplete="off"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-theme-border focus:border-violet-500 focus:ring-violet-500"
                  }`} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* ── Address Section ── */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-theme-text-muted uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Address Information
                </p>

                {/* Province & City Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">Province *</label>
                    <SearchableSelect
                      options={provinces.map((p: any) => ({ value: p.code, label: p.name }))}
                      value={form.province_code}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, province_code: val, city_code: "", district_code: "", village_code: "", postal_code: "" }));
                        setDistricts([]); setVillages([]);
                        if (errors.province_code) setErrors((prev) => { const n = { ...prev }; delete n.province_code; return n; });
                      }}
                      placeholder="Select province..."
                      searchPlaceholder="Search province..."
                      error={!!errors.province_code}
                    />
                    {errors.province_code && <p className="mt-0.5 text-[11px] text-red-500">{errors.province_code}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">City / Regency *</label>
                    <SearchableSelect
                      options={cities.map((c: any) => ({ value: c.code, label: c.name }))}
                      value={form.city_code}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, city_code: val, district_code: "", village_code: "", postal_code: "" }));
                        setVillages([]);
                        if (errors.city_code) setErrors((prev) => { const n = { ...prev }; delete n.city_code; return n; });
                      }}
                      placeholder={loadingCities ? "Loading..." : form.province_code ? "Select city..." : "Select province first"}
                      searchPlaceholder="Search city..."
                      disabled={!form.province_code}
                      loading={loadingCities}
                      error={!!errors.city_code}
                    />
                    {errors.city_code && <p className="mt-0.5 text-[11px] text-red-500">{errors.city_code}</p>}
                  </div>
                </div>

                {/* District & Village Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">District (Kecamatan) *</label>
                    <SearchableSelect
                      options={districts.map((d: any) => ({ value: d.code, label: d.name }))}
                      value={form.district_code}
                      onChange={(val) => {
                        setForm((prev) => ({ ...prev, district_code: val, village_code: "", postal_code: "" }));
                        if (errors.district_code) setErrors((prev) => { const n = { ...prev }; delete n.district_code; return n; });
                      }}
                      placeholder={loadingDistricts ? "Loading..." : form.city_code ? "Select district..." : "Select city first"}
                      searchPlaceholder="Search district..."
                      disabled={!form.city_code}
                      loading={loadingDistricts}
                      error={!!errors.district_code}
                    />
                    {errors.district_code && <p className="mt-0.5 text-[11px] text-red-500">{errors.district_code}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">Village (Kelurahan) *</label>
                    <SearchableSelect
                      options={villages.map((v: any) => ({ value: v.code, label: v.name }))}
                      value={form.village_code}
                      onChange={(val) => {
                        updateField("village_code", val);
                      }}
                      placeholder={loadingVillages ? "Loading..." : form.district_code ? "Select village..." : "Select district first"}
                      searchPlaceholder="Search village..."
                      disabled={!form.district_code}
                      loading={loadingVillages}
                      error={!!errors.village_code}
                    />
                    {errors.village_code && <p className="mt-0.5 text-[11px] text-red-500">{errors.village_code}</p>}
                  </div>
                </div>

                {/* RT / RW / Postal Code Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">RT</label>
                    <input type="text" value={form.rt}
                      onChange={(e) => updateField("rt", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="e.g. 001" maxLength={5} autoComplete="off"
                      className="w-full rounded-xl border border-theme-border px-3 py-2 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">RW</label>
                    <input type="text" value={form.rw}
                      onChange={(e) => updateField("rw", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="e.g. 005" maxLength={5} autoComplete="off"
                      className="w-full rounded-xl border border-theme-border px-3 py-2 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">Postal Code</label>
                    <input type="text" value={form.postal_code}
                      onChange={(e) => updateField("postal_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="e.g. 12345" maxLength={5} autoComplete="off"
                      className="w-full rounded-xl border border-theme-border px-3 py-2 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                  </div>
                </div>

                {/* Detail Address */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-theme-text-muted uppercase tracking-wide">Detail Address (Street, No, etc.)</label>
                  <textarea value={form.address} onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g. Jl. Sudirman No. 123, Gedung ABC Lt. 5"
                    rows={2}
                    className="w-full rounded-xl border border-theme-border px-3 py-2 text-sm text-theme-text bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none" />
                </div>
              </div>

              <div className="my-2 border-t border-theme-border" />

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Status *</label>
                {/* <select value={form.status_id} onChange={(e) => updateField("status_id", e.target.value)}
                  className="w-full rounded-xl border border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="">Select status...</option>
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select> */}
                <SearchableSelect
                  options={statuses.map((s) => ({ value: s.id, label: s.name }))}
                  value={form.status_id}
                  onChange={(val) => updateField("status_id", val)}
                  placeholder="Select status..."
                  searchPlaceholder="Search status..."
                  error={!!errors.status_id}
                />
                {errors.status_id && <p className="mt-1 text-xs text-red-500">{errors.status_id}</p>}
              </div>

              {/* Source */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Source *</label>
                {/* <select value={form.source} onChange={(e) => updateField("source", e.target.value)}
                  className="w-full rounded-xl border border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="">Select source...</option>
                  {sourceOptions.map((s) => <option key={s} value={s.toLowerCase().replace(/\s+/g, "_")}>{s}</option>)}
                </select> */}
                <SearchableSelect
                  options={sourceOptions.map((s) => ({ value: s.toLowerCase().replace(/\s+/g, "_"), label: s }))}
                  value={form.source}
                  onChange={(val) => updateField("source", val)}
                  placeholder="Select source..."
                  searchPlaceholder="Search source..."
                  error={!!errors.source}
                />
                {errors.source && <p className="mt-1 text-xs text-red-500">{errors.source}</p>}
              </div>

              {/* Assigned Sales */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Assigned Sales</label>
                {/* <select value={form.assigned_sales_id} onChange={(e) => updateField("assigned_sales_id", e.target.value)}
                  className="w-full rounded-xl border border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="">No sales assigned</option>
                  {salesList.map((u) => <option key={u.id} value={u.id}>{u.full_name} — {u.email}</option>)}
                </select> */}
                <SearchableSelect
                  options={salesList.map((u) => ({ value: u.id, label: `${u.full_name} — ${u.email}` }))}
                  value={form.assigned_sales_id}
                  onChange={(val) => updateField("assigned_sales_id", val)}
                  placeholder="No sales assigned"
                  searchPlaceholder="Search sales..."
                />
              </div>

              <div className="my-2 border-t border-theme-border" />

              {/* Company */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Company *</label>
                <SearchableSelect
                  options={companyList.map((c) => ({ value: c.id, label: c.name }))}
                  value={form.company_id}
                  onChange={(val) => { updateField("company_id", val); updateField("outlet_id", ""); }}
                  placeholder="No company assigned"
                  searchPlaceholder="Search company..."
                  error={!!errors.company_id}
                />
                {errors.company_id && <p className="mt-1 text-xs text-red-500">{errors.company_id}</p>}
              </div>

              {/* Outlet (Branch) */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Outlet / Branch *</label>
                <SearchableSelect
                  options={filteredOutlets.map((o) => ({ value: o.id, label: o.name }))}
                  value={form.outlet_id}
                  onChange={(val) => updateField("outlet_id", val)}
                  placeholder={form.company_id ? "Select outlet..." : "Select a company first"}
                  searchPlaceholder="Search outlet..."
                  disabled={!form.company_id}
                  error={!!errors.outlet_id}
                />
                {errors.outlet_id && <p className="mt-1 text-xs text-red-500">{errors.outlet_id}</p>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button type="button" onClick={closeModal} disabled={submitting}
                className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingCustomer ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
         ══════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button type="button" aria-label="Close" onClick={() => setDeleteTarget(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-theme-text">Delete Customer</h3>
              <p className="mt-2 text-sm text-theme-text-muted">
                Are you sure you want to delete <strong className="text-theme-text">{deleteTarget.name}</strong>?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-theme-border px-6 py-4">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="rounded-xl border border-theme-border px-4 py-2.5 text-sm font-medium text-theme-text hover:bg-theme-bg-hover transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50">
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

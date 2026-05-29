"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Users, Plus, Search, Shield, Building2, MapPin,
  UserCheck, UserX, Edit2, Trash2, X, Eye, EyeOff,
  Loader2, AlertCircle, CheckCircle, ChevronDown, Check,
} from "lucide-react";
import { users as usersApi, roles as rolesApi, companies as companiesApi, outlets as outletsApi } from "@/lib/api";
import { TablePagination } from "@/components/ui/table-pagination";
import type { Role, Company, Outlet } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";

interface UserForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role_id: string;
  company_ids: string[];
  outlet_id: string;
  status: string;
}

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  password: "",
  phone: "",
  role_id: "",
  company_ids: [],
  outlet_id: "",
  status: "active",
};

export default function SalesTeamPage() {
  const { can } = usePermissions();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [outletList, setOutletList] = useState<Outlet[]>([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Company multi-select dropdown
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const isProcessing = deleting || submitting;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (search) params.search = search;
      if (filterRole) params.role_id = filterRole;
      if (filterCompany) params.company_id = filterCompany;
      const res = await usersApi.list(params);
      setData(res.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search, filterRole, filterCompany, perPage]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    rolesApi.list().then((r) => setRoles(r.data || [])).catch(() => {});
    companiesApi.list().then((r) => setCompanyList(r.data || [])).catch(() => {});
    outletsApi.list().then((r) => setOutletList(r.data || [])).catch(() => {});
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const userList: any[] = data?.data || [];
  const totalPages = data?.last_page || 1;

  const filteredOutlets = form.company_ids.length > 0
    ? outletList.filter((o: any) => form.company_ids.includes(o.company_id))
    : outletList;

  // Close company dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Modal handlers ──
  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setErrors({});
    setShowPassword(false);
    setCompanyDropdownOpen(false);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    // Extract company IDs from the many-to-many 'companies' array
    const userCompanyIds = (user.companies || []).map((c: any) => c.id);
    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      role_id: user.role_id || "",
      company_ids: userCompanyIds.length > 0 ? userCompanyIds : (user.company_id ? [user.company_id] : []),
      outlet_id: user.outlet_id || "",
      status: user.status || "active",
    });
    setErrors({});
    setShowPassword(false);
    setCompanyDropdownOpen(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format.";
    if (!editingUser && !form.password) errs.password = "Password is required for new users.";
    else if (form.password && form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!form.role_id) errs.role_id = "Please select a role.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload: any = { ...form };
      // Set role slug from role_id
      const selectedRole = roles.find((r) => r.id === form.role_id);
      if (selectedRole) payload.role = selectedRole.slug;
      // Remove empty optional fields
      if (!payload.password) delete payload.password;
      if (!payload.phone) delete payload.phone;
      if (!payload.outlet_id) delete payload.outlet_id;

      // Send company_ids array to the API
      payload.company_ids = form.company_ids;
      delete payload.company_id; // Let the backend handle primary company

      if (editingUser) {
        await usersApi.update(editingUser.id, payload);
        setToast({ type: "success", message: `User "${form.full_name}" has been updated.` });
      } else {
        await usersApi.create(payload);
        setToast({ type: "success", message: `User "${form.full_name}" has been created.` });
      }
      closeModal();
      fetchUsers();
    } catch (err: any) {
      const msg = err?.message || "An error occurred. Please try again.";
      if (msg.includes("email") && msg.includes("taken")) {
        setErrors((prev) => ({ ...prev, email: "This email is already registered." }));
      } else {
        setToast({ type: "error", message: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete handler ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      setToast({ type: "success", message: `User "${deleteTarget.full_name}" has been deleted.` });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      setToast({ type: "error", message: err?.message || "Failed to delete user." });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (user: any) => {
    const role = user.role_relation;
    if (!role) return <span className="text-xs text-theme-text-muted capitalize">{user.role || "—"}</span>;
    const colors: Record<string, string> = {
      super_admin: "#EF4444", admin: "#8B5CF6", manager: "#3B82F6", spv: "#F59E0B", staff: "#10B981",
    };
    const c = colors[role.slug] || "#6B7280";
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${c}15`, color: c }}>
        <Shield className="h-3 w-3" /> {role.name}
      </span>
    );
  };

  const updateField = (field: keyof UserForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleCompany = (companyId: string) => {
    setForm((prev) => {
      const ids = prev.company_ids.includes(companyId)
        ? prev.company_ids.filter((id) => id !== companyId)
        : [...prev.company_ids, companyId];
      // Reset outlet if no companies selected or outlet no longer belongs to selected companies
      let outletId = prev.outlet_id;
      if (ids.length === 0) {
        outletId = "";
      } else if (outletId) {
        const outletBelongs = outletList.some((o: any) => o.id === outletId && ids.includes(o.company_id));
        if (!outletBelongs) outletId = "";
      }
      return { ...prev, company_ids: ids, outlet_id: outletId };
    });
  };

  const getCompanyLabel = () => {
    if (form.company_ids.length === 0) return "No company assigned";
    if (form.company_ids.length === 1) {
      const c = companyList.find((c) => c.id === form.company_ids[0]);
      return c?.name || "1 company selected";
    }
    return `${form.company_ids.length} companies selected`;
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
          {/* <Users className="h-[52px] w-[52px] text-violet-500 shrink-0" /> */}
          <Users size={52} className="text-violet-500 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-theme-text">Users</h1>
            <p className="mt-0.5 text-sm text-theme-text-muted">Management Data Users</p>
          </div>
        </div>
        {can("users.create") && (
          <button onClick={openCreateModal}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4" /> Add User
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-text-muted" />
          <input type="text" placeholder="Search by name or email..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-theme-border bg-theme-bg-card py-2.5 pl-10 pr-4 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text">
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setPage(1); }}
          className="rounded-xl border border-theme-border bg-theme-bg-card px-3 py-2.5 text-sm text-theme-text">
          <option value="">All Companies</option>
          {companyList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-theme-bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">User</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Company</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Outlet</th>
                <th className="px-4 py-3 text-left font-semibold text-theme-text-muted">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-theme-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-theme-text-muted">
                  <div className="flex items-center justify-center gap-2"><div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />Loading...</div>
                </td></tr>
              ) : userList.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-theme-text-muted">No users found.</td></tr>
              ) : (
                userList.map((u: any) => (
                  <tr key={u.id} className="transition-colors hover:bg-theme-bg-hover/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-sm font-semibold text-violet-500">
                          {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-theme-text">{u.full_name}</p>
                          <p className="text-xs text-theme-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(u)}</td>
                    <td className="px-4 py-3 text-theme-text-secondary">
                      {(u.companies && u.companies.length > 0) ? (
                        <div className="flex flex-wrap gap-1">
                          {u.companies.map((c: any) => (
                            <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                              <Building2 className="h-3 w-3" /> {c.name}
                            </span>
                          ))}
                        </div>
                      ) : u.company ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-500">
                          <Building2 className="h-3 w-3" /> {u.company.name}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-theme-text-secondary">
                      {u.outlet ? (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {u.outlet.name}</span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.status === "active" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">
                          <UserCheck className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                          <UserX className="h-3 w-3" /> {u.status || "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {can("users.update") && (
                          <button onClick={() => openEditModal(u)}
                            disabled={isProcessing}
                            className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text disabled:opacity-50 disabled:cursor-not-allowed" title="Edit user">
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        {can("users.delete") && (
                          <button onClick={() => setDeleteTarget(u)}
                            disabled={isProcessing}
                            className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed" title="Delete user">
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
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={data?.total || 0}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CREATE / EDIT USER MODAL
         ══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <button type="button" aria-label="Close" onClick={closeModal}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          {/* Panel */}
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
            className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-theme-border bg-theme-bg-card shadow-2xl"
            autoComplete="off"
          >
            {/* Dummy inputs to intercept browser autofill */}
            <input type="text" name="email" readOnly style={{ position: "absolute", top: "-9999px", left: "-9999px" }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="password" readOnly style={{ position: "absolute", top: "-9999px", left: "-9999px" }} tabIndex={-1} aria-hidden="true" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-theme-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-theme-text">
                  {editingUser ? "Edit User" : "Create New User"}
                </h2>
                <p className="text-xs text-theme-text-muted">
                  {editingUser ? "Update user information and access settings" : "Add a new user"}
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Full Name *</label>
                <input type="text" value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)}
                  placeholder="e.g. John Doe"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${
                    errors.full_name ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-theme-border focus:border-violet-500 focus:ring-violet-500"
                  }`} />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Email Address *</label>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)}
                  placeholder="e.g. john@watchestraders.com"
                  autoComplete="off"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-theme-border focus:border-violet-500 focus:ring-violet-500"
                  }`} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">
                  Password {editingUser ? "(leave blank to keep current)" : "*"}
                </label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => updateField("password", e.target.value)}
                    placeholder={editingUser ? "••••••••" : "Min. 8 characters"}
                    autoComplete="new-password"
                    className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg placeholder-theme-text-muted focus:outline-none focus:ring-1 ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-theme-border focus:border-violet-500 focus:ring-violet-500"
                    }`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Phone Number</label>
                <input type="text" value={form.phone} onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="e.g. +62 812 3456 7890"
                  className="w-full rounded-xl border border-slate-300 dark:border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>

              <div className="my-2 border-t border-theme-border" />

              {/* Role */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Role *</label>
                <select value={form.role_id} onChange={(e) => updateField("role_id", e.target.value)}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg focus:outline-none focus:ring-1 ${
                    errors.role_id ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-theme-border focus:border-violet-500 focus:ring-violet-500"
                  }`}>
                  <option value="">Select a role...</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name} — {r.description || `Level ${r.level}`}</option>)}
                </select>
                {errors.role_id && <p className="mt-1 text-xs text-red-500">{errors.role_id}</p>}
              </div>

              {/* Company (Multi-select) */}
              <div ref={companyDropdownRef} className="relative">
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Company</label>
                <button type="button" onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-300 dark:border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors">
                  <span className={form.company_ids.length === 0 ? "text-theme-text-muted" : ""}>
                    {getCompanyLabel()}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-theme-text-muted transition-transform duration-200 ${companyDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Selected company badges */}
                {form.company_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.company_ids.map((id) => {
                      const c = companyList.find((c) => c.id === id);
                      return c ? (
                        <span key={id} className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 pl-2 pr-1 py-1 text-xs font-medium text-violet-500">
                          <Building2 className="h-3 w-3" /> {c.name}
                          <button type="button" onClick={(e) => { e.stopPropagation(); toggleCompany(id); }}
                            className="ml-0.5 rounded p-0.5 hover:bg-violet-500/20 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Dropdown panel */}
                {companyDropdownOpen && (
                  <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-theme-border bg-theme-bg-card shadow-lg">
                    {companyList.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-theme-text-muted">No companies available</div>
                    ) : (
                      companyList.map((c) => {
                        const isSelected = form.company_ids.includes(c.id);
                        return (
                          <button key={c.id} type="button"
                            onClick={() => toggleCompany(c.id)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-theme-bg-hover ${
                              isSelected ? "text-violet-500 font-medium" : "text-theme-text"
                            }`}>
                            <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                              isSelected ? "border-violet-500 bg-violet-500" : "border-theme-border"
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <Building2 className="h-3.5 w-3.5 text-theme-text-muted shrink-0" />
                            <span>{c.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Outlet (Branch) — filtered by selected companies */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Outlet / Branch</label>
                <select value={form.outlet_id} onChange={(e) => updateField("outlet_id", e.target.value)}
                  disabled={form.company_ids.length === 0}
                  className="w-full rounded-xl border border-slate-300 dark:border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{form.company_ids.length > 0 ? "Select outlet..." : "Select a company first"}</option>
                  {filteredOutlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-theme-text-muted uppercase tracking-wide">Status</label>
                <select value={form.status} onChange={(e) => updateField("status", e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-theme-border px-4 py-2.5 text-sm text-theme-text bg-theme-bg-card dark:bg-theme-bg focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
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
                {editingUser ? "Save Changes" : "Create User"}
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
              <h3 className="text-lg font-bold text-theme-text">Delete User</h3>
              <p className="mt-2 text-sm text-theme-text-muted">
                Are you sure you want to delete <strong className="text-theme-text">{deleteTarget.full_name}</strong>?
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

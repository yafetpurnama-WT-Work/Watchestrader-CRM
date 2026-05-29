"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, ArrowLeft, CheckCircle, AlertCircle, X, Network } from "lucide-react";
import { leadSources } from "@/lib/api";
import Link from "next/link";
import type { LeadSource } from "@/types";

export default function LeadSourcesPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LeadSource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState("#6B7280");
  const [isActive, setIsActive] = useState(true);

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leadSources.list();
      if (res.success) {
        setSources(res.data || []);
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to load sources" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleOpenModal = (source?: LeadSource) => {
    if (source) {
      setEditingSource(source);
      setName(source.name);
      setCode(source.code);
      setColor(source.color || "#6B7280");
      setIsActive(source.is_active !== undefined ? source.is_active : true);
    } else {
      setEditingSource(null);
      setName("");
      setCode("");
      setColor("#6B7280");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSource(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const payload = { name, code, color, is_active: isActive };

      if (editingSource) {
        await leadSources.update(editingSource.id, payload);
        setToast({ type: "success", message: "Lead source updated successfully" });
      } else {
        await leadSources.create(payload);
        setToast({ type: "success", message: "Lead source created successfully" });
      }

      handleCloseModal();
      fetchSources();
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to save lead source" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await leadSources.delete(deleteTarget.id);
      setToast({ type: "success", message: "Lead source deleted" });
      fetchSources();
      setDeleteTarget(null);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete lead source" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads" title="Back to leads" aria-label="Back to leads" className="flex h-10 w-10 items-center justify-center rounded-xl border border-theme-border bg-theme-bg-card text-theme-text-muted hover:text-theme-text transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-theme-text">Lead Sources</h1>
              <p className="text-sm text-theme-text-muted">Manage sources where leads come from</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-theme-text-muted" />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex h-40 items-center justify-center flex-col gap-2 text-theme-text-muted">
            <Network className="h-10 w-10 opacity-20" />
            <p>No lead sources found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-theme-border bg-theme-bg/50 text-xs font-medium uppercase text-theme-text-muted">
                <tr>
                  <th className="px-6 py-4">Name / Color</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {sources.map((source) => {
                  const dotStyle = { backgroundColor: source.color };
                  return (
                  <tr key={source.id} className="hover:bg-theme-bg/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 rounded-full" style={dotStyle} />
                        <span className="font-semibold text-theme-text">{source.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-theme-text-muted">{source.code}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        source.is_active !== false 
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                      }`}>
                        {source.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(source)}
                          title="Edit source"
                          aria-label="Edit source"
                          className="p-2 text-theme-text-muted hover:text-theme-text"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: source.id, name: source.name })}
                          title="Delete source"
                          aria-label="Delete source"
                          className="p-2 text-theme-text-muted hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-md rounded-2xl border border-theme-border bg-theme-bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <h2 className="mb-4 text-xl font-bold text-theme-text">
              {editingSource ? "Edit Source" : "Add Source"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-theme-text">Source Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website, Instagram"
                  aria-label="Source Name"
                  className="w-full rounded-xl border border-theme-border bg-theme-bg px-4 py-2.5 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-theme-text">Source Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. WEB, IG"
                  className="w-full rounded-xl border border-theme-border bg-theme-bg px-4 py-2.5 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-theme-text">Color Hex</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    aria-label="Color picker"
                    className="h-10 w-14 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#FFFFFF"
                    aria-label="Color hex value"
                    className="flex-1 rounded-xl border border-theme-border bg-theme-bg px-4 py-2.5 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm font-semibold text-theme-text">Active source</span>
              </label>

              <div className="mt-6 flex gap-3 pt-4 border-t border-theme-border">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 rounded-xl border border-theme-border bg-transparent py-2.5 text-sm font-semibold text-theme-text hover:bg-theme-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {editingSource ? "Save Changes" : "Create Source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <button type="button" aria-label="Close" onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-theme-bg-card p-6 text-center shadow-xl animate-in fade-in zoom-in-95">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-theme-text">Delete Source</h3>
            <p className="mt-2 text-sm text-theme-text-muted">
              Are you sure you want to delete <strong className="text-theme-text">{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="flex-1 rounded-xl border border-theme-border py-2.5 text-sm font-semibold text-theme-text hover:bg-theme-bg disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed right-4 top-20 z-60 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right duration-300 ${toast.type === "success" ? "border-green-500/20 bg-green-500/10 text-green-600" : "border-red-500/20 bg-red-500/10 text-red-600"}`}>
          {toast.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} title="Dismiss notification" aria-label="Dismiss notification" className="ml-2 rounded p-0.5 hover:bg-black/5"><X className="h-4 w-4" /></button>
        </div>
      )}
    </div>
  );
}

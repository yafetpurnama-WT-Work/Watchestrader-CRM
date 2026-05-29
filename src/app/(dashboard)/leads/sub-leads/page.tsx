"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, Loader2, Layers, Search } from "lucide-react";
import { leads, subLeads, products } from "@/lib/api";
import type { Lead, SubLead } from "@/types";

export default function SubLeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams?.get("lead_id");

  const [leadList, setLeadList] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leadIdParam || "");
  
  const [items, setItems] = useState<SubLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubLead | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("cold");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Fetch all leads for the dropdown
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const res = await leads.list({ per_page: "100" });
        if (res.success) {
          setLeadList(res.data?.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchLeads();
  }, []);

  const fetchSubLeads = useCallback(async (leadId: string) => {
    if (!leadId) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await subLeads.list(leadId);
      if (res.success) {
        setItems(res.data || []);
      }
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to load sub-leads" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      fetchSubLeads(selectedLeadId);
      // Update URL without full reload
      const url = new URL(window.location.href);
      url.searchParams.set("lead_id", selectedLeadId);
      window.history.replaceState({}, "", url.toString());
    } else {
      setItems([]);
    }
  }, [selectedLeadId, fetchSubLeads]);

  const handleOpenModal = (item?: SubLead) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setValue(item.value ? item.value.toString() : "");
      setStatus(item.status || "cold");
      setNotes(item.notes || "");
    } else {
      setEditingItem(null);
      setTitle("");
      setValue("");
      setStatus("cold");
      setNotes("");
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedLeadId) return;

    try {
      setIsSubmitting(true);
      const payload = { 
        title, 
        value: parseFloat(value) || 0,
        status,
        notes
      };

      if (editingItem) {
        await subLeads.update(selectedLeadId, editingItem.id, payload);
        setToast({ type: "success", message: "Sub-lead updated successfully" });
      } else {
        await subLeads.create(selectedLeadId, payload);
        setToast({ type: "success", message: "Sub-lead created successfully" });
      }

      handleCloseModal();
      fetchSubLeads(selectedLeadId);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to save sub-lead" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !selectedLeadId) return;

    try {
      setIsDeleting(true);
      await subLeads.delete(selectedLeadId, deleteTarget.id);
      setToast({ type: "success", message: "Sub-lead deleted" });
      fetchSubLeads(selectedLeadId);
      setDeleteTarget(null);
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to delete sub-lead" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-theme-text">Sub-Leads</h1>
            <p className="text-sm text-theme-text-muted">Manage potential opportunities inside a Lead</p>
          </div>
        </div>

        {selectedLeadId && (
          <button
            onClick={() => handleOpenModal()}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Sub-Lead
          </button>
        )}
      </div>

      {/* Filter / Lead Selector */}
      <div className="rounded-xl border border-theme-border bg-theme-bg-card p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-1/3">
          <label className="mb-1 block text-sm font-medium text-theme-text-secondary">Select Lead (Parent)</label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          >
            <option value="">-- Choose a Lead --</option>
            {leadList.map((l) => (
              <option key={l.id} value={l.id}>{l.title} ({l.customer?.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-theme-border bg-theme-bg-card shadow-sm overflow-hidden">
        {!selectedLeadId ? (
          <div className="flex flex-col items-center justify-center p-12 text-theme-text-muted">
            <Search className="mb-2 h-10 w-10 opacity-20" />
            <p>Please select a Lead from the dropdown above to view its Sub-Leads.</p>
          </div>
        ) : loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-theme-text-muted" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-sm">
              <thead className="bg-theme-bg-secondary/50 border-b border-theme-border text-left font-semibold text-theme-text-muted">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-theme-text-muted">
                      No sub-leads found for this lead.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-theme-bg-hover/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-theme-text">{item.title}</p>
                        {item.notes && <p className="text-xs text-theme-text-muted mt-1 max-w-xs truncate">{item.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-theme-text">
                        Rp {Number(item.value).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-theme-bg-secondary px-2.5 py-0.5 text-xs font-medium text-theme-text">
                          {item.status || "cold"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-theme-text-muted text-xs">
                        {new Date(item.created_at).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleOpenModal(item)} title="Edit" aria-label="Edit" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-theme-bg-hover hover:text-theme-text">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: item.id, title: item.title })} title="Delete" aria-label="Delete" className="rounded-lg p-1.5 text-theme-text-muted hover:bg-red-500/10 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button type="button" aria-label="Close modal" onClick={handleCloseModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl bg-theme-bg-card p-6 shadow-xl border border-theme-border">
            <h2 className="mb-6 text-xl font-bold text-theme-text">
              {editingItem ? "Edit Sub-Lead" : "Add Sub-Lead"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-theme-text-secondary">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Interested in Product X"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-theme-text-secondary">Value (Rp)</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-theme-text-secondary">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="cold">Cold</option>
                  <option value="warm">Warm</option>
                  <option value="hot">Hot</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-theme-text-secondary">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-3 py-2 text-sm text-theme-text focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="Additional details..."
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-theme-border pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button type="button" aria-label="Close delete modal" onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-theme-bg-card p-6 shadow-xl border border-theme-border">
            <h3 className="mb-2 text-lg font-bold text-theme-text">Delete Sub-Lead</h3>
            <p className="mb-6 text-sm text-theme-text-secondary">
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className={`rounded-xl px-4 py-3 shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

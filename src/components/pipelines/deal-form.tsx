"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { contacts as contactsApi, deals as dealsApi, conversations as conversationsApi } from "@/lib/api";
import type {
  Contact,
  Conversation,
  Deal,
  DealStatus,
  PipelineStage,
  Profile,
} from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  Trash2,
  MessageSquare,
  DollarSign,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  pipelineId: string;
  stages: PipelineStage[];
  defaultStageId?: string;
  onSaved: () => void;
}

export function DealForm({
  open,
  onOpenChange,
  deal,
  pipelineId,
  stages,
  defaultStageId,
  onSaved,
}: DealFormProps) {

  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [contactId, setContactId] = useState("");
  const [stageId, setStageId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [notes, setNotes] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [linkedConversation, setLinkedConversation] =
    useState<Conversation | null>(null);

  const [saving, setSaving] = useState(false);
  const [statusAction, setStatusAction] = useState<DealStatus | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset the form fields every time the sheet opens or its input
  // props change. This is a legitimate prop-driven sync; the rule is
  // over-cautious here, hence the block-level disable.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    if (deal) {
      setTitle(deal.title);
      setValue(String(deal.value ?? ""));
      setCurrency(deal.currency || "USD");
      // contact_id is nullable when the contact has been deleted
      // (migration 004: ON DELETE SET NULL). "" means "no selection".
      setContactId(deal.contact_id ?? "");
      setStageId(deal.stage_id);
      setAssignedTo(deal.assigned_to ?? "");
      setExpectedCloseDate(deal.expected_close_date ?? "");
      setNotes(deal.notes ?? "");
    } else {
      setTitle("");
      setValue("");
      setCurrency("USD");
      setContactId("");
      setStageId(defaultStageId || stages[0]?.id || "");
      setAssignedTo("");
      setExpectedCloseDate("");
      setNotes("");
    }
  }, [open, deal, defaultStageId, stages]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load supporting data once the sheet is open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const [cRes] = await Promise.all([
          contactsApi.list(),
          // TODO: profiles API when ready
        ]);
        if (cancelled) return;
        
        const contactsData = cRes.data?.data || cRes.data || [];
        setContacts(Array.isArray(contactsData) ? contactsData : []);
        setProfiles([]);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !contactId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkedConversation(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await conversationsApi.list();
        if (cancelled) return;
        
        const convs = res.data?.data || res.data || [];
        if (Array.isArray(convs)) {
          const linked = convs.find(c => c.contact_id === contactId);
          setLinkedConversation(linked || null);
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, contactId]);

  async function handleSave() {
    if (!title.trim() || !contactId || !stageId) {
      toast.error("Title, contact, and stage are required");
      return;
    }
    setSaving(true);

    const payload = {
      title: title.trim(),
      value: parseFloat(value) || 0,
      currency,
      contact_id: contactId,
      pipeline_id: pipelineId,
      stage_id: stageId,
      assigned_to: assignedTo || null,
      notes: notes.trim() || null,
      expected_close_date: expectedCloseDate || null,
    };

    if (deal) {
      try {
        await dealsApi.update(deal.id, payload);
      } catch (err) {
        toast.error("Failed to save deal");
        setSaving(false);
        return;
      }
    } else {
      try {
        await dealsApi.create({ ...payload, status: "open" });
      } catch (err) {
        toast.error("Failed to create deal");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success(deal ? "Deal updated" : "Deal created");
    onOpenChange(false);
    onSaved();
  }

  async function handleStatusChange(status: DealStatus) {
    if (!deal) return;
    setStatusAction(status);
    try {
      await dealsApi.update(deal.id, { status });
      setStatusAction(null);
      
      toast.success(
        status === "won" ? "Marked as won" : status === "lost" ? "Marked as lost" : "Deal reopened",
      );
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setStatusAction(null);
      toast.error("Failed to update deal status");
    }
  }

  async function handleDelete() {
    if (!deal) return;
    setDeleting(true);
    
    try {
      await dealsApi.delete(deal.id);
      toast.success("Deal deleted");
      setConfirmDelete(false);
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error("Failed to delete deal");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-theme-bg-card border-theme-border text-theme-text sm:max-w-lg w-full p-0 shadow-2xl"
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-theme-border p-4">
            <SheetTitle className="text-theme-text">
              {deal ? "Edit Deal" : "New Deal"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Deal title"
                className="border-theme-border bg-theme-bg-secondary text-theme-text focus-visible:ring-violet-500 placeholder:text-theme-text-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Contact</Label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="h-9 w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-2.5 text-sm text-theme-text outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              >
                <option value="" className="bg-theme-bg-card text-theme-text">Select a contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-theme-bg-card text-theme-text">
                    {c.name || c.phone}
                  </option>
                ))}
              </select>

              {linkedConversation && (
                <Link
                  href="/inbox"
                  className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md bg-violet-500/10 px-2 py-1 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-500/20"
                >
                  <MessageSquare className="h-3 w-3" />
                  Link to Conversation
                </Link>
              )}
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="grid gap-2">
                <Label className="text-theme-text-secondary">Value</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-theme-text-muted" />
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0"
                    className="border-theme-border bg-theme-bg-secondary pl-7 text-theme-text focus-visible:ring-violet-500 placeholder:text-theme-text-muted"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-theme-text-secondary">Currency</Label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-9 w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-2.5 text-sm text-theme-text outline-none focus:border-violet-500"
                >
                  <option value="USD" className="bg-theme-bg-card text-theme-text">USD</option>
                  <option value="EUR" className="bg-theme-bg-card text-theme-text">EUR</option>
                  <option value="GBP" className="bg-theme-bg-card text-theme-text">GBP</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Expected Close Date</Label>
              <Input
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="border-theme-border bg-theme-bg-secondary text-theme-text focus-visible:ring-violet-500"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Stage</Label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="h-9 w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-2.5 text-sm text-theme-text outline-none focus:border-violet-500"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-theme-bg-card text-theme-text">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Assigned To</Label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="h-9 w-full rounded-lg border border-theme-border bg-theme-bg-secondary px-2.5 text-sm text-theme-text outline-none focus:border-violet-500"
              >
                <option value="" className="bg-theme-bg-card text-theme-text">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id} className="bg-theme-bg-card text-theme-text">
                    {p.full_name || p.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label className="text-theme-text-secondary">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes..."
                className="min-h-[100px] border-theme-border bg-theme-bg-secondary text-theme-text focus-visible:ring-violet-500 placeholder:text-theme-text-muted"
              />
            </div>

            {deal && (
              <div className="space-y-2 rounded-lg border border-theme-border bg-theme-bg-secondary/50 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-theme-text-secondary">
                  Status
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => handleStatusChange("won")}
                    disabled={!!statusAction || deal.status === "won"}
                    className="flex-1 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {statusAction === "won" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Mark as Won
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStatusChange("lost")}
                    disabled={!!statusAction || deal.status === "lost"}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {statusAction === "lost" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" />
                        Mark as Lost
                      </>
                    )}
                  </Button>
                </div>
                {deal.status && deal.status !== "open" && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleStatusChange("open")}
                    disabled={!!statusAction}
                    className="w-full text-theme-text-secondary hover:text-theme-text focus:bg-theme-bg-hover"
                  >
                    Reopen deal
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-theme-border bg-theme-bg-secondary/80 p-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-theme-border bg-transparent text-theme-text-secondary hover:bg-theme-bg-hover hover:text-theme-text"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !title.trim() || !contactId || !stageId}
                className="flex-1 bg-violet-600 text-white hover:bg-violet-700"
              >
                {saving ? "Saving..." : deal ? "Save Changes" : "Create Deal"}
              </Button>
            </div>

            {deal &&
              (confirmDelete ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-red-500/20 dark:border-red-500/30 bg-red-500/5 dark:bg-red-500/10 px-3 py-2 text-xs">
                  <span className="text-red-600 dark:text-red-400 font-medium">Delete this deal?</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="rounded px-2 py-1 text-theme-text-secondary hover:bg-theme-bg-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? "Deleting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete Deal
                </button>
              ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

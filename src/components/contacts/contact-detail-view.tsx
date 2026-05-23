'use client';

import { useState, useEffect, useCallback } from 'react';
import { contacts as contactsApi, tags as tagsApi, contactNotes as contactNotesApi, customFields as customFieldsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Contact, Tag, ContactTag, ContactNote, CustomField, ContactCustomValue, Deal, AuditUser } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Phone,
  Mail,
  Building2,
  Copy,
  Check,
  Loader2,
  Plus,
  Trash2,
  Save,
  X,
  DollarSign,
  UserCircle,
  Clock,
} from 'lucide-react';

interface ContactDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string | null;
  onUpdated: () => void;
}

export function ContactDetailView({
  open,
  onOpenChange,
  contactId,
  onUpdated,
}: ContactDetailViewProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Details tab
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);

  // Tags tab
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [contactTagIds, setContactTagIds] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  // Notes tab
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Custom fields tab
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [savingCustom, setSavingCustom] = useState(false);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Deals tab
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);

    try {
      const res = await contactsApi.get(contactId);
      const data = res.data?.data || res.data;
      if (data) {
        setContact(data);
        setEditName(data.name ?? '');
        setEditPhone(data.phone);
        setEditEmail(data.email ?? '');
        setEditCompany(data.company ?? '');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [contactId]);

  const fetchTags = useCallback(async () => {
    if (!contactId) return;

    try {
      const [tagsRes, contactTagsRes] = await Promise.all([
        tagsApi.list(),
        contactsApi.getTags(contactId),
      ]);

      const tagsData = tagsRes.data?.data || tagsRes.data || [];
      if (Array.isArray(tagsData)) setAllTags(tagsData);

      const contactTagsData = contactTagsRes.data?.data || contactTagsRes.data || [];
      if (Array.isArray(contactTagsData)) {
        setContactTagIds(contactTagsData.map((t) => t.id));
      }
    } catch (err) {
      console.error(err);
    }
  }, [contactId]);

  const fetchNotes = useCallback(async () => {
    if (!contactId) return;
    setLoadingNotes(true);

    try {
      const res = await contactNotesApi.list(contactId);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) setNotes(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingNotes(false);
  }, [contactId]);

  const fetchCustomFields = useCallback(async () => {
    if (!contactId) return;
    setLoadingCustom(true);

    try {
      const [fieldsRes, valuesRes] = await Promise.all([
        customFieldsApi.list(),
        contactsApi.getCustomValues(contactId),
      ]);

      const fieldsData = fieldsRes.data?.data || fieldsRes.data || [];
      if (Array.isArray(fieldsData)) setCustomFields(fieldsData);

      const valuesData = valuesRes.data?.data || valuesRes.data || [];
      if (Array.isArray(valuesData)) {
        const map: Record<string, string> = {};
        valuesData.forEach((v) => {
          map[v.custom_field_id] = v.value ?? '';
        });
        setCustomValues(map);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingCustom(false);
  }, [contactId]);

  const fetchDeals = useCallback(async () => {
    if (!contactId) return;
    setLoadingDeals(true);
    
    try {
      const res = await contactsApi.getDeals(contactId);
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) setDeals(data as Deal[]);
    } catch (err) {
      console.error(err);
    }
    setLoadingDeals(false);
  }, [contactId]);

  useEffect(() => {
    if (open && contactId) {
      fetchContact();
      fetchTags();
      fetchNotes();
      fetchCustomFields();
      fetchDeals();
    }
  }, [open, contactId, fetchContact, fetchTags, fetchNotes, fetchCustomFields, fetchDeals]);

  async function copyPhone() {
    if (!contact) return;
    await navigator.clipboard.writeText(contact.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  async function saveDetails() {
    if (!contactId || !editPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSavingDetails(true);
    try {
      await contactsApi.update(contactId, {
        name: editName.trim() || undefined,
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        company: editCompany.trim() || undefined,
      });

      toast.success('Contact updated');
      fetchContact();
      onUpdated();
    } catch {
      toast.error('Failed to update contact');
    }
    setSavingDetails(false);
  }

  async function toggleTag(tagId: string) {
    if (!contactId) return;
    setSavingTags(true);

    const isSelected = contactTagIds.includes(tagId);
    let newTagIds = [...contactTagIds];
    
    if (isSelected) {
      newTagIds = newTagIds.filter((id) => id !== tagId);
    } else {
      newTagIds.push(tagId);
    }

    try {
      await contactsApi.syncTags(contactId, newTagIds);
      setContactTagIds(newTagIds);
      onUpdated();
    } catch {
      toast.error('Failed to update tags');
    }
    
    setSavingTags(false);
  }

  async function addNote() {
    if (!contactId || !newNote.trim()) return;
    setSavingNote(true);

    try {
      await contactNotesApi.create(contactId, { note_text: newNote.trim() });
      setNewNote('');
      fetchNotes();
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
    
    setSavingNote(false);
  }

  async function deleteNote(noteId: string) {
    try {
      await contactNotesApi.delete(contactId!, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete note');
    }
  }

  async function saveCustomFields() {
    if (!contactId) return;
    setSavingCustom(true);

    try {
      const rows = Object.entries(customValues)
        .filter(([, val]) => val.trim())
        .map(([fieldId, val]) => ({
          custom_field_id: fieldId,
          value: val.trim(),
        }));

      await contactsApi.updateCustomValues(contactId, rows);
      toast.success('Custom fields saved');
    } catch {
      toast.error('Failed to save custom fields');
    }
    setSavingCustom(false);
  }

  function getInitials(name?: string | null) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-theme-bg-card border-theme-border text-theme-text sm:max-w-lg w-full p-0"
      >
        {loading || !contact ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-4 border-b border-theme-border/50">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 bg-theme-bg-secondary border border-theme-border">
                  <AvatarFallback className="bg-violet-500/10 text-violet-400 text-sm font-medium">
                    {getInitials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-theme-text truncate">
                    {contact.name || 'Unknown'}
                  </SheetTitle>
                  <SheetDescription className="text-theme-text-muted text-xs mt-0.5">
                    Contact details
                  </SheetDescription>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-theme-text-secondary">
                    <button
                      onClick={copyPhone}
                      className="flex items-center gap-1 hover:text-violet-400 transition-colors cursor-pointer"
                    >
                      <Phone className="size-3" />
                      {contact.phone}
                      {copiedPhone ? (
                        <Check className="size-3 text-violet-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                    {contact.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3" />
                        {contact.email}
                      </span>
                    )}
                    {contact.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {contact.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Tabs */}
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              <TabsList className="bg-theme-bg-secondary/50 border-b border-theme-border mx-4 mt-3">
                <TabsTrigger
                  value="details"
                  className="data-active:bg-theme-bg-secondary data-active:text-violet-400 text-theme-text-secondary"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="data-active:bg-theme-bg-secondary data-active:text-violet-400 text-theme-text-secondary"
                >
                  Tags
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="data-active:bg-theme-bg-secondary data-active:text-violet-400 text-theme-text-secondary"
                >
                  Notes
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="data-active:bg-theme-bg-secondary data-active:text-violet-400 text-theme-text-secondary"
                >
                  Custom Fields
                </TabsTrigger>
                <TabsTrigger
                  value="deals"
                  className="data-active:bg-theme-bg-secondary data-active:text-violet-400 text-theme-text-secondary"
                >
                  Deals
                </TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-theme-text-secondary text-xs">Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-theme-bg-secondary border-theme-border text-theme-text h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-theme-text-secondary text-xs">
                      Phone <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="bg-theme-bg-secondary border-theme-border text-theme-text h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-theme-text-secondary text-xs">Email</Label>
                    <Input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-theme-bg-secondary border-theme-border text-theme-text h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-theme-text-secondary text-xs">Company</Label>
                    <Input
                      value={editCompany}
                      onChange={(e) => setEditCompany(e.target.value)}
                      className="bg-theme-bg-secondary border-theme-border text-theme-text h-8 text-sm"
                    />
                  </div>
                  <Button
                    onClick={saveDetails}
                    disabled={savingDetails}
                    className="bg-violet-600 hover:bg-violet-700 text-white w-full"
                    size="sm"
                  >
                    {savingDetails ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags" className="flex-1 overflow-y-auto px-4 py-3">
                <div className="space-y-3">
                  <p className="text-xs text-theme-text-muted">
                    Click a tag to add or remove it from this contact.
                  </p>
                  {allTags.length === 0 ? (
                    <p className="text-sm text-theme-text-muted">
                      No tags available. Create tags in Settings.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((tag) => {
                        const selected = contactTagIds.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            disabled={savingTags}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                              selected
                                ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-theme-bg-card'
                                : 'opacity-50 hover:opacity-80'
                            }`}
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color,
                            }}
                          >
                            {selected && <Check className="size-3 mr-1" />}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Notes Tab */}
              <TabsContent value="notes" className="flex-1 flex flex-col min-h-0 px-4 py-3">
                <div className="space-y-2 mb-3">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a note..."
                    className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50 min-h-[60px] text-sm resize-none"
                  />
                  <Button
                    onClick={addNote}
                    disabled={!newNote.trim() || savingNote}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    size="sm"
                  >
                    {savingNote ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    Add Note
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                  {loadingNotes ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="size-5 animate-spin text-theme-text-muted" />
                    </div>
                  ) : notes.length === 0 ? (
                    <p className="text-sm text-theme-text-muted text-center py-8">
                      No notes yet.
                    </p>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg bg-theme-bg-secondary/50 border border-theme-border/50 p-3 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap flex-1">
                            {note.note_text}
                          </p>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="opacity-0 group-hover:opacity-100 text-theme-text-muted hover:text-red-400 transition-all cursor-pointer shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-theme-text-muted mt-1.5">
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Custom Fields Tab */}
              <TabsContent value="custom" className="flex-1 overflow-y-auto px-4 py-3">
                {loadingCustom ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-theme-text-muted" />
                  </div>
                ) : customFields.length === 0 ? (
                  <p className="text-sm text-theme-text-muted text-center py-8">
                    No custom fields defined. Create them in Settings.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <Label className="text-theme-text-secondary text-xs capitalize">
                          {field.field_name}
                        </Label>
                        <Input
                          value={customValues[field.id] ?? ''}
                          onChange={(e) =>
                            setCustomValues((prev) => ({
                              ...prev,
                              [field.id]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${field.field_name}...`}
                          className="bg-theme-bg-secondary border-theme-border text-theme-text h-8 text-sm placeholder:text-theme-text-muted/50"
                        />
                      </div>
                    ))}
                    <Button
                      onClick={saveCustomFields}
                      disabled={savingCustom}
                      className="bg-violet-600 hover:bg-violet-700 text-white w-full"
                      size="sm"
                    >
                      {savingCustom ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Save className="size-3.5" />
                      )}
                      Save Custom Fields
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Deals Tab */}
              <TabsContent value="deals" className="flex-1 overflow-y-auto px-4 py-3">
                {loadingDeals ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-violet-500" />
                  </div>
                ) : deals.length === 0 ? (
                  <p className="text-xs text-theme-text-muted">No deals yet</p>
                ) : (
                  <div className="space-y-2">
                    {deals.map((deal) => (
                      <div
                        key={deal.id}
                        className="rounded-lg border border-theme-border bg-theme-bg-secondary/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-theme-text">
                            {deal.title}
                          </p>
                          {deal.stage && (
                            <span
                              className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: `${deal.stage.color}20`,
                                color: deal.stage.color,
                              }}
                            >
                              {deal.stage.name}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs text-theme-text-secondary">
                          <span className="flex items-center gap-1">
                            <DollarSign className="size-3" />
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: deal.currency || 'USD',
                              maximumFractionDigits: 0,
                            }).format(Number(deal.value || 0))}
                          </span>
                          {deal.status && deal.status !== 'open' && (
                            <span
                              className={
                                deal.status === 'won'
                                  ? 'text-violet-400'
                                  : 'text-red-400'
                              }
                            >
                              {deal.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Audit Trail Footer */}
            {(contact.creator || contact.updater) && (
              <div className="border-t border-theme-border/50 px-4 py-3 space-y-2.5 bg-theme-bg-secondary/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-theme-text-muted">
                  Activity Log
                </p>
                {contact.creator && (
                  <div className="flex items-start gap-2">
                    <UserCircle className="size-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-theme-text-secondary">
                        <span className="text-theme-text font-medium">
                          Created by
                        </span>{' '}
                        {contact.creator.full_name || contact.creator.email}
                      </p>
                      <p className="text-[10px] text-theme-text-muted flex items-center gap-1 mt-0.5">
                        <Clock className="size-2.5" />
                        {new Date(contact.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {contact.updater && contact.updated_by && (
                  <div className="flex items-start gap-2">
                    <UserCircle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-theme-text-secondary">
                        <span className="text-theme-text font-medium">
                          Last updated by
                        </span>{' '}
                        {contact.updater.full_name || contact.updater.email}
                      </p>
                      {contact.updated_at && (
                        <p className="text-[10px] text-theme-text-muted flex items-center gap-1 mt-0.5">
                          <Clock className="size-2.5" />
                          {new Date(contact.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

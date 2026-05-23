'use client';

import { useState, useEffect } from 'react';
import { contacts as contactsApi, tags as tagsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Contact, Tag, ContactTag } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  contactTags?: ContactTag[];
  onSaved: () => void;
}

export function ContactForm({
  open,
  onOpenChange,
  contact,
  contactTags = [],
  onSaved,
}: ContactFormProps) {
  const isEdit = !!contact;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    if (open) {
      setName(contact?.name ?? '');
      setPhone(contact?.phone ?? '');
      setEmail(contact?.email ?? '');
      setCompany(contact?.company ?? '');
      setSelectedTagIds(contactTags.map((ct) => ct.tag_id));
      fetchTags();
    }
  }, [open, contact]);

  async function fetchTags() {
    setLoadingTags(true);
    try {
      const res = await tagsApi.list();
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data)) setTags(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingTags(false);
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    setSaving(true);

    try {
      let contactId = contact?.id;

      if (isEdit && contactId) {
        await contactsApi.update(contactId, {
          name: name.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          company: company.trim() || undefined,
        });
      } else {
        const res = await contactsApi.create({
          name: name.trim() || undefined,
          phone: phone.trim(),
          email: email.trim() || undefined,
          company: company.trim() || undefined,
        });
        const data = res.data?.data || res.data;
        if (!data?.id) throw new Error('Failed to create contact');
        contactId = data.id;
      }

      // Sync tags
      if (contactId) {
        await contactsApi.syncTags(contactId, selectedTagIds);
      }

      toast.success(isEdit ? 'Contact updated' : 'Contact created');
      onOpenChange(false);
      onSaved();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save contact';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-theme-bg-card border-theme-border text-theme-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-theme-text">
            {isEdit ? 'Edit Contact' : 'Add Contact'}
          </DialogTitle>
          <DialogDescription className="text-theme-text-muted">
            {isEdit
              ? 'Update the contact details below.'
              : 'Fill in the details to create a new contact.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cf-name" className="text-theme-text-secondary">
              Name
            </Label>
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-phone" className="text-theme-text-secondary">
              Phone <span className="text-red-400">*</span>
            </Label>
            <Input
              id="cf-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 234 567 8900"
              className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
            />
            <p className="text-xs text-theme-text-muted">
              Include country code, e.g. +1 for US
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-email" className="text-theme-text-secondary">
              Email
            </Label>
            <Input
              id="cf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cf-company" className="text-theme-text-secondary">
              Company
            </Label>
            <Input
              id="cf-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-theme-text-secondary">Tags</Label>
            {loadingTags ? (
              <div className="flex items-center gap-2 text-theme-text-muted text-sm">
                <Loader2 className="size-3 animate-spin" />
                Loading tags...
              </div>
            ) : tags.length === 0 ? (
              <p className="text-xs text-theme-text-muted">
                No tags available. Create tags in Settings.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors cursor-pointer ${
                        selected
                          ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-theme-bg-card'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-theme-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-theme-border text-theme-text hover:bg-theme-bg-hover"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

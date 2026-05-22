'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { messageTemplates as templatesApi, whatsapp as whatsappApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MessageTemplate } from '@/types';

const CATEGORIES = ['Marketing', 'Utility', 'Authentication'] as const;
const HEADER_TYPES = ['text', 'image', 'video', 'document'] as const;

const categoryColors: Record<string, string> = {
  Marketing: 'bg-purple-500/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-600/30',
  Utility: 'bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:border-blue-600/30',
  Authentication: 'bg-amber-500/10 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-600/30',
};

const statusColors: Record<string, string> = {
  Draft: 'bg-slate-500/10 dark:bg-slate-600/20 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-slate-600/30',
  Pending: 'bg-yellow-500/10 dark:bg-yellow-600/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-600/30',
  Approved: 'bg-violet-500/10 dark:bg-violet-600/20 text-violet-600 dark:text-violet-400 border-violet-500/20 dark:border-violet-600/30',
  Rejected: 'bg-red-500/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border-red-500/20 dark:border-red-600/30',
};

interface TemplateFormData {
  name: string;
  category: MessageTemplate['category'];
  language: string;
  body_text: string;
  header_type: string;
  footer_text: string;
}

// Meta's language codes are exact — "en" and "en_US" are distinct and a
// template approved under one will be rejected if you send with the other
// (Graph API error #132001 "Template name does not exist in the
// translation"). Default to en_US to match the DB default on
// message_templates.language and the broadcasts sender's fallback.
const emptyForm: TemplateFormData = {
  name: '',
  category: 'Marketing',
  language: 'en_US',
  body_text: '',
  header_type: '',
  footer_text: '',
};

// Common Meta template language codes. The field still accepts any
// string — this just offers autocomplete for the usual suspects. Full
// list: https://developers.facebook.com/docs/whatsapp/api/messages/message-templates#supported-languages
const COMMON_LANGUAGE_CODES = [
  'en_US',
  'en_GB',
  'en',
  'es',
  'es_ES',
  'es_MX',
  'fr',
  'fr_FR',
  'de',
  'it',
  'pt_BR',
  'pt_PT',
  'nl',
  'pl',
  'ru',
  'tr',
  'lt',
];

export function TemplateManager() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState<TemplateFormData>(emptyForm);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchTemplates(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id]);

  async function fetchTemplates(_userId: string) {
    try {
      setLoading(true);
      const res = await templatesApi.list();
      const data = res.data?.data || res.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!form.body_text.trim()) {
      toast.error('Body text is required');
      return;
    }

    try {
      setSaving(true);
      await templatesApi.create({
        name: form.name.trim(),
        category: form.category,
        language: form.language.trim() || 'en_US',
        body_text: form.body_text.trim(),
        header_type: form.header_type || null,
        footer_text: form.footer_text.trim() || null,
      });

      toast.success('Template created successfully');
      setDialogOpen(false);
      setForm(emptyForm);
      if (user) await fetchTemplates(user.id);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to create template');
    } finally {
      setSaving(false);
    }
  }

  /**
   * Pull approved templates from Meta and upsert them into the local
   * catalog. After this runs, every local row is guaranteed to match
   * something Meta will actually accept on send — stops users getting
   * stuck on error #132001 "Template name does not exist".
   */
  async function handleSyncFromMeta() {
    if (!user) return;
    setSyncing(true);
    try {
      const res = await whatsappApi.syncTemplates();
      const data = res.data;
      toast.success(
        `Synced ${data.total || 0} template${data.total === 1 ? '' : 's'} from Meta` +
          (data.inserted || data.updated
            ? ` (${data.inserted || 0} new, ${data.updated || 0} updated)`
            : ''),
      );
      await fetchTemplates(user.id);
    } catch (err) {
      console.error('Template sync error:', err);
      toast.error(
        err instanceof Error ? err.message : 'Failed to sync templates',
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await templatesApi.delete(id);
      toast.success('Template deleted');
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete template');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-theme-text">Message Templates</h2>
          <p className="text-sm text-theme-text-muted">
            Create and manage your WhatsApp message templates. Meta requires
            every template to be approved in the WhatsApp Manager before it can
            be sent — use &quot;Sync from Meta&quot; to pull your approved list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSyncFromMeta}
            disabled={syncing}
            className="border-theme-border bg-transparent text-theme-text hover:bg-theme-bg-hover"
            title="Pull approved templates from your Meta WhatsApp Business Account"
          >
            <RefreshCw
              className={`size-4 ${syncing ? 'animate-spin' : ''}`}
            />
            {syncing ? 'Syncing…' : 'Sync from Meta'}
          </Button>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setDialogOpen(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="size-4" />
            New Template
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card className="bg-theme-bg-card border-theme-border shadow-sm ring-0 ring-transparent">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-theme-text-muted text-sm">No templates yet.</p>
            <p className="text-theme-text-muted text-xs mt-1">Create your first message template to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id} className="bg-theme-bg-card border-theme-border shadow-sm ring-0 ring-transparent">
              <CardContent className="flex items-start justify-between pt-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-theme-text">{template.name}</h3>
                    <Badge
                      className={`text-xs border ${categoryColors[template.category] || ''}`}
                    >
                      {template.category}
                    </Badge>
                    <Badge
                      className={`text-xs border ${statusColors[template.status || 'Draft'] || ''}`}
                    >
                      {template.status || 'Draft'}
                    </Badge>
                    {template.language && (
                      <span className="text-xs text-theme-text-muted uppercase">{template.language}</span>
                    )}
                  </div>
                  <p className="text-sm text-theme-text-muted line-clamp-2">{template.body_text}</p>
                  {template.footer_text && (
                    <p className="text-xs text-theme-text-muted italic">{template.footer_text}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(template.id)}
                  className="text-theme-text-muted hover:text-red-400 hover:bg-red-950/30 shrink-0 ml-2"
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-theme-bg-card border-theme-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-theme-text">New Message Template</DialogTitle>
            <DialogDescription className="text-theme-text-muted">
              Create a new WhatsApp message template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Template Name</Label>
              <Input
                placeholder="e.g. order_confirmation"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-theme-text-secondary">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) =>
                    setForm({ ...form, category: val as MessageTemplate['category'] })
                  }
                >
                  <SelectTrigger className="w-full bg-theme-bg-secondary border-theme-border text-theme-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-theme-bg-card border-theme-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-theme-text focus:bg-theme-bg-hover focus:text-theme-text">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-theme-text-secondary">Language</Label>
                <Input
                  list="template-language-codes"
                  placeholder="en_US"
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
                />
                <datalist id="template-language-codes">
                  {COMMON_LANGUAGE_CODES.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
                <p className="text-[11px] text-theme-text-muted">
                  Must match the exact language code the template is approved
                  under on Meta — e.g. <code>en_US</code> and <code>en</code>{' '}
                  are distinct.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Header Type</Label>
              <Select
                value={form.header_type}
                onValueChange={(val) => setForm({ ...form, header_type: val || '' })}
              >
                <SelectTrigger className="w-full bg-theme-bg-secondary border-theme-border text-theme-text">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-theme-bg-card border-theme-border">
                  <SelectItem value="none" className="text-theme-text focus:bg-theme-bg-hover focus:text-theme-text">
                    None
                  </SelectItem>
                  {HEADER_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-theme-text focus:bg-theme-bg-hover focus:text-theme-text">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Body Text</Label>
              <Textarea
                placeholder="Enter your template message body. Use {{1}}, {{2}} for variables."
                value={form.body_text}
                onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                rows={4}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-theme-text-secondary">Footer Text</Label>
              <Input
                placeholder="Optional footer text"
                value={form.footer_text}
                onChange={(e) => setForm({ ...form, footer_text: e.target.value })}
                className="bg-theme-bg-secondary border-theme-border text-theme-text placeholder:text-theme-text-muted/50"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-theme-border pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-theme-border text-theme-text hover:bg-theme-bg-hover"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

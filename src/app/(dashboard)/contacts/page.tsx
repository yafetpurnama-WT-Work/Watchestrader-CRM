'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResizableColumns } from '@/hooks/use-resizable-columns';
import { contacts as contactsApi, tags as tagsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { Contact, Tag, ContactTag } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ContactForm } from '@/components/contacts/contact-form';
import { ContactDetailView } from '@/components/contacts/contact-detail-view';
import { ImportModal } from '@/components/contacts/import-modal';
import { TablePagination } from '@/components/ui/table-pagination';



interface ContactWithTags extends Contact {
  tags?: Tag[];
}

const CONTACTS_COLUMN_COUNT = 7;

export default function ContactsPage() {

  const [contacts, setContacts] = useState<ContactWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Sort
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [editContactTags, setEditContactTags] = useState<ContactTag[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailContactId, setDetailContactId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Resizable columns
  const {
    initialized: colsReady,
    isResizing,
    tableRef,
    getThStyle,
    getTdStyle,
    renderHandle,
  } = useResizableColumns({
    columnCount: CONTACTS_COLUMN_COUNT,
    minWidth: 60,
    storageKey: 'contacts-table',
  });

  // All tags for display
  const [tagsMap, setTagsMap] = useState<Record<string, Tag>>({});

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagsApi.list();
      const data = res.data?.data || res.data || [];
      const map: Record<string, Tag> = {};
      (Array.isArray(data) ? data : []).forEach((t: Tag) => (map[t.id] = t));
      setTagsMap(map);
    } catch { /* ignore */ }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), per_page: String(perPage) };
      if (search.trim()) params.search = search.trim();
      if (sortField) {
        params.sort = sortField;
        params.direction = sortDirection;
      }

      const res = await contactsApi.list(params);
      const paginated = res.data;
      const data: ContactWithTags[] = paginated?.data || [];
      setTotalCount(paginated?.total ?? data.length);
      setContacts(data);
    } catch {
      toast.error('Failed to load contacts');
    }
    setLoading(false);
  }, [page, search, sortField, sortDirection, perPage]);

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
        ? <ArrowUp className="size-3.5 rt-sort-icon rt-sort-active" />
        : <ArrowDown className="size-3.5 rt-sort-icon rt-sort-active" />;
    }
    return <ArrowUpDown className="size-3.5 rt-sort-icon" />;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContacts();
  }, [fetchContacts]);

  function openAddForm() {
    setEditContact(null);
    setEditContactTags([]);
    setFormOpen(true);
  }

  async function openEditForm(contact: ContactWithTags) {
    const tagEntries: ContactTag[] = (contact.tags || []).map((t) => ({ id: `${contact.id}-${t.id}`, contact_id: contact.id, tag_id: t.id }));
    setEditContact(contact);
    setEditContactTags(tagEntries);
    setFormOpen(true);
  }

  function openDetail(contactId: string) {
    setDetailContactId(contactId);
    setDetailOpen(true);
  }

  function confirmDelete(contact: Contact) {
    setDeleteTarget(contact);
    setDeleteConfirmOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contactsApi.delete(deleteTarget.id);
      toast.success('Contact deleted');
      fetchContacts();
    } catch {
      toast.error('Failed to delete contact');
    }
    setDeleting(false);
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 px-2">
        <div>
          <h1 className="text-2xl font-bold text-theme-text">Detail Contacts</h1>
          <p className="text-sm text-theme-text-muted mt-1">
            Manage your detail contact list. {totalCount > 0 && `${totalCount} total contacts data.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-theme-border text-theme-text-secondary hover:bg-theme-bg-hover"
          >
            <Upload className="size-4" />
            Import
          </Button>
          <Button
            onClick={openAddForm}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="size-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-theme-text-muted" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder="Search by name, phone, or email..."
          className="w-full rounded-xl border border-theme-border bg-theme-bg-card py-2.5 pl-10 pr-4 text-sm text-theme-text placeholder-theme-text-muted focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          // className="w-full h-8 pl-8 rounded-lg border border-theme-border text-sm text-theme-text placeholder-theme-text-muted/50 focus:outline-none focus:ring-1 focus:ring-violet-500"
          // bg-theme-bg-secondary = Grey 50 in light mode, and Grey 800 in dark mode, both with 30% opacity
        />
      </div>

      {/* Table */}
      <div className="rt-wrapper">
        <table ref={tableRef} className={`rt-table w-full text-sm${colsReady ? ' rt-fixed' : ''}`}>
          <thead>
            <tr>
              <th className="text-left rt-sortable" style={getThStyle(0)} onClick={() => handleSort('name')}>
                <span className="flex items-center gap-1">Name {renderSortIcon('name')}</span>
                {renderHandle(0)}
              </th>
              <th className="text-left rt-sortable" style={getThStyle(1)} onClick={() => handleSort('phone')}>
                <span className="flex items-center gap-1">Phone {renderSortIcon('phone')}</span>
                {renderHandle(1)}
              </th>
              <th className="text-left hidden md:table-cell rt-sortable" style={getThStyle(2)} onClick={() => handleSort('email')}>
                <span className="flex items-center gap-1">Email {renderSortIcon('email')}</span>
                {renderHandle(2)}
              </th>
              <th className="text-left hidden lg:table-cell rt-sortable" style={getThStyle(3)} onClick={() => handleSort('company')}>
                <span className="flex items-center gap-1">Company {renderSortIcon('company')}</span>
                {renderHandle(3)}
              </th>
              <th className="text-left hidden md:table-cell" style={getThStyle(4)}>
                <span className="flex items-center gap-1">Tags</span>
                {renderHandle(4)}
              </th>
              <th className="text-left hidden lg:table-cell rt-sortable" style={getThStyle(5)} onClick={() => handleSort('created_at')}>
                <span className="flex items-center gap-1">Created {renderSortIcon('created_at')}</span>
                {renderHandle(5)}
              </th>
              <th className="text-left w-12" style={getThStyle(6)} />
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-6 animate-spin text-violet-500" />
                    <p className="text-sm text-theme-text-muted">Loading contacts...</p>
                  </div>
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="size-8 text-theme-text-muted" />
                    <p className="text-sm text-theme-text-muted">
                      {search ? 'No contacts match your search.' : 'No contacts yet.'}
                    </p>
                    {!search && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openAddForm}
                        className="mt-2 border-theme-border text-theme-text-secondary hover:bg-theme-bg-hover"
                      >
                        <Plus className="size-3.5" />
                        Add your first contact
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className="transition-colors hover:bg-theme-bg-hover/50 cursor-pointer"
                  onClick={() => !isResizing && openDetail(contact.id)}
                >
                  <td className="px-3 py-2.5 text-theme-text font-medium rt-cell" style={getTdStyle(0)}>
                    {contact.name || <span className="text-theme-text-muted italic">Unnamed</span>}
                  </td>
                  <td className="px-3 py-2.5 text-theme-text-secondary font-mono text-xs rt-cell" style={getTdStyle(1)}>
                    {contact.phone}
                  </td>
                  <td className="px-3 py-2.5 text-theme-text-secondary text-sm hidden md:table-cell rt-cell" style={getTdStyle(2)}>
                    {contact.email || <span className="text-theme-text-muted">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-theme-text-secondary text-sm hidden lg:table-cell rt-cell" style={getTdStyle(3)}>
                    {contact.company || <span className="text-theme-text-muted">-</span>}
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell" style={getTdStyle(4)}>
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {contact.tags && contact.tags.length > 0 ? (
                        contact.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
                            style={{
                              backgroundColor: tag.color + '20',
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-theme-text-muted text-xs">-</span>
                      )}
                      {contact.tags && contact.tags.length > 3 && (
                        <span className="text-[10px] text-theme-text-muted shrink-0">
                          +{contact.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-theme-text-muted text-xs hidden lg:table-cell rt-cell" style={getTdStyle(5)}>
                    {new Date(contact.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-2.5" style={getTdStyle(6)}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-theme-text-secondary hover:text-theme-text"
                            onClick={(e) => e.stopPropagation()}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-theme-bg-card border-theme-border"
                      >
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditForm(contact);
                          }}
                          className="text-theme-text-secondary focus:bg-theme-bg-hover focus:text-theme-text"
                        >
                          <Pencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-theme-border" />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(contact);
                          }}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        totalItems={totalCount}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
      />

      {/* Contact Form Dialog */}
      <ContactForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contact={editContact}
        contactTags={editContactTags}
        onSaved={() => {
          fetchContacts();
          fetchTags();
        }}
      />

      {/* Contact Detail Sheet */}
      <ContactDetailView
        open={detailOpen}
        onOpenChange={setDetailOpen}
        contactId={detailContactId}
        onUpdated={fetchContacts}
      />

      {/* Import Modal */}
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={fetchContacts}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-theme-bg-card border-theme-border text-theme-text sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-theme-text">Delete Contact</DialogTitle>
            <DialogDescription className="text-theme-text-muted">
              Are you sure you want to delete{' '}
              <span className="text-theme-text font-medium">
                {deleteTarget?.name || deleteTarget?.phone}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t border-theme-border pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="border-theme-border text-theme-text hover:bg-theme-bg-hover"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

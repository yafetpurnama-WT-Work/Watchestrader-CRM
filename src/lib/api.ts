const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

/**
 * Core fetch wrapper for Laravel API calls.
 * Automatically attaches auth token from cookie.
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(json.message || 'Request failed', res.status, json)
  }

  return json
}

/**
 * Fetch without Content-Type (for FormData uploads)
 */
async function apiFetchMultipart<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers })
  const json = await res.json()
  if (!res.ok) throw new ApiError(json.message || 'Request failed', res.status, json)
  return json
}

function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function setAuthToken(token: string): void {
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
}

export function removeAuthToken(): void {
  document.cookie = 'auth_token=; path=/; max-age=0'
}

export class ApiError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Helper to build query strings
function qs(params?: Record<string, any>): string {
  if (!params) return ''
  const filtered = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  return filtered.length ? '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])) : ''
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const auth = {
  register: (data: { full_name: string; email: string; password: string; password_confirmation: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch('/auth/me'),

  updateProfile: (data: { full_name?: string; avatar_url?: string; email?: string }) =>
    apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    apiFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify(data) }),

  revokeAll: () =>
    apiFetch('/auth/revoke-all', { method: 'POST' }),
}

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contacts = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/contacts${qs(params)}`),

  create: (data: any) =>
    apiFetch('/contacts', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/contacts/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/contacts/${id}`, { method: 'DELETE' }),

  import: (data: { contacts: any[] }) =>
    apiFetch('/contacts/import', { method: 'POST', body: JSON.stringify(data) }),

  // Sub-resources
  getTags: (contactId: string) =>
    apiFetch(`/contacts/${contactId}/tags`),

  syncTags: (contactId: string, tagIds: string[]) =>
    apiFetch(`/contacts/${contactId}/tags`, { method: 'POST', body: JSON.stringify({ tag_ids: tagIds }) }),

  getCustomValues: (contactId: string) =>
    apiFetch(`/contacts/${contactId}/custom-values`),

  updateCustomValues: (contactId: string, values: { custom_field_id: string; value: string }[]) =>
    apiFetch(`/contacts/${contactId}/custom-values`, { method: 'PUT', body: JSON.stringify({ values }) }),

  getDeals: (contactId: string) =>
    apiFetch(`/contacts/${contactId}/deals`),
}

// ─── Contact Notes ───────────────────────────────────────────────────────────

export const contactNotes = {
  list: (contactId: string) =>
    apiFetch(`/contacts/${contactId}/notes`),

  create: (contactId: string, data: { note_text: string }) =>
    apiFetch(`/contacts/${contactId}/notes`, { method: 'POST', body: JSON.stringify(data) }),

  delete: (contactId: string, noteId: string) =>
    apiFetch(`/contacts/${contactId}/notes/${noteId}`, { method: 'DELETE' }),
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export const tags = {
  list: () => apiFetch('/tags'),

  create: (data: { name: string; color?: string }) =>
    apiFetch('/tags', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: { name?: string; color?: string }) =>
    apiFetch(`/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/tags/${id}`, { method: 'DELETE' }),
}

// ─── Custom Fields ───────────────────────────────────────────────────────────

export const customFields = {
  list: () => apiFetch('/custom-fields'),

  create: (data: { field_name: string; field_type: string; field_options?: string[] }) =>
    apiFetch('/custom-fields', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/custom-fields/${id}`, { method: 'DELETE' }),
}

// ─── Conversations ───────────────────────────────────────────────────────────

export const conversations = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/conversations${qs(params)}`),

  get: (id: string) =>
    apiFetch(`/conversations/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/conversations/${id}`, { method: 'DELETE' }),
}

// ─── Messages ────────────────────────────────────────────────────────────────

export const messages = {
  list: (conversationId: string, params?: Record<string, string>) =>
    apiFetch(`/conversations/${conversationId}/messages${qs(params)}`),

  send: (conversationId: string, data: any) =>
    apiFetch(`/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(data) }),

  update: (conversationId: string, messageId: string, data: any) =>
    apiFetch(`/conversations/${conversationId}/messages/${messageId}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ─── Message Templates ──────────────────────────────────────────────────────

export const messageTemplates = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/message-templates${qs(params)}`),

  create: (data: any) =>
    apiFetch('/message-templates', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/message-templates/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/message-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/message-templates/${id}`, { method: 'DELETE' }),
}

// ─── WhatsApp Config ─────────────────────────────────────────────────────────

export const whatsappConfig = {
  get: () => apiFetch('/whatsapp-config'),

  save: (data: any) =>
    apiFetch('/whatsapp-config', { method: 'POST', body: JSON.stringify(data) }),

  delete: () =>
    apiFetch('/whatsapp-config', { method: 'DELETE' }),
}

// ─── WhatsApp Messaging ─────────────────────────────────────────────────────

export const whatsapp = {
  send: (data: { conversation_id: string; content_type: string; content_text?: string; media_url?: string; template_name?: string; reply_to_message_id?: string }) =>
    apiFetch('/whatsapp/send', { method: 'POST', body: JSON.stringify(data) }),

  react: (data: { message_id: string; conversation_id: string; emoji: string }) =>
    apiFetch('/whatsapp/react', { method: 'POST', body: JSON.stringify(data) }),

  broadcast: (broadcastId: string) =>
    apiFetch('/whatsapp/broadcast', { method: 'POST', body: JSON.stringify({ broadcast_id: broadcastId }) }),

  syncTemplates: () =>
    apiFetch('/whatsapp/templates/sync', { method: 'POST' }),

  getMedia: (mediaId: string) =>
    `${API_BASE_URL}/whatsapp/media/${mediaId}`,
}

// ─── Pipelines ───────────────────────────────────────────────────────────────

export const pipelines = {
  list: () => apiFetch('/pipelines'),

  create: (data: { name: string }) =>
    apiFetch('/pipelines', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/pipelines/${id}`),

  update: (id: string, data: { name: string }) =>
    apiFetch(`/pipelines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/pipelines/${id}`, { method: 'DELETE' }),
}

// ─── Pipeline Stages ─────────────────────────────────────────────────────────

export const pipelineStages = {
  list: (pipelineId: string) =>
    apiFetch(`/pipelines/${pipelineId}/stages`),

  create: (pipelineId: string, data: { name: string; position: number; color?: string }) =>
    apiFetch(`/pipelines/${pipelineId}/stages`, { method: 'POST', body: JSON.stringify(data) }),

  update: (pipelineId: string, stageId: string, data: any) =>
    apiFetch(`/pipelines/${pipelineId}/stages/${stageId}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (pipelineId: string, stageId: string) =>
    apiFetch(`/pipelines/${pipelineId}/stages/${stageId}`, { method: 'DELETE' }),

  reorder: (pipelineId: string, stageIds: string[]) =>
    apiFetch(`/pipelines/${pipelineId}/stages/reorder`, { method: 'POST', body: JSON.stringify({ stage_ids: stageIds }) }),
}

// ─── Deals ───────────────────────────────────────────────────────────────────

export const deals = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/deals${qs(params)}`),

  create: (data: any) =>
    apiFetch('/deals', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/deals/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/deals/${id}`, { method: 'DELETE' }),
}

// ─── Broadcasts ──────────────────────────────────────────────────────────────

export const broadcasts = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/broadcasts${qs(params)}`),

  create: (data: any) =>
    apiFetch('/broadcasts', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/broadcasts/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/broadcasts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/broadcasts/${id}`, { method: 'DELETE' }),

  getRecipients: (id: string, params?: Record<string, string>) =>
    apiFetch(`/broadcasts/${id}/recipients${qs(params)}`),
}

// ─── Automations ─────────────────────────────────────────────────────────────

export const automations = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/automations${qs(params)}`),

  create: (data: any) =>
    apiFetch('/automations', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/automations/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/automations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/automations/${id}`, { method: 'DELETE' }),

  toggle: (id: string) =>
    apiFetch(`/automations/${id}/toggle`, { method: 'POST' }),

  duplicate: (id: string) =>
    apiFetch(`/automations/${id}/duplicate`, { method: 'POST' }),

  getLogs: (id: string, params?: Record<string, string>) =>
    apiFetch(`/automations/${id}/logs${qs(params)}`),

  getSteps: (id: string) =>
    apiFetch(`/automations/${id}/steps`),

  saveSteps: (id: string, steps: any[]) =>
    apiFetch(`/automations/${id}/steps`, { method: 'PUT', body: JSON.stringify({ steps }) }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboard = {
  stats: (params?: Record<string, string>) =>
    apiFetch(`/dashboard/stats${qs(params)}`),
}

// ─── Users / Profiles ────────────────────────────────────────────────────────

export const users = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/users${qs(params)}`),

  create: (data: any) =>
    apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/users/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' }),

  activate: (id: string) =>
    apiFetch(`/users/${id}/activate`, { method: 'POST' }),

  deactivate: (id: string) =>
    apiFetch(`/users/${id}/deactivate`, { method: 'POST' }),
}

// ─── Customers ───────────────────────────────────────────────────────────────

export const customers = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/customers${qs(params)}`),

  create: (data: any) =>
    apiFetch('/customers', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/customers/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/customers/${id}`, { method: 'DELETE' }),

  changeStatus: (id: string, data: { status_id: string; notes?: string }) =>
    apiFetch(`/customers/${id}/change-status`, { method: 'POST', body: JSON.stringify(data) }),

  statusHistory: (id: string) =>
    apiFetch(`/customers/${id}/status-history`),
}

// ─── Customer Statuses ───────────────────────────────────────────────────────

export const customerStatuses = {
  list: () => apiFetch('/customer-statuses'),

  create: (data: any) =>
    apiFetch('/customer-statuses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/customer-statuses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/customer-statuses/${id}`, { method: 'DELETE' }),

  reorder: (data: { ids: string[] }) =>
    apiFetch('/customer-statuses/reorder', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Lead Sources ────────────────────────────────────────────────────────────

export const leadSources = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/lead-sources${qs(params)}`),

  create: (data: any) =>
    apiFetch('/lead-sources', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/lead-sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/lead-sources/${id}`, { method: 'DELETE' }),
}

// ─── Leads ───────────────────────────────────────────────────────────────────

export const leads = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/leads${qs(params)}`),

  create: (data: any) =>
    apiFetch('/leads', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/leads/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/leads/${id}`, { method: 'DELETE' }),

  changeStatus: (id: string, data: { status: string; notes?: string }) =>
    apiFetch(`/leads/${id}/change-status`, { method: 'POST', body: JSON.stringify(data) }),

  history: (id: string) =>
    apiFetch(`/leads/${id}/history`),

  report: (params?: Record<string, string>) =>
    apiFetch(`/leads-report${qs(params)}`),
}

// ─── Sub-Leads ───────────────────────────────────────────────────────────────

export const subLeads = {
  list: (leadId: string) =>
    apiFetch(`/leads/${leadId}/sub-leads`),

  create: (leadId: string, data: any) =>
    apiFetch(`/leads/${leadId}/sub-leads`, { method: 'POST', body: JSON.stringify(data) }),

  update: (leadId: string, id: string, data: any) =>
    apiFetch(`/leads/${leadId}/sub-leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (leadId: string, id: string) =>
    apiFetch(`/leads/${leadId}/sub-leads/${id}`, { method: 'DELETE' }),
}

// ─── Products ────────────────────────────────────────────────────────────────

export const products = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/products${qs(params)}`),

  create: (data: any) =>
    apiFetch('/products', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/products/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/products/${id}`, { method: 'DELETE' }),
}

// ─── Companies ───────────────────────────────────────────────────────────────

export const companies = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/companies${qs(params)}`),

  create: (data: any) =>
    apiFetch('/companies', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/companies/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/companies/${id}`, { method: 'DELETE' }),
}

// ─── Outlets ─────────────────────────────────────────────────────────────────

export const outlets = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/outlets${qs(params)}`),

  create: (data: any) =>
    apiFetch('/outlets', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/outlets/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/outlets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/outlets/${id}`, { method: 'DELETE' }),
}

// ─── Roles ───────────────────────────────────────────────────────────────────

export const roles = {
  list: () => apiFetch('/roles'),

  create: (data: any) =>
    apiFetch('/roles', { method: 'POST', body: JSON.stringify(data) }),

  get: (id: string) =>
    apiFetch(`/roles/${id}`),

  update: (id: string, data: any) =>
    apiFetch(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/roles/${id}`, { method: 'DELETE' }),

  permissions: (id: string) =>
    apiFetch(`/roles/${id}/permissions`),

  syncPermissions: (id: string, data: { permission_ids: string[] }) =>
    apiFetch(`/roles/${id}/permissions`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export const permissions = {
  list: () => apiFetch('/permissions'),
  grouped: () => apiFetch('/permissions/grouped'),
}

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = {
  list: (params?: Record<string, string>) =>
    apiFetch(`/notifications${qs(params)}`),

  markRead: (id: string) =>
    apiFetch(`/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    apiFetch('/notifications/read-all', { method: 'POST' }),

  unreadCount: () =>
    apiFetch('/notifications/unread-count'),
}

// ─── Indonesia Address API (via Backend Proxy) ──────────────────────────────
// Backend proxies to emsifa/api-wilayah-indonesia (BPS/Kemendagri data).
// ## No database storage — data is fetched on-demand and cached for 1 hour. ##

export const indonesiaAddress = {
  provinces: () => apiFetch('/indonesia/provinces'),
  cities: (provinceCode: string) => apiFetch(`/indonesia/cities?province_code=${provinceCode}`),
  districts: (cityCode: string) => apiFetch(`/indonesia/districts?city_code=${cityCode}`),
  villages: (districtCode: string) => apiFetch(`/indonesia/villages?district_code=${districtCode}`),
}


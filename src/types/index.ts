export interface Profile {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  phone?: string;
  role_id?: string;
  company_id?: string;
  outlet_id?: string;
  supervisor_id?: string;
  status?: 'active' | 'inactive' | 'suspended';
  role_relation?: Role;
  company?: Company;
  outlet?: Outlet;
  supervisor?: Profile;
  created_at: string;
}

/**
 * Lightweight user object returned by the `creator` / `updater` Eloquent
 * relationships on any model that uses the Auditable trait.
 */
export interface AuditUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  avatar_url?: string;
  created_by?: string | null;
  updated_by?: string | null;
  creator?: AuditUser | null;
  updater?: AuditUser | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ContactTag {
  id: string;
  contact_id: string;
  tag_id: string;
}

export interface CustomField {
  id: string;
  user_id: string;
  field_name: string;
  field_type: string;
  field_options?: Record<string, unknown>;
  created_at: string;
}

export interface ContactCustomValue {
  id: string;
  contact_id: string;
  custom_field_id: string;
  value?: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
}

export type ConversationStatus = 'open' | 'pending' | 'closed';

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  status: ConversationStatus;
  assigned_agent_id?: string;
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
  contact?: Contact;
}

export type SenderType = 'customer' | 'agent' | 'bot';
export type ContentType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  sender_id?: string;
  content_type: ContentType;
  content_text?: string;
  media_url?: string;
  template_name?: string;
  message_id?: string;
  status: MessageStatus;
  created_at: string;
  reply_to_message_id?: string;
}

export type ReactionActor = 'customer' | 'agent';

export interface MessageReaction {
  id: string;
  message_id: string;
  conversation_id: string;
  actor_type: ReactionActor;
  actor_id?: string;
  emoji: string;
  created_at: string;
}

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number_id: string;
  waba_id?: string;
  access_token: string;
  verify_token?: string;
  status: 'connected' | 'disconnected';
  connected_at?: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  category: 'Marketing' | 'Utility' | 'Authentication';
  language?: string;
  header_type?: 'text' | 'image' | 'video' | 'document';
  header_content?: string;
  body_text: string;
  footer_text?: string;
  buttons?: Record<string, unknown>[];
  status?: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
  created_at: string;
}

export type DealStatus = 'open' | 'won' | 'lost';

export interface Deal {
  id: string;
  user_id: string;
  pipeline_id: string;
  stage_id: string;
  /**
   * Nullable after migration 004 — becomes NULL when the referenced
   * contact is deleted (ON DELETE SET NULL). History preserved.
   */
  contact_id: string | null;
  conversation_id?: string;
  assigned_to?: string;
  title: string;
  value: number;
  currency?: string;
  notes?: string;
  expected_close_date?: string;
  status?: DealStatus;
  created_at: string;
  updated_at?: string;
  contact?: Contact;
  stage?: PipelineStage;
  assignee?: Profile;
  customer_id?: string;
  lead_id?: string;
  product_id?: string;
  customer?: Customer;
  lead?: Lead;
  product?: Product;
}

export type BroadcastStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export interface Broadcast {
  id: string;
  user_id: string;
  name: string;
  template_name: string;
  template_language: string;
  template_variables?: Record<string, unknown>;
  audience_filter?: Record<string, unknown>;
  scheduled_at?: string;
  status: BroadcastStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  replied_count: number;
  failed_count: number;
  created_at: string;
}

export interface BroadcastRecipient {
  id: string;
  broadcast_id: string;
  /**
   * Nullable after migration 004 — becomes NULL when the referenced
   * contact is deleted (ON DELETE SET NULL). History preserved; the
   * UI renders "Unknown" for orphaned rows.
   */
  contact_id: string | null;
  status: RecipientStatus;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  replied_at?: string;
  error_message?: string;
  /**
   * Meta's message id, persisted when the broadcast send succeeds so
   * the webhook can mirror status updates back onto the recipient row.
   * Added in migration 003.
   */
  whatsapp_message_id?: string;
  created_at: string;
  contact?: Contact;
}

// ============================================================
// Automations (migration 006)
// ============================================================

export type AutomationTriggerType =
  | 'new_message_received'
  | 'first_inbound_message'
  | 'keyword_match'
  | 'new_contact_created'
  | 'conversation_assigned'
  | 'tag_added'
  | 'time_based';

export type AutomationStepType =
  | 'send_message'
  | 'send_template'
  | 'add_tag'
  | 'remove_tag'
  | 'assign_conversation'
  | 'update_contact_field'
  | 'create_deal'
  | 'wait'
  | 'condition'
  | 'send_webhook'
  | 'close_conversation';

export type AutomationLogStatus = 'success' | 'partial' | 'failed';

export interface KeywordMatchTriggerConfig {
  keywords: string[];
  match_type: 'exact' | 'contains';
  case_sensitive?: boolean;
}

export interface TagTriggerConfig {
  tag_id: string;
}

export interface TimeBasedTriggerConfig {
  /** Cron expression or simple HH:mm string; engine can accept either. */
  schedule: string;
  timezone?: string;
}

export type AutomationTriggerConfig =
  | Record<string, never>
  | KeywordMatchTriggerConfig
  | TagTriggerConfig
  | TimeBasedTriggerConfig
  | Record<string, unknown>;

export interface SendMessageStepConfig {
  text: string;
}

export interface SendTemplateStepConfig {
  template_name: string;
  language?: string;
  variables?: Record<string, string>;
}

export interface TagStepConfig {
  tag_id: string;
}

export interface AssignConversationStepConfig {
  mode: 'specific' | 'round_robin';
  agent_id?: string;
}

export interface UpdateContactFieldStepConfig {
  field: string;
  value: string;
}

export interface CreateDealStepConfig {
  pipeline_id: string;
  stage_id: string;
  title: string;
  value?: number;
}

export interface WaitStepConfig {
  amount: number;
  unit: 'minutes' | 'hours' | 'days';
}

export type ConditionSubject =
  | 'contact_field'
  | 'tag_presence'
  | 'message_content'
  | 'time_of_day';

export interface ConditionStepConfig {
  subject: ConditionSubject;
  /** e.g. field name, tag id, substring, or "HH:mm-HH:mm" depending on subject */
  operand?: string;
  /** For contact_field equals / message_content contains — comparison value */
  value?: string;
}

export interface SendWebhookStepConfig {
  url: string;
  headers?: Record<string, string>;
  body_template?: string;
}

export type AutomationStepConfig =
  | SendMessageStepConfig
  | SendTemplateStepConfig
  | TagStepConfig
  | AssignConversationStepConfig
  | UpdateContactFieldStepConfig
  | CreateDealStepConfig
  | WaitStepConfig
  | ConditionStepConfig
  | SendWebhookStepConfig
  | Record<string, never>
  | Record<string, unknown>;

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger_type: AutomationTriggerType;
  trigger_config: AutomationTriggerConfig;
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationStep {
  id: string;
  automation_id: string;
  parent_step_id?: string | null;
  branch?: 'yes' | 'no' | null;
  step_type: AutomationStepType;
  step_config: AutomationStepConfig;
  position: number;
  created_at: string;
}

export interface AutomationLogStepResult {
  step_id: string;
  step_type: AutomationStepType;
  status: 'success' | 'skipped' | 'failed';
  detail?: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  user_id: string;
  contact_id: string | null;
  trigger_event: string;
  steps_executed: AutomationLogStepResult[];
  status: AutomationLogStatus;
  error_message?: string | null;
  created_at: string;
  contact?: Contact;
}

// ==========================================
// RBAC Types
// ==========================================

export interface Role {
  id: string;
  name: string;
  slug: 'super_admin' | 'admin' | 'manager' | 'spv' | 'staff';
  description?: string;
  level: number;
  is_active: boolean;
  permissions?: Permission[];
  users_count?: number;
  permissions_count?: number;
  created_at: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  slug: string;
  description?: string;
}

// ==========================================
// Organization Types
// ==========================================

export interface Company {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  outlets_count?: number;
  users_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Outlet {
  id: string;
  company_id: string;
  name: string;
  code: string;
  city: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  company?: Company;
  users_count?: number;
  customers_count?: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Indonesia Address Types
// ==========================================

export interface IndonesiaProvince {
  id: number;
  code: string;
  name: string;
}

export interface IndonesiaCity {
  id: number;
  province_code: string;
  code: string;
  name: string;
  type: 'kabupaten' | 'kota';
}

export interface IndonesiaDistrict {
  id: number;
  city_code: string;
  code: string;
  name: string;
}

export interface IndonesiaVillage {
  id: number;
  district_code: string;
  code: string;
  name: string;
  postal_code?: string;
}

// ==========================================
// Customer Types
// ==========================================

export interface CustomerStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  province_code?: string;
  city_code?: string;
  district_code?: string;
  village_code?: string;
  rt?: string;
  rw?: string;
  postal_code?: string;
  company_id?: string;
  outlet_id?: string;
  assigned_sales_id?: string;
  status_id?: string;
  source?: string;
  created_by?: string;
  updated_by?: string;
  company?: Company;
  outlet?: Outlet;
  assigned_sales?: Profile;
  status?: CustomerStatus;
  province?: IndonesiaProvince;
  city?: IndonesiaCity;
  district?: IndonesiaDistrict;
  village?: IndonesiaVillage;
  leads_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerStatusHistory {
  id: string;
  customer_id: string;
  from_status_id?: string;
  to_status_id?: string;
  changed_by?: string;
  notes?: string;
  from_status?: CustomerStatus;
  to_status?: CustomerStatus;
  changed_by_user?: Profile;
  created_at: string;
}

// ==========================================
// Lead Types
// ==========================================

export interface LeadStatus {
  id: string;
  name: string;
  slug: string;
  color: string;
  position: number;
  is_default: boolean;
}

export interface LeadSource {
  id: string;
  name: string;
  code: string;
  icon?: string;
  color: string;
  is_active: boolean;
  leads_count?: number;
}

export interface Lead {
  id: string;
  customer_id: string;
  assigned_to?: string;
  source_id?: string;
  status_id: string;
  status?: LeadStatus;
  title: string;
  notes?: string;
  value: number;
  company_id?: string;
  outlet_id?: string;
  created_by?: string;
  updated_by?: string;
  customer?: Customer;
  assigned_to_user?: Profile;
  source?: LeadSource;
  company?: Company;
  outlet?: Outlet;
  sub_leads?: SubLead[];
  sub_leads_count?: number;
  history?: LeadHistory[];
  creator?: Profile;
  created_at: string;
  updated_at: string;
}

export interface SubLead {
  id: string;
  lead_id: string;
  product_id?: string;
  title: string;
  notes?: string;
  value: number;
  status: string;
  product?: Product;
  created_by?: string;
  created_at: string;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  action: string;
  from_status?: string;
  to_status?: string;
  notes?: string;
  performed_by?: string;
  performer?: Profile;
  created_at: string;
}

// ==========================================
// Product Types
// ==========================================

export type WatchCondition = 'unworn' | 'pre_owned';
export type WatchCategory = 'man' | 'ladies' | 'others';
export type ProductAvailability = 'ready_stock' | 'pre_order' | 'sold';
export type ProductSourceType = 'manual' | 'erp';

export interface Product {
  id: string;
  brand: string;
  model: string;
  reference_number?: string;
  description?: string;
  year?: number;
  condition: WatchCondition;
  category: WatchCategory;
  movement_type?: string;
  case_material?: string;
  case_size?: string;
  dial_color?: string;
  strap_material?: string;
  bezel_type?: string;
  documentation?: string;
  availability: ProductAvailability;
  price: number;
  discount_price?: number;
  discount_percent?: number;
  currency: string;
  image_url?: string;
  outlet_id?: string;
  is_active: boolean;
  source_type: ProductSourceType;
  erp_item_id?: string;
  outlet?: Outlet;
  created_at: string;
  updated_at: string;
}

// ==========================================
// Notification Types
// ==========================================

export type NotificationType = 'lead_assigned' | 'deal_status_changed' | 'new_customer' | 'lead_status_changed' | 'system';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  data?: Record<string, unknown>;
  company_id?: string;
  outlet_id?: string;
  read_at?: string;
  created_at: string;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface DashboardStats {
  new_leads: number;
  in_work: number;
  deals: number;
  total_leads: number;
}

export interface LeadSourceStat {
  source: string;
  code: string;
  count: number;
  color: string;
  icon?: string;
}

export interface TopSalesman {
  id: string;
  name: string;
  avatar_url?: string;
  total_leads: number;
  total_deals: number;
}

// ==========================================
// Paginated Response
// ==========================================

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

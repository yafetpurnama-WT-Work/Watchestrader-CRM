'use client';

import { useState } from 'react';
import { contacts as contactsApi, broadcasts as broadcastsApi } from '@/lib/api';
import { Contact, MessageTemplate } from '@/types';

export type CustomFieldOperator = 'is' | 'is_not' | 'contains';

export interface CustomFieldFilter {
  fieldId: string;
  operator: CustomFieldOperator;
  value: string;
}

export interface AudienceConfig {
  type: 'all' | 'tags' | 'custom_field' | 'csv';
  tagIds?: string[];
  customField?: CustomFieldFilter;
  csvContacts?: { phone: string; name?: string }[];
  excludeTagIds?: string[];
}

export type VariableMapping =
  | { type: 'static'; value: string }
  | { type: 'field'; value: string }
  | { type: 'custom_field'; value: string };

interface BroadcastPayload {
  name: string;
  template: MessageTemplate;
  audience: AudienceConfig;
  variables: Record<string, VariableMapping>;
}

interface UseBroadcastSendingReturn {
  createAndSendBroadcast: (payload: BroadcastPayload) => Promise<string>;
  isProcessing: boolean;
  progress: number;
}

export function useBroadcastSending(): UseBroadcastSendingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  async function resolveAudience(audience: AudienceConfig): Promise<Contact[]> {
    const res = await contactsApi.list();
    let contacts = res.data?.data || res.data || [];
    if (!Array.isArray(contacts)) contacts = [];

    let filtered = contacts;

    if (audience.type === 'tags' && audience.tagIds && audience.tagIds.length > 0) {
      filtered = filtered.filter((c: any) =>
        c.tags?.some((t: any) => audience.tagIds!.includes(t.id))
      );
    } else if (
      audience.type === 'custom_field' &&
      audience.customField?.fieldId &&
      audience.customField.value
    ) {
      const { fieldId, operator, value } = audience.customField;
      filtered = filtered.filter((c: any) => {
        const cv = c.customValues?.find((v: any) => v.custom_field_id === fieldId);
        if (!cv) return false;
        if (operator === 'is') return cv.value === value;
        if (operator === 'is_not') return cv.value !== value;
        return cv.value.toLowerCase().includes(value.toLowerCase());
      });
    } else if (audience.type === 'csv' && audience.csvContacts) {
      // Mock CSV contacts for now
      return audience.csvContacts.map((c, i) => ({
        id: `csv-${i}`,
        user_id: 'mock',
        phone: c.phone,
        name: c.name || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    } else if (audience.type !== 'all') {
      return [];
    }

    if (audience.excludeTagIds && audience.excludeTagIds.length > 0) {
      filtered = filtered.filter(
        (c: any) => !c.tags?.some((t: any) => audience.excludeTagIds!.includes(t.id))
      );
    }

    return filtered;
  }

  async function createAndSendBroadcast(payload: BroadcastPayload): Promise<string> {
    setIsProcessing(true);
    setProgress(0);

    try {
      setProgress(5);
      const contacts = await resolveAudience(payload.audience);

      if (contacts.length === 0) {
        throw new Error('No contacts found for this audience.');
      }

      setProgress(10);
      const res = await broadcastsApi.create({
        name: payload.name,
        template_name: payload.template.name,
        template_language: payload.template.language ?? 'en_US',
        template_variables: payload.variables,
        audience_filter: {
          type: payload.audience.type,
          tagIds: payload.audience.tagIds,
          customField: payload.audience.customField,
          excludeTagIds: payload.audience.excludeTagIds,
        },
        status: 'sending',
        total_recipients: contacts.length,
        sent_count: 0,
        delivered_count: 0,
        read_count: 0,
        replied_count: 0,
        failed_count: 0,
      });

      const broadcast = res.data?.data || res.data;
      if (!broadcast || !broadcast.id) {
        throw new Error('Failed to create broadcast.');
      }

      setProgress(30);

      // Mock the sending process
      const batchSize = 10;
      for (let i = 0; i < contacts.length; i += batchSize) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const progressPct = 30 + Math.round(((i + batchSize) / contacts.length) * 60);
        setProgress(Math.min(progressPct, 95));
      }

      setProgress(95);
      await broadcastsApi.update(broadcast.id, {
        status: 'sent',
        sent_count: contacts.length,
      });

      setProgress(100);
      return broadcast.id;
    } finally {
      setIsProcessing(false);
    }
  }

  return { createAndSendBroadcast, isProcessing, progress };
}

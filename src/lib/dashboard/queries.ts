import { dashboard } from '@/lib/api'
import {
  daysAgoStart,
  DOW_SHORT_MON_FIRST,
  lastNDayKeys,
  localDayKey,
  mondayIndex,
  startOfLocalDay,
} from './date-utils'
import type {
  ActivityItem,
  ConversationsSeriesPoint,
  MetricsBundle,
  PipelineDonutData,
  PipelineStageSlice,
  ResponseTimeBucket,
  ResponseTimeSummary,
} from './types'

// ------------------------------------------------------------
// Dashboard queries now delegate to the Laravel API /dashboard/stats
// endpoint. Complex aggregations (chart data, response time, activity
// feed) return empty/placeholder data for now and will be filled in
// once corresponding API endpoints exist on the backend.
// ------------------------------------------------------------

// --- 1. Metric cards ---------------------------------------------------

export async function loadMetrics(): Promise<MetricsBundle> {
  try {
    const res = await dashboard.stats()
    const d = res.data

    return {
      activeConversations: {
        current: d.active_conversations ?? 0,
        previous: 0,
      },
      newContactsToday: {
        current: d.new_contacts_today ?? 0,
        previous: 0,
      },
      openDealsValue: d.open_deals_value ?? 0,
      openDealsCount: d.open_deals_count ?? 0,
      messagesSentToday: {
        current: d.messages_sent_today ?? 0,
        previous: 0,
      },
    }
  } catch {
    return {
      activeConversations: { current: 0, previous: 0 },
      newContactsToday: { current: 0, previous: 0 },
      openDealsValue: 0,
      openDealsCount: 0,
      messagesSentToday: { current: 0, previous: 0 },
    }
  }
}

// --- 2. Conversations over time (placeholder — needs API) --------------

export async function loadConversationsSeries(
  _unused?: any,
  rangeDays = 7,
): Promise<ConversationsSeriesPoint[]> {
  // Returns empty chart data for now
  const keys = lastNDayKeys(rangeDays)
  return keys.map((day) => ({ day, incoming: 0, outgoing: 0 }))
}

// --- 3. Pipeline donut (placeholder — needs API) -----------------------

export async function loadPipelineDonut(_unused?: any): Promise<PipelineDonutData> {
  return {
    stages: [],
    totalValue: 0,
  }
}

// --- 4. Response time by day of week (placeholder) ---------------------

export async function loadResponseTime(_unused?: any): Promise<ResponseTimeSummary> {
  void DOW_SHORT_MON_FIRST

  const buckets: ResponseTimeBucket[] = Array.from({ length: 7 }, (_, dow) => ({
    dow,
    avgMinutes: null,
    samples: 0,
  }))

  return {
    buckets,
    thisWeekAvg: null,
    lastWeekAvg: null,
  }
}

// --- 5. Activity feed (placeholder — needs API) -------------------------

export async function loadActivity(_unused?: any, _limit = 20): Promise<ActivityItem[]> {
  return []
}

// Suppress unused import warnings for utilities used by placeholders
void daysAgoStart
void localDayKey
void mondayIndex
void startOfLocalDay

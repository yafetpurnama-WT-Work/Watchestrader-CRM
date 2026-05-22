"use client";

import { useEffect, useState } from "react";
import { conversations } from "@/lib/api";

/**
 * Count of conversations with at least one unread inbound message.
 * Used by the sidebar to surface a green dot on the Inbox nav entry.
 * Currently fetches once on mount — will add polling in Fase 7.
 */
export function useTotalUnread(): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await conversations.list();
        if (cancelled || !res.success) return;

        const data = res.data?.data || res.data || [];
        let sum = 0;
        for (const row of data) {
          if ((row.unread_count ?? 0) > 0) sum += 1;
        }
        setTotal(sum);
      } catch {
        // silently fail — sidebar badge is non-critical
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return total;
}

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { Message, Conversation } from "@/types";

interface RealtimeEvent<T> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: Partial<T>;
}

interface UseRealtimeOptions {
  channelName: string;
  onMessageEvent?: (event: RealtimeEvent<Message>) => void;
  onConversationEvent?: (event: RealtimeEvent<Conversation>) => void;
  enabled?: boolean;
}

/**
 * Realtime hook — currently a no-op stub.
 * Will be replaced with polling or WebSocket (Laravel Reverb) in Fase 7.
 */
export function useRealtime({
  channelName,
  onMessageEvent,
  onConversationEvent,
  enabled = true,
}: UseRealtimeOptions) {
  const [isConnected] = useState(false);

  const unsubscribe = useCallback(() => {
    // no-op for now
  }, []);

  return { isConnected, unsubscribe };
}

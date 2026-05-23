"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

interface UseResizableColumnsOptions {
  /** Number of visible columns in the table */
  columnCount: number;
  /** Minimum column width in pixels (default: 60) */
  minWidth?: number;
  /** Optional localStorage key to persist column widths across page reloads */
  storageKey?: string;
}

interface UseResizableColumnsReturn {
  /** Whether column widths have been initialized */
  initialized: boolean;
  /** Whether a resize drag is currently active */
  isResizing: boolean;
  /** Ref callback to attach to the <table> element */
  tableRef: (node: HTMLTableElement | null) => void;
  /** Get inline style for a <th> at the given index */
  getThStyle: (index: number) => React.CSSProperties;
  /** Get inline style for a <td> at the given index */
  getTdStyle: (index: number) => React.CSSProperties;
  /** The resize handle element to render inside each <th> */
  renderHandle: (index: number) => React.ReactNode;
  /** Reset column widths to auto (clear localStorage) */
  resetWidths: () => void;
}

export function useResizableColumns({
  columnCount,
  minWidth = 60,
  storageKey,
}: UseResizableColumnsOptions): UseResizableColumnsReturn {
  const [widths, setWidths] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const tableElRef = useRef<HTMLTableElement | null>(null);
  const dragRef = useRef<{
    col: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Stable refs for event handlers to avoid closure issues
  const widthsRef = useRef<number[]>(widths);
  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);
  // ─── Load persisted widths from localStorage ───
  useEffect(() => {
    if (!storageKey || initialized) return;
    try {
      const raw = localStorage.getItem(`rt:${storageKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed) && parsed.length === columnCount) {
          setWidths(parsed);
          setInitialized(true);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey, columnCount, initialized]);

  // ─── Save to localStorage on width change ───
  useEffect(() => {
    if (!storageKey || !initialized || widths.length === 0) return;
    try {
      localStorage.setItem(`rt:${storageKey}`, JSON.stringify(widths));
    } catch {
      // ignore
    }
  }, [storageKey, widths, initialized]);

  // ─── Table ref — initialize widths from actual DOM ───
  const tableRef = useCallback(
    (node: HTMLTableElement | null) => {
      tableElRef.current = node;
      if (!node || initialized) return;

      requestAnimationFrame(() => {
        const ths = node.querySelectorAll<HTMLElement>("thead th");
        if (ths.length === 0) return;

        const measured: number[] = [];
        ths.forEach((th) => {
          measured.push(Math.max(th.offsetWidth, minWidth));
        });

        if (measured.length > 0) {
          setWidths(measured);
          setInitialized(true);
        }
      });
    },
    [minWidth, initialized],
  );

  // ─── Core drag logic ───
  const onDragMove = useCallback(
    (clientX: number) => {
      const state = dragRef.current;
      if (!state) return;
      const delta = clientX - state.startX;
      const newW = Math.max(state.startWidth + delta, minWidth);

      setWidths((prev) => {
        const next = [...prev];
        next[state.col] = newW;
        return next;
      });
    },
    [minWidth],
  );

  const onDragEnd = useCallback(() => {
    dragRef.current = null;
    setIsResizing(false);
    document.body.classList.remove("col-resizing");
  }, []);

  // Use a single ref-based approach so we don't re-register listeners
  const moveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const upHandlerRef = useRef<(() => void) | null>(null);
  const touchMoveRef = useRef<((e: TouchEvent) => void) | null>(null);
  const touchEndRef = useRef<(() => void) | null>(null);

  const startResize = useCallback(
    (colIndex: number, clientX: number) => {
      const currentWidths = widthsRef.current;
      if (currentWidths.length === 0) return;

      dragRef.current = {
        col: colIndex,
        startX: clientX,
        startWidth: currentWidths[colIndex],
      };
      setIsResizing(true);
      document.body.classList.add("col-resizing");

      // Cleanup previous listeners if any
      if (moveHandlerRef.current) {
        document.removeEventListener("mousemove", moveHandlerRef.current);
      }
      if (upHandlerRef.current) {
        document.removeEventListener("mouseup", upHandlerRef.current);
      }
      if (touchMoveRef.current) {
        document.removeEventListener("touchmove", touchMoveRef.current);
      }
      if (touchEndRef.current) {
        document.removeEventListener("touchend", touchEndRef.current);
      }

      const onMove = (e: MouseEvent) => {
        e.preventDefault();
        onDragMove(e.clientX);
      };
      const onUp = () => {
        onDragEnd();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        if (touchMoveRef.current) document.removeEventListener("touchmove", touchMoveRef.current);
        if (touchEndRef.current) document.removeEventListener("touchend", touchEndRef.current);
      };
      const onTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) onDragMove(e.touches[0].clientX);
      };
      const onTouchEnd = () => {
        onDragEnd();
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      moveHandlerRef.current = onMove;
      upHandlerRef.current = onUp;
      touchMoveRef.current = onTouchMove;
      touchEndRef.current = onTouchEnd;

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onTouchMove, { passive: true });
      document.addEventListener("touchend", onTouchEnd);
    },
    [onDragMove, onDragEnd],
  );

  // ─── Cleanup on unmount ───
  useEffect(() => {
    return () => {
      document.body.classList.remove("col-resizing");
      if (moveHandlerRef.current) document.removeEventListener("mousemove", moveHandlerRef.current);
      if (upHandlerRef.current) document.removeEventListener("mouseup", upHandlerRef.current);
      if (touchMoveRef.current) document.removeEventListener("touchmove", touchMoveRef.current);
      if (touchEndRef.current) document.removeEventListener("touchend", touchEndRef.current);
    };
  }, []);

  // ─── Style getters ───
  const getThStyle = useCallback(
    (index: number): React.CSSProperties => {
      if (!initialized || widths.length === 0) return {};
      const w = widths[index];
      if (w == null) return {};
      return {
        width: w,
        minWidth: minWidth,
        maxWidth: w,
      };
    },
    [initialized, widths, minWidth],
  );

  const getTdStyle = useCallback(
    (index: number): React.CSSProperties => {
      if (!initialized || widths.length === 0) return {};
      const w = widths[index];
      if (w == null) return {};
      return {
        width: w,
        minWidth: minWidth,
        maxWidth: w,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      };
    },
    [initialized, widths, minWidth],
  );

  // ─── Render resize handle ───
  const renderHandle = useCallback(
    (index: number): React.ReactNode => {
      return (
        <span
          key={`rh-${index}`}
          className="rt-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startResize(index, e.clientX);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            if (e.touches.length > 0) {
              startResize(index, e.touches[0].clientX);
            }
          }}
        >
          <span className="rt-handle-grip" />
        </span>
      );
    },
    [startResize],
  );

  // ─── Reset ───
  const resetWidths = useCallback(() => {
    if (storageKey) {
      try { localStorage.removeItem(`rt:${storageKey}`); } catch { /* ignore */ }
    }
    setWidths([]);
    setInitialized(false);
  }, [storageKey]);

  return {
    initialized,
    isResizing,
    tableRef,
    getThStyle,
    getTdStyle,
    renderHandle,
    resetWidths,
  };
}

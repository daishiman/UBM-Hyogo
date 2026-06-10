"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemberCandidate } from "./MeetingAttendanceDrawer";

const normalizeQuery = (value: string) => value.trim().toLowerCase();

export interface UseBulkAttendanceSelection {
  query: string;
  setQuery: (value: string) => void;
  selectableCandidates: ReadonlyArray<MemberCandidate>;
  selectedIds: ReadonlySet<string>;
  toggle: (memberId: string) => void;
  selectAllFiltered: () => void;
  clear: () => void;
  selectedCount: number;
}

export function useBulkAttendanceSelection(
  candidates: ReadonlyArray<MemberCandidate>,
  attended: ReadonlySet<string>,
): UseBulkAttendanceSelection {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const selectableCandidates = useMemo(() => {
    const q = normalizeQuery(query);
    return candidates.filter((candidate) => {
      if (attended.has(candidate.memberId)) return false;
      if (!q) return true;
      return (
        candidate.fullName.toLowerCase().includes(q) ||
        candidate.memberId.toLowerCase().includes(q)
      );
    });
  }, [attended, candidates, query]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set(
        [...current].filter((memberId) => !attended.has(memberId)),
      );
      return next.size === current.size ? current : next;
    });
  }, [attended]);

  return {
    query,
    setQuery,
    selectableCandidates,
    selectedIds,
    toggle: (memberId) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        if (next.has(memberId)) next.delete(memberId);
        else if (!attended.has(memberId)) next.add(memberId);
        return next;
      }),
    selectAllFiltered: () =>
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const candidate of selectableCandidates) {
          next.add(candidate.memberId);
        }
        return next;
      }),
    clear: () => setSelectedIds(new Set<string>()),
    selectedCount: selectedIds.size,
  };
}

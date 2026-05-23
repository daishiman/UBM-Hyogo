// task-15: members 画面 client container（URLSearchParams 同期 / selection / drawer）
"use client";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { MembersFilters, type MembersFilterValue } from "./MembersFilters";
import { MembersTable } from "./MembersTable";
import { BulkActionBar } from "./BulkActionBar";
import { MemberDrawer } from "./MemberDrawer";

export interface MembersClientShellProps {
  readonly initial: AdminMemberListView;
  readonly initialFilter: MembersFilterValue;
  readonly page: number;
  readonly pageSize: number;
}

export function MembersClientShell({ initial, initialFilter, page, pageSize }: MembersClientShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  const onChangeFilter = (patch: Partial<MembersFilterValue>) => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === undefined || v === null) sp.delete(k);
      else sp.set(k, String(v));
    }
    sp.delete("page");
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`);
    });
  };

  const onPageChange = (newPage: number) => {
    const sp = new URLSearchParams(searchParams?.toString() ?? "");
    if (newPage <= 1) sp.delete("page");
    else sp.set("page", String(newPage));
    startTransition(() => {
      router.replace(`${pathname}?${sp.toString()}`);
    });
  };

  const onToggleSelect = (memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const onToggleSelectAll = () => {
    setSelected((prev) => {
      const allIds = initial.members.map((m) => m.memberId);
      if (allIds.every((id) => prev.has(id))) return new Set();
      return new Set(allIds);
    });
  };

  const onComplete = () => {
    setSelected(new Set());
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <MembersFilters value={initialFilter} onChange={onChangeFilter} loading={pending} />
      <BulkActionBar selectedIds={Array.from(selected)} onComplete={onComplete} />
      <MembersTable
        items={initial.members}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onOpenRow={setOpenMemberId}
        page={page}
        pageSize={pageSize}
        total={initial.total}
        onPageChange={onPageChange}
      />
      {openMemberId !== null ? (
        <MemberDrawer memberId={openMemberId} onClose={() => setOpenMemberId(null)} />
      ) : null}
    </div>
  );
}

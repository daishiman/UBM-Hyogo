// task-15: members 画面 client container（URLSearchParams 同期 / selection / drawer）
// issue-958 Track B: 一括公開復帰 drawer の mount を追加。
"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { MembersFilters, type MembersFilterValue } from "./MembersFilters";
import { MembersTable } from "./MembersTable";
import { BulkActionBar } from "./BulkActionBar";
import { MemberDrawer } from "./MemberDrawer";
import { BulkRepublishDrawer } from "../../../../components/admin/BulkRepublishDrawer";
import { Button } from "../../../../components/ui/Button";

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
  const [bulkRepublishOpen, setBulkRepublishOpen] = useState(false);

  const republishCandidates = useMemo(
    () =>
      initial.members
        .filter(
          (m) =>
            m.publishState === "hidden" || m.publishState === "member_only",
        )
        .map((m) => ({
          memberId: m.memberId,
          displayName: m.fullName,
          publishState: m.publishState as "hidden" | "member_only",
          hiddenReason: null,
        })),
    [initial.members],
  );

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

  // 行レベルの switch は詳細 drawer を開き、既存の useAdminMutation 経由操作に集約する。
  const onTogglePublish = (id: string, _next: boolean) => {
    void _next;
    setOpenMemberId(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <MembersFilters
        value={initialFilter}
        onChange={onChangeFilter}
        loading={pending}
        count={initial.total}
      />
      <div className="flex justify-end">
        <Button
          variant="soft"
          size="sm"
          onClick={() => setBulkRepublishOpen(true)}
          disabled={republishCandidates.length === 0}
          data-testid="bulk-republish-open"
        >
          一括公開復帰 ({republishCandidates.length})
        </Button>
      </div>
      <BulkRepublishDrawer
        open={bulkRepublishOpen}
        onClose={() => setBulkRepublishOpen(false)}
        candidates={republishCandidates}
        onCompleted={() => router.refresh()}
      />
      <BulkActionBar selectedIds={Array.from(selected)} onComplete={onComplete} />
      <MembersTable
        items={initial.members}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        onOpenRow={setOpenMemberId}
        onTogglePublish={onTogglePublish}
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

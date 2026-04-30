"use client";
// 06c: /admin/members の client shell
// AC-1: profile 本文編集 form を持たない（MemberDrawer 内で input なし）
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import { MemberDrawer } from "./MemberDrawer";

type Filter = "published" | "hidden" | "deleted";

export function MembersClient({
  initial,
  filter,
}: {
  readonly initial: AdminMemberListView;
  readonly filter: Filter | undefined;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const onFilterChange = (next: Filter | "") => {
    const params = new URLSearchParams();
    if (next) params.set("filter", next);
    router.push(`/admin/members${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section aria-labelledby="admin-members-h">
      <h1 id="admin-members-h">会員管理</h1>

      <div role="group" aria-label="表示切替">
        {(["", "published", "hidden", "deleted"] as const).map((v) => (
          <button
            key={v || "all"}
            type="button"
            aria-pressed={filter === (v || undefined)}
            onClick={() => onFilterChange(v as Filter | "")}
          >
            {v === "" ? "すべて" : v === "published" ? "公開中" : v === "hidden" ? "非公開" : "削除済み"}
          </button>
        ))}
      </div>

      <p>{initial.total} 件</p>

      <table>
        <thead>
          <tr>
            <th>氏名</th>
            <th>email</th>
            <th>publish</th>
            <th>削除</th>
            <th>最終提出</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {initial.members.map((m) => (
            <tr key={m.memberId}>
              <td>{m.fullName}</td>
              <td>{m.responseEmail}</td>
              <td>{m.publishState}</td>
              <td>{m.isDeleted ? "削除済み" : "—"}</td>
              <td>{m.lastSubmittedAt}</td>
              <td>
                <button type="button" onClick={() => setSelectedId(m.memberId)}>
                  詳細
                </button>{" "}
                <Link href={`/admin/tags?memberId=${encodeURIComponent(m.memberId)}`}>
                  タグキューで編集
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedId && (
        <MemberDrawer
          memberId={selectedId}
          onClose={() => setSelectedId(null)}
          onMutated={() => router.refresh()}
        />
      )}
    </section>
  );
}

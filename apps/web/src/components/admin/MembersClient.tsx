"use client";
// 06c / 06c-B: /admin/members の client shell
// 12-search-tags: q / zone / tag / sort / density / page を URL 正本として扱う。
// AC-1: profile 本文編集 form を持たない（MemberDrawer 内で input なし）
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AdminMemberListView } from "@ubm-hyogo/shared";
import {
  toAdminApiQuery,
  ADMIN_SORT_VALUES,
  ADMIN_DENSITY_VALUES,
  ADMIN_ZONE_VALUES,
  ADMIN_SEARCH_LIMITS,
  type AdminMemberSearch,
} from "@ubm-hyogo/shared";
import { MemberDrawer } from "./MemberDrawer";

type Filter = "" | "published" | "hidden" | "deleted";

export function MembersClient({
  initial,
  search,
}: {
  readonly initial: AdminMemberListView;
  readonly search: AdminMemberSearch;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftQ, setDraftQ] = useState(search.q);

  const navigate = (next: AdminMemberSearch) => {
    const params = toAdminApiQuery(next);
    const qs = params.toString();
    startTransition(() => {
      router.push(`/admin/members${qs ? `?${qs}` : ""}`);
    });
  };

  const onFilterChange = (next: Filter) =>
    navigate({ ...search, filter: next, page: 1 });

  const onZoneChange = (zone: AdminMemberSearch["zone"]) =>
    navigate({ ...search, zone, page: 1 });

  const onSortChange = (sort: AdminMemberSearch["sort"]) =>
    navigate({ ...search, sort, page: 1 });

  const onDensityChange = (density: AdminMemberSearch["density"]) =>
    navigate({ ...search, density, page: 1 });

  const onSubmitQ = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ ...search, q: draftQ.trim(), page: 1 });
  };

  const onClear = () => {
    setDraftQ("");
    navigate({
      filter: "",
      q: "",
      zone: "all",
      tag: [],
      sort: "recent",
      density: "comfy",
      page: 1,
    });
  };

  const removeTag = (t: string) =>
    navigate({ ...search, tag: search.tag.filter((x) => x !== t), page: 1 });

  const goPage = (page: number) => navigate({ ...search, page });

  const pageSize = initial.pageSize ?? ADMIN_SEARCH_LIMITS.PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(initial.total / pageSize));
  const currentPage = Math.min(initial.page ?? search.page, totalPages);

  return (
    <section aria-labelledby="admin-members-h">
      <h1 id="admin-members-h">会員管理</h1>

      <form onSubmit={onSubmitQ} role="search" aria-label="会員検索">
        <label>
          キーワード検索
          <input
            type="search"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            maxLength={ADMIN_SEARCH_LIMITS.Q_LIMIT}
            aria-describedby="q-hint"
          />
        </label>
        <small id="q-hint">氏名・email・自己紹介などを検索 ({ADMIN_SEARCH_LIMITS.Q_LIMIT} 文字まで)</small>
        <button type="submit">検索</button>
      </form>

      <div role="group" aria-label="表示切替">
        {([
          ["", "すべて"],
          ["published", "公開中"],
          ["hidden", "非公開"],
          ["deleted", "削除済み"],
        ] as const).map(([v, label]) => (
          <button
            key={v || "all"}
            type="button"
            aria-pressed={search.filter === v}
            onClick={() => onFilterChange(v)}
          >
            {label}
          </button>
        ))}
      </div>

      <label>
        UBM区画
        <select
          value={search.zone}
          onChange={(e) => onZoneChange(e.target.value as AdminMemberSearch["zone"])}
        >
          {ADMIN_ZONE_VALUES.map((z) => (
            <option key={z} value={z}>
              {z === "all" ? "すべて" : z}
            </option>
          ))}
        </select>
      </label>

      <label>
        並び替え
        <select
          value={search.sort}
          onChange={(e) => onSortChange(e.target.value as AdminMemberSearch["sort"])}
        >
          {ADMIN_SORT_VALUES.map((s) => (
            <option key={s} value={s}>
              {s === "recent" ? "最終更新順" : "氏名順"}
            </option>
          ))}
        </select>
      </label>

      <label>
        表示密度
        <select
          value={search.density}
          onChange={(e) => onDensityChange(e.target.value as AdminMemberSearch["density"])}
        >
          {ADMIN_DENSITY_VALUES.map((d) => (
            <option key={d} value={d}>
              {d === "comfy" ? "標準" : d === "dense" ? "高密度" : "リスト"}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={onClear}>
        条件をクリア
      </button>

      {search.tag.length > 0 && (
        <ul aria-label="選択中のタグ">
          {search.tag.map((t) => (
            <li key={t}>
              {t}{" "}
              <button type="button" onClick={() => removeTag(t)} aria-label={`${t} を外す`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <p>{initial.total} 件</p>

      <table data-density={search.density}>
        <thead>
          <tr>
            <th scope="col">氏名</th>
            <th scope="col">email</th>
            <th scope="col">publish</th>
            <th scope="col">削除</th>
            <th scope="col">最終提出</th>
            <th scope="col" />
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

      {initial.members.length === 0 && (
        <p role="status">条件に合う会員がいません。</p>
      )}

      {totalPages > 1 && (
        <nav aria-label="ページング">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goPage(currentPage - 1)}
          >
            前へ
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => goPage(currentPage + 1)}
          >
            次へ
          </button>
        </nav>
      )}

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

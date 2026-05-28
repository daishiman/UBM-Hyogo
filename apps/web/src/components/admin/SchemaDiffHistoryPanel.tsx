"use client";
// issue-777: SchemaDiffHistoryPanel — schema alias resolve の過去履歴閲覧 UI
// 不変条件 #2 (OKLch token): 色は tokens.css 由来のみ。HEX 直書き禁止
// 不変条件 #5: web は API helper 経由で audit endpoint を呼ぶ（D1 直接アクセスなし）
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  fetchSchemaAliasHistory,
  type SchemaAliasHistoryItem,
  type SchemaAliasHistoryResponse,
} from "../../lib/admin/api";
import { Breadcrumb } from "./Breadcrumb";
import { Pagination } from "../ui/Pagination";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { EmptyState } from "../ui/EmptyState";

export interface SchemaDiffHistoryFilters {
  actorEmail: string;
  from: string;
  to: string;
  questionTextLike: string;
}

export interface SchemaDiffHistoryPanelProps {
  readonly initialFilters: SchemaDiffHistoryFilters;
  readonly initialCursor?: string | null;
  readonly showChrome?: boolean;
}

const EMPTY_RESPONSE: SchemaAliasHistoryResponse = {
  ok: true,
  items: [],
  nextCursor: null,
  appliedFilters: {
    action: "schema_diff.alias_assigned",
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    limit: 50,
  },
};

function applyClientFilter(
  items: ReadonlyArray<SchemaAliasHistoryItem>,
  questionTextLike: string,
): SchemaAliasHistoryItem[] {
  const q = questionTextLike.trim().toLowerCase();
  if (q === "") return [...items];
  return items.filter((it) => (it.questionText ?? "").toLowerCase().includes(q));
}

export function SchemaDiffHistoryPanel({
  initialFilters,
  initialCursor = null,
  showChrome = true,
}: SchemaDiffHistoryPanelProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<SchemaDiffHistoryFilters>(initialFilters);
  const [response, setResponse] = useState<SchemaAliasHistoryResponse>(EMPTY_RESPONSE);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isFetching, setIsFetching] = useState(false);
  const didInitialFetch = useRef(false);

  const load = useCallback(
    async (cursor: string | null) => {
      setIsFetching(true);
      setError(null);
      try {
        const params: Parameters<typeof fetchSchemaAliasHistory>[0] = {};
        if (initialFilters.actorEmail) params.actorEmail = initialFilters.actorEmail;
        if (initialFilters.from) params.from = initialFilters.from;
        if (initialFilters.to) params.to = initialFilters.to;
        if (cursor) params.cursor = cursor;
        const r = await fetchSchemaAliasHistory(params);
        setResponse(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "履歴の取得に失敗しました");
      } finally {
        setIsFetching(false);
      }
    },
    [initialFilters.actorEmail, initialFilters.from, initialFilters.to],
  );

  useEffect(() => {
    if (didInitialFetch.current) return;
    didInitialFetch.current = true;
    void load(initialCursor ?? null);
  }, [load, initialCursor]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (filters.actorEmail) q.set("actorEmail", filters.actorEmail.trim().toLowerCase());
    if (filters.from) q.set("from", filters.from);
    if (filters.to) q.set("to", filters.to);
    if (filters.questionTextLike) q.set("questionTextLike", filters.questionTextLike);
    startTransition(() => {
      router.replace(`/admin/schema/history?${q.toString()}`);
    });
  };

  const onNext = useCallback(async () => {
    if (!response.nextCursor) return;
    try {
      const params: Parameters<typeof fetchSchemaAliasHistory>[0] = {
        cursor: response.nextCursor,
      };
      if (filters.actorEmail) params.actorEmail = filters.actorEmail;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const r = await fetchSchemaAliasHistory(params);
      setResponse(r);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "履歴の取得に失敗しました");
    }
  }, [response.nextCursor, filters.actorEmail, filters.from, filters.to]);

  const displayItems = applyClientFilter(response.items, filters.questionTextLike);

  return (
    <section
      aria-labelledby={showChrome ? "schema-history-h" : undefined}
      aria-label={showChrome ? undefined : "schema alias resolve 履歴"}
      data-page="admin-schema-history"
    >
      {showChrome ? (
        <>
          <Breadcrumb
            items={[
              { label: "admin", href: "/admin" },
              { label: "schema", href: "/admin/schema" },
              { label: "history" },
            ]}
          />
          <h1 id="schema-history-h">schema alias resolve 履歴</h1>
        </>
      ) : null}

      <form role="search" aria-label="履歴フィルタ" onSubmit={applyFilters}>
        <FormField name="actorEmail" label="操作者 email">
          <Input
            type="email"
            value={filters.actorEmail}
            onChange={(e) => setFilters((f) => ({ ...f, actorEmail: e.target.value }))}
          />
        </FormField>
        <FormField name="from" label="期間（開始）">
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          />
        </FormField>
        <FormField name="to" label="期間（終了）">
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          />
        </FormField>
        <FormField
          name="questionTextLike"
          label="question 部分一致"
          helper="現在の 50 件以内で部分一致 filter します"
        >
          <Input
            type="text"
            value={filters.questionTextLike}
            onChange={(e) =>
              setFilters((f) => ({ ...f, questionTextLike: e.target.value }))
            }
          />
        </FormField>
        <button type="submit" disabled={isPending}>
          絞り込み
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      {displayItems.length === 0 ? (
        <EmptyState title="該当する履歴がありません" />
      ) : (
        <>
          <div aria-busy={isFetching}>
            <table aria-label="resolve 履歴">
              <thead>
                <tr>
                  <th scope="col">操作日時</th>
                  <th scope="col">操作者 email</th>
                  <th scope="col">before stableKey</th>
                  <th scope="col">after stableKey</th>
                  <th scope="col">question text</th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((it) => (
                  <tr key={it.auditId} data-audit-id={it.auditId}>
                    <td>{it.createdAt}</td>
                    <td>{it.actorEmail ?? "(unknown)"}</td>
                    <td>{it.beforeStableKey ?? "—"}</td>
                    <td>{it.afterStableKey ?? "—"}</td>
                    <td>{it.questionText ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            current={1}
            hasNext={response.nextCursor !== null}
            hasPrev={false}
            onNext={onNext}
            nextLabel="次の 50 件"
            nextAriaLabel="次の 50 件"
          />
        </>
      )}
    </section>
  );
}

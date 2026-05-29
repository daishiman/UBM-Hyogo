# task-B: /admin/tags プロトタイプ整合

[実装区分: 実装仕様書]

## 目的

`/admin/tags` を `docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx` の `AdminTagsPage` 設計言語に合わせる。既存 `TagQueuePanel` の状態遷移 contract（filter / focusMemberId / drawer）は保持する。

## 変更対象ファイル

| パス | 種別 | 変更概要 |
|------|------|---------|
| `apps/web/app/(admin)/admin/tags/page.tsx` | edit | `Breadcrumb` を削除し `PageHead` に置換。`focusMemberId` / `result.error.code` の取り回しは維持 |
| `apps/web/src/components/admin/TagQueuePanel.tsx` | edit | DOM 構造を全面刷新（後述） |
| `apps/web/src/components/admin/__tests__/TagQueuePanel.component.spec.tsx` | edit | 既存ケース維持 + 「Avatar / Chip / sticky / TAGGED セクション」テスト追加 |

## DOM 構造（after）

```tsx
// page.tsx
return (
  <>
    <PageHead
      eyebrow="ADMIN / TAGS"
      title="タグキュー"
      muted="未解決のタグ提案をレビューし、メンバーに割り当てます。"
    >
      <Chip tone="warn" dot>未解決 {queued}件</Chip>
      <Chip tone="ok">解決済 {resolved}件</Chip>
      {dlq > 0 && <Chip tone="danger">DLQ {dlq}件</Chip>}
    </PageHead>

    {result.ok ? (
      <TagQueuePanel
        initial={result.data}
        filter={status}
        focusMemberId={focusMemberId ?? null}
      />
    ) : (
      <AdminSectionErrorClient ... />
    )}
  </>
);
```

```tsx
// TagQueuePanel.tsx
return (
  <section aria-labelledby="tag-queue-h" className="stack-lg">
    <h1 id="tag-queue-h" className="sr-only">タグキュー</h1>

    <div role="group" aria-label="ステータス絞込" className="chip-row">
      {STATUS_OPTIONS.map((v) => (
        <button key={v || "all"} type="button"
          className={"chip" + (filter === (v || undefined) ? " is-active" : "")}
          aria-pressed={filter === (v || undefined)}
          onClick={() => onFilter(v as TagQueueStatus | "")}>
          {LABELS[v] ?? "すべて"}
        </button>
      ))}
    </div>

    {focusMemberId && (
      <p className="muted small">絞込: memberId = <code>{focusMemberId}</code></p>
    )}

    <div className="grid-2 tag-queue-grid">
      <Card padding="lg" aria-label="キュー一覧" data-testid="admin-tag-queue-list">
        <div className="row-between mb-md">
          <h2 className="h-section">割当キュー</h2>
          <Chip tone="accent">{visible.length}件</Chip>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon="checkCircle" title="該当するキューはありません" tone="ok" />
        ) : (
          <ul className="stack-sm" aria-label="キュー項目">
            {visible.map((it) => (
              <li key={it.queueId}>
                <button
                  type="button"
                  onClick={() => setSelected(it.queueId)}
                  aria-pressed={selected === it.queueId}
                  className={"queue-card" + (selected === it.queueId ? " is-selected" : "")}
                >
                  <Avatar name={it.memberId} size="sm" />
                  <div className="grow">
                    <div className="font-medium">{it.memberId}</div>
                    <div className="small muted">{formatDate(it.createdAt)} · {it.status}</div>
                  </div>
                  <Icon name="chevronRight" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {resolvedItems.length > 0 && (
          <>
            <hr className="divider" />
            <div className="eyebrow">TAGGED</div>
            <ul className="stack-sm dim" data-testid="admin-tag-queue-resolved">
              {resolvedItems.slice(0, 4).map((it) => (
                <li key={it.queueId} className="row" onClick={() => setSelected(it.queueId)}>
                  <Avatar name={it.memberId} size="sm" />
                  <div className="grow">
                    <div className="small font-medium">{it.memberId}</div>
                    <div className="chip-row">
                      {parseTags(it.suggestedTagsJson).slice(0, 3).map((t) => <Chip key={t}>{t}</Chip>)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card padding="lg" className="sticky-top" aria-label="レビューパネル"
            data-testid="admin-tag-review-panel">
        {!current ? (
          <EmptyState icon="tag" title="左のキューから項目を選択してください。" />
        ) : (
          <article className="stack">
            <header className="row gap-md">
              <Avatar name={current.memberId} size="lg" />
              <div>
                <h2 className="h-card">queue: {current.queueId}</h2>
                <div className="small muted">
                  memberId <code>{current.memberId}</code> · status <strong>{current.status}</strong>
                </div>
              </div>
            </header>

            <section>
              <div className="eyebrow">SUGGESTED TAGS</div>
              <div className="chip-row mt-sm">
                {currentTags.map((t) => <Chip key={t} tone="accent">{t}</Chip>)}
                {currentTags.length === 0 && <p className="small muted">提案タグなし</p>}
              </div>
            </section>

            {current.reason && (
              <section>
                <div className="eyebrow">REASON</div>
                <p className="small">{current.reason}</p>
              </section>
            )}

            <div className="row-between">
              <Button variant="primary" icon="check"
                      aria-label="resolve"
                      onClick={() => setDrawerOpen(true)}>
                Resolve
              </Button>
            </div>
          </article>
        )}
      </Card>
    </div>

    {current && <TagsQueueResolveDrawer ... 既存通り />}
  </section>
);
```

## 派生 derive

```ts
const visible = items;                    // status filter は SSR 側で適用済み
const resolvedItems = useMemo(
  () => initial.items.filter((i) => i.status === "resolved"),
  [initial.items],
);
const queued = initial.items.filter((i) => i.status === "queued").length;
const resolved = initial.items.filter((i) => i.status === "resolved").length;
const dlq = initial.items.filter((i) => i.status === "dlq").length;
```

> `queued / resolved / dlq` カウントは **page.tsx 側で集計**し、`PageHead` に props として渡す（panel 内ではなく header 表示）。

## 不変条件

- `aria-labelledby="tag-queue-h"` + `<h1 id="tag-queue-h" className="sr-only">` を維持（既存テスト互換）
- `data-testid="admin-tag-queue-list"` / `data-testid="admin-tag-review-panel"` を維持
- `aria-pressed` (filter / queue card) を維持
- Drawer 接続 contract `<TagsQueueResolveDrawer>` を破壊しない
- HEX 直書き 0 件（`bg-[#`, `text-[#`, `#[0-9a-fA-F]{3,6}` の grep が 0）

## テスト方針

`TagQueuePanel.component.spec.tsx` に追加:

1. `it("shows Avatar in each queue card")` — `getAllByRole("img")` または `data-testid` で Avatar が item ごとに描画される
2. `it("renders TAGGED subsection when resolved items exist")` — `data-testid="admin-tag-queue-resolved"` 存在
3. `it("review panel container has sticky-top class")` — `getByTestId("admin-tag-review-panel").className` に `sticky-top` を含む
4. 既存 8 ケース pass を維持

## ローカル実行 / 検証

```bash
mise exec -- pnpm --filter web test -- TagQueuePanel
mise exec -- pnpm --filter web test -- "(admin)/admin/tags"
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# HEX 直書きゼロチェック
grep -rnE "bg-\[#|text-\[#|border-\[#" apps/web/src/components/admin/TagQueuePanel.tsx apps/web/app/\(admin\)/admin/tags/ && exit 1 || echo "OK"
```

## DoD

- 上記 spec / typecheck / lint green
- HEX 直書きゼロ
- 既存 Playwright spec の `data-testid` 参照箇所が壊れていない（`grep -rn "admin-tag-queue-list\|admin-tag-review-panel" apps/web/playwright apps/web/tests` で参照箇所 0 件 or 全て描画される DOM 上に存在）
- 手動ローカル `pnpm --filter web dev` で `/admin/tags` を開き、page-head / grid-2 / sticky 右ペイン / chip / avatar / TAGGED セクションが視認できること

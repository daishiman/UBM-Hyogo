# Phase 2 成果物: diff-design（実装者向け詳細設計）

> 状態: completed。Phase 5 実装者がそのまま着手できる粒度の DOM / 純粋関数 / CSS 詳細設計。

## 1. 純粋関数 詳細

### 1.1 `formatPublishStateLabel`

| 項目 | 内容 |
| --- | --- |
| シグネチャ | `function formatPublishStateLabel(state: string): string` |
| 写像 | `public`→「公開」/ `member_only`→「会員限定」/ `hidden`→「非公開」/ それ以外（`unknown`/空文字/列挙外）→「不明」 |
| 副作用 | なし（純粋関数） |
| 例外 | throw しない（未知値は fail-soft で「不明」） |
| 実装イメージ | `const PUBLISH_STATE_LABEL: Record<string, string> = { public: "公開", member_only: "会員限定", hidden: "非公開" }; return PUBLISH_STATE_LABEL[state] ?? "不明";` |

### 1.2 `buildPublishStateDiff`

| 項目 | 内容 |
| --- | --- |
| シグネチャ | `function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff \| null` |
| 入力 | `item.noteType` / `item.memberSummary.publishState` / `item.memberSummary.isDeleted` / `item.requestedPayload`（`desiredState` を含む `unknown`） |
| 出力（visibility） | `{ kind: "visibility", before: formatPublishStateLabel(publishState), after: formatPublishStateLabel(desiredState 抽出値 ?? "") }` |
| 出力（delete） | `{ kind: "delete", before: "在籍", after: "退会（論理削除）" }` |
| 出力（その他 / null） | `null` |
| `desiredState` 抽出 | `const p = item.requestedPayload; const desired = p && typeof p === "object" && !Array.isArray(p) && typeof (p as Record<string, unknown>).desiredState === "string" ? (p as Record<string, string>).desiredState : "";`（取得不能 → 空文字 → `formatPublishStateLabel("")` = 「不明」） |
| 副作用 | なし |
| 例外 | throw しない |

> `PublishStateDiff` 型は discriminated union（`kind` で判別）。`RequestQueueItem` は `RequestQueuePanel.tsx`（20-34 行）の既存 type を import して使う（新規型を `packages/shared` に追加しない）。

## 2. diff 行 DOM（テストセレクタ正本）

```tsx
<span className="admin-state-diff" data-diff-kind={diff.kind}>
  <span data-diff-side="before">{diff.before}</span>
  <span className="admin-state-diff__arrow" aria-hidden="true"> → </span>
  <span data-diff-side="after">{diff.after}</span>
</span>
```

| セレクタ | 意味 | テスト用途 |
| --- | --- | --- |
| `[data-diff-kind="visibility"]` | 公開状態遷移 | AC-1 検証 |
| `[data-diff-kind="delete"]` | レコード状態遷移 | AC-2 検証（visibility 非露出も） |
| `[data-diff-side="before"]` | 変更前ラベル | AC-1/AC-2/AC-3 |
| `[data-diff-side="after"]` | 変更後ラベル | AC-1/AC-2/AC-3 |
| `.admin-state-diff__arrow[aria-hidden="true"]` | 装飾矢印 | AC-9 |

挿入位置: `<dl>` 内 `種別`（60-61 行）の直後。`<dt>` ラベルは visibility=「公開状態の変更」/ delete=「レコード状態の変更」。

## 3. a11y 設計

- 矢印 `<span aria-hidden="true"> → </span>` は装飾。before/after はテキスト（「公開」/「非公開」）で意味担保。
- `dt`（「公開状態の変更」）+ `dd`（「公開 → 非公開」）の dl 構造で、screen reader は「公開状態の変更、公開（矢印読み飛ばし）非公開」と連続読み上げ。
- 既存 `aria-label="申請詳細"`（45 行）/ `aria-labelledby`（46 行）は不変。

## 4. CSS 詳細（globals.css・全 token・HEX ゼロ）

```css
.admin-state-diff { display: inline-flex; align-items: center; gap: var(--ubm-space-2, 0.5rem); }
.admin-state-diff [data-diff-side="before"] { color: var(--ubm-color-text-secondary); }
.admin-state-diff [data-diff-side="after"] { color: var(--ubm-color-accent-ink); font-weight: 600; }
.admin-state-diff__arrow { color: var(--ubm-color-text-muted); }
.admin-state-diff[data-diff-kind="delete"] [data-diff-side="after"] { color: var(--ubm-color-warn); }
```

| トークン | 用途 | 実在確認（Phase 5） |
| --- | --- | --- |
| `--ubm-color-text-secondary` | before（中立トーン） | `tokens.css` で確認 |
| `--ubm-color-accent-ink` | after（強調・visibility） | `tokens.css` で確認 |
| `--ubm-color-text-muted` | 矢印 | `tokens.css` で確認 |
| `--ubm-color-warn` | after（delete 文脈の退会強調） | `tokens.css` で確認 |
| `--ubm-space-2` | gap（fallback `0.5rem`） | 未定義なら fallback 採用 |

## 5. ダイアログ文言生成 詳細（RequestQueuePanel.tsx）

`destructiveMessage`（143-148 行）を §4（main.md）のスケルトンへ置換。`RequestConfirmDialog.tsx` 92 行表示条件は `isDestructive && destructiveMessage` → `destructiveMessage`（中身があれば表示）へ緩和（Phase 3 決定）。`isDestructive` は `<p role="alert">` の警告トーン制御に限定する。

## 6. 不変条件チェック（設計時点）

| 不変条件 | 設計での担保 |
| --- | --- |
| 3 値限定 | `buildPublishStateDiff` は publishState/isDeleted/desiredState のみ参照 |
| projection 不拡張 | API 不参照・client type のみ |
| 新規 primitive ゼロ | `data-diff-side` 属性 + globals.css のみ |
| HEX ゼロ | `var(--ubm-color-*)` のみ |
| `*.test.tsx` 禁止 | 新規 spec は `*.spec.tsx` |

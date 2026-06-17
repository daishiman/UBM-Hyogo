# Phase 2 成果物: 設計（確定記録）

> 状態: completed。Phase 1 要件をもとに diff 表示の DOM / 純粋関数 / CSS / ダイアログ文言生成 / テスト境界を確定した記録。

## 1. 純粋関数シグネチャ（確定）

```typescript
// RequestQueueDetail.tsx 内（または同階層 helper・配置は Phase 5 で確定）

/** publishState 生値を日本語ラベルへ写像。未知値は fail-soft で「不明」。throw しない。 */
function formatPublishStateLabel(state: string): string;
//   "public" -> "公開" / "member_only" -> "会員限定" / "hidden" -> "非公開" / それ以外 -> "不明"

type PublishStateDiff =
  | { kind: "visibility"; before: string; after: string }   // 日本語ラベル
  | { kind: "delete"; before: string; after: string };      // "在籍" -> "退会（論理削除）"

/** note_type で意味軸分岐した diff を構築。対象外 / item=null は null。throw しない。 */
function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null;
//   visibility_request: before = formatPublishStateLabel(publishState)
//                       after  = formatPublishStateLabel(desiredState)（取得不能なら「不明」）
//   delete_request:    { kind: "delete", before: "在籍", after: "退会（論理削除）" }
//   その他 / null:     null
```

`desiredState` の抽出は既存 `summarizePayload`（12-20 行）の unknown-narrowing パターン（`payload && typeof payload === "object" && !Array.isArray(payload)` で `obj["desiredState"]` を string 判定）を再利用する。

## 2. DOM 設計（確定）

`RequestQueueDetail.tsx` の `<dl>` 内、`種別`（60-61 行）の直後に diff 行を追加する。

```tsx
{(() => {
  const diff = buildPublishStateDiff(item);
  if (!diff) return null;
  const dtLabel = diff.kind === "visibility" ? "公開状態の変更" : "レコード状態の変更";
  return (
    <>
      <dt>{dtLabel}</dt>
      <dd>
        <span className="admin-state-diff" data-diff-kind={diff.kind}>
          <span data-diff-side="before">{diff.before}</span>
          <span className="admin-state-diff__arrow" aria-hidden="true"> → </span>
          <span data-diff-side="after">{diff.after}</span>
        </span>
      </dd>
    </>
  );
})()}
```

- `visibility_request` のとき、既存の `申請内容`（70-73 行 `summarizePayload` の `desiredState: hidden` 生表示）は diff 行へ役割を統合し、生の英語値を画面から除去する（AC-3）。`delete_request` は申請内容 dd を残す（理由等）。
- 既存の `会員`（55-59 行）の `公開状態: {publishState}` は会員サマリの現在値表示として残す（diff 行とは役割が異なる: 会員の素性 vs 承認による遷移）。

## 3. CSS 設計（globals.css・既存トークンのみ）

```css
.admin-state-diff { display: inline-flex; align-items: center; gap: var(--ubm-space-2, 0.5rem); }
.admin-state-diff [data-diff-side="before"] { color: var(--ubm-color-text-secondary); }
.admin-state-diff [data-diff-side="after"] { color: var(--ubm-color-accent-ink); font-weight: 600; }
.admin-state-diff__arrow { color: var(--ubm-color-text-muted); }
.admin-state-diff[data-diff-kind="delete"] [data-diff-side="after"] { color: var(--ubm-color-warn); }
```

HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` を使わない。`--ubm-space-*` の実在トークン名は Phase 5 実装時に `tokens.css` で確認する（未定義なら fallback 値を許容するか既存値へ調整）。新規トークン追加は原則不要。

## 4. ダイアログ文言生成設計（RequestQueuePanel.tsx）

`destructiveMessage`（143-148 行）の生成を以下に置き換える:

```typescript
const destructiveMessage =
  dialogKind === "approve" && dialogItem
    ? dialogItem.noteType === "delete_request"
      ? "退会申請を承認すると、当該会員は論理削除されます（公開ディレクトリから削除）。この操作は取り消しできません。"
      : (() => {
          const diff = buildPublishStateDiff(dialogItem);
          return diff && diff.kind === "visibility"
            ? `公開状態を「${diff.before}」から「${diff.after}」へ変更します。会員へ即時反映されます。`
            : "公開状態を申請内容に応じて変更します。会員へ即時反映されます。"; // fallback（既存文言）
        })()
    : undefined;
```

`buildPublishStateDiff` を `RequestQueueDetail` と共有するため、helper は import 可能な位置に置く（`RequestQueueDetail.tsx` から export、または `apps/web/src/components/admin/` 配下の小 helper ファイル）。配置は Phase 5 で確定。

## 5. RequestConfirmDialog 表示条件（Phase 3 判断事項として明記）

現行 92-94 行は `isDestructive && destructiveMessage` 条件で表示するため、`visibility_request`（`isDestructive=false`）では文言が表示されない。AC-8（visibility でも具体遷移提示）を満たすには表示条件の緩和が必要。最小スコープでの方針判断は Phase 3 で決着させる（→ Phase 3 決定: 92 行を `destructiveMessage` 単独表示へ緩和し、`isDestructive` は警告トーン制御に限定）。

## 6. 統合方針サマリ

| 既存表示 | 扱い |
| --- | --- |
| `会員` の `公開状態: {publishState}`（57 行） | 残す（会員サマリ現在値） |
| `種別`（60-61 行） | 残す。直後に diff 行を追加 |
| `申請内容` `summarizePayload`（70-73 行） | visibility は diff 行へ統合（生英語除去）、delete は残す |

## 7. 完了状態

純粋関数シグネチャ・DOM・CSS・ダイアログ文言生成・統合方針を確定。テストセレクタ（`data-diff-side` / `data-diff-kind` / 矢印 `aria-hidden`）が Phase 4 へ引き継がれる。残判断（92 行緩和 / 申請内容 dd）は Phase 3 へ。

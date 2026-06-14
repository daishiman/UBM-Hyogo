# Phase 5 成果物: runbook（後続実装者向け実装手順書）

> 状態: completed。本 runbook 単体で「どのファイルをどう変えるか」が自明になる粒度。コードは実装しない。

## 1. 変更対象ファイル一覧

| パス | 区分 | 変更概要 |
| --- | --- | --- |
| `apps/web/src/components/admin/RequestQueueDetail.tsx` | 編集 | helper 追加 + diff 行新設 + 申請内容 dd 統合 |
| `apps/web/src/components/admin/RequestQueuePanel.tsx` | 編集 | `destructiveMessage` 文言生成 |
| `apps/web/src/components/admin/RequestConfirmDialog.tsx` | 編集 | 92 行表示条件緩和 |
| `apps/web/src/styles/globals.css` | 編集 | diff 強調クラス追加 |
| `apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx` | 編集 | diff 行 assertion |
| `apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx` | 編集 | 文言 assertion |
| `apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx` | 編集 | 92 行緩和追従 |
| （任意）`apps/web/src/components/admin/publishStateDiff.ts` + `.spec.ts` | 新規 | helper 別ファイル化を選ぶ場合（案 ii） |

## 2. 各ファイル Before/After 責務

| ファイル | Before | After |
| --- | --- | --- |
| RequestQueueDetail.tsx | 現在値（公開状態）と申請内容（desiredState 生表示）を別 dd に分離表示 | diff 行（変更前→変更後）を 1 箇所に強調表示。visibility は申請内容 dd を統合 |
| RequestQueuePanel.tsx | `destructiveMessage` は汎用文言のみ | note_type 別の具体遷移文言を生成 |
| RequestConfirmDialog.tsx | `isDestructive && destructiveMessage` でのみ文言表示（visibility は非表示） | `destructiveMessage` 単独表示（visibility でも遷移文言が出る）。`isDestructive` は警告トーン制御に限定 |
| globals.css | diff 強調クラス無し | `.admin-state-diff` 系クラスで before/after/矢印/delete を色分け |

## 3. 純粋関数スケルトン（RequestQueueDetail.tsx・案 i / 別ファイル案 ii）

```typescript
import type { RequestQueueItem } from "./RequestQueuePanel"; // 既存 type を import（案 ii の別ファイル時）

const PUBLISH_STATE_LABEL: Record<string, string> = {
  public: "公開",
  member_only: "会員限定",
  hidden: "非公開",
};

export function formatPublishStateLabel(state: string): string {
  return PUBLISH_STATE_LABEL[state] ?? "不明";
}

export type PublishStateDiff =
  | { kind: "visibility"; before: string; after: string }
  | { kind: "delete"; before: string; after: string };

export function buildPublishStateDiff(item: RequestQueueItem): PublishStateDiff | null {
  if (!item) return null;
  if (item.noteType === "delete_request") {
    return { kind: "delete", before: "在籍", after: "退会（論理削除）" };
  }
  if (item.noteType === "visibility_request") {
    const p = item.requestedPayload;
    const desired =
      p && typeof p === "object" && !Array.isArray(p) &&
      typeof (p as Record<string, unknown>).desiredState === "string"
        ? (p as Record<string, string>).desiredState
        : "";
    return {
      kind: "visibility",
      before: formatPublishStateLabel(item.memberSummary.publishState),
      after: formatPublishStateLabel(desired),
    };
  }
  return null;
}
```

> throw しない（fail-soft）。`desiredState` 抽出失敗時は空文字 → `formatPublishStateLabel("")` = 「不明」。`item.noteType` の literal は既存 type の判別子に合わせる（実装時に `RequestQueueItem` の `noteType` 値を確認）。

## 4. diff 行 DOM スケルトン（RequestQueueDetail.tsx）

`<dl>` 内 `種別`（60-61 行）の直後に挿入:

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

- `visibility_request` のとき、既存 `申請内容`（70-73 行 `summarizePayload` の生 `desiredState` 表示）は出さない（diff 行へ統合）。`delete_request` は申請内容 dd を残す（理由等）。
- `会員` の `公開状態: {publishState}`（57 行）は会員サマリ現在値として残す。

## 5. globals.css 追加クラス（全 token・HEX ゼロ）

```css
.admin-state-diff { display: inline-flex; align-items: center; gap: var(--ubm-space-2, 0.5rem); }
.admin-state-diff [data-diff-side="before"] { color: var(--ubm-color-text-secondary); }
.admin-state-diff [data-diff-side="after"] { color: var(--ubm-color-accent-ink); font-weight: 600; }
.admin-state-diff__arrow { color: var(--ubm-color-text-muted); }
.admin-state-diff[data-diff-kind="delete"] [data-diff-side="after"] { color: var(--ubm-color-warn); }
```

実装前に `apps/web/src/styles/tokens.css` で `--ubm-color-text-secondary` / `--ubm-color-accent-ink` / `--ubm-color-text-muted` / `--ubm-color-warn` / `--ubm-space-2` の実在を確認。未定義トークンは既存定義済みの近傍トークンへ調整（新規追加は原則回避。やむを得ない場合のみ `tokens.css` + `09b-design-tokens.md` を両正本同期）。

## 6. destructiveMessage 文言生成スケルトン（RequestQueuePanel.tsx 143-148 行置換）

```typescript
const destructiveMessage =
  dialogKind === "approve" && dialogItem
    ? dialogItem.noteType === "delete_request"
      ? "退会申請を承認すると、当該会員は論理削除されます（公開ディレクトリから削除）。この操作は取り消しできません。"
      : (() => {
          const diff = buildPublishStateDiff(dialogItem);
          return diff && diff.kind === "visibility"
            ? `公開状態を「${diff.before}」から「${diff.after}」へ変更します。会員へ即時反映されます。`
            : "公開状態を申請内容に応じて変更します。会員へ即時反映されます。";
        })()
    : undefined;
```

> 既存の `dialogKind` / `dialogItem` 変数名は現行コードに合わせる（実装時に確認）。`buildPublishStateDiff` を import（案 i は `RequestQueueDetail` から、案 ii は helper ファイルから）。

## 7. RequestConfirmDialog 92 行表示条件緩和

```diff
- {isDestructive && destructiveMessage ? (
+ {destructiveMessage ? (
    <p role="alert" ...>{destructiveMessage}</p>
  ) : null}
```

- `isDestructive` は `<p>` の警告トーン（class / `role="alert"` の強調）制御に限定。文言の有無は `destructiveMessage` 単独で判定。
- `RequestConfirmDialog.spec.tsx` の該当 assertion を「`isDestructive=false` + `destructiveMessage` あり で文言が表示される」へ更新。

## 8. 挙動不変温存の確認手順

- `会員` の `公開状態: {publishState}`（57 行）が残ること。
- 承認・却下フロー（`POST /admin/requests/:noteId/resolve` 呼び出し）が不変。
- ルート `/admin/requests` / 既存 `aria-label` / testid が不変。
- `delete_request` の警告トーン（`role="alert"`）が維持されること。

## 9. ローカル検証コマンド

`outputs/phase-05/main.md` ⑤ と同一（typecheck / lint / focused vitest 3 spec / HEX grep gate / `git diff -- apps/api packages/shared` 空確認）。

## 10. TC → 変更ファイル マップ

| TC | Green 化する変更 |
| --- | --- |
| TC-01/02/03/04/05 | RequestQueueDetail.tsx diff 行 + helper |
| TC-06/07 | RequestQueueDetail.tsx 矢印 aria-hidden / 既存 aria 不変 |
| TC-08/09/10 | helper（`formatPublishStateLabel` / `buildPublishStateDiff`） |
| TC-11/12 | RequestQueuePanel.tsx `destructiveMessage` + RequestConfirmDialog.tsx 92 行緩和 |
| TC-R-01/02/03 | 既存 spec 追従（緩和反映） |

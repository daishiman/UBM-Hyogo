# UI 状態機械 設計 — SchemaDiffPanel recompute UI

対象: `apps/web/src/components/admin/SchemaDiffPanel.tsx`。
置換対象: `248-250` の `data-role="recompute-warning"`（「再集計実行は本タスク外です（別途運用フォロー）」）。

## 方針

rollback 成功後に表示される post-rollback action 領域に、**実 recompute 実行ボタン + status バッジ**を追加する。rollback 前の確認 modal では recompute API の前提（soft-deleted alias）を満たさないためボタンを出さない。rollback 直後の自動実行はしない（admin 明示操作）。

## 状態（UI local state）

```ts
type RecomputeUiStatus = "idle" | "submitting" | "completed" | "running" | "failed";
// idle: 未実行 / submitting: API 呼び出し中 / running: server 側継続中（CPU budget 跨ぎ）
// completed: 完了 / failed: 失敗
```

job の真実は server（D1）。UI は API レスポンス + GET status から `RecomputeUiStatus` を導出する（UI に真実を持たない / Phase 02 topology 準拠）。

## 状態遷移

```
[idle]
  │ 「再集計実行」ボタン押下（admin 明示, AC-5）
  ▼
[submitting]  ← ボタン disable（AC-6: request in-flight の二重押下防止）
  │
  ├─ API 200 status=completed ─► [completed]（バッジ「再集計済み」+ processedCount 表示）
  ├─ API 200 status=running  ─► [running]（server job は継続可能。バッジ「再集計中」+「再集計を続行」ボタン再表示、disable 解除）
  └─ API error               ─► [failed]（バッジ「失敗」+ lastError + 「再試行」ボタン）
```

- `running` / `failed` からは再度ボタン押下可（server-derived triggerKey で継続 / 再試行 → idempotent）。二重押下防止の disable 対象は `submitting` のみで、server `running` は「継続可能な停止点」として扱う。
- `completed` は再押下で no-op（server が completed job を冪等返却）。表示は「再集計済み」。

## DOM 構造（data-role）

```tsx
{postRollbackRecompute && (
  <div data-role="recompute-action">
    <button
      type="button"
      data-role="recompute-trigger"
      disabled={uiStatus === "submitting"}
      aria-disabled={uiStatus === "submitting"}
      onClick={() => handleRecompute(postRollbackRecompute.aliasId)}
    >
      {uiStatus === "completed" ? "再集計済み"
        : uiStatus === "running" ? "再集計を続行"
        : uiStatus === "failed" ? "再集計を再試行"
        : "再集計を実行"}
    </button>
    <span data-role="recompute-status" data-status={uiStatus}>
      {/* pending/running/completed/failed バッジ */}
    </span>
    {processedCount !== null && <span data-role="recompute-processed-count">処理件数: {processedCount}</span>}
    {uiStatus === "failed" && <p data-role="recompute-error">{lastError}</p>}
  </div>
)}
```

> `recompute-warning`（248-250）は撤去し、「再集計実行は本タスク外」文言は削除する。代わりに `recompute-action` を配置。

## mutation 配線（AC-9 / CLAUDE.md #10）

```ts
import { useAdminMutation } from "@/features/admin/hooks/useAdminMutation";
import { recomputeSchemaAlias } from "@/lib/admin/api";

const recomputeMutation = useAdminMutation({
  mutationFn: () => recomputeSchemaAlias({ aliasId: postRollbackRecompute.aliasId }),
  onSuccess: (res) => setUiStatus(res.status === "completed" ? "completed" : "running"),
  onError: () => setUiStatus("failed"),
});
const handleRecompute = () => { setUiStatus("submitting"); recomputeMutation.mutate(); };
```

- `@/lib/useAdminMutation`（legacy）は使わない（CLAUDE.md #10）。
- toast: 既存 rollback の toast パターン（`SchemaDiffPanel.tsx:423` の `label`）に合わせ「再集計を実行しました（処理件数: N）」を表示。

## status バッジの token（AC-10）

| status | 意味色 | token（OKLch 既存 token のみ・HEX 禁止） |
| --- | --- | --- |
| completed | success | 既存 success/positive token（例 `text-[var(--color-success)]` 相当の既存 utility） |
| running | info | 既存 info token |
| failed | danger | 既存 danger/error token |

> 具体 token クラスは `apps/web/src/styles/tokens.css` と既存 SchemaDiffPanel の警告 text が使う token に揃える。新規 token / HEX 直書きは禁止（`verify-design-tokens` gate）。

## アクセシビリティ

- ボタンは `type="button"`、disable 時は `aria-disabled` を併記。
- status バッジは `role="status"` + `aria-live="polite"` で screen reader へ通知。
- 初期表示時は `getSchemaAliasRecomputeStatus(aliasId)` で直近 job を読み、`running` / `completed` / `failed` の既存状態を UI に反映する。polling は必須にしないが、`running` の「続行」操作は同じ server-derived triggerKey の job を継続する。

## AC トレース

| AC | 担保 |
| --- | --- |
| AC-5 | ボタン押下でのみ API 呼び出し（自動実行なし） |
| AC-6 | warning 置換 + submitting 中 disable + status バッジ |
| AC-9 | useAdminMutation 経由 |
| AC-10 | OKLch token のみ |

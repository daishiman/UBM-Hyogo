# Phase 9: 品質保証

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

`taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 9.1 品質ゲート方針

本タスクは **単一 component の編集タスク**（新規 file 作成・file 削除なし）。編集対象は 3 file（`IdentityConflictRow.tsx` / `__tests__/IdentityConflictRow.spec.tsx` / `playwright/tests/admin-identity-conflicts.spec.ts`）のみ。したがって line budget / mirror parity / ファイル削除判定（FB-UI-02-1）は本実装では原則 N/A だが、観点として明示確認する。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 既存 component への小差分（state 1行 + guard 1行統合 + handler 数行）。新規 file なし |
| mirror parity（生成物の左右一致） | **N/A** — mirror 生成物を持たないタスク。ただし `apps/api/src/components` 等への波及がないことを grep で確認（編集は `apps/web/src/components/admin` に閉じる） |
| FB-UI-02-1（ファイル削除判定: git delete OR stub 化かつ live import ゼロ） | **N/A** — 本タスクは削除なし。削除対象ファイルは存在せず、`IdentityConflictRow` への live import も維持される |
| link（参照リンク健全性） | 編集 3 file 間の import 経路（`useAdminMutation` / primitive）が解決すること（typecheck で担保） |

実施する品質ゲートは下表の **一括判定セット**（typecheck / lint / focused vitest / Playwright focused / OKLch token gate / legacy hook grep）に限定する。

## 9.2 品質ゲート一括判定セット

| # | ゲート | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0） |
| 2 | lint | `mise exec -- pnpm lint` | green（違反 0。残れば `pnpm lint --fix` → 手修正） |
| 3 | focused vitest | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 全ケース PASS（dismiss optimistic hide / rollback / success-stays-hidden 追加分 + merge 既存ケース回帰含む） |
| 4 | Playwright focused | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts` | 「dismiss 後即時消失」「server error で復元」シナリオ含め PASS。merge 既存シナリオも PASS |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | 新規 HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロで PASS |
| 6 | legacy hook 未参照 grep | `grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx` | **0 件**（不変条件 #10） |

> 5・6 は実コード変更が極小（state 追加 + guard 合流 + handler 差し替えのみ）のため違反リスクは構造的に低いが、明示ゲートとして列挙し見落としを防ぐ。

## 9.3 ゲート詳細

### ゲート 5: OKLch トークン gate（`verify-design-tokens`）

- 本タスクの差分は `setOptimisticDismissed` state 追加・render guard の OR 合流・`onDismiss` 本体差し替えに限定され、**色を持つ新規 markup を一切追加しない**。
- rollback 後の inline error 表示は既存 `dismissError` markup（`text-[var(--ubm-color-danger)]` / `role="alert"` / `aria-live="polite"`）を流用するため、新規トークン参照も追加しない（不変条件 #2）。
- 判定: HEX 直書き / `bg-[#...]` / `text-[#...]` の新規導入が diff に存在しないことを確認 → PASS。

### ゲート 6: legacy hook 未参照 grep

```bash
grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx
# 期待: 出力なし（exit 1 / 0 件）
```

- `IdentityConflictRow.tsx` の import は `import { useAdminMutation } from "../../features/admin/hooks";`（features 経由）のまま。
- `dismissMutation` は既存どおり `useAdminMutation` 経由で生成し、legacy `@/lib/useAdminMutation` への参照を新規に増やさない（不変条件 #10）。

## 9.4 vitest 追加ケースの green 要件（Phase 4 / 6 整合）

| ケース | 期待 | 既存テストへの影響 |
| --- | --- | --- |
| dismiss optimistic hide | 「別人として確定」click 直後に row（`conflict: ...` テキスト等）が DOM から消える（`queryByText` が null） | 新規ケース |
| dismiss rollback | `dismissMutation.trigger` reject 後に row が復元し、inline `dismissError`（`role="alert"`）が surface する。`dismissReason` が保持される | 新規ケース |
| dismiss success-stays-hidden | trigger resolve 後も row は消えたまま（`return null` 維持） | 新規ケース |
| cross-state 非波及 | dismiss reject が `optimisticMerged` に影響しない / merge reject が `optimisticDismissed` に影響しない | 新規ケース（Phase 3.4 リスク固定） |
| merge 既存 10 ケース | 既存どおり全 PASS（merge optimistic / rollback / 二段階 confirm / dismiss stage 既存遷移） | **回帰確認**（render guard を OR 合流しても merge 挙動不変であること） |

> 既存 merge 系テストは不変（変更しない）。render guard を `optimisticMerged || optimisticDismissed` に合流させても `optimisticDismissed` の初期値が `false` のため merge 系の評価結果は変わらない。

## 9.5 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | `optimisticDismissed` の型（`boolean`）と `useState(false)` の初期値整合を確認。明白な型不整合を最小差分で修正 |
| lint | `pnpm lint --fix` を試行 → 残る違反のみ手修正 |
| vitest | RED の原因を assertion 期待値に切り分け。特に「state 値だけ assert していて DOM 消失を見ていない」consumer 欠落（Phase 10.2）に注意 |
| playwright | route mount / mock 設定を確認。capture は別 Phase（11）であり e2e 自体の green を優先。merge 回帰シナリオの red は guard 合流ミスを疑う |

## 9.6 品質判定

**GATE: PASS（実装後に上記 6 ゲートが all-green であること）** — line budget / mirror parity / 削除判定は N/A。実施ゲートは typecheck / lint / focused vitest / Playwright focused / OKLch token / legacy hook grep の一括セットに限定。merge 既存テストの回帰なしを必須条件とする。

# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## 9.1 品質ゲート方針

本タスクは **単一 component の編集タスク**（新規 file 作成・file 削除なし）。したがって line budget / mirror parity / ファイル削除判定（FB-UI-02-1）は本実装の対象外とする。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 既存 component への小差分。新規 file なし |
| mirror parity（生成物の左右一致） | **N/A** — mirror 生成物を持たないタスク |
| FB-UI-02-1（ファイル削除判定） | **N/A** — 削除ではなく `IdentityConflictRow.tsx` 等 3 file の編集タスク。削除対象ファイルは存在しない |

実施する品質ゲートは下表の **一括判定セット**（typecheck / lint / vitest / playwright / OKLch token gate / legacy hook grep）に限定する。

## 9.2 品質ゲート一括判定セット

| # | ゲート | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0） |
| 2 | lint | `mise exec -- pnpm --filter web lint` | green（違反 0。残れば `lint --fix` → 手修正） |
| 3 | focused vitest | `mise exec -- pnpm --filter web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 全ケース PASS（optimistic hide / rollback / success-stays-hidden 追加分含む） |
| 4 | playwright e2e | `mise exec -- pnpm --filter web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts` | 「merge 後即時消失」「server error で復元」シナリオ含め PASS |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | 新規 HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロで PASS |
| 6 | legacy hook 未参照 grep | `grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx` | **0 件**（不変条件 #10） |

> 5・6 は実コード変更が極小（`return null` 分岐と state 追加のみ）のため違反リスクは構造的に低いが、明示ゲートとして列挙し見落としを防ぐ。

## 9.3 ゲート詳細

### ゲート 5: OKLch トークン gate（`verify-design-tokens`）

- 本タスクの markup 追加は `if (optimisticMerged) return null;` のみで、色を持つ新規 markup を **一切追加しない**。
- rollback 後の inline error 表示は既存 `mergeError` markup（`text-[var(--ubm-color-danger)]` / `role="alert"`）を流用するため、新規トークン参照も追加しない。
- 判定: HEX 直書き / `bg-[#...]` / `text-[#...]` の新規導入が diff に存在しないことを確認 → PASS。

### ゲート 6: legacy hook 未参照 grep

```bash
grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx
# 期待: 出力なし（exit 1 / 0 件）
```

- `IdentityConflictRow.tsx` の import は `import { useAdminMutation } from "../../features/admin/hooks";`（features 経由）のまま。
- legacy `@/lib/useAdminMutation` への参照を新規に増やさない（不変条件 #10）。

## 9.4 vitest 追加ケースの green 要件（Phase 6 整合）

| ケース | 期待 | 既存テストへの影響 |
| --- | --- | --- |
| optimistic hide | merge 実行 click 直後に row（`conflict: ...` テキスト等）が DOM から消える | 新規ケース |
| rollback | trigger reject 後に row が復元し、inline error（`role="alert"`）が surface する | 新規ケース |
| success-stays-hidden | trigger resolve 後も row は消えたまま（`return null` 維持） | **既存 success ケースの assertion 更新**（Phase 3.3 §3.3 既知事項。「success → stage idle 復帰で merge ボタン再表示」→「success → row 消失維持」へ期待値変更） |

> 既存 dismiss 系テストは不変（変更しない）。dismiss 経路に optimistic を入れないため assertion も維持。

## 9.5 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | `optimisticMerged` の型（`boolean`）と `useState(false)` の初期値整合を確認。明白な型不整合を最小差分で修正 |
| lint | `pnpm lint --fix` を試行 → 残る違反のみ手修正 |
| vitest | RED の原因を assertion 期待値（success-stays-hidden への変更漏れ等）に切り分け |
| playwright | route mount / mock 設定を確認。capture は別 Phase（11）であり e2e 自体の green を優先 |

## 9.6 品質判定

**GATE: PASS（実装後に上記 6 ゲートが all-green であること）** — line budget / mirror parity / 削除判定は N/A。実施ゲートは typecheck / lint / vitest / playwright / OKLch token / legacy hook grep の一括セットに限定。

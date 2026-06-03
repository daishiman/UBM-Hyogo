# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION` / `workflow_state: implemented_local_evidence_captured`

## メタ情報

| 項目 | 値 |
| --- | --- |
| Issue | #1042（identity-conflicts dismiss optimistic update / FU-AIDC-006） |
| 対象 component | `apps/web/src/components/admin/IdentityConflictRow.tsx` |
| 本フェーズの目的 | spec docs の品質ゲート（link / parity / token gate）と、実装時に走らせる QA コマンドの確定 |

## 9.1 品質ゲート方針

本タスクは **実装済み（implemented_local_evidence_captured）** であり、対象実装は **単一 component の編集**（新規 file 作成・file 削除なし）。したがって品質ゲートは 2 系統に分けて扱う。

- **(A) spec docs 自体の QA**: 本サイクルで満たすべきゲート（link 整合 / artifacts parity / OKLch HEX なし）。
- **(B) 実装時に走らせる QA**: 本サイクルで all-green を確認したコマンド群。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 既存 component への小差分。新規 file なし |
| mirror parity（生成物の左右一致） | 本タスクは `artifacts.json` ↔ `outputs/artifacts.json` の byte 一致のみ対象（§9.2 #3） |
| FB-UI-02-1（ファイル削除確認 PASS 基準） | **N/A（該当なし）** — 削除ではなく `IdentityConflictRow.tsx` 等 3 file の編集タスク。削除対象ファイルは存在しないため削除確認ゲートは適用されない |

## 9.2 (A) spec docs QA ゲート（本サイクルで満たす）

| # | ゲート | コマンド / 確認 | 期待結果 |
| --- | --- | --- | --- |
| 1 | spec ファイル群 link 整合 | phase-8〜13 / Phase 11 補助ファイルの相対リンク・canonical 名が相互に一致（FB-LLM-MOD-05-001） | dead link 0 / 名称ズレ 0 |
| 2 | artifacts gate metadata | `mise exec -- pnpm gate-metadata:validate` | ERROR 0（Gate-A passed / Gate-B passed / Gate-C pending） |
| 3 | artifacts parity（byte 一致） | `diff outputs/artifacts.json artifacts.json` 相当（root ↔ outputs を `cp` で byte-identical 維持） | 差分 0 |
| 4 | phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | ok:true（compliance-check 9 見出し充足） |
| 5 | indexes drift なし | `mise exec -- pnpm indexes:rebuild` | drift 0（冪等） |

## 9.3 (B) 実装時に走らせる QA コマンド一覧（後続サイクル・user-gated）

> 本サイクルでは実行しない。実装サイクルで all-green を要求する。

| # | ゲート | コマンド | 期待結果 | 対応 AC |
| --- | --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0） | AC-8 |
| 2 | lint（`@ubm-hyogo/web`） | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | green（違反 0。残れば `lint --fix` → 手修正） | AC-8 |
| 3 | focused vitest | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 全ケース PASS（dismiss optimistic hide / rollback+理由保持 / success-stays-hidden / merge 非回帰） | AC-6 |
| 4 | playwright focused | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts --grep "dismiss\|optimistic\|rollback"` | dismiss 即時消失 / server error 復元 シナリオ含め PASS | AC-7 |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | 新規 HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロで PASS | AC-2（token） |
| 6 | legacy hook 未参照 grep | `grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx` | **0 件**（不変条件 #10） | AC-9 |

## 9.4 ゲート詳細

### ゲート 5: OKLch トークン gate（`verify-design-tokens`）

- 本タスクの markup 追加は `if (optimisticMerged || optimisticDismissed) return null;` の OR 統合のみで、色を持つ新規 markup を **一切追加しない**。
- rollback 後の inline error 表示は既存 dismiss error markup（`text-[var(--ubm-color-danger)]` / `role="alert"`）を流用するため、新規トークン参照も追加しない。
- 判定: HEX 直書き / `bg-[#...]` / `text-[#...]` の新規導入が diff に存在しないことを確認 → PASS。

### ゲート 6: legacy hook 未参照 grep（AC-9）

```bash
grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx
# 期待: 出力なし（exit 1 / 0 件）
```

- `IdentityConflictRow.tsx` の import は `import { useAdminMutation } from "../../features/admin/hooks";`（features 経由）のまま。
- legacy `@/lib/useAdminMutation` への参照を新規に増やさない（不変条件 #10 / AC-9）。

## 9.5 vitest 追加ケースの green 要件（Phase 6 整合）

| ケース | 期待 | 既存テストへの影響 |
| --- | --- | --- |
| dismiss optimistic hide | dismiss 実行 click 直後に row が DOM から消える（`queryByText(...)` が null） | 新規ケース |
| dismiss rollback + 理由保持 | trigger reject 後に row が復元し、inline error（`role="alert"`）が surface し、`dismissReason` 入力値が保持される | 新規ケース |
| dismiss success-stays-hidden | trigger resolve 後も row は消えたまま（`return null` 維持） | 新規ケース |
| merge 非回帰 | 既存 merge optimistic / rollback / success ケースが不変で PASS | **既存ケース維持**（assertion 変更なし） |

> 既存 merge 系テストは不変（変更しない）。dismiss に optimistic を追加しても merge の assertion は維持。

## 9.6 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | `optimisticDismissed` の型（`boolean`）と `useState(false)` の初期値整合を確認。明白な型不整合を最小差分で修正 |
| lint | `pnpm --filter @ubm-hyogo/web lint --fix` を試行 → 残る違反のみ手修正 |
| vitest | RED の原因を assertion 期待値（dismiss optimistic の consumer 分岐欠落 / 理由保持漏れ等）に切り分け |
| playwright | route mount / mock 設定を確認。capture は別 Phase（11）であり e2e 自体の green を優先 |

## 9.7 品質判定

**GATE: PASS** —
- (A) spec docs QA: link 整合 / artifacts parity（byte 一致）/ gate-metadata / phase12 compliance / indexes drift を本サイクルで満たす。
- (B) 実装時 QA: typecheck / lint / focused vitest / playwright focused / OKLch token / legacy hook grep の 6 ゲートを実装サイクルで all-green とする。
- line budget / mirror parity（spec 以外）/ ファイル削除確認（FB-UI-02-1）は本タスク該当なし（ファイル削除なし）。

## 完了条件

- [ ] spec docs QA（link / artifacts parity byte 一致 / gate-metadata / phase12 / indexes）を §9.2 に列挙している。
- [ ] 実装時 QA コマンド（typecheck / lint / focused vitest / playwright focused）を表（§9.3）にしている。
- [ ] OKLch HEX 直書きなし（`verify-design-tokens`）と legacy `@/lib/useAdminMutation` grep 0 件（AC-9）を明記している。
- [ ] `@ubm-hyogo/web` lint を対象に含めている。
- [ ] Phase 9 削除確認 PASS 基準（FB-UI-02-1）が本タスク該当なし（ファイル削除なし）と明記している。
- [ ] 末尾に品質判定（§9.7 GATE）を置いている。

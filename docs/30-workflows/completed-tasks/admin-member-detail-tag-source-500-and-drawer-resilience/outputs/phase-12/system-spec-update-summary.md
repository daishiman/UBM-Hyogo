# Phase 12: システム仕様更新サマリ（system-spec-update-summary）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | implementation |
| visualEvidence | VISUAL |
| workflow_state | implemented_local_evidence_captured |

## 目的

本ワークフローの実装仕様が既存システム仕様・skill reference へ与える影響を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録し、workflow-local sync と global skill sync を分離して管理する。本 wave は `implemented_local_evidence_captured` のため Step 1-A〜1-C を N/A にせず same-wave sync で閉じる。

## Step 1-A: 既存システム仕様（specs/）への影響評価

| 仕様 | 影響 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md`（`/admin/members/:id` レスポンス・tag source 値ドメイン） | response shape・path は不変（AC-6）。fail-soft 正規化は view object 構築時の値正規化のみで契約は不変。必要なら source 値ドメインに「DB は CHECK 制約なし＝任意文字列」「view 層は normalizeTagSource で 3 値へ畳む」注記のみ検討（任意） | 仕様変更なし（注記は任意・本 wave 未更新） |
| `docs/00-getting-started-manual/specs/11-admin-management.md`（admin 管理画面・詳細ドロワー） | 詳細 API の表示挙動（500 解消・再試行導線）は UI 防御強化であり管理機能の契約は不変 | 仕様変更なし |
| `docs/00-getting-started-manual/specs/08-free-database.md`（D1 構成・schema） | `member_tags.source` schema・migration・seed は不変（AC-6） | 仕様変更なし |

Step 1-A 結論: 既存 specs への文面変更は **該当なし**。`/admin/members/:id` の契約・D1 schema は不変。

## Step 1-B: 実装状況（implemented_local_evidence_captured）

| 項目 | 状況 |
| --- | --- |
| 実装状況 | implemented_local_evidence_captured（local code implementation・focused Vitest・typecheck は完了） |
| 実装ファイル | `packages/shared/src/types/common.ts`(編集) / `packages/shared/src/zod/primitives.ts`(編集) / `apps/api/src/repository/_shared/builder.ts`(編集) / `apps/web/src/features/admin/components/_members/MemberDrawer.tsx`(編集) |
| テストファイル | `packages/shared/src/zod/viewmodel.spec.ts` / `packages/shared/src/__tests__/type-contracts.spec.ts` / `apps/api/src/repository/__tests__/builder.repository.spec.ts` / `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` |
| 実行記録 | focused Vitest 4 files / 70 tests PASS、shared/api/web typecheck PASS、`pnpm lint` PASS、verify:no-inline-style PASS。staging runtime screenshot は user-gated |

## Step 1-C: skill reference（aiworkflow-requirements）への影響評価

| 参照 | 影響 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/*`（UI 導線 / error 表示方針） | 既存 `Button` primitive と導線方針に従う。新規 primitive を生やさない。`reloadKey` ベースの再 fetch は既存 React パターン | same-wave sync 済み |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active ledger） | 本ワークフローを active ledger へ登録（same-wave で completed へ移動） | same-wave sync 済み |
| `.claude/skills/aiworkflow-requirements/indexes/*` | 本ワークフローは新規 architectural pattern を導入しない（純関数正規化は既存 fail-soft パターンと同列） | same-wave sync 済み |

## Step 2: 新規 interface / 型定義の追加

該当 **あり**（純関数 export 追加のみ・型 union は不変）。

```ts
// packages/shared/src/types/common.ts（追加 export）
export function normalizeTagSource(raw: string | null | undefined): TagSource;
// 既存 export type TagSource = "rule" | "ai" | "manual"; は不変（拡張しない）
```

- `normalizeTagSource` は新規 export 関数だが、入出力型は既存 `TagSource` union（3 値）に閉じ、新規型・新規 union 値を生やさない。
- `TagSourceZ` の `.catch("manual")` は出力型不変（runtime のフォールバック挙動のみ追加）。
- 新規コンポーネント・新規 primitive・新規 endpoint・新規 D1 schema は無し。`MemberDrawer` の `reloadKey` は内部 state であり公開 props（`MemberDrawerProps`）は不変。

## workflow-local sync

| 対象 | 状況 |
| --- | --- |
| `outputs/phase-12/*`（strict 7） | 本 wave で生成（present） |
| `outputs/phase-11/manual-test-result.md` + screenshots metadata | 本 wave で生成（present・PNG 0 件 / status=staging_visual_pending_user_gate） |
| `artifacts.json` / `outputs/artifacts.json` | phase status / workflow_state = implemented_local_evidence_captured を byte-identical に保持 |

## global skill sync

| 対象 | 状況 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/references/*` | artifact inventory / active ledger を same-wave sync 済み |
| `.claude/skills/aiworkflow-requirements/indexes/*` | quick-reference / resource-map を same-wave sync 済み |

## 完了条件

- [x] Step 1-A（既存 specs 影響: 該当なし）を記録
- [x] Step 1-B（実装状況: implemented_local_evidence_captured）を記録
- [x] Step 1-C（skill reference 影響: artifact inventory / active ledger / quick-reference / resource-map same-wave sync）を記録
- [x] Step 2（新規 interface: `normalizeTagSource` export ありとして記述・union 不変）を記録
- [x] workflow-local sync と global skill sync を別ブロックで記録

## 成果物

- `outputs/phase-12/system-spec-update-summary.md`（本ファイル）

## 参照資料

- `index.md`（不変条件・正本順位・参照仕様 §7）
- `_shared-context.md` §2（Lane A `normalizeTagSource` / `TagSourceZ` 定義）

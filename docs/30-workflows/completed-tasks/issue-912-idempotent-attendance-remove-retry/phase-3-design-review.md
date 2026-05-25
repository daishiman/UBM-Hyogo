# Phase 3: 設計レビュー（Gate-A）

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 3
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 3 (設計レビュー) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-3-design-review.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. レビュー観点

| 観点 | 判定 | 根拠 |
|---|---|---|
| CLAUDE.md 不変条件 #1（既存 API endpoint surface のみ） | PASS | DELETE endpoint は `apps/api/src/routes/admin/attendance.ts:177-199` に既存 |
| CLAUDE.md 不変条件 #5（D1 直接アクセス禁止） | PASS | 改修は `apps/web` 内に閉じる |
| CLAUDE.md 不変条件 #8（test suffix `*.spec.{ts,tsx}`） | PASS | 拡張対象は既存 `MeetingPanel.component.spec.tsx` |
| CLAUDE.md 不変条件 #10（admin mutation は `useAdminMutation` 経由） | PASS | 解除側も `useAdminMutation(endpoint, "DELETE", ...)` を使用 |
| issue-842 invariant: retry は idempotent method 限定 | PASS | DELETE のみに付与。add 側 POST は型レベルで retry 不可 |
| `mutationFn` 経路の不適用 | PASS | 解除側は `mutationFn` を使わず素の fetch 経路で動作（hook L207-217 分岐で timeout/retry/abort/idempotency-key 適用） |
| 既存挙動の保持 | PASS | 404 race / 409 / 楽観 UI / `router.refresh` の各既存挙動は §2.3 マトリクスで保持を明示 |
| AC の検証可能性 | PASS | 全 AC が spec / 型 / コード grep のいずれかで検証可能 |
| スコープ単一サイクル完結性（CONST_007） | PASS | helper + Panel + spec の 3 ファイルで完結。将来 task 送りなし |

## 2. リスク再評価

| リスク | 残存度 | 補足 |
|---|---|---|
| DELETE body の払い方 | 低 | `payload=null` に固定。spec で body=`"null"` を assert |
| server 側 dedupe 未実装による二重書き込み | 低 | DELETE が naturally idempotent。re-delete は 404 race で吸収 |
| AC-5 注記（idempotency-key の retry 内同一/別値） | 低 | spec では「送出されること」のみ assert（実装事実尊重） |

## 3. Gate-A 判定

**PASS**: spec_review として `passed`。Phase 4 以降に進行可。Phase 11 focused Vitest evidence は 2026-05-25 に取得済み。Phase 13 commit/PR と staging runtime は user-gated。

| Gate | 判定 | 時刻 | 承認者 | 根拠 |
|---|---|---|---|---|
| Gate-A (spec_review) | passed | 2026-05-25T16:15:27+09:00 | daishiman | 本ドキュメント §1〜§2 |
| Gate-B (implementation_review) | passed | 2026-05-25T18:52:30+09:00 | daishiman | コード実装 + focused Vitest evidence PASS |
| Gate-C (external_ops) | pending | — | daishiman | commit / push / PR は user-gated |

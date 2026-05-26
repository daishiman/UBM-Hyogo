# Phase 9: QA

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 9
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 9 (QA) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-9-qa.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. 自動 QA

| 項目 | コマンド | 期待 |
|---|---|---|
| focused Vitest | `pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/lib/admin/__tests__/api.spec.ts apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts --reporter=default` | 3 files / 97 tests PASS |
| 既存 hook spec 回帰 | 上記 focused Vitest に含める | TC-13..19 / TC-27..29 / TC-TY-01 全 PASS |
| typecheck | `mise exec -- pnpm typecheck` | 0 error |
| lint | `mise exec -- pnpm lint` | 0 error / 0 warning |
| gate-metadata | `mise exec -- pnpm gate-metadata:validate` | ERROR 0 |
| phase12 compliance | `mise exec -- pnpm verify:phase12-compliance` | pass |

## 2. 手動 QA（NON_VISUAL）

UI が直接変わるわけではないため visual 回帰は対象外。手動 QA は staging deploy 後のスモークで以下を確認:

- 出席解除ボタン押下 → confirm → 解除完了
- DevTools Network で `DELETE /api/admin/meetings/.../attendance/...` が 1 回送られ、レスポンスヘッダ・ステータスを確認
- 一過性 5xx を再現（chaos test として API 側で意図的に 503 注入）した場合に retry されること
- Request Headers に `Idempotency-Key: <uuid>` が乗っていること

> staging / production 上の手動 QA は user-gated。本タスクでは spec 上の手順記載のみ。

## 3. リスク残（cycle 完結内）

| リスク | 評価 | 対応 |
|---|---|---|
| server 側 dedupe 未実装 | 中 | DELETE が naturally idempotent なため二重削除は 404 race で吸収。`Idempotency-Key` は将来 followup-003 で意味を持つ |
| retry 中の管理者 UX（待ち時間） | 低 | maxAttempts=3 / 既定 backoff で最悪 1.4s 程度 |
| 楽観 UI と retry の整合 | 低 | `refreshOnSuccess: false` 維持 + 既存 local state 更新パターン踏襲 |

## 4. CI gate チェックリスト

- [ ] `mise exec -- pnpm gate-metadata:validate` で `[ERROR] 0` を確認
- [ ] `mise exec -- pnpm verify:phase12-compliance` で `pass`
- [ ] `mise exec -- pnpm indexes:rebuild` で drift 無し
- [ ] `bash scripts/verify-pr-ready.sh` 全 PASS（user gated 実行）

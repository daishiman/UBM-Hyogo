# Phase 11: 手動テスト

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 11
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 11 (手動テスト) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-11-manual-test.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
> 本タスクは NON_VISUAL。手動 visual 検証は対象外。Phase 11 では local vitest の証跡取得を主要 evidence とし、staging/production curl は user-gated。

## 1. 検証種別

| 種別 | 必要性 | 配置 |
|---|---|---|
| focused Vitest log | 必須 | `outputs/phase-11/evidence/focused-vitest.log` |
| staging DELETE 動作確認 | user-gated | `outputs/phase-11/evidence/staging-delete-curl.log` |
| Idempotency-Key header 送出確認（DevTools Network） | user-gated | `outputs/phase-11/evidence/devtools-headers.png` |
| screenshot | N/A | NON_VISUAL のため不要 |

## 2. 実行コマンド（実行済み）

```bash
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  --reporter=default \
  2>&1 | tee docs/30-workflows/issue-912-idempotent-attendance-remove-retry/outputs/phase-11/evidence/focused-vitest.log
```

## 3. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local test summary | `outputs/phase-11/main.md` | present |
| focused Vitest log | `outputs/phase-11/evidence/focused-vitest.log` | present |
| Source — hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | n/a |
| Source — caller | `apps/web/src/components/admin/MeetingPanel.tsx` | n/a |
| Source — helper | `apps/web/src/lib/admin/api.ts` | n/a |
| Source — DELETE route | `apps/api/src/routes/admin/attendance.ts` | n/a |
| staging DELETE curl | `outputs/phase-11/evidence/staging-delete-curl.log` | pending |
| DevTools Idempotency-Key | `outputs/phase-11/evidence/devtools-headers.png` | pending |

## 4. 期待値

- focused Vitest: `api.spec.ts` / `MeetingPanel.component.spec.tsx` / `useAdminMutation.spec.ts` の 3 files / 97 tests PASS
- staging で DELETE が 200 / 404 race 双方で期待挙動
- DevTools で `Idempotency-Key: <uuid>` header が送出されている

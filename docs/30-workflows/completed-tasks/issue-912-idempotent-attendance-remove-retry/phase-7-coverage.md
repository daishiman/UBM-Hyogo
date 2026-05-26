# Phase 7: カバレッジ

## メタ情報

- task_id: issue-912-idempotent-attendance-remove-retry
- phase: 7
- task_type: implementation
- visualEvidence: NON_VISUAL

## 目的

Issue #912 の Phase 7 (カバレッジ) を実行可能な仕様・証跡として固定する。

## 実行タスク

- 本Phaseの判断・作業・証跡を下記本文に記録する。
- 実装済み差分と user-gated 境界を混同しない。

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- `phase-7-coverage.md`

## 完了条件

- 本Phaseの記録が矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 統合テスト連携

- NON_VISUAL のため主要証跡は focused Vitest。
- Phase 11 evidence: `outputs/phase-11/evidence/focused-vitest.log`
## 1. 改修ファイルの想定カバレッジ

| ファイル | 想定 branch カバレッジ | 根拠 |
|---|---|---|
| `apps/web/src/lib/admin/api.ts`（`removeAttendance` 1 関数） | 100% | TC-01 で DELETE 経路を網羅 |
| `apps/web/src/components/admin/MeetingPanel.tsx`（`removeAttendanceMutation` 周辺） | 既存 baseline 維持 + remove retry 分岐追加 | `MeetingPanel.component.spec.tsx` の DELETE / retry / header / 4xx / 404 coverage |
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 既存 baseline 維持 | hook 本体に diff なし。既存 hook spec で carve 済み |

## 2. 検証コマンド

```bash
# focused evidence 正本
pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/lib/admin/__tests__/api.spec.ts \
  apps/web/src/components/admin/__tests__/MeetingPanel.component.spec.tsx \
  apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts \
  --reporter=default
```

## 3. 既存 baseline への影響

- `useAdminMutation.ts` の coverage は不変（hook 本体に diff なし）
- `MeetingPanel.tsx` の coverage は既存 component spec 拡張により remove retry 分岐が追加される
- `api.ts` の `removeAttendance` は単純な 1 行関数のため変動は実質ゼロ

## 4. coverage gate

CI の `coverage-gate-shard (web)` は web 全体の threshold を見る。本変更は既存 spec を削除せず component spec を拡張するため、global threshold への影響は中立～微増。

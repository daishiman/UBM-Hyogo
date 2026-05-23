# Follow-up: deployment-secrets-management.md 500 行超過の責務分割

## メタ情報
- task ID: ci-staging-deploy-failure-fix-followup-003-secrets-management-split
- 親 workflow: `docs/30-workflows/completed-tasks/ci-staging-deploy-failure-fix/`
- 検出日: 2026-05-20
- 優先度: P3（既存逸脱の累積、即時影響なし）

## 目的
`.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` が 613 行で、classification-first / 500 行以内方針に違反している状態を解消する。

## 背景
本ファイルは本タスク（ci-staging-deploy-failure-fix）開始前から 617 行で既に逸脱していた。今回の同期で 36 行追加 / 40 行削減し 613 行となったが依然超過。本タスク範囲外のため follow-up 化する。

## スコープ
- `Cloudflare API Token 90 日 rotation runbook`（L419-529, 約 111 行）を `deployment-secrets-cf-token-rotation-runbook.md` へ責務分離する候補
- `UT-27: GitHub Secrets / Variables 同期運用`（L530-573, 約 44 行）を独立ファイルへ移すか判断
- `resource-map.md` / `quick-reference.md` / `topic-map.md` への同 wave 同期
- legacy filename がある場合 `legacy-ordinal-family-register.md` 更新

## 受け入れ基準
- 全分割後ファイルが 500 行以内
- `validate-structure.js` PASS
- `generate-index.js` 再実行で drift なし
- mirror sync / diff -qr PASS

## 制約
- 仕様に基づき分離（推測で内容を追加しない）
- 編集は直列

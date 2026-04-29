# Phase 11 link-checklist — 仕様書間リンク確認

## 確認結果

| 対象 | パス | 状態 | 備考 |
| --- | --- | --- | --- |
| workflow index | docs/30-workflows/ut-27-github-secrets-variables-deployment/index.md | OK | AC-1〜AC-15 / Phase 一覧あり |
| artifacts | docs/30-workflows/ut-27-github-secrets-variables-deployment/artifacts.json | OK | Phase 1〜13 と outputs を列挙 |
| Phase specs | docs/30-workflows/ut-27-github-secrets-variables-deployment/phase-01.md〜phase-13.md | OK | 13 ファイルあり |
| Phase outputs | docs/30-workflows/ut-27-github-secrets-variables-deployment/outputs/phase-01〜phase-13/ | OK | artifacts.json 記載 outputs を作成済み |
| parent spec | docs/30-workflows/unassigned-task/UT-27-github-secrets-variables-deployment.md | OK | 親タスク仕様 |
| backend workflow | .github/workflows/backend-ci.yml | OK | secret / variable 参照確認対象 |
| web workflow | .github/workflows/web-cd.yml | OK | secret / variable 参照確認対象 |
| aiworkflow refs | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | OK | CI/CD 正本 |
| aiworkflow refs | .claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md | OK | Secrets 配置正本 |
| aiworkflow refs | .claude/skills/aiworkflow-requirements/references/environment-variables.md | OK | 1Password / env 正本 |

## Broken

- なし。

## NON_VISUAL 注記

- `outputs/phase-11/screenshots/` は作成しない。
- 実 run URL / commit SHA / `gh secret list` のマスク済み出力は Phase 13 承認後の `outputs/phase-13/verification-log.md` に記録する。

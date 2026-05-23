# Phase 9: 品質保証

> [実装区分: 実装仕様書]

## 1. 一括判定項目

| 項目 | 判定方法 | 期待 |
|---|---|---|
| typecheck | `pnpm typecheck` | PASS（CI/CD のみ変更のため無影響） |
| lint | `pnpm lint` | PASS |
| actionlint | `actionlint .github/workflows/*.yml` | エラー 0 |
| shellcheck | `shellcheck scripts/redaction-check.sh scripts/__tests__/*.sh` | エラー 0、warning 許容 |
| workflow env grep | `grep -P '^\s{2}\w+:\s*\n\s{4}env:\s*\n\s{6}CLOUDFLARE_API_TOKEN' .github/workflows/*.yml` | 0 件（job-level env なし） |
| redaction-check 単体 | `bash scripts/__tests__/redaction-check.test.sh` | 全 TC PASS |
| workflow-env-scope 単体 | `bash scripts/__tests__/workflow-env-scope.test.sh` | 全 TC PASS |

## 2. CI required status check 維持

- `backend-ci` / `web-cd` の既存 required status check の green が維持されることを Phase 11 で確認

## 3. link / mirror parity

- `.claude/skills/aiworkflow-requirements/references/deployment-secrets-management.md` の更新後
  - `diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements`（mirror がある場合）
  - `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`（必要時）

## 4. line budget

- 各 phase 仕様書: 250 行以内
- `redaction-check.sh`: 100 行以内
- 各 test スクリプト: 200 行以内

## 5. DoD

- [ ] 上記すべて PASS
- [ ] CI 上で job-level token 露出ゼロを grep で確認

# Phase 7: テストカバレッジ確認

## カバレッジ AC: 適用外

本タスクは以下の理由でアプリケーションコード coverage AC を適用しない:

- 変更対象は `.github/workflows/*.yml` / `scripts/cf.sh` / `.claude/skills/.../references/*.md` のみ
- アプリケーション (`apps/web` / `apps/api` / `packages/shared`) は無変更
- `vitest` / coverage tooling の対象外領域

## 代替検証（3点）

| 検証 | コマンド | 期待 |
| --- | --- | --- |
| C-1: workflow lint | `actionlint .github/workflows/*.yml` | exit 0 |
| C-2: shell smoke | `bash scripts/__tests__/cf-token-arg.test.sh` | PASS |
| C-3: secret hygiene | `grep -RIn 'CLOUDFLARE_API_TOKEN=' docs/ outputs/ scripts/` | 0 hit |

## 成果物

- `outputs/phase-7/coverage-na-rationale.md`
- `outputs/phase-7/alternative-verification-result.md`

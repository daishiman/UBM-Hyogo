# Phase 7: 不変条件 / SSOT 整合性検証

## 7.1 CLAUDE.md 不変条件チェック

| # | 不変条件 | 本タスクへの適用 | 検証 |
| --- | --- | --- | --- |
| #5 | D1 直接アクセスは `apps/api` に閉じる | 無関係（read-only / shell + Markdown） | 影響なしを Phase 2 で明示 |
| #8 | 新規 test ファイルは `*.spec.ts` のみ（`*.test.ts` 禁止） | **対象**。`scripts/__tests__/coverage-threshold-lint.spec.ts` を採用 | lefthook `block-test-suffix` / GH Actions `verify-test-suffix` の reject パターンに該当しない |
| #6 | GAS prototype は本番仕様に昇格させない | 無関係 | - |
| `apps/web` env アクセス | `getEnv()` 経路維持 | 無関係（`apps/web` に触れない） | - |

## 7.2 SSOT 整合性

| SSOT 文書 | 状態 | 必要な更新 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/quality-requirements-advanced.md` | 80% 表記 / 既存 | 本タスクで**書き換えない**。lint の入力として read のみ |
| `scripts/coverage-guard.sh` line 22 `THRESHOLD=80` | 既存 | 書き換えない |
| `codecov.yml` | 不在 | 本タスクで作成**しない** |
| CLAUDE.md | 既存 | 編集なし（不変条件は既に network) |
| `docs/00-getting-started-manual/specs/00-overview.md` | 既存 | 編集なし（システム overview に影響なし） |
| skill `aiworkflow-requirements` の indexes | 既存 | Phase 12 で `pnpm indexes:rebuild` を実行（drift 防止） |
| skill `task-specification-creator` の references / SKILL.md | 既存 | 編集なし（template 改善は skill-feedback-report のルーティング判定で no-op） |

## 7.3 ブランチ戦略整合（CLAUDE.md）

| 項目 | 値 | 妥当性 |
| --- | --- | --- |
| 作業ブランチ | `feat/issue-255-coverage-threshold-sync-lint` | `feature/*` 命名に整合 |
| 想定 PR base | `dev` | `feature/* → dev` のフローに整合（main 直 PR は禁止） |
| solo 運用 / required reviewer | 0 名 | branch protection に整合 |

## 7.4 Cloudflare 系 CLI 利用

| CLI | 利用 |
| --- | --- |
| `scripts/cf.sh` | 利用なし（Cloudflare に触れない） |
| `wrangler` | 利用なし |
| Cloudflare Secrets | 利用なし |
| 1Password | 利用なし |

CLAUDE.md の「Cloudflare 系 CLI 実行ルール」「シークレット管理」セクションに違反しない。

## 7.5 PR 作成完全自律フロー整合

CLAUDE.md「PR 作成の完全自律フロー」に従い、Phase 13 では:

- base ブランチ `dev`（既定）
- `git fetch origin dev` → ローカル `dev` を fast-forward → 作業ブランチにマージ
- 品質検証: `pnpm install --force` / `pnpm typecheck` / `pnpm lint` / `bash scripts/verify-pr-ready.sh`
- 加えて本タスク固有: `mise exec -- pnpm lint:coverage-threshold`
- `gh pr create --base dev`

本ワークフローは local implementation complete。Phase 13 の commit / push / PR は user 明示承認まで blocked。

## 7.6 Test suffix 不変条件の機械検証

| コマンド | 期待 |
| --- | --- |
| `find scripts/__tests__ -name 'coverage-threshold-lint*'` | `scripts/__tests__/coverage-threshold-lint.spec.ts` のみ |
| `grep -rn '\.test\.ts$' .github/workflows/coverage-threshold-lint.yml` | 0 hit（`.test.ts` 文字列は含めない） |

## 7.7 sync-merge 親和性

| 項目 | 影響 |
| --- | --- |
| `.gitattributes` `merge=union` 対象 | 本タスクは触れない（`docs/30-workflows/LOGS.md` / skill changelog 等への加筆は phase-12 で行う際に union に乗る） |
| `pnpm sync:resolve` | 本タスク固有の resolver 改修なし |
| pre-push `coverage-guard` | 本タスクのコード変更が `scripts/` / `.github/workflows/` / `package.json` に限られ、`apps/` / `packages/` の coverage は変動しないため `--changed` モードで対象外 |

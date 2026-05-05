# Phase 09 — 品質保証 (実行結果)

[実装区分: 実装仕様書]

## 状態

`PARTIAL_PENDING_RUNTIME_EXECUTION` — 自動 gate（typecheck / lint / sync:check / indexes drift）は
spec_created サイクルで PASS させる。redaction / smoke / user 承認 / aiworkflow 更新は runtime cycle で PASS。

## 自動 gate（spec_created）

| Gate | コマンド | 結果 |
| --- | --- | --- |
| typecheck | `mise exec -- pnpm typecheck` | PENDING（本サイクル末で実行） |
| lint | `mise exec -- pnpm lint` | PENDING |
| sync:check | `mise exec -- pnpm sync:check` | PENDING |
| indexes drift | `mise exec -- pnpm indexes:rebuild` 後 `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` | PENDING |
| lefthook pre-commit | commit 時自動実行 | PENDING |

## 自動 gate（runtime cycle）

| Gate | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| redaction grep | `rg -i '(CLOUDFLARE_API_TOKEN\|bearer\|token=\|sink\|secret\|account_id)' outputs/` | 0 件 | PENDING |
| Workers production smoke | `curl -sS -o /dev/null -w '%{http_code}' https://<production-host>/` | 200 | PENDING |

## 手動 gate（runtime cycle）

| Gate | 確認内容 | 結果 |
| --- | --- | --- |
| `bash scripts/cf.sh whoami` | exit 0 / account 表示 | PENDING |
| user 明示承認文言 | PR description / Issue comment に保存 → `user-approval-record.md` 転記 | PENDING |
| Phase 6 停止条件 5 項目 | 全件 NO（停止トリガなし） | PENDING |
| aiworkflow-requirements Pages 言及更新 | `rg "Cloudflare Pages\|pages\.dev\|pages project" .claude/skills/aiworkflow-requirements/references/` 差分が「削除済み（YYYY-MM-DD）」へ | PENDING |

## shellcheck / shfmt

- 対象外（scripts/cf.sh への破壊的変更なし、新規 shell script なし）

## カバレッジ

- destructive 1 回限りの ops。line coverage ではなく gate 通過 / evidence 完備で品質を担保

## 残課題

- runtime cycle 終了時に上表の「PENDING」を「PASS」または事象記録へ更新する

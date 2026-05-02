# Phase 11: NON_VISUAL Smoke Evidence

Status: `PASS`（D1 migration list 確認は CONST_002 によりユーザー承認後に実施）

本タスクは NON_VISUAL（DDL コメント + spec doc 編集のみ）。今サイクル内に取得した evidence を以下に記録する。

## Evidence summary

| 項目 | 結果 | 取得方法 |
| --- | --- | --- |
| `pnpm typecheck` | PASS（apps/api / apps/web / packages/* すべて Done） | `mise exec -- pnpm typecheck` を worktree root で実行 |
| `pnpm lint` | PASS（lint-boundaries / lint-deps / lint-stablekey-literal / -r lint すべて成功） | `mise exec -- pnpm lint` を worktree root で実行 |
| SQL semantic diff | 0 行（コメント以外の差分なし） | `git diff -U0 apps/api/migrations/0001_init.sql apps/api/migrations/0005_response_sync.sql \| grep -E "^[+-]" \| grep -vE "^[+-]{3}\|^[+-]\\s*--\|^[+-]$"` が空 |
| `database-schema.md` 文言反映 | PASS（`正本 UNIQUE` / `member_identities.response_email` / `履歴行のため同値重複を許容` の 3 文言が含まれる） | `git diff .claude/skills/aiworkflow-requirements/references/database-schema.md` で row 50-51 確認 |
| `0001_init.sql` コメント反映 | PASS（`member_responses` 側「UNIQUE は付与しない」/ `member_identities` 側「正本 UNIQUE」コメントが追加） | `git diff apps/api/migrations/0001_init.sql` で行 51-53 / 90-92 周辺確認 |
| `0005_response_sync.sql` 文言整合 | PASS（`正本 UNIQUE が宣言済み（再宣言・再付与なし）`） | `git diff apps/api/migrations/0005_response_sync.sql` で行 7 確認 |

## D1 migration list（保留）

`scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` は production D1 への接続を伴うため、Phase 13 の PR 作成承認と合わせてユーザー指示後に実行する。コメント差分のみであり、wrangler の migration hash は SQL 行のみを対象とするため drift は理論上発生しない（既知 wrangler 仕様）。

## Acceptance Criteria 充足

- AC-5（SQL semantics 不変）: 上記 SQL semantic diff 0 行で充足
- AC-6（typecheck / lint PASS）: 上記 evidence で充足
- AC-7（D1 migration hash drift 無し）: コメント差分のため理論上の安全性確認のみ。runtime 確認は production 接続時に併せて実施

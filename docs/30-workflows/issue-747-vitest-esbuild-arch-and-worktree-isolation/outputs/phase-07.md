# Phase 7: セキュリティ & コンプライアンス

## 7.1 セキュリティ観点

- verify scripts は **read-only**（`process.arch` / `require.resolve` / `execFileSync(--version)` / `readFileSync(pnpm-lock.yaml)` のみ）。シークレットを読まない、書かない、ログに出さない
- `ESBUILD_BINARY_PATH` の値は verify script では参照のみとし、ログ出力時は環境変数キーのみを表示する（値は表示しない）
- runbook には実値（CF API Token 等）を絶対に記載しない。CLAUDE.md §シークレット管理に整合

## 7.2 コンプライアンス

- 本タスクは `apps/web` ランタイムを変更しない → `env.ts` 不変条件は影響なし
- D1 / Cloudflare Secrets を変更しない → `scripts/cf.sh` 経由不要
- `lefthook.yml` 変更は `prepare` script 経由の lefthook install のみで配置される（手書き `.git/hooks/*` 禁止に整合）
- `.github/workflows/*` 新規追加は CODEOWNERS governance path 配下のため、PR 説明で意図を明示する

## 7.3 governance YAML（mutation user gate）

本タスクには `gh api -X PUT` / `wrangler deploy` / `d1 migrations apply` / `gh secret set` 等の **不可逆 mutation は含まれない**。よって `unassigned-task-required-sections.md §6` の governance YAML 必須項目は適用外。

## 7.4 完了条件（Phase 7）

- 上記 3 観点で「該当なし / 影響なし」が確定
- runbook が secret hygiene を破らない構成

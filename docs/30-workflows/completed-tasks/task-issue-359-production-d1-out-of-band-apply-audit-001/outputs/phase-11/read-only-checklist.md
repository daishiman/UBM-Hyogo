# Read-only checklist

## 監査中に実行したコマンドの分類

| command | category | mutates production? |
| --- | --- | --- |
| `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` | wrangler local list（esbuild host/binary 不整合で remote 取得失敗） | No |
| `git log --all --since=... --until=... --pretty=fuller` | git read-only | No |
| `rg -n ...` | docs grep | No |
| `gh pr list --search "merged:..."` | GitHub API read-only | No |
| `gh run list --limit ... --json ...` | GitHub API read-only | No |
| `gh run view <id> --json jobs` | GitHub API read-only | No |

production への write / 追加 apply / rollback / deploy / commit / push / PR / Issue 状態変更は**一切実行していない**（Issue #434 は CLOSED のまま据え置き）。

## ledger row 数差分 / fallback evidence

ローカル wrangler の esbuild 不整合で `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production --remote` が本実行では成功せず、baseline row 数の数値比較は取得できなかった。代替として以下で AC-8 を担保する。

- 本 audit で実行したコマンド一覧は `commands-executed.md` に追記済みで、すべて read-only。
- 親 workflow `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 で取得済みの remote ledger キャプチャ (`outputs/phase-13/d1-migrations-table.txt`) と、本 audit の判定対象 timestamp (`2026-05-01 08:21:04` / `2026-05-01 10:59:35`) は完全一致しており、本 audit window 中に新たな apply は発生していない。
- 本 audit が remote mutation に該当するコマンドを発行していないことは上表で機械的に確認できる（`d1 migrations apply` / `deploy` / `rollback` / `cf.sh d1:apply-prod` のいずれも未実行）。

PASS: production への write / mutation 0 件。

判定: AC-8 PASS by fallback evidence. Row-count comparison is secondary evidence for this workflow; the required primary gate is mutation command count 0 in the audit transcript.

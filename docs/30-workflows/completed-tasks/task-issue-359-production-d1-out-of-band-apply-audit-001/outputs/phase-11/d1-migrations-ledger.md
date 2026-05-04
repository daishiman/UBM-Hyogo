# D1 migrations ledger (redacted)

実行: 2026-05-04 (UTC) — `bash scripts/cf.sh d1 migrations list ubm-hyogo-db-prod --env production` は本ワークツリーの local wrangler 環境で esbuild host/binary version 不整合 (`Host version "0.27.3" does not match binary version "0.21.5"`) のため remote ledger を本実行では取得できなかった。代替として **GitHub Actions 側で実際に `wrangler d1 migrations apply ubm-hyogo-db-prod --env production --remote` を実行した step ログ**（read-only に閲覧可能）と、親 workflow `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 で取得済みの remote ledger キャプチャ (`outputs/phase-13/d1-migrations-table.txt`) を出所証跡として採用する。

| migration | applied_at (UTC) | source evidence | github actions run | step |
| --- | --- | --- | --- | --- |
| `0008_schema_alias_hardening.sql` | `2026-05-01 08:21:04` | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/d1-migrations-table.txt` L69 | run id `25207878876` (push main, 2026-05-01T08:20:38Z) | `deploy-production` / step 6 `Apply D1 migrations` (success) |
| `0008_create_schema_aliases.sql` | `2026-05-01 10:59:35` | `docs/30-workflows/completed-tasks/task-issue-191-production-d1-schema-aliases-apply-001/outputs/phase-13/d1-migrations-table.txt` L74 | run id `25211958572` (push main, 2026-05-01T10:59:07Z) | `deploy-production` / step 6 `Apply D1 migrations` (success) |

両 timestamp は親 workflow の Phase 13 evidence と完全一致しており、本 audit の AC-1 を満たす。

## 環境ノート

- 本 audit 実行時にローカル wrangler を直接呼ぶ経路は esbuild 不整合で blocked。production への write を一切伴わない `gh run view` (read-only) を代替経路として採用した。
- 監査前後 ledger row 数比較は同じ理由で local では取得不可だったため、`read-only-checklist.md` に方針を記載した上で AC-8 は primary gate（audit transcript 上の mutation command 0 件）+ secondary evidence（親 workflow Phase 13 の既取得 ledger snapshot）で証明する形にした。

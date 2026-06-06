# Phase 8: リファクタリング — issue-1081-bulk-tag-real-d1-runtime-smoke

## 目的

duplicate と drift を削りつつ、**過剰共通化（YAGNI 違反）を避ける**。既存 smoke 資産を再利用し、新規 runner で独立性が必要な箇所は意図的に複製する。

## 再利用方針（既存資産の活用）

| 再利用資産 | 再利用方法 | 共通化しない理由 |
| ---------- | ---------- | ---------------- |
| `scripts/smoke/redact.sh` | runner から `bash "$REDACT" < ...` で**そのまま呼ぶ**（複製しない） | redaction は SSOT。1 本に集約済みなので再実装不要 |
| `scripts/cf.sh d1 execute` | seed / cleanup / audit count を `run_d1` 薄ラッパー経由で呼ぶ（wrangler 直叩き禁止 I-3） | cf.sh が op 注入 / esbuild / mise を吸収する正本。runner で再実装しない |
| `runtime-attendance-provider.sh` の機構 | `fail_and_exit` / `write_summary`（→ `emit_summary`）/ redact 経由ログ / `assert_target`（→ `assert_staging_guard`）の**パターンを踏襲して新規実装** | 関数本体は attendance（GET / header / 6 route）と bulk（POST / mutation / seed・cleanup / audit count）で差分が大きい。共通 lib 抽出は時期尚早 |
| `scripts/staging/seed-issue-399.sh` / `cleanup-issue-399.sh` | `CLOUDFLARE_ENV=staging` guard ＋ cleanup 後 count=0 検証パターンを踏襲 | 同上。bulk は runner 内に seed/cleanup を内包するため別 shell には切り出さない |

## 変更内容（対象 / Before / After / 理由）

| 対象 | Before | After | 理由 |
| ---- | ------ | ----- | ---- |
| synthetic prefix | runner / seed / cleanup / test に文字列散在 | runner 冒頭の定数（`E2E_PREFIX="e2e_test_issue1081_"` 相当）に集約し、ログ / count query から参照 | prefix drift 防止（AC-4 / I-6 の単一定義） |
| 固定 payload（member/tag id） | post_bulk に直書き | runner 冒頭の `MEMBER_IDS` / `TAG_IDS` / `EXPECTED_ITEMS` 定数に集約 | seed の id と runner の payload を 1 箇所で対応付け（不整合防止） |
| D1 database 名 | seed/cleanup/count に `ubm-hyogo-db-staging` 直書き | `CF_D1_DATABASE` env（既定 `ubm-hyogo-db-staging`）に集約し guard でも検証 | SSOT ＋ production DB 誤指定の guard |
| reason 分類文字列 | fail_and_exit に直書き | runner 冒頭の reason 定数群（`seed-failed` / `status-mismatch` / `audit-count-drift` / `audit-parity-missing` / `cleanup-incomplete`）に集約 | test の expected reason と一致させ drift 防止 |
| CI job の mask / redaction grep / artifact step | 既存 `smoke` job とほぼ同一 | 共通化せず**意図的に複製**（独立 job として並置） | workflow 内 step の早期共通化（composite action 化）は壊れやすい。job 独立性を優先 |

## 早期抽象化の抑制（YAGNI）

> smoke runner 共通 lib（`scripts/smoke/lib/smoke-common.sh`）への抽出は **「3 本目の runner が増えた時点」**で行う。
> 現状は attendance（GET）/ admin-web（cookie GET）/ bulk-tag（POST mutation + seed/cleanup）の 3 本だが、
> 差分（header vs cookie、GET vs mutation、seed/cleanup の有無、audit count query の有無）が大きく、
> 共通化すると分岐パラメータが増えて可読性が落ちる。本タスクでは**複製 + 定数集約**に留め、共通 lib は将来層とする。

## navigation drift チェック

- 親タスク `issue-1036-bulk-member-tag-assign` の Phase 11 / phase-12 が参照する「将来の staging runtime smoke gate」前方リンクを本タスク root へ向ける（Phase 12 で更新）。
- `unassigned-task/task-issue-1036-followup-005-bulk-tag-real-d1-runtime-smoke.md` を本タスクで formalize した旨を Phase 12 で記録する。

## 完了判定

- [x] redact.sh / cf.sh / attendance runner パターンの再利用方針を確定
- [x] prefix / payload / D1 名 / reason 文字列の SSOT 化（定数集約）
- [x] smoke 共通 lib 抽出を「3 本目以降」へ先送りする YAGNI 判断を記録
- [x] CI job 内 step の早期共通化を避けた判断を記録

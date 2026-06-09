# Phase 11 Manual Test Result（NON_VISUAL 証跡メタ） — issue-1137-bulk-tag-production-runtime-smoke

## 区分

| 項目 | 値 |
| ---- | -- |
| visualEvidence | **NON_VISUAL**（production runtime smoke / CI gate 拡張。UI 表示物の変更なし・screenshot 不要）|
| workflow_state | `implemented_local_runtime_pending`（runner・SQL・CI job・local test は実装済み。production real D1 実走のみ user-gated）|
| 状態語彙（3-state）| `implemented_local_runtime_pending`（local implementation complete）→ `runtime_pending`（実装済・user 二重承認待ち = Gate-B pending）→ `completed`（production 実走証跡取得済）|
| 実行者 | （実装 wave / 実走 wave の実行時に branch 名・日時を追記する。spec 段階では未実行）|

## メタ情報

| 項目 | 値 |
| ---- | -- |
| 証跡の主ソース（自動テスト名 / 件数の想定）| (1) **local shell test** `scripts/smoke/__tests__/runtime-tag-bulk.test.sh`（production guard / dual marker / production allowlist / staging 非退化の 5 ケース追加 + 既存 staging ケース回帰。real D1 接続なし）/ (2) **production real D1 smoke** `scripts/smoke/runtime-tag-bulk.sh production`（seed → assign → retry noop → unassign → audit count parity → cleanup 残件 0 の orchestration 1 本）/ (3) **CI 構文検証** `actionlint production-runtime-smoke.yml` |
| スクリーンショットを作らない理由 | **NON_VISUAL: CI / runtime smoke gate**。検証対象は HTTP contract（`results[].status`）・audit parity・cleanup 残件 0 という非視覚的 runtime 挙動であり、UI 画面の追加・意匠変更を一切伴わない。screenshot では runtime 挙動を表現できず、redacted command log / audit count log / cleanup log / `summary.json` が一次証跡となる |
| evidence inventory | `outputs/phase-11/phase-11.md` の「Phase 11 evidence file inventory」（6 点・canonical 名事前固定）|
| 実値 secret | 一切記載しない（`<redacted>` / `op://...` 参照のみ）|

## AC 検証方法と現状（3-state 記録）

| AC | 内容 | 検証方法 | 現状 |
| -- | ---- | -------- | ---- |
| AC-1 | production 専用 allowlist host regex を導入し production endpoint にのみマッチ。staging allowlist と独立評価 | local test（`production-wrong-host-refused`）で非 production URL を refuse / production 実走で正 URL に対し assign → 全 assigned | `implemented_local_runtime_pending`（local implementation complete。runtime evidence は Gate-B pending）|
| AC-2 | production fixture prefix `e2e_test_prod_tagbulk_` を staging prefix と分離固定し、当該 prefix のみに作用 | seed/cleanup SQL の全 INSERT/DELETE が `e2e_test_prod_tagbulk_` を使用（grep gate）/ smoke は当該 prefix のデータのみ touch | `implemented_local_runtime_pending` |
| AC-3 | 二重承認 gate（marker × 2・CI 自動実行不可）後のみ seed / POST / cleanup を実行 | local test（`production-no-approval-refused` / `production-single-approval-refused`）で marker 欠落を refuse / CI は `workflow_dispatch` 限定 + `environment: production-runtime-smoke` 承認 | `implemented_local_runtime_pending` |
| AC-4 | smoke 終了時に cleanup 残件 0 を assert（6 table の `e2e_test_prod_tagbulk_` 行が残らない）。残件あれば FAIL | production 実走の cleanup 後に 6 table を count → 全 0 でなければ `fail_and_exit`。trap EXIT で途中失敗時も always | `implemented_local_runtime_pending`（runtime evidence は Gate-B pending）|
| AC-5 | audit parity を確認（assign / unassign の action / batchId / count が contract 通り・test 行残留なし）| assign 後 `tag_assigned` count / retry 前後不変（冪等）/ unassign 後 `tag_unassigned` 増分 / cleanup 後 audit 残件 0 | `implemented_local_runtime_pending`（runtime evidence は Gate-B pending）|
| AC-6 | 既存 staging runner の `assert_staging_guard` 非退化を既存 local test の PASS で確認 | `assert_staging_guard` 本体を逐語変更しない / 既存 staging local test ケースが引き続き PASS（`staging-guard-non-regression`）| `implemented_local_runtime_pending`（local 検証は本サイクルで取得済み）|
| AC-7 | command log に production endpoint URL / request body redaction / response summary / audit count / cleanup query が残り、bearer / token は redact | `runtime-tag-bulk-prod-smoke.log` / `summary.json` に上記が `redact.sh` でマスク済み記録 / CI redaction grep gate を通す | `implemented_local_runtime_pending`（runtime evidence は Gate-B pending）|
| AC-8 | issue 本文 contract（assigned 単値 / `@repo/api`）を最新コード（`results[].status` / `@ubm-hyogo/api`）へ最適化 | runner は `results[].status` を jq 集計検証 / 全ドキュメント・コマンドのパッケージ名は `@ubm-hyogo/api` | `implemented_local_runtime_pending`（設計・命名で反映済）|

## 証跡カテゴリ別 記録（2 カテゴリ分離）

### カテゴリ A: local test（real D1 接続なし・AC-6 / AC-7 の local 検証部分）

| 項目 | 値 |
| ---- | -- |
| 対象 AC | AC-6（staging guard 非退化）/ AC-7（redaction の static 検証）+ production guard 群（AC-1 / AC-3 の refuse 経路）|
| 実行コマンド | `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |
| 追加ケース | `production-no-approval-refused` / `production-single-approval-refused` / `production-wrong-host-refused` / `production-d1-database-refused` / `staging-guard-non-regression`（既存 staging ケース回帰）|
| real D1 副作用 | **なし**（curl / cf.sh stub 下で実行）|
| 現状 | `implemented_local_runtime_pending`（local test ケースは Phase 4 で設計。本サイクルでコード化 + 実行済み。production への副作用がないため user 二重承認は不要）|
| evidence | `outputs/phase-11/evidence/runtime-tag-bulk-test.log`（present）/ `outputs/phase-11/evidence/runtime-tag-bulk-actionlint.log`（present）|

### カテゴリ B: production real D1 実走（AC-1〜AC-5・user 二重承認後）

| 項目 | 値 |
| ---- | -- |
| 対象 AC | AC-1（assign 全 assigned）/ AC-2（fixture prefix 分離）/ AC-3（dual approval 後のみ実行）/ AC-4（cleanup 残件 0）/ AC-5（audit parity）|
| 実行コマンド | `bash scripts/smoke/runtime-tag-bulk.sh production --out-dir <evidence> --ci-summary` |
| 対象環境 | Cloudflare Workers production（`ubm-hyogo-api` / `https://api.ubm-hyogo.workers.dev`）+ `ubm-hyogo-db-prod` real D1 |
| 二重承認 | 第 1 = GitHub environment `production-runtime-smoke` reviewer 承認 / 第 2 = runner marker `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke` + `BULK_TAG_PRODUCTION_SMOKE_CONFIRM`（confirmation marker）|
| real D1 副作用 | **あり**（本番 D1 への seed / mutation / cleanup）。それゆえ user 二重承認後にのみ実行する実行タイミング分離（Gate-B）。先送り = 別 Issue 化ではない |
| 現状 | `implemented_local_runtime_pending`（local implementation complete。runtime evidence は user 二重承認後のuser 二重承認後に取得 → `completed`）|
| evidence | `runtime-tag-bulk-prod-smoke.log` / `runtime-tag-bulk-prod-audit-count.log` / `runtime-tag-bulk-prod-cleanup.log` / `summary.json`（すべて pending）|

## 完了判定（本サイクル = implemented_local_runtime_pending）

- [x] NON_VISUAL（証跡の主ソース / screenshot を作らない理由 = CI/runtime smoke gate）をメタ情報に明記（FB-04）
- [x] AC-1〜AC-8 の検証方法と現状を 3-state（implemented_local_runtime_pending / runtime_pending / completed）で記録
- [x] local test（カテゴリ A・AC-6/AC-7）と production real D1 実走（カテゴリ B・AC-1〜AC-5）を 2 カテゴリで分離記録
- [x] secret 実値を載せず `<redacted>` / `op://...` 参照のみとした
- [x] production 実走証跡は user 二重承認後（Gate-B）であることを宣言した

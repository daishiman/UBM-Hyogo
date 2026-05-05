# Phase 6: 異常系検証

## 目的

local / staging smoke 実行時に発生し得る代表的な異常系 5 ケースを定義し、各ケースの **検出シグナル**・**切り分け手順**・**復旧アクション** を整理する。Phase 5 ランブック実行中に該当事象が出た場合、本ファイルが分岐先となる。

## 異常系一覧

### Case A: esbuild Host/Binary version mismatch 再発

- **シグナル**: `apps/api` 起動時に `Expected "0.21.5" but got "0.27.3"` 等の version mismatch ログ
- **原因**: グローバル esbuild と wrangler 内蔵 esbuild の不整合
- **切り分け**: `scripts/cf.sh` を経由しているか確認（`ESBUILD_BINARY_PATH` 注入有無）
- **復旧**: `bash scripts/cf.sh` 経由起動に統一。直接 `wrangler` を呼んでいたら本タスクの仕様違反として中止
- **AC trace**: AC-1 fail 扱い

### Case B: `PUBLIC_API_BASE_URL` 未設定（localhost fallback）

- **シグナル**: staging で `apps/web` が `http://localhost:8787` に接続を試みて 5xx / network error を返す。または `/members` が空配列を返す
- **原因**: Cloudflare deployed vars に `PUBLIC_API_BASE_URL` が未設定
- **切り分け**: `bash scripts/cf.sh` 経由で staging deployed vars を取得し、`PUBLIC_API_BASE_URL` の有無確認。`apps/web/wrangler.toml` は現状未定義のため補助情報としてのみ扱う
- **復旧**: `wrangler.toml` の `[env.staging.vars]` に追記し、`scripts/cf.sh deploy` で再デプロイ
- **AC trace**: AC-5 fail 扱い

### Case C: D1 migration 未 apply

- **シグナル**: `apps/api` が `/members` で `no such table: members` 等の D1 エラーを返す
- **原因**: 当該環境（dev / staging）に migration が未 apply
- **切り分け**: `bash scripts/cf.sh d1 migrations list <db-name> --env <env>` で未適用一覧を確認
- **復旧**: `bash scripts/cf.sh d1 migrations apply <db-name> --env <env>`
- **AC trace**: AC-3 / AC-4 fail 扱い

### Case D: staging vars drift（`apps/api` URL の差異）

- **シグナル**: staging `/members` は `200` を返すが、`apps/api` の staging URL とは異なるホスト宛にリクエストが行っている（response header / log で乖離）
- **原因**: `PUBLIC_API_BASE_URL` が古い preview URL や別環境を指している
- **切り分け**: vars dump と `apps/api/wrangler.toml` の `routes` / `workers_dev` 設定を突き合わせ
- **復旧**: vars を正しい staging API URL に更新し再デプロイ
- **AC trace**: AC-5 fail 扱い

### Case E: member seed 0 件（実体経路は通っているが空）

- **シグナル**: `/members` が `200` だが body が `[]`。実 D1 binding 経由でも結果が空
- **原因**: 当該環境に seed が未投入、または migration apply 後に seed 流し込みが行われていない
- **切り分け**: `bash scripts/cf.sh d1 execute <db-name> --env <env> --command "SELECT COUNT(*) FROM members;"`（**SQL 結果値はログに残すが ID 等の個別値は redact**）
- **復旧**: 06a / 04a の seed 手順に従い投入。本タスク内では新規 seed 作成しない（scope out）
- **AC trace**: AC-3 fail 扱い

## 検出方針

| ケース | 1次検出 | 2次検出 |
| --- | --- | --- |
| A | wrangler 起動 stdout | `bash scripts/cf.sh whoami` 成否 |
| B | staging curl の 5xx / 空配列 | vars dump 不在確認 |
| C | API レスポンスの SQL error | `d1 migrations list` |
| D | URL 不一致（curl `-v` の Host） | wrangler.toml diff |
| E | `/members` body 空 | `d1 execute` SELECT COUNT |

## 共通原則

- **wrangler 直接実行禁止**: 切り分け中も `bash scripts/cf.sh` 経由のみ
- **secret hygiene**: API token / D1 ID 実値は log 含め一切記録しない
- **再現性**: 異常時は最低 1 回は再実行し、フレーキー由来か恒常障害かを切り分け
- **scope 越境禁止**: 04a API 実装変更 / 02b migration 新規追加 は本タスクで実施しない（別 followup へ送る）

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 6
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- esbuild mismatch / D1 binding 未注入 / localhost fallback の異常系を列挙する
- 失敗時の診断手順を Phase 11 へ引き継ぐ

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-06/main.md`

## 完了条件

- [ ] Phase 6 の成果物が存在する
- [ ] AC / evidence / dependency trace に矛盾がない

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。

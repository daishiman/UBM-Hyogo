# Phase 8 / refactor-record.md — 設定 DRY 化記録

仕様書とテーブルの DRY 化に閉じる（コード変更なし）。

## 1. Before / After 表（[Feedback RT-03] 準拠）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| D1 schema 列定義の所在 | phase-02 / 04 / 05 に重複転記の可能性 | phase-02 `data-contract.md` を単一正本、他は see-also 参照のみ | 不変条件 1 と DRY を両立 |
| Sheets column `responseEmail` 表記 | `responseEmail` / `response_email` 混在の余地 | Sheets layer は `responseEmail`（system field）、D1 layer は `response_email` 列名で固定 | 不変条件 3 |
| consent キー | `consent` / `agreeFlag` 等の混在余地 | Sheets layer `publicConsent` / `rulesConsent`、D1 layer `public_consent` / `rules_consent` | 不変条件 2 |
| sync auth env キー | `GSA_JSON` / `SERVICE_ACCOUNT` 混在の余地 | `GOOGLE_SERVICE_ACCOUNT_JSON` に統一 | Cloudflare Secrets canonical |
| batch size | phase-04 / 05 で別記載の余地 | constants 表で `SYNC_BATCH_SIZE=100` に固定 | 検証と運用の同期 |
| schedule cron | 文中直書き | constants 表で `SYNC_SCHEDULE_CRON="0 * * * *"`（UTC 1h） | 表記揺れ排除 |
| retry / timeout | 未定義 | `SYNC_RETRY_MAX=3`, `SYNC_RETRY_BASE_MS=1000`, `SYNC_TIMEOUT_MS=30000` を constants 化 | 運用性向上 |
| audit reason enum | 各 phase で散発的に列挙 | Phase 6 failure-cases.md 冒頭の enum リストを正本 | DRY 化 + 監査一意性 |

## 2. env / Secrets キー正本（4 列）

| 変数名 | 配置先 | 用途 | 確定 Phase |
| --- | --- | --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Cloudflare Secrets (`apps/api`, env=staging/production) | Sheets API 認証 (service account JSON) | 5 |
| `SHEET_ID` | wrangler.toml `[vars]` / GitHub Variables | 対象 Spreadsheet ID（非機密） | 5 |
| `CLOUDFLARE_API_TOKEN` | GitHub Secrets (CI のみ) | wrangler deploy（本タスク外、04 で確定） | 04 |

## 3. sync constants 正本（4 列）

| key | value | 単位 | 由来 phase |
| --- | --- | --- | --- |
| SYNC_BATCH_SIZE | 100 | rows | 8 |
| SYNC_RETRY_MAX | 3 | 回 | 6 / 8 |
| SYNC_RETRY_BASE_MS | 1000 | ms (exp backoff base) | 6 / 8 |
| SYNC_TIMEOUT_MS | 30000 | ms (1 batch) | 8 |
| SYNC_SCHEDULE_CRON | `0 * * * *` | crontab (UTC) | 2 / 5 / 8 |
| SYNC_DIRECTION | `Sheets→D1` | 一方向 | 2 |

## 4. 削除対象一覧

- 旧 `agreeFlag` / 単一 `consent` キー記述
- env キーの旧表記（`GSA_JSON`, `SERVICE_ACCOUNT` 等）
- 実値混入の secret 例（placeholder 以外）
- Sheets を canonical store とする旧設計の残存記述（不変条件 4 / index.md スコープ外）
- GAS prototype を本番設計に持ち込む記述（不変条件 6）

## 5. 共通化パターン

- env / Secrets は「変数名 / 配置先 / 用途 / 確定 Phase」4 列
- sync constants は「key / value / 単位 / 由来」4 列
- D1 schema 参照は phase-02 see-also のみ（再掲禁止）
- outputs 配置は `outputs/phase-XX/*.md` を Phase 12 まで同一

## 6. downstream task への影響

| 受け手 | 影響 |
| --- | --- |
| 04-cicd-secrets-and-environment-sync | env/Secrets 正本表をそのまま採用、`GOOGLE_SERVICE_ACCOUNT_JSON` 名を変更しない |
| 05a-observability-and-cost-guardrails | sync constants（cron / batch / retry）を観測閾値の前提値に採用 |
| 05b-smoke-readiness-and-handoff | runbook link は phase-05 配下のみ参照 |

## 7. 完了条件チェック

- [x] 対象 / Before / After / 理由 が全て埋まっている
- [x] env / Secrets / sync constants の正本 phase が 1 箇所に固定
- [x] 削除対象を列挙、phase-02 以降に逆流していない
- [x] downstream handoff（04 / 05a / 05b）を明記

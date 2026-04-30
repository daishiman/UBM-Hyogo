# Phase 9 成果物: free-tier 見積もり (free-tier-estimation.md)

| 項目 | 値 |
| --- | --- |
| タスク | UT-26 Sheets API エンドツーエンド疎通確認 |
| Phase | 9 / 13 |
| 作成日 | 2026-04-29 |
| 状態 | spec_created |
| 対象環境 | dev (ローカル wrangler dev) / staging (Cloudflare Workers) |
| 対象外 | production (本タスクは smoke route を production で runtime 404 を返す) |

## 0. 結論サマリー

本タスクは Cron 起動なしの手動 smoke のみで、smoke 用途の月リクエスト数は数十〜数百程度。**Workers / Sheets API / OAuth token endpoint / 1Password / Cloudflare Secrets のすべてで無料枠内、超過リスクは事実上ゼロ**。production 環境では smoke route が runtime 404 を返すのため production 側は試算対象外。

## 1. Cloudflare Workers (apps/api / smoke route)

| 項目 | 値 | 備考 |
| --- | --- | --- |
| smoke 想定実行頻度 | 手動 / 動作確認時のみ | Cron 起動なし |
| 1 日最大想定 | 50 req/day (開発者の手動疎通確認) | |
| 月間最大想定 | 約 1,500 req/month | |
| 無料枠 | 100,000 req/day (Free plan) | 公式: developers.cloudflare.com/workers/platform/limits/ |
| 余裕度 | 約 0.05% (= 50 / 100,000) | 極めて余裕 |
| CPU 時間 | smoke 1 回あたり 10〜50 ms | 無料枠 10 ms/req は超過しない (token cache hit 時はほぼ I/O wait) |

> staging も同 Free plan でカウント。コスト 0。

## 2. Google Sheets API v4 (`spreadsheets.values.get`)

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 1 smoke あたり request | 2 req (OAuth token + values.get) → token cache hit 時は 1 req | |
| 1 日想定 | 50 smoke × 2 = 最大 100 req (cache hit 時 50 req) | |
| 月間想定 | 約 3,000 req | |
| 無料枠 | 300 req/min/project (per-minute hard limit) | 公式: developers.google.com/sheets/api/limits |
| 余裕度 (per-minute) | 1 分あたり最大 5 req 想定 → 1.7% (= 5 / 300) | 十分 |
| 月間 quota | 不明示 (per-minute のみが hard limit) | 月間制約は事実上なし |
| コスト | 無料 | |

## 3. Google OAuth 2.0 token endpoint

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 用途 | Service Account JWT → access_token 交換 | |
| 月間 request | 約 1,500 req (token cache miss 時のみ 1 req) | TTL 1 時間 cache で大半は省略 |
| 無料枠 | 無料 / 明示的 quota なし | per-IP の常識的な rate limit のみ |
| 余裕度 | 制約なし | |
| コスト | 無料 | |

## 4. 1Password Environments

| 項目 | 値 | 備考 |
| --- | --- | --- |
| 参照頻度 | `op run --env-file=.env` 実行時のみ (scripts/with-env.sh 経由) | |
| 月間 secret reference 解決 | 約 200 回 (手動 smoke 時のみ) | |
| 無料枠 | 既存契約内 (ユーザー単位課金) | |
| 余裕度 | 既存契約で十分 | |
| コスト | 既存契約に含まれる | |

## 5. Cloudflare Secrets

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Secret 数 | staging に 2〜3 件 (`GOOGLE_SHEETS_SA_JSON` / `SMOKE_ADMIN_TOKEN`、`SHEETS_SPREADSHEET_ID` は Variable でも可) | UT-25 で配置済み |
| 無料枠 | per Workers script に複数 Secret 無料 | |
| 余裕度 | 制約なし | |
| コスト | 無料 | |

## 6. dev 環境 (`wrangler dev` ローカル)

| 項目 | 値 | 備考 |
| --- | --- | --- |
| Workers req/day | 開発者次第 (数十程度) | wrangler dev はカウント対象外 (ローカル isolate) |
| Sheets API | staging と同 quota 対象 (GCP プロジェクト共有) | per-minute 5 req 程度 |
| OAuth token endpoint | 同 quota 対象 | token cache 活用で省略 |
| 対策 | dev 試行頻度を手動制御。token cache を活用し OAuth fetch を最小化 | Phase 5 ランブック参照 |

## 7. 月見積もり集約 (staging + dev 合算)

| サービス | 月想定 | 無料枠 | 余裕度 |
| --- | --- | --- | --- |
| Cloudflare Workers | 約 1,500 req | 100,000 req/day × 30 = 3,000,000 req/month | 0.05% |
| Sheets API | 約 3,000 req | 300 req/min/project (per-minute) | 1.7% peak |
| OAuth token endpoint | 約 1,500 req (cache miss のみ) | 制約なし | 制約なし |
| 1Password | 約 200 回 | 既存契約 | 制約なし |
| Cloudflare Secrets | 2〜3 件配置 | 無制限 | 制約なし |

> **超過リスク評価**: 全サービスで月数十 req〜数千 req の smoke 用途のため、無料枠の 1 桁%以下に収まる。Cron 起動が無いため瞬間的なバースト負荷も発生しない。

## 8. 注意事項

- production 環境では smoke route が runtime 404 を返す。production の Workers 無料枠は本タスクでは消費しない。
- UT-09 (Sheets→D1 同期 Cron) が稼働開始すると Sheets API quota の主消費者は UT-09 になる。UT-26 smoke は UT-09 quota plan の上に乗る形で、UT-26 単独で quota を圧迫しない。
- token cache TTL 1 時間が isolate 再起動で失われた場合、OAuth token endpoint への request が 1 件追加されるだけで影響軽微。

## 9. 完了条件チェック

- [x] 4 サービス (Workers / Sheets API / 1Password / Cloudflare Secrets) + OAuth token endpoint × 2 環境 (dev / staging) の試算記述
- [x] production 対象外を明記
- [x] 余裕度を定量化 (Workers 0.05% / Sheets API 1.7% peak)
- [x] 超過リスク評価を記述

---

next: phase-10 (最終レビュー) へ引き渡し — 4 サービスとも余裕度確保の試算成立を GO 判定の根拠として使用。production 露出禁止を最終再確認の入力として渡す。

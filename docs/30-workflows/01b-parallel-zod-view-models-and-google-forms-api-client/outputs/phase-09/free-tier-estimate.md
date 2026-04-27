# 無料枠試算 & secret hygiene（Phase 9）

## 1. 本タスクのランタイム影響

このタスクは TypeScript パッケージ（`@ubm-hyogo/shared`, `@ubm-hyogo/integrations-google`）と test の追加のみであり、本番ランタイムへの追加コール・追加 CPU 時間は **0**。

| 項目 | 影響 |
| --- | --- |
| Cloudflare Workers リクエスト | +0 |
| Cloudflare Workers CPU 時間 | +0 |
| D1 read / write | +0 |
| Google Forms API call | +0（test は mock） |
| KV / R2 | +0 |

## 2. Google Forms API 上限

| エンドポイント | 上限 | このタスク（実コール） | 後続実運用試算 | 余裕 |
| --- | --- | --- | --- | --- |
| `forms.get` | 6,000 / minute / project | 0（test mock のみ） | 1 / day（schema 監視 cron）= 30 / 月 | 100 % |
| `forms.responses.list` | 6,000 / minute / project | 0 | 1 / 5 min（response 同期）= 8,640 / 月 | 上限の 0.001 % 相当 |

> 後続実運用試算は Wave 3a / 3b の cron 計画に基づく目安。現時点では本タスクはモック test のみで上限消費 0。

## 3. Cloudflare Workers / D1 無料枠

| 項目 | 上限（無料） | このタスクでの利用 |
| --- | --- | --- |
| Workers リクエスト | 100,000 / day | 0（package のみ、Worker にデプロイしない） |
| Workers CPU | 10 ms / request | 0 |
| D1 read | 5,000,000 / day | 0 |
| D1 write | 100,000 / day | 0 |
| D1 storage | 5 GB | 0 |

→ 本タスクは無料枠を一切消費しない。

## 4. secret 一覧

| secret | 配置 | binding 名 | 用途 | 取得方法 |
| --- | --- | --- | --- | --- |
| `FORMS_SA_KEY` | Cloudflare Secrets（apps/api） | `FORMS_SA_KEY` | Forms 用 service account 秘密鍵（PEM） | `env.FORMS_SA_KEY` |
| `FORMS_SA_EMAIL` | Cloudflare Secrets（apps/api） | `FORMS_SA_EMAIL` | Forms 用 service account email | `env.FORMS_SA_EMAIL` |

| 設定値（非機密） | 配置 | 用途 |
| --- | --- | --- |
| `formId` | `wrangler.toml` `[vars]` | Google Form の formId（公開情報） |

## 5. ローカル開発の secret 管理

- `.env` をリポジトリに **生成しない**。
- ローカルでは `.dev.vars`（`.gitignore` 済み）に手動で配置。
- `.dev.vars` の中身の正本は **1Password Environments** に置き、開発者は `op` CLI で取得する（`scripts/with-env.sh` がフォールバック付きで対応）。

## 6. secret hygiene チェック

| 項目 | 結果 |
| --- | --- |
| secret 平文の log 出力 | 禁止（test mock では `***` で置換） |
| secret を error message に含める | 禁止（auth / client / backoff いずれも未含有） |
| secret を type definition に書く | 禁止（all `string` で受ける） |
| `.env` 生成 | NO |
| 1Password Environments で正本管理 | YES |
| Cloudflare Secrets binding 設定 | YES（`FORMS_SA_KEY`, `FORMS_SA_EMAIL`） |

## 7. a11y

- **N/A**: このタスクは TypeScript パッケージ実装のみ、UI を含まない。
- a11y は後続 Wave 6（06a / 06b / 06c）のページ実装で満たす。

## 8. 結論

- 無料枠への影響: **0**
- secret 露出: **0 件**（hygiene 6 項目すべて PASS）
- a11y: **N/A 明示**

→ Phase 10 GO 判定の前提条件を満たす。

# curl matrix — 06a 公開導線 smoke

## 凡例

- `route`: `apps/web` 側のパス
- `env`: `local` / `staging`
- `method`: HTTP method（本タスクは GET のみ）
- `expected`: 期待 HTTP status
- `extra check`: status 以外に検証する項目

本 matrix は **4 route family / 5 cases** として扱う。`/members/{seeded-id}` は `/members/[id]` family の正常系、`/members/UNKNOWN` は同 family の 404 系である。

`{seeded-id}` は当該環境の `/members` 応答から得られた実 ID を使用する。`/members` 応答 shape は 04a public API contract に合わせ、wrapper 形式の `.items[]` を正本とする。secret 値ではないが ID はログ上で `redacted` に置換する運用を取る。

## マトリクス

| # | route | env | method | expected | extra check |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | local | GET | 200 | landing 主要 section の HTML 存在 |
| 2 | `/members` | local | GET | 200 | body に seed member が 1 件以上（実体経路の証跡） |
| 3 | `/members/{seeded-id}` | local | GET | 200 | detail page の name / id 表示 |
| 4 | `/members/UNKNOWN` | local | GET | 404 | not-found UI render |
| 5 | `/register` | local | GET | 200 | Google Form responder URL の anchor 存在 |
| 6 | `/` | staging | GET | 200 | landing 主要 section の HTML 存在 |
| 7 | `/members` | staging | GET | 200 | body に seed member が 1 件以上 |
| 8 | `/members/{seeded-id}` | staging | GET | 200 | detail page の name / id 表示 |
| 9 | `/members/UNKNOWN` | staging | GET | 404 | not-found UI render |
| 10 | `/register` | staging | GET | 200 | responder URL anchor 存在 |

## 補助確認

| 項目 | 手段 | 期待 |
| --- | --- | --- |
| `PUBLIC_API_BASE_URL` の有効値 | `bash scripts/cf.sh` 経由 staging vars dump | staging API URL（localhost ではない） |
| `apps/web` の D1 直接 import | `pnpm --filter @ubm-hyogo/web exec rg -n "D1Database\|env\\.DB" app src --glob '!**/*.test.*' --glob '!**/__tests__/**'` | 0 件 |
| local API listening | `apps/api` 起動 stdout | `Listening on http://127.0.0.1:8787` |

## 失敗時の分岐

各行が expected と乖離した場合は `phase-06.md` の Case A〜E に分岐する。

# Phase 2 outputs — 設計 main

本ファイルは `phase-02.md` の成果物 mirror。Phase 2 で確定した設計内容を artifacts 経路から辿れる形で保管する。

## 設計の中核

local 環境と staging 環境の双方で **`apps/web → apps/api → D1`** という 3 層分離経路を実体で動かし、4 route family / 5 smoke cases に対する HTTP status を curl で観測する。`wrangler` の直接実行は禁止し、`scripts/cf.sh` ラッパーを唯一の起動経路として採用する。

## local smoke 設計

| 手順 | コマンド（疑似） | 期待 |
| --- | --- | --- |
| 1. `apps/api` 起動 | `bash scripts/cf.sh dev --config apps/api/wrangler.toml` | `Listening on http://127.0.0.1:8787` を観測。esbuild mismatch エラーなし |
| 2. `apps/web` 起動 | `PUBLIC_API_BASE_URL=http://localhost:8787 mise exec -- pnpm --filter @ubm-hyogo/web dev` | localhost:3000 を listen |
| 3. 4 route family / 5 smoke cases curl | `curl -s -o /dev/null -w "%{http_code}\n" <url>` | `/`, `/members`, `/members/{seeded-id}`, `/register` で 200、`/members/UNKNOWN` で 404 |
| 4. 実 D1 経路確認 | `/members` レスポンスを保存し、seed member が 1 件以上含まれることを目視 | seed member ≥ 1 件 |
| 5. evidence 保存 | `outputs/phase-11/evidence/local-curl.log` へ追記 | log ファイル生成 |

## staging smoke 設計

| 手順 | コマンド（疑似） | 期待 |
| --- | --- | --- |
| 1. staging vars 確認 | `bash scripts/cf.sh ... --env staging` で `PUBLIC_API_BASE_URL` を dump | `apps/api` の staging URL を指す（localhost ではない） |
| 2. 4 route family / 5 smoke cases curl | staging URL に対して同じ 5 cases | local と同じ status pattern |
| 3. screenshot | `/members` の表示を 1 枚保存 | `outputs/phase-11/evidence/staging-screenshot.png` |
| 4. evidence 保存 | `outputs/phase-11/evidence/staging-curl.log` | log ファイル生成 |

## D1 binding 経路図

実体は `outputs/phase-02/d1-binding-flow.mmd` を参照。要約: `apps/web` の Server Component / Route Handler → `fetch(PUBLIC_API_BASE_URL + path)` → `apps/api` (Hono) → `c.env.DB` (D1Database binding) → SQLite。

## scripts/cf.sh 採用理由（再確認）

| 観点 | wrangler 直接 | scripts/cf.sh 経由 |
| --- | --- | --- |
| esbuild version 解決 | 失敗（host/binary mismatch） | `ESBUILD_BINARY_PATH` で吸収 |
| secret 注入 | 手動 export 必要 | `op run --env-file=.env` 自動注入 |
| Node version | 環境依存 | `mise exec --` で Node 24 固定 |
| CLAUDE.md ルール | 違反 | 準拠 |

## 設計 review への引き継ぎ

Phase 3 では (a) all-staging-only 案、(b) local-required 案、(c) 採用案（local + staging 両方） を比較し PASS-MINOR-MAJOR で判定する。

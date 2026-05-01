# Phase 2 §5: Safety boundary / Secret leak guard 設計

横断 concern として全 lane に重複明記する。3 軸 (mutation 禁止 / secret 漏洩防止 / `wrangler` 直接呼び出し禁止) の設計を Phase 3 NO-GO 条件に渡す。

## 5.1 DI 境界

| 部位 | 責務 | 実装上の分離 (別 PR) |
| --- | --- | --- |
| http client | `fetch` ラッパー (read-only allowlist の enforce 込み) | `scripts/cloudflare/http-client.ts` (仮) |
| cf.sh wrapper | 認証情報注入のみ | `scripts/cf.sh` (既存) |
| output formatter | JSON / Markdown 生成 + mask | `scripts/cloudflare/output-formatter.ts` (仮) |

> 3 部位を分離することで、Phase 4 で http client に対する allowlist contract test を独立に実施できる。

## 5.2 secret 漏洩防止設計

- `console.log` / `process.stdout.write` で API レスポンス本体をダンプしない。
- 出力ファイル書き出し前に **既知 token パターンに対する自己 grep** (`eyJ` / `Bearer ` / `op://` など) を行い、検出時は **exit code 2 で fail-fast** する。
- script 内の関数 / 変数命名で `token` / `secret` を含む値を **戻り値や export 経路に乗せない**。
- `.env` ファイルの直接 fs.read を行わない。認証情報は `bash scripts/cf.sh` 経由で `op run --env-file=.env` 注入された環境変数からのみ取得。

### grep gate 対象 (Phase 3 NO-GO 入力)

| grep | 対象範囲 |
| --- | --- |
| 既知 token prefix (`eyJ`, `Bearer `, `op://`) | 出力 JSON / Markdown / log |
| 値パターン (Cloudflare API Token 形式) | 出力 JSON / Markdown / log |

## 5.3 `wrangler` 直接呼び出し禁止の自己検査

- script ソース全体に対し、`grep -n "wrangler "` が一致しないことを実装側 lint で gate 化する (別 PR)。
- 設計ドキュメント側でも本 § に明記。Phase 3 NO-GO 条件で重複明記する。
- `~/Library/Preferences/.wrangler/config/default.toml` の OAuth トークン読み取りも禁止。
- `wrangler login` のローカル OAuth トークン保持も禁止 (CLAUDE.md `Cloudflare 系 CLI 実行ルール`)。

### grep gate 対象

| grep | 対象範囲 | 除外 |
| --- | --- | --- |
| `wrangler ` 直接呼び出し | 後続実装 script / runbook command sample | `scripts/cf.sh` 内部 / 禁止例の説明文 |

## 5.4 mutation endpoint 禁止の自己検査

- 後続実装 script の API call layer に対し、HTTP method `POST` / `PUT` / `PATCH` / `DELETE` が現れないことを実装側 lint / 単体テストで gate 化する (別 PR)。
- 設計の API endpoint allowlist (`api-allowlist.md`) を SSOT とし、本 § で重複明記する。

### grep gate 対象

| grep | 対象範囲 |
| --- | --- |
| mutation method (`POST`/`PUT`/`PATCH`/`DELETE`) | 後続実装 script の API call layer / generated output |

## 5.5 三軸 NO-GO 条件サマリ (Phase 3 へ引き渡し)

| 軸 | NO-GO 条件 | 検出方法 |
| --- | --- | --- |
| mutation 禁止 | mutation endpoint が API call layer に出現 | grep `POST|PUT|PATCH|DELETE` (実装 script 限定) |
| secret 漏洩防止 | secret 値 / Bearer header / OAuth token prefix が出力 / log に出現 | grep token pattern (output evidence 限定) |
| `wrangler` 検出 | `wrangler` 直接実行が実装 script / runbook command に出現 | grep `wrangler ` (cf.sh 内部 / 禁止例説明文を除外) |

## 5.6 grep 対象の限定 (誤爆防止)

禁止語は仕様書本文に「禁止例」として現れる。docs 全体 grep を NO-GO にしない。grep gate の対象を以下に限定する:

| grep | 対象 |
| --- | --- |
| mutation method | 後続実装 script の API call layer / generated output |
| secret pattern | generated output JSON / Markdown / log |
| `wrangler` direct call | command sample / 後続実装 script。`scripts/cf.sh` 内部と禁止例の説明文は対象外 |

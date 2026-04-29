# Phase 6 成果物 — 異常系・エラーハンドリング

## 1. 異常系シナリオ一覧

| ID | シナリオ | トリガ | ハンドラ動作 | 期待 wire format | UT-08 通知側の振る舞い |
| --- | --- | --- | --- | --- | --- |
| E-1 | D1 完全ダウン | `prepare()` で Cloudflare runtime が throw | catch → 503 | `503` + `Retry-After: 30` + `{"ok":false,"db":"error","error":"<Error.name>"}` | 30s 待ち → 2〜3 回 retry → なお失敗で alert |
| E-2 | D1 一時的タイムアウト | `first()` で promise reject | catch → 503 | E-1 と同 | 同上 |
| E-3 | binding 未注入（HEALTH_DB_TOKEN は設定済み） | `c.env.DB` が undefined | `prepare` 呼び出しで TypeError | 503（catch fallback）| 同上。dashboard の binding 設定誤りを示唆 |
| E-4 | HEALTH_DB_TOKEN 未設定 | `c.env.HEALTH_DB_TOKEN` が undefined | fail-closed → 503（DB 触らない） | `503` + `Retry-After:30` + `{"ok":false,"db":"error","error":"HEALTH_DB_TOKEN unconfigured"}` | DB 起因と区別するため UT-08 側で error 文字列を grep |
| E-5 | token 欠落 | `X-Health-Token` ヘッダなし | 401 即時返却 | `401` + `{"ok":false,"error":"unauthorized"}` | UT-08 では 401 を error 計上しない（client error） |
| E-6 | 誤 token | `X-Health-Token` 値が不一致 | 401 即時返却 | E-5 と同 | 同上。token rotation 後のキャッシュ古値が想定 |
| E-7 | WAF 解除事故 + token なし | WAF rule 一時 disable + token 欠落 | endpoint で 401 | E-5 と同 | defense in depth が機能していることを意味（インシデント対応で WAF 復旧）|
| E-8 | SELECT 1 が null（D1 binding は生きているが DB がレスポンスを返さない） | `first()` が null 返却 | `throw new Error("SELECT 1 returned null")` → catch → 503 | E-1 と同 | 同上 |

## 2. UT-08 通知基盤との整合

| 項目 | 値 |
| --- | --- |
| alerting 閾値 | 503 が連続 3 回（1.5 分以内）= alert / 503 単発 = 無視（`Retry-After: 30` を尊重） |
| 401 の扱い | client error として alert 計上しない |
| error 文字列 grep | `HEALTH_DB_TOKEN unconfigured` 文字列は config drift として priority HIGH に分類 |

> 上記閾値は UT-08 通知基盤側の設計合意が前提（Phase 3 open question の宿題）。UT-08 PR 側でも本ドキュメントを参照する。

## 3. エラーメッセージ漏洩リスク

`error` フィールドに `err.name` のみを返す設計にしている。仮に `err.message` を返すと:

- D1 binding 名やテーブル名が漏れる
- バックトレースが漏れる
- 内部 SQL クエリ文字列が漏れる

→ `err.name`（例: `Error` / `TypeError`）に限定し、原因切り分けは Workers ログ（`bash scripts/cf.sh tail` 経由）で行う。

## 4. catch でも握り潰さないログ

ハンドラ内では明示的な `console.error` を呼ばないが、Cloudflare Workers の uncaught exception でも catch 節は捕捉する。失敗した際の根本原因調査は `wrangler tail` 系コマンドで構造化ログを参照する。

> セキュリティ要件: `console.error(err)` で full stack trace を吐くと、Workers tail を見られる人に内部実装が露出する。MVP では catch のみで十分とし、観測強化は UT-08 と統合した後で再検討。

## 5. 引き渡し

Phase 7 へ: AC-1〜AC-9 と E-1〜E-8 / T1〜T5 のトレース表を作成し、抜け漏れゼロを証明。

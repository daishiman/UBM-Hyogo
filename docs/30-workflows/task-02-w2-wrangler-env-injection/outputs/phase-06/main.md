# Phase 6 — 異常系検証

| 異常系 | 期待挙動 | 検証 |
| --- | --- | --- |
| 必須キー欠落（`AUTH_URL` 不在） | `getEnv()` は `ZodError` を throw | T1 / T2 派生で確認、T4 で optional の境界明示 |
| URL 形式違反（`NEXT_PUBLIC_API_BASE_URL = "not-a-url"`） | `ZodError` | T2 PASS |
| `SENTRY_TRACES_SAMPLE_RATE` 範囲外（`1.5`） | `ZodError` | T3 PASS |
| Workers context 未注入 | `try/catch` で `process.env` フォールバック | T5 で Cloudflare context あり / `beforeEach` で throw 済の通常時挙動を確認 |
| optional secret（`SENTRY_DSN_WEB` / `AUTH_SECRET`）欠落 | parse 通過 | T4 PASS |
| 公開 subset への secret 漏れ | `getPublicEnv()` は `ENVIRONMENT` / `NEXT_PUBLIC_API_BASE_URL` のみ返す | T6 PASS |

## fail fast 方針

- 起動時に env 不整合があれば throw し、service 起動を阻止する。
- silent fallback（空文字 / `127.0.0.1:8888`）は禁止。AC-5 の grep gate で機械保証。

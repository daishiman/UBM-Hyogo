# Phase 6: 異常系ケース

## 1. 失敗ケース表

| # | ケース | 原因 | 検出方法 | リカバリ | ログ方針 |
| --- | --- | --- | --- | --- | --- |
| F-1 | `JSON.parse(GOOGLE_SERVICE_ACCOUNT_JSON)` 失敗 | secret に不正 JSON / 改行混入 | Zod schema で fail-fast | Cloudflare Secrets を再 put（Phase 5 ステップ 5）| message のみ log、key 値は redact |
| F-2 | 必須キー欠落 (`client_email` / `private_key`) | JSON は parse できるが SA キー未マイグレーション | Zod schema | 1Password の SA item を再生成 → secret 再 put | redact |
| F-3 | JWT 署名失敗 | `private_key` PEM 改行解釈ミス / `\n` を `\\n` のまま | `crypto.subtle.importKey` reject | PEM の改行を `replace(/\\n/g, '\n')` で正規化 | redact |
| F-4 | 401 Invalid grant | iss / aud / scope 不整合 / 時刻ズレ > 5 分 | token endpoint 401 | claim 内容を再確認、Workers の `Date.now()` 信頼 | header / body redact |
| F-5 | **403 PERMISSION_DENIED**（**苦戦箇所 4**） | Sheets に SA メール共有忘れ | Sheets API 403 | Phase 5 ステップ 3 へ戻り共有設定 | 該当 spreadsheetId のみ log |
| F-6 | 429 Rate Limited | quota 超過 / token 取得頻度過多 | response status 429 | exponential backoff（1s → 2s → 4s、最大 3 回） | retry 回数を log |
| F-7 | 5xx 一時障害 | Google 側障害 | response status 5xx | exponential backoff（同上）+ Cloudflare alert | retry 回数を log |
| F-8 | Workers fetch timeout | DNS / network | `Promise.race` with `AbortController` 30s | リトライ 1 回のみ | timeout 発生を log |
| F-9 | TTL 切れ直前のキャッシュヒット | 期限間際の race | 5 分前で proactive refresh | 自動 refresh | refresh 発生を log |
| F-10 | 並列 in-flight 重複 | 同時 2 リクエストで token 取得が並走 | in-flight Promise share | 共有 Promise を返す | n/a |
| F-11 | `.dev.vars` ガード失敗 | `.gitignore` に書かれていない / commit 済 | git pre-commit hook + `git check-ignore` | `git rm --cached` + `.gitignore` 追加 + secret rotation | n/a |
| F-12 | `wrangler` 直接実行 | CLAUDE.md 違反 | lefthook / CI grep | `bash scripts/cf.sh` 経由に書き換え | CI で fail |

## 2. 苦戦箇所 4 件のマッピング

| 苦戦箇所 | 対応 failure case |
| --- | --- |
| 1. SA vs OAuth 選定迷い | Phase 2/3 設計で解消（実行時異常系には現れない） |
| 2. Workers での JWT / token refresh 難 | F-3 / F-4 / F-9 / F-10 |
| 3. シークレット環境別管理 | F-1 / F-2 / F-11 / F-12 |
| 4. SA メール共有忘れ 403 | F-5 |

## 3. リトライ・バックオフ戦略

```
attempt 1: immediate
attempt 2: 1s wait
attempt 3: 2s wait
attempt 4: 4s wait → 失敗時は throw
```

429 / 5xx / timeout のみ retry。401 / 403 / parse error は **retry しない**（設定ミス確定）。

## 4. log redact 規約

```ts
function redact(s: string): string {
  return s.replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[REDACTED]")
          .replace(/"private_key":\s*"[^"]*"/g, '"private_key":"[REDACTED]"')
          .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]");
}
```

すべての log 出力に redact を必ず通す。

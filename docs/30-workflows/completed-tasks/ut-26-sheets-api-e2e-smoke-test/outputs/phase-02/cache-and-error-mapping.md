# UT-26 Phase 2 副成果物 — cache-and-error-mapping.md

| 項目 | 値 |
| --- | --- |
| タスク | Sheets API エンドツーエンド疎通確認 (UT-26) |
| Phase | 2 / 13（設計） |
| 作成日 | 2026-04-29 |
| 主成果物 | `smoke-test-design.md`（同フォルダ） |

---

## 1. アクセストークンキャッシュ仕様（ADR-CACHE-001）

### 1.1 Context

Google OAuth 2.0 の `access_token` は `expires_in=3600` で発行される。Workers Edge Runtime は isolate ごとにメモリ空間が独立するため、永続キャッシュには KV / Durable Object が必要。UT-26 は smoke 検証スコープのため、**同一 isolate 内 1 時間有効**な軽量キャッシュで AC-4（2 回目以降の OAuth fetch 省略）を満たすことを目指す。

### 1.2 Decision

| 観点 | 決定 |
| --- | --- |
| 配置 | `apps/api/src/jobs/sheets-fetcher.ts` 内 module scope の `Map<scopeKey, { token, exp }>`（既存 UT-03 実装に準拠、reuse） |
| キー設計 | `sa:${client_email}:${scope}`（将来の SA / scope 切替に備える） |
| TTL | `Date.now() + (expires_in - 60) * 1000`（clock skew / latency バッファ 60 秒） |
| 失効戦略 | `Date.now() >= exp` で即時再取得 |
| isolate 越境 | **保証しない（out-of-scope, OOS）**。同一 isolate でのみ AC-4 を満たす旨を runbook に明記 |
| 検証方法 | smoke route を 1 秒以内に 2 回連続 curl し、レスポンスの `tokenFetchesDuringSmoke` が `false → true` に遷移、Workers Logs で OAuth token endpoint への fetch が 1 回のみ発生することを確認 |
| KV / DO への昇格条件 | isolate 越境キャッシュが必要になった時点で別タスク化（Phase 12 unassigned-task-detection.md に候補登録） |

### 1.3 擬似コード

```ts
// apps/api/src/jobs/sheets-fetcher.ts (UT-03 既存実装を reuse、本タスクで modify しない)
type CacheEntry = { token: string; exp: number };
const tokenCache = new Map<string, CacheEntry>();

export async function getAccessToken(env: Env): Promise<{ accessToken: string; cacheHit: boolean }> {
  const sa = JSON.parse(env.GOOGLE_SHEETS_SA_JSON);
  const scope = "https://www.googleapis.com/auth/spreadsheets.readonly";
  const key = `sa:${sa.client_email}:${scope}`;

  const hit = tokenCache.get(key);
  if (hit && Date.now() < hit.exp) {
    return { accessToken: hit.token, cacheHit: true };
  }

  // JWT 構築 → Web Crypto 署名 → POST oauth2.googleapis.com/token
  const jwt = await buildSignedJwt(sa, scope);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new SheetsAuthError(res.status, await res.text());
  const { access_token, expires_in } = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache.set(key, { token: access_token, exp: Date.now() + (expires_in - 60) * 1000 });
  return { accessToken: access_token, cacheHit: false };
}
```

### 1.4 Consequences

- 利点: 実装極小、UT-03 reuse で済む、AC-4 を最短で満たせる
- 欠点: isolate 跨ぎでは初回 OAuth fetch が再発する（運用上は無視できる粒度、Phase 11 で観測）
- リスク緩和: TTL を `expires_in - 60s` にすることで clock skew によるトークン期限切れ 401 を抑止

---

## 2. エラー分類マッピング

### 2.1 401 / 403 / 429 / parse-error / network のマッピング表

| 観測元 | HTTP | Google エラー | 内部 code | 返却 HTTP | 想定原因（runbook 切り分け順） |
| --- | --- | --- | --- | --- | --- |
| Sheets API | 401 | UNAUTHENTICATED | `SHEETS_AUTH_FAILED` | 502 | (a) JWT 署名失敗 / (b) iat/exp の clock skew / (c) SA JSON `private_key` の `\n` 改行コード破損 / (d) token 期限切れ（cache TTL ミス） |
| Sheets API | 403 | PERMISSION_DENIED | `SHEETS_FORBIDDEN` | 502 | (a) SA メールが対象 Sheets に共有されていない / (b) Google Sheets API が GCP プロジェクトで無効化 / (c) `formId` を `spreadsheetId` として誤指定 / (d) scope 不足（`spreadsheets.readonly` 未付与） |
| Sheets API | 404 | NOT_FOUND | `SHEETS_NOT_FOUND` | 502 | spreadsheetId が存在しない、または range が不正 |
| Sheets API | 429 | RESOURCE_EXHAUSTED | `SHEETS_RATE_LIMITED` | 503 (Retry-After 伝搬) | (a) 300 req/min/project 超過 / (b) per-user quota / (c) 並列叩き |
| Sheets API | 5xx | INTERNAL / UNAVAILABLE | `SHEETS_UPSTREAM_ERROR` | 502 | Google 側障害、リトライ可 |
| OAuth endpoint | 401/400 | invalid_grant 等 | `SHEETS_AUTH_FAILED` | 502 | JWT 内容不正、iat/exp 範囲外、SA 無効化 |
| Parser | n/a | JSON parse 失敗 | `SHEETS_PARSE_ERROR` | 502 | SA JSON が壊れている、レスポンスが想定形式と異なる |
| Network | n/a | TypeError / fetch failed | `SHEETS_NETWORK_ERROR` | 502 | Workers から外部 fetch 失敗、DNS、TLS、wrangler dev `--local` 制約 |

### 2.2 error-mapper 擬似コード

```ts
// apps/api/src/lib/smoke/error-mapper.ts
export type SmokeErrorCode =
  | "SHEETS_AUTH_FAILED"
  | "SHEETS_FORBIDDEN"
  | "SHEETS_NOT_FOUND"
  | "SHEETS_RATE_LIMITED"
  | "SHEETS_UPSTREAM_ERROR"
  | "SHEETS_PARSE_ERROR"
  | "SHEETS_NETWORK_ERROR";

export function classifySheetsError(e: unknown): {
  code: SmokeErrorCode;
  httpStatus: number;
  hint?: string;
  runbookRef?: string;
  retryAfter?: number;
} {
  if (e instanceof SheetsHttpError) {
    switch (e.status) {
      case 401:
        return { code: "SHEETS_AUTH_FAILED", httpStatus: 502, runbookRef: "phase-11#auth-401" };
      case 403:
        return {
          code: "SHEETS_FORBIDDEN",
          httpStatus: 502,
          hint: "SA share / API enable / spreadsheetId / scope",
          runbookRef: "phase-11#forbidden-403",
        };
      case 404:
        return { code: "SHEETS_NOT_FOUND", httpStatus: 502, runbookRef: "phase-11#not-found" };
      case 429:
        return {
          code: "SHEETS_RATE_LIMITED",
          httpStatus: 503,
          retryAfter: e.retryAfter,
          runbookRef: "phase-11#rate-limit",
        };
      default:
        if (e.status >= 500) {
          return { code: "SHEETS_UPSTREAM_ERROR", httpStatus: 502 };
        }
    }
  }
  if (e instanceof SyntaxError) return { code: "SHEETS_PARSE_ERROR", httpStatus: 502 };
  if (e instanceof TypeError) return { code: "SHEETS_NETWORK_ERROR", httpStatus: 502 };
  return { code: "SHEETS_UPSTREAM_ERROR", httpStatus: 502 };
}
```

### 2.3 ログ仕様（構造化ログ）

```jsonc
// success
{
  "event": "sheets_smoke_test",
  "status": "success",
  "env": "staging",
  "spreadsheetId_tail4": "3Xg",          // 末尾 4 桁のみ
  "sheetTitle": "回答 1",
  "rowCount": 12,
  "tokenFetchesDuringSmoke": true,
  "latency_ms": 184
}

// error
{
  "event": "sheets_smoke_test",
  "status": "error",
  "code": "SHEETS_FORBIDDEN",
  "runbookRef": "phase-11#forbidden-403",
  "hint": "SA share / API enable / spreadsheetId / scope",
  "latency_ms": 312
}
```

### 2.4 redact 項目（ログ・PR・証跡から除外する値）

以下の値は **構造化ログ・curl 出力例・PR 説明文・コミットメッセージのいかなる場所にも残さない**。

| 項目 | 理由 | 代替表現 |
| --- | --- | --- |
| `GOOGLE_SHEETS_SA_JSON` 全文 | Service Account 秘密鍵を含む | 出力しない |
| `private_key` フィールド | RSA 秘密鍵 | 出力しない |
| `client_email` | SA 識別子（運用者特定可能） | 出力しない（必要時は `sa:***@***` 形式でマスク） |
| `access_token` | OAuth トークン | 出力しない |
| `Authorization` ヘッダ全体 | Bearer 値含む | ログ出力対象から除外 |
| `SMOKE_ADMIN_TOKEN` | 認可トークン | 出力しない |
| `spreadsheetId` 全文 | URL 取得可能性 | 末尾 4 桁のみ表示（`spreadsheetId_tail4`） |
| `values[][]` の生データ | 会員 PII（氏名 / email 等）の混入リスク | `sampleRowsRedacted` として行数のみ、または英数字を `*` でマスク |

### 2.5 redact 検証手段

- PR 作成時: `rg -n 'BEGIN PRIVATE KEY|access_token=|client_email|SMOKE_ADMIN_TOKEN' --hidden` がヒット 0 件
- ログ出力箇所: `JSON.stringify` 直前に redact ホワイトリスト（許可フィールドのみ）を通すヘルパーを `format-result.ts` に集約
- 違反検出時: Phase 10 で NO-GO とし、commit を取り直す

---

## 3. 401 / 403 / 429 ごとの runbook ステップ（Phase 11 へ渡す切り分け順番）

### 3.1 401 (`SHEETS_AUTH_FAILED`)

1. cache TTL バッファ（60s）が clock skew を吸収しているか確認 → smoke route を空回しキャッシュをクリア後再試行
2. `apps/api/src/jobs/sheets-fetcher.ts` の private_key 改行コード正規化が機能しているか（`replace(/\\n/g, "\n")` の有無）
3. SA JSON 自体の有効性を `wrangler secret list --env staging` で配置確認（値は表示しない）
4. それでも 401 の場合は SA を再発行し UT-25 経由で再配置

### 3.2 403 (`SHEETS_FORBIDDEN`)

切り分けは以下の順で必ず実施。

1. **SA メール共有の確認**: 対象 spreadsheet の「共有」UI に SA メール（`...gserviceaccount.com`）が「閲覧者」以上で含まれるか
2. **Sheets API 有効化の確認**: GCP コンソール → API & Services → Library で「Google Sheets API」が enabled か
3. **spreadsheetId vs formId 取り違え**: `wrangler.toml` の `SHEETS_SPREADSHEET_ID` 末尾 4 桁と、Forms「回答」タブ → 連携シート URL の `/spreadsheets/d/<ID>/edit` 末尾 4 桁を比較
4. **scope 確認**: smoke route が要求する scope が `https://www.googleapis.com/auth/spreadsheets.readonly` であり、SA の組織ポリシーで許可されているか

### 3.3 429 (`SHEETS_RATE_LIMITED`)

1. レスポンスヘッダ `Retry-After` を確認し、その秒数だけ待機
2. 並列 curl を停止（smoke route は 1 並列で十分）
3. 同 GCP プロジェクトで他のジョブが叩いていないか確認

### 3.4 parse-error / network-error

1. SA JSON が `.dev.vars` で正しく op 参照解決されているか（`op run` 経由で起動しているか）
2. `wrangler dev --local` を使っていないか確認（必ず `--remote` を使う）
3. 一時的な Google 側障害の可能性を `https://www.google.com/appsstatus/dashboard/` で確認

---

## next: Phase 3 へ引き渡す事項

- **キャッシュ ADR-CACHE-001**: in-memory Map、TTL `expires_in - 60s`、isolate 越境は OOS（best-effort）として固定
- **エラー分類**: 401/403/429/404/5xx/parse/network の 7 区分が `error-mapper.ts` で `SmokeErrorCode` に正規化される
- **redact 仕様**: SA JSON / private_key / client_email / access_token / Authorization / SMOKE_ADMIN_TOKEN / spreadsheetId 全文 / values 生データの 8 項目は出力禁止
- **runbook ステップ**: 401 / 403 / 429 / parse / network 各 4 ステップを Phase 11 troubleshooting-runbook の起点として渡す

# セキュリティ leak 防止テスト設計（Phase 6 成果物）

## 検証軸（5 ケース）

| # | 対象 | テスト | 検証パターン |
| --- | --- | --- | --- |
| 3.1 | `errorHandler` 5xx body | スタックトレース不混入 | response body 文字列に `at ` / `:line:col` 形式が出現しない |
| 3.2 | `errorHandler` 5xx body | 環境変数キー名 / 接続文字列不混入 | `D1_*` / `GOOGLE_SERVICE_ACCOUNT_JSON` を error message に含めても response に出ない |
| 3.3 | `errorHandler` 5xx body | 認証トークン不混入 | `Authorization: Bearer ...` を error.message に詰めても response にマスクされる |
| 3.4 | 構造化ログ | `redactKeys` 一覧との整合 | `private_key` / `client_email` / `password` / `token` キーは `[REDACTED]` |
| 3.5 | 4xx body | XSS 入力の JSON エスケープ | `<script>` を含む detail はそのまま JSON 文字列としてエスケープされる（HTML レンダリングはクライアント責務）|

## redactKeys 一覧（実装値）

`packages/shared/src/logging.ts` の `SENSITIVE_KEY_SUBSTRINGS`:

```
authorization
cookie
private_key
client_email
password
token
secret
credential
session
api_key
apikey
```

これらの substring を含むキー名は `[REDACTED]` に置換される（大文字小文字を区別しない、case-insensitive）。

加えて以下の措置:

- 文字列長 > 200 → `...[truncated:N chars]` で切り詰め
- 循環参照 → `[Circular]` に置換
- `Error` インスタンス → `{ name, message, stackPreview: 先頭 5 行 }` のみ抽出

## ホワイトリスト方式の二段防御

| 段階 | 適用箇所 | 効果 |
| --- | --- | --- |
| 段階 1 | `ApiError.toClientJSON()` | クライアント返却フィールドを 7 キーに限定（`stack`/`cause`/`context` 等は構造的に到達不可） |
| 段階 2 | `logging.sanitize()` | ログ出力時に substring マッチで自動 REDACT |

両段階で「取りこぼし → 漏洩」の単一障害点を作らない設計。

## 開発環境の例外

`c.env?.ENVIRONMENT === "development"` のときのみ:

```ts
clientView.debug = {
  originalMessage: ...,
  stackPreview: stack.split("\n").slice(0, 5).join("\n"),
};
```

を付与。staging / production では `debug` フィールドは存在しない（条件分岐で append しないため、JSON 出力に現れない）。

production での意図せぬ debug 露出は `c.env?.ENVIRONMENT` 判定をすり抜けない限り起きない。production の `wrangler.toml` 設定で `ENVIRONMENT = "production"` を保証する責務は UT-04 (CI/CD secrets 同期) と運用側にある。

## 検証ケース詳細（机上）

### 3.1: スタックトレース不混入

```ts
// 入力
const err = new Error("boom");  // err.stack に "Error: boom\n    at ..." 含む
errorHandler(err, ctx);
// 出力（production）
const body = await response.json();
// body.detail === "内部エラーが発生しました。"（defaultDetail）
// body に "at " も ":line:col" も含まれない（toClientJSON が strip）
```

机上根拠: `ApiError.toClientJSON()` が返すキーは 7 つに限定され、`stack` は `log` 配下にのみ保持される。`buildResponse` は `clientView` を JSON.stringify する。

### 3.2: 環境変数キー名 / 接続文字列不混入

```ts
const err = new Error("Failed: GOOGLE_SERVICE_ACCOUNT_JSON malformed");
errorHandler(err, ctx);
// production response body:
// body.detail === "内部エラーが発生しました。"（defaultDetail で上書き、message は転載されない）
```

机上根拠: `ApiError.fromUnknown(err)` で `detail` には `defaultDetail` が使われ、`err.message` は `log.context.originalMessage` にのみ保持。クライアントには出ない。

### 3.3: 認証トークン不混入

```ts
const err = new Error("Bearer eyJhbGc...");
errorHandler(err, ctx);
// 同様に detail は defaultDetail、token 文字列は log.context.originalMessage のみ
// ログ側でも sanitize により Bearer xxx を含むキー名（authorization 等）はマスク
```

ただし `originalMessage` キー自体は redact 対象キー名に含まれないため、message 値の中に Bearer トークンが入っているとログには残る。これはログの設計上「サーバ側のみ閲覧可能」を前提とした扱い。クライアント返却には現れない。

→ 改善検討: `originalMessage` 値に対する追加サニタイズ（`Bearer\s+\S+` パターンマッチ → REDACT）を将来 UT-08 で検討する。

### 3.4: redactKeys 整合

```ts
sanitize({ private_key: "----BEGIN-----...", token: "abc", message: "ok" })
// → { private_key: "[REDACTED]", token: "[REDACTED]", message: "ok" }
```

机上根拠: `logging.ts` の `walk(v, k)` 関数で `isSensitiveKey(k)` 判定 → 値を `[REDACTED]` に置換。

### 3.5: XSS 入力の JSON エスケープ

```ts
new ApiError({ code: "UBM-1001", detail: "<script>alert(1)</script>" })
  .toClientJSON()
  // → { detail: "<script>alert(1)</script>", ... }
JSON.stringify(...)
  // → "..., \"detail\": \"<script>alert(1)<\\/script>\", ..."
```

`JSON.stringify` のデフォルト動作で `<` `>` は文字としてエスケープされる（unicode escape は不要）。クライアント側で `dangerouslyInnerHTML` を使わない限り XSS は発生しない。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | redactKeys 11 件のカバレッジを計上 |
| Phase 8 | sanitize の DRY 整理候補チェック（middleware 側で重複サニタイズしていないか）|
| Phase 9 | 品質保証で security 観点の最終確認 |
| UT-08 | 将来、`originalMessage` 値内の Bearer / Cookie パターン redact を検討 |

## 既知の限界 / 後続フォロー

| # | 内容 | 対応予定 |
| --- | --- | --- |
| L-1 | `originalMessage` 値内の Bearer トークン文字列はサーバログに残る | UT-08 で値レベル redact 検討 |
| L-2 | サニタイズキー追加は静的定数の編集が必要 | DRY 上は許容範囲（運用変更頻度低）|

# Lessons Learned — UT-03 Google Sheets API 認証 Wave (Phase 12 close-out)

> 2026-04-29 新規作成: UT-03 Sheets API 認証実装の苦戦箇所と派生知見を分離記録する。`lessons-learned-current-2026-04.md` への直接追記は L-UT03-* と他 wave (UT-06 等) の知見が混在し可読性が落ちるため、follow-up 個別ファイルに分離する。
> 関連: `references/environment-variables.md`（§Google Sheets / Service Account）/ `references/architecture-implementation-patterns.md`（§Edge Runtime JWT）/ `docs/00-getting-started-manual/specs/01-api-schema.md` / `docs/30-workflows/ut-03-sheets-api-auth-setup/`
> 出典: `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-01〜12/`（implementation-guide / system-spec-update-summary / runbook / skill-feedback-report）
> 後続 consumer: UT-09（Sheets 読出）/ UT-21（Sheets ↔ D1 sync）/ Drive・Calendar 連携（将来）

---

## L-UT03-001: Service Account vs OAuth Client の選定（無料枠 + KV/D1 不要を優先）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | architecture / authentication / cost design |
| 症状       | OAuth Client（refresh token フロー）を選ぶと、refresh token 永続化のために KV / D1 / Durable Objects のいずれかが必要になり、無料枠の境界を侵食する。consent 画面再同意のオペが定期発生し、bot 用途として運用コストが嵩む |
| 原因       | Google Sheets を「サーバが定期 read/sync する用途」に対し、OAuth Client は本来「人間ユーザーの代理アクセス」モデル。サーバ用途には Service Account + JWT (RFC 7523) が canonical |
| 解決策     | Service Account を採用し、JWT を毎回生成 → `/token` で access token と交換、メモリキャッシュのみで運用。refresh token を一切持たない設計にすることで、Cloudflare KV / D1 不要を確定させ無料枠を維持。Spreadsheet 側は Service Account の email を Editor / Viewer 共有する運用で権限委譲する |
| 再発防止   | Drive / Calendar 等 Google API を新規追加する際、最初に「人間 vs サーバ」軸で選定し、サーバ用途は Service Account 一択にする決定表を `references/architecture-implementation-patterns.md` に置く。OAuth Client を採用するときは KV/D1 採用と引き換えになることを task-spec の Phase 02 で明示する |
| 関連タスク | UT-03 / Phase 01 設計 / Phase 12 system-spec-update-summary |

## L-UT03-002: Cloudflare Workers 上の JWT 生成は Web Crypto API でしか動かない

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | runtime compatibility / Edge runtime / cryptography |
| 症状       | `google-auth-library` / `jsonwebtoken` 等 Node native の JWT lib は `crypto.createSign` / Buffer に依存しており、Cloudflare Workers の Edge runtime で `Cannot resolve 'crypto'` / `Buffer is not defined` で落ちる。`nodejs_compat` flag を立てても署名 path が動かないケースがある |
| 原因       | Workers runtime は V8 isolate ベースで Node API は限定。RSA 署名は Web Crypto API (`crypto.subtle.importKey` + `crypto.subtle.sign('RSASSA-PKCS1-v1_5', ...)`) が canonical path |
| 解決策     | `signServiceAccountJwt(claim, privateKeyPem)` を自前実装。`pemToPkcs8(pem)` で PEM ヘッダ/フッタ除去 → base64 デコード → `ArrayBuffer` 化。`crypto.subtle.importKey('pkcs8', ..., { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])` → `crypto.subtle.sign(...)` で raw 署名を取得。base64url で header.claims.signature を結合する |
| 再発防止   | Google API / 任意 RS256 JWT を Workers で生成する箇所は **Web Crypto を canonical** とし、`apps/api/src/integrations/google/jwt.ts` を再利用する。Drive / Calendar 連携でも同モジュールから `signServiceAccountJwt` を import する |
| 関連タスク | UT-03 / Phase 04 実装 / `packages/integrations/google/src/sheets/jwt.ts` |

## L-UT03-003: Cloudflare Secret に PEM を貼ると `\n` が文字列エスケープされる罠

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | secrets / private key handling / operator runbook |
| 症状       | `bash scripts/cf.sh secret put GOOGLE_SHEETS_PRIVATE_KEY` で Service Account JSON の `private_key` フィールドをそのまま貼り付けると、改行が `\n`（2文字のリテラル）として保存され、`crypto.subtle.importKey` が `DataError: Invalid key data` を投げる |
| 原因       | JSON 化された Service Account credential の `private_key` は `"-----BEGIN PRIVATE KEY-----\n...\n-----END..."` のように改行が `\n` エスケープされている。Cloudflare Secret は値をそのまま保存するため、runtime で文字列の `\n` を実改行に正規化する責務がアプリ側にある |
| 解決策     | `pemToPkcs8(pem)` の先頭で `pem.replace(/\\n/g, '\n')` を実施し、エスケープと実改行の両方の入力を許容する。secret 投入手順 (operator-runbook) では「JSON の `private_key` 値だけを抜き出して貼る」「`-----BEGIN/END-----` 行を含めて 27 行になっているか cat で確認する」を必須手順にする |
| 再発防止   | 任意の PEM secret を Workers Secret に投入する全ケースで、import 直前に `\\n -> \n` 正規化を入れる。`pemToPkcs8` を共有ヘルパとして export し、Drive / Calendar 連携でも同じ正規化を経由する |
| 関連タスク | UT-03 / Phase 05 secret 投入 / Phase 11 疎通 / `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-11/operator-runbook.md` |

## L-UT03-004: シークレット環境別管理は `.dev.vars` + `bash scripts/cf.sh secret put` に一本化

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | secrets management / local dev / environment separation |
| 症状       | 開発者が `.env` に Service Account JSON を平文で書き、commit 直前に気付いて revoke するインシデントが起きやすい。逆に `wrangler secret put` を直接叩くと `~/Library/Preferences/.wrangler/config/default.toml` にトークンが残り CLAUDE.md の禁止事項に違反する |
| 原因       | Cloudflare Workers のローカル開発は `.dev.vars` を読むが、これも平文ファイル。`.env` も同様。両方とも `.gitignore` で守らないと AI コンテキスト学習混入の事故源になる |
| 解決策     | (a) `.dev.vars` を `.gitignore` で必ず除外し、`.dev.vars.example` のみ commit。(b) 投入は `bash scripts/cf.sh secret put GOOGLE_SHEETS_CLIENT_EMAIL --env staging` 等のラッパー経由のみ（1Password `op run` で env を揮発注入、ファイルに残さない）。(c) ローカル `.dev.vars` は op 参照 `op://UBM-Hyogo/google-sheets-sa/...` で記述し、`scripts/with-env.sh` 経由で読む |
| 再発防止   | `references/environment-variables.md` の Sheets セクションに「環境ごとの secret 名 / 1Password vault path / ローテーション周期」を 1 表で書く。`wrangler secret put` の直接実行を grep で禁止する lefthook hook を将来追加する |
| 関連タスク | UT-03 / Phase 05 secret 投入 / CLAUDE.md §シークレット管理 / `scripts/cf.sh` |

## L-UT03-005: Spreadsheet 共有忘れによる 403 PERMISSION_DENIED の早期検出

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | operations / permission / smoke check |
| 症状       | Service Account の email を対象 Spreadsheet に共有し忘れると、access token 取得は成功するが Sheets API 呼び出しが `403 PERMISSION_DENIED: The caller does not have permission` で落ちる。token 不正と勘違いして認証側を疑い、調査が遅延する |
| 原因       | Service Account は「Google Workspace 上の独立ユーザー」と等価で、対象リソース毎に明示共有が必要。OAuth Client（人間ユーザー）の感覚で「組織内なので見える」と思い込むと外す |
| 解決策     | (a) AC-4 として「Service Account email を対象 Spreadsheet に Viewer / Editor で共有」を runbook の必須手順にする。(b) Phase 11 疎通確認に `curl https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}` を含め、403 が返ったら認証ではなく共有を疑うフローを明記。(c) `getSheetsAccessToken` 自体は共有有無を判定しないため、consumer 側 (UT-09 / UT-21) で 403 を Sheets 共有エラーとして translate する error mapper を共通化する |
| 再発防止   | Drive / Calendar でも同様の「Service Account 共有忘れ」が発生する。runbook テンプレに「対象リソース ID / 共有 email / 権限レベル」のチェック表を必須セクションとして追加する |
| 関連タスク | UT-03 / Phase 11 疎通 / UT-09 / UT-21 / `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-11/operator-runbook.md` §AC-4 |

## L-UT03-006: TTL 5 分リード refresh + in-flight Promise 共有で isolate 同時起動を吸収

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | performance / rate-limit / concurrency pattern |
| 症状       | Cloudflare Workers は同時リクエストで複数 isolate が同時に起動し、各 isolate が独立に `/token` を叩くと Google OAuth の rate limit に到達する。`expiresAt` ぴったりの境界で thundering herd が発生する |
| 原因       | module スコープのキャッシュは isolate 単位でしか共有されないが、それでも単一 isolate 内では並行 fetch を avoid したい。素朴な `if (cached.expiresAt > now()) return cached` は 5 分前に切れた瞬間に複数 caller が token endpoint を叩く |
| 解決策     | (a) `expiresAt - 5min < now()` を「リード refresh 閾値」とし、有効期限 5 分前から積極的に再取得する。(b) `inFlight: Promise<Token> \| null` を module スコープに持ち、refresh 中の caller は同じ Promise を共有して 1 回の `/token` 呼び出しに collapse する。(c) refresh 完了 / 失敗で `inFlight = null` に戻す finally を必ず入れる |
| 再発防止   | 同じパターンを Drive / Calendar の access token 取得でも再利用する。`createTokenCache<T>({ fetch, ttlMs, leadMs })` を汎用化して `packages/integrations/google/src/_shared/tokenCache.ts` に置くと将来の拡張で `getXxxAccessToken` を 5 行で書ける |
| 関連タスク | UT-03 / Phase 04 実装 / 後続 Drive / Calendar 統合 |

## L-UT03-007: `expiresAt` の単位混在（ms vs sec）でキャッシュ無効化バグ

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | bug pattern / time unit / off-by-1000 |
| 症状       | Google OAuth の `expires_in` は秒単位、JS の `Date.now()` は ms 単位。`expiresAt = now() + response.expires_in`（秒のまま加算）してしまい、cache が即座に expire 判定されて毎回 `/token` を叩く事故、または `expiresAt = now() + expires_in * 1000` を二重に掛けて 1 時間どころか 1000 時間有効になる事故が混在 |
| 原因       | Google API レスポンスは秒、JS の time API は ms、JWT の `iat` / `exp` は秒、と単位が混在する。型レベルで区別がないため目視レビューでも見逃しやすい |
| 解決策     | (a) `expiresAt` は **常に ms（epoch milliseconds）** で統一して module 内に保存。(b) `expiresAt = Date.now() + response.expires_in * 1000` の 1 箇所だけで変換する。(c) JWT claims (`iat` / `exp`) は秒で生成するヘルパ `nowSec()` / `nowSec() + 3600` を別関数に隔離。(d) 単体テストで「expires_in: 3600 を渡したら expiresAt - now() が 3,600,000 前後」の assertion を入れる |
| 再発防止   | branded type `type EpochMs = number & { __ms: never }` / `type EpochSec` を導入する案を将来検討。最低限、変換が起きる行に `// seconds -> ms` コメントを必須化する |
| 関連タスク | UT-03 / Phase 04 実装 / Phase 07 単体テスト |

## L-UT03-008: redact ヘルパは認証モジュールに同梱（PEM / private_key / Bearer の 3 パターン）

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | logging / secret leakage prevention |
| 症状       | エラーログに access token や Service Account JSON が露出するインシデントが、構造化ログ実装後の整備過程で繰り返し起きる。汎用 logger 側の redact は対象パターンが多すぎて完全網羅できない |
| 原因       | Sheets 認証で扱う秘密は (a) PEM `-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----`、(b) JSON 内 `"private_key": "..."`、(c) HTTP `Authorization: Bearer ya29....` の 3 形態に絞られる。汎用 logger ではなく、認証モジュール側で出力前 redact するのが責務として綺麗 |
| 解決策     | `redactSheetsSecrets(s: string): string` を `packages/integrations/google/src/sheets/redact.ts` に定義し、上記 3 パターンを `[REDACTED PEM]` / `"private_key":"[REDACTED]"` / `Bearer [REDACTED]` に置換。`getSheetsAccessToken` 内の throw/log path で必ず通す。logger 側は何もしなくてよい |
| 再発防止   | 認証/シークレット系モジュールは「自分の秘密は自分で redact する」を契約として `references/architecture-implementation-patterns.md` §Logging に明記。Drive / Calendar も同パターンに従う |
| 関連タスク | UT-03 / Phase 04 実装 / Phase 12 system-spec-update-summary |

## L-UT03-009: Forms と Sheets の認証契約を統合せず併存させる判断

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | architecture / abstraction timing |
| 症状       | Forms 認証 (UT-02 系) と Sheets 認証 (UT-03) を一枚の `getGoogleAccessToken({ scopes })` に統合したくなる衝動が出るが、Forms 側は OAuth Client（refresh token）、Sheets 側は Service Account（JWT）と認証モデルが根本的に異なる |
| 原因     | scope 違いだけならインタフェース統合可能だが、credential 形態（client_id+secret+refresh_token vs client_email+private_key）と token endpoint 呼び出しの引数形が違うため、無理に統合すると union 型と分岐だらけの内部実装になり責務が曖昧化する |
| 解決策     | `getFormsAccessToken({ env })` と `getSheetsAccessToken({ env, scopes })` を **別 export** として併存させ、互換 migration は別タスクで起票する。consumer 側 (UT-09 / UT-21) は scope に応じてどちらを呼ぶか明示的に選ぶ。共通化するのは `tokenCache` / `redact` / `pemToPkcs8` 等の primitive のみ |
| 再発防止   | 「2 つの実装が並んだら統合したくなる」原則は良いが、統合タスクは認証モデルが同種であることを確認してから起票する。task-spec テンプレに「統合候補は credential 形態が同一か」のチェック項目を入れる |
| 関連タスク | UT-03 / UT-02 / 将来の Drive / Calendar 統合タスク |

## L-UT03-010: NON_VISUAL evidence 縮約と smoke の UT-26 委譲

| 項目       | 内容 |
| ---------- | ---- |
| カテゴリ   | workflow / evidence policy / phase-12 close-out |
| 症状       | Phase 11 疎通で「実 Spreadsheet に対する end-to-end smoke」を実行したくなるが、UT-03 は認証モジュール単体の責務であり、Sheets API 呼び出しや D1 sync は consumer wave (UT-09 / UT-21 / UT-26) の責務。Phase 11 を肥大化させると責務違反 |
| 原因       | NON_VISUAL タスクは「呼び出されて初めて value が出る」性質で、単体 evidence は curl + wrangler dev log + 単体テストに限定するのが正しい。実 smoke は consumer wave のフェーズ 11 に積む |
| 解決策     | UT-03 Phase 11 は (a) `curl -X POST /internal/_debug/sheets-token`（debug endpoint）で access token 取得が 200 を返すこと、(b) wrangler dev log に redact 済みエラーのみ出ること、(c) 単体テスト 9 ケース pass、の 3 点に縮約。実 Spreadsheet smoke は UT-26（Sheets sync 統合 smoke）で実施することを Phase 12 unassigned-task-detection.md に明記して引き継ぐ |
| 再発防止   | NON_VISUAL evidence policy を `references/task-workflow-active.md` §Phase 11 に「単体責務の境界を超える smoke は consumer wave に委譲」のルールで明文化する |
| 関連タスク | UT-03 / UT-26（Sheets sync smoke）/ Phase 11 evidence / Phase 12 unassigned-task-detection |

---

## 後続 wave への引き継ぎ

- **UT-09 / UT-21（consumer）**: `getSheetsAccessToken({ env, scopes })` を import するだけで access token が得られる。403 PERMISSION_DENIED は Sheets 共有忘れとして translate する error mapper を consumer 側で持つ（L-UT03-005）。
- **Drive / Calendar 連携（将来）**: `signServiceAccountJwt` / `pemToPkcs8` / `tokenCache` / `redactSheetsSecrets` を再利用し、scope と endpoint URL だけ差し替える設計（L-UT03-002 / L-UT03-006 / L-UT03-008）。
- **Service Account ローテーション**: isolate ごとに古いトークンを保持する可能性があるため、key rotation 時は新 key 投入後に最大 token TTL（1 時間）+ isolate 寿命の合計時間まで両 key を許容する SOP を `unassigned-task` として起票する候補。

## 関連参照

- `.claude/skills/aiworkflow-requirements/references/environment-variables.md` — `GOOGLE_SHEETS_CLIENT_EMAIL` / `GOOGLE_SHEETS_PRIVATE_KEY` 配置・rotation 方針
- `.claude/skills/aiworkflow-requirements/references/architecture-implementation-patterns.md` — Edge Runtime JWT / token cache パターン
- `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-11/operator-runbook.md` — Service Account 作成 / Spreadsheet 共有 / Secret 投入 / 疎通手順
- `docs/30-workflows/ut-03-sheets-api-auth-setup/outputs/phase-12/system-spec-update-summary.md` — 仕様反映サマリ
- `packages/integrations/google/src/sheets/` — `getSheetsAccessToken` / `signServiceAccountJwt` / `pemToPkcs8` / `redactSheetsSecrets` 実装

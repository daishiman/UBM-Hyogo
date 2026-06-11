# Phase 1: 要件定義

## メタ情報
正本: `outputs/phase-1/phase-1.md` / 上位 SSOT: `../../_shared-context.md`

## 目的
観測事象・調査結論・真因仮説・受入条件・inventory・命名規則を固定する。

## 1. 観測事象

staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile` で「セッション情報を取得できません」エラーが継続表示され、マイページ本体が描画されない。ブラウザコンソールに `content.js:21 POST http://127.0.0.1:8888/ net::ERR_CONNECTION_REFUSED` / `[Sentry] You cannot use Sentry.init() in a browser extension` / `service-worker-loader.js ... Could not establish connection` が出る。ユーザーの疑問は「ローカル環境（127.0.0.1）を見に行っていないか」。

## 2. 調査結論（コード読解で確定）

**アプリは localhost を参照していない。** 詳細は SSOT §1.2。要点:
1. アプリの localhost フォールバック値は `8787`（`transport.ts:14`）。`8888` はアプリコードに 0 件。
2. コンソールの `127.0.0.1:8888` 等は**ブラウザ拡張機能由来**（`content.js`/`service-worker-loader.js`/`Sentry.init() in a browser extension`）。
3. `/profile` のサーバー側 `fetchAuthed("/me")` は `API_SERVICE` service-binding を最優先で使うため localhost フォールバック（`resolveApiFetch` step4）には構造的に到達しない。

真の失敗は staging 実機の HTTP ステータス依存（410/5xx/transport）。現状ログ（`safe-fetch.ts:54`）は `{code, path, status}` のみで **transport 解決先が記録されず**、「localhost を叩いていないこと」を実機ログで証明できない。

## 3. 真因仮説（実機ログで確定）

| ID | 仮説 | 症状一致 | 観測強化での切り分け根拠 |
|----|------|------|------|
| C1 | 410（`member_status.is_deleted=1`） | ✓ | `status=410` + `transportKind=service-binding` |
| C2 | 5xx（resolver/D1/handler 例外） | ✓ | `status=5xx` + `baseHost=service-binding.local` |
| C3 | transport 失敗（service-binding 未応答/旧 bundle） | ✓ | `ApiTransportError` + `transportKind` 記録 |
| C4 | localhost 参照 | ✗（否定済） | `baseHost` が `localhost:8787` でないことをログで証明 |
| C5 | 401 | ✗（`/login` redirect） | バナーにならない |

最有力 C1/C2/C3。本タスクはどれであるかを実機ログで一意確定できる観測性を与え、C4 を構造的に不可能にする（fail-closed）。

## 4. 受入条件（AC）

| ID | 受入条件 | 検証 |
|----|---------|------|
| AC-1 | `/me` fetch 失敗時 `server_fetch_failed` ログに `transportKind`（`service-binding`\|`http`）が含まれる | T4 safe-fetch.spec |
| AC-2 | 同ログに `baseHost`（host のみ）が含まれる。localhost リテラルを新規焼き込みしない | T4 + verify-no-localhost-bake |
| AC-3 | ログに memberId / cookie / secret を出力しない（host とステータスのみ） | T4（出力キー検査） |
| AC-4 | `getEnvironmentResolution` が enum 明示時 `explicit=true`、未注入/不正時 `{local,false}` | T5 env.spec |
| AC-5 | `resolveApiFetch` は `environmentExplicit=false` × binding/baseUrl 無 のとき localhost に行かず throw（fail-closed） | T1 transport.spec |
| AC-6 | `API_SERVICE` 有のとき従来どおり service-binding 優先（localhost 不到達）= 回帰なし | T2 transport-select.spec |
| AC-7 | transport 接続失敗（fetch throw）時 `ApiTransportError`（診断メタ付）が投げられ safe-fetch が `MEMBER_SESSION_FAILED` に正規化 | T3 authed.spec + T4 |
| AC-8 | 既存テスト（transport/transport-select/authed/safe-fetch/env）回帰ゼロ・既存シグネチャ後方互換 | 全 focused run |
| AC-9 | `apps/api` 非接触（diff 空）・`verify-no-localhost-bake --src-only` green | Phase 9 |

## 5. inventory（変更対象 / 既存資産）

| 種別 | パス | 状態 |
|------|------|------|
| 変更 | `apps/web/src/lib/fetch/transport.ts` | 既存（resolveApiFetch / fetchViaApiTransport） |
| 変更 | `apps/web/src/lib/env.ts` | 既存（getEnvironment / getAuthEnv 等） |
| 変更 | `apps/web/src/lib/fetch/errors.ts` | 既存（FetchAuthedError / AuthRequiredError） |
| 変更 | `apps/web/src/lib/fetch/authed.ts` | 既存（fetchAuthed） |
| 変更 | `apps/web/src/lib/server-fetch/safe-fetch.ts` | 既存（safeServerFetch / logServerFetchFailure） |
| 変更 | `scripts/diagnose-profile-session.sh` | 既存（前 WF 成果・dev 取込済） |
| 前提（不変） | `apps/api/src/middleware/trailing-slash.ts` / `apps/web/app/api/me/[...path]/route.ts` / `session-error-display.ts` | dev 取込済・本タスクで触らない |
| テスト | `transport.spec.ts` / `__tests__/transport-select.spec.ts` / `authed.spec.ts` / `__tests__/safe-fetch.spec.ts` / `__tests__/env.spec.ts` | 既存・本タスクで拡張 |

## 6. 命名規則（既存コードベース分析・FB-01/FB-SDK-07-4）

- 関数・変数: camelCase。既存 `resolveApiFetch` / `fetchViaApiTransport` / `getEnvironment` / `getAuthEnv` / `getPublicFetchEnv` の **動詞始まり camelCase** に合わせ、新規は `describeTransport` / `getEnvironmentResolution`。
- 型・クラス: PascalCase。既存 `FetchAuthedError` / `AuthRequiredError` / `ApiTransport` / `ApiTransportEnv` に合わせ、新規は `ApiTransportError` / `ApiTransportDescriptor`。
- ファイル: kebab-case（既存 `safe-fetch.ts` 等）。新規ファイルは作らない（既存ファイルに追記）。
- ログイベント名: snake_case（既存 `server_fetch_failed` を踏襲・新規イベント名は作らない）。

## 統合テスト連携
本タスクは unit（jsdom・fetch モック）中心。staging 実機の `/me` 応答確認は Phase 11 の手動手順（`wrangler tail`・`scripts/cf.sh` 経由・user-gated）で代替する。`apps/api` 側統合テストは非接触のため新規追加しない。

## 参照資料
- `../../_shared-context.md`（SSOT）
- `apps/web/src/lib/fetch/transport.ts` / `authed.ts` / `errors.ts`、`apps/web/src/lib/env.ts`、`apps/web/src/lib/server-fetch/safe-fetch.ts`
- `apps/web/app/(member)/profile/page.tsx` / `_lib/session-error-display.ts`
- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md`

## 成果物
- `outputs/phase-1/phase-1.md`

## 完了条件
- [x] 観測事象・調査結論・真因仮説・AC・inventory・命名規則を固定した。

# Phase 1: 要件定義

`[実装区分: 実装仕様書]`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `profile-session-staging-transport-recovery` |
| Phase | 1 / 13 |
| 正本 | 本ファイル（設計の正本は `_shared-context.md`） |
| ブランチ | `fix/profile-session-staging-transport-recovery`（起点 `origin/dev` 986d5e669） |
| workflow_state | `implemented_local_runtime_pending` |

## 目的

staging `/profile` の「セッション情報を取得できませんでした / 通信経路でセッション確認に失敗しました」障害について、ユーザー提供エビデンス（2026-06-11 21:43 JST スクショ + response headers）から**確定できる事実を仮説から分離して固定**し、残るサブ原因（S1〜S4）・横断要因（F-A/F-B）・受入条件（AC-1〜9）・変更対象 inventory を要件として確定する。

### 実装区分の判定根拠（CONST_004 準拠）

ユーザー要求は「対策して」= staging 復旧。env 読み取り堅牢化・transport 多段フォールバック・診断スクリプト拡張という**コード変更なしには達成不可能**なため、デフォルト通り実装仕様書として作成する。CONST_005 必須項目は Phase 5 の task-01..04 に明記する。

## 実行タスク

### 1.1 観測事象（ユーザー提供エビデンス）

- 現象 URL: `https://ubm-hyogo-web-staging.daishimanju.workers.dev/profile`（GET 200・HTML 内にエラーバナー）
- 表示: タイトル「セッション情報を取得できませんでした」+ 詳細「**通信経路で**セッション確認に失敗しました。時間をおいて再読み込みしてください。」+ 再読み込みリンク
- ログイン状態: サイドバー下部に「ishida 会員」表示（web 側 Auth.js JWT decode 成功）。cookie に `__Secure-authjs.session-token`（有効 JWT・memberId/isAdmin=false/email を含む）あり
- response headers: `content-security-policy` の `connect-src` に staging API URL（middleware が env を読めている）・`x-opennext: 1`

### 1.2 確定事実（F-1〜F-6）と残サブ原因（S1〜S4）

`_shared-context.md` §1 を正本とする。要点:

| ID | 確定事実 |
| --- | --- |
| F-1 | 表示文言は `session-error-display.ts:54-60` の `session-failed`（`MEMBER_SESSION_FAILED`）専用文言 |
| F-2 | この文言は PR #1194（78df4dea0・2026-06-10 dev マージ）導入。staging に出ている＝bundle は新しい。**旧 bundle / 410 / 5xx 仮説はスクショ自体が除外**（別文言になるため） |
| F-3 | `MEMBER_SESSION_FAILED` は `safe-fetch.ts` の normalizeError で「status を持たない throw」の場合のみ生成＝ `/me` fetch が **HTTP 応答に至らず throw**（transport 失敗） |
| F-4 | web 側 JWT decode と middleware の env 読みは成功している（部分故障であって全 env 喪失ではない可能性が高い） |
| F-5 | `apps/web/wrangler.toml` `[env.staging]` に `API_SERVICE` binding / `INTERNAL_API_BASE_URL` / `ENVIRONMENT=staging` 設定済（設定起因は否定的） |
| F-6 | 観測性 + fail-closed 実装は未マージ branch `fix/profile-session-staging-localhost-endpoint` にあり staging 未デプロイ → 現行 staging ログでは sub-cause を確定できない |

残るサブ原因（排他的・transport throw の全経路）:

| ID | サブ原因 | 経路 anchor |
| --- | --- | --- |
| S1 | transport 解決不能 throw（binding も baseUrl も runtime で不可視・ENVIRONMENT=staging） | `transport.ts:40-42` |
| S2 | env 全滅 → local 扱い → `http://localhost:8787` へ fetch → 接続失敗 | `transport.ts:33-38` |
| S3 | `API_SERVICE.fetch` 自体の throw（bound worker hard error / binding 不調） | `transport.ts:51-52` |
| S4 | http transport の `fetch()` 自体の throw（API 到達不能） | `transport.ts:54` |

横断要因（本サイクルで根治するコード設計欠陥）:

| ID | 欠陥 | anchor |
| --- | --- | --- |
| F-A | `getAuthEnv` の all-or-nothing safeParse: 無関係 field 1 つの不正で `INTERNAL_API_BASE_URL` を含む全 field を黙って drop | `env.ts:131-137` |
| F-B | 単一 transport 依存: binding と URL が両方設定されているのに片系の throw で全断 | `transport.ts` / `authed.ts` |

### 1.3 受入条件（AC-1〜9）

`_shared-context.md` §4 の AC-1〜AC-9 を逐語で採用する（転記略・SSOT 参照）。

### 1.4 既存コードの命名規則

- error: `ApiTransportError` / `FetchAuthedError` / `AuthRequiredError`。error code `MEMBER_SESSION_<status>` / `MEMBER_SESSION_FAILED` は**変更しない**。
- 構造化ログ: `server_fetch_failed` に倣う snake_case（新規 `api_transport_fallback` / `auth_env_field_dropped`）。
- transport 定数: `SERVICE_BINDING_ORIGIN` / `LOCAL_API_FALLBACK_BASE_URL`（`localhost-allow:local-fallback` コメント維持）。
- test: `*.spec.{ts,tsx}` のみ。

### 1.5 対象 inventory（変更種別付き）

`_shared-context.md` §5 を正本とする。実装対象 6 ファイル（env.ts / transport.ts / authed.ts / safe-fetch.ts / errors.ts / diagnose-profile-session.sh）+ テスト 5 ファイル。`apps/api` / `/profile` UI / wrangler.toml は非接触。

### 1.6 既存関連ワークフローとの関係

`_shared-context.md` §6 を正本とする。前身調査 WF の H1〜H5 は F-1〜F-3 により S1〜S4 へ精緻化。未マージ観測性ブランチは T01 で統合し本 WF の PR が dev へ届ける。前身 Issue #1192 系（transport 運用是正）は本 WF が実装で回収する。

## 完了条件

- [x] 確定事実 F-1〜F-6 が根拠付きで記録されている
- [x] サブ原因 S1〜S4 が transport throw の全経路を排他的に被覆している
- [x] 横断要因 F-A/F-B が code anchor 付きで特定されている
- [x] AC-1〜9 が SSOT と一致している
- [x] inventory が変更種別付きで列挙されている
- [x] 実装区分の判定根拠が明記されている

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル）

## 参照資料

- `_shared-context.md` §0〜§6（SSOT）
- `apps/web/app/(member)/profile/_lib/session-error-display.ts` / `apps/web/src/lib/server-fetch/safe-fetch.ts` / `apps/web/src/lib/fetch/transport.ts` / `apps/web/src/lib/env.ts`
- `docs/30-workflows/completed-tasks/profile-session-fetch-failure-investigation/`（前身調査 WF）
- `apps/web/wrangler.toml` `[env.staging]`

### システム仕様（aiworkflow-requirements）

- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md`（認証境界 fail-closed）
- `docs/00-getting-started-manual/specs/01-api-schema.md`（`/me` 契約・不変）

## 統合テスト連携

AC-3/AC-4 の fallback 挙動と AC-7 の非回帰は Phase 4 の I/O 契約表 → Phase 6 のテストケース → Phase 9 の focused vitest 一括実行で検証する。staging 実機の復旧確認と sub-cause 確定は Phase 11（user-gated）。

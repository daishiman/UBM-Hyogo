# Workflow: profile-reload-session-404-fix

## 概要

会員マイページ `/(member)/profile` を**リロード**すると、Server Component が API Worker の `GET /me`（セッション情報）取得で **HTTP 404** を受け取り、「セッション情報を取得できませんでした / fetchAuthed failed: 404 / 再読み込み」という生エラーバナーを表示する不具合を解消する。

`GET /me` の正常系（`apps/api`）には 404 を返す分岐が存在しない（`sessionGuard` は 401 / 410 のみ、ハンドラは 200）。したがって 404 は **ルート解決層**（Hono マウント時の trailing-slash 非マッチ＝`notFoundHandler`）に由来する。Hono 4.12.18 で `app.route("/me", sub)` + `sub.get("/")` は `GET /me`→200 だが **`GET /me/`（末尾スラッシュ）→404** になることを実証済み。加えて web プロキシ `apps/web/app/api/me/[...path]/route.ts` は path が空のとき upstream を `${api}/me/`（末尾スラッシュ）で生成する欠陥を持ち、`GET /me` のフルアプリ・マウント経由を検証する統合テストが存在しない（既存 contract テストは `createMeRoute` に直接 `.request("/")` でマウントをバイパス）。

本ワークフローは「(1) `/profile` の防御的 UX（再ログイン導線つき明示エラー）」「(2) `apps/api` の `/me` 末尾スラッシュ許容」「(3) web プロキシの末尾スラッシュ生成バグ修正」「(4) フルアプリ・マウント統合テストによる再発検知」を **今回 1 実装サイクル内**で完結させる実装仕様書群である。

## ステータス

| 項目 | 値 |
|------|------|
| ブランチ | `docs/profile-reload-session-404-fix-spec` |
| 起点 | `origin/dev` (bd0393a29) |
| 種別 | bugfix / runtime regression recovery + defensive UX |
| implementation_mode | `new`（新規コード + 新規テスト） |
| visualEvidence | VISUAL_ON_EXECUTION（Task 03 が `/profile` のエラーバナー UI を変更。static UI contract screenshot は取得済み、staging 認証 runtime screenshot は user-gated） |
| workflow_state | `implemented_local_evidence_captured`（本サイクルで実装・focused Vitest・static UI contract screenshot 証跡を取得済み。staging 認証 runtime screenshot・commit・PR は user-gated） |
| 想定 PR base | `dev` |

## ワークフロー構成

| Phase | ファイル | 役割 |
|-------|---------|------|
| 1 | `outputs/phase-1/phase-1.md` | 不具合の事実関係・受入条件（AC）・inventory |
| 2 | `outputs/phase-2/phase-2.md` | スコープ境界・タスク分解・参照仕様・状態所有権 |
| 3 | `outputs/phase-3/phase-3.md` | モジュール俯瞰・修正方針・代替案比較・設計レビュー |
| 4 | `outputs/phase-4/phase-4.md` | I/O 契約（HTTP / 関数 / テスト期待値） |
| 5 | `outputs/phase-5/phase-5.md` + `outputs/phase-5/task-01..03-*.md` | 実装手順インデックス + 実装仕様書本体（3 タスク） |
| 6 | `outputs/phase-6/phase-6.md` | テスト拡充（fail path / 回帰 guard） |
| 7 | `outputs/phase-7/phase-7.md` | カバレッジ確認（変更ブロックの line/branch） |
| 8 | `outputs/phase-8/phase-8.md` | リファクタリング方針 + エラーパターン/rollback |
| 9 | `outputs/phase-9/phase-9.md` | 品質保証（type/lint/test 一括） |
| 10 | `outputs/phase-10/phase-10.md` | 最終レビュー（AC 充足・blocker 判定） |
| 11 | `outputs/phase-11/manual-test-result.md` | 手動テスト計画 + 証跡（実装サイクルで生成） |
| 12 | `outputs/phase-12/*`（strict 7） | 実装ガイド・SSOT 同期・未タスク・skill feedback・compliance |
| 13 | `outputs/phase-13/phase-13.md` | PR 作成（多段ゲート、`dev` base、user-gated） |

`artifacts.json` と `outputs/artifacts.json` は `phases[].status` / `metadata.workflow_state` を保持する正本で、byte-identical に保つ。

## タスク分解（今回サイクルで完結 / CONST_007）

| タスク | 領域 | 種別 | 並列性 | 概要 |
|--------|------|------|--------|------|
| T01 | `apps/api` | NON_VISUAL | 独立 | `GET /me` 末尾スラッシュ許容（trailing-slash 正規化）+ フルアプリ・マウント統合テスト追加（実装済み） |
| T02 | `apps/web`（proxy） | NON_VISUAL | 独立 | `/api/me/[...path]` の空 path 時 `/me/` 生成バグ修正 + テスト（実装済み） |
| T03 | `apps/web`（UI） | VISUAL | 独立 | `/profile` の `/me` 404 分岐 → 再ログイン CTA つき明示エラー + `SectionError` CTA 拡張（実装済み） |

3 タスクはすべて関心が分離しており（API ルーティング / web プロキシ / web UI）独立に並列実装可能。先送り・別 PR・バックログ送りは無し。

## 不変条件（CLAUDE.md / プロジェクト準拠）

- 既存 API endpoint surface を変更しない（`/me` の path・レスポンス shape は不変。trailing-slash 正規化はルート解決層の追加のみ）。
- D1 直接アクセスは `apps/api` に閉じる（不変条件 #5。`apps/web` から D1 binding 禁止）。
- `apps/web` の env 参照は `getEnv()` / `getPublicEnv()` / `getAuthEnv()` / `getPublicFetchEnv()` 経由のみ（`process.env` 直接参照禁止）。
- 不変条件 #11: `/me/*` は `session.user.memberId` のみ参照し path に `:memberId` を含めない。
- OKLch トークン正本（HEX 直書き禁止）。Task 03 の UI 変更は既存 `section-error` primitive とトークンに従う（新規 primitive を生やさない）。
- consent キーは `publicConsent` / `rulesConsent` に統一。
- 新規 test ファイルは `*.spec.{ts,tsx}` のみ（`*.test.*` 禁止）。

## 既知のスコープ外（本ワークフローでは扱わない）

| 事象 | 理由 / 対応先 |
|------|------|
| `Permissions-Policy: browsing-topics` 警告 | Chromium 標準警告・無害、自社外 |
| `content.js POST http://127.0.0.1:8888 ERR_CONNECTION_REFUSED` | ブラウザ拡張（1Password 等）由来、自社外 |
| `[Sentry] You cannot use Sentry.init() in a browser extension` | ブラウザ拡張バンドル由来、自社外 |
| Auth.js セッション JWT のサイズ削減 / cookie chunk 対応 | 現状再現に直結する証跡が無く、別観点。必要時に別ワークフロー |
| staging デプロイ齟齬（旧 bundle 残存）の運用是正 | 本ワークフローの統合テスト + 末尾スラッシュ許容で再発検知/緩和。デプロイ操作自体は user-gated |

## 正本順位（衝突時）

1. 本 `index.md`（SCOPE）
2. `outputs/phase-{1,2,3}/phase-N.md`（設計の正本）
3. `outputs/phase-5/task-0N-*.md`（実装仕様書本体）
4. `docs/00-getting-started-manual/specs/*.md` / `.claude/skills/aiworkflow-requirements/references/*`

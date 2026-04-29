# 05a-parallel-authjs-google-oauth-provider-and-admin-gate — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | authjs-google-oauth-provider-and-admin-gate |
| ディレクトリ | docs/30-workflows/05a-parallel-authjs-google-oauth-provider-and-admin-gate |
| Wave | 5 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | auth |
| 状態 | completed (Phase 1-12 completed, Phase 13 pending) |
| タスク種別 | implementation |

## 目的

Auth.js（NextAuth.js v5）に **Google OAuth provider** を組み込み、UBM 兵庫支部会メンバー向けの主導線ログインを成立させる。さらに `admin_users` テーブルを基にした **admin gate middleware** を実装し、`/admin/*` 画面と API への access 制御を統一する。session callback で `memberId` と `isAdmin` を解決し、後続 Wave 6（UI）／Wave 8（test）で利用される `SessionUser` view model を確定させる。

## スコープ

### 含む
- Auth.js v5 の Google OAuth provider 設定（`apps/web/src/lib/auth.ts`）
- secrets 配線: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- session callback での `memberId` / `isAdmin` 解決（`member_identities` lookup → `admin_users` lookup）
- admin gate middleware（`apps/web` `middleware.ts` と `apps/api` `requireAdmin`）
- Auth.js 用 `apps/web` route handler `app/api/auth/[...nextauth]/route.ts` 配線
- Cloudflare Workers（`@opennextjs/cloudflare`）での Auth.js セッションストレージ戦略（D1 か KV）の選定
- session JWT の `memberId` claim の sign / verify（共通 secret）

### 含まない
- Magic Link provider（**05b** で扱う）
- `AuthGateState` 5 状態判定 API（**05b**）
- `/login` `/profile` `/admin/*` 画面（**06a/b/c**）
- `/me/*`・`/admin/*` API endpoints 本体（**04b/04c**）
- `admin_users` への CRUD（**02c** repository、`/admin/users` UI は 06c の scope out）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04b-parallel-member-self-service-api-endpoints | session 確立後に呼ぶ `/me` API が確定している必要 |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | admin gate middleware が保護する `/admin/*` API が確定している必要 |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | `member_identities` lookup（email → memberId）が必要 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `admin_users` repository が必要 |
| 下流 | 06a-parallel-public-landing-directory-and-registration-pages | `/register` から OAuth ボタン |
| 下流 | 06b-parallel-member-login-and-profile-pages | `/login` で Google OAuth ボタン、`/profile` で session 利用 |
| 下流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | admin gate で全画面保護 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | gate の認可境界 test |
| 並列 | 05b-parallel-magic-link-provider-and-auth-gate-state | Magic Link と独立、両 provider が `session.callback` で同じ `MemberId` 解決を共有 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 認証方針（Google OAuth 主導線） |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | ログイン許可条件、session 構造 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証方針、admin 判定 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | `admin_users` テーブル、管理権限の境界 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | `member_identities` / `admin_users` schema |
| 参考 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | secrets 配置（Cloudflare Secrets / GitHub Secrets） |
| 参考 | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state/index.md | 並列 task との接続点（session 共有） |

## 受入条件 (AC)

- AC-1: Google OAuth ログインで Auth.js session が確立し、`session.user.memberId` が `member_identities.member_id` と一致する
- AC-2: `member_identities` に email が無い未登録ユーザーは session を **作らない**（callback で `false` を返し `/login?gate=unregistered` へ）
- AC-3: `admin_users` に登録された user の session は `session.user.isAdmin === true` を含む
- AC-4: `admin_users` 未登録 user が `/admin/*` 画面に access すると 403 もしくは `/login` リダイレクト（middleware で gate）
- AC-5: `/admin/*` API endpoint も同様に `requireAdmin` middleware で保護され、未許可は 401/403 を返す（contract test 必須）
- AC-6: `AUTH_SECRET` / `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` がリポジトリに平文で含まれない（gitleaks pass）
- AC-7: secrets は wrangler / GitHub Secrets / 1Password に配置されている（infra 04 のリストに準拠）
- AC-8: session JWT の `memberId` claim が改ざんされた場合に検証 fail で 401（contract test）
- AC-9: 同一メールで Google OAuth と Magic Link 両方ログインしても、解決される `memberId` が同一になる（05b と契約共有）
- AC-10: `/admin/*` の middleware が apps/web Edge runtime 上で動く（Cloudflare Workers 互換）

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | completed | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | completed | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | completed | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | completed | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | completed | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/architecture.md | provider 構成、session callback、admin gate の配置 |
| 設計 | outputs/phase-02/admin-gate-flow.md | middleware と API gate の責務分離図 |
| ランブック | outputs/phase-05/runbook.md | Google OAuth credentials 取得 → wrangler secret put → 動作確認 |
| テスト | outputs/phase-04/test-matrix.md | 4 状態 × normal/abnormal の認可 test |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 の対応 |
| ドキュメント | outputs/phase-12/implementation-guide.md | apps/web / apps/api 接続図、05b との session 共有契約 |
| メタ | artifacts.json | 13 phase 状態 |

## services / secrets

| 種別 | 名称 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| service | Cloudflare Workers (apps/api) | runtime | 2 |
| service | Cloudflare Workers (apps/web via @opennextjs/cloudflare) | runtime | 2 |
| service | Google OAuth 2.0 | external | 2 |
| service | Cloudflare D1 (`member_identities`, `admin_users`) | binding `DB` | 2 |
| secret | `AUTH_SECRET` | Cloudflare Secrets | 5 |
| secret | `GOOGLE_CLIENT_ID` | Cloudflare Secrets | 5 |
| secret | `GOOGLE_CLIENT_SECRET` | Cloudflare Secrets | 5 |
| var | `AUTH_URL` | wrangler vars | 5 |

## invariants touched

| # | 名称 | 関連箇所 |
| --- | --- | --- |
| #2 | consent キーは `publicConsent` / `rulesConsent` に統一 | session 解決時に `rulesConsent` 確認、未同意は session 作らない |
| #3 | `responseEmail` は system field | OAuth profile email を `responseEmail` 列で lookup |
| #5 | apps/web から D1 直接禁止 | session callback の D1 lookup は `apps/api` 経由（または server-only adapter） |
| #7 | `responseId` と `memberId` を混同しない | session JWT には `memberId` のみ含める |
| #9 | `/no-access` 専用画面に依存しない | 未登録 / 未承認は `/login` でメッセージ吸収（05b の AuthGateState と連携） |
| #10 | Cloudflare 無料枠内で運用 | session storage は JWT（D1 row 数を増やさない） |
| #11 | 管理者は他人プロフィール本文を直接編集できない | admin gate は権限境界の最小単位、本文編集 API は不在 |

## completion definition

- 13 phase すべてが `completed`
- artifacts.json の各 phase status 一致
- AC-1〜AC-10 が phase-07 で完全トレース
- phase-12 で `implementation-guide.md` ほか 6 種が生成
- phase-13 はユーザー承認後にのみ実行

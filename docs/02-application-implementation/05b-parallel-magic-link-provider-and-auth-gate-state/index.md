# 05b-parallel-magic-link-provider-and-auth-gate-state — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | magic-link-provider-and-auth-gate-state |
| ディレクトリ | doc/02-application-implementation/05b-parallel-magic-link-provider-and-auth-gate-state |
| Wave | 5 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | auth |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

Auth.js の Magic Link provider を実装し、`POST /auth/magic-link` で `magic_tokens` を発行する。`/login` 画面が依存する `AuthGateState`（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`）の判定ロジックを `apps/api` 側で確定し、`/no-access` 画面に依存せずにログイン導線で吸収する。

## スコープ

### 含む
- Auth.js Magic Link provider 設定（`apps/web` に EmailProvider を組み込み、検証は `apps/api` 経由）
- `POST /auth/magic-link` エンドポイント（`apps/api`）
- `magic_tokens` テーブルへの token 発行・有効期限・使用済みフラグ管理
- `AuthGateState` 5 状態（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`）の判定 API（`GET /auth/gate-state?email=`）
- メール送信プロバイダ（Resend / SendGrid 等）の secrets `MAIL_PROVIDER_KEY` 配線
- magic link 検証コールバック（`/api/auth/callback/email`）と session 確立
- `/no-access` ルート不在の検証（lint or test）

### 含まない
- Google OAuth provider 設定（05a）
- `/login` `/profile` の画面実装（06b）
- admin gate middleware（05a）
- `/me/*` ・ `/admin/*` API endpoints 本体（04b / 04c の責務）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04b-parallel-member-self-service-api-endpoints, 04c-parallel-admin-backoffice-api-endpoints | session 確立後に呼ぶ `/me` `/admin` API が確定している必要がある |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `magic_tokens` repository が必要 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | `responseEmail` snapshot と `rules_consent` 状態が D1 にある前提 |
| 下流 | 06a-parallel-public-landing-directory-and-registration-pages, 06b-parallel-member-login-and-profile-pages, 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | `AuthGateState` を表示するため |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | gate state の認可境界を test |
| 並列 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | Google OAuth と独立、両 provider が `session.callback` で同じ `MemberId` 解決を共有 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | 認証方針（Magic Link 補助導線、`/no-access` 不採用） |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | ログイン許可条件（responseEmail / rulesConsent / isDeleted）、`AuthGateState` 5 状態 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証方針、ログイン条件と公開条件の分離 |
| 必須 | doc/00-getting-started-manual/specs/08-free-database.md | `magic_tokens` テーブル schema |
| 参考 | doc/00-getting-started-manual/specs/05-pages.md | `/login` 状態遷移（input → sent） |
| 参考 | doc/00-getting-started-manual/specs/01-api-schema.md | system field `responseEmail` の扱い |
| 参考 | doc/01-infrastructure-setup/04-serial-cicd-secrets-and-environment-sync/index.md | secrets 配置（Cloudflare Secrets） |

## 受入条件 (AC)

- AC-1: `POST /auth/magic-link` に未登録メールを渡すと `state="unregistered"` を返し、token は発行しない（D1 へ insert 0 件）
- AC-2: `rulesConsent != "consented"` のメールに対しては `state="rules_declined"` を返し、token は発行しない
- AC-3: `isDeleted = true` のメールに対しては `state="deleted"` を返し、token は発行しない
- AC-4: 上記いずれにも該当しない有効メールには token を発行し、`state="sent"` を返してメール配信ジョブを enqueue する
- AC-5: 発行 token の有効期限は 15 分以内（spec で固定）。期限切れ token を `/api/auth/callback/email` に渡すと `401` を返す test が pass する
- AC-6: 同一 token の再使用は 1 回限り（`used_at` 更新で 2 回目は `401`）
- AC-7: `/no-access` ルートが `apps/web/app/` 配下に存在しないことを fs check + lint rule で検証
- AC-8: `MAIL_PROVIDER_KEY` 等のシークレットがリポジトリに平文で含まれない（gitleaks pass）
- AC-9: AuthGateState 5 状態すべてに対して契約 test が green（`08a` で実行）
- AC-10: Auth.js session callback で `memberId` と `isAdmin` が解決されており、未解決時は session を作らない

## Phase 一覧

| Phase | 名称 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | pending | outputs/phase-01/main.md |
| 2 | 設計 | phase-02.md | pending | outputs/phase-02/main.md |
| 3 | 設計レビュー | phase-03.md | pending | outputs/phase-03/main.md |
| 4 | テスト戦略 | phase-04.md | pending | outputs/phase-04/main.md |
| 5 | 実装ランブック | phase-05.md | pending | outputs/phase-05/main.md |
| 6 | 異常系検証 | phase-06.md | pending | outputs/phase-06/main.md |
| 7 | AC マトリクス | phase-07.md | pending | outputs/phase-07/main.md |
| 8 | DRY 化 | phase-08.md | pending | outputs/phase-08/main.md |
| 9 | 品質保証 | phase-09.md | pending | outputs/phase-09/main.md |
| 10 | 最終レビュー | phase-10.md | pending | outputs/phase-10/main.md |
| 11 | 手動 smoke | phase-11.md | pending | outputs/phase-11/main.md |
| 12 | ドキュメント更新 | phase-12.md | pending | outputs/phase-12/main.md |
| 13 | PR 作成 | phase-13.md | pending | outputs/phase-13/main.md |

## 主要成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| 設計 | outputs/phase-02/architecture.md | provider 構成、AuthGateState 状態機械、token lifecycle |
| 設計 | outputs/phase-02/api-contract.md | `POST /auth/magic-link` / `GET /auth/gate-state` の I/O |
| ランブック | outputs/phase-05/runbook.md | provider 設定、token 発行、検証コールバック実装手順 |
| テスト | outputs/phase-04/test-matrix.md | 5 状態 × normal / abnormal の test 行列 |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 の対応 |
| ドキュメント | outputs/phase-12/implementation-guide.md | apps/web / apps/api 接続図 |
| メタ | artifacts.json | 13 phase 状態 |

## services / secrets

| 種別 | 名称 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| service | Cloudflare Workers (apps/api) | runtime | 2 |
| service | Cloudflare Workers (apps/web via `@opennextjs/cloudflare`) | runtime | 2 |
| service | Cloudflare D1 (`magic_tokens`) | binding `DB` | 2 |
| service | Mail provider (Resend or SendGrid) | external | 2 |
| secret | `MAIL_PROVIDER_KEY` | Cloudflare Secrets | 5 |
| secret | `AUTH_SECRET` | Cloudflare Secrets（05a と共有） | 5 |
| var | `AUTH_URL` | wrangler vars | 5 |

## invariants touched

| # | 名称 | 関連箇所 |
| --- | --- | --- |
| #2 | consent キーは `publicConsent` / `rulesConsent` に統一 | gate state 判定で `rulesConsent` を直接参照 |
| #3 | `responseEmail` は system field | gate state 判定の lookup key |
| #5 | apps/web から D1 直接禁止 | magic_tokens への access は apps/api に閉じる |
| #7 | `responseId` と `memberId` を混同しない | session callback で `memberId` を返す |
| #9 | `/no-access` 専用画面に依存しない | 5 状態をログイン導線で吸収 |
| #10 | Cloudflare 無料枠内で運用 | magic_tokens の TTL 整理、token 発行レートリミット |

## completion definition

- 13 phase すべてが `completed`
- artifacts.json の各 phase status 一致
- AC-1〜AC-10 が phase-07 で完全トレース
- phase-12 で `implementation-guide.md` ほか 6 種が生成
- phase-13 はユーザー承認後にのみ実行

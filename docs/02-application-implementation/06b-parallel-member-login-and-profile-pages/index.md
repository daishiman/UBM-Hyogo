# 06b-parallel-member-login-and-profile-pages — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-login-and-profile-pages |
| ディレクトリ | doc/02-application-implementation/06b-parallel-member-login-and-profile-pages |
| Wave | 6 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | web/member |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

会員向け 2 画面（`/login`, `/profile`）を Next.js App Router + `@opennextjs/cloudflare` で実装する仕様を確定する。`/login` は `AuthGateState` 5 状態（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`）を出し分け、Magic Link 送信フォームと Google OAuth ボタンを提供する。`/profile` は本人 view model を表示のみ（編集は Google Form 再回答経路、不変条件 #4 / 仕様 07-edit-delete）し、`editResponseUrl` ボタンと公開状態サマリ、参加履歴を提示する。

## スコープ

### 含む
- `/login` 画面: `AuthGateState` の 5 状態出し分け、Magic Link 送信フォーム + Google OAuth ボタン、未登録者向け `/register` 導線
- `/profile` 画面: 本人の public + member field 表示（read-only）、状態サマリ（rulesConsent / publicConsent / publishState / isDeleted）、`editResponseUrl` ボタン、参加履歴
- session middleware で未ログインアクセスは `/login?redirect=/profile` へ誘導
- 04b `/me` `/me/profile` API の呼び出し（fetch + RSC）
- Magic Link の送信進捗（`sent` 状態）と success 後の callback page
- `/no-access` 不採用（不変条件 #9）の徹底
- 09-ui-ux.md 準拠（desktop / mobile）

### 含まない
- profile 本文の編集 UI（不変条件 #4 / 04b で `POST /me/visibility-request` `POST /me/delete-request` のみ提供）
- `/admin/*` 画面（06c）
- Auth.js provider 実装本体（05a / 05b）
- public landing / directory（06a）
- Google Form responderUrl の本体運用（06a, /register 配下）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04b-parallel-member-self-service-api-endpoints | `/me`, `/me/profile`, `/me/visibility-request`, `/me/delete-request` を呼ぶ |
| 上流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | Google OAuth ボタンの session 確立 |
| 上流 | 05b-parallel-magic-link-provider-and-auth-gate-state | `POST /auth/magic-link` + `GET /auth/gate-state` を呼ぶ |
| 上流 | 00-serial-monorepo-shared-types-and-ui-primitives-foundation | UI primitives + view model 型 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | session / gate state contract test |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | login → profile E2E |
| 並列 | 06a, 06c | 互いに独立、共通 UI primitives 経由で連携 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | `/no-access` 不採用、`/login` での吸収 |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | AuthGateState 5 状態、SessionUser、ログイン許可条件 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP 認証方針 |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | `/login`, `/profile` URL contract、表示要素 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 本人更新は Google Form 再回答、profile は read-only |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス（desktop / mobile） |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | UI primitives（FormField, Toast, Banner） |
| 参考 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey 一覧、責任ある参照 |

## 受入条件 (AC)

- AC-1: `/login` が AuthGateState 5 状態（`input` / `sent` / `unregistered` / `rules_declined` / `deleted`）すべてを UI で出し分ける
- AC-2: `/login` で Magic Link を送信すると `state="sent"` に遷移し、再送 cooldown 60 秒を表示する
- AC-3: `/login` で Google OAuth ボタンが押されると Auth.js の Google provider に正しくリダイレクトする
- AC-4: `unregistered` 状態は `/register` への CTA を表示し、`/no-access` には遷移しない（不変条件 #9）
- AC-5: `rules_declined` 状態は再回答（Google Form responderUrl）への CTA を表示する
- AC-6: `deleted` 状態は管理者問い合わせ導線を表示し、ログイン不可
- AC-7: `/profile` は session 必須で、未ログインアクセスは `/login?redirect=/profile` に redirect される
- AC-8: `/profile` は本人の `MemberProfile` view model を read-only で表示し、編集 form / button が一切存在しない（不変条件 #4）
- AC-9: `/profile` に `editResponseUrl` ボタン（response.editResponseUrl が null の場合は表示しない or disabled）と responderUrl への CTA がある
- AC-10: `/profile` に状態サマリ（rulesConsent / publicConsent / publishState / 参加履歴）が表示される
- AC-11: `/profile` で表示する field は `MemberProfile.fields` の stableKey 経由参照のみ、questionId 直書き 0 件
- AC-12: `localStorage` を session / route の正本にしない（不変条件 #8）

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
| 設計 | outputs/phase-02/page-tree.md | 2 ルート × Server / Client 境界 |
| 設計 | outputs/phase-02/auth-gate-state-ui.md | 5 状態 × UI ブロック対応表 |
| 設計 | outputs/phase-02/data-fetching.md | RSC fetch + 04b / 05b API 呼び出し |
| ランブック | outputs/phase-05/runbook.md | 2 page 実装手順 + placeholder |
| AC | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 |
| ドキュメント | outputs/phase-12/implementation-guide.md | apps/web 会員層の最終ガイド |
| メタ | artifacts.json | 13 phase 状態 |

## services / secrets

| 種別 | 名称 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| service | Cloudflare Workers (apps/web via `@opennextjs/cloudflare`) | runtime | 2 |
| service | apps/api 経由で D1 アクセス | runtime | 2 |
| var | `PUBLIC_API_BASE_URL` | wrangler vars | 5 |
| var | `AUTH_URL` | wrangler vars（05a/b と共有） | 5 |
| secret | なし（auth secrets は 05a/b で導入） | - | - |

## ui_routes

- `/login`
- `/profile`

## invariants touched

| # | 名称 | 関連箇所 |
| --- | --- | --- |
| #1 | 実フォーム schema をコードに固定しすぎない | profile field は stableKey 参照のみ |
| #2 | consent キーは `publicConsent` / `rulesConsent` に統一 | 状態サマリ表記 |
| #4 | profile 本文編集は Google Form 再回答経路 | `/profile` は read-only、編集 UI なし |
| #5 | apps/web から D1 直接禁止 | 全データ取得は 04b / 05b 経由 |
| #6 | GAS prototype を本番仕様に格上げしない | `window.UBM` `localStorage` 不採用 |
| #7 | `responseId` と `memberId` を混同しない | session.memberId のみ参照 |
| #8 | localStorage を正本にしない | session は cookie 正本、URL state は query |
| #9 | `/no-access` 専用画面に依存しない | `/login` で 5 状態を吸収 |
| #10 | Cloudflare 無料枠 | session / profile fetch を revalidate 0（dynamic）でも上限内に |

## completion definition

- 13 phase すべてが `completed`
- artifacts.json の各 phase status 一致
- AC-1〜AC-12 が phase-07 で完全トレース
- phase-12 で `implementation-guide.md` ほか 6 種が生成
- phase-13 はユーザー承認後にのみ実行

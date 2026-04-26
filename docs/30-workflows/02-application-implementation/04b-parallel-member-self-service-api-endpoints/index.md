# 04b-parallel-member-self-service-api-endpoints - タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | member-self-service-api-endpoints |
| ディレクトリ | doc/02-application-implementation/04b-parallel-member-self-service-api-endpoints |
| Wave | 4 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | api / member |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

ログイン会員自身のセッション情報・自分のプロフィール・公開停止/退会の依頼受付を担う `/me/*` エンドポイント群を `apps/api`（Hono）に実装する。本人プロフィール本文は D1 で直接編集せず、Google Form `editResponseUrl` への誘導に閉じる（不変条件 #4）。session user の `memberId` 以外を絶対に返さない（不変条件 #11 の前哨）。

## スコープ

### 含む

- `GET /me`（SessionUser: email / memberId / responseId / isAdmin / authGateState）
- `GET /me/profile`（MemberProfile: public + member field 全部 + status サマリ + `editResponseUrl`）
- `POST /me/visibility-request`（公開停止申請を `admin_member_notes` 経由で admin queue 化）
- `POST /me/delete-request`（退会申請を `admin_member_notes` 経由で admin queue 化）
- 認可境界（session 必須・他人 memberId 禁止・403/404 境界）
- 上流 02a の `responseRepository` / `memberStatusRepository` / `responseFieldsRepository` / `responseSectionsRepository` / `memberFieldVisibilityRepository` の組み合わせ
- 上流 03b の current_response_id 解決と consent snapshot 反映の利用

### 含まない

- profile 本文の直接編集 API（`PATCH /me/profile` 系。不変条件 #4）
- admin 側のキュー処理（07a/c）
- Auth.js provider 設定（05a/b）
- `/login` UI 実装（06b）
- magic_token 発行（05b）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 02a-parallel-member-identity-status-and-response-repository | members / status / responses / fields / visibility 取得用 repository |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `admin_member_notes` への visibility/delete request 投入と audit log |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | current_response_id 切替と editResponseUrl 解決 |
| 上流 | 01b-parallel-zod-view-models-and-google-forms-api-client | SessionUser / MemberProfile / view model 型 |
| 下流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | session callback で `/me` を呼び SessionUser 生成 |
| 下流 | 05b-parallel-magic-link-provider-and-auth-gate-state | AuthGateState 解決後の `/me` 呼び出し |
| 下流 | 06b-parallel-member-login-and-profile-pages | `/me/profile` を SSR/CSR で利用 |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | contract / authz test の入口 |
| 並列 | 04a, 04c | 同 Wave 内独立 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/06-member-auth.md | SessionUser 型・ログイン許可条件 |
| 必須 | doc/00-getting-started-manual/specs/07-edit-delete.md | 本文直接編集禁止・editResponseUrl 誘導・visibility/delete 申請 API |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | MVP ログイン条件・公開条件分離 |
| 必須 | doc/00-getting-started-manual/specs/02-auth.md | session 内容・admin 判定切り出し |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | stableKey / responseEmail / system field 区分 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | SessionUser / MemberProfile / FieldVisibility 型 |
| 参考 | doc/00-getting-started-manual/specs/08-free-database.md | member_status / response_fields / admin_member_notes テーブル |
| 参考 | doc/00-getting-started-manual/specs/11-admin-management.md | admin_member_notes 利用ポリシー |
| 参考 | doc/02-application-implementation/_design/phase-2-design.md | Wave 4b 詳細 |

## 受入条件 (AC)

- AC-1: 未ログイン要求は 401 を返し、`memberId` を一切露出しない
- AC-2: ログイン中ユーザーは自分の `memberId` 以外を絶対に取得できない（path 改ざん試験で 403 / 404）
- AC-3: `GET /me/profile` の response に `editResponseUrl` が含まれる（取得不能時は `null` で fall-back し、責務は responderUrl 提示に明示移譲）
- AC-4: `POST /me/visibility-request` / `POST /me/delete-request` は `admin_member_notes` に種別付きで queue 投入され、本文（response_fields）は一切変更しない
- AC-5: response schema（zod）が view model 型と一致し、`responseId` と `memberId` は型で混同不可
- AC-6: rate limit を session 単位で 5 req/min（visibility/delete request）に制限し、二重申請が判定可能
- AC-7: `/me` レスポンスに `authGateState`（`active` / `rules_declined` / `deleted`）が含まれ、session 失効時は 401
- AC-8: 全 endpoint で `admin_member_notes` の本文値が leak しない（contract test）

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
| 設計 | outputs/phase-02/endpoint-spec.md | 4 endpoint の request / response schema |
| 設計 | outputs/phase-02/handler-design.md | Hono route / middleware / repository 結線 |
| 設計 | outputs/phase-04/test-matrix.md | unit / contract / authz テスト対応表 |
| 実装 | outputs/phase-05/runbook.md | route 実装ステップと擬似コード |
| 実装 | outputs/phase-05/pseudocode.md | handler / middleware の placeholder |
| 検証 | outputs/phase-06/failure-cases.md | 401/403/404/422/5xx と consent 取り消し挙動 |
| 検証 | outputs/phase-07/ac-matrix.md | AC × verify × runbook |
| 検証 | outputs/phase-09/free-tier.md | D1 read/write 見積もりと secret hygiene |
| 検証 | outputs/phase-11/manual-evidence.md | curl サンプル / wrangler 出力 placeholder |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様 | phase-*.md x 13 | Phase 仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers (apps/api) | Hono runtime | 100k req/day 内 |
| Cloudflare D1 | members / response_fields / admin_member_notes | 5GB / 500k reads / 100k writes 内 |
| Auth.js (consumer) | session 注入のみ。provider 設定は 05a | - |

## Endpoints 一覧

| method | path | 認可 | 主 view model | 上流 repository |
| --- | --- | --- | --- | --- |
| GET | /me | session 必須 | SessionUser | members + member_status |
| GET | /me/profile | session 必須 + 自身のみ | MemberProfile | members + responses + fields + visibility |
| POST | /me/visibility-request | session 必須 + 自身のみ | { queueId, status: "pending" } | admin_member_notes |
| POST | /me/delete-request | session 必須 + 自身のみ | { queueId, status: "pending" } | admin_member_notes |

## D1 テーブル（参照）

- `members`
- `member_identities`
- `member_status`
- `member_responses`
- `response_sections`
- `response_fields`
- `member_field_visibility`
- `admin_member_notes`（書き込み: visibility/delete request の queue 用 type）
- `audit_log`（admin_member_notes 経由で間接書き込み）

## Secrets 一覧（このタスクで導入）

| 変数名 | 種別 | 配置先 | 確定 Phase |
| --- | --- | --- | --- |
| なし | - | - | - |

- 認証 secret は 05a / 05b で導入。本タスクは consumer 側のみ。

## 触れる不変条件

- #4: 本人プロフィール本文は D1 override で編集しない（Form 再回答が正式経路）
- #5: apps/web から D1 直接アクセス禁止（apps/api 経由のみ） — 本タスクは apps/api 側
- #7: `responseId` と `memberId` は混同しない
- #8: `localStorage` を session の正本にしない
- #9: `/no-access` 専用画面に依存しない（AuthGateState で出し分け）
- #11: 管理者は他人プロフィール本文を直接編集できない（本人エンドポイントでも他人 memberId 露出禁止）
- #12: admin_member_notes は public/member view model に混ざらない（visibility/delete request も notes 側に閉じる）

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC が Phase 7 / 10 で完全トレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 12 の same-wave sync ルールが破られていない
- Phase 13 はユーザー承認なしでは実行しない

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md, ../_templates/task-index-template.md
- 設計書: ../_design/phase-2-design.md（Wave 4b 節）

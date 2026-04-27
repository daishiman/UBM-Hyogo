# Phase 1: 要件定義 — アプリ実装タスク仕様書 design

## メタ情報

| 項目 | 値 |
| --- | --- |
| 設計対象 | doc/02-application-implementation/ 配下の全タスク仕様書 |
| Phase | 1 / 3（設計書 phase） |
| 作成日 | 2026-04-26 |
| 上流 | doc/00-getting-started-manual/specs/00-16 |
| 下流 | _design/phase-2-design.md / _design/phase-3-review.md |

## 真の論点

specs/14-implementation-roadmap.md は Phase 0-7 のロードマップを既に提示している。本設計の真の論点は次の3つ。

1. **責務分離の単位**: Phase 0-7 をそのまま 1 タスク = 1 Phase にすると粒度が粗く、並列化余地を失う。並列実行可能な責務（公開/会員/管理 API、Forms schema/response sync、公開/会員/管理 UI 等）を独立タスクへ切り出す。
2. **既存インフラ層との境界**: `doc/01-infrastructure-setup/` が Wave 0-5 でインフラを扱うので、本パッケージはアプリ実装に閉じる。Cloudflare Workers/Workers/D1 binding などの確定構成を前提にし、再定義しない。
3. **特性に最適化**: Forms 同期は scheduled job、API は HTTP request/response、UI は user-facing 画面、admin 機能は権限境界が中核 — 各タスクの phase 仕様書はこれらの特性を踏まえて検証手順を固有化する。

## スコープ

### 含む
- specs/00-16 が記述する機能の実装タスク仕様書（Phase 1〜13 形式 × 各タスク）
- 責務分離されたディレクトリ構成（命名で並列/直列が判別可能）
- 各タスクの artifacts.json / index.md / phase-01〜13.md / outputs/ 雛形
- _templates / README / Wave 一覧

### 含まない
- コードの実装（apps/web, apps/api, packages/* のソース変更）
- 既存インフラタスク仕様書（doc/01-infrastructure-setup/）の改訂
- Phase 12 ドキュメント本体生成・Phase 13 PR 作成（user 承認後の別 wave）
- specs/ ファイル本体の改訂

## 上位前提（不変条件 15項目）

| # | 不変条件 | 出典 specs |
| --- | --- | --- |
| 1 | `responseEmail` は system field（Google 自動収集）。フォーム項目として扱わない | 01, 03, 04 |
| 2 | `responseId` と `memberId` を混同しない（同一メールの再回答を許容） | 03, 04, 06 |
| 3 | consent キーは `publicConsent` と `rulesConsent` の2種だけ | 01, 02, 06, 13 |
| 4 | 本人プロフィール本文の更新は Google Form 再回答のみ。app 内直編集禁止 | 00, 07, 13 |
| 5 | 公開 / 会員 / 管理の3層を権限境界で分離 | 06, 11 |
| 6 | `apps/web` から D1 へ直接アクセス禁止。`apps/api` 経由のみ | 00, 03, 08 |
| 7 | 削除は論理削除（`deleted_members` 履歴を残す）。物理削除しない | 07, 11 |
| 8 | GAS prototype 由来の localStorage / 無認証動作を本番に持ち込まない | 00, 05, 09, 13 |
| 9 | `/no-access` 専用画面に依存しない。`/login` 状態で案内 | 02, 06, 10, 13 |
| 10 | 31項目・6セクションの既知 schema を保護。alias で吸収 | 01, 03 |
| 11 | 管理者は他人本文を直接編集しない（タグ・公開状態・開催日のみ） | 07, 11 |
| 12 | タグは派生情報。本人入力不可、管理者レビュー後に queue → member_tags | 12 |
| 13 | 開催日 / 参加履歴は Google Form schema 外で管理 | 03, 08 |
| 14 | Cloudflare 無料枠前提（Pages 100k req/day, D1 5GB / 500k reads / 100k writes） | 08 |
| 15 | UI は `stableKey` 参照。`questionId` 直書き禁止 | 01, 03 |

## specs ファイル → 実装責務マッピング

| specs ファイル | 主担当タスク | 派生タスク |
| --- | --- | --- |
| 00-overview.md | 全タスク共通の前提（不変条件 source） | — |
| 01-api-schema.md | 03a form schema sync, 04a/b/c API contract | 02 repository, 01b validation |
| 02-auth.md | 05 auth integration | 04c admin API (admin_users 確認) |
| 03-data-fetching.md | 03a/03b form sync, 02 repository | 04a/b/c API view-model 構築 |
| 04-types.md | 00 shared types & UI primitives | 01b validation schema |
| 05-pages.md | 06a/06b/06c pages | — |
| 06-member-auth.md | 05 auth integration, 06b member pages | 04b member API |
| 07-edit-delete.md | 06b member profile, 07 admin ops | 04b member API |
| 08-free-database.md | 01a D1 schema & migrations | 02 repository, 04* API |
| 09-ui-ux.md | 06a/06b/06c pages, 08b E2E smoke | 00 UI primitives |
| 10-notification-auth.md | 05 auth integration (Magic Link) | 04b member API |
| 11-admin-management.md | 04c admin API, 06c admin pages, 07 admin ops | — |
| 12-search-tags.md | 04c admin API (tag queue), 06c admin pages, 06a public list | 07 admin ops |
| 13-mvp-auth.md | 05 auth integration | — |
| 14-implementation-roadmap.md | (master roadmap, 全タスクが参照) | — |
| 15-infrastructure-runbook.md | (cross-ref, doc/01-infrastructure-setup と同期) | 09 release |
| 16-component-library.md | 00 UI primitives | 06a/b/c pages |

## タスク分解（命名で実装内容が分かる24タスク）

ディレクトリ名から `何を実装するか` が読み取れるよう、責務 + 主成果物のキーワードを命名に含める。

1. **00-serial-monorepo-shared-types-and-ui-primitives-foundation** — pnpm workspace 立ち上げ、`packages/shared` 型移植（04-types.md）、`apps/web/src/components/ui/` UI primitives 15種（16-component-library.md）
2. **01a-parallel-d1-database-schema-migrations-and-tag-seed** — 08-free-database.md の 16 テーブル D1 migration、tag_definitions 6カテゴリ初期 seed
3. **01b-parallel-zod-view-models-and-google-forms-api-client** — `packages/shared` の zod validation + view model 型、`packages/integrations/google` の Forms API クライアント雛形
4. **02a-parallel-member-identity-status-and-response-repository** — members / identities / status / responses / visibility / tags / extraFields の repository
5. **02b-parallel-meeting-tag-queue-and-schema-diff-repository** — meetings / attendance / tag definitions / tag queue / schema diff queue の repository
6. **02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary** — admin users / admin notes / audit log / sync jobs / magic tokens の repository、`apps/web` から D1 直接アクセス禁止 lint
7. **03a-parallel-forms-schema-sync-and-stablekey-alias-queue** — `forms.get` schema sync、`schema_versions` / `schema_questions` 保存、未割当 question を `schema_diff_queue` に登録、alias 解決
8. **03b-parallel-forms-response-sync-and-current-response-resolver** — `forms.responses.list` 取得、stableKey 解決、`extraFields` 保存、`current_response_id` 切替、`publicConsent`/`rulesConsent` snapshot 反映
9. **04a-parallel-public-directory-api-endpoints** — `GET /public/stats` `GET /public/members` `GET /public/members/:memberId` `GET /public/form-preview` の4 endpoint
10. **04b-parallel-member-self-service-api-endpoints** — `GET /me` `GET /me/profile` `POST /me/visibility-request` `POST /me/delete-request`、`editResponseUrl` 取得
11. **04c-parallel-admin-backoffice-api-endpoints** — `/admin/dashboard` `/admin/members*` `/admin/tags/queue*` `/admin/schema*` `/admin/meetings*` `/admin/sync/*` 全 endpoint、`admin_member_notes` 管理メモ
12. **05a-parallel-authjs-google-oauth-provider-and-admin-gate** — Auth.js Google OAuth provider、admin gate middleware
13. **05b-parallel-magic-link-provider-and-auth-gate-state** — Magic Link provider、`POST /auth/magic-link`、AuthGateState 5状態
14. **06a-parallel-public-landing-directory-and-registration-pages** — `/` landing、`/members` 一覧+検索 (q/zone/status/tag/sort/density)、`/members/[id]` 詳細、`/register` 登録導線、form-preview 表示
15. **06b-parallel-member-login-and-profile-pages** — `/login` (AuthGateState 出し分け)、`/profile` (自分の field + 状態サマリ + editResponseUrl ボタン)
16. **06c-parallel-admin-dashboard-members-tags-schema-meetings-pages** — `/admin` dashboard、`/admin/members` (drawer + status 操作)、`/admin/tags` (queue panel)、`/admin/schema` (diff + alias)、`/admin/meetings` (session + attendance)
17. **07a-parallel-tag-assignment-queue-resolve-workflow** — タグ queue resolve（candidate→confirmed→`member_tags`）
18. **07b-parallel-schema-diff-alias-assignment-workflow** — schema diff alias 割当 workflow
19. **07c-parallel-meeting-attendance-and-admin-audit-log-workflow** — meeting attendance 重複登録防止 + 削除済み会員除外、admin 操作 audit log
20. **08a-parallel-api-contract-repository-and-authorization-tests** — 全 endpoint の response schema 検証、repository unit test、public/member/admin 認可境界 test、auth gate / admin member detail / admin meetings の contract test
21. **08b-parallel-playwright-e2e-and-ui-acceptance-smoke** — Playwright で 09-ui-ux.md の検証マトリクス（公開/会員/管理 × desktop/mobile）、screenshot evidence
22. **09a-parallel-staging-deploy-smoke-and-forms-sync-validation** — staging deploy、Forms 同期動作確認、Playwright pass
23. **09b-parallel-cron-triggers-monitoring-and-release-runbook** — cron schedule、監視、release runbook
24. **09c-serial-production-deploy-and-post-release-verification** — production deploy、本番 D1 migration / secrets 確認、post-release verification

合計 24 タスク（並列 22、直列 2）。各ディレクトリ名で `<番号>[a-z]?-<serial|parallel>-<実装内容のキーワード>` の構造により実装内容が判別可能。

> **注記（2026-04-26 更新）**: 上の 17 タスク列挙は要件定義時点の暫定案。Phase 2 設計で「機能境界による並列性最大化」方針を採用し、以下のとおり 24 タスクに再分解した。
>
> - **02-serial** → **02a / 02b / 02c**（domain 別 repository を 3 並列）
> - **05-serial** → **05a / 05b**（Google OAuth と Magic Link を 2 並列）
> - **07-serial** → **07a / 07b / 07c**（tag queue / schema alias / meeting attendance を 3 並列）
> - **09-serial** → **09a / 09b / 09c**（staging deploy / cron+monitoring を並列、production deploy のみ最終 serial）
>
> 確定版 24 タスクの命名・依存関係は `_design/phase-2-design.md` および `README.md` を参照。

## 依存境界（一次仮説）

```
W0(00) → W1(01a + 01b 並列) → W2(02) → W3(03a + 03b 並列)
                                  ↘ W4(04a + 04b + 04c 並列)
                                                  ↓
                                              W5(05) → W6(06a + 06b + 06c 並列)
                                                              ↓
                                                          W7(07) → W8(08a + 08b 並列) → W9(09)
```

詳細マトリクスは Phase 2 で確定。

## 価値とコスト

- **初回価値**: 24 タスク × 13 Phase = 312 仕様書を一括整備し、後続実装の手戻り（責務境界の再設計）を消す。
- **初回で払わないコスト**: 各タスクの実装そのもの。Phase 5（実装）の outputs/phase-05/main.md は「実装手順 + verify command」を記述するに留め、コードは別 wave。
- **トレードオフ**: タスク数が多くなるが、命名で並列/直列が読み取れるため execute 時の判断コストは下がる。

## 4条件 一次評価

| 条件 | 一次判定 | 根拠 |
| --- | --- | --- |
| 価値性 | PASS | specs/ の 17 ファイル全機能を 24 タスクに分解網羅し、後続実装の責務境界を一意化 |
| 実現性 | PASS | 既存 doc/01-infrastructure-setup/_templates/ の構造を流用し、SubAgent 並列で生成可能 |
| 整合性 | TBD | Phase 2 で依存マトリクスを確定後に再判定 |
| 運用性 | TBD | Phase 12 spec sync (specs/ 側の更新フィードバック) を Phase 3 で確認 |

## 受入条件 (AC)

- AC-1: 不変条件 15 項目が各タスクの参照資料セクションで明示される
- AC-2: specs/01-13 の全機能が、いずれかのタスクの scope に含まれる（漏れゼロ）
- AC-3: ディレクトリ命名で `serial` / `parallel` の判別が可能
- AC-4: 各タスクが index.md + artifacts.json + phase-01〜13.md（13ファイル）+ outputs/ 構造を持つ
- AC-5: 並列タスクの依存関係が同 Wave 内で閉じる（cross-wave 並列を作らない）

## 既存資産インベントリ

| 項目 | 内容 | 現状 |
| --- | --- | --- |
| 既存テンプレート | doc/01-infrastructure-setup/_templates/ | 流用可（infra → app へ言い換え） |
| 既存タスク例 | doc/01-infrastructure-setup/02-serial-monorepo-runtime-foundation/ | 構造参考 |
| 正本 spec | doc/00-getting-started-manual/specs/00-16 | 参照対象 |
| 既存 skill | .claude/skills/aiworkflow-requirements/, .claude/skills/task-specification-creator/ | フォーマット source |

## 改善優先順位

1. specs/ 全機能の網羅性（漏れゼロ）
2. 命名による並列/直列判別性
3. 依存マトリクスの一意性
4. SubAgent 並列生成のコスト最小化
5. specs/ 改訂時の同期容易性

## 次 Phase へ

- Phase 2 設計で次を確定:
  - 24 タスクのディレクトリ命名最終案（要件時点 17 から並列性最大化のため再分解）
  - Wave 0-9 と各 Wave 内タスクの依存・並列マトリクス
  - 各タスクの scope / AC / Phase 1-13 の主成果物
  - _templates ファイル構成（artifacts-template.json, phase-template-app.md, task-index-template.md, phase-meaning-app.md）

# 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-dashboard-members-tags-schema-meetings-pages |
| ディレクトリ | doc/02-application-implementation/06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Wave | 6 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | app-admin-ui |
| 状態 | pending |
| タスク種別 | spec_created |

## 目的

`/admin` 配下 5 画面（dashboard / members / tags / schema / meetings）を Next.js App Router の admin セグメントとして実装し、04c の管理 API・05a の admin gate と接続する。本人 profile 本文の直接編集 UI は持たず、タグ編集は queue 経由、schema 変更は専用画面に集約する責務分離を成立させる。

## スコープ

### 含む
- `apps/web/src/app/admin/page.tsx`（dashboard、KPI / 未タグ件数 / schema 課題件数 / 最近の開催日）
- `apps/web/src/app/admin/members/page.tsx`（一覧 + 右ドロワー、Switch + Dialog による status 操作、管理メモ CRUD、`/admin/tags` への導線）
- `apps/web/src/app/admin/tags/page.tsx`（左 queue + 右 review panel、resolve POST 呼び出し）
- `apps/web/src/app/admin/schema/page.tsx`（added/changed/removed/unresolved の 4 ペイン、stableKey alias 割当 UI）
- `apps/web/src/app/admin/meetings/page.tsx`（meeting_sessions 追加フォーム + 開催日一覧 + attendance 編集）
- `apps/web/src/components/admin/`（MemberDrawer / TagQueuePanel / SchemaDiffPanel / MeetingPanel）の組成
- `apps/web/src/app/admin/layout.tsx`（AdminSidebar + admin gate redirect）
- `loading.tsx` / `error.tsx` / `not-found.tsx` の各セグメント共通

### 含まない
- 他人 profile 本文の直接編集 UI（不変条件 #11）
- `/admin/users` 管理者管理 UI（specs 11 で明示的に不採用）
- `/admin/members` ドロワーでのタグ直接編集 UI（不変条件 #13、`/admin/tags` 経由）
- 物理削除 UI（論理削除のみ）
- queue / alias / attendance の workflow 本体（07a / 07b / 07c）
- D1 への直接アクセス（不変条件 #5、必ず 04c API 経由）
- audit log の記録ロジック本体（07c）

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | `/admin/*` 全 API endpoint |
| 上流 | 05a-parallel-authjs-google-oauth-provider-and-admin-gate | admin gate middleware と session.adminFlag |
| 上流 | 05b-parallel-magic-link-provider-and-auth-gate-state | 未認証時の `/login` 誘導 |
| 上流 | 00-serial-monorepo-shared-types-and-ui-primitives-foundation | UI primitives（Drawer / Switch / Modal / Toast） |
| 下流 | 07a-parallel-tag-assignment-queue-resolve-workflow | `/admin/tags` UI から呼ぶ resolve workflow |
| 下流 | 07b-parallel-schema-diff-alias-assignment-workflow | `/admin/schema` UI から呼ぶ alias workflow |
| 下流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | `/admin/meetings` UI から呼ぶ attendance workflow |
| 下流 | 08a-parallel-api-contract-repository-and-authorization-tests | admin endpoint の contract test |
| 下流 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke | 09-ui-ux.md 検証マトリクスの admin 行 |
| 並列 | 06a, 06b | 同 Wave だが画面責務が別 |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | `/admin/*` 5 画面の責務 |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 管理 UX 原則と Playwright 検証マトリクス |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | 管理者権限と運用ルール 7 点 |
| 必須 | doc/00-getting-started-manual/specs/12-search-tags.md | タグ運用と queue panel 仕様 |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | Drawer / Switch / Modal / TagQueuePanel / SchemaDiffPanel / MeetingPanel |
| 参考 | doc/00-getting-started-manual/claude-design-prototype/ | admin 画面の視覚品質下限 |
| 参考 | doc/00-getting-started-manual/gas-prototype/ | 操作叩き台（本番仕様にしない） |

## 受入条件 (AC)

- AC-1: `/admin/members` のドロワー内に profile 本文（`businessOverview`, `selfIntroduction` 等）の input/textarea が存在しない（不変条件 #11、#4）
- AC-2: `/admin/members` ドロワーから `/admin/tags?memberId=...` への導線のみ存在し、tag 直接編集 form がない（不変条件 #13）
- AC-3: schema 差分の表示・解消 UI が `/admin/schema` 以外に存在しない（不変条件 #14）
- AC-4: `/admin/meetings` の attendance 追加 Combobox から削除済み会員（isDeleted=true）が候補から除外される（不変条件 #15）
- AC-5: `/admin/meetings` の attendance 重複登録 POST が UI 側で disabled、かつ 422 受信時に Toast でエラー表示する（不変条件 #15）
- AC-6: `apps/web` から `apps/api/repository/*` や D1 binding の直接 import が ESLint で error（不変条件 #5）
- AC-7: 未認証 / 非 admin で `/admin/*` にアクセスすると `/login` または forbidden 画面に redirect（admin gate）
- AC-8: `/admin` の KPI カード 4 種（総会員 / 公開中 / 未タグ / schema 未解決）が `GET /admin/dashboard` 1 回で取得できる
- AC-9: 管理メモは `/admin/members` ドロワー内のみ表示され、`/members/[id]` や `/profile` には絶対に出ない（不変条件 #12）
- AC-10: `editResponseUrl` ボタンが `/admin/members` ドロワーから member の Google Form 編集画面へ遷移する（管理者は本人更新を促す導線のみ）

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
| ドキュメント | outputs/phase-02/admin-pages-design.md | 5 画面の component / data flow / Mermaid |
| ドキュメント | outputs/phase-04/admin-test-strategy.md | unit / contract / E2E 計画 |
| ドキュメント | outputs/phase-05/admin-implementation-runbook.md | App Router 実装手順と擬似コード |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 × 実装 |
| ドキュメント | outputs/phase-11/manual-smoke-evidence.md | 手動 smoke の screenshot 一覧 |
| メタ | artifacts.json | 機械可読サマリー |
| 仕様書 | phase-01.md 〜 phase-13.md | Phase 別仕様 |

## 関連サービス・ツール

| サービス/ツール | 用途 | 無料枠/コスト |
| --- | --- | --- |
| Cloudflare Workers | apps/web Next.js (`@opennextjs/cloudflare`) | 100k req/日 |
| Cloudflare D1 | (apps/api 経由のみ参照) | 5GB / 500k reads / 100k writes |
| Auth.js | admin gate の session 検証 | 無料 |

## Secrets 一覧（このタスクで導入）

なし。既存 secrets（AUTH_SECRET / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET）は 05a で定義済み。

## 触れる不変条件

- #4: 本人プロフィール本文は D1 override で編集しない
- #5: apps/web から D1 直接アクセス禁止
- #11: 管理者は他人プロフィール本文を直接編集できない
- #12: admin_member_notes は public/member view model に混ざらない
- #13: tag は admin queue → resolve 経由で member_tags に反映
- #14: schema 変更は `/admin/schema` に集約
- #15: meeting attendance は重複登録不可、削除済み会員は除外

## 完了判定

- Phase 1〜13 の状態が artifacts.json と一致する
- AC 10 件すべてが Phase 7 / 10 でトレースされる
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）が PASS
- Phase 13 の PR が user 承認後に作成される

## 関連リンク

- 上位 README: ../README.md
- 共通テンプレ: ../_templates/phase-template-app.md
- 上流 task: ../04c-parallel-admin-backoffice-api-endpoints/index.md, ../05a-parallel-authjs-google-oauth-provider-and-admin-gate/index.md
- 下流 task: ../07a-parallel-tag-assignment-queue-resolve-workflow/index.md, ../07b-parallel-schema-diff-alias-assignment-workflow/index.md, ../07c-parallel-meeting-attendance-and-admin-audit-log-workflow/index.md

# 06c-B-admin-members

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

`/admin/members`（一覧・検索/フィルタ）と `/admin/members/[id]`（詳細・論理削除/復元・ロール変更・audit 表示）の admin UI と対応 API 接続を、`11-admin-management.md` / `07-edit-delete.md` / `12-search-tags.md` の正本仕様に整合させる follow-up 仕様書。実装は行わず spec のみを定義する。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、06c admin pages 本体で骨組みのみ作成された admin members 画面に対し、検索/フィルタ仕様・論理削除/復元 API 接続・audit log 表示の未接続部分だけを切り出して扱う。

`apps/web/app/admin/members/page.tsx` および `[id]/page.tsx` は SSR スケルトンのみで、`GET /api/admin/members` の検索パラメータ（`q` / `zone` / `status` / `tag` / `sort`）と詳細画面の soft-delete / restore / role 変更 API、`12-search-tags.md` の検索 contract を満たしていない。本タスクはこの欠損だけを対象とし、admin の他機能（CSV export / 統計 / 一括操作等）は scope 外とする。

## scope in / out

### Scope In
- `/admin/members` 一覧 UI（検索フォーム、zone/status/tag フィルタ、sort、ページング）
- `/admin/members/[id]` 詳細 UI（基本情報・role・audit log 表示・論理削除/復元・ロール変更導線）
- `GET /api/admin/members?q&zone&status&tag&sort` の query 契約と response 契約
- `GET /api/admin/members/:id` の response 契約（audit log 含む）
- `POST /api/admin/members/:id/soft-delete` / `POST /api/admin/members/:id/restore` の admin authorize 境界
- `POST /api/admin/members/:id/role` の role 変更と audit 記録
- require-admin middleware 経由の admin guard
- 不変条件 #4 / #5 / #11 / #13 の admin 適用

### Scope Out
- public/会員向け検索 UI
- CSV エクスポート、一括操作、統計ダッシュボード
- Google Form 再回答経路（本人更新は MVP では Form を正本）
- admin user の招待/作成 flow
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On
- 06c-A-admin-dashboard（admin shell 共通基盤）
- 06c admin pages 本体（`/admin/*` のレイアウト・auth gate）
- 06b-A-me-api-authjs-session-resolver（admin session 解決の前提）
- 07-edit-delete API（soft-delete / restore endpoint 実装）
- apps/api `require-admin` middleware
- 12-search-tags.md（admin 検索パラメータ契約）

### Blocks
- 06c-C-admin-tags（admin shell 共通基盤を引き継ぐ）
- 08b-A-playwright-e2e-full-execution（admin members E2E）
- 09a-A-staging-deploy-smoke-execution（admin staging smoke）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06c-A（admin layout / guard）→ 06c-B（本タスク）→ 08b-A admin E2E** の serial。
- 本タスクは admin members の単独 SRP を担い、後続 E2E と smoke の前提を確定する。
- 06c-A〜E（admin 5 件）は実態として admin shell 共通基盤を共有する parallel-eligible だが、命名規則「sort 順 = 実行順」に従い名目上 serial として A → B → C → D → E の順で実行する。

## refs

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/admin/members/page.tsx
- apps/web/app/admin/members/[id]/page.tsx
- apps/api/src/routes/admin/members/index.ts
- apps/api/src/middleware/require-admin.ts

## AC

- `/admin/members` で `q` / `zone` / `status` / `tag` / `sort` の組み合わせ検索が `12-search-tags.md` 通りに動作し、結果がページングされる。
- `/admin/members/[id]` が基本情報・role・audit log を表示し、admin による soft-delete / restore / role 変更が成功・失敗で分岐表示される。
- `GET /api/admin/members*` は admin 以外で 403、未ログインで 401 を返す。
- soft-delete / restore は `07-edit-delete.md` の論理削除ポリシーに従い、`deletedAt` / `restoredAt` と audit log を記録する。
- 不変条件 #4（本文編集禁止）, #5（apps/web D1 直参照禁止）, #11（admin も他人本文編集不可）, #13（audit log 必須）に違反しない。
- production secret 値は仕様書中に登場しない。

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

- outputs/phase-01/main.md
- outputs/phase-02/main.md
- outputs/phase-03/main.md
- outputs/phase-04/main.md
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #4 本文編集禁止（admin も同じ）
- #5 apps/web D1 direct access forbidden
- #11 admin も他人本文編集不可
- #13 admin 操作の audit log 必須

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。

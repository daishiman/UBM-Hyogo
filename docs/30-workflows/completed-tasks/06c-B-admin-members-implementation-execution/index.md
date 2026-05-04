[実装区分: 実装仕様書]
> 根拠: docs-only ラベルだが、目的（admin members 画面の検索/フィルタ・論理削除/復元・audit 表示）達成には `apps/api` / `apps/web` / `packages/shared` の実コード変更が必要なため、CONST_004 例外として実装仕様書扱いとする。

# 06c-B-admin-members-implementation-execution

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| taskType | implementation |
| 状態 | spec-pending / implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 作成日 | 2026-05-04 |
| 上流タスク | docs/30-workflows/completed-tasks/06c-B-admin-members（docs-only / remaining-only として確定済み） |
| 関連 Issue | GitHub Issue #430 / `task-06c-b-admin-members-implementation-execution-001` |

## purpose

`06c-B-admin-members` workflow が docs-only / remaining-only として確定した admin members 画面の残実装契約を `apps/api` / `apps/web` / `packages/shared` の実コードに落とし込む。Phase 12 implementation-guide に既に記述された設計を、新規 workflow 上で要件・設計・レビュー・実装・evidence 取得の 13 phase として再定義し、実装担当者が単独で完遂できる粒度の仕様に揃える。

## why this is implementation execution

- 06c-B 本体タスクは「docs-only」ラベルで完了扱いだが、Phase 12 review cycle で実コード変更まで進んだため、後続の admin E2E (08b-A) / staging smoke (09a) が依存する実コード境界が宙に浮いている。
- 本タスクは新たな機能追加ではなく、既に Phase 12 implementation-guide に記述された設計の「実装実行と evidence 取得」を SRP として切り出す。

## scope in / out

### Scope In

1. `apps/api/src/routes/admin/members.ts` の `GET /admin/members` を拡張
   - 既存 `filter=published|hidden|deleted` 互換を維持
   - `q` (trim + 連続空白正規化 + max 200, >200 → 422)
   - `zone` (`all | 0_to_1 | 1_to_10 | 10_to_100`, 範囲外 → 422)
   - repeated `tag` (max 5, AND, `tag_definitions.code` 語彙)
   - `sort` (`recent | name`, 範囲外 → 422)
   - `density` (`comfy | dense | list`, 範囲外 → 422)
   - `page` (1-based, `pageSize=50` 固定, 0/非整数 → 422, 過大 → 200 + 空配列)
   - response: `{ total, members, page, pageSize }`（旧 `{ total, members }` 互換維持）
2. `apps/api/src/routes/admin/member-delete.ts` の delete / restore 実装
   - delete は `{ reason }` 必須、status / deleted_members / audit_log を `DB.batch()` で接続し、`admin.member.deleted` / `admin.member.restored` を append
   - response: `{ id, isDeleted: true, deletedAt }` / `{ id, restoredAt }`
3. `apps/web/app/(admin)/admin/members/page.tsx` / `MembersClient.tsx` / `MemberDrawer.tsx` の拡張
   - URL state 同期（`q` / `zone` / `tag[]` / `sort` / `density` / `filter` / `page`）
   - 検索フォーム / select / フィルタボタン / ページング nav
   - 右ドロワーで基本情報・audit log・delete/restore 結果分岐表示
   - cookie forwarding のみ（D1 直参照禁止 = 不変条件 #5）
4. `packages/shared` で admin members の query parser / Zod schema を必要に応じて抽出
   - `packages/shared/src/admin/search.ts` に `AdminMemberSearchZ` zod schema、`AdminMemberSearch` 型、`ADMIN_SEARCH_LIMITS`、`toAdminApiQuery()` helper
   - `AdminMemberListView` を `page?` / `pageSize?` を含む形に後方互換拡張
5. Phase 11 visual evidence 3 枚
   - `outputs/phase-11/screenshots/admin-members-list.png`
   - `outputs/phase-11/screenshots/admin-members-detail.png`
   - `outputs/phase-11/screenshots/admin-members-delete.png`

### Scope Out

- `/admin/members/[id]` 個別ページ復活（list + 右ドロワー契約を維持）
- admin role 変更 UI / API
- CSV export / 一括操作 / 統計ダッシュボード / admin 招待 flow
- Google Form 再回答経路（本人更新は MVP では Form を正本）
- production secret 値の記録
- ユーザー指示なき commit / push / PR
- public / 会員向け検索 UI

## API 契約

| 端点 | メソッド | 入力 | 出力 | 異常 |
| --- | --- | --- | --- | --- |
| `/api/admin/members` | GET | `filter` `q` `zone` `tag[]` `sort` `density` `page` `pageSize` | `{ total, members, page, pageSize }` | 401 / 403 / 422 |
| `/api/admin/members/:memberId` | GET | path id | `{ member, auditLogs[] }` (`AdminMemberDetail`) | 401 / 403 / 404 |
| `/api/admin/members/:memberId/delete` | POST | path id, `{ reason }`, actor session | `{ id, isDeleted: true, deletedAt }` + audit_log | 401 / 403 / 404 / 409 / 422 |
| `/api/admin/members/:memberId/restore` | POST | path id, actor session | `{ id, restoredAt }` + audit_log | 401 / 403 / 404 / 409 |

## 認可境界

| 状態 | 振る舞い |
| --- | --- |
| 未ログイン | 401（または apps/web 側でログインリダイレクト） |
| 非 admin | 403 |
| 不明 member | 404 |
| 状態競合（既に削除済みを delete 等） | 409 |
| 不正 query / body | 422 |

## dependencies

### Depends On

- 06c-A-admin-dashboard（admin shell 共通基盤）
- 06c admin pages 本体（`/admin/*` のレイアウト・auth gate）
- 06b-A-me-api-authjs-session-resolver（admin session 解決）
- 07-edit-delete API（delete / restore endpoint policy）
- 12-search-tags（admin 検索パラメータ契約）
- `apps/api` `require-admin` middleware

### Blocks

- 06c-C-admin-tags（admin shell 共通基盤の引き継ぎ）
- 08b-A-playwright-e2e-full-execution（admin members E2E）
- 09a-A-staging-deploy-smoke-execution（admin staging smoke）

## refs

- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/07-edit-delete.md
- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- docs/30-workflows/completed-tasks/06c-B-admin-members/outputs/phase-12/implementation-guide.md
- apps/web/app/(admin)/admin/members/page.tsx
- apps/web `MembersClient` / `MemberDrawer`
- apps/api/src/routes/admin/members.ts
- apps/api/src/routes/admin/member-delete.ts
- apps/api/src/middleware/require-admin.ts
- packages/shared/src/admin/search.ts（新規予定）

## AC

- `/admin/members` が `filter` + `q` / `zone` / repeated `tag` / `sort` / `density` / `page` の組合せで `12-search-tags.md` 準拠の検索結果を返し、ページングされる。
- `/admin/members` 右ドロワーが基本情報・audit log を表示し、admin による delete / restore の成功・失敗が分岐表示される。
- `GET /api/admin/members*` は admin 以外で 403、未ログインで 401、状態競合で 409、不正 query で 422 を返す。
- delete / restore は `07-edit-delete.md` の論理削除ポリシーに従い、`audit_log` に `admin.member.deleted` / `admin.member.restored` を含む actor / target / action / before / after を記録する。
- 不変条件 #4 / #5 / #11 / #13 に違反しない。
- `apps/web` から D1 への直アクセスが存在しない（`fetchAdmin` 経由のみ）。
- production secret 値が仕様書・コード・ログに登場しない。
- `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / 関連 vitest スイートが pass する。
- Phase 11 runtime evidence 3 枚（list / detail / delete）は本 workflow では `PENDING_RUNTIME_EVIDENCE` として契約化し、08b / 09a の user-gated runtime 実行で取得する。

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
- [phase-11.md](phase-11.md) — 手動 smoke / runtime evidence contract（pending user approval）
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成（pending user approval）

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
- outputs/phase-11/screenshots/admin-members-list.png（08b / 09a runtime handoff）
- outputs/phase-11/screenshots/admin-members-detail.png（08b / 09a runtime handoff）
- outputs/phase-11/screenshots/admin-members-delete.png（08b / 09a runtime handoff）
- outputs/phase-12/main.md
- outputs/phase-12/implementation-guide.md
- outputs/phase-13/main.md

## invariants touched

- #4 本文編集禁止（admin も同じ）
- #5 apps/web D1 direct access forbidden
- #11 admin も他人本文編集不可
- #13 admin 操作の audit log 必須

## completion definition

全 phase 仕様書と Phase 12 strict outputs が揃い、`apps/api` / `apps/web` / `packages/shared` の admin members 検索・ページング・delete/restore・audit 表示が実装され、関連 vitest / lint / typecheck が pass すること。Phase 11 runtime screenshot 3 枚は authenticated admin fixture と staging/runtime access が必要なため、本 workflow では `PENDING_RUNTIME_EVIDENCE` の evidence contract として閉じ、08b / 09a で取得する。staging deploy、commit、push、PR 作成は user approval gate の外側に残し、本仕様書群では実行しない。

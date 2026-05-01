# 06c-C-admin-tags

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 06c-fu |
| mode | parallel |
| owner | - |
| 状態 | spec_created / docs-only / remaining-only |
| visualEvidence | VISUAL_ON_EXECUTION |

## purpose

管理者向けタグ管理画面 `/admin/tags` の実装 follow-up 仕様書。`12-search-tags.md` が定めるタグ正本と `11-admin-management.md` が定める admin タグ操作（タグ作成/編集/別名管理/メンバー割当）を、admin pages 本体（06c）と admin schema/tag ops 本体（07b）に乗せる形で確定させる。

## why this is not a restored old task

このタスクは完了済み本体タスクの復活ではなく、admin pages 本体（06c）と admin schema 本体（07b）の納品物において `/admin/tags` ルートと API 実装が別 wave に分離されている穴を埋める follow-up である。具体的には `claude-design-prototype/pages-admin.jsx` の tags section と `12-search-tags.md` `11-admin-management.md` の正本に対して、admin tags の CRUD UI / API / D1 操作 / audit log を一筆書きで設計する責務がどの本体タスクにも完全には乗っていないため、本タスクで spec のみを確定する。

## scope in / out

### Scope In
- `/admin/tags` ルート（一覧 / 作成 / 編集 / 別名管理 / メンバー割当）の UI 仕様
- API: `GET/POST /api/admin/tags`, `PATCH/DELETE /api/admin/tags/:id`, `POST/DELETE /api/admin/tags/:id/aliases`, `POST/DELETE /api/admin/tags/:id/assignments`
- D1 tables: `tags`, `tag_aliases`, `member_tags` の admin 操作面
- admin role boundary（不変条件 #5 / #11）と audit log（不変条件 #13）

### Scope Out
- 公開ディレクトリ側のタグ検索 UI
- メンバー本人によるタグ申請 UI
- Google Form 由来のタグ抽出ロジック変更
- production secret 値の記録
- 未承認 commit/push/PR

## dependencies

### Depends On
- 06c-B-admin-members（admin shell 共通基盤）
- 06c admin pages 本体（admin layout / nav / role guard）
- 07b admin schema / tag ops 本体（D1 migration / repository 層）
- 06b-A-me-api-authjs-session-resolver（admin session resolver の前提）

### Blocks
- 06c-D-admin-schema（admin shell 共通基盤を引き継ぐ）
- 08b-A-playwright-e2e-full-execution（admin tags E2E）
- 09a-A-staging-deploy-smoke-execution（admin staging smoke）

### 内部依存（同 wave 内 serial 実行を明示）
- 表記上は parallel だが、実依存は **06b-A → 06c admin pages → 07b admin schema → 06c-C** の serial。
- 本タスクは admin tags の UI / API / D1 を貫通する SRP を担う。
- 06c-A〜E（admin 5 件）は実態として admin shell 共通基盤を共有する parallel-eligible だが、命名規則「sort 順 = 実行順」に従い名目上 serial として A → B → C → D → E の順で実行する。

## refs

- docs/00-getting-started-manual/specs/12-search-tags.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/06-member-auth.md
- docs/00-getting-started-manual/specs/09-ui-ux.md
- docs/00-getting-started-manual/claude-design-prototype/pages-admin.jsx
- apps/web/app/admin/(routes)/
- apps/api/src/routes/admin/
- packages/shared/src/admin/tags.ts

## AC

- 管理者は `/admin/tags` でタグ一覧・作成・編集・削除・別名追加・メンバー割当ができる
- 非管理者は 403 を受け、admin route に到達できない
- タグ名 / 別名は重複登録できず、422 を返す
- メンバー割当は memberId に対して冪等で、再割当は 200 を返す
- すべての admin タグ操作は audit log（actorId / action / targetTagId / timestamp）に記録される
- D1 への直接アクセスは `apps/api` に閉じ、`apps/web` は cookie forwarding のまま成立する

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

- #5 apps/web D1 direct access forbidden
- #11 admin 編集境界
- #13 audit log
- #15 Auth session boundary

## completion definition

全 phase 仕様書が揃い、実装・実測時の evidence path と user approval gate が明確であること。アプリケーションコード実装、deploy、commit、push、PR 作成はこの仕様書作成タスクには含めない。

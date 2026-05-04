[実装区分: 実装仕様書]

# Phase 8: DRY 化 — 06c-B-admin-members-implementation-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 06c-B-admin-members-implementation-execution |
| phase | 8 / 13 |
| wave | 06c-fu |
| mode | parallel |
| 作成日 | 2026-05-04 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |

## 目的

`apps/api` / `apps/web` 双方で重複しがちな検索 schema / fetch helper / audit writer / 命名規則を `packages/shared` および `apps/api/src/lib` に集約し、admin / me 配下の重複を抑制する。

## 実行タスク

1. query parser、URL helper、pageSize 定数の重複を `packages/shared/src/admin/search.ts` に集約する。
2. endpoint 表記は `:memberId` に統一し、`id` / `member_id` の露出揺れを消す。
3. `audit_log`、`member_status`、`member_tags` の table 名を正本仕様と照合する。
4. workflow outputs と artifacts の path 表記を Phase 1〜13 で揃える。

## Before / After

| 領域 | Before | After |
| --- | --- | --- |
| 検索 query 型 | route ごとに inline で zod を書く | `packages/shared/src/admin/search.ts` で `AdminMemberSearchZ` / `AdminMemberSearch` / `ADMIN_SEARCH_LIMITS` に集約 |
| URL 組立 | apps/web で手書き `URLSearchParams` | `toAdminApiQuery(search)` を共有 |
| audit writer | handler 内で `INSERT INTO audit_log` を直書き | `apps/api/src/lib/audit.ts` の `auditAppend(actor, target, action, before, after)` を使用 |
| require-admin | 各 route で都度 `if (role !== 'admin')` | middleware 1 箇所（既存維持） |
| apps/web fetch | route ごとに `fetch(...)` 生 | `apps/web/src/lib/fetch/admin.ts` の `fetchAdminMembers(search)` |
| endpoint path | `/api/admin/members/:id/delete` 等の混在 | `POST /api/admin/members/:memberId/delete` / `POST /api/admin/members/:memberId/restore` に統一 |
| 命名 | `removeMember` / `disableMember` | `softDeleteMember` / `restoreMember`（07-edit-delete 準拠） |
| 検索 limit 定数 | route 内 magic number | `ADMIN_SEARCH_LIMITS = { Q_LIMIT, TAG_LIMIT, PAGE_SIZE }` |

## packages/shared 抽出条件

以下を満たすものを `packages/shared` に置く:

1. apps/api と apps/web の両方が import する
2. ランタイム依存（D1 / fetch / cookies）を持たない pure な型・スキーマ・helper
3. 11 / 07 / 12 の正本仕様の語彙に整合する

該当: `AdminMemberSearchZ` / `AdminMemberSearch` / `ADMIN_SEARCH_LIMITS` / `toAdminApiQuery` / `AdminMemberListView`

## apps/api/src/lib への局所化

ランタイム依存を持つもの（D1 binding を引数に取る）は `apps/api/src/lib` に置く:

- `audit.ts`: `auditAppend(db, { actor, target, action, before, after })`
- `members-query.ts`: `buildAdminMembersQuery(search): { sql, bindings, countSql, countBindings }`

## 入出力・副作用

- 入力: Phase 7 AC マトリクス、既存コード
- 出力: 抽出方針表、抽出ファイルリスト
- 副作用: 仕様書段階のため実装は行わない（Phase 5 で実装）

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run packages/shared
```

## DoD

- [ ] Before / After 表が 8 行揃っている
- [ ] shared 抽出条件 3 条件すべてを満たす対象だけが packages/shared に入る
- [ ] 命名が 07-edit-delete / 12-search-tags の語彙と一致

## 参照資料

- `docs/00-getting-started-manual/specs/11-admin-management.md`
- `docs/00-getting-started-manual/specs/07-edit-delete.md`
- `docs/00-getting-started-manual/specs/12-search-tags.md`
- `packages/shared/src/`

## 統合テスト連携

- 上流: Phase 7 AC マトリクス
- 下流: Phase 9 品質保証

## 多角的チェック観点

- #5 apps/web D1 直参照禁止（fetch helper 経由）
- #13 audit 書込みが 1 箇所に集約される
- 命名が 07-edit-delete / 12-search-tags の語彙と一致

## サブタスク管理

- [ ] Before/After 表を確定する
- [ ] shared 抽出条件を確定する
- [ ] outputs/phase-08/main.md を作成する

## 成果物

- `outputs/phase-08/main.md`

## 完了条件

- [ ] 命名・path・endpoint が正本仕様の語彙に統一される
- [ ] 重複が packages/shared または `apps/api/src/lib` に集約される

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装・deploy・commit・push・PR を行っていない
- [ ] CONST_005 必須項目が網羅されている

## 次 Phase への引き渡し

Phase 9 へ、Before/After と shared 抽出条件を渡す。

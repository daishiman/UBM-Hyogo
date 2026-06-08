# Phase 1: 要件定義

`[実装区分: 実装仕様書]` / implementation_mode: `new` / 視覚証跡: `VISUAL` / status: `implemented_local_evidence_captured`

## 1.1 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No（apps/web に reactivate/physical/referenceCount = 0 hit） | 通常の新規実装 Phase とする |
| upstream（dev/main）にマージ済み | No（API のみ #1070 で land・UI は仕様作成前の調査時点で未配置） | 本 workflow で実装済み |
| 前提タスク（依存タスク）が完了済み | Yes（#1070 API contract land 済み・#1035 logical delete API land 済み） | API 依存は解決済み・本タスクは UI 消費層のみ |

→ `implementation_mode: "new"`。Phase 4 = 新規 component / pure helper の test 設計、Phase 5 = 新規 UI 実装。

## 1.2 タスク分類

- **UI task（VISUAL）**: admin 管理画面を新規構築した。runtime/staging screenshot は user-gated とし、local primary evidence は focused Vitest と typecheck で取得した。
- 本サイクルは `implemented_local_evidence_captured`。`screenshot-plan.json` 相当の runtime visual 計画は Phase 11 に残し、実画像は承認後に取得する。

## 1.3 真の論点（要件レビュー思考法）

1. **真の論点**: 「3 つの lifecycle ボタンをどこに足すか」ではなく「**lifecycle 操作を載せる tag master catalog 画面が apps/web に存在しない**」こと。issue の前提（既存 UI への追加）が現コードと乖離している（index.md §1 参照）。
2. **依存関係・責務境界**: API（#1070 land 済み・状態所有権 = D1 / apps/api）は変更しない。UI（apps/web）は API を消費する別レイヤとして adapter（409 body → UI state）を持つ。Server Component（初期 list fetch）と Client Component（lifecycle state machine）の境界を明確にする。
3. **価値とコストの不均衡**: 最大価値 = 管理者が画面上で tag master を一覧し棚卸し（reactivate/論理削除/physical delete）できること。最大コスト部品 = physical delete（不可逆）の誤操作防止 UX と 409 referenceCount adapter。ここに設計の重心を置く。
4. **改善優先順位**: (a) catalog 一覧の土台 → (b) 3 操作の視覚的・文言的区別 → (c) physical delete 不可逆確認 → (d) 409 referenceCount 表示 → (e) 404/冪等 state。
5. **4 条件**: 価値性=管理者の棚卸しコストを下げる / 実現性=既存 API + 既存足場で 1 サイクル実装可 / 整合性=API 不変・D1 直アクセス禁止維持 / 運用性=design-token gate・component test で回帰保護。

## 1.4 因果ループ

- 強化ループ: catalog 画面で tag を可視化 → 不要 tag を physical delete → tag picker のノイズ減 → 付与作業が速くなる → tag 運用が回る。
- バランスループ: physical delete（不可逆）誤操作 → tag 消失 → 付与不能。→ ConfirmDialog（isDestructive）+ 409 referenceCount guard でバランス。

## 1.5 既存 API contract（不変・消費のみ）

`apps/api/src/routes/admin/tags.ts`（全 endpoint 確認済み）:

| endpoint | method | 成功 | 失敗 |
|----------|--------|------|------|
| `/admin/tags?q=&page=&pageSize=` | GET | 200 `{ total: number, items: [{ tagId, code, label, category, active }] }` | 400 `invalid_query` |
| `/admin/tags/:tagId/reactivate` | POST | 200 `{ tagId, code, label, category, active: true }`（冪等・既 active は no-op で 200 現 row） | 404 `{ ok:false, error:"tag_not_found" }` |
| `/admin/tags/:tagId` | DELETE | 204（active=1→0・論理削除・#1035） | 404 `tag_not_found` |
| `/admin/tags/:tagId/physical` | DELETE | 204（参照 0 のとき物理削除） | 409 `{ ok:false, error:"tag_has_references", referenceCount: number }` / 404 `tag_not_found` |

list item shape（`rowBody`）: `{ tagId: string, code: string, label: string, category: string, active: boolean }`。

## 1.6 命名規則の確認（既存コードベース整合）

- component: PascalCase `.tsx`（`TagQueuePanel` / `TagsQueueResolveDrawer` に倣い `TagCatalogPanel` / `TagCatalogRow`）。
- pure helper module: camelCase `.ts`（`tagCatalogLifecycle.ts`）。
- test: `*.component.spec.tsx` / `*.spec.ts`（`__tests__/` 配下・CLAUDE.md 不変条件 #8: `*.test.*` 禁止）。
- CSS class: `.admin-tag-catalog-*` + `[data-*]` 属性（既存 `.admin-tag-status-badge[data-status]` に倣う・globals.css）。
- mutation: `@/features/admin/hooks/useAdminMutation` 経由（CLAUDE.md 不変条件 #10・legacy `@/lib/useAdminMutation` 新規参照禁止）。
- form input: `FormField` 経由（CLAUDE.md 不変条件 #9・`apps/web/src/components/admin/` で直接 `<input>` を増やさない）。

## 1.7 carry-over 確認

- 直近コミット（`git log --oneline -5`）に tag catalog UI 関連の着手なし。本タスクは新規。
- 親 #1070（API）・#1035（logical delete API）・#1068（inline-create）は land 済み・本タスクと差分なし。

## 1.8 不変条件（UI prototype alignment / CLAUDE.md）

1. 既存 API のみ接続（新 endpoint 追加・D1 schema 変更禁止）。
2. OKLch トークン正本化（HEX 直書き / `bg-[#xxx]` 禁止・`verify-design-tokens` gate）。
3. プロトタイプ primitives 群で構成（新規 primitive を生やさない・`AdminPageHeader` / `ConfirmDialog` / `FormField` 等を再利用）。
4. D1 直接アクセス禁止（apps/web から D1 binding 禁止・API 経由のみ）。

## 1.9 完了条件（Phase 1）

- 要件・AC・API contract・命名規則・不変条件が固定された（本ファイル）。
- issue 陳腐化の最適化方針（新規 catalog 画面構築）が確定した。

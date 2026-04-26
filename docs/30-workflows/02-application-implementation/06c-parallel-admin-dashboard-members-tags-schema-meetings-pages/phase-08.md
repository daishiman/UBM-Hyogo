# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| Wave | 6 (parallel) |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

5 画面 + mutation 層で重複している型 / 命名 / path / endpoint を統一する。Before / After を提示し、Phase 5 runbook を更新する。

## 実行タスク

1. 重複箇所の検出（命名 / path / endpoint）
2. Before / After 表で統一案
3. 共通化対象の component / hook / type
4. 命名規則の確定（`patchMember*`, `postMember*`, `resolveTagQueue` 等）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/admin-implementation-runbook.md | 重複検出元 |
| 必須 | outputs/phase-07/ac-matrix.md | DRY 候補の優先度 |

## Before / After

| 区分 | Before | After | 理由 |
| --- | --- | --- | --- |
| 命名（mutation） | `updateMemberStatus`, `changeStatus`, `setStatus` | `patchMemberStatus` | RESTful な PATCH と統一 |
| 命名（fetch） | `getDashboard`, `loadDashboard` | `fetchAdminDashboard` | `fetchAdmin*` prefix で統一 |
| path（component） | `components/admin/MemberDrawer.tsx` と `components/MemberDrawer.tsx` 混在 | `components/admin/MemberDrawer.tsx` のみ | admin 配下に集約 |
| endpoint client 参照 | 各 page で `fetch('/admin/...')` 直叩き | `lib/admin/api.ts` 経由 | 単一 SoR |
| 型 | `AdminMember`, `MemberAdmin`, `AdminMemberDetail` 混在 | `AdminMemberListView` / `AdminMemberDetailView`（packages/shared） | 04-types.md 準拠 |
| Toast 文言 | 各 mutation で文字列直書き | `lib/admin/messages.ts` で定数化 | i18n / 保守性 |
| error 表示 | 各 component で if 分岐 | `<ApiErrorView />` 共通 component | DRY |
| auth redirect | 各 page で if (!session) | `app/admin/layout.tsx` で 1 箇所 | 集約済み |

## 共通化対象

| 種別 | path | 用途 |
| --- | --- | --- |
| hook | `lib/admin/useAdminMember.ts` | drawer 詳細 fetch |
| hook | `lib/admin/useTagQueue.ts` | queue panel |
| hook | `lib/admin/useSchemaDiff.ts` | schema panel |
| hook | `lib/admin/useMeetings.ts` | meetings panel |
| component | `components/admin/ApiErrorView.tsx` | 共通エラー表示 |
| util | `lib/admin/messages.ts` | Toast 定数 |
| util | `lib/admin/types.ts` | 型 re-export from `@ubm/shared` |

## 命名規則

| 対象 | 規則 |
| --- | --- |
| fetch 関数 | `fetchAdmin*`（GET） |
| mutation 関数 | `patch*`（PATCH） / `post*`（POST） / `delete*`（DELETE） |
| hook | `useAdmin*` |
| component | `Admin*` または `<Subject>Panel` / `<Subject>Drawer` |
| route | `/admin/<subject>`、複数形 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook の擬似コード命名を更新 |
| Phase 9 | typecheck / lint で命名統一を確認 |
| Phase 12 | system-spec-update-summary に命名規則を記録 |

## 多角的チェック観点

| 不変条件 | DRY での担保 | 確認 |
| --- | --- | --- |
| #5 | adminApi の単一エントリポイントで D1 import を遠ざける | grep |
| #11 | profile section component が単一（編集 prop なし） | grep |
| #12 | NotesSection の export 先が drawer のみ | grep |
| #13 | TagPicker は TagQueuePanel のみ import 可能 | ESLint rule |
| #14 | SchemaAliasForm は SchemaDiffPanel のみ import 可能 | ESLint rule |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | Before/After 表 | 8 | pending | 命名 / path / endpoint |
| 2 | 共通化対象 | 8 | pending | hook / component / util |
| 3 | 命名規則 | 8 | pending | prefix / suffix |
| 4 | runbook 更新 | 8 | pending | Phase 5 への反映 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | Before/After + 共通化 |
| メタ | artifacts.json | Phase 8 を completed |

## 完了条件

- [ ] Before/After 表が 8 行以上
- [ ] 共通化対象が 7 件以上
- [ ] 命名規則が確定
- [ ] runbook (Phase 5) への反映指示が記載

## タスク100%実行確認

- Before/After が完成
- 共通化対象に path 付き
- artifacts.json で phase 8 を completed

## 次 Phase

- 次: 9 (品質保証)
- 引き継ぎ: 命名統一を typecheck / lint で確認
- ブロック条件: 命名揺れが残っていれば差し戻し

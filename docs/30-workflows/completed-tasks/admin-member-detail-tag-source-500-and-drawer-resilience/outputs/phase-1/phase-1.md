# Phase 1: 要件定義

## メタ情報

| 項目 | 値 |
|------|------|
| taskId | `ADMIN-MEMBER-DETAIL-TAG-SOURCE-500-AND-DRAWER-RESILIENCE` |
| 実装区分 | **[実装区分: 実装仕様書]**（Lane A / Lane B とも） |
| taskType | `implementation` |
| visualEvidence | `VISUAL`（Lane B が drawer error UI を変更） |
| implementation_mode | `new`（既存ファイル編集 + 新規テスト） |
| workflow_state | `implemented_local_evidence_captured` |

## P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在する | No | 通常の実装 Phase とする（本ワークフローは仕様書作成のみ） |
| upstream（main/dev）にマージ済み | No（新規不具合） | 未マージとして扱う |
| 前提タスク（依存タスク）が完了済み | N/A | 独立した bugfix。依存なし |

起点ブランチ: `fix/admin-member-detail-500-and-drawer-resilience`（`origin/dev` 2644fcaf2 から分岐。`origin/main` を完全内包し 673 先行＝main/dev 同期不要）。

## 実装区分判定（CONST_004）

本タスクは「管理画面メンバー詳細を開くと 500 になる不具合を**改善（修正）する**」もの。目的達成にはコード変更（zod schema・shared 純関数・apps/api builder・apps/web UI）が**不可欠**であり、ドキュメント・調査・合意形成のみでは達成不可能。したがって **実装仕様書**（CONST_005 必須項目を全充足）として作成する。docs-only ではない。

- Lane A（`packages/shared` + `apps/api`）: NON_VISUAL（型・zod・builder の値正規化。自動テスト主証跡）
- Lane B（`apps/web`）: VISUAL（drawer error 分岐に再試行 UI を追加）

両 Lane とも CONST_005（変更対象ファイル一覧 / シグネチャ / 入出力・副作用 / テスト方針 / ローカル実行コマンド / DoD）を Phase 4-5 で充足する。

## 背景・現象

- staging `https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/members` で、メンバー一覧の行アクション（メンバー名ボタン / 編集アイコン）を押下し会員詳細ドロワーを開くと、`GET /api/admin/members/TEST-MEM-09` が **500 Internal Server Error**。
- ドロワーは「読み込み失敗: HTTP 500」のまま回復不能。
- DevTools コンソールに 500 ログと深い React 再帰スタック（`ik → ug → uh` 反復）が大量表示。
- ユーザー報告「（行アクションの）ボタンを複数化するとエラー」「押下するとエラー」。

## 根本原因（確定・実コード裏取り）

`_shared-context.md §1` を正本とする。要約:

- **真因 A（500 主因）**: `member_tags.source` は CHECK 制約なし（`0002_admin_managed.sql:46`）で任意文字列を許す。seed は `source='seed'`。view 層 `TagSourceZ`（`primitives.ts:29`）は 3 値固定で、`buildAdminMemberDetailView`（`builder.ts:429`）が source を含めて返すため `AdminMemberDetailViewZ.safeParse`（`members.ts:506`）が失敗し 508 で 500。一覧は `parseTagsJson` で source 不参照かつ fail-soft のため露出しない**非対称**。`buildMemberProfile`（`builder.ts:357`）にも同型キャストがあり会員マイページでも 500 になりうる。
- **真因 B（UI 回復不能）**: `MemberDrawer.tsx:41-57` は fetch 失敗時に `setError` のみ・再試行導線なし・依存 `[memberId]` のみ。`ug/uh` 反復は 1 回の 500 の深い React スタック表示で、無限ループではない（実コードで反証）。

## 要件

- R-1: 詳細 API `GET /api/admin/members/:id` を、`member_tags.source` がどんな文字列でも 500 にしない（fail-soft 正規化）。
- R-2: 会員マイページ（`buildMemberProfile` 経路）でも同 source 値で 500 にしない。
- R-3: `MemberDrawer` の fetch 失敗時にユーザーが再試行でき、成功時に詳細表示へ回復できる。
- R-4: 既存 API surface・レスポンス shape・D1 schema・seed・Form を変更しない。

## Acceptance Criteria

`index.md` / `_shared-context.md §5` の AC-1〜AC-7 を正本とする（重複記載を避ける）。

## Inventory（変更対象・新規）

| 種別 | パス | Lane |
|------|------|------|
| 編集 | `packages/shared/src/types/common.ts` | A |
| 編集 | `packages/shared/src/zod/primitives.ts` | A |
| 編集 | `apps/api/src/repository/_shared/builder.ts` | A |
| 編集 | `apps/web/src/features/admin/components/_members/MemberDrawer.tsx` | B |
| 新規テスト | `packages/shared/src/zod/viewmodel.spec.ts` | A |
| 新規テスト | `apps/api/src/repository/__tests__/builder.repository.spec.ts` | A |
| 新規テスト | `apps/web/src/features/admin/components/__tests__/MemberDrawer.spec.tsx` | B |

## 命名規則（既存コードベース分析）

- TS 関数: camelCase（`buildAdminMemberDetailView` / `parseTagsJson` / `fetchMemberTags`）。新規 `normalizeTagSource` は整合。
- zod schema: PascalCase + `Z` サフィックス（`TagSourceZ` / `MemberProfileZ` / `AdminMemberDetailViewZ`）。
- React component: PascalCase（`MemberDrawer` / `MemberTagsEditor`）。state は camelCase（`reloadKey`）。
- テストファイル: `*.spec.{ts,tsx}`（`*.test.*` 禁止＝不変条件 #8）。
- data-testid: kebab-case（既存 `tag-attach-retry` / `photo-upload-input` に倣い `member-detail-retry`）。

## carry-over 確認

`git log --oneline -5` 直近は bulk tag / Sentry noise filter / tag catalog 等で、本不具合（tag source 値ドメイン）とは独立。前タスク成果物の引き継ぎなし。

## 参照資料

- `docs/00-getting-started-manual/specs/01-api-schema.md`（HTTP status・admin member API）
- `docs/00-getting-started-manual/specs/11-admin-management.md`（`/admin/members` 一覧＋ドロワー）
- `apps/api/migrations/0002_admin_managed.sql` / `seed/test-accounts-seed.sql`（source 値ドメインの事実）
- `_shared-context.md`（設計確定事実の単一ソース）

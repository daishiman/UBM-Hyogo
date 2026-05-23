# Phase 1: 要件定義 (outputs)

> 仕様書: `../../phase-01.md` を正本とし、本ファイルは scope / DoD / inventory / 命名規則を要約する。

## スコープ

### in-scope
1. `apps/web/app/(admin)/layout.tsx` の確定（getSession guard + 2 カラム grid + AdminSidebar）
2. `/admin` SSR ページ（KPI / Zone / Status / RecentActions / SchemaAlert）
3. `/admin/members` SSR ページ（Filters / BulkActionBar / Table / Drawer）
4. `apps/web/src/lib/admin/{api,server-fetch,types}.ts` の admin client surface 維持・補強
5. vitest コンポーネントテスト 5 ファイル（KpiGrid / MembersFilters / MembersTable / RecentActionsTable / BulkActionBar）

### out-of-scope
- 新 admin endpoint 追加（`apps/api` 差分 0 行）
- D1 schema 変更
- virtual scroll 化（pageSize=50 固定）
- CSV export 実装（disabled + tooltip）
- task-17 audit 画面のフィルタ反映

### 未タスク化候補（CONST_007 例外）
1. `/admin/dashboard` API への `byZone` / `byStatus` 集計フィールド追加（本タスクは UI 側 optional + placeholder で吸収）
2. CSV export 実装（プロトタイプにあるが MVP 範囲外）

## DoD（G-01〜G-12）

| ID | 条件 |
|----|------|
| G-01 | `/admin` SSR 200、KPI 4 / Zone / Status / RecentActions 描画 |
| G-02 | `/admin/members` SSR 200、テーブル + フィルタ + bulk + drawer 動作 |
| G-03 | `(admin)/layout.tsx` AdminSidebar 8 nav + 2 カラム grid |
| G-04 | 既存 admin endpoint 6 操作 adapter 接続（新 endpoint なし） |
| G-05 | OKLch tokens のみ、HEX 直書き 0 件 |
| G-06 | jest-axe critical 0 件 |
| G-07 | sort / filter が client state で動作 |
| G-08 | bulk action（公開 / 非公開 / 論理削除）起動可能 |
| G-09 | drawer で会員詳細（identity / answers / audit / notes）確認 |
| G-10 | typecheck / lint / verify-design-tokens green |
| G-11 | `apps/api` 差分 0 行 |
| G-12 | 旧 `apps/web/src/components/admin/` 残骸 orphan 警告 0 |

## インベントリ確定

- 新規 20 ファイル / 修正 6 ファイル（phase-01.md §4 を正本）
- ディレクトリ命名: `apps/web/src/features/admin/components/{_layout,_dashboard,_members,__tests__}/`
- コンポーネントファイル: PascalCase.tsx
- テストファイル: `<Component>.test.tsx`

## 不変条件（Phase 5 実装時）
1. D1 直アクセス禁止（`fetchAdmin<T>()` または `/api/admin/*` proxy のみ）
2. OKLch tokens 専用（HEX 直書き禁止）
3. `responseEmail` は system field（form 項目として並べない）
4. 新 endpoint 追加禁止（`apps/api` no diff）
5. PII masked 表示
6. JST 表示（`Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo' })`）

## 完了
- [x] 前提確認: `apps/web/src/styles/tokens.css` (oklch 18 件) / UI primitives 22 ファイル揃済み
- [x] §4 インベントリ Phase 2 設計の input として確定
- [x] §6 命名規則 Phase 4 テスト命名の input として確定

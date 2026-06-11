# Phase 1: 要件定義

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 1 / 13
- 実装区分: `[実装区分: 実装仕様書]`（CONST_004）
- task_type: implementation / visual_category: VISUAL / implementation_mode: new
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)

## 目的

staging `/admin/members`（会員管理）が携帯（≤640px）でテーブルが横にはみ出し列が見切れる問題に対し、モバイルでカードレイアウト、デスクトップで現行テーブルを維持する実装の **scope / 受入条件 / inventory / 命名規則** を固定する。

## 実行タスク

### Step 0: P50 チェック（実装状態確認）

| 確認項目 | 結果 |
| -------- | ---- |
| current branch に実装が存在するか | **No**。`MembersTable.tsx` にレスポンシブクラス・`data-component`・`data-label` は未存在（`git grep` で確認済）。`globals.css` にカード化 `@media` ブロックなし → `implementation_mode: new` |
| upstream(main/dev) にマージ済みか | No。新規修正 |
| 前提タスク完了済みか | 依存なし（単独タスク）。既存 `_members/` 配下コンポーネント群は実装済で再利用 |

> 結論: 通常の新規実装。Phase 5 で TSX 属性追加 + CSS 追加 + テスト追加を行う。

### Step 1: inventory と source scope の固定

対象ファイル（SSOT §2 を正本）:

| # | パス | 種別 |
| - | ---- | ---- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集（属性追加のみ） |
| F2 | `apps/web/src/styles/globals.css` | 編集（`@media` 追加） |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 編集（TC追加） |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | 新規 |

現状アンカー（git 確認済 2026-06-10）: `MembersTable.tsx:80`（ラッパー `overflow-hidden`）/ `:81`（table）/ `:83-101`（thead 8列）/ `:104-108`（行 testid）/ `:109-183`（8 td）。`globals.css:2559-2576`（issue-276 mobile filterbar `@media (max-width:640px)` ＋ `data-component="member-filters"` パターン）。`globals.css` 総行 2608。

### Step 2: タスク分類の記録（Feedback 1 / Feedback 3 対応）

- タスク分類: **UI task（VISUAL）**。Renderer コンポーネント（`MembersTable.tsx`）の変更あり → Phase 11 は VISUAL（375/640/1280 screenshot）。
- docs-only ではない。

### Step 3: 既存コードの命名規則分析（FB-SDK-07-4 対応）

| 規約 | 既存例 | 本タスクで踏襲 |
| ---- | ------ | -------------- |
| `data-component`（kebab-case） | `member-filters`, `tag-picker`, `member-table` | `admin-members-table` |
| `data-role`（kebab-case） | `filters-summary-mobile`, `filters-body` | `table-head` |
| `data-testid`（kebab-case + id） | `admin-members-row-{memberId}`, `chip-dot`, `member-state-chip-row` | **不変**（追加しない） |
| CSS セレクタ | `[data-component="member-filters"] [data-role="..."]` | 同形式 |

> 新規属性は `data-component` / `data-role` / `data-label` / `data-cell`。既存 testid・aria-label は**追加も改名もしない**。

### Step 4: 受入条件の列挙（AC-1〜AC-9）

SSOT §5 を正本とする。本文に明示列挙:

- **AC-1**: 375/414/640px でカードレイアウト表示・横はみ出しゼロ。
- **AC-2**: モバイルカードにメール/区画ステータス/タグ/最終更新/公開が各ラベル付きで全可視。
- **AC-3**: モバイルで公開トグル・編集ボタンが画面内に収まり操作可能。
- **AC-4**: デスクトップ（≥641px）は現行テーブル・DOM・スタイル完全維持。
- **AC-5**: `MembersTable.tsx` は属性追加のみ。機械可読id・行/セル順序に変更なし。
- **AC-6**: `globals.css` 追加は OKLch トークン経由のみ。HEX/任意値カラー混入ゼロ。
- **AC-7**: 既存 TC-MT-01〜20 緑 + 追加 TC-MT-21〜24 緑。
- **AC-8**: `apps/api` / migration / Form 差分ゼロ。
- **AC-9**: typecheck / lint / 対象 vitest 緑。

### Step 5: 不変条件の固定（I-1〜I-8）

SSOT §4 を正本（API不変 / 機械可読id不変 / DOM順序不変 / トークン経由 / CSS breakpoint正本 / desktop維持 / D1直アクセス禁止継続 / 既存test不破壊）。

## 参照資料

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保すること。

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| UI/UX デザイントークン | `docs/00-getting-started-manual/specs/design-tokens.md` | OKLch トークン正本・HEX禁止 |
| プロジェクト不変条件 | `CLAUDE.md`（不変条件 #5, UI不変条件 #1-#4） | D1直アクセス禁止・OKLch正本・既存API surfaceのみ |
| SSOT | `outputs/shared-context.md` | 本タスク唯一の正本 |

## 実行手順

1. P50 チェックで実装状態を確認（上記 Step 0）。
2. inventory と命名規則を SSOT に固定（実施済）。
3. AC-1〜AC-9 / I-1〜I-8 を確定（実施済）。
4. Phase 1-3 完了まで Phase 4 に進まない gate を確認。

## 統合テスト連携

- Phase 4 で `MembersTable.spec.tsx` への追加 TC（TC-MT-21〜24）と Playwright F4 を設計。
- Phase 6 で fail path / 回帰ガードを拡充。

## 多角的チェック観点（AIが判断）

- システム系: 状態所有権はビューのみ（CSS）。state store 追加なし。責務境界＝表現層に閉じる。
- 戦略・価値系: 最小コスト（属性 + CSS）で携帯運用可能化。価値＝管理者がモバイルで会員操作可能に。
- 問題解決系: 真因は「レスポンシブCSS欠如」。配置や機能ではない。DOM二重化を避けることで testid 破壊リスクをゼロ化。

## サブタスク管理

| ID | 内容 | Phase |
| -- | ---- | ----- |
| ST-1 | MembersTable.tsx 属性追加 | 5 |
| ST-2 | globals.css カード化CSS | 5 |
| ST-3 | unit test 追加 | 4/6 |
| ST-4 | Playwright mobile smoke | 4/6 |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 要件定義書 | `outputs/phase-1/requirements-definition.md` |
| 受入基準 | `outputs/phase-1/acceptance-criteria.md` |
| スコープ定義 | `outputs/phase-1/scope-definition.md` |

## 完了条件

- [ ] P50 チェック完了・implementation_mode 確定（new）。
- [ ] AC-1〜AC-9 / I-1〜I-8 を SSOT・本文に列挙。
- [ ] 命名規則を既存規約と整合。
- [ ] タスク分類（UI task / VISUAL）を記録。

## タスク100%実行確認【必須】

- [x] inventory 固定
- [x] AC 列挙
- [x] 不変条件固定
- [x] 命名規則分析
- [x] タスク分類記録

## 次Phase

[phase-2-design.md](phase-2-design.md) — トポロジ・lane・CSS設計の確定。

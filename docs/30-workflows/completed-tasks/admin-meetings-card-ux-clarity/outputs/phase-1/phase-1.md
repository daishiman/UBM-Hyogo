# Phase 1: 要件定義

## メタ情報

| key | value |
|---|---|
| workflow_id | `admin-meetings-card-ux-clarity` |
| phase | 1 / 13 |
| created_at | 2026-06-10 |
| taskType | implementation |
| 実装区分 | `[実装区分: 実装仕様書]`（VISUAL UI task・CONST_004 デフォルト） |
| visualEvidence | VISUAL_ON_EXECUTION |
| implementation_mode | new |

## 目的

`/admin/meetings`（開催日管理）の視覚情報設計を改善し、開催日カードの分離・展開編集UIの階層・出席者一覧の可読性を直感的にする。前提・決定の正本は `../../shared-context.md`。

## Step 0: P50 チェック

| 確認項目 | 結果 | 対応 |
|---|---|---|
| current branch に実装が存在する | Yes（automation-30 改善で apps/web 実装済） | `implementation_mode: new` から `implemented_local_evidence_captured` へ昇格 |
| upstream（dev）にマージ済み | No | 未マージとして扱う |
| 前提タスク完了済み | Yes（`admin-meeting-bulk-attendance-select` #1185 merged。一括追加 UI は既に landed） | 依存解消不要。本タスクは視覚設計のみ |

`git log --oneline -5` 棚卸し: 直近 `38f114081 feat(admin): 開催日ドロワーの出席追加を複数会員同時選択→一括追加に是正 (#1185)`。本タスクは #1185 で入った `BulkAttendanceChecklist` を**機能変更せず**、視覚整形のみ行う差分であることを確認。

## 既存コード命名規則（記録）

- CSS クラス: **BEM + kebab-case**（`.admin-timeline__heading`, `.bulk-attendance__list`）。block は `admin-` / `bulk-` / `ui-` prefix。
- React component: PascalCase。props は `readonly`。
- design token: `--ubm-<category>-<name>`（`--ubm-color-*`, `--ubm-space-*`, `--ubm-radius-*`, `--ubm-shadow-*`, `--ubm-text-*`）。
- data-testid: kebab-case + `${sessionId}` suffix。
- → 新設クラスは既存規則に従い `admin-detail-section` / `admin-attendee-row`（block-element BEM, `admin-` prefix）とする。新規 token は追加しない（既存のみ）。

## スコープ

### 含む
1. 未定義 BEM クラス（`.admin-timeline*`, `.ui-card--flat`, `.admin-meeting-drawer`）の CSS 実体化（F1）。
2. 再利用可能な汎用詳細セクション/行 primitive（`.admin-detail-section*`, `.admin-attendee-list`, `.admin-attendee-row*`）の新設（F1）。
3. `MeetingAttendanceDrawer.tsx` の展開内 4 セクションの見出し付きサブカード化 + 出席者行 chrome（F2）。
4. `MeetingTimeline.tsx` の heading レイアウト軽微調整（F3）。
5. 上記の構造検証テスト追加（T1/T2）。

### 含まない（baseline / 未タスク）
- OOS-1: 他 admin 一覧画面への共通 primitive DOM 適用（別タスク・CONST_007 理由）。
- OOS-2: 色設計の見直し（ユーザー明示でスコープ外）。
- OOS-3: 右スライドドロワー化。
- OOS-4: 出席者チップ化。
- API / D1 / Google Form の変更（不変条件）。

## 受入条件（Acceptance Criteria）

- **AC-1**: 開催日カードが**影＋境界線または十分な余白**で互いに視覚分離され、「くっついている」状態が解消される（`.admin-timeline` gap 強化 + `.ui-card--flat` 境界線）。
- **AC-2**: カード見出し（開催日 / タイトル / 出席バッジ）が `.admin-timeline__heading` のレイアウト（整列・余白・hover/focus-visible）で読みやすく整列される。
- **AC-3**: 展開ドロワー内の「編集」「出席を追加」「出席者」が**見出し付きサブカード**（`.admin-detail-section`）として視覚的に分離され、各セクションの目的が一目で分かる。
- **AC-4**: 出席者一覧が**1人1行の行リスト**（`.admin-attendee-row`・行区切り・削除ボタン右寄せ）で可読化される。
- **AC-5**: 出席者セクション見出しに**人数 `(N名)`** が表示される。
- **AC-6**: 既存 `data-testid` / `aria-label` / `role` / `<select>` / `<button>` / `<input>` が全て保持され、既存 vitest 4 spec が全 PASS する。
- **AC-7**: 色・spacing・radius・shadow は全て `var(--ubm-*)` 経由。新規 HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件。`pnpm verify:tokens` green。
- **AC-8**: `apps/api` への変更が 0（`git diff dev -- apps/api` 空）。D1 schema / Google Form 不変。
- **AC-9**: `pnpm typecheck` / `pnpm lint` green。
- **AC-10**: 追加テスト（DR-1〜DR-3, TL-1）が PASS し、jsdom で視覚（px/色）を assert していない（構造検証のみ）。

## inventory（変更対象）

`shared-context.md §5` を参照（F1/F2/F3/T1/T2）。

## 参照資料

- `../../shared-context.md`（SSOT）
- `apps/web/src/styles/globals.css`（198-250 bulk-attendance / 594-660 ui-card / 1630-1649 badge）
- `apps/web/src/styles/tokens.css`（token 正本）
- `apps/web/src/features/admin/components/_meetings/*`（対象コンポーネント）
- CLAUDE.md「UI prototype alignment 不変条件」

## 実行手順

1. P50 チェック（完了）。
2. AC-1〜AC-10 を確定（完了）。
3. spec-extraction-map で owner / view / state を固定（`spec-extraction-map.md`）。
4. Phase 2 設計へ（gate: Phase 1-3 完了まで Phase 4 着手しない）。

## 統合テスト連携

- 既存 4 spec を回帰ベースラインとし、追加ケースは同一ファイルに append（T1/T2）。
- API contract spec（`meetings.contract.spec.ts` 等）は**変更しない**（API 不変の裏付け）。

## 多角的チェック観点（AIが判断）

- システム: state 所有権は `MeetingsClientShell`（不変）。view は Timeline/Drawer（CSS+wrapper のみ改修）。責務境界を越えない。
- 戦略・価値: 非エンジニア管理者の操作迷いを下げる（誰のどのコストを下げるか明確）。コスト最大部品＝globals.css の CSS 追加（低リスク）。
- 問題解決: 真の論点は「視覚階層の欠如」であり機能不足ではない。色は分離（OOS-2）。

## サブタスク管理

| ID | 内容 | Phase |
|---|---|---|
| F1 | globals.css CSS 実体化 + primitive 新設 | 5 |
| F2 | MeetingAttendanceDrawer.tsx 改修 | 5 |
| F3 | MeetingTimeline.tsx 改修 | 5 |
| T1/T2 | 構造検証テスト追加 | 4/6 |

## 成果物

- `outputs/phase-1/phase-1.md`（本ファイル）
- `outputs/phase-1/spec-extraction-map.md`

## 完了条件

- [x] P50 チェック記録
- [x] AC-1〜AC-10 番号付き定義
- [x] 命名規則記録
- [x] スコープ（含む/含まない）固定
- [x] spec-extraction-map 作成

## タスク100%実行確認【必須】

- [x] 要件定義の全項目を記述
- [x] 実装区分を明記（実装仕様書）
- [x] 未タスク候補を baseline として分離

## 次Phase

Phase 2（設計）。

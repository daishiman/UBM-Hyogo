# Phase 2: 設計

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 2 / 13
- 前提: [phase-1-requirements.md](phase-1-requirements.md) 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)

## 目的

モバイルカード化の **target topology / SubAgent lane / CSS設計 / 既存コンポーネント再利用判断 / validation matrix** を確定し、Phase 4 へ進める状態にする。

## 実行タスク

### Step 1: 既存コンポーネント再利用可否（FB-SDK-07-1 対応）

| 判断項目 | 結論 |
| -------- | ---- |
| 新規 React コンポーネントを作るか | **作らない**。`MembersTable.tsx` 単一を維持し、属性追加 + CSS のみで card 化 |
| 新規 primitive を生やすか | 生やさない（プロジェクト不変条件: 新規 primitive 禁止）。`Chip` / `Button` / `MemberPublishSwitch` / `MemberAvatar` を現状のまま流用 |
| state / hook を追加するか | 追加しない。breakpoint は CSS 正本（I-5） |

> 新規 UI 実装ゼロで card 化を達成。a11y・既存テスト・機械可読id を最大限保全する設計。

### Step 2: target topology（concern マップ）

concern 数 = 2（A: TSX 属性、B: CSS）。単一 `phase-2-design.md` に全記述（core テンプレ基準: 1〜2 concern は単一ファイル）。

| concern | 対象 | 変更内容 | state 所有権 |
| ------- | ---- | -------- | ------------ |
| A: マークアップ | `MembersTable.tsx`（F1） | ラッパーに `data-component`、`<thead>` に `data-role`、各 `<td>` に `data-label`/`data-cell`。`overflow-hidden`→`overflow-x-auto` | なし（純表現） |
| B: スタイル | `globals.css`（F2） | `@media (max-width:640px)` の card 化セレクタ群。token のみ | なし（CSS） |
| C: 検証 | `MembersTable.spec.tsx`（F3）/ Playwright（F4） | 属性存在検証 + mobile visual | なし |

### Step 3: SubAgent lane 設計（≤3 並列）

| lane | 担当 | 依存 |
| ---- | ---- | ---- |
| Lane A | F1 MembersTable.tsx 属性追加 | SSOT §3.2 |
| Lane B | F2 globals.css card 化CSS | SSOT §3.3・Lane A の属性名と整合 |
| Lane C | F3/F4 テスト | Lane A/B 完了後（直列締め） |

> 本仕様書作成では Phase 4-13 を 3 並列 SubAgent で執筆。実装プロンプト（03.実装.md）側では Lane A→B→C の順で実装し、C を validation lane として直列で締める。

### Step 4: CSS 設計詳細（card 化）

SSOT §3.3 の雛型を正本とする。設計上の確定事項:

1. **DOM 単一性**: テーブル/カードの DOM 二重描画はしない。`<table>` を `display:block` 化して card 見た目へ変換 → `data-testid` 重複ゼロ（I-2/I-3）。
2. **thead の扱い**: card 時は視覚的に隠す（`position:absolute; clip`）。DOM からは消さない（a11y role 保持 + jsdom テスト維持）。
3. **td → ラベル**: `td[data-label]::before { content: attr(data-label); }` でカード内に「項目名: 値」を表示。
4. **ラベルなしセル**: チェック（`data-cell="select"`）/ メンバー（`data-cell="member"`）/ 操作（`data-cell="actions"`）は `::before` を出さず、レイアウト専用に flex 配置。
5. **token のみ**: `--ubm-color-*` / `--ubm-space-*` / `--ubm-radius-*` / `--ubm-text-*`。HEX/任意値カラー禁止（I-4）。実トークン名は実装時に `tokens.css`/`globals.css` で実在確認。
6. **@layer ネスト整合**: 既存 issue-276 ブロックと同一 `@layer` ネスト深さに配置（`globals.css:2576` 直後）。
7. **desktop 不変**: `@media (max-width:640px)` の内側のみ変更。≥641px は 1 byte も影響しない（I-6）。

### Step 5: UI コンポーネントテスト設計時の Props vs internal state 確認（VSCPKR-03 対応）

- `MembersTable` は **props のみ**で駆動（internal state なし、breakpoint も CSS）。Phase 4 のテスト操作対象は「レンダリング結果の DOM 属性」であり internal state ではない。
- カード/テーブル切替は CSS media query のため jsdom unit test では検証不能 → 属性存在検証（TC-MT-21〜24）と Playwright（実ブラウザ）で役割分担する。

## 参照資料

| 参照資料 | パス | 内容 |
| -------- | ---- | ---- |
| 要件定義 | `phase-1-requirements.md` | AC / I / inventory |
| SSOT | `outputs/shared-context.md` | 対象ファイル・CSS雛型・命名 |
| 既存パターン | `apps/web/src/styles/globals.css:2559-2576` | issue-276 mobile filterbar `@media` + data-component |

## 実行手順

1. 再利用可否を確定（新規コンポーネント/primitive/state を作らない）。
2. concern A/B/C と lane を固定。
3. CSS 設計詳細（DOM単一・thead隠し・data-label・token・layer整合・desktop不変）を確定。
4. validation matrix（Phase 4 へ引き継ぎ）を定義。

## 統合テスト連携

- validation matrix:

| command | 目的 | Phase |
| ------- | ---- | ----- |
| `vitest run MembersTable.spec.tsx` | 属性検証 + 既存回帰 | 4/6/9 |
| `playwright test admin-members-mobile` | mobile visual | 6/11 |
| `verify-design-tokens` 相当 | HEX混入ゼロ | 9 |
| `git diff dev...HEAD -- apps/api` | API非接触 | 9/10 |

## 多角的チェック観点（AIが判断）

- 依存関係: Lane B の CSS セレクタは Lane A の属性名（`admin-members-table` / `table-head` / `data-label`）に依存 → SSOT で名前を固定し drift 防止。
- トレードオフ: 横スクロール案より実装コスト高だが、携帯での見切れゼロ・操作性で勝る（AskUser Q1 カード化採用）。
- 責務境界: 表現層に完結。API/state を一切触らない。

## サブタスク管理

| ID | 内容 | lane |
| -- | ---- | ---- |
| ST-A | data-component/role/label/cell 付与 | A |
| ST-B | @media card CSS | B |
| ST-C | test/playwright | C |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| アーキテクチャ設計 | `outputs/phase-2/architecture-design.md` |
| CSS/マークアップ仕様 | `outputs/phase-2/markup-css-spec.md` |

## 完了条件

- [ ] 再利用可否確定（新規コンポーネント/primitive/state なし）。
- [ ] concern A/B/C・lane 確定。
- [ ] CSS card 化設計詳細確定（DOM単一・thead隠し・data-label・token・layer整合）。
- [ ] validation matrix 定義。

## タスク100%実行確認【必須】

- [x] 再利用可否
- [x] topology / lane
- [x] CSS 設計詳細
- [x] validation matrix

## 次Phase

[phase-3-design-review.md](phase-3-design-review.md) — Phase 4 進行可否判定。

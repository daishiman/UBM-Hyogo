# Phase 3: 設計レビュー

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 3 / 13
- 前提: [phase-2-design.md](phase-2-design.md) 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)

## 目的

Phase 2 設計が Phase 4 へ進める品質かを判定する。PASS / MINOR / MAJOR と戻り先、Phase 4 開始条件・Phase 13 blocked 条件を明示する。

## 実行タスク

### Step 1: 設計レビュー判定

| 観点 | 判定 | 根拠 |
| ---- | ---- | ---- |
| DOM 二重化回避（testid 重複防止） | PASS | 単一 `<table>` を CSS で card 化。`data-testid` 不変（I-2/I-3） |
| 機械可読id 保全 | PASS | 属性追加のみ。aria-label / testid 逐語不変 |
| a11y（axe） | PASS | jsdom は `@media` 非適用 → 既存 axe TC-MT-18〜20 緑維持。thead を DOM 残置し table role 保持 |
| OKLch トークン正本 | PASS | CSS は token のみ（I-4）。実トークン名は実装時に実在確認 |
| desktop リグレッション | PASS | `@media (max-width:640px)` 内のみ変更（I-6） |
| breakpoint 正本 | PASS | CSS 正本。JS/matchMedia 分岐なし（I-5） |
| API 非接触 | PASS | `apps/web` 表現層のみ。endpoint/D1/Form 不変（I-1） |

総合判定: **PASS** → Phase 4 進行可。

### Step 2: simpler alternative 検討記録

| 案 | 評価 | 不採用理由 |
| -- | ---- | ---------- |
| A: 横スクロール（overflow-x-auto + min-width のみ） | 実装最小 | 列が画面外に隠れ操作性が劣る。AskUser Q1 で「カード化」採用 |
| B: DOM 二重描画（テーブル + カードリスト） | 直感的 | `data-testid` 重複・Playwright selector 破壊リスク。**不採用** |
| C（採用）: CSS responsive table→card（単一DOM） | バランス最良 | testid 完全保全 + jsdom test 維持 + token のみ |

> `overflow-x-auto` は card 化と併用（≥641px の横はみ出し保険、≤640px では block 化で無影響）。これは A の良い部分を C に温存したもの。

### Step 3: MINOR 追跡テーブル

| MINOR ID | 指摘内容 | 解決予定Phase | 解決確認Phase | 備考 |
| -------- | -------- | ------------- | ------------- | ---- |
| TECH-M-01 | 実トークン名（`--ubm-space-*` 等）の実在は実装時確認に委ねている | Phase 5 | Phase 9 | `tokens.css`/`globals.css` で grep 確認 |
| TECH-M-02 | Playwright 起動不可環境では F4 を CAPTURE_BLOCKED 扱い | Phase 11 | Phase 11 | unit + 手動 screenshot 代替（ダミーPNG禁止） |

> MINOR はいずれも MAJOR ではない（設計変更不要）。Phase 4 進行を妨げない。

### Step 4: Phase 4 開始条件 / Phase 13 blocked 条件

- **Phase 4 開始条件**: Phase 1-3 完了（本レビュー PASS）。SSOT 確定済。
- **Phase 13 blocked 条件**: commit / push / PR はユーザー明示承認後のみ（CONST_002）。

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| 設計 | `phase-2-design.md` |
| 要件定義 | `phase-1-requirements.md` |
| SSOT | `outputs/shared-context.md` |

## 実行手順

1. 7 観点でレビュー判定（全 PASS）。
2. simpler alternative を記録。
3. MINOR 追跡テーブルを起票。
4. Phase 4 開始 / Phase 13 blocked 条件を明示。

## 統合テスト連携

- MINOR TECH-M-01/02 は Phase 9/11 で解決確認する。

## 多角的チェック観点（AIが判断）

- 真の論点: 「携帯で会員操作不能」を最小コストで解消。配置や機能でなく CSS 欠如が主問題。
- 4条件: 価値性（携帯運用可）/ 実現性（属性+CSSで1サイクル）/ 整合性（testid・desktop不変）/ 運用性（既存test緑・token gate）全て充足。

## サブタスク管理

| ID | 内容 | status |
| -- | ---- | ------ |
| RV-1 | 7観点レビュー | done |
| RV-2 | alternative記録 | done |
| RV-3 | MINOR起票 | done |

## 成果物

| 成果物 | パス |
| ------ | ---- |
| 設計レビュー結果 | `outputs/phase-3/design-review-result.md` |
| ゲート判定 | `outputs/phase-3/gate-decision.md` |

## 完了条件

- [ ] 7観点 PASS。
- [ ] simpler alternative 記録。
- [ ] MINOR 追跡テーブル起票。
- [ ] Phase 4 開始 / Phase 13 blocked 条件明示。

## タスク100%実行確認【必須】

- [x] レビュー判定 PASS
- [x] alternative 検討
- [x] MINOR 起票
- [x] gate 条件明示

## 次Phase

[phase-4-test-plan.md](phase-4-test-plan.md) — テスト計画。

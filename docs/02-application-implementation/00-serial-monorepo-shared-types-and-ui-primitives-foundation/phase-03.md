# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | monorepo-shared-types-and-ui-primitives-foundation |
| Wave | 0 |
| 実行種別 | serial |
| Phase 番号 | 3 / 13 |
| 作成日 | 2026-04-26 |
| 上流 Phase | 2 (設計) |
| 下流 Phase | 4 (テスト戦略) |
| 状態 | pending |

## 目的

Phase 2 の設計を simpler alternative と比較し、PASS / MINOR / MAJOR を判定する。「もっと統合 / 分解できないか」「漏れはないか」を 3 つ以上の代替案で検証し、scaffold 開始 GO 判定の根拠を残す。

## 実行タスク

1. alternative 案 3 つ以上を列挙
2. それぞれを 4 条件（価値性 / 実現性 / 整合性 / 運用性）で評価
3. PASS / MINOR / MAJOR を判定
4. 採用案を確定し、漏れチェック表を埋める
5. outputs/phase-03/main.md を生成

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | レビュー対象 |
| 必須 | outputs/phase-02/monorepo-layout.md | layout 案 |
| 必須 | doc/02-application-implementation/_design/phase-3-review.md | 上位レビューフォーマット |
| 必須 | CLAUDE.md | スタック制約 |

## 実行手順

### ステップ 1: alternative 案の列挙
- 案 A: monorepo を 1 package に統合
- 案 B: UI primitives を別 package（packages/ui）化
- 案 C: 採用案（apps × 2 + packages × 2）

### ステップ 2: 4 条件評価表の作成

### ステップ 3: PASS / MINOR / MAJOR 判定

### ステップ 4: 漏れチェック
- 16-component-library.md の 15 種が全て scaffold される
- 04-types.md の 4 層が全て型定義される
- 不変条件 #1, #5, #6, #8 が設計に組み込まれている

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | 採用設計に対するテスト計画の入力 |
| Phase 10 | GO/NO-GO の根拠 |

## 多角的チェック観点（不変条件参照）

- **#1**: 案 A（1 package 統合）は型 4 層の物理境界が崩れて #1 を破る → reject 理由
- **#5**: 全案で apps/web → D1 import を ESLint で防御
- **#6**: 全案で `localStorage` 依存を primitives から除去
- **#8**: 同上

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | alternative 案 3 件列挙 | 3 | pending | A / B / C |
| 2 | 4 条件評価表 | 3 | pending | 各案 |
| 3 | PASS / MINOR / MAJOR 判定 | 3 | pending | 採用案を明示 |
| 4 | 漏れチェック | 3 | pending | 15 primitives + 4 型層 |
| 5 | outputs 作成 | 3 | pending | outputs/phase-03/main.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/main.md | レビュー結果（alternative + 判定 + 漏れ） |
| メタ | artifacts.json | Phase 3 を completed |

## 完了条件

- [ ] alternative 案 3 件以上が評価済み
- [ ] 採用案が明示され、reject 案の reject 理由が記録
- [ ] 漏れチェック表が 15 primitives + 4 型層 + 不変条件 #1/#5/#6/#8 を網羅
- [ ] 判定が PASS（または MINOR で blocker なし）

## タスク 100% 実行確認【必須】

- [ ] 全 5 サブタスク completed
- [ ] outputs/phase-03/main.md 配置済み
- [ ] 採用案決定
- [ ] artifacts.json 更新

## 次 Phase

- 次: Phase 4（テスト戦略）
- 引き継ぎ事項: 採用設計 → verify suite 設計対象
- ブロック条件: PASS 判定が出ていない

## Alternative 案の評価

### 案 A: monorepo を 1 package に統合

| 観点 | 評価 |
| --- | --- |
| 価値性 | NG: package 分離なしでは Wave 1〜9 の並列性が壊れる |
| 実現性 | OK |
| 整合性 | NG: 型 4 層の物理境界が崩れて不変条件 #1 を破る |
| 運用性 | NG: apps/web から apps/api / D1 を直接 import 可能になり #5 を破る |
| 判定 | **MAJOR**（reject） |

### 案 B: UI primitives を別 package（packages/ui）化

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK: primitives の再利用性が高まる |
| 実現性 | MINOR: build 設定が増える、Storybook 等を導入したくなる |
| 整合性 | OK |
| 運用性 | MINOR: 06a/b/c が import 経路を変えるだけで動く |
| 判定 | **MINOR**（reject 理由: 当面 apps/web 単一消費者なので過剰分離。将来必要になれば後続タスクで分離可） |

### 案 C: 採用案（apps × 2 + packages × 2）

| 観点 | 評価 |
| --- | --- |
| 価値性 | OK: Wave 1〜9 の並列性を担保 |
| 実現性 | OK: pnpm workspace 標準構成 |
| 整合性 | OK: 不変条件 #1/#5/#6/#8 を物理境界で防御 |
| 運用性 | OK: ESLint rule + dependency matrix で同期 |
| 判定 | **PASS**（採用） |

## 漏れチェック

| 観点 | 確認項目 | 状態 |
| --- | --- | --- |
| UI primitives | Chip / Avatar / Button / Switch / Segmented / Field / Input / Textarea / Select / Search / Drawer / Modal / Toast / KVList / LinkPills の 15 種が scaffold 対象 | OK |
| 型 4 層 | schema / response / identity / viewmodel の placeholder | OK |
| 不変条件 | #1, #5, #6, #8 が設計に組み込み済み | OK |
| script | typecheck / lint / test / dev | OK |
| build target | apps/web (@opennextjs/cloudflare) / apps/api (Workers) | OK |

## 最終判定

**GO**（PASS）。採用案 C で Phase 4 に進む。

# Phase 3 成果物: 設計レビュー

## Alternative 案の評価

### 案 A: monorepo を 1 package に統合

| 観点 | 評価 |
|------|------|
| 価値性 | NG: package 分離なしでは Wave 1〜9 の並列性が壊れる |
| 実現性 | OK |
| 整合性 | NG: 型 4 層の物理境界が崩れて不変条件 #1 を破る |
| 運用性 | NG: apps/web から D1 を直接 import 可能になり #5 を破る |
| **判定** | **MAJOR（reject）** |

### 案 B: UI primitives を別 package（packages/ui）化

| 観点 | 評価 |
|------|------|
| 価値性 | OK |
| 実現性 | MINOR: build 設定が増える |
| 整合性 | OK |
| 運用性 | MINOR: 06a/b/c の import 経路が変わるだけ |
| **判定** | **MINOR（reject: 当面 apps/web 単一消費者なので過剰分離）** |

### 案 C: 採用案（apps × 2 + packages × 2）

| 観点 | 評価 |
|------|------|
| 価値性 | OK: Wave 1〜9 の並列性を担保 |
| 実現性 | OK: pnpm workspace 標準構成 |
| 整合性 | OK: 不変条件 #1/#5/#6/#8 を物理境界で防御 |
| 運用性 | OK: ESLint rule + dependency matrix で同期 |
| **判定** | **PASS（採用）** |

## 漏れチェック

| 観点 | 確認項目 | 状態 |
|------|----------|------|
| UI primitives | 15 種が scaffold 対象 | OK |
| 型 4 層 | schema/response/identity/viewmodel の placeholder | OK |
| 不変条件 | #1, #5, #6, #8 が設計に組み込み済み | OK |
| script | typecheck/lint/test/dev | OK |
| build target | apps/web (@opennextjs/cloudflare) / apps/api (Workers) | OK |

## 最終判定

**GO（PASS）**。採用案 C で Phase 4 に進む。

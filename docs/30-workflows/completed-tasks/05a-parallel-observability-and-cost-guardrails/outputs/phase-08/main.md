# Phase 8: 設定 DRY 化 — 主成果物

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| 状態 | completed |
| 完了日 | 2026-04-26 |

## Before / After 比較

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| branch 記法 | develop 混在の可能性 | dev / main に統一 | branch strategy 優先 |
| runtime 記法 | "OpenNext 一体" 的表現 | Pages (web) / Workers (api) に分離 | architecture と整合 |
| data ownership | Sheets / D1 混線 | Sheets = input / D1 = canonical に統一 | source-of-truth 一意化 |
| 環境変数表現 | "secret" と "variable" が混在 | CF Secrets = runtime, GH Secrets = deploy に統一 | environment-variables.md 準拠 |
| 4条件の表現 | バラバラ | 価値性 / 実現性 / 整合性 / 運用性 に統一 | 全 Phase 共通 |

## 共通化パターン適用

| パターン | 適用箇所 | 状態 |
| --- | --- | --- |
| branch/env 表現 | phase-01〜07 の main.md | 統一済み |
| secret placement 表現 | observability-matrix.md, cost-guardrail-runbook.md | 統一済み |
| outputs 配置ルール | 全 Phase | 統一済み (outputs/phase-XX/main.md) |

## 削除対象確認

| 削除対象 | 確認結果 |
| --- | --- |
| legacy assumption (develop ブランチ等) | 使用なし |
| scope 外サービス先行導入 | 使用なし |
| 実値前提の secret 記述 | 使用なし — placeholder のみ |

## MINOR M-01 対処

M-01 (wording drift) → 全成果物で `dev` / `main` に統一。対処完了。

## downstream handoff

Phase 9 (品質保証) に以下を引き継ぐ:
- DRY 化完了の成果物一覧
- MINOR M-01 対処完了

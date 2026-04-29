# Phase 3 主成果物 — 設計レビュー

詳細は `../../phase-03.md` 参照。

## 代替案比較サマリ

| 案 | 概要 | 判定 |
| --- | --- | --- |
| A | 全 package 一律 80% | **PASS（採用）** |
| B | package 別差分閾値（80% / 65%） | MAJOR（不採用） |
| C | monorepo 集約 80% | MAJOR（不採用） |
| D | Codecov 単独依存 | MAJOR（不採用） |
| E | Turborepo 差分 cache | MINOR（将来移行、本タスクは `--changed` で代替） |
| F | 1 PR で全部 | MINOR（不採用、3 段階 PR を採用） |

## 着手可否ゲート: **PASS**

- 真の論点 5 リスク同時封じ: PASS
- 4 条件評価: PASS
- ユーザー決定との整合: PASS
- 不変条件 / branch 戦略整合: PASS
- 段取り安全性: PASS
- 監査性: PASS

## NO-GO 条件（3 重明記の 3 箇所目）

1. UT-GOV-004 が PR③ 時点で未完了 → contexts 未登録で再評価
2. baseline で 30% 以下 package 発生 → PR② を package×metric で細分化
3. vitest v8 が Cloudflare Workers で動作不可 → workspace + miniflare 再設計

## レビュー指摘

- R-1: Next.js page exclude の影響 → Phase 11 baseline で再評価、E2E 別タスク化
- R-2: jq バージョン依存 → Phase 5 で `jq --version` 確認ステップ
- R-3: `--changed` 漏れ → CI / 週次フル実行を必須化
- R-4: hard gate 化時の既存 PR block → PR③ merge 前 rebase + coverage 確認手順

## 次 Phase

Phase 4 テスト戦略へ。

---
phase: 3
title: タスク分解 — 13 workflow を 3 batch に分割
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 3: タスク分解

[実装区分: 実装仕様書]

## 1. batch 分割方針

13 workflow を「リスク・実 CI 実行頻度・依存」の 3 軸で 3 batch に分割し、1 PR 内で順番に commit する。
batch 順を遵守することで、軽量 verify 系で composite action 接続を確認 → 重要 deploy 系へ波及させる。

## 2. Batch 一覧

### Batch A: 軽量 verify 系（6 yaml）

低リスク・PR 上で頻繁に走るため、composite action 接続の最初の検証に最適。

| # | workflow | 特徴 |
|---|----------|------|
| 1 | `verify-gate-metadata.yml` | docs gate / PR run で必ず走る |
| 2 | `verify-indexes.yml` | docs gate |
| 3 | `validate-build.yml` | conditional step（`if:` 制御） |
| 4 | `verify-esbuild.yml` | arch verify |
| 5 | `verify-phase12-compliance.yml` | docs gate |
| 6 | `d1-migration-verify.yml` | bats install を含む |

### Batch B: monitoring / scheduled 系（4 yaml）

cron / workflow_dispatch 中心。PR 上で走らないので gh workflow run で別途検証する。

| # | workflow | 特徴 |
|---|----------|------|
| 7 | `cloudflare-alerts-drift.yml` | 2 job 構成 |
| 8 | `cloudflare-analytics-export.yml` | monthly cron |
| 9 | `lighthouse.yml` | Next.js build |
| 10 | `post-release-dashboard.yml` | dashboard generation |

### Batch C: deploy / backend-ci 系（2 yaml）

production / staging deploy に直結。最終 batch として隔離。

| # | workflow | 特徴 |
|---|----------|------|
| 11 | `backend-ci.yml` | 2 job + Cloudflare secret preflight |
| 13 | `web-cd.yml` | 2 job (staging/prod) + `mise exec --` prefix |

## 3. commit 方針

1 PR 内で batch ごとに 3 commit、または rollout 全体を 1 commit に集約する 2 つの案がある:

| 案 | メリット | デメリット | 採用 |
|----|----------|------------|------|
| A: 3 commit (batch A / B / C) | revert 粒度が細かい | PR diff が分散して見にくい | **不採用** |
| B: 1 commit に集約 | レビュー & revert がシンプル | 部分 rollback 不可 | **採用** |

> 全 13 yaml の変更内容は同質（setup ブロックの差し替えのみ）なので 1 commit が合理的。
> commit message は Phase 13 で定義する。

## 4. 実装順序（1 commit 内の編集順）

実装上の順序は batch A → B → C と同じだが、commit は 1 つに集約する。
編集中に動作確認したい場合は workflow_dispatch を持つ workflow（`cloudflare-alerts-drift`, `d1-migration-verify`, `web-cd` 等）で `gh workflow run` 単発実行が可能。

## 5. 並列タスクとの共有モジュール

該当なし（本タスクは単独 workflow）。

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 3 | batch 分割と commit 戦略を確定 |
| 5 | batch 順で diff snippet を提示 |
| 11 | PR run の workflow ごとに run URL を取得 |

## 完了条件

- [ ] 13 yaml が 3 batch に分割されている
- [ ] commit 戦略（1 commit 集約）が決定されている
- [ ] 編集順序が明記されている

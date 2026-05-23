---
phase: 6
title: テスト方針 — 3 段検証（syntax / dispatch / PR run）
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 6: テスト方針

[実装区分: 実装仕様書]

## 1. テスト戦略の制約

`act` によるローカル CI 実行は composite action 経由 cache を完全に再現できず、また `web-cd.yml` のような OIDC 認証を伴う step は実行できない。
従って **GitHub Actions の実 CI 実行を正本** とし、3 段階で検証する。

## 2. 3 段検証

### Step 1: yaml syntax 検証（ローカル / pre-push）

| 検証手段 | コマンド | 期待 |
|----------|----------|------|
| `gh workflow view` で parse 確認 | `gh workflow view <name>` × 13 | 構文エラー 0 |
| `actionlint`（任意） | `actionlint .github/workflows/*.yml` | shell expression / job ref の error 0 |
| `yamllint`（任意） | `yamllint .github/workflows/` | indent / syntax error 0 |

### Step 2: workflow_dispatch trigger 検証（手動）

workflow_dispatch を持つ workflow は PR を出す前に手動 trigger で接続確認できる。

| workflow | dispatch 可能か | 検証コマンド |
|----------|------------------|--------------|
| `verify-gate-metadata.yml` | 不可（PR/push のみ） | PR run に委ねる |
| `verify-indexes.yml` | 不可 | PR run に委ねる |
| `web-cd.yml` | 可（workflow_dispatch あり） | `gh workflow run web-cd.yml --ref <branch>` |
| `validate-build.yml` | PR トリガー中心 | PR run に委ねる |
| `d1-migration-verify.yml` | 可 | `gh workflow run d1-migration-verify.yml --ref <branch>` |
| `verify-esbuild.yml` | PR トリガー中心 | PR run に委ねる |
| `cloudflare-alerts-drift.yml` | 可 | `gh workflow run cloudflare-alerts-drift.yml --ref <branch>` |
| `backend-ci.yml` | PR/push 中心 | PR run に委ねる |
| `cloudflare-analytics-export.yml` | 可（cron 主） | `gh workflow run cloudflare-analytics-export.yml --ref <branch>` |
| `lighthouse.yml` | 可 | `gh workflow run lighthouse.yml --ref <branch>` |
| `post-release-dashboard.yml` | 可 | `gh workflow run post-release-dashboard.yml --ref <branch>` |
| `verify-phase12-compliance.yml` | PR トリガー中心 | PR run に委ねる |

> 実 trigger 可否は yaml 内の `on:` セクションを実装時に再確認する。

### Step 3: PR run（最終正本）

PR を `dev` に向けて作成すると、Batch A の docs gate 系（`verify-gate-metadata`, `verify-indexes`, `verify-phase12-compliance` 等）が必ず走る。
Batch B / C の workflow は `on:` の trigger 条件次第で PR run に乗らないため、Step 2 の手動 dispatch と組み合わせる。

## 3. PR run で検証する gate

| gate | 期待 |
|------|------|
| `verify-gate-metadata` | success |
| `verify-indexes` | success |
| `verify-phase12-compliance` | success |
| `validate-build` | success |
| `verify-esbuild` | success |
| `backend-ci` | success |
| `d1-migration-verify` | success（migration 変更がある時のみ） |
| `pr-build-test`（既存移行済） | success（regression 確認） |
| `e2e-tests`（既存移行済） | success（regression 確認） |
| `ci`（既存移行済） | success（regression 確認） |

## 4. 失敗パターンと切り分け

| 症状 | 想定原因 | 対応 |
|------|----------|------|
| `Error: Unable to resolve action ./.github/actions/setup-project` | composite action path 誤記 | `uses:` を `./.github/actions/setup-project` に統一 |
| pnpm not found | composite action 経由 install が走っていない | `install: 'true'` を確認 |
| `Cannot find module 'next'` 等 | install が二重実行 or skip | workflow 側の install step を削除する |
| cache miss で install が遅い | node-version cache key が変わった | 1 回目のみ正常。2 回目以降は hit する |

## 5. テストコード追加の有無

本タスクは yaml 差分のみ。`*.spec.ts` は追加しない。

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 6 | 3 段検証を本 Phase で確定 |
| 11 | PR run の URL を ci-run-urls.md に集約 |

## 完了条件

- [ ] Step 1〜3 の検証手順が明記されている
- [ ] PR run で確認する gate 一覧が §3 に示されている
- [ ] 失敗パターンの切り分けが §4 に示されている

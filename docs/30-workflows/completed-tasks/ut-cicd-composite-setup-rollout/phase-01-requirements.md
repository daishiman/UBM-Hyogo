---
phase: 1
title: 要件定義 — Issue #284 受入条件再定義（5 yaml → 13 yaml）
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 1: 要件定義

[実装区分: 実装仕様書]

## 1. Issue #284 元仕様との差分（最重要）

| 観点 | Issue #284 本文（起票時） | 現状（2026-05-22 時点） | 本仕様書の採用 |
|------|----------------------------|--------------------------|----------------|
| 対象 workflow 数 | 5 yaml | raw setup action は 13 workflow に残存（Issue 記載の 12 + `ci.yml` coverage shard） | **13 workflow を一括 rollout** |
| composite action 名 | `setup-node-pnpm`（新規作成想定） | `.github/actions/setup-project/` が既に存在（mise strategy 対応） | **既存 `setup-project` を使用、新規作成しない** |
| Node 版 | 24.15.0 | 同左（action default） | 既存 default を継承 |
| pnpm 版 | 10.33.2 | 同左（action default） | 既存 default を継承 |

> Issue 本文は古い前提のまま OPEN しているが、AC-1/2/3 の本質「raw setup-node 直書きを composite action で DRY 化する」は不変。本仕様書は全 raw setup action をゼロにするため、検出された `ci.yml` coverage shard も同一スコープへ含める。

## 2. 受入条件（AC, 再定義版）

| ID | 条件 | 検証コマンド |
|----|------|--------------|
| AC-1 | 13 対象 workflow すべてに `uses: ./.github/actions/setup-project` step が含まれる | `grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml \| wc -l` ≥ `18`（既存 6 + 新規 13） |
| AC-2 | `.github/workflows/` 配下に raw `uses: actions/setup-node` が残らない（composite action 内部参照を除く） | `grep -l 'uses: actions/setup-node' .github/workflows/*.yml \| wc -l` = `0` |
| AC-3 | `.github/workflows/` 配下に raw `uses: pnpm/action-setup` が残らない | `grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml \| wc -l` = `0` |
| AC-4 | 13 workflow すべてが PR run で green | `gh pr checks <PR_NUMBER>` で全件 success |
| AC-5 | 既存 6 移行済み workflow に regression が出ない | `gh pr checks <PR_NUMBER>` で全件 success |

## 3. 対象 workflow 一覧（13 yaml）

| # | workflow | 現行 node-version | install 経路 | 備考 |
|---|----------|--------------------|--------------|------|
| 1 | `verify-gate-metadata.yml` | `24.15.0` | `pnpm install --frozen-lockfile` | actionlint も使う |
| 2 | `verify-indexes.yml` | `'24'` | `pnpm install --frozen-lockfile` | indexes rebuild |
| 3 | `web-cd.yml` | `'24'` × 2 job (staging/prod) | `mise exec -- pnpm install --frozen-lockfile` | deploy 系・要慎重 |
| 4 | `validate-build.yml` | `'24'` | `pnpm install --frozen-lockfile` | conditional step |
| 5 | `d1-migration-verify.yml` | `24` | `pnpm install --frozen-lockfile` | bats も使う |
| 6 | `verify-esbuild.yml` | `24.15.0` | `pnpm install --frozen-lockfile` | arch verify |
| 7 | `cloudflare-alerts-drift.yml` | `"24.15.0"` × 2 job | `pnpm install --frozen-lockfile` | drift diff |
| 8 | `backend-ci.yml` | `'24'` × 2 job | `pnpm install --frozen-lockfile` | preflight secret check |
| 9 | `cloudflare-analytics-export.yml` | `"24.15.0"` | `pnpm install --frozen-lockfile` | monthly cron |
| 10 | `lighthouse.yml` | `24.15.0` | `pnpm install --frozen-lockfile` | Next.js build |
| 11 | `post-release-dashboard.yml` | `'24'` | install なし | dashboard generation。`install: 'false'` + `cache: ''` で挙動保持 |
| 12 | `verify-phase12-compliance.yml` | `'24'` | `pnpm install --frozen-lockfile` | docs gate |
| 13 | `ci.yml` | `'24'` | `pnpm install --frozen-lockfile` | coverage-gate-shard の残存 raw setup を同一 wave で解消 |

> `web-cd.yml` は build step が引き続き `mise exec` を使うため、`setup-project` は `setup-strategy: mise` で呼び出す。`post-release-dashboard.yml` は元の install なし挙動を維持する。

## 4. 非機能要件

- **副作用最小**: workflow yaml と本仕様書・Phase evidence のみ変更。アプリコード・migration ファイルへの変更を含めない
- **rollback 可能**: 1 commit で 13 yaml をまとめて変更し、revert 1 回で全戻し可能
- **cache 互換**: composite action は `cache: pnpm` を default 採用しているため、既存 cache key が継続利用される

## 5. スコープ外

- composite action `setup-project/action.yml` 自体の変更
- composite action 既存呼び出しの再調整（ただし `ci.yml` coverage shard の残存 raw setup は本タスクで解消）
- Node setup だけの workflow への mise strategy 切替
- Node / pnpm のバージョン bump

## 6. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 1 | AC-1〜5 を要件として固定 |
| 5 | 13 workflow 差し替え時に diff snippet を作成 |
| 6 | gh workflow view で syntax 確認 |
| 11 | PR run の green を CI run URL evidence で保存 |

## 完了条件

- [ ] Issue #284 と現状の差分が表 1 に明記されている
- [ ] AC-1〜5 が表 2 に明記されている
- [ ] 13 対象 workflow が表 3 に列挙されている

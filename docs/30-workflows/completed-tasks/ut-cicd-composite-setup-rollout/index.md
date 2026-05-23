---
workflow_id: ut-cicd-composite-setup-rollout
title: UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP — composite action rollout to remaining 13 workflows
status: runtime_pending
issue: https://github.com/daishiman/UBM-Hyogo/issues/284
created_at: 2026-05-22
---

# ut-cicd-composite-setup-rollout - タスク実行仕様書

[実装区分: 実装仕様書]

## ユーザーからの元の指示

GitHub Issue #284 (`UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP`) を完遂するため、
`.github/workflows/` 配下に残る raw `actions/setup-node@v4` + `pnpm/action-setup@v4`
直書きの 13 workflow を、既存 composite action `.github/actions/setup-project/`
に rollout する実装仕様書を Phase 1〜13 で作成する。

## メタ情報

| 項目         | 内容 |
| ------------ | ---- |
| タスクID     | ut-cicd-composite-setup-rollout |
| タスク名     | composite-setup-rollout |
| 分類         | リファクタリング（CI DRY 化） |
| 対象機能     | `.github/workflows/*.yml` の Node/pnpm setup ブロック |
| 優先度       | 中 |
| 見積もり規模 | 中規模（13 yaml） |
| ステータス   | completed |
| 作成日       | 2026-05-22 |
| 関連 Issue   | [#284 UT-CICD-DRIFT-IMPL-COMPOSITE-SETUP](https://github.com/daishiman/UBM-Hyogo/issues/284) |

---

## タスク概要

### 目的

`.github/actions/setup-project/` 既存 composite action に未移行の 13 workflow を
一括 rollout し、`actions/setup-node` 直書きを 0 件にする。Node / pnpm のバージョン
更新を 1 箇所で完結させる DRY 体制を完成させる。

### 背景

- Issue #284 起票時点では「5 yaml」の rollout を想定していたが、その後 workflow が
  増加し、現在 setup-node 系を使う workflow は **18 yaml**（6 移行済み + 13 raw setup blocks）。
- 提案された composite action 名 `setup-node-pnpm` は、より高機能な
  `setup-project`（mise strategy 対応 / install フラグ / working-directory）として
  既に実装済み。本仕様書はこの実装済み action を利用する rollout のみを扱う。
- 移行済み 5 workflow: `pr-build-test.yml`, `verify-stable-key-update.yml`,
  `e2e-tests.yml`, `playwright-visual-full.yml`,
  `playwright-visual-baseline-update.yml`。
  `ci.yml` は workflow 内に既存 composite caller があったが、coverage shard に raw setup block が残っていたため本タスク対象へ含める。
- 未移行 13 workflow（本タスクの rollout 対象）:
  1. `verify-gate-metadata.yml`
  2. `verify-indexes.yml`
  3. `web-cd.yml`
  4. `validate-build.yml`
  5. `d1-migration-verify.yml`
  6. `verify-esbuild.yml`
  7. `cloudflare-alerts-drift.yml`
  8. `backend-ci.yml`
  9. `cloudflare-analytics-export.yml`
  10. `lighthouse.yml`
  11. `post-release-dashboard.yml`
  12. `verify-phase12-compliance.yml`
  13. `ci.yml`

### 最終ゴール

- `grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l` = `0`
- `grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l` = `0`
- 13 workflow すべてが `uses: ./.github/actions/setup-project` を経由
- 既存 CI gate 全 green / Issue #284 close

### 成果物一覧

| 種別         | 成果物                                                 | 配置先 |
| ------------ | ------------------------------------------------------ | ------ |
| 設定変更     | 13 workflow の setup ブロック差し替え                  | `.github/workflows/*.yml` |
| 検証ログ     | grep before/after / workflow_diff / CI run URL         | `outputs/phase-11/` |
| ドキュメント | Phase 1〜13 仕様書 + Phase 13 compliance               | `docs/30-workflows/ut-cicd-composite-setup-rollout/` |
| PR           | base = `dev` の Pull Request                           | GitHub |

---

## タスク分解サマリー

| ID     | フェーズ   | サブタスク名                       | 責務 | 依存 |
| ------ | ---------- | ---------------------------------- | ---- | ---- |
| T-01-1 | Phase 1    | 要件定義（Issue #284 受入条件再定義） | AC-1/2/3 を最新コードに合わせて確定 | - |
| T-02-1 | Phase 2    | composite action surface 整理         | inputs/outputs 契約と 13 yaml 差異整理 | T-01 |
| T-03-1 | Phase 3    | rollout batch 設計                    | 13 yaml を verify / deploy / monitoring 3 batch に分割 | T-02 |
| T-04-1 | Phase 4    | data contract / input 表             | 各 yaml の node/pnpm/cache/working-dir 列挙 | T-03 |
| T-05-1 | Phase 5    | 実装手順（before/after diff snippet） | 13 yaml 単位の置換テンプレ | T-04 |
| T-06-1 | Phase 6    | テスト方針                            | gh workflow view / dispatch / PR CI の 3 段検証 | T-05 |
| T-07-1 | Phase 7    | 品質ゲート                            | verify-composite-rollout gate 設計 | T-06 |
| T-08-1 | Phase 8    | DoD                                   | grep 0 件 / CI green / Issue #284 close | T-07 |
| T-09-1 | Phase 9    | リスク表                              | default 値差・cache miss・deploy 権限 | T-08 |
| T-10-1 | Phase 10   | ローカル検証                          | gh workflow view / yamllint | T-09 |
| T-11-1 | Phase 11   | evidence inventory                    | grep before/after / diff / CI run URL | T-10 |
| T-12-1 | Phase 12   | compliance check                      | canonical 9 headings / 中学生説明 | T-11 |
| T-13-1 | Phase 13   | PR 作成                                | base=dev, commit テンプレ, PR 本文 | T-12 |

**総サブタスク数**: 13 個

---

## Phase一覧

| Phase | 名称 | 仕様書 | ステータス |
| ----- | ---- | ------ | ---------- |
| 1 | 要件定義 | [phase-01-requirements.md](phase-01-requirements.md) | completed |
| 2 | アーキテクチャ | [phase-02-architecture.md](phase-02-architecture.md) | completed |
| 3 | タスク分解 | [phase-03-task-breakdown.md](phase-03-task-breakdown.md) | completed |
| 4 | データ契約 | [phase-04-data-contract.md](phase-04-data-contract.md) | completed |
| 5 | 実装手順 | [phase-05-implementation-guide.md](phase-05-implementation-guide.md) | completed |
| 6 | テスト方針 | [phase-06-test-plan.md](phase-06-test-plan.md) | completed |
| 7 | 品質ゲート | [phase-07-quality-gates.md](phase-07-quality-gates.md) | completed |
| 8 | DoD | [phase-08-dod.md](phase-08-dod.md) | completed |
| 9 | リスク | [phase-09-risks.md](phase-09-risks.md) | completed |
| 10 | ローカル検証 | [phase-10-local-verification.md](phase-10-local-verification.md) | completed |
| 11 | Evidence Inventory | [phase-11-evidence-inventory.md](phase-11-evidence-inventory.md) | completed |
| 12 | Compliance Check | [phase-12-compliance-check.md](phase-12-compliance-check.md) | completed |
| 13 | PR 作成 | [phase-13-commit-pr.md](phase-13-commit-pr.md) | runtime_pending |

---

## 不変条件

1. **`.github/actions/setup-project/action.yml` は変更しない**（既存 surface 維持）
2. **既存の暗黙 default に合わせる**: node `'24'` 指定の yaml は composite action default `24.15.0` に集約しても挙動同等（actions/setup-node が semver で解決）
3. `setup-strategy` は原則 `node-setup`。ただし `web-cd.yml` は後続 build が `mise exec` を使うため `mise` を明示する
4. `cache: pnpm` は composite action の default と一致するため原則明示不要。install なし caller は `cache: ''` を明示する
5. 1 サイクル内で 13 workflow すべて完遂（CONST_007）
6. `outputs/phase-11/` の evidence は actual rollout 実装時に取得（spec フェーズでは inventory のみ）

---

## 参照ファイル

- `.github/actions/setup-project/action.yml` — 既存 composite action
- `.github/workflows/pr-build-test.yml` — 移行済み reference 実装
- `.github/workflows/e2e-tests.yml` — 移行済み reference 実装
- `.claude/skills/task-specification-creator/assets/main-task-template.md`
- `docs/30-workflows/ui-prototype-design-system-foundation/parallel-01-globals-css-rhythm/` — 構造参照元
- GitHub Issue [#284](https://github.com/daishiman/UBM-Hyogo/issues/284)

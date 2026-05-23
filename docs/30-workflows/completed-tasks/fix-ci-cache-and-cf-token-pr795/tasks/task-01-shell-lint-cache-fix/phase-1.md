# Phase 1 — 要件定義 (task-01)

## 概要

`workflow-shell-lint` job (`.github/workflows/ci.yml` L14-) の cache annotation error を解消する。ワークフロー全体の Phase 1 (`outputs/phase-1/phase-1.md` §A) を継承し、task-01 固有のスコープに絞って詳細化する。

## P50 チェック (本タスク固有)

| 項目 | 結果 |
| ---- | ---- |
| current branch に実装が存在する | No (仕様書のみ) |
| upstream にマージ済み | No |
| 前提タスク | PR #795 esbuild override 修正 — マージ済み |

`implementation_mode`: **`new`**

## 真の論点

`actions/setup-node@v4` の `cache: pnpm` 入力は、post-job step で pnpm store directory を保存する設計。`install: 'false'` の caller では `pnpm install` を実行せず store dir が生成されないため、post-cleanup の保存 path validation が失敗し annotation error として表面化する。`setup-project` composite に cache 制御権を露出し、install しない caller のみ cache 無効化する。

## スコープ

### IN

- `.github/actions/setup-project/action.yml` への `cache` input 追加 (default `'pnpm'`)
- `actions/setup-node@v4` step での `cache:` 値の `${{ inputs.cache }}` 化
- `.github/workflows/ci.yml` L25-29 の `workflow-shell-lint` job 内 `setup-project` 呼出に `cache: ''` を追加

### OUT

- 他 caller (`pr-build-test.yml` / `e2e-tests.yml` / `verify-stable-key-update.yml` / `playwright-visual-*.yml` / `ci.yml` L103・L223) の修正 — default `'pnpm'` で後方互換
- `mise` 戦略経路 (`jdx/mise-action`) の cache 設定 — 現状 `cache: true` 固定で問題なし、本タスクスコープ外
- `cache` 以外の `actions/setup-node` 入力変更
- backend-ci.yml 修正 (task-02 の範囲)

## 受入条件 (DoD)

| ID | 条件 | 検証 |
| -- | ---- | ---- |
| AC-1 | `workflow-shell-lint` job が green | `gh run list --workflow=ci.yml --branch=<branch>` |
| AC-2 | `Path Validation Error` annotation が 0 件 | `gh run view <id> --log \| grep -c "Path Validation Error"` == 0 |
| AC-3 | 既存 caller (合計 9 箇所) への副作用なし | default `'pnpm'` で後方互換、CI 通過で確認 |
| AC-4 | actionlint clean | `./actionlint .github/workflows/ci.yml .github/actions/setup-project/action.yml` exit 0 |

## 命名規則確認

| 観点 | 採用 | 根拠 |
| ---- | ---- | ---- |
| input 名 | `cache` | `actions/setup-node` の対応入力名と一致させ可読性確保 |
| default 値 | `'pnpm'` | 既存挙動 (`cache: pnpm`) と完全同義 |
| 無効化値 | `''` (空文字) | `actions/setup-node@v4` doc で cache 無効化を意味する canonical 値 |

## 不変条件

1. `actions/setup-node@v4` の SHA pin (`49933ea`) を維持
2. `pnpm/action-setup@v4` の SHA pin (`b906affc`) を維持
3. `setup-project` composite の outputs (`node-version` / `pnpm-version` / `setup-strategy`) を変更しない
4. 他 job (typecheck / lint / test / verify-*) を破壊しない
5. token・secret 値を YAML / docs に転記しない

## 価値・コスト

- **価値**: shell-lint job の annotation error 0 化により dev branch protection の required check が安定 green に。
- **コスト**: YAML 編集 ~7 行、検証は CI 1 run。

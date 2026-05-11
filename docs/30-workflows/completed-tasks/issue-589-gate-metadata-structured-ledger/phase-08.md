# Phase 8: CI 統合 / `.github/workflows/verify-gate-metadata.yml` / actionlint

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| Source | `outputs/phase-8/phase-8.md` |
| 区分 | 実装（CI workflow 追加 + actionlint 通過） |
| 想定所要 | 0.25 人日 |

## 目的

Phase 2 §5 で設計した `.github/workflows/verify-gate-metadata.yml` を新規追加し、actionlint clean を達成する。PR で `**/artifacts.json` / root package scripts / shared package export / `packages/shared/src/gate-metadata/**` / `scripts/gate-metadata/**` 変更時に発火し、shared typecheck、focused vitest、`pnpm gate-metadata:validate --require-gates-for-changed` を実行する。branch protection の required status check 化は user approval 後の別操作に分離する。

## 実行タスク

### 8.1 `.github/workflows/verify-gate-metadata.yml`（新規）

```yaml
name: verify-gate-metadata

on:
  pull_request:
    paths:
      - '**/artifacts.json'
      - 'package.json'
      - 'pnpm-lock.yaml'
      - 'packages/shared/package.json'
      - 'packages/shared/src/index.ts'
      - 'packages/shared/src/gate-metadata/**'
      - 'scripts/gate-metadata/**'
      - '.github/workflows/verify-gate-metadata.yml'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ubm-hyogo/shared typecheck
      - run: pnpm --filter @ubm-hyogo/shared test -- gate-metadata
      - run: pnpm gate-metadata:validate --require-gates-for-changed <changed-artifacts-json...>
```

### 8.2 actionlint 検証

```bash
actionlint .github/workflows/verify-gate-metadata.yml
# 期待: exit 0
```

### 8.3 ローカル simulate

```bash
# act があれば pull_request シミュレート（任意）
# act pull_request -W .github/workflows/verify-gate-metadata.yml
```

### 8.4 required status check 化（user approval 後）

- 本 PR では workflow file 追加のみ。
- branch protection への必須化（`gh api -X PUT repos/.../branches/dev/protection` で `required_status_checks.contexts` に `verify-gate-metadata / validate` を追加）は **ユーザー明示承認後** に実施。本仕様書では Phase 13 PR 本文に「protection 反映は user approval gate 後」と明記する。

### 8.5 既存 workflow との重複確認

| 既存 workflow | 重複可能性 | 対処 |
| --- | --- | --- |
| `verify-indexes.yml` | `paths` に `.claude/skills/aiworkflow-requirements/indexes/**` を含むのみで artifacts.json は対象外 | 重複なし |
| `pr-build.yml`（存在する場合） | typecheck / lint / build 系。gate-metadata 検証は独立 | 重複なし |
| `audit-correlation-verify.yml`（issue-553 系） | audit-correlation 専用 | 重複なし |

## 変更対象ファイル

| パス | 種別 | 役割 |
| --- | --- | --- |
| `.github/workflows/verify-gate-metadata.yml` | 新規 | CI gate |

## 入出力・副作用

- 入力: Phase 5 実装 + Phase 6 backfill 済み artifacts.json。
- 出力: `outputs/phase-8/phase-8.md`（actionlint stdout + workflow yaml 抜粋）。
- 副作用: GitHub Actions に新 workflow が登録される（PR push 時に発火）。

## テスト方針

actionlint exit 0 + PR push 時の dry-run（act があれば）。

## ローカル実行・検証コマンド

```bash
actionlint .github/workflows/verify-gate-metadata.yml
mise exec -- pnpm gate-metadata:validate   # CI で走るのと同じコマンド
```

## 統合テスト連携

- Phase 9 で workspace-wide 再検証。
- Phase 13 PR push 時に workflow 実発火 → status check が green になることを確認。

## 多角的チェック観点（AIが判断）

- **paths trigger 漏れ**: `package.json` / `pnpm-lock.yaml` / `packages/shared/package.json` / `packages/shared/src/index.ts` の変更でも発火させ、validator script と package export の drift を検出する。
- **frozen-lockfile**: CI では `--frozen-lockfile` で再現性確保。
- **node version**: `.nvmrc` 経由で Node 24 を pin（既存 workflow と整合）。

## サブタスク管理

- ST-1: workflow yaml 作成
- ST-2: actionlint clean
- ST-3: paths trigger 検証
- ST-4: 既存 workflow 重複確認
- ST-5: branch protection 反映方針（user approval gate）の明記

## 成果物

- `.github/workflows/verify-gate-metadata.yml` + `outputs/phase-8/phase-8.md`。

## 完了条件（DoD）

- [ ] workflow yaml が新規作成されている。
- [ ] `actionlint` exit 0。
- [ ] paths trigger に `**/artifacts.json` / `packages/shared/src/gate-metadata/**` / `scripts/gate-metadata/**` が含まれる。
- [ ] 既存 workflow との重複なし。
- [ ] branch protection 反映は Phase 13 で user approval gate 後と明記されている。

## タスク100%実行確認【必須】

- [ ] ST-1 ... ST-5 すべて完了
- [ ] `outputs/phase-8/phase-8.md` 生成済み
- [ ] Phase 9 着手 GO 判定済み

## 次Phase

[Phase 9: 品質検証](phase-09.md)

## 参照資料

- `docs/30-workflows/issue-589-gate-metadata-structured-ledger/index.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/gate-metadata.md`
- Phase 1 / Phase 2 / Phase 5 / Phase 6 / Phase 7 outputs and decisions

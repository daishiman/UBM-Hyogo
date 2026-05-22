# Phase 5: 実装計画

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 5 |
| 機能名 | issue-290-workflow-lint-gate |
| 作成日 | 2026-05-17 |

## 変更ファイル詳細

### 1. `.github/workflows/ci.yml` (編集)

**変更箇所**: `Download actionlint` step (line 46-47) と `Actionlint workflow syntax` step (line 49-50)

**Before**:
```yaml
      - name: Download actionlint
        run: bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)

      - name: Actionlint workflow syntax
        run: ./actionlint -color .github/workflows/post-release-observation-reminder.yml .github/workflows/ci.yml .github/workflows/e2e-tests.yml .github/workflows/pr-build-test.yml .github/workflows/web-cd.yml .github/workflows/backend-ci.yml .github/workflows/post-release-dashboard.yml .github/workflows/runtime-smoke-staging.yml .github/workflows/verify-stable-key-update.yml
```

**After**:
```yaml
      - name: Download actionlint
        run: bash <(curl -sS https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.7

      - name: Actionlint workflow syntax (all workflows)
        run: ./actionlint -color .github/workflows/*.yml
```

### 2. `docs/30-workflows/runbooks/workflow-lint-local-recovery.md` (新規)

セクション構成:
1. 目的
2. 前提（macOS / Linux / curl）
3. インストール手順（バージョン固定 1.7.7）
4. ローカル実行コマンド
5. CI と同等再現
6. 既知の false positive 対処（`# shellcheck disable` / `# actionlint-shellcheck shell=bash`）
7. yamllint を使わない理由（phase-02 の判断参照）

### 3. `package.json` (編集)

`observation:lint` の actionlint 対象を `.github/workflows/*.yml` に統一し、download script に `1.7.7` を渡す。これにより local reproduction path と dedicated CI job の scope drift を防ぐ。

### 4. `docs/30-workflows/completed-tasks/issue-290-workflow-lint-gate/outputs/phase-02/yamllint-decision.md` (新規)

phase-02 で示した評価表と「採用しない」決定の固定記録。

## 実装順序

1. ローカルで T1 を全 32 件に対して事前実行 → 既存 lint error を抽出
2. 検出された error を最小差分で修正（別 commit）
3. `ci.yml` を glob 化（本タスクのメイン差分）
4. `package.json` の local reproduction command を同じ glob / version に同期
5. runbook 新規作成
6. yamllint-decision.md 新規作成
7. CI 実行確認

## 関数 / シグネチャ

該当なし（YAML 設定 + 文書のみ）。

## DoD (Definition of Done)

- [ ] `./actionlint -color .github/workflows/*.yml` がローカルで exit 0
- [ ] `.github/workflows/ci.yml` の actionlint step が glob 化されている
- [ ] runbook `workflow-lint-local-recovery.md` が存在し参照可能
- [ ] yamllint 不採用判断が `outputs/phase-02/yamllint-decision.md` に記録されている
- [ ] CI 上で `workflow-shell-lint` job が success
- [ ] `verify-gate-metadata.yml` / `audit-correlation-verify.yml` の自己 lint が残置されている
- [ ] Phase 12 strict 7 と artifacts parity が揃っている

# Phase 2: 設計

## 2.1 採用方針

**least-privilege 2 階層方式**: top-level に「全 job 共通の最小権限」を置き、書き込みが必要な job だけ job-level で個別に上書きする。これは `ci.yml:15-16`（top `contents: read`）+ 既存 job-level 宣言の組み合わせと同じ設計。

## 2.2 各 workflow の権限判定

### グループ A: 純粋 read のみ（top: `contents: read` のみ追加）

- `e2e-tests.yml` — checkout + test 実行のみ
- `lighthouse.yml` — checkout + LHCI 実行のみ
- `playwright-smoke.yml` — checkout + playwright 実行のみ
- `playwright-visual-full.yml` — checkout + visual test 実行（job-level 宣言は維持）
- `validate-build.yml` — checkout + build のみ
- `verify-design-tokens.yml` — checkout + verify script のみ
- `verify-esbuild.yml` — checkout + verify script のみ
- `verify-primitive-adoption.yml` — checkout + verify script のみ
- `d1-migration-verify.yml` — checkout + migrations verify（job-level 宣言は維持）

### グループ B: 一部 job で write が必要（top: `contents: read`、job-level で上書き）

- `backend-ci.yml` — `:19-21`, `:85-87` に `deployments: write` 等。top に `contents: read` を追加、job-level 既存宣言は不変。
- `playwright-visual-baseline-update.yml` — baseline を git commit/push（`:91-114`）。top `contents: read` + 既存 job-level `contents: write` / `pull-requests: write` 維持。
- `web-cd.yml` — deploy 系。`:19-`, `:69-`, `:161-` の job-level 宣言を維持し、top に `contents: read` 追加。

## 2.3 挿入位置

すべて `on:` ブロックの直後・`jobs:` の前に挿入する（`ci.yml:15-17` と同じ位置）。

```yaml
on:
  ...

permissions:
  contents: read

jobs:
  ...
```

## 2.4 ロールバック方針

問題発生時は top-level `permissions:` ブロックを削除し default に戻すだけ。git revert 単位で workflow 1 件ごとに切り戻し可能。

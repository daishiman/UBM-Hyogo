# Phase 6 — テスト拡充 / 他 caller 回帰検証 (task-01)

## 目的

`setup-project` composite に `cache` input を追加した変更が、既存の全 caller (default 引数で `cache: 'pnpm'` 利用) に副作用を出さないことを検証する。

## caller 列挙

```bash
grep -rn "uses: ./.github/actions/setup-project" .github/workflows/
```

期待出力 (本タスク完了時点):

```
.github/workflows/ci.yml:26                              # 本 PR で cache: '' を追加
.github/workflows/ci.yml:103
.github/workflows/ci.yml:223
.github/workflows/pr-build-test.yml:44
.github/workflows/verify-stable-key-update.yml:24
.github/workflows/e2e-tests.yml:31
.github/workflows/e2e-tests.yml:96
.github/workflows/playwright-visual-full.yml:56
.github/workflows/playwright-visual-baseline-update.yml:22
```

## 期待動作マトリクス

| Caller (file:line) | install 引数 | cache 引数 | 解決後 cache 値 | 期待挙動 | 検証 |
| ------------------ | ------------ | ---------- | --------------- | -------- | ---- |
| ci.yml:26 (workflow-shell-lint) | `'false'` | `''` (明示) | `''` | cache 無効化、post-cleanup 発火せず | T3-AC2 (`Path Validation Error` 0) |
| ci.yml:103 | default `'true'` | default | `'pnpm'` | pnpm store cache 有効、従来通り | CI job green |
| ci.yml:223 | default `'true'` | default | `'pnpm'` | 同上 | CI job green |
| pr-build-test.yml:44 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |
| verify-stable-key-update.yml:24 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |
| e2e-tests.yml:31 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |
| e2e-tests.yml:96 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |
| playwright-visual-full.yml:56 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |
| playwright-visual-baseline-update.yml:22 | default `'true'` | default | `'pnpm'` | 同上 | 当該 workflow green |

## 検証手順

### 1. grep gate

```bash
# caller 数が変動していないか確認
grep -rn "uses: ./.github/actions/setup-project" .github/workflows/ | wc -l
# 期待: 9
```

### 2. `cache: ''` 追加箇所が workflow-shell-lint のみであることを確認

```bash
grep -B3 "cache: ''" .github/workflows/
# 期待: ci.yml の workflow-shell-lint job のみがマッチ
```

### 3. CI 実行で全 caller の green を確認

`gh run view <run-id> --json jobs` で `setup-project` を含む全 job が conclusion=success であることを確認。

### 4. 連動するワークフロー (pr-build-test / e2e-tests 等)

これらは PR trigger で起動するため、`feat/...` branch を push して PR を作成した時点で自動実行される。`gh run list --workflow=<name> --branch=<branch>` で latest が success であることを確認。

## 想定 false-positive

| 事象 | 切り分け |
| ---- | -------- |
| 他 workflow が cache miss で遅延 | cache 自体は有効 (`'pnpm'` default)、key hash 不一致なら save fallback で次回以降 hit。本タスクの責務外 |
| 別 PR で追加された新 caller | grep gate で件数差分から検知、Phase 4 T4 に追加 |

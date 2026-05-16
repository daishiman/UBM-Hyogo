# Phase 2: 設計

## (A) `runtime-smoke-staging.yml` の path 修正

### 変更箇所

```yaml
# .github/workflows/runtime-smoke-staging.yml line 46 (現状)
echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
```

### After

```yaml
echo "::error::register via 'gh secret set <NAME> --env staging-runtime-smoke' (see docs/30-workflows/completed-tasks/ci-secret-alignment-and-runtime-smoke-recovery/runbooks/secret-provisioning.md)"
```

> 補足: 過去 workflow が `completed-tasks/` 配下へアーカイブされた経緯があるが、runbook 自体は引き続き正本として有効。将来 runbook の置き場を `docs/30-workflows/runbooks/` 配下へ昇格する選択肢もあるが、本タスクの scope 外。新規 guard で stale を継続的に検出するため、最小修正に留める。

## (B) 再発防止 guard: `scripts/ci/verify-workflow-doc-refs.sh`

### 責務

`.github/workflows/*.yml` 内に出現する `docs/...md` 形式のパス参照を抽出し、すべてリポジトリルートから実在することを検証する。1 件でも欠落があれば exit 1。

### Interface

```
USAGE:
  scripts/ci/verify-workflow-doc-refs.sh [--root <repo-root>] [--workflows <dir>]

入力:
  - 検証対象 dir（default: .github/workflows）
  - リポジトリルート（default: git rev-parse --show-toplevel）

出力 (stdout):
  - PASS: "verify-workflow-doc-refs: OK (N references checked across M files)"
  - FAIL: "verify-workflow-doc-refs: MISSING\n  <workflow>:<line> -> <missing-path>"

終了コード:
  - 0: 全参照が実在
  - 1: 1 件以上欠落
  - 2: 入力エラー（dir 不存在など）

副作用: なし（read-only）
```

### 抽出ルール

- 正規表現: `docs/[A-Za-z0-9_./\-]+\.md`
- 抽出対象: `.github/workflows/*.yml` の全行
- 対象外: コメント行内 URL（`https://...` で始まるリンクは除外）

### 設計判断

- POSIX shell + `grep -oE` / `sed` で実装（依存追加なし）
- 並列処理不要（ファイル数 < 50）
- false positive 抑止: アンカー（`#section`）除去後にチェック

## (C) CI workflow: `.github/workflows/verify-workflow-doc-refs.yml`

```yaml
name: verify-workflow-doc-refs

on:
  pull_request:
    paths:
      - '.github/workflows/**'
      - 'docs/**/*.md'
      - 'scripts/ci/verify-workflow-doc-refs.sh'
  push:
    branches: [dev, main]
    paths:
      - '.github/workflows/**'
      - 'docs/**/*.md'

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - name: verify workflow doc refs
        run: bash scripts/ci/verify-workflow-doc-refs.sh
```

## (D) Secret 投入（user operation）

実行は user 単独。AI は手順記述のみ。

```bash
# 推奨: 1Password から正規経路で一括投入
bash scripts/smoke/provision-staging-secrets.sh

# あるいは手動（HISTCONTROL=ignorespace で先頭スペース付き実行）
 gh secret set STAGING_API_BASE       --env staging-runtime-smoke
 gh secret set STAGING_ADMIN_BEARER   --env staging-runtime-smoke
 gh secret set STAGING_MEMBER_ID      --env staging-runtime-smoke
 gh secret set STAGING_ME_BEARER      --env staging-runtime-smoke
 gh secret set SLACK_WEBHOOK_INCIDENT --env staging-runtime-smoke
```

## 因果ループ

- 強化ループ: runbook 移動 → workflow YAML の参照 stale → user 困惑 → 解決遅延 → CI 失敗が継続
- バランスループ: 新 guard CI → PR 段階で stale 検出 → 修正を強制 → workflow YAML と docs の整合維持

## 状態所有権

| 状態 | 所有 |
|------|------|
| secret 実値 | GitHub Environment（user のみが書き込み可能） |
| runbook canonical path | リポジトリ（`docs/...`） |
| 参照一貫性検証 | guard script + CI job |

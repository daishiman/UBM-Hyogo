---
phase: 10
title: ローカル検証
workflow_id: ut-cicd-composite-setup-rollout
status: completed
---

# Phase 10: ローカル検証

[実装区分: 実装仕様書]

## 1. 検証コマンド一覧

```bash
# 0. 前提（mise 経由で Node 24 / pnpm 10）
mise exec -- pnpm -v   # → 10.33.2 系
node -v                # → v24.15.0

# 1. 依存解決（変更が yaml のみでも一応 frozen install を再現）
mise exec -- pnpm install --frozen-lockfile

# 2. yaml syntax 確認（gh CLI で 13 yaml すべて）
for wf in \
  verify-gate-metadata verify-indexes web-cd validate-build \
  d1-migration-verify verify-esbuild cloudflare-alerts-drift \
  backend-ci cloudflare-analytics-export lighthouse \
  post-release-dashboard verify-phase12-compliance; do
  echo "===== $wf ====="
  gh workflow view "${wf}.yml" 2>&1 | head -5
done

# 3. actionlint（インストール済なら）
actionlint .github/workflows/verify-gate-metadata.yml
actionlint .github/workflows/web-cd.yml
# ... 13 yaml すべて

# 4. yamllint（任意）
yamllint -d '{rules: {line-length: disable}}' .github/workflows/

# 5. grep 検証（rollout 完了確認）
grep -l 'uses: actions/setup-node' .github/workflows/*.yml | wc -l   # → 0 期待
grep -l 'uses: pnpm/action-setup' .github/workflows/*.yml | wc -l    # → 0 期待
grep -l 'uses: ./.github/actions/setup-project' .github/workflows/*.yml | wc -l   # → 18 期待

# 6. workflow diff スナップショット
git diff --stat .github/workflows/
git diff .github/workflows/ > /tmp/workflow-diff.patch

# 7. PR pre-flight gate
bash scripts/verify-pr-ready.sh
```

## 2. ローカル検証の限界

| 観点 | 検証可否 | 代替 |
|------|----------|------|
| yaml syntax | 可 | gh workflow view / actionlint |
| composite action の解決 | 不可（GH Actions runtime でのみ） | PR run |
| pnpm install の cache hit / miss | 不可 | PR run |
| OIDC / secret 注入 | 不可 | staging dispatch |

## 3. ローカル検証で OK が出たら次にやること

1. `git add .github/workflows/*.yml`
2. `git commit`（Phase 13 §1 の template に従う）
3. `git push -u origin feat/cicd-composite-setup-rollout`
4. PR 作成（Phase 13 §2）

## 4. 統合テスト連携

| Phase | アクション |
|-------|------------|
| 10 | ローカルで yaml syntax / grep gate を確認 |
| 11 | grep before/after を evidence ファイル化 |

## 完了条件

- [ ] §1 のコマンドを上から順に実行し、grep 結果が期待値と一致
- [ ] gh workflow view が 13 yaml すべて parse 成功
- [ ] git diff が 13 yaml のみに収まっている

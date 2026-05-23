# Phase 9: 統合検証 / CI workflow drift 確認

## 目的

ローカル PASS と CI 上の挙動が一致することを push 前に確認し、CI workflow の path filter / trigger / job 名 drift がないことを保証する。

## 9.1 Workflow path existence gate（quality-gates 反映）

```bash
ls -la .github/workflows/verify-design-tokens.yml .github/workflows/playwright-smoke.yml
# 両方が存在すること
```

存在しない `deploy-staging.yml` / `deploy-production.yml` 等を参照する記述が本仕様内に**ない**こと:

```bash
grep -rn 'deploy-staging\.yml\|deploy-production\.yml' docs/30-workflows/task-18-w7-verify-tokens-and-playwright-smoke/ \
  && echo "FAIL" || echo "PASS"
```

## 9.2 Required check 名整合

GitHub Actions が生成する context 名は `<workflow name> / <job name>` 形式。Phase 1 §確定要件の 3 本と一致することを workflow YAML の `name:` / `jobs.*.name:` フィールドで確認:

| 期待 context | workflow `name:` | job `name:` |
| --- | --- | --- |
| `verify-design-tokens / verify-design-tokens` | `verify-design-tokens` | `verify-design-tokens` |
| `playwright-smoke / smoke (chromium)` | `playwright-smoke` | `smoke (chromium)` |
| `playwright-smoke / visual (chromium, 4 screens)` | `playwright-smoke` | `visual (chromium, 4 screens)` |

確認:
```bash
grep -nE '^name:|^\s+name:' .github/workflows/verify-design-tokens.yml .github/workflows/playwright-smoke.yml
```

## 9.3 既存 workflow との重複トリガ確認

```bash
# e2e-tests.yml と playwright-smoke.yml が同一 path で両方発火しないこと
grep -A 5 'paths:' .github/workflows/e2e-tests.yml
grep -A 5 'paths:' .github/workflows/playwright-smoke.yml
```

- `playwright-smoke.yml`: `apps/web/**`、`.github/workflows/playwright-smoke.yml`
- `e2e-tests.yml`: functional 観点の異なる path（既存維持）

職掌分離: smoke / visual は smoke workflow、functional E2E は既存 workflow。トリガ重複時は smoke workflow の path を絞る。

## 9.4 indexes drift gate

本タスクは Phase 12 で aiworkflow-requirements 正本へ登録するため、実装完了後は `.claude/skills/aiworkflow-requirements/indexes/` と `references/task-workflow-active.md` に影響する。Phase 9 では実装前 drift と Phase 12 後 drift を分けて確認する:
```bash
git status .claude/skills/aiworkflow-requirements/indexes/ .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | head
mise exec -- pnpm indexes:rebuild
git diff --check .claude/skills/aiworkflow-requirements/indexes/ .claude/skills/aiworkflow-requirements/references/task-workflow-active.md
```

## 9.5 sync-check（main / dev）

```bash
mise exec -- pnpm sync:check  # origin/main / origin/dev に対して current ブランチが遅れていないこと
```

## 完了条件

- [ ] 2 workflows が存在
- [ ] 3 context 名が workflow YAML と一致
- [ ] 既存 e2e-tests.yml と path 重複なし
- [ ] aiworkflow indexes / active workflow sync 方針が Phase 12 と矛盾しない
- [ ] sync:check で behind = 0

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | implemented_local_runtime_pending |

## 実行タスク

- workflow path、context 名、aiworkflow 同期方針の drift を検証する。

| Task | 内容 |
| --- | --- |
| 9-A | workflow path / job context 名を確認する |
| 9-B | existing e2e workflow との trigger 重複を確認する |
| 9-C | aiworkflow 正本同期を Phase 12 の更新対象として明示する |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| GitHub workflows | `.github/workflows/` | workflow path / context 名 |
| aiworkflow active | `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active workflow 登録先 |
| aiworkflow indexes | `.claude/skills/aiworkflow-requirements/indexes/` | quick-reference / resource-map |

## 成果物

| 成果物 | パス | 内容 |
| --- | --- | --- |
| Phase 9 仕様 | `phase-09.md` | 統合検証 / drift gate |

## 統合テスト連携

Phase 9 は Phase 8 の実行結果を CI workflow 定義へ接続する。runtime CI green は PR 作成後の Phase 13 evidence とし、Phase 9 では path / context / trigger の静的整合を確認する。

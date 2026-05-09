# Phase 9: 品質保証 — issue-571-runtime-smoke-ci-staging-integration

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 9 / 13 |
| 入力 | Phase 5 実装 / Phase 4-7 テスト・AC |
| 出力 | `outputs/phase-09/main.md`（quality gate 一覧 / 実行コマンド / 期待結果） |

## 目的

CI 統合に対する **quality gate** を確定し、各 gate のコマンド・期待結果・失敗時 actionable を一覧化する。

## quality gates

| ID | gate | コマンド | 期待 |
| --- | --- | --- | --- |
| Q-1 | typecheck | `mise exec -- pnpm typecheck` | 0 error |
| Q-2 | lint | `mise exec -- pnpm lint` | 0 error |
| Q-3 | regression unit | `mise exec -- pnpm exec vitest run apps/api/src/middleware/__tests__/repository-providers.test.ts apps/api/src/repository/__tests__/builder.test.ts` | 全 PASS（throw assertion 含む） |
| Q-4 | shell test (T-1) | `bash scripts/smoke/__tests__/redact.test.sh` | 全 fixture PASS（F-1〜F-5） |
| Q-5 | shell test (T-4) | `bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh` | `--out-dir` 動作 / 後方互換 |
| Q-6 | shell test (T-5) | `bash scripts/smoke/__tests__/ci-summary-post.test.sh` | dry-run で post 0 通 |
| Q-7 | actionlint | `docker run --rm -v "$(pwd)":/repo rhysd/actionlint:latest -color /repo/.github/workflows/runtime-smoke-staging.yml /repo/.github/workflows/backend-ci.yml` | 0 issue |
| Q-8 | `set -x` 禁止 grep | `! grep -rEn 'set -x\|bash -x\|set -o xtrace' scripts/smoke/ .github/workflows/runtime-smoke-staging.yml` | 0 hit |
| Q-9 | secret 文字列 grep | `! rg -n 'hooks\.slack\.com/services/[A-Z0-9]\|sentry\.io/[0-9]+/[0-9]+\|xox[bp]-\|Bearer [A-Za-z0-9_-]{20,}' scripts/ .github/workflows/runtime-smoke-staging.yml docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/` | 0 hit |
| Q-10 | ADR 存在 | `test -f docs/40-architecture/adr/ADR-runtime-smoke-secret-injection.md && test -f docs/40-architecture/adr/ADR-runtime-smoke-required-status-check.md` | exit 0 |
| Q-11 | runbook 存在 | `test -f docs/30-workflows/issue-571-runtime-smoke-ci-staging-integration/operations/setup-github-environment.md` | exit 0 |
| Q-12 | build | `mise exec -- pnpm build` | 0 error（regression check） |
| Q-13 | Issue #571 CLOSED 維持 | `gh issue view 571 --repo daishiman/UBM-Hyogo --json state --jq '.state'` | `CLOSED` |

### path existence gate split

| Path | 現 implementation cycle |
| --- | --- |
| `.github/workflows/backend-ci.yml` | `test -f` + reusable workflow call grep + actionlint |
| `.github/workflows/runtime-smoke-staging.yml` | `test -f` + `workflow_call` / `workflow_dispatch` grep + actionlint |
| `docs/40-architecture/adr/ADR-runtime-smoke-*.md` | ADR 本体作成後 `test -f` |
| `operations/setup-github-environment.md` | runbook 本体作成後 `test -f` |

## CI 側 gate 追加

`set -x` 再発防止（Phase 6 E-8）を継続的に保証するため、既存 `verify-indexes.yml` 等と同様の独立 workflow または既存 `ci.yml` に step を追加:

```yaml
# .github/workflows/verify-no-debug-trace.yml（既存があれば追記、なければ新設）
name: verify-no-debug-trace
on:
  pull_request:
    paths:
      - "scripts/smoke/**"
      - ".github/workflows/runtime-smoke-staging.yml"
jobs:
  grep:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: forbid set -x in smoke scripts/workflow
        run: |
          ! grep -rEn 'set -x|bash -x|set -o xtrace' \
            scripts/smoke/ .github/workflows/runtime-smoke-staging.yml
```

> 既存 workflow への step 追加 vs 新規 workflow 作成は Phase 5 実装時に判断（Phase 5 file inventory 修正可）。

## 失敗時 actionable

| 失敗 gate | actionable |
| --- | --- |
| Q-1, Q-2 | shell script の typo / YAML 構文不備を修正 |
| Q-3 | 既存 unit が壊れている → 親タスク (issue-371/531) regression 疑い。本タスクのみで原因特定困難なら別 Issue 起票 |
| Q-4〜Q-6 | shell test 失敗。fixture と実装の整合再確認 |
| Q-7 | actionlint 指摘箇所修正 |
| Q-8 | `set -x` 削除 / 該当箇所書き換え |
| Q-9 | secret 値混入 → 即時 rotate（GitHub Secrets / 1Password 両側） + history 削除検討 |
| Q-10, Q-11 | 不在ファイル作成 |
| Q-12 | build regression。本タスクで apps/api を触っていないため通常 PASS。fail なら別 Issue |
| Q-13 | Issue 状態が変化 → 本サイクルの不変条件違反。即時 close-back |

## 完了条件（DoD）

- [ ] Q-1〜Q-13 全 PASS
- [ ] `set -x` 再発防止 gate が CI workflow に組み込まれている（または既存 gate を流用）
- [ ] 失敗時 actionable が Q-1〜Q-13 全件で明示
- [ ] Issue #571 が CLOSED のまま

# Phase 13 — PR 作成

## 目的

PR-A / PR-B の 2 段構成で PR を作成し、`dev` を base ブランチとする。Issue #655 は OPEN のまま `Refs #549, Refs #586, Refs #655` で連携する (open/close 操作はユーザー指示なしで実行しない)。

## PR-A: scripts / workflow / runbook + (条件付き) root cause fix

### 本文要件

```markdown
## Summary
- `post-switch-monitor.ts` に `--recovery-mode` / `--since` flag を追加
- `cf-audit-log-7day-summary.yml` に `workflow_dispatch.inputs.recovery_mode` / `since` を追加
- `recovery-rootcause-helper.ts` 新規 (read-only)
- `15-infrastructure-runbook.md` に recovery 運用追記
- (条件付き) `cf-audit-log-monitor.yml` の hourly startup_failure 修正

## Why
- Issue #586 D+7 観測の 1 周目で 168 hourly snapshots 取得が失敗 (2026-05-13 以降 hourly run 全件 failure)
- `pass_runtime_synced` 昇格条件を満たすため 2 周目 7 日観測を起動する必要がある
- 1 周目 / 2 周目 evidence 分離規約を初出で固定する

## Test plan
- [ ] `mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/post-switch-monitor.recovery.spec.ts` PASS
- [ ] `mise exec -- pnpm exec vitest run scripts/cf-audit-log/observation/recovery-rootcause-helper.spec.ts` PASS
- [ ] `mise exec -- pnpm exec actionlint .github/workflows/cf-audit-log-7day-summary.yml` exit 0
- [ ] PR-A 上で `cf-audit-log-7day-summary.yml` の workflow_dispatch dry-run (recovery_mode=true / since=<架空 ISO>) で validate step が exit 0
- [ ] (条件付き) `cf-audit-log-monitor.yml` 修正後、次 hourly schedule で `gh run list` が success

## State
- merge 前: `implemented_local_runtime_pending`
- merge 後: canonical state `runtime_pending` + operation label `recovery_active`

Refs #549, Refs #586, Refs #655
```

### gh コマンド（ユーザー承認後のみ）

以下は PR 本文を作るための参考コマンドであり、この仕様書作成・改善サイクルでは実行しない。

```bash
gh pr create --base dev --title "feat(issue-655): recovery 2nd cycle aggregation + rootcause helper" \
  --body "$(cat outputs/phase-13/pr-a-body.md)"
```

## PR-B: D'+7 evidence + SSOT 昇格

### 本文要件

```markdown
## Summary
- D'+7 (=<日付>) 完走 evidence を `outputs/phase-11/evidence/` に追加
- SSOT 4 ファイルを `pass_runtime_synced` に昇格
- Phase 12 close-out 7 outputs を完成
- `documentation-changelog.md` に変更全 path を列挙

## Evidence
- `hourly-run-7day-summary-recovery.json` (`actualSnapshots: 168 / leakageHourlyClean: true`)
- `leakage-grep-7day-recovery.log` (168 hour 連続 clean)
- `issue-rate-comparison-recovery.md` (baseline / 1 周目 / 2 周目 比較)

## State
- merge 前: canonical state `runtime_pending` + operation label `recovery_active`
- merge 後: `pass_runtime_synced`

Refs #549, Refs #586, Refs #655
```

### gh コマンド（ユーザー承認後のみ）

以下は D'+7 recovery evidence が揃った後の参考コマンドであり、この仕様書作成・改善サイクルでは実行しない。

```bash
gh pr create --base dev --title "docs(issue-655): D'+7 recovery evidence + pass_runtime_synced promotion" \
  --body "$(cat outputs/phase-13/pr-b-body.md)"
```

## 完了条件

- [ ] PR-A が `dev` に merge され、D'+0 が確定している
- [ ] PR-B が `dev` に merge され、`pass_runtime_synced` 状態に昇格している
- [ ] Issue #655 / #586 / #549 への `Refs` 連携が PR 本文に明記されている
- [ ] open/close 操作はユーザー明示承認がない限り行わない (Issue #655 は OPEN のまま、CLAUDE.md governance に従う)

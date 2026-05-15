# Phase 8 — CI 検証 (PR-A)

## 目的

PR-A 上で workflow lint / focused test / required status checks が green になることを確認する。

## チェック項目

- `build-test` (pr-build-test.yml) — typecheck / lint / build
- `lighthouse-ci` — PR-A は scripts / workflow 編集のみのため UI 変更なし → 影響なし想定。fail 時は調査
- `actionlint` — workflow YAML diff 検証
- `verify-test-suffix` — `*.spec.ts` 命名規約 (CLAUDE.md 不変条件 8)
- `verify-phase12-compliance` — Phase 12 outputs 必須 7 件。PR-A 時点でも strict 7 は `runtime_pending` 境界付きで実体配置し、PR-B では runtime evidence と SSOT 昇格内容だけを更新する

## `workflow_dispatch` dry-run

PR-A merge 前に `cf-audit-log-7day-summary.yml` を `recovery_mode=true / since=<架空 ISO>` で `workflow_dispatch` 起動し、Validate inputs step が exit 0 になることを確認する。実際の aggregate step は fixture が存在しないため fail してよいが、validate 部分の動作が PR-A の差分に依存することを evidence にする。

```bash
gh workflow run cf-audit-log-7day-summary.yml \
  --ref <pr-a-branch> \
  -f recovery_mode=true \
  -f since=2026-05-15T01:00:00Z
gh run watch <run-id>
```

## 完了条件

- [ ] PR-A の required status checks が全 green
- [ ] dry-run の run URL を `outputs/phase-11/evidence/ci-dry-run.md` に記録

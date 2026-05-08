# Phase 7 Output: AC マトリクス（実行結果）

Canonical source: `../../phase-07.md`

| AC | 状態 | 根拠 |
| --- | --- | --- |
| AC-1 workflow 存在 + workflow_call + workflow_dispatch | ✅ | `runtime-smoke-staging.yml` `on:` |
| AC-2 staging deploy → smoke 自動実行 → artifact upload 30d | ⏳ runtime evidence cycle で実測 | workflow YAML 内で構造充足（artifact retention-days: 30） |
| AC-3 secret 実値が artifact / log / Slack に含まれない | ✅ static + grep-gate.log | redact.sh + grep gate `Cookie:|authorization:|Bearer ...` 0 hit |
| AC-4 failure 時のみ Slack post | ✅ | `if: failure()` step 限定 |
| AC-5 ADR 2 本配置 + optional check 明記 | ✅ | `docs/40-architecture/adr/ADR-runtime-smoke-*` |
| AC-6 Environment scope のみ参照 / repo scope に staging cred 置かない | ✅ | workflow `environment: staging-runtime-smoke` + runbook §2/§3 |
| AC-7 `::add-mask::` × `set -x` 事故再発防止 | ✅ | grep gate 0 hit + workflow に `set -x` なし |

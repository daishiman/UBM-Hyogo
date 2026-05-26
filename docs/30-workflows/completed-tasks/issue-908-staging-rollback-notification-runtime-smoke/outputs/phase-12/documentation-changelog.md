# Documentation Changelog — issue-908-staging-rollback-notification-runtime-smoke

## Same-wave Updates

| Path | Change |
| --- | --- |
| `docs/30-workflows/issue-908-staging-rollback-notification-runtime-smoke/` | New: Phase 1-13 spec + outputs/{phase-5,phase-10,phase-11,phase-12} |
| `scripts/runtime-smoke/schema-alias-rollback.sh` | New: dry-run / redaction / alias validation / HTTP status capture / user-gated rollback smoke helper |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/evidence/staging-smoke.md` | New: runtime evidence placeholder (Phase 11 で実値転記) |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/outputs/phase-11/manual-test-result.md` | Edited: pending status のまま placeholder cross-link 追加 |
| `docs/30-workflows/completed-tasks/issue-838-schema-alias-rollback-notification/artifacts.json` | Edited: Gate-C pending の evidence_path を実在 placeholder へ更新 |
| `.claude/skills/aiworkflow-requirements/*` | Issue #908 runtime smoke helper / evidence placeholder を同一 wave 同期 |

## Skill / Reference Update

本タスクで skill / reference の促進対象となる lessons learned:

- L-I908-001: bash helper の secret redact は sed pipe 3 pattern（webhook URL / Bearer / X-Auth-Key）を最小集合とし、追加 pattern は実プロバイダ追加時に拡張する
- L-I908-002: runtime evidence MD は `placeholder 先行 commit → user-gated 実行 → 転記`の3段階。先行 commit 時点で gate-metadata:validate の evidence_path 実在を満たせる
- L-I908-003: smoke helper の `--dry-run` 既定推奨は誤用助長になるため非採用。代わりに `[USER-GATE]` confirm prompt で本実行を gate する

Phase 12 lessons promotion は本 cycle で aiworkflow-requirements の workflow/index/changelog/log に反映済み。task-specification-creator へのテンプレ昇格は横展開時に判断する。

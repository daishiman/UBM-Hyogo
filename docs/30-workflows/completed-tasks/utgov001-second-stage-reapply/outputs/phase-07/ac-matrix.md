# Phase 7 Output: Acceptance Criteria Matrix

| AC | Evidence |
| --- | --- |
| AC-1 / AC-2 | `outputs/phase-02/contexts-source.json`, `expected-contexts-{dev,main}.json` |
| AC-3 | Runtime evidence only: Phase 13 approval後に再取得する `branch-protection-current-{dev,main}.json`。`spec_created` 時点の placeholder は PASS 証跡にしない |
| AC-4 | Complete PUT payload template: `branch-protection-payload-{dev,main}.json`。Phase 13 で fresh GET から contexts 以外の値を維持して再生成する |
| AC-5 / AC-6 | Runtime evidence only: Phase 13 approval後の PUT 応答 / 適用後 GET と expected contexts の集合一致。承認前は未実施 |
| AC-7 | `outputs/phase-09/drift-check.md` |
| AC-8 / AC-10 | `outputs/phase-05/apply-runbook-second-stage.md` |
| AC-9 | `outputs/phase-02/payload-design.md`, `outputs/phase-04/test-strategy.md` |
| AC-11 / AC-12 | `outputs/phase-03/main.md`, `outputs/phase-10/go-no-go.md` |
| AC-13 | `phase-13.md`, `outputs/phase-13/local-check-result.md` |
| AC-14 | `outputs/phase-12/system-spec-update-summary.md` |

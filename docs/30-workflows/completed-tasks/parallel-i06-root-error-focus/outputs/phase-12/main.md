# Phase 12 main — parallel-i06-root-error-focus

## Summary

root `apps/web/app/error.tsx` の h1 自動 focus を実装し、source spec の p-07 section 4.3 DoD を満たした。
変更は `useRef` import、`headingRef` 生成、`focus({ preventScroll: true })` 呼び出し、`h1` の `ref/tabIndex` 付与に限定した。
focused spec `apps/web/app/error.spec.tsx` で focus 移譲と digest 表示を検証する。

## State

| Item | Value |
| --- | --- |
| workflow_state | `implemented_local_evidence_captured` |
| taskType | `implementation` |
| visualEvidence | `NON_VISUAL` |
| runtime boundary | staging/production smoke なし。local command evidence で完結 |
| user gate | commit / push / PR |

## Strict Outputs

Phase 12 strict 7 は `outputs/phase-12/` 配下に物理配置した。
`artifacts.json` は root と `outputs/` mirror の双方に配置し、Phase 11 evidence inventory は `present` 化後に verifier が物理 file を検査できる形式へ統一した。

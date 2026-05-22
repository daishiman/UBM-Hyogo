# Phase 4 成果物: クリティカルパス

```
T1 (JSON)  ─┐
T2 (Schema)─┴─→ T3 (純関数) ─→ T4 (vitest) ─→ T10 (vitest config) ─┐
                          │                                          │
                          └─→ T5 (cf.sh) ─→ T6 (CLI test) ─→ T11 ───┤
                                       ├─→ T7 (CI workflow) ────────┤
                                       └─→ T12 (runbook) ───────────┤
                                                                    │
                                T8 (README) ─→ T13 (parent link) ───┤
                                T9 (.env.example) ──────────────────┤
                                                                    └→ T14 (artifacts.json)
```

最長パス: T1/T2 → T3 → T5 → T6 → T11 → T14

ボトルネック: T3 (純関数 7 種) と T5 (cf.sh alerts 分岐) の合計実装量。
TDD で T4 と並行進行することで早期にフィードバックループを回した。

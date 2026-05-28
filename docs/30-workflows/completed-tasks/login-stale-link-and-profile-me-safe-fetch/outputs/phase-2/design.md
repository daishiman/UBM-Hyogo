# Phase 2 成果物: 設計

詳細は [../../phase-2.md](../../phase-2.md) を参照。

## 採用設計

- Task A: 静的 grep + `assertHrefIsString` helper + 上流型 narrow
- Task B: `safeServerFetch` ラップ + `meResult.ok===false` で `SectionError` + `AuthRequiredError` rethrow→outer try/catch redirect

# Phase 02 Design

所有者を dialog に寄せる。dialog は `"use client"` なので `useRouter()` を安全に持てる。

順序契約:

1. `router.refresh()`
2. `onSubmitted(res.accepted)`
3. `onClose()`

duplicate pending path は旧 parent refresh の挙動を維持するため、
`router.refresh() -> onSubmitted(existingPending)` の順に発火し、dialog は閉じない。

`RequestActionPanel` は refresh 発火責務を持たないため、二重発火しない。

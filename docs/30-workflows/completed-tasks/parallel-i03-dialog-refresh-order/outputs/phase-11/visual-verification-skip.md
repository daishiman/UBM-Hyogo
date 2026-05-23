# Phase 11 NON_VISUAL Evidence

判定: NON_VISUAL。

画面表示差分ではなく、内部副作用順序の修正である。screenshot では `router.refresh()` の発火順を証明できないため、component spec の call order assertion を正本 evidence とする。

Evidence:

- `VisibilityRequestDialog.component.spec.tsx`: `["refresh", "onSubmitted", "onClose"]`
- `DeleteRequestDialog.component.spec.tsx`: `["refresh", "onSubmitted", "onClose"]`
- `VisibilityRequestDialog.component.spec.tsx`: duplicate pending path `["refresh", "onSubmitted"]`
- `DeleteRequestDialog.component.spec.tsx`: duplicate pending path `["refresh", "onSubmitted"]`
- `RequestActionPanel.component.spec.tsx`: parent 側 `router.refresh` は呼ばれない

実行結果は `outputs/phase-11/evidence/test-output.md`。

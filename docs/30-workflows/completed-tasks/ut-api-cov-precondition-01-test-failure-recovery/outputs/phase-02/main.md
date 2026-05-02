# outputs phase 02: ut-api-cov-precondition-01-test-failure-recovery

- status: specification_prepared
- purpose: F01-F13 の設計分類、mock / fixture 方針、修復分類を固定する
- measurement_status: 未実測。設計完了は test / coverage PASS ではない

## 設計分類

- F01-F04: form sync / response identity / responseEmail
- F05-F06: workflow alias / tag queue status
- F07: repository query / D1 seed / member scope
- F08-F12: auth/session route boundary / 401 vs 403
- F13: auth route hookTimeout / async cleanup

## mock / fixture 方針

- D1: 既存 helper と isolated seed を優先
- auth/session: 既存 role fixture と cookie/session mock を再利用
- external sync: network 実アクセスではなく `vi.fn` / existing fetch mock
- timeout: timeout 延長ではなく unresolved async resource を調査

## handoff

Phase 3 へ failure group、mock / fixture 戦略、`fixture drift` / `production regression` / `stale spec` の分類ルールを渡す。

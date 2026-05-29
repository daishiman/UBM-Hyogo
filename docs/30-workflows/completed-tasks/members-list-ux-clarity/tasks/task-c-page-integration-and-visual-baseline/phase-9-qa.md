<!-- workflow: members-list-ux-clarity / task: C / phase: 9 -->

[実装区分: 実装仕様書]

# Phase 9 — QA (Task C)

## 1. QA チェックリスト

### 1.1 機能

- [ ] `/members` を 0 件・通常件数・エラー 3 状態で開き、それぞれ `<output data-role="result-count">` 表示が正しい
- [ ] density 切替（comfy / dense / list）で件数表示が消えないこと
- [ ] フィルタ適用（zone / status / tag / q）で `result-count` が即座に更新される

### 1.2 a11y

- [ ] SR (VoiceOver / NVDA) で `getByRole("status")` 領域が件数変化時に announce される
- [ ] `<p data-role="pagination-meta">` が SR に読まれない (`aria-hidden="true"`)
- [ ] キーボード Tab で MemberFilters → result-count → MemberGrid の順に focus 移動可能

### 1.3 視覚

- [ ] 4 viewport (375/768/1024/1440) で Layout 崩れがない
- [ ] OKLch tokens 維持 (HEX 直書きなし)

### 1.4 CI gate

- [ ] `pnpm typecheck` GREEN
- [ ] `pnpm lint` GREEN
- [ ] `pnpm verify-design-tokens` GREEN
- [ ] `playwright-smoke` GREEN（baseline 撮影後）

### 1.5 不変条件

- [ ] INV-1 (API 不変): 新 endpoint なし
- [ ] INV-2 (URL query SSOT): `?q&zone&status&sort&tag&density` 仕様変更なし
- [ ] INV-3 (新 primitive 0): 0 件
- [ ] INV-4 (OKLch tokens): tokens 変更 0
- [ ] INV-5 (プロトタイプ正本): 構造変更なし
- [ ] INV-6 (Server Component 構造): page.tsx の `await connection()` → `safeServerFetch` 構造維持

## DoD

- [x] 機能 / a11y / 視覚 / CI gate / 不変条件の 5 軸チェックリストが配置されている

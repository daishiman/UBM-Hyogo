# Phase 9 — Risks and Mitigations

| Risk | 影響 | 緩和策 | 状態 |
|------|------|--------|------|
| API response の zod parse 失敗 | 5xx 画面 | `PublicMemberProfileZ.parse` で fail-close → error.tsx boundary | ✅ 実装済み |
| visibility filter の API 漏れ | member/admin field の DOM 露出 | UI 側 adapter で二重防御 | ✅ 実装済み |
| unknown kind 出現で UI 崩壊 | 全画面 5xx | adapter で silent skip | ✅ 実装済み・unit spec 検証済 |
| 既存 primitive props 破壊 | 他画面 regression | 既存 primitive 変更せず legacy section bridge で吸収 | ✅ |
| Playwright SSR fetch を route mock で intercept 不可 | visual spec 取得不能 | in-process mock API fixture に切替済み。production-equivalent D1 seed は serial-07 が担当 | ✅ mitigated |
| `apps/web/app/(public)/error.tsx` 未配置 | error boundary 不在 | 親階層 `apps/web/app/error.tsx` を継承（Next.js 既定挙動） | ✅ 影響なし |
| stableKey literal 直書き lint 違反 | CI fail | fixture は STABLE_KEY 定数経由 | ✅ |

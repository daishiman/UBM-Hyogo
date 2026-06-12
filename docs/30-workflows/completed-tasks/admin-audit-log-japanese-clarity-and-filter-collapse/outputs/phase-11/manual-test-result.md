# Phase 11 手動テスト結果（manual-test-result）

## NON_VISUAL / VISUAL 宣言

- タスク種別: **VISUAL（UI/UX 変更を伴う）**
- workflow_state: **implemented_local_evidence_captured**（apps/web 表現層実装 + focused Vitest 完了）
- 証跡の主ソース: focused vitest / typecheck / lint / `verify-design-tokens` の機械検証 + user-gated staging authenticated screenshot
- スクリーンショットを本 wave で作らない理由: 認証済み staging capture は deploy / admin bearer mint を伴うため user-gated。実画像・runtime artifact を擬似生成しない方針（FB-MSO-003）

## 実施状況

| 項目 | 状態 | 備考 |
| --- | --- | --- |
| focused vitest（auditGlossary / auditAppliedFilters / AuditLogPanel / AuditLogCard） | present | 4 files / 57 tests PASS |
| `mise exec -- pnpm typecheck` | present | PASS（7 workspace projects） |
| `mise exec -- pnpm lint` | present | PASS（dependency-cruiser / stablekey / no-inline-style / workspace lint） |
| `mise exec -- pnpm verify:tokens`（HEX 0 件） | present | PASS（design tokens in sync / 91 tracked） |
| `git diff --name-only -- apps/api packages/shared`（空） | present | 実装差分は apps/web + docs + aiworkflow sync のみ |
| staging authenticated screenshot（6 canonical PNG） | pending（user-gated） | screenshot-plan.json 参照 |

## 検証済みの AC（local focused evidence）

- AC-1 / AC-2: フィルタフォーム日本語ラベル + 2 層段階開示（details の open 既定）
- AC-3 / AC-5: カードの action / targetType 日本語表示・auditId ラベル日本語化
- AC-4: 適用フィルタチップ日本語化（英語キー名ゼロ）
- AC-6: glossary SSOT helper + raw fallback
- AC-7: カードブロック整列（chip-row wrap / グリッド）
- AC-8: OKLch トークンのみ（HEX 0）
- AC-9: apps/api・packages/shared diff ゼロ・query param キー不変
- AC-10/11/12: primitive 新規ゼロ・a11y 維持・既存挙動温存

## 結論

local implementation evidence は present。staging authenticated visual capture 6 PNG は user-gated のため runtime_pending として残す。

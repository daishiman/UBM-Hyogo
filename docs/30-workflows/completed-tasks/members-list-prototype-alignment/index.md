# members-list-prototype-alignment

## 概要

公開 `/members` の list density とカード情報設計を、現行 API contract の範囲で prototype に近づける実装 workflow。

## スコープ

- `/members` route は `density="list"` でも `MemberGrid` を使う
- `MemberCard` は zone chip、occupation/location icon meta、status chip-row、list 5 col row を持つ
- `MemberFilters` は TagPicker heading「タグで絞り込み」を持つ
- `EmptyState` は compact variant を持つ
- `Icon` primitive に `briefcase` / `map-pin` / `chevron-right` を追加する

## Boundary

`PublicMemberListItem` に存在しない `businessOverview` / list item `tags` は追加しない。API、D1 schema、Auth.js、Google Form schema、`MemberTable` legacy component は変更しない。

## Status

`implemented_local_evidence_captured / implementation / VISUAL / visual_runtime_pending`

Local typecheck と component tests は PASS。Phase 11 screenshot は local webServer readiness timeout により pending だが、Playwright spec と evidence path は current workflow root に補正済み。

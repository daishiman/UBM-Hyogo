# Phase 12 Main

Issue #891 の `FieldKindZ` exhaustiveness guard を実装し、仕様書・証跡・正本索引を同期した。

## 実装要約

- `apps/web/src/lib/adapters/member-detail.ts` に `KIND_ROUTE` を追加し、`satisfies Record<FieldKind, KindRoute>` で全 kind 分類を型検査対象にした。
- `DETAIL_KINDS` / `LINK_KINDS` は `KIND_ROUTE` から導出し、allowlist の二重管理を排除した。
- `normalizeField` は route set を受け取り、`sections` は detail、`linkSections` は url link を返す。
- `apps/web/src/components/public/MemberDetail.tsx` で `linkSections` を既存 `MemberLinks` へ接続し、`url` 分類の data loss を防いだ。
- `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` に enum と route map の完全一致、除外 kind の detail 非表示、`url` の link route 保持を検証するケースを追加した。

## 状態

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`
- Phase 13: commit / push / PR は user-gated

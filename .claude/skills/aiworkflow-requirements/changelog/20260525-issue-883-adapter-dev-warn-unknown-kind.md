# 2026-05-25 issue-883 adapter dev warn unknown kind

Issue #883 を `implemented_local_evidence_captured / implementation / NON_VISUAL` として同期した。

`apps/web/src/lib/adapters/member-detail.ts` に `ToMemberDetailPropsOptions` と `RawField` export を追加し、`FieldKindZ.safeParse` 失敗 branch だけで `onUnknownKind?.(field)` を呼ぶ。adapter 内には `console.*` / `process.env.*` を置かず、pure adapter 境界を維持する。

`apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` は既存 silent skip regression を維持しつつ callback invocation case を追加して 10 tests に拡張した。`apps/web/app/(public)/members/[id]/page.tsx` は dev 環境のみ `console.warn("[member-detail] unknown kind", field.kind, field.stableKey)` callback を注入し、production では `undefined` を渡す。

Evidence: `@ubm-hyogo/web typecheck` PASS、`@ubm-hyogo/web lint` PASS、adapter spec 10 PASS、apps/web test 1028 PASS / 1 skipped、production build PASS、production artifact (`.next/server` / `.open-next`) DCE grep `0`。`.next/cache` は webpack cache のため DCE 判定対象外として明記した。

Phase 12 strict 7、`references/task-workflow-active.md`、artifact inventory、quick-reference、resource-map、LOGS を同一 wave で反映した。commit / push / PR は user-gated。

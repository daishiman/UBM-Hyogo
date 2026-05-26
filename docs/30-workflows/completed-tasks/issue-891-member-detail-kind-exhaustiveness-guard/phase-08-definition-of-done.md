# Phase 8: 完了定義（DoD）

## 必須条件

- [ ] `apps/web/src/lib/adapters/member-detail.ts` に `KIND_ROUTE` が `as const satisfies Record<FieldKind, KindRoute>` で定義されている
- [ ] `DETAIL_KINDS` が `KIND_ROUTE` から `=== "detail"` で導出されている
- [ ] `normalizeField` が route set を受け取り、`sections` と `linkSections` で共用されている
- [ ] `linkSections` が `KIND_ROUTE === "links"` から導出され、`MemberDetail` で `MemberLinks` へ渡されている
- [ ] `__testInternals` が test 専用 export として末尾に存在し、production code から参照されていない
- [ ] adapter spec に網羅性 assert（TC-EX-01 / TC-EX-02）が追加されている
- [ ] adapter spec に kind routing / 除外 assert（TC-EX-03〜06）が追加され、excluded kind が `sections` / `linkSections` のどちらにも漏れないことを検証している
- [ ] 既存 8 ケースが green を維持している
- [ ] `mise exec -- pnpm typecheck` 成功
- [ ] `mise exec -- pnpm lint` 成功
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts` 成功
- [ ] `ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 mise exec -- pnpm --filter @ubm-hyogo/web build` 成功

## 検証可能性

- [ ] `KIND_ROUTE` から `shortText` 行をローカルで一時的に削除すると `pnpm typecheck` が fail することを確認し、`outputs/phase-11/typecheck-fail-evidence.md` に記録（実証跡）
- [ ] `FieldKindZ` を `packages/shared/src/zod/primitives.ts` で仮に 1 値追加した場合に、`KIND_ROUTE` 未更新の状態で typecheck が fail することを確認（実証跡。確認後 revert）

## visual snapshot

- [ ] Playwright visual snapshot が更新不要 or 更新必要のいずれかが判明している
- [ ] 更新必要の場合、差分が `url` の links 移動または `consent`/`system`/`unknown` 除外起因に限定されることを `outputs/phase-11/visual-diff-rationale.md` に記録
- [ ] baseline 更新コミットはユーザー指示後のみ実施

## ドキュメント

- [ ] `phase-12-documentation.md` を canonical 9 headings で記述
- [ ] `artifacts.json` を生成し gate-metadata:validate で zod schema をパス
- [ ] 関連 spec（`docs/30-workflows/unassigned-task/issue-827-followup-001-displayable-kinds-exhaustiveness-guard.md`）に「本ワークフローで吸収」旨を記載（Phase 12 内で実施）

## 外部運用（user-gated）

- [ ] commit / push / PR 作成はユーザー指示後に実施
- [ ] PR base ブランチは `dev`

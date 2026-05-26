# Phase 6: テスト戦略

## テストレイヤー

| レイヤー | テスト種別 | 場所 | 目的 |
|---------|----------|------|------|
| 型 | typecheck | `pnpm typecheck` | `KIND_ROUTE` から 1 key 削ると fail することを保証 |
| unit | adapter spec | `apps/web/src/lib/adapters/__tests__/member-detail.spec.ts` | 網羅性 / 分類除外 / 既存挙動不変 |
| visual | Playwright snapshot | `apps/web/playwright/visual/` | 意図的差分（excluded kind の KV row 消失）以外の regression が無いこと |

## テストケース一覧

### 既存ケース（不変・全件 green 維持）

1. fixture が `PublicMemberProfileZ.parse` を通過する
2. happy path: summary / attendance / tags をそのまま伝播する
3. visibility=member field を除外する
4. visibility=admin のみで構成された section は丸ごと除外
5. unknown kind を silent skip する
6. 入力を mutate しない
7. publicSections が空のとき sections === []
8. 出力 field には visibility / source キーが含まれない

### 新規ケース

| ID | 内容 | 期待 |
|----|------|------|
| TC-EX-01 | `FieldKindZ.options` 全件が `KIND_ROUTE` に存在する | green |
| TC-EX-02 | `KIND_ROUTE` のキーは `FieldKindZ.options` と完全一致 | green |
| TC-EX-03 | kind = `url` の field は出力 `sections.fields` に含まれず `linkSections.fields` に含まれる | green |
| TC-EX-04 | kind = `consent` の field は `sections` / `linkSections` のどちらにも含まれない | green |
| TC-EX-05 | kind = `system` の field は `sections` / `linkSections` のどちらにも含まれない | green |
| TC-EX-06 | kind = `unknown` の field は `sections` / `linkSections` のどちらにも含まれない | green |
| TC-EX-07 | `KIND_ROUTE` を 1 key 削ると `pnpm typecheck` が fail する（ローカル検証のみ。CI ケース化しない） | local evidence として Phase 11 に記録 |

## ローカル検証手順

```bash
# 1. unit test (focused)
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts

# 2. typecheck
mise exec -- pnpm typecheck

# 3. lint
mise exec -- pnpm lint

# 4. coverage（参考）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- \
  src/lib/adapters/__tests__/member-detail.spec.ts
```

## カバレッジ目標

- `apps/web/src/lib/adapters/member-detail.ts` の branch coverage 100%（既存目標を維持）。
- `KIND_ROUTE` 分岐は新規追加 6 ケースで担保される。`url` は除外ではなく `linkSections` route への移動として検証する。

## visual regression テスト

- `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "member detail"` を実行。
- baseline 差分が出る場合は Phase 10 の手順で更新し、`url` の links 移動または excluded kind 除外に限定されることを `outputs/phase-11/visual-diff-rationale.md` に記録する。

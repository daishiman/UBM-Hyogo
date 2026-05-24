# Phase 10: ローカル検証手順

## 実行コマンド (順序通り)

```bash
# 1. 依存
mise exec -- pnpm install

# 2. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. unit test (新規 adapter)
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts

# 4. unit test (更新 component)
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/components/public/__tests__/MemberDetailSections.component.spec.tsx

# 5. PR pre-flight
bash scripts/verify-pr-ready.sh
```

## 手動確認 (任意)

```bash
# ローカル dev で /members/[id] を開き 6 セクション描画 / activity が下部 / リンクが分離 を目視
mise exec -- pnpm --filter @ubm-hyogo/web dev
# → http://localhost:3000/members/<fixture id>
```

## 失敗時切り分け

| 症状 | 切り分け |
|------|---------|
| typecheck `FieldKindZ` 関連エラー | `packages/shared/src/zod/primitives.ts` の enum を確認し `DISPLAYABLE_KINDS` と差分修正 |
| component test fail | adapter で filter 済みを前提に test fixture から `kind: "url"` を除く |
| visual snapshot diff | adapter の `map`/`filter` 順序を確認、render 順序を保存 |

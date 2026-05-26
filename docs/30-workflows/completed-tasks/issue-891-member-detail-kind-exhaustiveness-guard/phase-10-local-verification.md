# Phase 10: ローカル検証

## 検証コマンド一覧

```bash
# 1. 依存
mise exec -- pnpm install

# 2. 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 3. focused unit test
mise exec -- pnpm --filter @ubm-hyogo/web test -- \
  src/lib/adapters/__tests__/member-detail.spec.ts

# 4. coverage（参考）
mise exec -- pnpm --filter @ubm-hyogo/web test:coverage -- \
  src/lib/adapters/__tests__/member-detail.spec.ts

# 5. web 全体 unit test（regression 確認）
mise exec -- pnpm --filter @ubm-hyogo/web test

# 6. build
ENVIRONMENT=local NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787 \
  mise exec -- pnpm --filter @ubm-hyogo/web build

# 7. component integration route 確認
pnpm exec vitest run \
  apps/web/src/components/public/__tests__/MemberLinks.component.spec.tsx \
  --root . --config vitest.config.ts

# 8. visual smoke（snapshot diff 検出用）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "member detail"
```

## typecheck 失敗証跡の取り方

`KIND_ROUTE` から `shortText: "detail",` の 1 行を一時的に削除し、`mise exec -- pnpm typecheck` を実行。出力を `outputs/phase-11/typecheck-fail-evidence.md` に記録。確認後すぐ revert する。

```bash
# 一時削除（手動）→ typecheck 実行
mise exec -- pnpm typecheck 2>&1 | tee /tmp/typecheck-fail.log

# 期待 error メッセージ抜粋:
# Property 'shortText' is missing in type ... but required in type 'Record<FieldKind, KindRoute>'.

# revert
git checkout apps/web/src/lib/adapters/member-detail.ts
```

## visual baseline 更新（差分が出た場合）

```bash
# 1. snapshot を update（diff 内容を必ず先に目視確認）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "member detail" --update-snapshots

# 2. 差分内容を rationale ファイルに記録
# outputs/phase-11/visual-diff-rationale.md に
#   - 影響 spec
#   - diff の中身（url の links 移動 / KV row の消失内容）
#   - 意図的修正の根拠
# を明記

# 3. baseline コミットはユーザー指示後
```

## 検証順序

1. 型 → lint → focused test → coverage → 全体 test → build → visual の順で実行
2. いずれかで fail したら Phase 9 のリスクに該当しないかを確認
3. fixture 依存で失敗する場合は Phase 5 Step 5 に従い fixture を補強

## 環境前提

- Node 24.15.0 / pnpm 10.33.2（`.mise.toml`）
- macOS / Linux いずれも可
- `apps/web` production build は build-time env validation が走るため、ローカル検証では `ENVIRONMENT=local` と `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8787` を付ける。
- Playwright browsers が install 済み（未 install の場合は `pnpm --filter @ubm-hyogo/web exec playwright install chromium`）

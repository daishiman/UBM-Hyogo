# Phase 7: AC 充足検証

タスク仕様の Acceptance Criteria（AC-1〜AC-10）と Phase 4 のテスト ID（T-U-* / T-C-* / T-A-*）を
実装・テストファイルにマッピングし、すべて green であることを確認する。

## 結果サマリ

- AC 充足: **10 / 10**
- typecheck: **Done**（apps/api / packages/integrations / packages/shared）
- vitest: **43 files / 324 tests / すべて green**

→ 個別マッピングは `ac-matrix.md` を参照。

## 主要な検証手順

```bash
# typecheck（Node 24 / pnpm 10 / Workers types 込み）
mise exec -- pnpm typecheck

# 単体・コントラクト・ルートテスト（vitest）
mise exec -- pnpm vitest run

# 03b 関連のみ subset で再検証
mise exec -- pnpm vitest run \
  apps/api/src/jobs/sync-forms-responses.test.ts \
  apps/api/src/jobs/sync-forms-responses.types.test.ts \
  apps/api/src/jobs/mappers/normalize-response.test.ts \
  apps/api/src/jobs/mappers/extract-consent.test.ts \
  apps/api/src/routes/admin/responses-sync.test.ts
```

## 残作業（Phase 8〜10 で扱う）

- E2E（authz × cron × forms 実呼び出し）は **08b** に委譲（共有 fixture が前提）
- Cloudflare staging への deploy 検証は別タスク
- free-tier 試算と secret hygiene は Phase 9 で文書化

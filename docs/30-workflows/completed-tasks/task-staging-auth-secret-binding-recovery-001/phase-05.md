# Phase 5: 実装方針

[実装区分: 実装仕様書]

## 1. 4 spec 並列実装計画

各 spec の詳細は `specs/spec-NN-*.md` を正本とする。本ファイルは並列実装時の差分単位と統合点のみ示す。

| spec | 主担当ファイル | 差分単位 | 統合点 |
|------|----------------|---------|--------|
| spec-01 | runbook only（コード変更なし） | Phase 8 で user 承認後実行 | curl で /admin/members 200 確認 |
| spec-02 | `require-admin.ts` / `env.ts` | logError 追加 + zod schema 追加 | unit test green |
| spec-03 | `backend-ci.yml` / `smoke/*.sh` | auth-gate step 追加 + body grep 分岐 | smoke test green |
| spec-04 | `scripts/cf.sh` | secret put empty guard + `--dry-run` | dry-run test green |

## 2. 順序

1. **並列開始**: spec-02 / spec-03 / spec-04 を並列実装（TDD: RED → GREEN）
2. **統合**: Phase 7 で `mise exec -- pnpm typecheck && pnpm lint && pnpm --filter @ubm-hyogo/api test` を一括実行
3. **user 承認待ち**: Phase 8 で spec-01 recovery 実行（staging → production）
4. **CI 通過確認**: backend-ci runtime smoke green を Phase 8 末で確認

## 3. 不変条件確認

- AUTH_SECRET の値は仕様書 / ログに一切転記しない
- `wrangler` 直接呼出禁止（`scripts/cf.sh` のみ）
- `*.test.*` ファイル名禁止 → `*.spec.{ts,tsx}` のみ
- D1 直接アクセスは `apps/api` に閉じる（本タスク変更なし）

## 4. ローカル実行コマンド

```bash
# 全体
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/api test

# spec-02 個別
mise exec -- pnpm --filter @ubm-hyogo/api test -- require-admin.spec.ts env.spec.ts members.contract.spec.ts

# spec-03 個別
bash scripts/smoke/__tests__/runtime-attendance-provider.test.sh

# spec-04 個別
echo -n "" | bash scripts/cf.sh secret put AUTH_SECRET --env staging --dry-run  # exit 78 期待
```

## 5. Phase 5 DoD

- 4 spec の実装順序と統合点が確定
- 並列実装による衝突 path がないことを Phase 3 依存マップで確認済み
- ローカル検証コマンドが列挙されている

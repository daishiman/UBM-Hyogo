# Phase 7: 品質ゲート

## 必須ゲート

| ゲート | コマンド | 期待 |
|-------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| unit test (web) | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/lib/adapters/__tests__/member-detail.spec.ts` | green |
| component test 更新版 | `mise exec -- pnpm --filter @ubm-hyogo/web test -- src/components/public/__tests__/MemberDetailSections.component.spec.tsx` | green |
| PR pre-flight | `bash scripts/verify-pr-ready.sh` | exit 0 |

## 任意 (確認推奨)

| ゲート | コマンド | 期待 |
|-------|---------|------|
| visual snapshot diff | Playwright workflow_dispatch `visual-full` | baseline 不変 |
| build | `mise exec -- pnpm --filter @ubm-hyogo/web build` | exit 0 |

## 設計トークン / branch protection

本タスクは CSS / 設計トークン変更なし。`verify-design-tokens` gate は影響対象外。

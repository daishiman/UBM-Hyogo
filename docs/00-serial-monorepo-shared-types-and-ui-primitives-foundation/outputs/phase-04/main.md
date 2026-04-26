# Phase 4 成果物: テスト戦略

## Verify Suite 4 種

| # | 種別 | コマンド | 期待 |
|---|------|----------|------|
| 1 | typecheck | `pnpm -r typecheck` | exit 0（全 package） |
| 2 | lint | `pnpm -r lint` | exit 0 |
| 3 | unit | `pnpm test` | Vitest 全 spec PASS |
| 4 | scaffold-smoke | curl /healthz, barrel import | 200 + 15 keys |

## テスト実装一覧

| テストファイル | 対象 | 検証内容 |
|--------------|------|----------|
| apps/web/src/lib/tones.test.ts | zoneTone/statusTone | 7 ケース（zone/status mapping） |
| packages/shared/src/types/ids.test.ts | branded types | string が MemberId 等に代入不可 |
| apps/web/src/components/ui/__tests__/primitives.test.tsx | UI primitives 15 種 | smoke + a11y role |

## AC ↔ test 対応表（→ test-matrix.md 参照）

全 AC が test または運用確認に紐付き済み。

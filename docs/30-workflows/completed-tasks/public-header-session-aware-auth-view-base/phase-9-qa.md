# Phase 9 — 品質保証（QA）

## 1. ゲートチェック

| 項目 | コマンド | 期待 |
|------|---------|------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 |
| lint | `mise exec -- pnpm lint` | exit 0 |
| vitest (focused) | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/lib/auth-view src/components/public/__tests__/PublicHeader.spec.tsx` | 20+ PASS |
| HEX 直書き grep | `rg "#[0-9a-fA-F]{6}" apps/web/src/components/public/PublicHeader.tsx apps/web/src/lib/auth-view` | 0 hit |
| design-token gate（CI 相当） | `mise exec -- pnpm exec eslint apps/web/src/components/public/PublicHeader.tsx` | exit 0 |
| auth-state 列挙チェック | `rg "data-auth-state=\"" apps/web/src/components/public/PublicHeader.tsx` | `guest\|member\|admin` のみ |
| 削除済み参照確認（FB-TASK-01/02） | 該当なし（新規追加のみ） | — |

## 2. 既存テスト回帰確認

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run
```

全 suite で fail 0 件。

## 3. mirror parity

- `.agents/skills/...` 該当なし（本タスクは workflow docs のみ、skill mirror 不要）。

## 4. 完了条件

- [ ] 上記 6 項目すべて exit 0 / 期待値一致
- [ ] artifacts.json の `verify_commands` 全 PASS

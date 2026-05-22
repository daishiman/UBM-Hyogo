# Phase 9: QA / 静的解析

**[実装区分: 実装仕様書]**

## 1. 実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
pnpm exec vitest run apps/web/app/profile/__tests__/error.component.spec.tsx
bash scripts/verify-pr-ready.sh
```

## 2. 期待結果

| ゲート | 期待 |
|---|---|
| `pnpm typecheck` | 0 error |
| `pnpm lint` | 0 error / 0 new warning |
| vitest | 4 passed / 0 failed |
| `verify-pr-ready.sh` | `gate-metadata:validate` PASS / `verify:phase12-compliance` PASS / `indexes:rebuild` drift なし |

## 3. CI 側 verify との対応

| CI gate | 本タスクへの影響 |
|---|---|
| `verify-design-tokens` | 既存 Tailwind class のみ使用 → PASS 想定 |
| `verify-test-suffix` | `*.spec.tsx` 採用 → PASS |
| `verify-indexes-up-to-date` | docs 追加のみで skill indexes 影響なし。万一の drift は `pnpm indexes:rebuild` で解消 |
| `verify-gate-metadata` | `artifacts.json` zod schema 準拠 |
| `playwright-smoke` | profile route の通常レンダリング smoke は別 task。本タスクは error boundary 単体のため smoke 影響なし |

## 4. 静的解析チェックリスト

- [ ] `console.error` 削除確認: `grep "console.error" apps/web/app/profile/error.tsx` → 0 hit
- [ ] `headingRef` 型注釈確認: `useRef<HTMLHeadingElement>(null)`
- [ ] `tabIndex={-1}` 付与確認
- [ ] `role="alert"` + `aria-live="assertive"` 同時付与確認
- [ ] dev stack 表示の `process.env.NODE_ENV` 比較確認
- [ ] CLAUDE.md 不変条件 5 違反なし（D1 binding に触れない）

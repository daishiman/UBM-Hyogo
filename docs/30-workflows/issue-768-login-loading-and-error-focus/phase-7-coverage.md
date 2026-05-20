# Phase 7: カバレッジ

## 1. 目標

| File | Line | Branch | Function | 備考 |
|---|---|---|---|---|
| `apps/web/app/login/loading.tsx` | 100% | 100% | 100% | 純粋 JSX、分岐なし |
| `apps/web/app/login/error.tsx` | 100% | ≥90% | 100% | digest 有無 / focus null path |

## 2. 計測コマンド

```bash
mise exec -- pnpm --filter @ubm/web test -- --coverage app/login/loading.spec.tsx app/login/error.spec.tsx
```

カバレッジ HTML レポートは `apps/web/coverage/` に出力される（vitest 設定既存）。

## 3. uncovered branch の判定基準

| パス | 評価 |
|---|---|
| `headingRef.current?.focus()` の null path | jsdom では ref が常に bind されるため uncovered になる可能性あり。許容（branch 90%） |
| `error.digest ? ... : null` の null 分岐 | TC E-04 でカバー、必須 |

## 4. CI gate

- `apps/web` の vitest coverage threshold は既存設定踏襲（追加 threshold は本タスクで設定しない）
- `verify-design-tokens` gate を local で事前検証:

```bash
mise exec -- pnpm --filter @ubm/web exec eslint --max-warnings=0 app/login
```

`bg-[#...]` / HEX 直書きが検出されないことを確認する。

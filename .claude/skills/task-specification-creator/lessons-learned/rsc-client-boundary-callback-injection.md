# lessons-learned — React Server Component + client wrapper による callback 注入パターン

| 項目 | 値 |
| --- | --- |
| recorded_at | 2026-05-25 |
| trigger workflow | admin-ui-prototype-alignment-followup-002-section-error-retry (#881) |
| 適用範囲 | Server Component から client-only handler を要求する per-section UI 全般 |

## 背景

Next.js App Router の `apps/web/app/(admin)/**/page.tsx` は Server Component（D1 fetch / cookie / `getEnv()` などの server-only API 使用のため）。
そこに `<AdminSectionError onRetry={() => router.refresh()} />` のような **callback prop** を直接書くと、React の serialization constraint に違反して fail する。

## canonical pattern

```
[Server Component page]
    ↓ 静的 props のみ
[AdminSectionError]  ← Server Component compatible・props は serializable のみ
    ↑ onRetry / isRetrying を optional で受け取れる
[AdminSectionErrorClient]  ← 'use client' 境界
    内部で useRouter() / useTransition() を呼び、
    onRetry={() => startTransition(() => router.refresh())} を合成
```

## L-RSC-001 — 「pageの 'use client' 化」は禁じ手

- **学び**: 1 page でも `'use client'` を付けると server-only API（D1 binding / cookies / `getEnv()` throw boundary）が崩れる。
- **解決**: 境界は「ページ全体」ではなく「callback を必要とする UI コンポーネント」だけに置く。

## L-RSC-002 — base component は server-compatible のまま、client wrapper を別ファイルで

- **学び**: `AdminSectionError` 自体に `'use client'` を付けると、Server Component から import した瞬間に Suspense / streaming 戦略が崩れる。
- **解決**: base component（presentational）は server-compatible（`'use client'` なし、hook なし）に保ち、`AdminSectionErrorClient.tsx` のような薄い wrapper を追加して内部で hook を使う。
- **副次効果**: テストは「presentational 単体」「wrapper 配線」を分離できる（mock-injection 不要 vs `vi.mock('react')` 必要）。

## L-RSC-003 — base component の retry 関連 prop は全 optional

- **学び**: `onRetry` を required にすると、retry を必要としない呼び出し元（fallback UI / 静的エラー）も全て書き換える破壊変更になる。
- **解決**: `onRetry?` / `isRetrying?` / `retryLabel?` を **全 optional** にし、`{onRetry ? <button …/> : null}` で render を分岐する。v1 利用箇所は無改修。

## L-RSC-004 — useTransition unit test は mock-injection で

- **学び**: test 環境で `useTransition()` の transition callback は同期実行されるため、`isPending=true` の瞬間を fireEvent.click 後の assert で観測できない。
- **解決**: `vi.mock('react', async () => ({ ...await vi.importActual('react'), useTransition: () => useTransitionMock() }))` で module-level 切替え可能な mock を注入し、`[true, fn]` / `[false, fn]` で AC-3/AC-4 を直接 verify する。
- **代替案棄却**: Suspense + async refresh の実 transition を組むのは unit test スコープ外。

## L-RSC-005 — admin page 横展開時は `'use client'` grep gate を Phase 11 evidence に含める

- **学び**: 複数ページ横展開で 1 ファイルでも `'use client'` を残すと SSR / D1 経路が壊れる。
- **解決**: `outputs/phase-11/grep-use-client-result.md` のような evidence を inventory に常設化し、Phase 12 compliance check で existence verify する。
- **CI 自動化候補**: `verify:no-use-client-in-admin-pages` script の追加。

## 関連

- `.claude/skills/task-specification-creator/references/server-component-e2e-pattern.md`
- `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-admin-section-error-retry-2026-05.md`

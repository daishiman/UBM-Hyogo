# lessons-learned — admin-ui-prototype-alignment-followup-002-section-error-retry (2026-05)

| 項目 | 値 |
| --- | --- |
| workflow | `admin-ui-prototype-alignment-followup-002-section-error-retry` |
| source_issue | #881 (CLOSED) |
| status | implementation_reviewed / NON_VISUAL |
| recorded_at | 2026-05-25 |

## 範囲

`AdminSectionError` への retry CTA 拡張と、Server Component 配下からの `router.refresh()` 呼び出し方式の確定。

## L-ASR-001 — Server Component から callback prop を直接渡せない

- **学び**: `apps/web/app/(admin)/admin/*/page.tsx` は Server Component。`onRetry={() => router.refresh()}` を直接書くと "Functions cannot be passed directly to Client Components" で fail する。
- **解決**: `'use client'` 境界を持つ薄い wrapper（`AdminSectionErrorClient`）を `_shared/` 配下に置き、内部で `useRouter()` + `useTransition()` を呼んで `AdminSectionError` に props として配線する。
- **適用条件**: Server Component から「retry / refresh / dismiss」など UI 駆動の callback を必要とする per-section error UI 全般。
- **逆パターン禁止**: ページ全体を `'use client'` にしない（D1 fetch / cookie 読み取り等の server-only API が壊れる）。

## L-ASR-002 — base component の v1 互換維持

- **学び**: `AdminSectionError.tsx`（Server Component compatible）の API を破壊変更すると、すでに `onRetry` 未指定で使っている呼び出し元が一斉に壊れる。
- **解決**: `onRetry` / `isRetrying` / `retryLabel` を **すべて optional** にし、未指定なら button を render しない（`{onRetry ? <button …/> : null}`）。`AdminSectionError` 単独テストは v1 仕様を保持。
- **検証**: `AdminSectionError.spec.tsx` の AS-1（onRetry 未指定で button 描画なし）を残し、AS-2..AS-7 で新仕様を追加。

## L-ASR-003 — useTransition の単体テストは mock-injection で

- **学び**: `useTransition()` は test 環境では transition callback を同期実行するため、`isPending=true` の瞬間を観測できない。fireEvent.click 後に状態 assert しても常に false。
- **解決**: `vi.mock('react', …)` で `useTransition` を差し替え、`[true, fn]` / `[false, fn]` を切り替えるテストヘルパー（module-level `let useTransitionMock`）を用意する。AC-3/AC-4 はこの方式で直接 wrapper の配線（`isPending → isRetrying`）を verify する。
- **代替案棄却**: 実 transition を待つには Suspense boundary + async refresh が必要で、unit test スコープを超える。

## L-ASR-004 — admin page の Server Component 化を grep gate で守る

- **学び**: 横展開（11 admin pages を差し替え）で 1 ページでも `'use client'` を残すと SSR 性能 / D1 binding 経路が壊れる。
- **解決**: Phase 11 evidence に `grep-use-client-result.md`（`apps/web/app/(admin)/admin/**/page.tsx` 配下に `'use client'` が無いことの grep 結果）を inventory 化し、Phase 12 で existence check する。
- **CI 反映候補**: ESLint custom rule か `verify:no-use-client-in-admin-pages` script の追加余地あり（follow-up）。

## L-ASR-005 — same-wave 同期で lessons-learned を落としやすい

- **学び**: 今回 resource-map / quick-reference / task-workflow-active / LOGS / changelog / artifact-inventory / topic-map の 7 同期は実施したが、**lessons-learned だけ忘れた**（読み取り専用監査で検出）。
- **解決**: 同一 wave の同期 checklist に「lessons-learned エントリ作成」を常設項目として固定。skill-creator 側 workflow に Phase 12 close-out として明示する（feedback report に記載済み）。

## 関連

- [[lessons-learned-rsc-client-boundary-2026-05]] — task-specification-creator 側の RSC + client wrapper canonical pattern
- `changelog/20260525-admin-ui-prototype-alignment-followup-002-section-error-retry.md`
- `references/workflow-admin-ui-prototype-alignment-followup-002-section-error-retry-artifact-inventory.md`

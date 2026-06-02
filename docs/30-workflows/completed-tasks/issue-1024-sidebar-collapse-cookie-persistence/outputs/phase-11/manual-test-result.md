# manual-test-result — issue-1024（NON_VISUAL 証跡）

> GitHub Issue #1024 は CLOSED のまま現行コードへ再スコープ（reopen しない）。
> タスク種別 = NON_VISUAL。focused local evidence は取得済み。commit / push / PR は user-gated。

## セクション1: メタ情報

| 項目 | 値 |
|------|----|
| タスク種別 | NON_VISUAL |
| 非視覚的理由 | 新規 UI surface なし。collapse 状態の seed / 永続化 mechanism（localStorage → cookie + SSR seed）変更のみで、レンダリング結果のレイアウト・配色・寸法は不変。 |
| 主証跡（primary source） | focused vitest: `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` |
| 件数 | 3 files / 15 tests PASS |
| 補助証跡 | SSR HTML seed inspection（`view-source` の `data-shell-collapsed` 値が cookie と一致） |
| screenshot を作らない理由 | UI/UX 見た目に変更がなく、視覚回帰比較が成立しない。状態 seed の正しさは DOM 属性値（`data-shell-collapsed`）と vitest アサーションで証明する。 |
| 実行状態 | focused local evidence captured |

## セクション2: 実施手順

1. `pnpm typecheck` / `pnpm lint` を実行し green を確認。
2. `pnpm exec vitest run --config vitest.config.ts apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts apps/web/src/components/shell/__tests__/useSidebarState.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` を実行し全 pass を確認。
3. dev サーバで shell 配下画面を開き collapse toggle → リロードで維持を確認。
4. `document.cookie` に `ubm_shell_collapsed=...` を確認、Application タブで `path=/` / `SameSite=Lax` / `max-age` / not httpOnly を確認。
5. `view-source:` で初回 HTML の `data-shell-collapsed` が cookie と一致、ちらつき・hydration warning なしを確認。

## セクション3: 仕様判断根拠

- 「初回ちらつき排除」は視覚効果ではなく **SSR seed と client 初期 render の同値化**で達成される。よって
  screenshot ではなく SSR HTML 属性検査が正当な証跡となる（NON_VISUAL）。
- cookie I/O は単一 module（`shell-collapse-cookie.ts`）に集約し、vitest で parser/reader/writer を直接検証できる。
- hook 戻り値 shape 不変・引数 optional 追加のため、既存 consumer の振る舞い回帰は既存 spec の通過で担保。

## セクション4: 実行記録

| チェック | 結果 | log / 値 |
|----------|------|----------|
| `pnpm typecheck` | PASS | `pnpm --filter @ubm-hyogo/web lint` 内の `tsc -p tsconfig.json --noEmit` で確認 |
| `pnpm lint`（lint-boundaries 含む） | PASS | `pnpm --filter @ubm-hyogo/web lint` exit 0 |
| focused vitest 全 pass（件数） | PASS | 3 files / 15 tests PASS |
| `document.cookie` 確認 | PASS (unit) / manual pending | writer spec で `document.cookie` に `ubm_shell_collapsed=true` を確認。DevTools manual は user-gated |
| cookie 属性確認 | PASS (unit) / manual pending | serializer spec で `Path=/` / `SameSite=Lax` / `Max-Age=31536000` を確認。DevTools manual は user-gated |
| SSR seed propagation | PASS | `SidebarShell.server.spec.tsx` cookie mock で `data-shell-collapsed="true"` |
| ちらつき / hydration warning なし | MANUAL PENDING | browser runtime smoke は user-gated |

> Browser/manual confirmation, commit, push, PR, and remote CI remain user-gated.

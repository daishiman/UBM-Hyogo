# Phase 11 — 手動テスト結果（VISUAL）

## タスク種別

本タスクは **VISUAL（視覚変更あり）**。左サイドバー折りたたみ時のアイコン縦間隔を
展開時と一致させる className 変更を実装済み。local visual capture harness / Playwright spec は追加済み。
PNG 実体取得は Next dev webServer 起動待ち timeout により未完了。認証付き staging screenshot は Gate-C / user-gated。

## 証跡の主ソース（自動テスト）

| テストファイル | 対象 | 結果 |
| --- | --- | --- |
| `apps/web/src/components/shell/SidebarNavItem.spec.tsx` | collapsed / expanded の icon-box className・DOM 不変・中央寄せ | PASS |
| `apps/web/src/components/shell/SidebarShell.spec.tsx` | 公開サイトに戻るリンクの collapsed icon-box・シェル全体構造 | PASS |

実行コマンド:

```bash
pnpm exec vitest run --config=vitest.config.ts apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx
pnpm --filter @ubm-hyogo/web typecheck
pnpm --filter @ubm-hyogo/web verify-design-tokens
git diff --stat -- apps/api
```

## screenshot 境界

- local deterministic evidence は取得済み。
- local screenshot capture command は追加済み:
  `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts`
- 2026-06-11 実行では Next dev webServer が 240s 以内に `/visual-harness/admin-sidebar-spacing-collapsed` を返さず、手動 retry も instrumentation / middleware / visual-harness compile 中に timeout。
- 認証付き staging visual smoke は user 明示承認後（Gate-C）に限定されるため、本サイクルでは pending。
- screenshot は未取得を PASS と主張せず、runtime blocked / staging pending として保持する。

## screenshot canonical 4名（staging/user-gated）

| canonical 名 | 取得状態 |
| --- | --- |
| `sidebar-collapsed-before.png` | not_reproducible_after_code_change_without_reverting |
| `sidebar-collapsed-after.png` | capture_spec_added_runtime_blocked |
| `sidebar-expanded-reference.png` | capture_spec_added_runtime_blocked |
| `sidebar-collapsed-after-footer.png` | capture_spec_added_runtime_blocked |

## 実施情報

| 項目 | 値 |
| --- | --- |
| 実施者 | Codex |
| 実施環境 | local |
| 実施日時 | 2026-06-11 |
| workflow_state | implemented_local_runtime_pending |
| 結果 | local deterministic evidence PASS / local capture harness added but runtime blocked / staging screenshot pending |

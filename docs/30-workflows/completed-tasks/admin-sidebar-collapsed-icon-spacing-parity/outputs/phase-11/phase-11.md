**[実装区分: 実装仕様書]**

# Phase 11: 手動テスト検証（VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_runtime_pending |
| implementation_mode | new |
| branch | feat/admin-sidebar-collapsed-icon-spacing-parity |
| evidence canonical path（非視覚ログ） | `outputs/phase-11/evidence/` |
| evidence canonical path（screenshot） | `outputs/phase-11/screenshots/` |

> 本タスクは視覚変更（左サイドバー折りたたみ時のアイコン縦間隔）を含む。実装と local deterministic evidence は取得済み。
> local screenshot capture harness / Playwright spec は追加済み。現時点の PNG 実体は未取得で、認証付き staging visual smoke / screenshot は user 明示承認後（Gate-C）に残す。

## 実装内容

真因は `apps/web/src/components/shell/SidebarNavItem.tsx` のアイコンラッパー span が
collapsed 時 `h-10 w-10`（40px 四方）である一方、`ShellIcon` の SVG グリフは固定 18×18pxであること。
`h-10` はグリフを拡大せず、上下に余白だけを生む。修正は collapsed を `h-[18px] w-10` に縮小し、
`SidebarShell.tsx` の「公開サイトに戻る」リンクも同じ縦リズムへ統一した。

## 成果物

### 非視覚 evidence ログ（`outputs/phase-11/evidence/`）

| ファイル | 内容 | 状態 |
| --- | --- | --- |
| `typecheck.log` | `pnpm --filter @ubm-hyogo/web typecheck` | present |
| `lint.log` | `pnpm --filter @ubm-hyogo/web lint` | present |
| `tokens.log` | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | present |
| `vitest-sidebar.log` | `SidebarNavItem.spec.tsx` / `SidebarShell.spec.tsx` PASS ログ | present |
| `git-diff-apps-api.log` | `git diff --stat -- apps/api` の結果（差分 0） | present |

### local screenshot capture harness（追加済み / runtime blocked）

| 項目 | 内容 | 状態 |
| --- | --- | --- |
| harness route | `/visual-harness/admin-sidebar-spacing-collapsed` | added |
| harness route | `/visual-harness/admin-sidebar-spacing-expanded` | added |
| Playwright spec | `apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts` | added |
| config wiring | `apps/web/playwright.parallel09.config.ts` | added |
| capture command | `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts` | attempted |
| last result | Next dev webServer が 240s 以内に `/visual-harness/admin-sidebar-spacing-collapsed` を返さず、手動 retry も instrumentation / middleware / visual-harness compile 中に timeout | blocked_before_test_execution |

### screenshot canonical 4名

| canonical 名 | 内容 | 状態 |
| --- | --- | --- |
| `sidebar-collapsed-before.png` | 修正前。折りたたみ時の広い縦間隔 | not_reproducible_after_code_change_without_reverting |
| `sidebar-collapsed-after.png` | 修正後。折りたたみ時のピッチが展開と一致 | capture_spec_added_runtime_blocked |
| `sidebar-expanded-reference.png` | 展開時の基準ピッチ（比較対象） | capture_spec_added_runtime_blocked |
| `sidebar-collapsed-after-footer.png` | 修正後の「公開サイトに戻る」リンク部（footer）のピッチ統一 | capture_spec_added_runtime_blocked |

## 完了条件

- [x] `SidebarNavItem.tsx` collapsed icon-box を `h-[18px] w-10` へ変更
- [x] `SidebarShell.tsx` admin public-return icon-box を `h-[18px] w-10` へ変更
- [x] `SidebarShell.spec.tsx` / `SidebarNavItem.spec.tsx` 既存 spec 全 PASS（DOM 不変）
- [x] 非視覚ログ（typecheck / tokens / vitest / apps-api diff）が `evidence/` に保存済み
- [x] `apps/api` 差分 0
- [x] local visual capture harness / Playwright spec を追加
- [ ] PNG screenshot 実体は runtime blocker 解消後、または staging user 明示承認後に取得

## 受入条件との対応

| AC | 証跡 |
| --- | --- |
| AC-1 折りたたみピッチ==展開±2px | collapsed / expanded とも icon-box 高さ `h-[18px]` assertion |
| AC-2 グリフ18px不変 | `ShellIcon` SVG 固定 18×18px、container 高さのみ変更 |
| AC-3 中央寄せ維持 | collapsed の link `w-full justify-center` + icon-box `w-10` |
| AC-4 a11y・DOM不変 | `vitest-sidebar.log` |
| AC-5 公開サイトに戻るリンク統一 | `SidebarShell.spec.tsx` public-return `h-[18px] w-10` assertion |
| AC-6 apps/api差分0 | `git-diff-apps-api.log` |
| AC-7 web vitest 回帰なし+追加テストPASS | `vitest-sidebar.log` |

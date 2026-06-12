# Phase 12 — 集約 entry

| 項目 | 値 |
| --- | --- |
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| workflow_state | implemented_local_runtime_pending |
| task_type | implementation |
| visual_category | VISUAL_ON_EXECUTION |
| branch | feat/admin-sidebar-collapsed-icon-spacing-parity |
| related_issue | null |

## 概要

staging 左サイドバーで、折りたたみ（アイコンのみ）時のアイコン縦間隔が展開（アイコン+ラベル）時より
広い問題を、展開と一致させる。`apps/web` 表現層（CSS className）のみの修正。API/D1/Form 非接触。

## Phase 別 entry

| Phase | 成果物 | 状態 |
| --- | --- | --- |
| Phase 11 | `outputs/phase-11/phase-11.md`（local deterministic evidence / VISUAL capture harness） | local evidence captured / screenshot runtime blocked |
| Phase 12 | strict 7 成果物（本ディレクトリ） | completed |
| Phase 13 | `outputs/phase-13/phase-13.md`（PR作成 / user承認後） | pending |

### Phase 12 strict 7 成果物

| ファイル | 役割 |
| --- | --- |
| `main.md` | 本集約 entry |
| `implementation-guide.md` | Part1 中学生レベル + Part2 技術者 |
| `system-spec-update-summary.md` | 正本 spec 更新要否判定（N/A） |
| `documentation-changelog.md` | docs 同期記録 |
| `unassigned-task-detection.md` | 未タスク検出（current 0 / baseline 候補） |
| `skill-feedback-report.md` | skill 改善観点 |
| `phase12-task-spec-compliance-check.md` | canonical 9 見出し逐語 compliance |

## Local validation 記録枠

| 検証 | コマンド | 期待 | 結果 |
| --- | --- | --- | --- |
| typecheck | `pnpm --filter @ubm-hyogo/web typecheck` | exit 0 | PASS |
| lint | `pnpm --filter @ubm-hyogo/web lint` | exit 0 | PASS |
| design-token gate | `pnpm --filter @ubm-hyogo/web verify-design-tokens` | exit 0 | PASS |
| 対象 vitest | `pnpm exec vitest run apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx apps/web/src/components/shell/__tests__/SidebarShell.spec.tsx` | 全 PASS（追加テスト含む） | PASS |
| screenshot harness | `apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts` | collapsed/expanded/footer PNG を `outputs/phase-11/screenshots/` へ保存 | added |
| screenshot execution | `pnpm --dir apps/web exec playwright test --config=playwright.parallel09.config.ts apps/web/playwright/tests/visual/admin-sidebar-spacing.spec.ts` | ピッチ ±2px 一致 | blocked_before_test_execution（Next dev webServer timeout） |
| staging | staging visual smoke | 目視一致 | pending（user 承認後 / Gate-C） |

> 実装と local deterministic evidence は取得済み。local screenshot capture 経路は追加済みだが、2026-06-11 実行では Next dev webServer が対象 harness URL を返さず PNG 実体は未取得。認証付き staging visual smoke / screenshot と PR は user 明示承認後。

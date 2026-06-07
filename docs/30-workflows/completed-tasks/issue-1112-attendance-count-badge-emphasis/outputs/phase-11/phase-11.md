# Phase 11 — 手動テスト（VISUAL_ON_EXECUTION）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 11.1 VISUAL_ON_EXECUTION 宣言

| key | value |
| --- | --- |
| タスク種別 | implementation task（UI / 意匠変更を伴う VISUAL タスク・local 実装済み） |
| workflow_state | `implemented_local_evidence_captured` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| 実 screenshot | **present（local Playwright fixture 3 PNG）**。staging `/admin/meetings` の追加取得は user-gated |

本タスクは `/admin/meetings` 開催日タイムラインの出席人数バッジに 3 段階色強調（none=0名 / normal=1〜9名 / high=10名以上）を加える VISUAL タスクである。実コード変更、local 機械検証、local Playwright fixture screenshot 3 点は完了済み。staging screenshot は deploy と runtime access が必要なため user-gated pending とする。

## 11.2 local screenshot と staging runtime 境界

バッジの色は `globals.css` の `.admin-timeline__heading .ui-badge[data-attendance-level]` セレクタが CSS カスタムプロパティ（design token の `var(--...)`）経由で解決する。具体的には:

- `data-attendance-level="none"` → neutral（0名・未登録）
- `data-attendance-level="normal"` → accent-soft（1〜9名・通常）
- `data-attendance-level="high"` → success-bg（10名以上・多数出席強調）

この **CSS var → 実 RGB の算出色は、実ブラウザの描画エンジンでのみ確定**する。`MeetingTimeline.tsx` が出力する `<span className="ui-badge" data-attendance-level="...">` の **属性値** は jsdom（vitest）で検証できるが、jsdom は CSS の cascade と `var()` 解決を実描画しない。したがって local Playwright fixture で実ブラウザ screenshot を取得し、3 レベルの表示を `outputs/phase-11/screenshots/` に保存する。production-equivalent な staging runtime での追加確認のみ user-gated として残す。

## 11.3 取得済み screenshot（local Playwright fixture・3 点）

`manual-test-result.md` / `phase11-capture-metadata.json` / `screenshot-plan.json` と canonical 名を一致させる。

| TC | ファイル | シナリオ | route | component | runtime |
| --- | --- | --- | --- | --- | --- |
| TC-BADGE-01 | `screenshots/attendance-badge-level-none.png` | 出席 0 名（未登録）バッジ = neutral | `/admin/meetings` | `MeetingTimeline` | local Playwright fixture |
| TC-BADGE-02 | `screenshots/attendance-badge-level-normal.png` | 出席 1〜9 名 = accent（通常） | `/admin/meetings` | `MeetingTimeline` | local Playwright fixture |
| TC-BADGE-03 | `screenshots/attendance-badge-level-high.png` | 出席 10 名以上 = success（多数出席強調） | `/admin/meetings` | `MeetingTimeline` | local Playwright fixture |

詳細手順・判定は `manual-test-result.md`、capture メタは `phase11-capture-metadata.json`、実行結果は `screenshot-inventory.json` を参照。staging 追加取得は Phase 13 の user-gated 境界に残す。

## 11.4 local 証跡（data-attendance-level 属性 assertion）

実 screenshot 取得前の local 証跡として、`MeetingTimeline.tsx` が算出した出席レベルに応じた `data-attendance-level` 属性値の DOM assertion と、レベル算出ロジックの境界テストを用いる。

| 検証 | 期待 |
| --- | --- |
| `MeetingTimeline.spec.tsx`: 出席 0 名のバッジ `data-attendance-level` | `"none"` |
| `MeetingTimeline.spec.tsx`: 出席 5 名のバッジ `data-attendance-level` | `"normal"` |
| `MeetingTimeline.spec.tsx`: 出席 12 名のバッジ `data-attendance-level` | `"high"` |
| `meetingStats.spec.ts`: レベル算出の境界（0 → none / 1 → normal / 9 → normal / 10 → high） | 各境界が期待レベルに分類される |

実行結果:

- `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts`
- `PLAYWRIGHT_EVIDENCE_TASK=task-18-w7 PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1112-attendance-count-badge-emphasis/outputs/phase-11 pnpm --filter @ubm-hyogo/web exec playwright test --project=desktop-chromium playwright/tests/issue1112-attendance-badge-emphasis.spec.ts`
- 結果: 2 files / 20 tests PASS
- `pnpm --filter @ubm-hyogo/web typecheck`: PASS
- `pnpm --filter @ubm-hyogo/web verify-design-tokens`: PASS
- Playwright local fixture: PASS（3 PNG captured）

> 属性値・境界ロジックは jsdom で機械検証し、属性 → 実色（neutral/accent/success）の対応は local Playwright fixture screenshot で確認する。staging screenshot は production-equivalent runtime の追加確認として user-gated に残す。

## 11.5 既知の制限

- jsdom（vitest）は CSS の `var()` 解決と cascade を実描画しないため、`data-attendance-level` の属性値は検証できるが「実際の色」は検証できない。実色は local Playwright fixture screenshot で確認する。
- staging `/admin/meetings` の production-equivalent runtime screenshot は user 承認後に追加取得する。

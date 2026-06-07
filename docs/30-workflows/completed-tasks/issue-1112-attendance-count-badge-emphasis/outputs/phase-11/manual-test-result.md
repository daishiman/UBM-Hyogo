# Phase 11 — 手動テスト結果（VISUAL・local PASS + local screenshot present / staging pending）

## 証跡メタ

| key | value |
| --- | --- |
| taskId | `issue-1112-attendance-count-badge-emphasis` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| workflow_state | `implemented_local_evidence_captured` |
| 証跡の主ソース | `MeetingTimeline.spec.tsx` の `data-attendance-level` 属性 assertion（0→none / 5→normal / 12→high） + `meetingStats.spec.ts` のレベル境界テスト + local Playwright fixture screenshot 3 PNG |
| screenshot | `outputs/phase-11/screenshots/attendance-badge-level-{none,normal,high}.png` present |
| capturedAt | `screenshot-inventory.json` を参照 |

> 本タスクは `implemented_local_evidence_captured` であり、実コード、local 機械検証、local Playwright screenshot 3 点は完了済み。staging での production-equivalent 追加 screenshot は user 承認後に取得する。

## 共通前提（local Playwright fixture）

- `apps/web/playwright/tests/issue1112-attendance-badge-emphasis.spec.ts` が mock API に出席 0 名・5 名・12 名の開催回を seed する。
- `/admin/meetings` を local admin session で開けること。
- 各バッジは `.admin-timeline__heading` 内の `<span className="ui-badge" data-attendance-level="...">` であり、開発者ツールで `data-attendance-level` の値も合わせて確認する。

## TC-BADGE-01 — 出席 0 名（未登録）バッジ = neutral

| 項目 | 内容 |
| --- | --- |
| シナリオ | 出席 0 名の開催回 |
| 手順 | local Playwright fixture で `/admin/meetings` を開き、出席 0 名の開催回のタイムライン見出し（`.admin-timeline__heading`）の出席人数バッジを確認する |
| 期待 | バッジが neutral（控えめ・グレー系）で描画され、強調されていない。`data-attendance-level="none"` |
| screenshot | `screenshots/attendance-badge-level-none.png` |
| capturedAt | `screenshot-inventory.json` を参照 |
| 判定 | PASS |

## TC-BADGE-02 — 出席 1〜9 名 = accent（通常）

| 項目 | 内容 |
| --- | --- |
| シナリオ | 出席 1〜9 名（数名）の開催回 |
| 手順 | local Playwright fixture で `/admin/meetings` を開き、出席人数が 1〜9 名の開催回のバッジを確認する |
| 期待 | バッジが accent-soft（通常の強調）で描画され、none と明確に色が分かれる。`data-attendance-level="normal"` |
| screenshot | `screenshots/attendance-badge-level-normal.png` |
| capturedAt | `screenshot-inventory.json` を参照 |
| 判定 | PASS |

## TC-BADGE-03 — 出席 10 名以上 = success（多数出席強調）

| 項目 | 内容 |
| --- | --- |
| シナリオ | 出席 10 名以上（二桁）の開催回 |
| 手順 | local Playwright fixture で `/admin/meetings` を開き、出席人数が 10 名以上の開催回のバッジを確認する |
| 期待 | バッジが success-bg（多数出席強調）で描画され、normal とも明確に色が分かれる。`data-attendance-level="high"` |
| screenshot | `screenshots/attendance-badge-level-high.png` |
| capturedAt | `screenshot-inventory.json` を参照 |
| 判定 | PASS |

## local で確定済みの代替証跡（jsdom で検証可能）

| 検証 | 期待 |
| --- | --- |
| `MeetingTimeline.spec.tsx`: 出席 0 名 → `data-attendance-level="none"` | PASS |
| `MeetingTimeline.spec.tsx`: 出席 5 名 → `data-attendance-level="normal"` | PASS |
| `MeetingTimeline.spec.tsx`: 出席 12 名 → `data-attendance-level="high"` | PASS |
| `meetingStats.spec.ts`: レベル境界 0→none / 1→normal / 9→normal / 10→high | PASS |
| focused Vitest | 2 files / 20 tests PASS |
| web typecheck | PASS |
| verify-design-tokens | PASS |
| local Playwright fixture screenshot | PASS（3 PNG present） |

> 属性値・境界は機械検証で担保し、実色と視認性は上記 3 TC の local Playwright screenshot で確認する。staging screenshot は追加の runtime 確認として user-gated に残す。

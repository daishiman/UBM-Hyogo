`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 10: 最終レビュー

## 目的

issue #1112 の出席人数バッジ 3 段階色強調について、受け入れ条件（AC-1〜AC-7）の充足を mapping し、BLOCKER の不在と MINOR 候補の未タスク化方針を整理する。本タスクは `implemented_local_evidence_captured` であり、実装と local 機械検証は完了済みである。

## 10.1 AC 充足 mapping

| AC | 内容 | 充足手段（参照 Phase） | 見込み |
|----|------|------|------|
| AC-1 | 閾値に応じ `data-attendance-level` が `none`（0）/`normal`（1〜9）/`high`（10+）に変化 | `attendanceLevel` pure function（Phase 5）+ badge 属性配線（Phase 5）+ A-1..A-7 / B-1..B-3（Phase 4/6） | 充足 |
| AC-2 | 閾値が `ATTENDANCE_LEVEL_THRESHOLDS` 定数 1 箇所に集約・明記 | Phase 2/5（`{ high: 10 } as const`）+ Phase 8 集約判断 | 充足 |
| AC-3 | 強調色が全て既存 OKLch トークン経由（または `oklch()` 直値先例準拠）で HEX / `bg-[#xxx]` / `text-[#xxx]` 無し | Phase 5 CSS + Phase 9 Q-3/Q-4（HEX grep / `verify-design-tokens`） | 充足 |
| AC-4 | 新規 primitive を増やさず `.ui-badge` への属性 + `.admin-timeline__heading` scoped CSS で構成 | Phase 5（scoped セレクタ）+ Phase 8 scope 判断 | 充足 |
| AC-5 | 既存 `MeetingTimeline.spec.tsx` / `meetingStats.spec.ts` が green（既存挙動 drift なし） | Phase 9 Q-5（既存 6 ケース + meetingStats 既存ケース非回帰） | 充足 |
| AC-6 | 色のみ静的強調で animation 無し → `prefers-reduced-motion` 不要（旨を明記） | Phase 5 実装メモ（transition/animation 不使用を明記） | 充足 |
| AC-7 | typecheck / focused Vitest / `verify-design-tokens` PASS | Phase 9 Q-1/Q-4/Q-5 | 充足 |

→ 全 AC が設計・テスト・検証手順で被覆される。BLOCKER は存在しない。

## 10.2 BLOCKER 判定

| 観点 | 判定 |
|------|------|
| 不変条件抵触（API / D1 / Form / token / primitive） | なし（既存 API のみ・D1 非アクセス・Form 不変・新規トークン無し・新規 primitive 無し） |
| gate 抵触（`verify-design-tokens` / `verify-test-suffix`） | なし（HEX 無し・`*.spec.*` 追記のみ） |
| 既存テスト破壊 | なし（追加のみ・既存 assertion 不変） |
| スコープ逸脱 | なし（5 ファイル編集に閉じる） |

**BLOCKER: 0 件。**

## 10.3 MINOR 候補と未タスク化判断

| ID | 候補 | 内容 | 判断 |
|----|------|------|------|
| MINOR-1 | 閾値の実分布チューニング | `high=10` は小規模会の起点デフォルト。実出席分布が判明したら `ATTENDANCE_LEVEL_THRESHOLDS.high` を調整する余地がある | **未タスク化しない**。閾値は起点デフォルトとして本タスクで確定済み。調整は単一 tuning point の 1 行変更で運用対応でき、新規実装不要 |
| MINOR-2 | animation / transition 強調 | 色変化に fade 等の演出を加える enhancement の余地 | **未タスク化しない**。本タスクは静的色強調のみと明示スコープ（Phase 1 含まない）。animation は別件・明確なスコープ外であり、新規未タスク化は原則 0 件方針に従い起票しない |
| MINOR-3 | 中間段階（4 段階以上）への拡張 | none/normal/high の 3 段を更に細分する余地 | **未タスク化しない**。3 段で運用者の関心（未登録 / 通常 / 盛況）を満たす。細分は実需要が出た時点で別途検討 |

→ MINOR は全て「未タスク化しない」。本タスクで新規に起票する未タスクは原則 0 件方針とし、最終的な current/baseline 判定は Phase 12 に委ねる。

## 10.4 Summary verdict

- **設計品質**: 責務分離（判定 / 表示 / 配色 / トークン）が成立。命名一貫・閾値単一 tuning point・scope による波及遮断を満たす。
- **AC 充足**: AC-1〜AC-7 を Phase 4/5/6/8/9 の成果物で全被覆。
- **gate / 不変条件**: 既存 API のみ・新規トークン/primitive 無し・HEX 無し・`*.spec.*` 追記のみで、`verify-design-tokens` / `verify-test-suffix` と非干渉。
- **BLOCKER**: 0 件。**MINOR**: 3 件、いずれも未タスク化しない（明示スコープ外 or 起点デフォルトで確定済み）。
- **総括判定**: 本実装は issue #1112 を local で満たす。実装区分 = 実装仕様書 / 状態 = implemented_local_evidence_captured。Phase 11 の staging runtime visual と Phase 13 の GitHub 操作のみ user-gated。

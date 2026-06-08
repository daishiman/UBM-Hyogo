# Phase 1 — 要件定義

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 1.1 タスク分類

| key | value |
| --- | --- |
| タスク種別 | UI task（admin タイムラインの出席人数バッジに色強調を追加する VISUAL タスク） |
| implementation_mode | `new`（RED/GREEN サイクルで新規ロジック + スタイルを追加） |
| visualEvidence | `VISUAL_ON_EXECUTION`（バッジ色変化は local Playwright screenshot で確認し、staging screenshot は追加確認として user-gated） |
| docs-only か | いいえ（CONST_004: コード変更なしでは AC を達成不可） |

## 1.2 P50 前提確認

| 確認項目 | 結果 | 対応 |
| --- | --- | --- |
| current branch に実装が存在するか | No（`rg "attendance-level\|多数出席" apps/web/src` = 0 件） | 通常の実装 Phase（RED/GREEN） |
| upstream（dev/main）にマージ済みか | No（親 workflow 以降 `MeetingTimeline.tsx` への色強調コミット無し） | 未マージとして扱う |
| 前提タスク（依存）が完了済みか | Yes（親 `admin-meetings-attendance-404-fix-and-ux` で人数バッジ表示は実装済み） | 依存解消タスク不要 |

→ `implementation_mode: new`。Phase 4 = テスト作成（RED）、Phase 5 = 実装（GREEN）。

## 1.3 スコープ

### 含む

- 出席人数バッジの色強調（未登録 / 通常 / 多数出席の 3 段階）の視覚演出。
- `meetingStats.ts` への出席レベル判定 pure function（`attendanceLevel`）と閾値定数（`ATTENDANCE_LEVEL_THRESHOLDS`）の追加。
- `MeetingTimeline.tsx` のバッジへの `data-attendance-level` 属性付与。
- `globals.css` への既存 OKLch トークン経由の scoped 強調スタイル追加。
- `MeetingTimeline.spec.tsx` / `meetingStats.spec.ts` への閾値別 assertion 追加。

### 含まない

- 出席数の集計・算出ロジック（`getAttendanceCount` / `m.attendance` / `computeMeetingStats`）の変更。
- `/admin/meetings` 以外の他バッジ・他画面への強調波及。
- animation / transition による演出（本タスクは静的色強調のみ）。
- 新規 OKLch トークンの追加（既存トークンで充足するため）。
- `apps/web/src/styles/tokens.css` / `docs/00-getting-started-manual/specs/design-tokens.md` の変更。
- API / D1 schema / Google Form 仕様の変更。
- production / staging deploy、commit、push、PR、Issue 起票・close・reopen。

## 1.4 受け入れ条件（AC）

| ID | 受け入れ条件 | 検証 Phase |
| --- | --- | --- |
| AC-1 | 出席人数の閾値に応じてバッジの `data-attendance-level` が `none`（0 名）/ `normal`（1〜9 名）/ `high`（10 名以上）に変化する | Phase 4/6 |
| AC-2 | 閾値定義が `ATTENDANCE_LEVEL_THRESHOLDS` 定数 1 箇所に集約され、仕様として明記されている | Phase 2 |
| AC-3 | 強調色はすべて `tokens.css` の既存 OKLch トークン経由（または `admin-tag-status-badge` 先例と同形の `oklch()` 直値）であり、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が無い | Phase 5/9 |
| AC-4 | 新規 primitive を増やさず、既存 `.ui-badge` span への `data-attendance-level` 属性 + `.admin-timeline__heading` scoped CSS で構成する | Phase 5 |
| AC-5 | 既存 `MeetingTimeline.spec.tsx` / `meetingStats.spec.ts` が green（人数表示・0 名表示・集計の既存挙動が drift しない） | Phase 6 |
| AC-6 | 色のみの静的強調であり animation を含まないため `prefers-reduced-motion` 対応は不要（不要である旨を実装メモに明記） | Phase 5 |
| AC-7 | `pnpm typecheck` / `pnpm lint` / `verify-design-tokens` が PASS | Phase 9 |

## 1.5 既存コードの命名規則分析（FB-01 / FB-SDK-07-4）

| 対象 | 規則 | 本タスクでの踏襲 |
| --- | --- | --- |
| helper 関数（`meetingStats.ts`） | camelCase（`computeMeetingStats`） | `attendanceLevel` を camelCase で追加 |
| 定数 | UPPER_SNAKE_CASE は本 module に前例なし。`apps/web/src` 全体では `SCREAMING_SNAKE` 慣習あり | `ATTENDANCE_LEVEL_THRESHOLDS` を UPPER_SNAKE で追加 |
| 型 | PascalCase（`MeetingItem` / `MeetingStats`） | `AttendanceLevel` を PascalCase で追加 |
| data 属性 | `data-status` / `data-selected` / `data-testid`（kebab-case） | `data-attendance-level`（kebab-case）で追加。issue 本文の提案と一致 |
| CSS class | `.admin-timeline__heading`（BEM 風）/ `.admin-tag-status-badge[data-status]`（badge + data 属性セレクタ） | `.admin-timeline__heading .ui-badge[data-attendance-level]` を踏襲 |

## 1.6 inventory（current facts）

| 種別 | パス | current 状態 |
| --- | --- | --- |
| helper | `meetingStats.ts` | `MeetingItem` / `MeetingStats` / `computeMeetingStats` のみ。出席レベル判定は無い |
| component | `MeetingTimeline.tsx` | バッジ span（57 行）は `<span className="ui-badge" data-testid=...>{attendanceLabel}</span>`。`attendanceCount` は 34 行で算出済み |
| style | `globals.css` | `.ui-badge` の CSS 定義は**存在しない**。`.admin-tag-status-badge[data-status]`（1124-1150 行）が data 属性駆動色の正本パターン。`.admin-timeline__heading`（既存）でカード見出しをスコープ |
| token | `tokens.css` | `--status-success-bg` / `--status-neutral-bg` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink` / `--ubm-color-text-secondary` / `--ubm-color-ok` がすべて既存 |
| test | `MeetingTimeline.spec.tsx` | 6 ケース（empty / click / testid / 人数表示 / 0名 / getAttendanceCount 優先）。`meetingStats.spec.ts` も既存 |

## 1.7 targeted test 対象ファイル（FB-UI-02-2）

全件 `pnpm test` は重いため、本タスクは以下 2 ファイルを targeted run する（リポジトリルートから実行）。

```
apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx
apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts
```

## 1.8 carry-over 確認

直近コミット（`git log --oneline -5`）は bulk tag picker / tag reactivate / member OG 等で、本タスクの surface（`_meetings`）とは無関係。carry-over なし。

# Phase 3 — 設計レビュー（Phase 4 進行判定）

`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

## 3.1 設計レビュー観点

| 観点 | 判定 | 根拠 |
| --- | --- | --- |
| 命名一貫性（FB-SDK-07-4） | PASS | `attendanceLevel`（camelCase）/ `ATTENDANCE_LEVEL_THRESHOLDS`（UPPER_SNAKE）/ `AttendanceLevel`（PascalCase）/ `data-attendance-level`（kebab）が既存 module 慣習と一致 |
| 責務境界 | PASS | 集計（既存）/ 写像（pure function 新規）/ 表示（属性）/ 配色（CSS）が分離。集計ロジック非変更 |
| 不変条件整合 | PASS | #1 既存 API のみ / #2 OKLch トークン正本（新規トークン無し・HEX 無し）/ #3 新規 primitive 無し / #5 D1 非アクセス / 出席集計非変更 |
| トークン正本性 | PASS | 採用 4 トークン（`--status-neutral-bg` / `--status-success-bg` / `--ubm-color-accent-soft` / `--ubm-color-accent-ink`）+ 文字色 token/ink がすべて `tokens.css` に既存。`design-tokens.md` 不変 |
| primitive 波及リスク | PASS（対策済み） | `.admin-timeline__heading` scoped セレクタで共有 `.ui-badge` への波及を遮断 |
| テスト可能性 | PASS | `attendanceLevel` は pure function で境界テストが容易。属性は DOM assertion で検証可能 |

## 3.2 リスクと対策

| リスク | 影響 | 対策 |
| --- | --- | --- |
| HEX 直書き / `bg-[#xxx]` 混入で `verify-design-tokens` gate に抵触 | 中 | 背景は `var(--status-*-bg)` / `var(--ubm-color-accent-*)` のみ、文字色は token または `admin-tag-status-badge` 先例と同形の `oklch()` 直値。Phase 9 で HEX grep + `verify-design-tokens` を実行 |
| 「多数出席」閾値が小規模分布に合わず常時点灯／消灯 | 中 | `ATTENDANCE_LEVEL_THRESHOLDS.high` を単一 tuning point 化。起点 10、運用後 1 行で調整可能。3 段階（none/normal/high）で開始 |
| `.ui-badge` 本体変更による他バッジへの波及 | 低 | 強調は `data-attendance-level` 属性 + `.admin-timeline__heading` scope に閉じ、共有 primitive 既定スタイルは変更しない |
| 色以外の演出（animation 等）へスコープ拡大 | 低 | 本タスクは静的色強調のみ。animation・他バッジ波及は明示スコープ外 |
| 既存 6 ケーステストの drift | 低 | 既存 assertion を変更せず追加のみ。`attendanceLabel` / `data-testid` / className は不変 |

## 3.3 進行判定

**判定: Phase 4 へ進行可（GO）。**

- 設計は責務分離・命名一貫・不変条件整合・gate 非干渉を満たす。
- 苦戦箇所（閾値未定義）は名前付き定数 1 箇所への集約 + 起点デフォルト + 調整容易性で解消。
- BLOCKER なし。MINOR: 「文字色を token 化するか `oklch()` 直値とするか」は Phase 5 でコントラスト実測して決定（先例 `admin-tag-status-badge` に従えば `oklch()` 直値で gate PASS）。

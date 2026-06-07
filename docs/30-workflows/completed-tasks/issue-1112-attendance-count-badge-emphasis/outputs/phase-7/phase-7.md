`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 7: カバレッジ確認

## 目的

本タスク（issue #1112 出席人数バッジ 3 段階色強調）で**変更したコードに限定**してカバレッジ目標を定義する。全ファイル一律のカバレッジ基準は設けない（FB-Before-Quit-002: 変更範囲外への過剰なカバレッジ要求を避ける）。

## 7.1 カバレッジ対象範囲（変更した 3 ソースに限定）

本タスクのプロダクトコード変更は以下 3 ソースのみ。これら**追加・変更行のみ**をカバレッジ対象とする（既存の `computeMeetingStats` / 既存集計ロジック等は本タスクの対象外で再カバレッジ要求しない）。

| # | 対象ソース | 変更内容 | カバレッジ担保手段 |
|---|-----------|---------|------|
| 1 | `meetingStats.ts` の `attendanceLevel`（+ `ATTENDANCE_LEVEL_THRESHOLDS` / `AttendanceLevel`） | pure function 新規追加 | Phase 6 vitest（`meetingStats.spec.ts` A-1..A-7） |
| 2 | `MeetingTimeline.tsx` の badge span への `data-attendance-level` 付与 | DOM 属性配線 | Phase 6 vitest（`MeetingTimeline.spec.tsx` B-1..B-3） |
| 3 | `globals.css` の `.admin-timeline__heading .ui-badge[data-attendance-level="none|normal|high"]` 強調規則 | scoped CSS 追加 | 静的検証（HEX grep / `verify-design-tokens`）+ Phase 11 staging visual に委譲 |

## 7.2 `attendanceLevel` のカバレッジ実測目標

`attendanceLevel` は分岐 3 経路（`none` / `normal` / `high`）+ 防御 2 経路（負数・非有限）を持つ。Phase 4/6 で定義した境界ケースが全分岐を網羅する。

| 経路 | 条件 | 網羅するテストケース |
|------|------|------|
| `none`（下限境界 0） | `count <= 0` | A-1（`0`） |
| `none`（防御: 負数） | `count <= 0` | A-6（`-3`） |
| `none`（防御: 非有限） | `!Number.isFinite(count)` | A-7（`NaN`） |
| `normal`（下限境界 1） | `0 < count < 10` | A-2（`1`） |
| `normal`（high 直下） | `count === 9` | A-3（`9`） |
| `high`（閾値ちょうど） | `count === 10` | A-4（`10`） |
| `high`（上方） | `count > 10` | A-5（`25`） |

### カバレッジ実測目標（`attendanceLevel`）

| 指標 | 目標 | 根拠 |
|------|------|------|
| line coverage | 100% | 関数本体の全 return 行（`"none"` / `"high"` / `"normal"`）を A-1..A-7 が踏む |
| branch coverage | 100% | `!Number.isFinite(count)`（A-7）/ `count <= 0`（A-1/A-6）/ `count >= high`（A-4/A-5）/ else（A-2/A-3）の全分岐を境界対で網羅 |
| function coverage | 100% | `attendanceLevel` が直接呼び出される |

A-3（9）と A-4（10）の対で `>=` 境界（< 10 → normal / >= 10 → high）を確定させ、branch を完全網羅する。

## 7.3 `MeetingTimeline.tsx`（属性配線）のカバレッジ

`data-attendance-level={attendanceLevel(attendanceCount)}` の配線は、出席件数 0 / 5 / 12 を持つ fixture で 3 レベル（`none` / `normal` / `high`）を全て render し DOM assertion する（B-1..B-3）。これにより属性付与経路と `attendanceLevel` 呼び出し連結が render 経由でも実行される。既存 6 ケースが `attendanceLabel` / `data-testid` / `ui-badge` className の非回帰を担保する。

## 7.4 CSS のカバレッジ取り扱い（jsdom 限界 → Phase 11 委譲）

`.admin-timeline__heading .ui-badge[data-attendance-level="..."]` の**算出色（OKLch の実描画）は jsdom では検証できない**（jsdom は CSS の cascade / 算出スタイルを完全には解決しない）。したがって:

- jsdom（Phase 6 vitest）では **属性値が正しく付くこと**までを検証する（`data-attendance-level` の値 = none/normal/high）。
- **実際の配色・コントラスト・scope 波及の有無**は Phase 11 の staging runtime visual（user-gated screenshot）に委譲する。
- 静的には HEX 不在（`rg`）+ `verify-design-tokens` gate（Phase 9）で「禁止トークンが混入していないこと」を担保する。

## 7.5 小規模タスクのカバレッジ方針（EMB-005-FB）

本タスクは pure function 1 個 + 属性 1 個 + scoped CSS の追加という小規模変更であり、新規ロジックの分岐は `attendanceLevel` に集約されている。したがって **Phase 6 で定義したテスト（A-1..A-7 / B-1..B-3）のみで変更コードのカバレッジを担保できる**（追加の統合テスト・E2E をこのタスクのために新設しない）。

## 7.6 implemented local での扱い

本タスクは `implemented_local_evidence_captured` であり、上記カバレッジ観点は focused Vitest で実走済み。line/branch % の全体 coverage 測定は求めず、変更範囲の境界・DOM 属性・既存回帰を targeted test で確認した。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts --coverage \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts
```

期待: `attendanceLevel` の line/branch = 100%。CSS の算出色は Phase 11 visual で確認。

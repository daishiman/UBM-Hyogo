`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 4: テスト作成（TDD RED）

## 目的

issue #1112 の出席人数バッジ 3 段階色強調について、実装（Phase 5）に先立って失敗するテスト（RED）を定義する。本タスクは VISUAL / implementation_mode=new であり、本フェーズで定義したテスト契約は同一サイクルの local 実装で GREEN 化済みである。

色そのもの（CSS の OKLch トークン）は静的検証（`verify-design-tokens` gate / `rg` による HEX 不在確認・Phase 6 参照）で担保し、ロジックと DOM 配線は本フェーズの vitest で担保する。

## RED の前提

- 追加対象の pure function `attendanceLevel`（`apps/web/src/features/admin/components/_meetings/meetingStats.ts`）は Phase 5 まで未実装。
- 追加対象の DOM 属性 `data-attendance-level`（`MeetingTimeline.tsx` の `ui-badge` span）は Phase 5 まで未付与。
- したがって本フェーズで追加するテストは、現状コードに対して **import 解決失敗 / undefined 参照 / assertion 不一致** により fail する。これが RED である。

## 命名規則の整合

- テストファイルは `*.spec.{ts,tsx}` のみ（CLAUDE.md 不変条件 #8。`*.test.*` 禁止）。
- 追加先は既存 spec ファイルへの **追記**（新規 spec ファイルは作らない）。
  - `apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts`
  - `apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx`
- describe / it の文言は Phase 1-3 のユビキタス言語（`attendanceLevel` / `data-attendance-level` / `none` / `normal` / `high`）と一致させる。
- pure function は public export（`export function attendanceLevel`）であり private method は存在しない。よって private のテストは作らず、export された関数を直接呼ぶ。

## 追加テストケース一覧

### A. `meetingStats.spec.ts`（`attendanceLevel` の境界テスト）

| # | ケース名 | 入力 `count` | 期待 `AttendanceLevel` | 意図 |
|---|---------|------|------|------|
| A-1 | returns "none" for zero | `0` | `"none"` | 下限境界（count<=0） |
| A-2 | returns "normal" for one | `1` | `"normal"` | normal 下限境界 |
| A-3 | returns "normal" just below high threshold | `9` | `"normal"` | high 直下（< 10） |
| A-4 | returns "high" at threshold | `10` | `"high"` | high 閾値ちょうど（>= 10） |
| A-5 | returns "high" for large count | `25` | `"high"` | high 上方 |
| A-6 | returns "none" for negative | `-3` | `"none"` | 負数防御（count<=0） |
| A-7 | returns "none" for NaN | `Number.NaN` | `"none"` | 非有限防御（!Number.isFinite） |

- 閾値定数 `ATTENDANCE_LEVEL_THRESHOLDS.high === 10` を前提とする。A-3（9）/ A-4（10）の対で `>=` 境界を確定させる。
- `attendanceLevel` は例外を投げない pure function であるため、各ケースは throw を期待せず戻り値のみを assert する。

### B. `MeetingTimeline.spec.tsx`（DOM 属性 assertion）

既存 6 ケースは不変。出席人数の異なる開催日を含む fixture をレンダリングし、`data-attendance-level` を検証する 3 ケースを追加する。

| # | ケース名 | 出席人数 | 期待 `data-attendance-level` | assertion 方法 |
|---|---------|------|------|------|
| B-1 | badge gets level "none" when no attendees | `0` | `"none"` | `screen.getByTestId('meeting-attendance-count-<id>').getAttribute('data-attendance-level')` |
| B-2 | badge gets level "normal" for mid count | `5` | `"normal"` | 同上 |
| B-3 | badge gets level "high" for large count | `12` | `"high"` | 同上 |

- `data-testid` は既存の出席人数バッジ（`meeting-attendance-count-...`）を再利用する。data-testid・className（`ui-badge`）・表示ラベル（`attendanceLabel`）は不変であることをあわせて確認（既存 6 ケースの非回帰）。
- `attendanceCount` は `MeetingTimeline.tsx` 既存 34 行で算出済みの値であり、テストは fixture の出席データ件数を 0 / 5 / 12 に設定して間接的に駆動する。

## RED 実行確認

下記 targeted コマンドをリポジトリルートから実行し、追加ケース（A-1..A-7 / B-1..B-3）が **fail** することを確認する（`attendanceLevel` 未 export・`data-attendance-level` 未付与による）。既存ケースは引き続き PASS する。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts
```

期待: 追加 10 ケースが RED（fail）。Phase 5 実装後に GREEN へ遷移する。

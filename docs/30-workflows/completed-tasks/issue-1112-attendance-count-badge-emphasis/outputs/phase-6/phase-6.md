`[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]`

# Phase 6: テスト拡充（fail path / 回帰 guard）

## 目的

Phase 4-5 の最小テストに対し、閾値境界・防御 path・既存挙動の非回帰を網羅的に固める。色（CSS）は静的検証で担保し、ロジックと DOM 配線は targeted vitest で担保する二本立てを確立する。

## 1. 閾値境界の branch 網羅（`meetingStats.spec.ts`）

`attendanceLevel` の分岐は 3 本（`none` / `high` / `normal` フォールスルー）。下表で全 branch と境界の両側を網羅する。

| 観点 | 入力 | 期待 | 網羅する branch |
|------|------|------|----------------|
| high 閾値ちょうど | `10` | `"high"` | `count >= 10` の真側（A-4） |
| high 直下 | `9` | `"normal"` | `count >= 10` の偽 → フォールスルー（A-3） |
| normal 下限 | `1` | `"normal"` | `count <= 0` の偽 → フォールスルー（A-2） |
| none 上限境界 | `0` | `"none"` | `count <= 0` の真側（A-1） |
| high 上方 | `25` | `"high"` | high 真側の一般値（A-5） |

- `9`（A-3）と `10`（A-4）の対で、閾値が `>` ではなく `>=` であることを固定する（off-by-one 回帰の guard）。

## 2. fail path / 防御 path

| 観点 | 入力 | 期待 | 意図 |
|------|------|------|------|
| 負数 | `-3` | `"none"` | 負数が `normal`/`high` に漏れないこと（A-6） |
| NaN | `Number.NaN` | `"none"` | `!Number.isFinite` 早期 return（A-7） |

- `attendanceLevel` は pure function であり throw しない。fail path も戻り値で表現されるため、例外 assertion は用いず戻り値 assert で確認する。
- （任意の堅牢化として）`Infinity` を渡した場合も `!Number.isFinite` で `"none"` へ落ちる設計であることを実装メモとして残す。本タスクの必須ケースは A-1..A-7 とする。

## 3. DOM 配線の回帰 guard（`MeetingTimeline.spec.tsx`）

| 観点 | 入力（出席人数） | 期待 `data-attendance-level` | guard 内容 |
|------|------|------|------|
| none 配線 | `0` | `"none"` | 0 名で none クラスへ配線（B-1） |
| normal 配線 | `5` | `"normal"` | 中間値で normal（B-2） |
| high 配線 | `12` | `"high"` | 10 以上で high（B-3） |
| 非回帰: label 不変 | 各ケース | 既存 `attendanceLabel` 表示 | バッジの表示テキストが変わらない |
| 非回帰: data-testid 不変 | 各ケース | `meeting-attendance-count-...` | 既存 testid 維持 |
| 非回帰: className 不変 | 各ケース | `ui-badge` | 既存 class 維持 |

- 既存 6 ケースは一切変更せず、追加 3 ケースと並走させて非回帰を確認する。
- assertion は `screen.getByTestId('meeting-attendance-count-<id>').getAttribute('data-attendance-level')` を基本形とし、同一要素から label / className も読んで不変を確認する。

## 4. 静的検証（色トークンの回帰 guard）

CSS の色強調は vitest では検証しないため、以下の静的 gate で担保する。

```bash
# 型・lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# globals.css 差分行に HEX / 任意値カラーが無いことを確認
rg -n "#[0-9a-fA-F]{3,8}|bg-\[#|text-\[#" apps/web/src/styles/globals.css
```

- 追加した `data-attendance-level` ルールに HEX / `bg-[#xxx]` / `text-[#xxx]` が含まれないことを確認する。`high` の `color` も既存 `var(--ubm-color-ok)` 経由である。
- CI の `verify-design-tokens` gate でも同基準で fail 判定されないことを担保とする。

## 5. targeted vitest と期待

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/features/admin/components/_meetings/__tests__/MeetingTimeline.spec.tsx \
  apps/web/src/features/admin/components/_meetings/__tests__/meetingStats.spec.ts
```

期待:
- `meetingStats.spec.ts`: 既存テスト + A-1..A-7（計 7 追加）全 PASS。
- `MeetingTimeline.spec.tsx`: 既存 6 ケース + B-1..B-3（計 3 追加）全 PASS。
- 全体 GREEN。RED→GREEN 遷移と非回帰が同一コマンドで確認できる。

## カバレッジ観点まとめ

- `attendanceLevel` の 3 分岐すべてと、各境界（0/1/9/10）の両側を網羅。
- 負数・NaN（・任意で Infinity）の防御 path をカバー。
- DOM 側は 3 レベルすべての配線と、表示ラベル / testid / class の非回帰を確認。
- 色は静的 gate（typecheck / lint / rg / verify-design-tokens）で担保し、テストの責務外とする。

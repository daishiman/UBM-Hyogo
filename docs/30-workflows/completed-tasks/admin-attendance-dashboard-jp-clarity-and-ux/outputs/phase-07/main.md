# Phase 7 — カバレッジ確認（方針 + 変更ブロック確認）

> 上流: `outputs/phase-04/test-plan.md` / `outputs/phase-06/regression-cases.md`。下流: `./ac-matrix.md`。
> 本タスクは文字列置換中心のため、計測の正本は「変更文言の回帰固定 + 残存 0 + DOM 不変」。新規ロジックは `formatDelta` 単位のみ。

## 1. 確認範囲の限定（[Feedback BEFORE-QUIT-002]）

- 対象は `apps/web/src/features/admin/attendance/` 配下の **本タスクで変更したファイルのみ**（change-map §1-13）。
- 全体一律 `--coverage` 閾値は適用しない。`apps/api` / `packages/shared` は変更ゼロ（AC-7）のため対象外。

## 2. 変更ブロック確認（記録欄）

| 変更ブロック | 変更内容 | 実行する TC | 確認 |
| --- | --- | --- | --- |
| `formatDelta`（単位 `pt`→`ポイント`） | 戻り文字列末尾 | TC-R06（↑）/ TC-R06b（null=—）/ TC-R06c（→） + 既存テスト（↓） | ↑/↓/→/null の 4 経路が実行され、すべて `pt` を含まないこと |
| `PERIOD_PRESETS[].label`（3M/6M/1Y） | label 3 件 | TC-R01（`3か月`/`6か月`/`1年`）/ TC-R01b（`monthsBack` 不変） | 3 ラベル + 不変が実行されること |
| `ZONE_HELP`（定数） | 文字列 | TC-R07（新文言前方一致）/ T-06（playwright） | `各メンバーがこれまでに参加した合計回数` を含み `出席回数帯` を含まないこと |
| component 文言（R/S/J 系） | 表示 / aria-label | T-01〜T-04 / TC-R02〜R08 / TC-E-07/08/11/12 + 残存 grep（TC-E-01〜05） | 個別固定 + 面ガード 0 件 |

> `formatDelta` の符号分岐は ↑（current>previous）/ ↓（current<previous）/ →（同値）/ —（null）の 4 経路。回帰 TC-R06/R06b/R06c で 3 経路、既存テスト（`formatDelta` の ↓ ケースがあれば）で 4 経路目を網羅。なければ TC-R06d（`formatDelta(0.3, 0.5)==="↓20.0ポイント"`）を追加すること。

## 3. 確認コマンドと期待値

```bash
# 1) 追従 + 回帰 + degrade + skip 残存の全ケース（変更ファイル限定）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__
#    期待: 全 PASS

# 2) 英語 / 専門語残存 0（component+lib+route・テスト除外）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯|[0-9]pt\b" \
  apps/web/src/features/admin/attendance/components apps/web/src/features/admin/attendance/lib \
  apps/web/app/\(admin\)/admin/dashboard/attendance
#    期待: 0 件

# 3) HEX 0（AC-5）
mise exec -- pnpm verify:tokens         # 期待: PASS

# 4) shared / api 変更 0（AC-7）
git diff --name-only -- apps/api packages/shared    # 期待: 空

# 5) skip / only 残存 0
grep -rnE "describe\.skip|it\.skip|\.only\(" apps/web/src/features/admin/attendance/__tests__   # 期待: 0 件

# 6)（任意）数値カバレッジが必要な場合のみ対象限定
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance \
  --coverage --coverage.include='apps/web/src/features/admin/attendance/**' --coverage.reporter=text
```

## 4. 未カバー AC ゼロ宣言

- `./ac-matrix.md` で AC-1〜AC-10 のすべてが [TEST]（vitest）または [GATE]（verify-design-tokens / shared diff / 残存 grep）に 1 件以上マップされ、空セルが無いことを確認する。
- **未カバー AC: 0 件**（詳細は ac-matrix.md）。1 件でも空セルが生じた場合は Phase 4（TC 追加）または Phase 5（実装追加）へ差し戻す。

# Phase 6 — テスト拡充方針

> 上流: `outputs/phase-04/test-plan.md`（回帰 TC-RXX）/ `outputs/phase-05/runbook.md`（degrade / 残存 grep）。
> 個別ケースは `./regression-cases.md`（TC-E-XX）。

## 1. 回帰（Phase 4）/ 残存ガード・fail path（Phase 6）責務分担

| 区分 | Phase | 検証対象 | 例 |
| --- | --- | --- | --- |
| 回帰（After 文言固定） | 4 | 個別文言が新表記であること | TC-R01〜R08（`3か月` / `ポイント` / `開催回数` / `出席が多い順`） |
| 残存ガード（網羅的不在） | 6 | 画面文字列に英語 / 専門語が**一切残らない** | TC-E-01〜E-05（grep 0 件） |
| fail path（degrade 新文言） | 6 | error 時の sectionLabel が新文言で表示・挙動不変 | TC-E-06〜E-09 |
| テストスイート衛生 | 6 | skip / only が残らない | TC-E-10 |

- Phase 4 は「個別の置換が正しい」を点で固定。Phase 6 は「置換漏れが面で 0」を保証する。
- 両者で `apps/web/src/features/admin/attendance/__tests__/` の既存 spec へ追記する（新規 spec ファイルは作らない）。

## 2. 拡充の前提（Phase 5 Green 後）

- Phase 5 で全 component / lib の文言が After に置換済み・T-01〜T-06 が新文言へ追従済み。
- 本 Phase は (a) 置換漏れの面ガード（grep）、(b) degrade 経路の新文言、(c) スイート衛生、を attack する。
- degrade fixture（`safeErr({ code, message })`）は `AttendanceDetailTabs.spec.tsx` 既存パターンを流用。

## 3. カバー観点（regression-cases.md の TC-E にマップ）

| 観点 | TC-E | AC |
| --- | --- | --- |
| (a) 英語残存 0（PRIMARY/TREND/DETAIL/TOP10/ADMIN・DASHBOARD/3M/6M/1Y/CSVエクスポート） | TC-E-01, TC-E-02 | AC-1 |
| (b) セッション残存 0 | TC-E-03 | AC-2 |
| (c) 専門語残存 0（ユニーク/トレンド/区画/出席回数帯/pt 単位） | TC-E-04, TC-E-05 | AC-3 |
| (d) overview error → `出席のおもな指標` degrade | TC-E-06 | AC-10 |
| (e) by-session error → `開催回ごとの出席状況` degrade | TC-E-07 | AC-10 |
| (f) ranking(top10) error → `出席が多い人の一覧` degrade | TC-E-08 | AC-10 |
| (g) zone error → `出席回数べつの分布` degrade | TC-E-09 | AC-10 |
| (h) skip / only 残存 0 | TC-E-10 | [FB-TASK-01/02] |

## 4. 回帰ガードの位置づけ

| guard | 種別 | 検証内容 | 連携 Phase | 失敗時の意味 |
| --- | --- | --- | --- | --- |
| 残存ゼロ grep | ローカル / CI 補助 | component + lib + route に英語 / 専門語が 0 件（AC-1/2/3） | Phase 9（ローカル）/ Phase 5 DoD | 1 件でも残ると置換漏れ。runbook §2 の置換を見直す |
| `verify-design-tokens` | CI gate（既存） | attendance + globals.css に HEX / `bg-[#xxx]` / `text-[#xxx]` 0 件（AC-5） | Phase 9 / CI | 1 件でも HEX があると fail。U-03 は token のみ |
| focused vitest | unit/component | 追従 + 回帰 + degrade + skip 残存の全ケース Green | Phase 9 | fail path 含む全ケース pass を保証 |
| playwright visual smoke | E2E（既存・staging admin） | 3 層レイアウトの視覚回帰。文言日本語化の意図的差分 | Phase 11（baseline 再取得・M-2・user-gated） | baseline 差分は「破壊」でなく「意図的更新」。承認の上で更新 |

- 残存ゼロ grep の誤検知回避: 対象を `apps/web/src/features/admin/attendance/components` / `.../lib` / route に限定し、`__tests__/`（`.not.toContain("セッション")` 等の負アサートを含む）を除外する。

## 5. ローカル実行コマンド

```bash
# 追従 + 回帰 + degrade + skip 残存の全ケース
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/web/src/features/admin/attendance/__tests__

# 残存ゼロ grep（実 UI 文字列のみ・テスト除外）
grep -rnE "PRIMARY|TREND|DETAIL|TOP ?10|ADMIN / DASHBOARD|3M|6M|1Y|CSVエクスポート|セッション|ユニーク|トレンド|区画|出席回数帯|[0-9]pt\b" \
  apps/web/src/features/admin/attendance/components \
  apps/web/src/features/admin/attendance/lib \
  apps/web/app/\(admin\)/admin/dashboard/attendance && echo "FAIL(残存あり)" || echo "PASS(残存0)"

# skip / only 残存
grep -rnE "\.skip|\.only|describe\.skip|it\.skip" apps/web/src/features/admin/attendance/__tests__ && echo "FAIL" || echo "PASS"

# HEX 回帰 guard（AC-5）
mise exec -- pnpm verify:tokens
```

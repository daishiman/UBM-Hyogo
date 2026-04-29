# Phase 07 outputs: AC マトリクス

## サマリ

AC-1〜AC-12 を test ID（U/C/E/S）× runbook step × failure case（F）× 不変条件にマッピング。未トレース 0 件、合格しきい値を quantitative に固定。詳細は `ac-matrix.md` を参照。

## 集計

| 指標 | 値 |
| --- | --- |
| AC 件数 | 12 |
| test ID 件数 | 21 |
| failure case 件数 | 17 |
| 未トレース AC | 0 |
| 不変条件 mapping 件数 | 11（#1〜#11） |

## 重複 / 漏れ排除

- AC-4 / AC-5 / AC-6 は AC-1（5 状態 UI 出し分け）の個別 case として整理
- AC-7 / AC-8 は `/profile` の認可と read-only。前者は middleware、後者は component 構造で担保
- AC-11 / AC-12 は static check 由来（lint と grep の二重）

## 合格しきい値

| AC | 合格しきい値 |
| --- | --- |
| AC-1 | 5 状態すべての E2E が green、URL fallback 100% |
| AC-2 | cooldown 60 秒経過まで button disabled、再送 0 件 |
| AC-7 | 未ログイン `/profile` の HTTP status 302 = 100% |
| AC-8 | `apps/web/app/profile` 配下の `<form>` 出現数 = 0 |
| AC-11 | `git grep "questionId" apps/web/app/profile` = 0 件 |
| AC-12 | `grep -r "localStorage" apps/web/app/login apps/web/app/profile` = 0 件 |

## 不変条件チェック

- #1 / #2 / #4 / #5 / #6 / #7 / #8 / #9 / #11 が AC trace 済
- #10（無料枠）は Phase 9 で定量検証

## 次 Phase 引き継ぎ

- LoginPanel / StatusSummary を DRY 化候補へ

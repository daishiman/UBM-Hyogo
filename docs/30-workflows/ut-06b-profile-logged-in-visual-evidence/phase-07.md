# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-30 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | pending |

## 目的

AC-1〜7 × evidence × 不変条件 × failure case の 4 軸トレースを `outputs/phase-07/ac-matrix.md` に固定する。

## AC マトリクス

| AC | 内容 | evidence | 不変条件 | failure case | verify |
| --- | --- | --- | --- | --- | --- |
| AC-1 | M-08-profile.png 取得（logged-in 表示） | M-08-profile.png | #4, #5 | F-1, F-2, F-9 | 取得 verify |
| AC-2 | M-09-no-form.png + DevTools count:0 | M-09-no-form.png, .devtools.txt | #8 | F-3 | 内容 verify |
| AC-3 | M-10-edit-query-ignored.png + DevTools count:0 | M-10-edit-query-ignored.png, .devtools.txt | #11 | F-3, F-8 | 内容 verify |
| AC-4 | staging M-14〜M-16 取得 | M-14-staging-profile.png, M-15-edit-cta.png, M-16-localstorage-ignored.png, M-16-localstorage-ignored.devtools.txt | #4, #5, #8, #11 | F-4 | 取得 + 内容 verify |
| AC-5 | manual-smoke-evidence.md `pending`→`captured` 6 行更新 | manual-smoke-evidence-update.diff | (process) | F-7 | git diff verify |
| AC-6 | 不変条件 #4/#5/#8/#11 の observation 記録 | 上記 evidence + observation note | #4, #5, #8, #11 | — | 観測 note verify |
| AC-7 | secret hygiene + runbook 再現性 | runbook.md, grep 結果 | (process) | F-5, F-10 | grep verify |

## 不変条件カバレッジ

| 不変条件 | 観測 evidence 数 | 充足 |
| --- | --- | --- |
| #4 session 必須 | 2 (M-08, M-14) | ✓ |
| #5 3 層分離 | 2 (M-08, M-14) | ✓ |
| #8 read-only | 3 (M-09 + dt, M-16 + dt) | ✓ |
| #11 編集経路なし | 3 (M-10 + dt, M-15) | ✓ |

## 実行タスク

- [ ] `outputs/phase-07/main.md` にサマリ
- [ ] `ac-matrix.md` に上記マトリクス記述
- [ ] 不変条件カバレッジ表配置

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/evidence-checklist.md | チェック |
| 必須 | outputs/phase-06/main.md | failure case |

## 完了条件

- [ ] AC × evidence × 不変条件 × failure case の 4 軸トレース完成
- [ ] 不変条件 4 件すべて 1 件以上の evidence で観測

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 7 を completed

## 次 Phase

- 次: Phase 8 (DRY 化)
- 引き継ぎ: マトリクス完成、DevTools snippet と命名規約の重複を確認

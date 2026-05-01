# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke) |
| 状態 | pending |

## 目的

Phase 1〜9 の成果物と 上流 04b/05a/05b/06b の AC 達成状況を最終レビューし、Phase 11 実取得の **GO / NO-GO** を判定する。

## GO / NO-GO チェック

| 項目 | 確認 | 状態 |
| --- | --- | --- |
| Phase 1〜9 すべて completed | artifacts.json | □ |
| AC-1〜7 quantitative 化 | phase-01.md | □ |
| 設計 mermaid + 命名規約 | phase-02.md / outputs/phase-02 | □ |
| 採用案 C（local + staging） | phase-03.md | □ |
| evidence チェックリスト 11 件 | phase-04.md | □ |
| runbook + DevTools snippet | phase-05.md / outputs/phase-05 | □ |
| failure case 10 件 | phase-06.md | □ |
| AC マトリクス 4 軸 | phase-07.md | □ |
| DRY 4 重複解消 | phase-08.md | □ |
| 4 gate 設計（free-tier / hygiene / a11y / 可搬） | phase-09.md | □ |
| 上流 04b `/me` `/me/profile` 利用可能 | apps/api dev で 200 確認 | □ |
| 上流 05a/05b session 利用可能 | local fixture or staging で login 通る | □ |
| 上流 06b `/profile` route deploy 済 | local 200 / staging deploy（M-14〜M-16 取得時点） | □ |
| 親 06b workflow `manual-smoke-evidence.md` 行所在 | M-08〜M-10、M-14〜M-16 行が pending | □ |

## NO-GO 条件

- 上流 04b `/me` が 500 連発 → blocked、04b に bug 報告
- 上流 05a/05b で session 取得不能 → blocked
- 上流 06b `/profile` route 不在 → 設計矛盾、親 issue で再確認
- staging 未 deploy → M-08〜M-10 のみ先行取得し、M-14〜M-16 は 09a 完了まで partial

## 部分 GO（partial）の扱い

local（M-08〜M-10）のみ完了した時点で:
- artifacts.json の Phase 11 を `partial` に
- M-14〜M-16 は `outputs/phase-11/main.md` に「09a 完了後に再取得」を明記
- Phase 12 では **partial でも documentation 5 件 + compliance check は完成** させる

## 実行タスク

- [ ] GO / NO-GO チェック表を埋める
- [ ] 上流 4 task の AC を 1 件ずつ照合
- [ ] partial 条件の判断基準を明示

## 完了条件

- [ ] 全 14 チェック項目に判定済み
- [ ] GO の場合 Phase 11 起動許可、NO-GO の場合は ブロック理由と recovery を記録
- [ ] artifacts.json の phase 10 を completed

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 10 を completed

## 次 Phase

- 次: Phase 11 (手動 smoke)

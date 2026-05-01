# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動 smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | pending |

## 目的

skill `task-specification-creator` Phase 12 必須 5 + Task 6（compliance check）= **計 7 ファイル**を作成し、`aiworkflow-requirements` skill 正本仕様への反映を行う。

## 7 必須成果物

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | outputs/phase-12/implementation-guide.md | Part 1 中学生レベル + Part 2 技術者レベル |
| 2 | outputs/phase-12/system-spec-update-summary.md | aiworkflow-requirements 反映サマリ（Step 1-A/B/C + 条件付き Step 2） |
| 3 | outputs/phase-12/documentation-changelog.md | 更新履歴 |
| 4 | outputs/phase-12/unassigned-task-detection.md | 残課題（0 件でも出力必須） |
| 5 | outputs/phase-12/skill-feedback-report.md | task-specification-creator skill への feedback（改善なしでも出力必須） |
| 6 | outputs/phase-12/phase12-task-spec-compliance-check.md | 7 ファイル実体 + artifacts.json parity |
| 7 | outputs/phase-12/main.md | Phase 12 全体サマリ |

## implementation-guide.md 構成

### Part 1（中学生レベル）

- 「`/profile` ページは "見るだけ" で、書き換えるボタンも入力欄もありません」
- 「これをスクリーンショットと、画面の中の "ボタンや入力欄の数を数えるプログラム" で証拠にします」
- 「`?edit=true` を URL の最後につけても、書き換え画面は出てきません」
- 「ローカルパソコンとインターネット上の staging 環境の両方で同じことを確認します」

### Part 2（技術者レベル）

- VISUAL evidence acquisition 仕様（命名 / 環境 / 不変条件マッピング）
- DevTools snippet 設計（`location.pathname + location.search` 採用理由）
- secret hygiene gate（grep パターン）
- partial 判定運用（staging 未 deploy 時）
- 親 06b workflow の `manual-smoke-evidence.md` 更新 contract

## system-spec-update-summary.md（aiworkflow-requirements 反映）

| Step | 内容 |
| --- | --- |
| Step 1-A | 不変条件 #4/#5/#8/#11 を VISUAL evidence で観測する手順を `references/` に追記 |
| Step 1-B | `/profile` 仕様書（05-pages.md）に「VISUAL evidence は `outputs/phase-11/evidence/screenshot/` に保存」の運用追記 |
| Step 1-C | 13-mvp-auth.md の session 取得 runbook に local fixture / staging 二経路の存在を明記 |
| Step 2（条件付き） | aiworkflow-requirements 正本側に既存 follow-up / stale current 記述が残る場合のみ、新 workflow パスへ置換または stale 扱いを記録 |

## unassigned-task-detection.md（0 件でも出力必須）

- staging deploy 未完了で M-14〜M-16 が未取得の場合のみ、UT-06B-PROFILE-VISUAL-EVIDENCE-STAGING-FOLLOWUP（仮）を unassigned-task として記録
- 全件取得済みなら「該当なし」を明示

補足: 親 06b workflow `manual-smoke-evidence.md` の `pending` → `captured` 更新は Phase 11 の evidence diff 責務であり、aiworkflow-requirements Step 2 には含めない。

## skill-feedback-report.md

- 本タスクで気付いた `task-specification-creator` への改善点（VISUAL + manual smoke の close-out テンプレ拡充など）
- 改善点なしでも「無し」を明記

## phase12-task-spec-compliance-check.md

| 項目 | 検査 | 結果 |
| --- | --- | --- |
| 7 ファイル実体存在 | ls | □ |
| artifacts.json と root parity | diff | □ |
| Phase 1〜11 status 正当性 | jq | □ |
| `manual-smoke-evidence.md` 更新確認 | grep `captured` | □ |
| secret hygiene 再 grep | grep | □ |
| outputs/phase-11/evidence/* 11 件 | ls | □ |
| docs-only 該当性確認 | metadata.taskType | implementation を確認 |

## docs-only / VISUAL 判定の close-out 扱い

- 本タスクは `taskType: implementation` / `visualEvidence: VISUAL`
- workflow root state は **完了時 `completed` に更新**（spec_created で停止しない）
- partial の場合は `partial` 据え置き、staging follow-up 完了で `completed` 化

## 実行タスク

- [ ] 7 ファイル作成
- [ ] aiworkflow-requirements 反映
- [ ] artifacts.json parity 確認
- [ ] documentation-changelog.md 記述

## 完了条件

- [ ] 7 ファイル実体存在
- [ ] artifacts.json と root parity
- [ ] aiworkflow-requirements 反映完了
- [ ] secret hygiene 再 grep PASS

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] artifacts.json の phase 12 を completed

## 次 Phase

- 次: Phase 13 (PR 作成)
- 引き継ぎ: 7 ファイル成果物 + change-summary 入力

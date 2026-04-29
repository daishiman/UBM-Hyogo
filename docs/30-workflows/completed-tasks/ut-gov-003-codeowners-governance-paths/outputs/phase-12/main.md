# Phase 12 main — UT-GOV-003 CODEOWNERS（ドキュメント更新サマリー）

> **ラベル**: implementation / NON_VISUAL / infrastructure_governance / spec_created
> **本 Phase の責務**: 必須 5 outputs（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report）を CODEOWNERS タスクの特性に合わせて生成。

## Phase 12 必須 outputs インデックス

| # | ファイル | 役割 |
| --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1（中学生レベル 4 概念）+ Part 2（運用 + 将来移行手順） |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C / Step 2（N/A 理由明記） |
| 3 | `outputs/phase-12/documentation-changelog.md` | 変更ファイル一覧と N/A 区分 |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | current / baseline 分離（baseline 最低 2 件） |
| 5 | `outputs/phase-12/skill-feedback-report.md` | 3 観点（task-spec-creator / aiworkflow-requirements / docs） |

## CODEOWNERS タスク特性に基づく Phase 12 設計

| 特性 | Phase 12 への影響 |
| --- | --- |
| 最終マッチ勝ち仕様 | implementation-guide Part 1 で「最後にめくった名札が勝つ」例え必須、Part 2 で「global fallback は冒頭 1 行」を強調 |
| `doc/` `docs/` 表記揺れ | system-spec-update-summary Step 1-B で CLAUDE.md 棚卸し対象明示、documentation-changelog で diff 草案として記録 |
| solo 運用で必須化しない方針 | implementation-guide Part 1 で「今は必須化しないが将来のために名札だけ貼る」の理由必須、Part 2 で `require_code_owner_reviews` 移行手順を別セクション化 |
| `gh api .../codeowners/errors` での検証 | implementation-guide Part 2 と Phase 11 manual-smoke-log.md で重複明記 |

## 前提

- Phase 11 spec walkthrough 完了（`outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md`）
- `link-checklist.md` Broken 0 件・N/A 9 件は current 課題として `unassigned-task-detection.md` の C-3 に昇格

## 完了判定

| 項目 | 判定 |
| --- | --- |
| 必須 5 outputs 存在 | 本 main.md 含め 6 ファイル揃っているか docs validator で確認 |
| Part 1 / Part 2 構造 | `rg "^## Part [12]"` で確認 |
| 1Password URI 混入 | `rg "op://"` で 0 件 |
| 計画系 wording | `rg "仕様策定のみ|実行予定|保留として記録"` で 0 件 |
| baseline 件数 | `unassigned-task-detection.md` の baseline section に最低 2 件 |
| skill-feedback 3 観点 | task-spec-creator / aiworkflow-requirements / docs 全行存在 |

## Phase 13 への引き渡し

- documentation-changelog → PR body の「変更内容」節
- unassigned-task-detection の current → PR body の「related work / follow-up」節
- skill-feedback-report → ナレッジとして Phase 13 完了後に各 skill の LOGS へ反映する入力

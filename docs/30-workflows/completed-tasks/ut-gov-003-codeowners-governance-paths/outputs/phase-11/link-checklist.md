# Phase 11 link checklist — UT-GOV-003 CODEOWNERS

> spec walkthrough における仕様書間 / 原典スペック / CLAUDE.md / 関連 UT-GOV タスク間の参照リンク健全性を確認する。

## 表記

- **OK**: 参照先が存在し、内容が本仕様書の引用と整合する
- **Broken**: 参照先が存在しない / リンク先内容が引用と不整合 / Phase 12 で同 sprint 修正
- **N/A**: 本仕様書整備時点では未存在（後続 Phase / 後続 PR で生成予定）

## 1. 内部リンク（本ワークフロー内）

| # | from | to | status |
| --- | --- | --- | --- |
| 1 | `phase-11.md` 参照資料 | `outputs/phase-11/main.md` | OK |
| 2 | `phase-11.md` 参照資料 | `outputs/phase-11/manual-smoke-log.md` | OK |
| 3 | `phase-11.md` 参照資料 | `outputs/phase-11/link-checklist.md`（本ファイル） | OK |
| 4 | `phase-12.md` 参照資料 | `outputs/phase-12/{implementation-guide,system-spec-update-summary,documentation-changelog,unassigned-task-detection,skill-feedback-report}.md` | OK |
| 5 | `phase-13.md` 参照資料 | `outputs/phase-13/main.md` | OK |
| 6 | `phase-11.md` → `phase-12.md` 引き継ぎ | `unassigned-task-detection.md` の current 区分 | OK |
| 7 | `phase-11.md` → `phase-13.md` 引き継ぎ | `outputs/phase-12/documentation-changelog.md` | OK |
| 8 | `index.md` / `artifacts.json` | `phase-01〜13.md` | N/A（本 PR は phase-11/12/13 の整備に閉じる。phase-01〜10 / index.md / artifacts.json は別 PR で整備済または同 sprint 整備対象） |

## 2. 原典スペック・CLAUDE.md・GitHub Issue

| # | from | to | status |
| --- | --- | --- | --- |
| 9 | `phase-11.md` 参照資料 | `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md` | OK |
| 10 | `phase-11.md` メタ | GitHub Issue #146 | OK（Issue 番号引用のみ） |
| 11 | `phase-12.md` Step 1-B | `CLAUDE.md` 主要ディレクトリ表（`doc/` と `docs/` 混在の指摘） | OK |
| 12 | `phase-12.md` Step 1-A | `.claude/skills/aiworkflow-requirements/references/` への governance 言及 | N/A（governance section 追記の要否は Step 1-A 判定対象） |

## 3. 関連 UT-GOV タスク

| # | from | to | status |
| --- | --- | --- | --- |
| 13 | `phase-11.md` / `phase-12.md` | `docs/30-workflows/completed-tasks/UT-GOV-001-github-branch-protection-apply.md`（または同等パス） | N/A（存在確認は Phase 12 link 修正時に再走） |
| 14 | 同上 | `UT-GOV-002-pr-target-safety-gate-dry-run` | N/A（同上） |
| 15 | 同上 | `UT-GOV-004-required-status-checks-context-sync` | N/A（同上） |
| 16 | `phase-12.md` unassigned-task | `UT-GOV-005-docs-only-nonvisual-template-skill-sync` | N/A（同上） |

## 4. テンプレ参照

| # | from | to | status |
| --- | --- | --- | --- |
| 17 | `phase-11.md` 参照資料 | `.claude/skills/task-specification-creator/references/phase-11-non-visual-alternative-evidence.md` | OK |
| 18 | `phase-11.md` 参照資料 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | OK |
| 19 | `phase-12.md` 参照資料 | `.claude/skills/task-specification-creator/references/phase-template-phase12.md` | OK |
| 20 | `phase-12.md` 参照資料 | `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md` | OK |
| 21 | `phase-13.md` 参照資料 | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | OK |

## 5. Broken リンクの取り扱い

- 上記 N/A は本 PR スコープ外で、関連タスク（UT-GOV-001/002/004/005）が後続 PR で起票され次第、双方向リンクを補完する。
- N/A → OK への昇格は Phase 12 `documentation-changelog.md` で記録する。
- Broken（参照先存在せず内容不整合）は本 PR ブロック条件。本 spec walkthrough 時点で 0 件。

## 6. 確認結果サマリー

| status | 件数 |
| --- | --- |
| OK | 12 |
| Broken | 0 |
| N/A（後続補完） | 9 |

> Broken 0 件のため Phase 12 への進行を許可する。N/A 9 件は Phase 12 unassigned-task-detection.md の current 区分で「関連 UT-GOV タスクとの双方向リンク補完」として記録する。

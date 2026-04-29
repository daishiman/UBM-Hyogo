# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タイトル | AC マトリクス（AC-1〜AC-10 × Phase 5 編集ファイル × 検証コマンド × Lane） |
| 状態 | completed |
| 作成日 | 2026-04-29 |
| 入力 Phase | Phase 1（AC 原典） / Phase 4（TC） / Phase 6（FC） |
| 出力対象 | `outputs/phase-07/ac-matrix.md` |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |

## 1. AC × ファイル × 検証コマンド × Lane 一対一マトリクス

Lane は Phase 5 実装ランブックで分担する作業レーン。`L-skill` = SKILL.md 編集 / `L-ref` = references 編集 / `L-mirror` = `.agents/` 同期 / `L-meta` = `artifacts.json` 整合 / `L-self` = 自己適用（Phase 11） / `L-review` = Phase 3 レビュー。

| AC ID | 内容（要約） | Phase 5 編集ファイル | 検証コマンド（代表） | 担当 Lane |
| --- | --- | --- | --- | --- |
| AC-1 | `phase-template-phase11.md` に縮約テンプレ追加 + 必須 3 点（main / manual-smoke-log / link-checklist） + screenshot 不要明文化 | `.claude/skills/task-specification-creator/references/phase-template-phase11.md` | `rg -n "縮約テンプレ\|main\.md\|screenshot" <path>` | L-ref |
| AC-2 | `visualEvidence == "NON_VISUAL"` 発火条件を SKILL.md と phase-template-phase11.md 両方に明記 | `SKILL.md` + `references/phase-template-phase11.md` | `rg -n "NON_VISUAL" SKILL.md references/phase-template-phase11.md` | L-skill + L-ref |
| AC-3 | Phase 12 Part 2 必須 5 項目を C12P2-1〜5 として一対一チェック項目化 | `references/phase-12-completion-checklist.md` | `rg -n "C12P2-[1-5]" <path>` | L-ref |
| AC-4 | `phase-12-completion-checklist.md` に docs-only ブランチ + `spec_created` / `completed` 状態分離 | `references/phase-12-completion-checklist.md` | `rg -n "docs-only\|workflow root\|workflow_state" <path>` | L-ref |
| AC-5 | `.claude/skills/...` ↔ `.agents/skills/...` mirror diff 0 | `.agents/skills/task-specification-creator/` 全 6 ファイル | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` | L-mirror |
| AC-6 | `phase-template-phase1.md`（または `phase-template-core.md`）に Phase 1 で `visualEvidence` を必須入力化 | `references/phase-template-phase1.md` + `references/phase-template-core.md`（参照） | `rg -n "visualEvidence.*必須\|必須入力" <path>` | L-ref |
| AC-7 | `taskType=docs-only` / `visualEvidence=NON_VISUAL` / `scope=skill_governance` / `workflow_state=spec_created` が `artifacts.json.metadata` と一致 | `artifacts.json` | `jq -r '.metadata \| .taskType, .visualEvidence, .scope, .workflow_state' artifacts.json` | L-meta |
| AC-8 | 本ワークフロー Phase 11 / 12 が縮約テンプレを自己適用、Phase 11 outputs は 3 点 + 第一例参照リンク | `outputs/phase-11/{main,manual-smoke-log,link-checklist}.md` + `references/phase-template-phase11.md` | `ls outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}` + `rg -n "ut-gov-005" references/phase-template-phase11.md` | L-self |
| AC-9 | 代替案 4 案（A/B/C/D）を PASS/MINOR/MAJOR で評価し base case D を PASS で確定 | `outputs/phase-03/main.md` | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/main.md` | L-review |
| AC-10 | Phase 1〜13 が `artifacts.json.phases[]` と完全一致（1〜3=completed / 4〜12=pending / 13=blocked）+ 4 条件 PASS | `artifacts.json` + `outputs/phase-01/main.md` + `outputs/phase-03/main.md` | `jq -r '.phases[] \| "\(.phase) \(.status)"' artifacts.json` | L-meta + L-review |

## 2. AC × TC × FC 三項対応

| AC | 関連 TC | 関連 FC | 自動化 |
| --- | --- | --- | --- |
| AC-1 | TC-2-1, TC-2-2, TC-2-3 | — | 自動（rg）|
| AC-2 | TC-1-1, TC-1-2, TC-2-4 | FC-A | 自動（rg）|
| AC-3 | TC-3-1, TC-3-2 | FC-B | 自動（rg）|
| AC-4 | TC-1-3, TC-3-3, TC-3-4 | FC-C | 自動（rg）|
| AC-5 | TC-5-1, TC-5-2 | FC-D | 自動（diff）|
| AC-6 | TC-4-1, TC-4-2 | FC-A | 自動（rg）|
| AC-7 | TC-M-1 | — | 自動（jq）|
| AC-8 | TC-7-1, TC-7-2, TC-8-2 | FC-F | 半自動（Phase 11 実測）|
| AC-9 | review | — | 手動 |
| AC-10 | TC-M-2 | — | 自動（jq）|

## 3. 証跡 path 命名（先取り）

| 証跡 path | 生成 Phase | 紐付く AC |
| --- | --- | --- |
| `outputs/phase-05/implementation-runbook.md` | Phase 5 | AC-1〜AC-6 |
| `outputs/phase-06/failure-cases.md` | Phase 6 | FC 全件 |
| `outputs/phase-09/main.md` | Phase 9 | AC-5, AC-7, AC-10（再確認）|
| `outputs/phase-11/main.md` | Phase 11 | AC-8 |
| `outputs/phase-11/manual-smoke-log.md` | Phase 11 | AC-5（mirror 再確認）/ AC-8 |
| `outputs/phase-11/link-checklist.md` | Phase 11 | AC-8 |
| `outputs/phase-12/implementation-guide.md` | Phase 12 | AC-3 自己適用 |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | Phase 12 | AC-4 |
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 | TECH-M-02/03/04 |

## 4. ゲート連携

| Phase 遷移 | ゲート条件 | 関連 AC |
| --- | --- | --- |
| Phase 5 → 6 | TC-1〜TC-6 全 GREEN | AC-1〜AC-6 |
| Phase 9 → 10 | mirror diff 0 + typecheck/lint PASS + jq 整合 | AC-5, AC-7, AC-10 |
| Phase 10 → 11 | base case D PASS 維持 + 縮約テンプレ skill 反映済 | AC-9, AC-1, AC-2 |
| Phase 11 → 12 | 自己適用 3 点 outputs 完了 | AC-8 |
| Phase 12 → 13 | C12P2-1〜5 全 PASS + 状態分離維持 | AC-3, AC-4 |

## 5. Lane 割当サマリー

| Lane | 担当 AC | 主担当ファイル群 |
| --- | --- | --- |
| L-skill | AC-2 | `SKILL.md` |
| L-ref | AC-1, AC-2, AC-3, AC-4, AC-6 | `references/` 5 ファイル |
| L-mirror | AC-5 | `.agents/skills/task-specification-creator/` |
| L-meta | AC-7, AC-10 | `artifacts.json` |
| L-self | AC-8 | `outputs/phase-11/` 3 点 |
| L-review | AC-9, AC-10 | `outputs/phase-03/main.md` |

## 6. 注意事項

- AC-9 の機械検証は `rg "PASS|MINOR|MAJOR"` の minimal grep のみ。内容妥当性は Phase 10 review で担保。
- AC-8 は Phase 11 着手後でないと GREEN 化できない循環があるため、Phase 9 で強制 GREEN 化を試みない。
- TECH-M-01〜04 は AC ではなく追跡項目。本マトリクスには含めない（Phase 8 / 12 で別管理）。
- `jq` 期待出力をハードコードせず `artifacts.json` を正本として参照する。

# Phase 4: テスト戦略（docs-only / NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タイトル | テスト戦略（docs-only / NON_VISUAL） |
| 状態 | completed |
| 作成日 | 2026-04-29 |
| 入力 Phase | Phase 1 / Phase 2 / Phase 3 |
| 出力対象 | `outputs/phase-04/test-strategy.md` |
| タスク名 | ut-gov-005-docs-only-nonvisual-template-skill-sync |

## 1. 戦略概要

本タスクは skill ファイル群（`SKILL.md` + references 5 ファイル）への文字列追記と `.agents/` mirror 同期のみを行う docs-only / NON_VISUAL タスク。ランタイムコードは触らないため単体テストは追加せず、検証は以下 3 系統の決定論的コマンドで行う。

| 系統 | ツール | 役割 |
| --- | --- | --- |
| 構造検証 | `rg`（ripgrep） / `grep -rn` 代替可 | 追記内容が指定セクションに存在するか |
| 同期検証 | `diff -qr` | `.claude/skills/` ↔ `.agents/skills/` の mirror parity |
| メタ整合 | `jq` | `artifacts.json.metadata` / `phases[].status` の値確認 |
| 副作用なし | `pnpm typecheck` / `pnpm lint` | コード非変更の証跡 |

## 2. テストレベル

| レベル | 対象 | 自動化 | 主要コマンド |
| --- | --- | --- | --- |
| L1 構造 | skill 6 ファイルの追記内容 | 自動 | `rg` |
| L2 同期 | `.claude` ↔ `.agents` ディレクトリ | 自動 | `diff -qr` |
| L3 メタ | `artifacts.json` | 自動 | `jq` |
| L4 副作用 | リポジトリ全体 | 自動 | `pnpm typecheck` / `pnpm lint` |
| L5 自己適用 | 本ワークフロー Phase 11 outputs | 半自動 | `ls` + `rg` |
| L6 レビュー | Phase 3 PASS 判定 | 手動 | review |

## 3. 検証コマンド一覧（TC-1〜TC-8）

Phase 4 仕様で確定した TC をそのまま正本として再掲する。

### TC-1 SKILL.md 判定フロー

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-1-1 | 1 件以上 | `rg -n "タスクタイプ判定フロー" .claude/skills/task-specification-creator/SKILL.md` |
| TC-1-2 | 1 件以上 | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/SKILL.md` |
| TC-1-3 | 両方 1 件以上 | `rg -n "spec_created" .claude/skills/task-specification-creator/SKILL.md && rg -n "completed" .claude/skills/task-specification-creator/SKILL.md` |

### TC-2 phase-template-phase11.md 縮約テンプレ

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-2-1 | 1 件以上 | `rg -n "縮約テンプレ" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-2 | 3 つすべて | `rg -n "main\.md\|manual-smoke-log\.md\|link-checklist\.md" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-3 | 1 件以上 | `rg -n "screenshot" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-2-4 | 1 件以上 | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |

### TC-3 phase-12-completion-checklist.md Part 2 5 項目

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-3-1 | 5 件 | `rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-2 | 5 件以上 | `rg -n "型定義\|API シグネチャ\|使用例\|エラー処理\|設定" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-3 | 1 件以上 | `rg -n "docs-only" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| TC-3-4 | 1 件以上 | `rg -n "workflow_state\|workflow root" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |

### TC-4 Phase 1 必須入力 / core 参照

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-4-1 | 1 件以上 | `rg -n "visualEvidence.*必須\|必須入力" .claude/skills/task-specification-creator/references/phase-template-phase1.md` |
| TC-4-2 | 1 件以上 | `rg -n "タスクタイプ判定フロー\|phase-template-phase11" .claude/skills/task-specification-creator/references/phase-template-core.md` |

### TC-5 Mirror parity

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-5-1 | 0 行 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |
| TC-5-2 | 6 件存在 | `ls .agents/skills/task-specification-creator/SKILL.md .agents/skills/task-specification-creator/references/{phase-template-phase11,phase-template-phase12,phase-12-completion-checklist,phase-template-phase1,phase-template-core,phase-11-non-visual-alternative-evidence}.md` |

### TC-6 副作用なし

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-6-1 | exit 0 | `mise exec -- pnpm typecheck` |
| TC-6-2 | exit 0 | `mise exec -- pnpm lint` |

### TC-7 自己適用（Phase 11 実測）

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-7-1 | 3 ファイル | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}` |
| TC-7-2 | 0 件 | `ls docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/outputs/phase-11/ \| rg -i "screenshot\|manual-test-result\|manual-test-checklist" \|\| true` |

### TC-8 既存セクションとの整合

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-8-1 | 1 件以上 | `rg -n "別セット\|混在させない" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| TC-8-2 | 1 件以上 | `rg -n "ut-gov-005-docs-only-nonvisual-template-skill-sync" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |

### TC-M メタ整合（jq）

| TC ID | 期待 | コマンド |
| --- | --- | --- |
| TC-M-1 | `docs-only` / `NON_VISUAL` / `skill_governance` を出力 | `jq -r '.metadata \| .taskType, .visualEvidence, .scope' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/artifacts.json` |
| TC-M-2 | 13 行（`<phase> <status>`）出力 | `jq -r '.phases[] \| "\(.phase) \(.status)"' docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/artifacts.json` |

## 4. AC ↔ 検証コマンド対応表

| AC ID | 関連 TC | 代表検証コマンド |
| --- | --- | --- |
| AC-1 | TC-2-1, TC-2-2, TC-2-3 | `rg -n "縮約テンプレ\|main\.md\|screenshot" .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| AC-2 | TC-1-1, TC-1-2, TC-2-4 | `rg -n "NON_VISUAL" .claude/skills/task-specification-creator/SKILL.md .claude/skills/task-specification-creator/references/phase-template-phase11.md` |
| AC-3 | TC-3-1, TC-3-2 | `rg -n "C12P2-[1-5]" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| AC-4 | TC-1-3, TC-3-3, TC-3-4 | `rg -n "docs-only\|workflow root" .claude/skills/task-specification-creator/references/phase-12-completion-checklist.md` |
| AC-5 | TC-5-1, TC-5-2 | `diff -qr .claude/skills/task-specification-creator .agents/skills/task-specification-creator` |
| AC-6 | TC-4-1, TC-4-2 | `rg -n "visualEvidence.*必須" .claude/skills/task-specification-creator/references/phase-template-phase1.md` |
| AC-7 | TC-M-1 | `jq -r '.metadata \| .taskType, .visualEvidence, .scope' artifacts.json` |
| AC-8 | TC-7-1, TC-7-2, TC-8-2 | `ls outputs/phase-11/{main.md,manual-smoke-log.md,link-checklist.md}` |
| AC-9 | review | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/main.md` |
| AC-10 | TC-M-2 | `jq -r '.phases[] \| "\(.phase) \(.status)"' artifacts.json` |

## 5. fail-fast 実行順序

1. **TC-5（mirror diff）** — 同期忘れを最速検出
2. **TC-1〜TC-4（構造 grep）** — 6 ファイルの追記確認
3. **TC-M（jq）** — `artifacts.json` 整合
4. **TC-6（typecheck/lint）** — 副作用ゼロの最終確認
5. **TC-7（自己適用）** — Phase 11 着手後に実測
6. **TC-8（整合）** — Phase 8 DRY 化後に再確認

## 6. スコープ外宣言

- skill-fixture-runner による YAML フロントマター / Anchors / セクション構造の機械検証は本タスクスコープ外（Phase 3 MINOR TECH-M-04 として別タスク化）。
- CI gate 化（mirror parity の自動強制）は TECH-M-02 として別タスク化。本 Phase は手動 `diff -qr` で担保する。
- `rg` 不在環境での代替（`grep -rn`）は Phase 5 実装ランブックで明記する。

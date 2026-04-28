# Phase 12 — documentation-changelog

## Status

completed

## 構成

本ファイルは Phase 12 で発生した **ドキュメント差分** を 2 ブロックに分けて記録する。

- ブロック A：workflow-local（本ワークフロー `docs/30-workflows/task-git-hooks-lefthook-and-post-merge/` 配下）
- ブロック B：global skill（`.claude/skills/aiworkflow-requirements/`、`.claude/skills/task-specification-creator/`）への同期

---

## ブロック A — workflow-local 差分

| Step | 対象ファイル | 種別 | 結果 |
| --- | --- | --- | --- |
| 1-A | `outputs/phase-12/system-spec-update-summary.md` | new | completed — 実装影響の特定（API / D1 / UI / bindings / secrets / invariants 全て影響なし）を記録 |
| 1-B | `outputs/phase-12/system-spec-update-summary.md` | append | completed — DevOps 正本と skill LOGS への same-wave sync を記録 |
| 1-C | `outputs/phase-12/system-spec-update-summary.md` | append | completed — workflow-local outputs 1〜3 の整合性確認、MINOR 指摘 M-01〜M-04 のトレースを記録 |
| 1-D | `.claude/skills/task-specification-creator/LOGS.md` | append | completed — Phase 状態同期・共通骨格補完・future wording 排除の close-out を記録 |
| 1-D | `.claude/skills/aiworkflow-requirements/LOGS.md` | append | completed — lefthook 正本化 / post-merge indexes 再生成廃止の仕様同期を記録 |
| 1-D | `.claude/skills/aiworkflow-requirements/references/technology-devops-core.md` | append | completed — Git hook 運用正本と CI 代替ゲートを追記 |
| 1-E〜1-G | `outputs/phase-12/system-spec-update-summary.md` | append | completed — current/baseline 分離、Phase 10 MINOR 追跡、検証コマンド結果を記録 |
| Step 2 | `outputs/phase-12/system-spec-update-summary.md` | append | completed — 新規 I/F 追加なしのため **N/A 判定** を根拠つきで明記 |
| - | `outputs/phase-12/main.md` | new | completed — Phase 12 サマリと 5 タスク完了状況 |
| - | `outputs/phase-12/implementation-guide.md` | new | completed — Part 1（中学生レベル）+ Part 2（技術詳細）の二層構成 |
| - | `outputs/phase-12/unassigned-task-detection.md` | new | completed — current/baseline 分離で 3 candidate を記録 |
| - | `outputs/phase-12/skill-feedback-report.md` | new | completed — テンプレ / ワークフロー / ドキュメント観点でフィードバック記載 |
| - | `outputs/phase-12/phase12-task-spec-compliance-check.md` | new | completed — Phase 1-13 outputs と artifacts.json の 1:1 突合結果 |
| - | `outputs/phase-13/main.md` | new | completed — `pending_user_approval` ステータス明記 |
| - | `outputs/phase-13/change-summary.md` | new | completed — 追加ファイル一覧 + diff サマリ |
| - | `outputs/phase-13/pr-template.md` | new | completed — PR title / body テンプレート（Claude Code フッタ付き） |

### workflow-local 影響範囲

- 追加ファイル: 10（Phase 12 × 7、Phase 13 × 3）
- 既存ファイル更新: Phase 1〜13 仕様本文、`index.md`、`artifacts.json`、Phase 11/12/13 close-out 文書を current facts へ同期
- artifacts.json 改変: Phase 1〜12 を `completed`、Phase 13 を `pending_user_approval` へ同期

---

## ブロック B — global skill sync（same-wave completed）

global skill 側へ反映すべき差分を以下に記録する。Phase 12 の future wording 禁止に従い、本タスクで正本化できる内容は same-wave で反映済みとした。実コード作成を伴う項目だけを unassigned task 側へ分離する。

### B-1. `task-specification-creator` skill

| 観点 | 同期候補 | 根拠 | 状態 |
| --- | --- | --- | --- |
| LOGS.md | 本タスクの skill 準拠検証 FAIL → 修正 → PASS の close-out を追加 | 状態同期、共通骨格、future wording 排除の再発防止 | completed |
| SKILL.md / references | 既存 `phase-template-phase12.md` の future wording 禁止と Step 1-G 要件を適用 | 既存定義で足りるため本文変更なし | completed（適用確認） |
| Phase 12 テンプレ | unassigned-task-detection の current/baseline 分離を本タスク成果物で実例化 | 0 件で済ませない運用ルールの実例 | completed（実例追加） |

### B-2. `aiworkflow-requirements` skill

| 観点 | 同期候補 | 根拠 | 状態 |
| --- | --- | --- | --- |
| LOGS.md | post-merge 自動 indexes 再生成廃止の経緯を追記 | 旧運用の事故事例として保存価値あり | completed |
| references/technology-devops-core.md | Git hook 正本を `lefthook.yml` とし、indexes rebuild は明示実行 + CI 検証へ分離する方針を追記 | post-merge 廃止後の新運用 | completed |
| references/ | lefthook 運用ガイドへの導線は本タスク implementation-guide から参照 | 実装タスクでの詳細化に委譲 | completed（implementation 境界内） |

### B-3. 同期実行ポリシー

- 本タスクは implementation / NON_VISUAL のため、`package.json` / `.gitignore` / `lefthook.yml` / `scripts/hooks/*.sh` / `scripts/new-worktree.sh` / `CLAUDE.md` / `doc/00-getting-started-manual/lefthook-operations.md` を同一 wave で更新した。
- 仕様正本と skill feedback は same-wave で反映済み。
- 未完了として残すのは CI `verify-indexes-up-to-date` job のみ。正式未タスクは `docs/30-workflows/unassigned-task/task-verify-indexes-up-to-date-ci.md` に作成済み。

---

## 完了条件

- [x] workflow-local 差分を全て列挙
- [x] global skill 同期結果を別ブロックで記録
- [x] future wording を残さず、実装コード変更だけを unassigned task に分離

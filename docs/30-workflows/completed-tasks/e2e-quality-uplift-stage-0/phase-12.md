# Phase 12: ドキュメント更新（Stage 0）

date (absolute): 2026-05-09 / branch: `feat/e2e-quality-uplift` / PR base: `dev` / coverageTier: `standard`

> Stage 0 は implementation。本 phase は **6 Task** 構造（実装ガイド / 仕様更新 / changelog / 未タスク / skill feedback / task-spec compliance）に従い、本サイクル成果物の docs・実コード・skill 同期を棚卸しする。

---

## Task 1 — 実装ガイド（Part 1 / Part 2）

### Part 1: 中学生レベル概念説明（5 行以内）

「Playwright（プレイライト）」は、Web ブラウザを自動で動かしてサイトをテストする道具。`apps/web/playwright/` フォルダの中に「テストの台本」（spec ファイル）が並んでいる。Stage 0 ではその「使い方の説明書（README）」と「飛ばすテストの正式ルール」を整えた。説明書がないと、新しく入る人や Claude が毎回迷うので、迷わないための地図を作った状態。

### Part 2: 開発者向け実装手引き（本サイクル で参照）

| 手順 | 内容 | 参照仕様 |
| --- | --- | --- |
| 1 | `apps/web/playwright/README.md` を 7 章構成で新規作成 | phase-2 §3 |
| 2 | `apps/web/playwright.config.ts` の `projects[]` 末尾に `evidence-capture` を追加 | phase-2 §4 |
| 3 | `apps/web/package.json` の `e2e` script に `--project=desktop-chromium,desktop-firefox,mobile-webkit` を明示 | phase-8 §3 |
| 4 | 旧 `profile-readonly.spec.ts` の `06b-C` evidence spec を新 file `profile-readonly-logged-in.spec.ts` に移植し、旧ファイルを削除 | phase-4 §0（R1 案 A） |
| 5 | `profile-{visibility,delete}-request.spec.ts:2` の stale comment を 1 行ずつ削除 | phase-2 §4 |
| 6 | `.claude/skills/task-specification-creator/references/quality-gates.md` §7.1 (4) に例外条項 8 行追記 | phase-5 §3-A |
| 7 | RG-1〜RG-10 / FP-1〜FP-7 の grep を local で回し Green を確認 | phase-4 §1 / phase-6 §1 |
| 8 | PR base = `dev`、本 PR とは別 cycle として PR 作成 | phase-13 |

---

## Task 2 — システム仕様更新（Step 1-A / 1-B / 1-C）

### Step 1-A: 影響を受ける spec docs

| spec | 更新要否 | 理由 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/00-overview.md` | 不要 | システム overview に変更なし |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | 不要 | API schema 変更なし |
| `docs/00-getting-started-manual/specs/02-auth.md` | 不要 | auth 設計に変更なし |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | 不要 | MVP 認証方針に変更なし |
| `docs/00-getting-started-manual/claude-code-config.md` | 不要 | Claude Code 設定に変更なし |

→ 本サイクルでは specs/ 配下の更新は **発生しない**。

### Step 1-B: skill references の更新（本サイクル）

| skill | references 更新要否 | 内容 |
| --- | --- | --- |
| `task-specification-creator` | 本サイクルで `quality-gates.md` §7.1 (4) / §7.5 と coverage reference を更新 | evidence-capture 例外、tier-aware E2E coverage policy、workspace 80% guard との境界 |
| `aiworkflow-requirements` | 本サイクルで更新 | quick-reference / resource-map / task-workflow-active / changelog に Stage 0 実装と Stage 1-3 spec package を同期 |
| `github-issue-manager` | 不要 | issue 構造に影響なし |

### Step 1-C: workflow docs（30-workflows/）

| path | 操作 |
| --- | --- |
| `docs/30-workflows/e2e-quality-uplift-stage-0/index.md` | Phase 4-13 status を `done` に更新 |
| `docs/30-workflows/e2e-quality-uplift-stage-0/phase-{4..13}.md` | 本 PR で新規生成 |
| `docs/30-workflows/e2e-quality-uplift/`（上位 workflow） | 本サイクルで touch 済み（Stage 1 開始時に index 更新） |

---

## Task 3 — changelog

本サイクルは implementation PR のため、製品 changelog（`CHANGELOG.md` 相当）への記載対象外。代替として aiworkflow changelog と PR 本文の `## Summary` に以下を記録する:

- Stage 0 仕様書 Phase 4-13 を完成（10 ファイル新規）
- R1（profile-readonly evidence spec の責務名 drift）を案 A（evidence-only spec rename/extract）に確定
- 本サイクルで実コード edit 6 箇所と skill reference 更新を実施
- Stage 1-3 は実装済みではなく `spec_verified_pending_dependency`

---

## Task 4 — 未タスク（0 件でも明示出力）

| ID | 内容 | status |
| --- | --- | --- |
| - | **未タスク 0 件** | 全 sub-task が Stage 0b / 0c に集約済 |

CONST_007 単一サイクルスコープに従い、本サイクルで sub-task を増やさない。Stage 1 以降に持ち越す事項は phase-10 §3 完了項目テーブル H-1〜H-6 に列挙済。

---

## Task 5 — skill feedback

`task-specification-creator` skill への運用 feedback:

| # | 観点 | feedback |
| --- | --- | --- |
| F-1 | NON_VISUAL タスクで Phase 7 を Phase 6 に統合する判定が再利用しやすかった | 現行 Phase 7 template の「coverage 取得不要 justification」分岐は機能している |
| F-2 | implementation サイクルで実コード edit を本サイクルに切り出す pattern が CONST_007 と整合 | 「仕様書 cycle」と「実装 cycle」の 2 段構成を template 化すると再利用性が上がる |
| F-3 | R1 のような open question を Phase 3 verdict と Phase 4 §0 で受け渡しする運用が機能 | Phase 3 → Phase 4 の hand-off 章を template 標準化候補 |
| F-4 | grep gate（RG-*）と fail path（FP-*）の二系統で AC を相互補強する構成が implementation PR で有効 | RG / FP の対応表を Phase 9 で再確認する flow を template に組み込む候補 |
| F-5 | E2E 80% 固定を tier-aware 化する変更は全タスクに波及する | `coverage-standards.md` で workspace 80% guard と E2E standard 70% の境界を明記し、降格は user 承認対象にする |

## Task 6 — task-spec compliance

詳細は `outputs/phase-12/phase12-task-spec-compliance-check.md` に保存する。本レビューで §7.6 の 8 点 checklist を実体確認し、path 存在だけを PASS にしない。

---

## Phase 12 完了条件

- Task 1〜6 すべて出力 ✓
- specs/ 配下への波及 0 件確認 ✓
- 未タスク 0 件明示 ✓
- skill feedback 5 件記録 ✓

→ Phase 13 へ。

---

## Template Compliance Appendix

## メタ情報

- workflow: e2e-quality-uplift-stage-0
- phase: 12
- task classification: implementation / NON_VISUAL
- coverageTier: standard
- workflow_state: verified

## 目的

Stage 0 の E2E quality uplift 変更を skill 定義と実ファイル差分へ同期し、矛盾なし・漏れなし・整合性あり・依存関係整合を満たす。

## 実行タスク

- 既存本文の phase 内容を実行単位として保持する。
- 実ファイル変更、仕様書、Phase evidence、skill feedback の対応を確認する。

## 参照資料

- .claude/skills/task-specification-creator/references/phase-template-core.md
- .claude/skills/task-specification-creator/references/quality-gates.md
- .claude/skills/aiworkflow-requirements/SKILL.md

## 実行手順

1. 本 phase の既存本文を確認する。
2. 対応する実ファイル差分または evidence を確認する。
3. validator と grep gate の結果を Phase 11 / Phase 12 evidence に反映する。

## 成果物

- 本 phase markdown
- 関連 outputs/phase-11 または outputs/phase-12 evidence
- 必要に応じた apps/web / .claude/skills 実ファイル差分

## 完了条件

- [x] 必須セクションが存在する。
- [x] coverage AC 適用: E2E tier-aware standard lines >=70%、workspace coverage guard は既存基準に従う。
- [x] 矛盾なし・漏れなし・整合性あり・依存関係整合を確認する。

## タスク100%実行確認【必須】

- [x] phase 本文のタスクを棚卸しした。
- [x] 未実行項目を PASS として扱っていない。

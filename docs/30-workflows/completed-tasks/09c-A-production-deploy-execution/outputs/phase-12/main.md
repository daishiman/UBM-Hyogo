# Phase 12 Output: ドキュメント更新 — 09c-A-production-deploy-execution

[実装区分: 実装仕様書（runbook execution + evidence collection）]

> **判定行**: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（spec completeness PASS / Phase 11 runtime evidence pending）
>
> 本ファイルは Phase 12 のトップ index として、6 必須タスクの概要と各チェック項目を集約する。`metadata.workflow_state: spec_created` を維持し、`completed` / `verified` への昇格は別運用（実 production execution operation 完了後）で行う。

## 0. workflow_state 維持ルール（重要）

| 対象 | 値 | 書き換えタイミング |
| --- | --- | --- |
| root `artifacts.json.metadata.workflow_state` | `spec_created`（変更禁止） | 実 production execution operation 完了後の別 PR |
| root `artifacts.json.phases[].status` | `pending → completed`（13 phase 分） | 本 Phase 12 完了時 |
| `phase12-task-spec-compliance-check.md` 総合判定行 | `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` | 本 Phase 12 完了時 |
| aiworkflow-requirements indexes 実反映 | current canonical root / state を同一 wave で同期済み | runtime facts は execution operation 後に上書き |
| spec 15 実反映 | 新規 API / 型 / runtime fact 追加なしのため N/A | production 実測値は execution operation 後に同期 |

## 1. 6 必須タスク Index

| # | task | 出力ファイル | 由来 | 概要 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド（Part 1 / Part 2） | `implementation-guide.md` | phase-12-spec.md Task 1 | 中学生レベルの概念説明 + 技術者レベルの runbook / 型定義 / コマンド例 |
| 2 | システム仕様書更新 | `system-spec-update-summary.md` | Task 2（Step 1-A〜1-C / Step 2 / Step 1-H） | aiworkflow indexes / source unassigned / artifact inventory の same-wave sync |
| 3 | ドキュメント更新履歴 | `documentation-changelog.md` | Task 3 | 09c-A 配下 14 ファイル + 同期対象（aiworkflow indexes / specs/15）の追加・変更・削除 |
| 4 | 未タスク検出（0 件でも出力必須） | `unassigned-task-detection.md` | Task 4 | follow-up execution（FU-1〜FU-3）と unassigned task の境界明示 |
| 5 | スキルフィードバック（3 観点固定） | `skill-feedback-report.md` | Task 5 | テンプレ改善 / ワークフロー改善 / ドキュメント改善 |
| 6 | コンプライアンスチェック | `phase12-task-spec-compliance-check.md` | Task 6 | 不変条件 #5 / #6 / #14 + 仕様書 7 ファイル parity + runtime pending 明示 |

合計 7 ファイル（本ファイル `main.md` + 6 必須タスク）。

## 2. 各成果物の概要 + チェック項目

### 2.1 implementation-guide.md（Task 1）

**Part 1（中学生レベル）**:

- 例え話: 「お祭りの本番（production）でステージ設営（deploy）→ 開場前の最終確認（smoke）→ 開場後 24 時間の見守り（24h verification）」を 1 段落で導入
- 専門用語セルフチェック（5 用語以上）:
  - 「Cloudflare D1（クラウド上の SQLite データベース）」
  - 「マイグレーション（データベースの設計図を更新する作業）」
  - 「デプロイ（作ったプログラムをサーバーへ置く作業）」
  - 「リリースタグ（その時点の成果物に貼る目印シール）」
  - 「フリーティア（無料で使える上限枠）」
- 「なぜ必要か」→ 「何をするか」の順で記述

**Part 2（技術者レベル）**:

- 13 ステップ runbook の要約（Phase 1 § 4 と整合）
- TypeScript / config の型定義例（`wrangler.toml` の `env.production` ブロック / `D1Database` binding 型）
- `bash scripts/cf.sh` 各引数の使用例
- error handling: migration apply 失敗 / deploy 失敗 / smoke 5xx / authz violation の各分岐
- 設定可能パラメータ: release tag フォーマット / 24h verification 取得間隔 / free-tier 閾値

**チェック項目**:

- [ ] Part 1 に例え話 1 つ以上
- [ ] Part 1 専門用語表 5 行以上
- [ ] Part 1「なぜ必要か」が「何をするか」より先
- [ ] Part 2 に TypeScript 型定義
- [ ] Part 2 に `bash scripts/cf.sh` のコマンド例
- [ ] Part 2 に error handling 4 分岐

### 2.2 system-spec-update-summary.md（Task 2）

**Step 1-A: タスク完了記録**:

- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` の production execution path を現存 root へ補正
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` の row を `VISUAL_ON_EXECUTION / strict outputs present` へ補正
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の active row を現存 root へ補正
- artifact inventory / lessons / source unassigned task の canonical root を補正

**Step 1-B: 実装状況テーブル更新**:

- 09c-A の実装状況を `spec_created / implementation / VISUAL_ON_EXECUTION` で記録（`completed` / `applied` ではない）

**Step 1-C: 関連タスクテーブル更新**:

- 09a-A / 09b-A / 09b-B / 09c serial の関連を current facts で更新

**Step 1-H: skill-feedback routing**:

- 各 feedback item を owning skill / reference / lesson / no-op に routing
- promotion target / no-op reason / evidence path を記録

**Step 2（条件付き）: 新規インターフェース追加**:

- 判定: **N/A**（新規 TypeScript interface / API endpoint / IPC 契約 / shared 型の追加なし）
- 理由 3 点:
  1. 本タスクは production deploy execution の **runbook execution + evidence collection**。コード差分なし
  2. 既存 `bash scripts/cf.sh` / `mise exec -- pnpm --filter @ubm-hyogo/web build:cloudflare` / `git tag` のみで実現
  3. 派生作業（runbook 自動化 / GitHub Actions schedule）は別タスク（unassigned-task-detection.md で参照）

**チェック項目**:

- [ ] Step 1-A〜1-C 完了
- [ ] Step 1-H 各 feedback item の routing 明記
- [ ] Step 2 N/A 根拠 3 点記載
- [ ] aiworkflow-requirements indexes / references の現存 root 同期が記録
- [ ] spec 15 Step 2 N/A の根拠が記録

### 2.3 documentation-changelog.md（Task 3）

**追加**:

- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/index.md`
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/artifacts.json`
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/phase-{01..13}.md`（13 ファイル）
- `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-{01..13}/main.md`（13 ファイル）
- `outputs/phase-12/` 配下 6 必須ファイル
- `outputs/phase-13/pr-template.md` / `pr-creation-result.md`（雛形、配置済み / user approval 後に実値追記）

**変更**:

- `docs/30-workflows/unassigned-task/task-09c-production-deploy-execution-001.md`（canonical root / deploy command）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（production execution path）
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`（production execution row）
- `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md`（active workflow row）
- `.claude/skills/aiworkflow-requirements/references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md`（canonical root / verification command）
- `.claude/skills/aiworkflow-requirements/references/lessons-learned-09c-production-deploy-execution-001-2026-05.md`（対象 root）

**削除**: なし

**チェック項目**:

- [ ] 追加 / 変更 / 削除カテゴリすべて明記
- [ ] same-wave sync 対象が列挙されている
- [ ] runtime facts は pending と明記されている

### 2.4 unassigned-task-detection.md（Task 4）

**新規未タスク**: **0 件**（明示記載必須）

**理由**:

- 本タスクの follow-up（FU-1〜FU-3）は unassigned ではなく **execution-time task**（production execution operation で実行）
- 派生 follow-up は完了済み 09c serial の unassigned-task として既に formalize 済み（`task-09c-production-deploy-execution-001.md` ほか）
- スコープ外として明記された項目は Phase 1 § 1 / Phase 3 で確定済み

**継続観測項目（execution operation 後に発生する継続タスク / 0 件 unassigned とは別軸）**:

- 1 週間後 / 1 ヶ月後の Cloudflare metrics トレンド観測（既存の `task-09c-long-term-production-observation-001.md` で formalize 済み）
- 24h verification の自動化（既存の `task-09c-post-release-dashboard-automation-001.md`）

**チェック項目**:

- [ ] 0 件である旨を明示
- [ ] follow-up execution と unassigned の境界明示
- [ ] 既存 unassigned task への参照リンク

### 2.5 skill-feedback-report.md（Task 5）

**3 観点固定**:

| 観点 | 記録内容 |
| --- | --- |
| テンプレート改善 | Phase 11 の `VISUAL_ON_EXECUTION` 運用ルール（placeholder と実測の境界）を `phase-template-phase11.md` Cloudflare deploy-verification subtemplate にもう一段詳細化（screenshot 命名規約 / smoke 23 枚 + metrics 8 枚の合計 31 枚を例示として追加）を提案 |
| ワークフロー改善 | `metadata.workflow_state: spec_created` のまま Phase 12 を close-out するワークフロー（本タスク）が phase-12-spec.md の §「Phase 13 承認ゲート付き NON_VISUAL implementation」に既出のため、VISUAL_ON_EXECUTION 系も同節へ言及する改善を提案 |
| ドキュメント改善 | `bash scripts/cf.sh` の rollback / d1 export の最低 1 行コマンド例が散在しているため、`docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に「production deploy execution コマンド集」セクションを追加することを提案 |

各 item は Step 1-H で promote / defer / reject の routing を行う。

**チェック項目**:

- [ ] 3 観点すべてに記入（改善点なしの場合も明示）
- [ ] 各 item の Step 1-H routing が `system-spec-update-summary.md` に対応

### 2.6 phase12-task-spec-compliance-check.md（Task 6）

**総合判定行**: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`

**不変条件チェック（#5 / #6 / #14 を中心に）**:

| 不変条件 | spec 計画 | runtime 判定 |
| --- | --- | --- |
| #5 public/member/admin boundary | COVERED（smoke 23 枚で確認予定） | `PENDING_RUNTIME_EVIDENCE` |
| #6 apps/web → D1 直接禁止 | COVERED（web bundle inspection 計画） | `PENDING_RUNTIME_EVIDENCE` |
| #14 Cloudflare free-tier | COVERED（24h verification timing 確定） | `PENDING_RUNTIME_EVIDENCE` |

**仕様書 7 ファイル parity check**:

| # | ファイル | 配置 | 状態 |
| --- | --- | --- | --- |
| 1 | `main.md` | ✅ | PASS |
| 2 | `implementation-guide.md` | ✅ | PASS |
| 3 | `system-spec-update-summary.md` | ✅ | PASS |
| 4 | `documentation-changelog.md` | ✅ | PASS |
| 5 | `unassigned-task-detection.md` | ✅ | PASS（0 件記載） |
| 6 | `skill-feedback-report.md` | ✅ | PASS |
| 7 | `phase12-task-spec-compliance-check.md` | ✅ | PASS（本ファイル） |

**parity 文言（`outputs/artifacts.json` 不在ケース）**:

> `outputs/artifacts.json` は本ワークフローでは作成されておらず、root `artifacts.json` が唯一正本である。parity check は root のみで実施し PASS とする。

**チェック項目**:

- [ ] 総合判定行 = `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- [ ] 不変条件 #5 / #6 / #14 が `PENDING_RUNTIME_EVIDENCE` で記録
- [ ] 7 ファイル parity 全 PASS
- [ ] root artifacts.json 単独正本宣言の文言が記載

## 3. aiworkflow-requirements indexes 同時更新の差分項目

| 対象 | 反映 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | production execution path を `docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/` に補正 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current workflow row を現存 root / `VISUAL_ON_EXECUTION` / strict outputs present に補正 |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | active row を現存 root / runtime pending 境界に補正 |
| `.claude/skills/aiworkflow-requirements/references/workflow-task-09c-production-deploy-execution-001-artifact-inventory.md` | canonical root / verification command を現存 root に補正 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-09c-production-deploy-execution-001-2026-05.md` | 対象 root を現存 root に補正 |

新規 API / 型 / runtime fact の追加はないため spec 15 Step 2 は N/A。runtime facts は execution operation 完了後に同期する。

## 4. 完了確認

- [ ] 7 ファイル配置済み
- [ ] root `artifacts.json.metadata.workflow_state` = `spec_created`（変更なし）
- [ ] root `artifacts.json.phases[].status` = `pending → completed`（13 phase 分）
- [ ] 不変条件 #5 / #6 / #14 が `PENDING_RUNTIME_EVIDENCE` で記録
- [ ] secret 値が含まれない

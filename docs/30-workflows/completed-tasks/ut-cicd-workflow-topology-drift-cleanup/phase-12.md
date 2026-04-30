# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | CI/CD workflow topology and deployment spec drift cleanup (UT-CICD-DRIFT) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | docs-only / specification-cleanup（close-out / docs sync） |
| user_approval_required | false |

## 目的

Phase 1〜11 で得られた drift マトリクス・正本仕様更新案・派生タスク起票方針・docs-only smoke 検証結果を、`.claude/skills/aiworkflow-requirements/references/`（`deployment-gha.md` / `deployment-cloudflare.md` / `topic-map.md`）・LOGS / SKILL.md 改訂履歴・関連タスク index・unassigned-task ledger に反映し、close-out に必須の 5 タスクと same-wave sync ルールを完了させる。

**docs-only タスクの close-out 据え置きルール【最重要】**:

- 本タスクは `apps/` / `packages/` 以下のコード変更を一切伴わない docs-only / specification-cleanup タスクである。
- そのため Phase 12 完了時点でも root `artifacts.json` の `metadata.workflow_state` は **`spec_created` のまま据え置く**。
- `implemented` への昇格は派生 implementation タスク（`UT-CICD-DRIFT-IMPL-*`）が完了した後にのみ起こり得る（本タスクの責務外）。
- `metadata.docsOnly = true` を維持し、UT-09 のような実コード混入時の `implemented` 再判定ルートには入らない。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する。Step 2 は本タスクが docs-only であるため「新規 IF 追加なし → Step 2 not required」と明示する。aiworkflow-requirements の index は `node scripts/generate-index.js` で `resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` を同一 wave で再生成する。
- Task 12-3: documentation-changelog を `scripts/generate-documentation-changelog.js` 相当のフォーマットで出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（`UT-CICD-DRIFT-IMPL-*` 派生タスクの起票方針を formalize）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
- Task 12-6: phase12-task-spec-compliance-check を実施する（docs-only close-out 据え置きルールの遵守チェックを含む）。
- Task 12-7: same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。`workflow_state` は `spec_created` のまま据え置く。
- Task 12-9: `validate-phase-output.js` と `verify-all-specs.js` を実行し、全 PASS を確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造規定 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync ルール |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-11/main.md | docs-only smoke 検証結果の引き継ぎ |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-10/go-no-go.md | GO 判定 / 残課題 |
| 必須 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/outputs/phase-02/canonical-spec-update-plan.md | 正本仕様の更新方針 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | 正本（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | 正本（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | キーワード索引（追加対象） |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | docs/05a-parallel-observability-and-cost-guardrails/outputs/phase-12/unassigned-task-detection.md | 起票元 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（タスク 1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話必須）**:

- 「学校の時間割表（CI/CD workflow yaml）と先生のメモ（正本仕様 deployment-gha.md）の内容がずれていたので、メモの方を直した話です」
- 例え話 1: 「教室の時間割表は最新（`.github/workflows/*.yml` 実体）、職員室のメモは古いまま（`deployment-gha.md` の旧記述）。ずれを表（drift マトリクス）に書き出して、メモを直しました」
- 例え話 2: 「直すだけで終わらない案件（実体側を直す必要がある差分）は、別の宿題カード（`UT-CICD-DRIFT-IMPL-*` 派生タスク）にして後輩に渡しました。本タスクではメモの修正だけで完結します」
- 例え話 3: 「『校舎裏（Pages）で発表するか、体育館（Workers）で発表するか』の方針判断は重いので、別会議（派生タスク）に持ち越します」

**Part 2（技術者レベル）**:

- 棚卸し対象 yaml: `backend-ci.yml` / `ci.yml` / `validate-build.yml` / `verify-indexes.yml` / `web-cd.yml`
- 抽出キー: Node version / pnpm version / triggers / jobs / deploy target
- drift カテゴリ: `docs-only`（仕様書側更新で完結）/ `impl-required`（yaml or wrangler.toml 変更を伴う）
- 派生タスク命名規則: `UT-CICD-DRIFT-IMPL-<scope>-<short-summary>.md`（例: `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION.md`）
- 検証コマンド一覧表: `rg` / `yamllint` / `actionlint` / `gh issue view 58` / `gh api repos/.../codeowners/errors`
- 不変条件 reaffirmation: #5（D1 アクセスは apps/api 限定）/ #6（GAS prototype を deploy 対象に含めない）

### ステップ 2: システム仕様更新（タスク 2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-CICD-DRIFT の Phase 1〜13 完了行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | requirements skill 側の同期参照ログ（deployment-gha.md / deployment-cloudflare.md 更新） |
| `.claude/skills/task-specification-creator/LOGS.md` | task-specification skill 側のフィードバック記録ログ |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（更新事項がある場合） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新（更新事項がある場合） |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` / `quick-reference.md` / `topic-map.md` / `keywords.json` | 「CI/CD workflow topology」「Pages vs Workers」キーワードへのリンク追加（`generate-index.js` で同期） |
| 関連 doc リンク | UT-GOV-001 / UT-GOV-003 / UT-26 / 05a observability への双方向リンク |

**Step 1-B: 実装状況テーブル更新（spec_created のまま据え置き）**

- `docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-001.md` から本タスク（`docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/`）への移動 / link を記録。
- 統合 README（該当があれば）の docs-only タスク一覧に UT-CICD-DRIFT を `spec_created` で追加。
- **重要**: 本タスクは docs-only であり `implemented` には昇格しない。`workflow_state` は `spec_created` のまま据え置く。

**Step 1-C: 関連タスクテーブル更新**

- UT-GOV-001（branch protection）/ UT-GOV-003（CODEOWNERS）/ UT-26（staging-deploy-smoke）の index.md の「並列 / 関連」テーブルに UT-CICD-DRIFT 完了情報を反映。
- 05a observability タスクの起票元情報を双方向リンク化。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本タスクは docs-only / specification-cleanup であり、新規 API / 新規 D1 schema / 新規 IPC を一切追加しない。
- そのため **Step 2 は not required**。`canonical-spec-update-plan.md` の更新案は `deployment-gha.md` / `deployment-cloudflare.md` の **既存記述の正確化** に閉じる。
- `system-spec-update-summary.md` には「Step 2 not required: docs-only / no new interface」と明示する。

### ステップ 3: ドキュメント更新履歴作成（タスク 3）

`outputs/phase-12/documentation-changelog.md` を以下フォーマットで生成する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/completed-tasks/ut-cicd-workflow-topology-drift-cleanup/ | UT-CICD-DRIFT 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 同期 | docs/30-workflows/LOGS.md | UT-CICD-DRIFT 完了行追加 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | deployment-gha.md / deployment-cloudflare.md 更新を記録 |
| 2026-04-29 | 同期 | .claude/skills/task-specification-creator/LOGS.md | docs-only close-out 据え置きルールの実例として記録 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-gha.md | current facts への正確化（docs-only 差分） |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Pages / Workers / OpenNext の current contract 記述整理 |
| 2026-04-29 | 更新 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md / quick-reference.md / topic-map.md / keywords.json | CI/CD workflow topology キーワード追加 |
| 2026-04-29 | 新規 | docs/30-workflows/unassigned-task/UT-CICD-DRIFT-IMPL-*.md | 派生 implementation タスクの起票（impl 必要差分の件数だけ） |

### ステップ 4: 未割当タスク検出レポート（タスク 4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する（impl 必要差分が 0 件でも「該当なし」セクションを必ず作成する）。本タスクの主要検出は派生 implementation タスクの起票である。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| Pages vs Workers の current contract 確定 | 設計判断 | OpenNext Workers 採用または Pages build budget 監視前提のいずれかを正本化 | `UT-CICD-DRIFT-IMPL-PAGES-VS-WORKERS-DECISION` |
| 05a observability-matrix 内の存在しない workflow 名修正 | 実作業 | 旧名 → 現実体への mapping 反映 | `UT-CICD-DRIFT-IMPL-05A-OBSERVABILITY-MAPPING` |
| `apps/web/wrangler.toml` の `pages_build_output_dir` / `main` entry 整理 | 実作業 | current contract に従って正規化 | 上記 PAGES-VS-WORKERS-DECISION の下流 |
| required_status_checks 登録 workflow 名整合 | 整合確認 | UT-GOV-001 と現実体の照合 | UT-GOV-001（並列） |
| CODEOWNERS `.github/workflows/**` owner 整合 | 整合確認 | UT-GOV-003 との照合 | UT-GOV-003（並列） |
| Cron Triggers と D1 contention の正本ドキュメント不足 | 設計 | `deployment-cloudflare.md` への共通セクション追加 | next wave / aiworkflow-requirements skill 改訂 |

> 0 件のときも本テーブルの構造は維持し、行を「該当なし」とすること。

### ステップ 5: スキルフィードバックレポート（タスク 5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | docs-only / specification-cleanup タスクで Phase 12 の `workflow_state` 据え置きルールが明示的に必要だった | `phase-12-spec.md` に「docs-only タスクの close-out では `workflow_state` を `spec_created` のまま据え置く」セクションを追加 |
| aiworkflow-requirements | `deployment-gha.md` / `deployment-cloudflare.md` の現状記述と `.github/workflows/*.yml` 実体間の drift 検出に正本側の `current facts` 注記がなく、判断材料が不足 | 各仕様書冒頭に `last verified at: <YYYY-MM-DD>` を必須メタデータ化 |
| github-issue-manager | Issue #58 (CLOSED) に対し CLOSED のまま仕様書を作成する運用が問題なくできた | 改善点なし |

### ステップ 6: Phase 12 compliance check（必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 ファイル（compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリーに含まれる | PASS |
| Step 2 の必要性判定が記録 | `not required: docs-only / no new interface` 明示 | PASS |
| same-wave sync が完了 | LOGS.md ×2 + SKILL.md ×2 + topic-map | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| docs-only close-out 据え置きルール遵守 | `workflow_state` が `spec_created` のまま | PASS |
| `apps/` / `packages/` 配下に変更が無い | `git status` で 0 件 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（更新事項あれば） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（更新事項あれば） |
| Index | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| Index | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state`。
- **`workflow_state` は `spec_created` のまま据え置く**（docs-only 据え置きルール）。
- 片方のみ更新は禁止（drift の主要原因）。

## docs-only close-out ルール【必須・最重要】

- 本タスクは docs-only / specification-cleanup であり `apps/` / `packages/` の変更を一切伴わない。
- そのため Phase 12 完了後も:
  - root `artifacts.json` の `metadata.workflow_state` は **`spec_created` のまま据え置く**
  - `metadata.docsOnly = true` を維持
  - `implemented` への昇格は派生 `UT-CICD-DRIFT-IMPL-*` タスク群が完了した後にのみ起こり得る（本タスクの責務外）
- close-out の判定軸は「same-wave sync 完了 + 派生タスク起票方針が unassigned-task-detection.md に記載済み + validate / verify が exit 0」である。
- `git status` で `apps/` / `packages/` 配下の変更が検出された場合は即時停止し、本タスクが docs-only であるという前提を再確認する（Phase 5 へ差し戻し）。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
# Phase 単位の出力スキーマ検証
node scripts/validate-phase-output.js \
  --task ut-cicd-workflow-topology-drift-cleanup

# 全タスク仕様書の整合性検証
node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json の drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | docs-only smoke 検証結果（rg / yamllint / actionlint / mapping）を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | UT-GOV-001 / UT-GOV-003 / UT-26 / 05a observability の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも読めるレベルになっているか。
- 実現性: Step 2 not required の判定が docs-only タスクの実態と整合しているか。
- 整合性: same-wave sync の 2 LOGS / 2 SKILL と topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の派生タスク ID（`UT-CICD-DRIFT-IMPL-*`）が命名規則に従い、衝突しないか。
- 認可境界: implementation-guide のサンプルコマンドに Token / Account ID 実値が含まれていないか。
- close-out 据え置き: `workflow_state` が `spec_created` のまま据え置かれているか / `apps/` 配下の変更が 0 件か。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | 棚卸しキー / 派生タスク命名規則 |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 not required |
| 4 | documentation-changelog | 12 | spec_created | スクリプト準拠フォーマット |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期（workflow_state 据え置き） | 12 | spec_created | 必須 |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |

## 成果物（必須 6 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 not required |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須（派生 IMPL タスク列挙） |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | docs-only close-out 据え置きを含む全項目 PASS |
| メタ | artifacts.json (root) | Phase 12 状態の更新（workflow_state 据え置き） |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 6 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2 not required（理由付き）が明記
- [ ] documentation-changelog に変更ファイルが網羅されている
- [ ] unassigned-task-detection が 0 件でも出力されている（派生 IMPL タスク起票方針を含む）
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [ ] **`workflow_state` が `spec_created` のまま据え置かれている（docs-only close-out ルール）**
- [ ] `apps/` / `packages/` 配下の変更が 0 件（`git status` で確認）

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- docs-only タスクの close-out 据え置きルール（`workflow_state` を `implemented` に昇格させない）が明記されている
- Step 2 not required の判定理由（docs-only / no new interface）が手順に含まれている
- artifacts.json の `phases[11].status` が `spec_created` / `metadata.workflow_state` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection に列挙した派生 `UT-CICD-DRIFT-IMPL-*` タスクの起票方針 → PR body の関連タスク欄
  - **docs-only close-out 据え置きルール（`workflow_state` 据え置き）を Phase 13 でも遵守する**
- ブロック条件:
  - 必須 6 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - `apps/` / `packages/` 配下に意図せぬ変更が混入している（→ docs-only 前提崩壊 / Phase 5 へ差し戻し）
  - `workflow_state` が誤って `implemented` に昇格している

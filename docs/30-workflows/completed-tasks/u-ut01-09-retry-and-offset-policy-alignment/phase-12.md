# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-30 |
| 前 Phase | 11 (手動テスト検証 / NON_VISUAL 縮約) |
| 次 Phase | 13 (PR 作成) |
| 状態 | spec_created |
| タスク分類 | docs-only / NON_VISUAL（設計確定タスク） |
| visualEvidence | NON_VISUAL |
| workflow_state | **spec_created**（close-out で書き換え禁止 / phases[].status のみ更新可） |
| user_approval_required | false |
| GitHub Issue | #263 (CLOSED) |

## 目的

U-UT01-09 の Phase 1〜11 成果物（canonical retry / backoff / `processed_offset` 採否 / migration 影響評価 / quota 算定 / NON_VISUAL evidence）を、workflow-local 文書および `.claude/skills/aiworkflow-requirements/indexes/` の sync / retry / offset 索引へ反映する。本タスクは **docs-only / NON_VISUAL / spec_created** であり、Issue #263 が CLOSED 状態でも canonical な設計判断記録として残置する。実コード修正 / migration 投入は UT-09 追補（または U-UT01-07）へ委譲するため、Phase 12 close-out で `metadata.workflow_state` を書き換えない（**`spec_created` のまま据え置く**）。

## 必須 7 ファイル（task-specification-creator skill 準拠）

| # | ファイル | 役割 | 0 件でも出力 |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル概念説明 + Part 2 技術者レベル詳細 | YES |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | Step 1-A / 1-B / 1-C + 条件付き Step 2（aiworkflow indexes 更新手順） | YES |
| 3 | `outputs/phase-12/documentation-changelog.md` | workflow-local / global skill sync を別ブロックで記録 | YES |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | Phase 11 で発見した Note / Info を formalize（**0 件でも出力必須**） | YES |
| 5 | `outputs/phase-12/skill-feedback-report.md` | task-specification-creator / aiworkflow-requirements / github-issue-manager への FB（**改善点なしでも出力必須**） | YES |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | root / outputs `artifacts.json` parity 含む全項目 PASS 検証 | YES |
| 7 | `outputs/phase-12/main.md` | Phase 12 index と必須 6 成果物への navi | YES |

## workflow_state 取り扱い【最重要 / 必須】

- 本タスクは **docs-only / NON_VISUAL / spec_created**。Issue #263 は CLOSED だが、canonical 設計判断記録として spec_created のまま残置する。
- Phase 12 close-out 時の更新ルール:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持**（`completed` / `implemented` / `closed` への書き換えは **禁止**）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly = true` を維持。
  - `metadata.github_issue_state = "CLOSED"` を維持（Issue 状態は再オープンしない）。
- 実コード反映（`DEFAULT_MAX_RETRIES` 修正 / `processed_offset` migration 追加 / `SYNC_MAX_RETRIES` 既定値変更）は **UT-09 追補** で行う。本 Phase で実装 PR 化は禁止。
- 参照: `.claude/skills/task-specification-creator/references/phase-12-pitfalls.md`「設計タスクの workflow root を completed にしてしまう」漏れパターン。

## 実行タスク

- [ ] Task 12-1: `outputs/phase-12/implementation-guide.md` を Part 1（中学生レベル / 日常の例え話 3 つ以上）+ Part 2（技術者レベル / canonical 値 / 過渡期方針 / UT-09 への申し送り詳細）の 2 パート構成で作成する。
- [ ] Task 12-2: `outputs/phase-12/system-spec-update-summary.md` を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する（Step 2 は aiworkflow-requirements 索引更新手順を内容として保有）。
- [ ] Task 12-3: `outputs/phase-12/documentation-changelog.md` に workflow-local 同期ブロックと global skill sync ブロックを別建てで記述する。
- [ ] Task 12-4: `outputs/phase-12/unassigned-task-detection.md` を 0 件でも出力する（Phase 11 Note / Info の formalize と UT-09 / U-UT01-07 / U-UT01-08 への申し送りを含む）。
- [ ] Task 12-5: `outputs/phase-12/skill-feedback-report.md` を改善点なしでも出力する（task-specification-creator / aiworkflow-requirements / github-issue-manager 観点）。
- [ ] Task 12-6: `outputs/phase-12/phase12-task-spec-compliance-check.md` で必須 7 ファイル / Part 1+2 構成 / Step 1-A/B/C / Step 2 必要性判定 / same-wave sync / 二重 ledger parity / workflow_state 維持 / Issue CLOSED 維持 / 機密情報非混入を全 PASS で検証する。
- [ ] Task 12-7: `outputs/phase-12/main.md` を必須 6 成果物への navi として作成する。
- [ ] Task 12-8: same-wave sync を実施する（aiworkflow indexes の sync / retry / offset 索引 + 起票元 unassigned 仕様の状態維持）。
- [ ] Task 12-9: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期し、`phases[11].status = completed`、`metadata.workflow_state = spec_created` 維持を確認する。
- [ ] Task 12-10: `apps/api/src/jobs/sync-sheets-to-d1.ts` / `apps/api/migrations/0002_sync_logs_locks.sql` 等の実コード / migration が本 PR 境界に混入していないことを最終チェックする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 7 ファイル仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | spec_created タスクの workflow_state 据え置きルール |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | implementation-guide 執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 起票元（canonical 入力） |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 決定本体 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/migration-impact-evaluation.md | migration 影響机上評価 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-05/ut09-handover-runbook.md | UT-09 申し送り内容 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-07/ac-matrix.md | AC1〜AC6 証跡 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-09/quota-worst-case-calculation.md | quota 算定 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-11/main.md | NON_VISUAL evidence サマリ |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | sync / retry / offset 索引（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | quick-reference（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory（更新対象） |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成対象 |
| 必須 | CLAUDE.md | scripts/cf.sh / 不変条件 #5（D1 直アクセス apps/api 限定）/ solo 運用ポリシー |
| 参考 | docs/30-workflows/ut-04-d1-schema-design/phase-12.md | 構造リファレンス |
| 参考 | docs/30-workflows/completed-tasks/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | 上流 retry 仕様 |

## 実行手順

### ステップ 1: 実装ガイド作成（Task 12-1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話 3 つ以上必須）**:

- 概要: 「Cloudflare Workers から Google スプレッドシートに会員情報を取りに行くプログラムが、もし途中で失敗したときに『何回までやり直すか』『どこから再開するか』のルールを揃える作業」と説明。
- 例え話 1（retry 最大回数）: 「テスト勉強でわからない問題に当たったとき『3 回考え直してダメなら先生に聞く』というルールを家族で決めるのと同じ。仕様は 3 回、いまの実装は 5 回でルールがズレているので、どちらかに揃えないと家族のあいだで『もう先生に聞いた』『まだ自分で考えるべき』とケンカになる」
- 例え話 2（Exponential Backoff）: 「呼んでも返事が無い友達に LINE するとき、1 秒・2 秒・4 秒・8 秒…と待ち時間を倍々にして送る。これを `Exponential Backoff` と呼ぶ。短すぎるとサーバーが迷惑（quota 超過）、長すぎると 1 回の処理時間に収まらなくなる」
- 例え話 3（`processed_offset`）: 「1000 行のドリルの 600 行目まで解いて電池切れになったとき、しおりを 600 行目に挟んでおけば次は 600 行目から再開できる。しおり（= `processed_offset`）が無いと毎回 1 ページ目からやり直しになり、ドリル屋さん（Sheets API）から『同じページばっかり何回も借りに来るな』と怒られる」
- 例え話 4（補助 / quota）: 「ドリル屋さんは『100 秒に 500 ページまで』しか貸せない。再試行を増やすと借りた回数も増えるので、retry 回数 × 待ち時間 × バッチサイズが quota を踏み抜かないように電卓で確認する必要がある」
- まとめ: 本タスクは **設計のルールを 1 つに決めるだけ**で、実際のプログラム書き換えは別の作業（UT-09）でやる、と明記する。

**Part 2（技術者レベル）**:

- canonical 決定値の一覧（retry 最大回数 / Exponential Backoff curve（base / 上限 / jitter 採否）/ `processed_offset` 採否（追加 / hybrid / 不採用）/ offset 単位（行 / chunk index / 安定 ID）/ `SYNC_MAX_RETRIES` 既定値方針）を Phase 2 決定文書から転記。
- 既存実装との差分: `apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5` / `withRetry({ baseMs: 50 })` / `apps/api/migrations/0002_sync_logs_locks.sql` の `processed_offset` 不在 — それぞれ canonical へ寄せる手順を UT-09 追補へ申し送る。
- migration 影響: Phase 2 `migration-impact-evaluation.md` の DEFAULT / NOT NULL / backfill / rollback 手順サマリを引用。
- Sheets API quota 整合: Phase 9 `quota-worst-case-calculation.md` の worst case 100s window 内 request 数（< 500）を引用し、cron 6h × batch_size 100 × canonical retry の組み合わせで成立することを示す。
- `SYNC_MAX_RETRIES` 過渡期方針: 環境変数の存続可否、wrangler.toml / `.dev.vars` での反映ポイントを明記（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守、`wrangler` 直呼び禁止 / `bash scripts/cf.sh` 経由）。
- failed log の 30 日保持と offset の意味整合: `processed_offset` がある場合の SRE オペレータ運用（手動再開の判定ロジック）を 1 段落で示す。
- 実装着手者向け申し送り: 「本仕様書は spec_created のまま残置」「実装は UT-09 追補で行う」「Issue #263 は CLOSED のため再オープン不要、UT-09 側で `Refs #263` する」。

### ステップ 2: システム仕様更新（Task 12-2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes**

| 同期対象 | 記述内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | sync / retry / offset 関連エントリに U-UT01-09 canonical 決定への導線を追記 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory に `u-ut01-09-retry-and-offset-policy-alignment` を追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | retry 最大回数 / backoff curve / `processed_offset` 採否の canonical 即参照ポイントを追記 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | `pnpm indexes:rebuild` で再生成（手書き禁止） |
| `docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md` | 状態を `spec_created` に維持。Issue #263 が CLOSED の旨を冒頭に注記 |
| skill / LOGS 本体 | 仕様本文・skill 挙動を変更しないため未更新。改善候補は `skill-feedback-report.md` に記録 |

**Step 1-B: 実装状況テーブル更新（spec_created 維持）**

- 起票元 unassigned 仕様の「状態」を `spec_created` のまま維持し、後継 workflow（本ディレクトリ）へのリンクを追記する。
- 上位統合 README / 関連タスク表で U-UT01-09 を `spec_created` として参照可能にする。
- **本タスクは spec のみ**のため `implemented` には更新しない。実反映は UT-09 追補で行う。

**Step 1-C: 関連タスクテーブル更新**

- UT-09（Sheets→D1 同期ジョブ）の `index.md` 「上流 / 申し送り」テーブルに、本タスクで確定した canonical 値を反映する申し送りエントリを追加する。
- U-UT01-07（`sync_log` 物理対応）/ U-UT01-08（status / trigger enum 統一）の関連タスク表で本タスクを直交関連として明記する。
- UT-01（Sheets→D1 同期方式定義）の `index.md` から後継として本タスクへ link する。

**Step 2（条件付き / 本タスクでは適用必須）: aiworkflow-requirements 側の sync / retry / offset 索引更新**

- 本タスクは TypeScript 型 / API / IPC 契約の新規追加は無いが、aiworkflow-requirements 側に sync / retry / offset 関連の正本索引が存在するため、Step 2 として以下を実施する。
- 手順:
  1. `topic-map.md` / `quick-reference.md` / `resource-map.md` を編集し、本 workflow と canonical 値への導線を追加する（手書き編集対象）。
  2. `mise exec -- pnpm indexes:rebuild` を実行し `keywords.json` を再生成する（手書き禁止）。
  3. `git diff --exit-code .claude/skills/aiworkflow-requirements/indexes` で drift 0 を確認する（CI `verify-indexes-up-to-date` gate と同等）。
- TypeScript 型 / API endpoint / IPC 契約の新規追加は無いため、`packages/shared/src/zod/*` への反映や API スキーマ追記は **N/A** と明記する。

### ステップ 3: ドキュメント更新履歴作成（Task 12-3）

`outputs/phase-12/documentation-changelog.md` を出力する。**workflow-local 同期と global skill sync を別ブロックで記録**する（`patterns-phase12-sync.md` の Feedback BEFORE-QUIT-003 対策）。

**ブロック A: workflow-local 同期**

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 新規 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/ | Phase 1〜13 仕様書 + index + artifacts.json + outputs/ |
| 2026-04-30 | 更新 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 状態 spec_created 維持 + 後継 workflow リンク追加 + Issue #263 CLOSED 注記 |

**ブロック B: global skill sync（aiworkflow-requirements）**

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | sync / retry / offset 索引に U-UT01-09 導線追加 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory 追加 |
| 2026-04-30 | 同期 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | canonical retry / backoff / `processed_offset` 即参照ポイント追記 |
| 2026-04-30 | 再生成 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | `pnpm indexes:rebuild` 実行 |

### ステップ 4: 未割当タスク検出レポート（Task 12-4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。Phase 11 で発見した Note / Info の formalize を含める。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| `DEFAULT_MAX_RETRIES = 5` の canonical 値への寄せ | 実作業 | UT-09 追補での `apps/api/src/jobs/sync-sheets-to-d1.ts` 修正 + 過渡期 SLA 再校正 | UT-09 追補 |
| `processed_offset` カラム migration 追加 | 実作業 | DDL + DEFAULT 0 + backfill + rollback 手順を実装 | U-UT01-07（ledger 整合）/ UT-09 |
| `SYNC_MAX_RETRIES` 環境変数の wrangler.toml / `.dev.vars` 既定値変更 | 実作業 | canonical 既定値に揃える + 1Password の op 参照確認 | UT-09 追補 |
| 実 Sheets API quota 観測 | 検証 | UT-09 phase-11 smoke で実トラフィック計測 | UT-09 phase-11 |
| failed → in_progress 再開時のオブザーバビリティ | 設計 | `retry_count` / `processed_offset` を SRE ダッシュボードに露出 | UT-08（monitoring） |
| Sheets 行削除耐性のシナリオ追加 | 検証 | offset 単位（行 / chunk index / 安定 ID）の耐性を hybrid 採用前提で実証 | UT-09 phase-11 |

> 0 件の場合も「該当なし」セクションを必ず作成する（phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」対策）。

### ステップ 5: スキルフィードバックレポート（Task 12-5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | docs-only / NON_VISUAL / spec_created の 3 重組み合わせ + Issue CLOSED 残置ケースが SKILL.md に明示されていない | 「設計判断記録として残置するタスク（Issue CLOSED）」のケースを `phase-template-phase12.md` / `phase-12-pitfalls.md` のケース集に追加する |
| aiworkflow-requirements | sync / retry / offset 関連索引の更新時に、canonical 値の即参照ポイント（具体的な数値）を quick-reference に書く慣行が確立していない | quick-reference 更新ガイドに「canonical 数値を即値で書く」テンプレを追加 |
| github-issue-manager | Issue が CLOSED 状態のまま spec を作成・残置するケースの取り扱い（`Refs` / `Closes` の使い分け）が現行 SKILL に未明示 | CLOSED Issue を canonical 設計判断記録として残置する場合は `Refs #N` を使い、`Closes` は禁止 — というルールを SKILL.md に追記 |

### ステップ 6: Phase 12 compliance check（Task 12-6 / 必須 / 7 ファイル目）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を全 PASS で検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイルの成果物が揃っている | implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check / main | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | Part 1 に日常の例え話 3 つ以上 | PASS |
| Step 1-A / 1-B / 1-C が記述 | spec-update-summary に明示 | PASS |
| Step 2 の必要性判定が記録 | 本タスクでは aiworkflow-requirements 索引更新のため Step 2 適用必須を明記 | PASS |
| same-wave sync が完了 | aiworkflow indexes（topic-map / resource-map / quick-reference / keywords.json）+ 起票元 unassigned status | PASS |
| 二重 ledger parity | root `artifacts.json` と `outputs/artifacts.json` の `phases[*].status` / `metadata.workflow_state` / `metadata.docsOnly` / `metadata.github_issue_state` が一致 | PASS |
| workflow_state 据え置き | `metadata.workflow_state = "spec_created"` のまま、`completed` / `implemented` への書き換え無し | PASS |
| Issue 状態維持 | `metadata.github_issue_state = "CLOSED"` のまま、再オープン無し | PASS |
| spec PR 境界遵守 | `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` への変更が混入していない | PASS |
| 機密情報非混入 | gas / wrangler 直呼び痕跡無し / 実 token / database_id / 実会員データ無し | PASS |

### ステップ 7: main.md（Task 12-7）

`outputs/phase-12/main.md` を必須 6 成果物への navi として作成する。各成果物への相対リンク + 1 行サマリ + Phase 12 完了判定の概要を記載する。

### ステップ 8: same-wave sync（Task 12-8）

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES（手書き編集） |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES（手書き編集） |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES（手書き編集） |
| keywords.json | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES（`pnpm indexes:rebuild` で自動生成） |
| 起票元 unassigned | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | YES（状態 spec_created 維持 + 後継 workflow リンク） |
| skill / LOGS 本体 | 仕様本文・skill 挙動を変更しないため N/A | N/A |

### ステップ 9: 二重 ledger 同期（Task 12-9）

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `metadata.taskType` / `metadata.workflow_state` / `metadata.docsOnly` / `metadata.github_issue` / `metadata.github_issue_state`。
- 片方のみ更新は禁止（drift の主要原因）。
- **本タスクの drift 防止チェック**:
  - `metadata.workflow_state = "spec_created"`（書き換え禁止）
  - `metadata.docsOnly = true`
  - `metadata.github_issue_state = "CLOSED"`（再オープン禁止）
  - `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` 非混入

### ステップ 10: spec PR 境界の最終チェック（Task 12-10）

```bash
# 実コード / migration が PR 境界に混入していないことを確認
git diff --name-only main..HEAD | grep -E "^apps/api/migrations/|^apps/api/src/jobs/sync-sheets-to-d1\.ts$" \
  && echo "BLOCKED: 実コード / migration 混入" || echo "OK: spec only"
```

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES |
| 起票元 unassigned | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | YES |
| skill / LOGS 本体 | 今回は仕様本文・skill 挙動を変更しないため N/A | N/A |

## 二重 ledger 同期【必須】

- root `artifacts.json` と `outputs/artifacts.json` の parity を必ず維持する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `metadata.taskType` / `metadata.workflow_state` / `metadata.docsOnly` / `metadata.github_issue` / `metadata.github_issue_state`。
- 本タスクは `metadata.workflow_state = "spec_created"` を **据え置き**、`metadata.github_issue_state = "CLOSED"` を **据え置き**。

## spec_created / docs-only / NON_VISUAL 取り扱いルール【必須】

- 本タスクは `taskType=docs-only` / `visualEvidence=NON_VISUAL` / `workflow_state=spec_created` の三重宣言。
- 本 PR で commit するのは `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` 配下の仕様書 + same-wave sync 起因の `.claude/skills/aiworkflow-requirements/indexes/*` + 起票元 unassigned 仕様の更新のみ。
- 実コード / migration / wrangler 設定は **本 PR に含めない**。実反映は UT-09 追補（別 PR）で行う。
- `phases[*].status` は `completed` に進めてよいが、`metadata.workflow_state` は **`spec_created` を維持**（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン回避）。
- Issue #263 は CLOSED のまま据え置き。再オープン禁止。実装 PR（UT-09 追補）では `Refs #263` を採用し `Closes` を使わない。

## validate-phase-output.js / verify-all-specs.js 実行確認

本 worktree には `scripts/validate-phase-output.js` / `scripts/verify-all-specs.js` が存在しない場合、Phase 12 では二重 ledger diff、成果物実在確認、参照 grep を代替 evidence とする（exit 0 / 全 PASS 期待）。存在する場合はそれぞれ実行し、exit 0 を確認する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリ（観点 A/B/C 判定）を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| UT-09 追補 | canonical 値（retry / backoff / `processed_offset` / `SYNC_MAX_RETRIES`）の申し送り → 実コード反映 |
| U-UT01-07 | `processed_offset` 物理対応 / ledger 整合への申し送り |
| U-UT01-08 | enum 統一との直交関係明示 |
| UT-01 | 後継 workflow リンクの双方向更新 |

## 多角的チェック観点

- 価値性: implementation-guide Part 1 が非エンジニアでも canonical 値の意図を理解できるレベルか。
- 実現性: Step 1-A の aiworkflow-requirements 索引反映が現行ファイル構造と整合しているか（架空セクション名を作っていないか）。
- 整合性: same-wave sync の aiworkflow indexes / 起票元 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先（UT-09 追補 / U-UT01-07 / U-UT01-08 / UT-08）が実在 ID か。
- 認可境界: 実装ガイドの実行例が `bash scripts/cf.sh` 経由で書かれており、`wrangler` 直呼びになっていないか（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守）。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 API token / 実会員データが含まれていないか。
- Issue 整合: Issue #263 が CLOSED のまま据え置かれ、PR 本文で `Refs #263`（`Closes` 禁止）が使われる前提が明記されているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上必須 |
| 2 | implementation-guide Part 2（技術者） | 12 | spec_created | canonical 値 / 過渡期 / UT-09 申し送り |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 適用 |
| 4 | documentation-changelog | 12 | spec_created | workflow-local / global を別ブロック |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | main.md | 12 | spec_created | 必須 6 成果物への navi |
| 9 | same-wave sync | 12 | spec_created | aiworkflow indexes + 起票元 unassigned |
| 10 | 二重 ledger 同期 | 12 | spec_created | workflow_state=spec_created 維持 |
| 11 | spec PR 境界最終チェック | 12 | spec_created | 実コード / migration 非混入 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生 / 例え話 3 つ以上） + Part 2（技術者 / canonical / UT-09 申し送り） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 適用（aiworkflow indexes 更新） |
| 履歴 | outputs/phase-12/documentation-changelog.md | workflow-local / global の 2 ブロック構造 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 / Phase 11 Note 含む |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| ナビ | outputs/phase-12/main.md | 6 成果物への navi |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS 期待 / parity 含む |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / `metadata.workflow_state = spec_created` 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 7 ファイル（main.md 含む）が `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（aiworkflow-requirements 索引更新の手順）が明記
- [ ] documentation-changelog で workflow-local 同期と global skill sync が別ブロックで記録
- [ ] unassigned-task-detection が 0 件でも出力されている
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（aiworkflow indexes + 起票元 unassigned status）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が parity 維持
- [ ] `metadata.workflow_state = "spec_created"` を維持し、`completed` / `implemented` へ書き換えていない
- [ ] `metadata.github_issue_state = "CLOSED"` を維持し、Issue #263 を再オープンしていない
- [ ] `apps/api/migrations/` / `apps/api/src/jobs/sync-sheets-to-d1.ts` への変更が PR 境界に混入していない

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `spec_created`、Phase 完了時に `completed` へ更新可能な設計
- 必須 7 成果物が `outputs/phase-12/` に配置される設計
- spec_created タスクの workflow_state 据え置きルール（phase-12-pitfalls.md 漏れパターン）が手順に含まれている
- artifacts.json の `phases[11].status` が `completed`、`metadata.workflow_state` が `spec_created` のまま
- `metadata.github_issue_state` が `CLOSED` のまま

## Phase 完了スクリプト呼出例

```bash
# 1. 必須 7 ファイル存在確認
ls -1 docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-12/{implementation-guide.md,system-spec-update-summary.md,documentation-changelog.md,unassigned-task-detection.md,skill-feedback-report.md,phase12-task-spec-compliance-check.md,main.md}

# 2. aiworkflow indexes drift 0 確認（手書き編集後 + pnpm indexes:rebuild 後）
mise exec -- pnpm indexes:rebuild
git diff --exit-code .claude/skills/aiworkflow-requirements/indexes

# 3. 二重 ledger parity 確認（jq で metadata.workflow_state を比較）
jq -r '.metadata.workflow_state' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/artifacts.json
jq -r '.metadata.workflow_state' docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/artifacts.json
# 期待: 両方 "spec_created"

# 4. spec PR 境界の最終確認
git diff --name-only main..HEAD | grep -E "^apps/api/migrations/|^apps/api/src/jobs/sync-sheets-to-d1\.ts$" \
  && echo "BLOCKED" || echo "OK: spec only"

# 5. Issue 状態確認（再オープンしていないこと）
gh issue view 263 --json state -q .state  # 期待: CLOSED
```

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 user 承認ゲートの前提条件
  - unassigned-task-detection → UT-09 追補 / U-UT01-07 / U-UT01-08 / UT-08 への双方向リンク反映
  - workflow_state=spec_created / docsOnly=true / github_issue_state=CLOSED 維持を Phase 13 PR body に明記
  - Issue #263 が CLOSED のため Phase 13 では `Refs #263` を採用し `Closes` を使わない方針を伝達
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了（aiworkflow indexes + 起票元 unassigned status）
  - 二重 ledger に drift がある
  - workflow_state を誤って `completed` / `implemented` / `closed` に書き換えてしまった
  - Issue #263 を誤って再オープンした
  - 実コード / migration が PR 境界に混入

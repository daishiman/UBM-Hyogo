# Phase 12: ドキュメント更新

> **本仕様書は 300 行を超過する可能性があるが、implementation / spec_created タスクで 7 必須成果物の構成が意味的に分割不可能なため例外条項を適用する**
> （`.claude/skills/task-specification-creator/references/phase-template-phase12.md` §「phase-12.md の 300 行上限と設計タスクの例外条項」準拠）。
> 加えて、Phase 11 NON_VISUAL 代替証跡（main / manual-evidence / link-checklist）と Phase 12 outputs を直列記述する必要があるため、分散すると mirror parity 監査時の追跡コストが増大する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Schema alias apply hardening / 大規模 back-fill 再開可能化 (UT-07B) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-01 |
| 前 Phase | 11（NON_VISUAL evidence / 大規模実測） |
| 次 Phase | 13（PR 作成 / **user_approval_required = true**） |
| 状態 | implemented-local（Phase 13 user approval / PR は未実行） |
| タスク分類 | implementation（migration / repository / workflow / route / test を更新） |
| visualEvidence | NON_VISUAL |
| taskType | implementation |
| workflow_state | implemented-local（local code / docs / tests は反映済み。Phase 13 PR merge までは repository integration completed へ昇格しない） |
| user_approval_required | true（Phase 13 の commit / push / PR 作成に必要） |
| GitHub Issue | #293（CLOSED のまま据え置き / 再 OPEN しない） |

## 目的

UT-07B（schema alias apply hardening）の Phase 1〜11 成果物を、workflow-local 文書と aiworkflow-requirements skill indexes / `api-endpoints.md` / `database-schema.md` / `task-workflow-active.md` の参照導線へ反映する。本タスクは GitHub Issue #293 が **CLOSED のまま** のため、Issue ライフサイクルを再 OPEN せず、PR / 仕様書リンクを `gh issue comment` で残す形で履歴のみ完結させる。

Phase 12 の必須 7 成果物を完了し、Phase 13（PR 作成・user 承認ゲート）の前提を整える。

## 必須 7 成果物（task-specification-creator skill 準拠 / 1 つ欠落で FAIL）

| # | ファイル | 由来 Task | 欠落時の扱い |
| --- | --- | --- | --- |
| 1 | `outputs/phase-12/main.md` | Phase 12 本体（7 成果物ナビ） | FAIL |
| 2 | `outputs/phase-12/implementation-guide.md` | Task 1（Part 1 中学生 + Part 2 技術者） | FAIL |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | Task 2（Step 1-A/B/C + Step 2 判定） | FAIL |
| 4 | `outputs/phase-12/documentation-changelog.md` | Task 3（更新ファイル一覧） | FAIL |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | Task 4（**0 件でも出力必須**） | FAIL |
| 6 | `outputs/phase-12/skill-feedback-report.md` | Task 5（**改善点なしでも出力必須**） | FAIL |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | Task 6（最終確認 root evidence） | FAIL |

> Task 6 の `PASS` 断言は、7 ファイル実体 + same-wave sync 証跡 + ledger parity が揃った後にのみ許可する。

## workflow_state 取り扱い【最重要】

- 本タスクの taskType は **implementation**、taskState は **implemented-local**。Phase 12 完了後も以下を厳守する。
  - root `artifacts.json` の `metadata.workflow_state` は **`implemented-local`**（local 実装・docs・tests は反映済み、Phase 13 PR が user 承認 + merge されるまで repository integration completed へ昇格しない）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **false**（migration / repository / workflow / route / test の実コード更新を伴う）。
  - `metadata.github_issue_state` は **CLOSED** のまま（本タスクで再 OPEN しない）。
- implementation task は Phase 13 の user 承認 + commit + push + PR merge を経て初めて repository integration completed 相当へ昇格する。Phase 12 段階では `implemented-local` と `pending_user_approval` を分離して記録する。

### CLOSED Issue の扱い（implementation タスクで再 OPEN しない理由）

- 本 Issue #293 は親タスク 07b 完了時に close 済。今回は「07b 完了後に検出された hardening を伴う追加実装」を **新規タスク仕様書として独立** で立てる方針で、Issue 再 OPEN は避ける（履歴の責務分離）。
- 必須記録:
  - `index.md` Decision Log に「Issue #293 を reopen せず、UT-07B として独立した追加実装タスクとして履歴を残す」根拠を 1 段落明記済。
  - Issue 側へは PR / 仕様書リンクを `gh issue comment` で残す（双方向リンク維持）。
  - `task-workflow-active.md` の active task 一覧に UT-07B を spec_created で登録する。
- 禁止事項: Issue を無言放置 / reopen / `Closes #293` の使用。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + Step 2 判定で構造化記述する。
- Task 12-3: documentation-changelog を出力する（workflow-local / global skill sync 別ブロック）。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（SF-03 4 パターン照合の有無を明記）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
- Task 12-6: phase12-task-spec-compliance-check を実施する（必須 7 ファイル × 各判定）。
- Task 12-7: same-wave sync（aiworkflow indexes + 原典 unassigned status）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` ↔ `outputs/artifacts.json`）を同期する。
- Task 12-9: workflow_state が `implemented-local`、`docsOnly=false` / Issue #293 CLOSED 維持を最終チェックする。
- Task 12-10: Phase 11 の 10,000 行実測数値を implementation-guide Part 2 に転記する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 7 成果物仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義（5 必須タスク + Task 6） |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆要領 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/B/C / Step 2 / same-wave sync |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-step2-domain-sync.md | Step 2 判定基準（N/A / BLOCKED / 実施） |
| 必須 | .claude/skills/task-specification-creator/references/phase-template-phase12.md | implementation / spec_created 例外条項 |
| 必須 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 起票仕様 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/index.md | 本 workflow 目次 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-02/ | DB 制約 / 再開可能 back-fill / retryable contract / 実測計画 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-05/ | migration runbook / rollback runbook / API contract 更新 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-10/go-no-go.md | GO 判定 |
| 必須 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-11/main.md | NON_VISUAL evidence + 10k 実測結果 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | API contract 正本（Step 1-A 同期先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本（Step 1-A 同期先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | active task 一覧（Step 1-A 同期先） |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | キーワード索引 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | spec sync root |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成対象 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | CLAUDE.md | 不変条件 #5（D1 直アクセスは apps/api 限定）/ ブランチ戦略 / solo 運用 |
| 参考 | docs/30-workflows/u-ut01-08-sync-enum-canonicalization/phase-12.md | docs-only 版 phase-12 構造リファレンス |
| 参考 | docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/outputs/phase-12/ | 親タスク Phase 12 完了状態 |

## 実行手順

### Task 1: 実装ガイド作成（`outputs/phase-12/implementation-guide.md`）

1 ファイル内で **Part 1 + Part 2** を 2 部構成で記述する。

**Part 1（中学生レベル / 例え話 3 つ以上 / 専門用語回避）必須要件**:

- 「alias / stableKey とは何か」を「クラスの席替えで、新しい席番号（stableKey）を生徒（questionId）に割り当てる作業」と例える。
- 「同一 revision での collision 防御」を「同じクラス（revision）の中で同じ席番号（stableKey）を 2 人に渡しちゃダメ。出席簿（DB）に『1 つの席番号は 1 人だけ』というルール（UNIQUE 制約）を書いておくと、人間が間違えても出席簿が止めてくれる」と例える。
- 「back-fill が CPU budget で途中失敗する」を「給食配膳の時間（CPU budget）が決まっていて、全員に配り切れなかったら『次のチャイム（retry）でここから続きをやる』と渡す。最初からやり直すと、もう食べた人にもう一度配ってしまう」と例える。
- 「2 段階 migration」を「先にクラス全員の席番号の重複を直してから、出席簿に新ルール（UNIQUE 制約）を書く。逆順だと新ルールが既存の重複を弾いてしまい、誰も席に座れなくなる」と例える。
- 専門用語セルフチェック: 「stableKey」「partial UNIQUE index」「CPU budget」「retryable response」「idempotent」「back-fill」を使う場合は括弧書きで日常語を補う（例: 「idempotent（何度やっても同じ結果になる性質）」）。

**Part 2（技術者レベル）必須要件**:

- partial UNIQUE index DDL 案:

  ```sql
  CREATE UNIQUE INDEX idx_schema_questions_revision_stable_key
    ON schema_questions(revision_id, stable_key)
    WHERE stable_key IS NOT NULL
      AND stable_key NOT LIKE '\_\_extra\_\_:%' ESCAPE '\';
  ```

- 既存データ衝突検出 SQL（migration 直前に実行）:

  ```sql
  SELECT revision_id, stable_key, COUNT(*) c
  FROM schema_questions
  WHERE stable_key IS NOT NULL
    AND stable_key NOT LIKE '\_\_extra\_\_:%' ESCAPE '\'
  GROUP BY revision_id, stable_key HAVING c > 1;
  ```

- 再開可能 back-fill state（`processed_offset` / `total_rows` / `cursor` 等）の workflow state 設計案を記述。
- retryable HTTP contract:

  ```http
  HTTP/1.1 202 Accepted
  Content-Type: application/json

  {
    "error": "backfill_cpu_budget_exhausted",
    "retryable": true,
    "processedOffset": <int>,
    "totalRows": <int>,
    "nextRetryAfterMs": <int>
  }
  ```

- idempotent 条件: 同一 `(revisionId, stableKey, questionId)` への back-fill UPDATE は WHERE 句で「未処理行のみ」に限定すること。`__extra__:<questionId>` から `<stableKey>` への書き換えは 1 行 1 回のみ発生させる SQL pattern を記述。
- 10,000 行実測数値（Phase 11 evidence からの転記）: batch 数 / 1 batch あたり処理行数 / CPU 時間 ms / retry 回数 / 完了到達時間。
- エラー処理: CPU budget 超過以外の例外（D1 transaction failure / network failure）に対する分岐パターンを明示。
- 設定可能パラメータ: batch size / CPU budget 閾値 / retry 上限 / 50,000 行で恒常超過する場合の queue / cron 分離判断基準。
- 不変条件 #5 への適合: migration / repository / workflow / route がすべて `apps/api/**` 配下にあり、`apps/web` から D1 を直接参照しない。

### Task 2: システム仕様更新（`outputs/phase-12/system-spec-update-summary.md`）

#### Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes（必須）

| 同期対象（aiworkflow-requirements） | 記述内容 |
| --- | --- |
| `references/api-endpoints.md` | `POST /admin/schema/aliases` の retryable continuation（`backfill_cpu_budget_exhausted` / HTTP 202 / body schema）を contract として追記。`GET /admin/schema/diff` は変更なし |
| `references/database-schema.md` | `schema_aliases` セクションに UNIQUE index の追加と除外条件（`unknown` / `__extra__:*` / NULL）を追記。`response_fields` には `questionId` / `is_deleted` カラムを追加しない方針を明記 |
| `references/task-workflow-active.md` | UT-07B を completed task として登録（implemented-local）。Phase 13 PR merge 後に completed-tasks へ移行する旨を明記 |
| `indexes/topic-map.md` | UT-07B workflow 導線追加（`schema_alias` / `partial_unique` / `backfill_cpu_budget` / `retryable_response` キーワード）|
| `indexes/resource-map.md` | workflow inventory 追加 |
| `indexes/quick-reference.md` | UT-07B spec sync root 追加 |
| `indexes/keywords.json` | 索引再生成（`pnpm indexes:rebuild` 実行） |
| `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` | ヘッダ「状態」を `unassigned` → `spec_created` に更新 |
| `docs/30-workflows/LOGS.md` | 完了行追記（spec_created close-out 行） |

#### Step 1-B: 実装状況テーブル更新（**spec_created**）

- `docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md` の状態欄を `spec_created` に更新。
- `docs/30-workflows/completed-tasks/07b-parallel-schema-diff-alias-assignment-workflow/index.md` の関連タスク欄で UT-07B を `spec_created` に反映。
- 本タスクは Phase 13 PR merge 前のため `implemented` には更新しない。

#### Step 1-C: 関連タスクテーブル更新（task-workflow-active.md）

- `task-workflow-active.md` に UT-07B を以下属性で追加:
  - id: UT-07B-schema-alias-hardening-001
  - parent: 07b-parallel-schema-diff-alias-assignment-workflow
  - status: implemented-local
  - taskType: implementation
  - wave: 1
  - github_issue: 293 (CLOSED)
- 関連タスク（UT-04 / UT-09）への影響を双方向リンクで反映。

#### Step 2 判定: **実施**

判定根拠（必須 3 項目記述 / phase-12-pitfalls.md「Step 2 必要性判定の記録漏れ」回避）:

- 本タスクは API contract（`POST /admin/schema/aliases` の retryable failure）と D1 schema（partial UNIQUE index）の **正本契約を更新** するため、Step 2（domain sync）が必要。
- aiworkflow-requirements の `api-endpoints.md` / `database-schema.md` の正本を本タスクで spec として書き換える。実 DDL / 実 route 実装は本タスクのコード変更と整合させる。
- shared package には影響を与えない（本タスクは `apps/api` 完結）。

> **Step 2 = 実施判定**。仕様 → 実装ドリフト解消方針: 本タスクは spec と実装を同 PR で進める implementation タスクのため、Step 2 同期と code 更新が同期する設計。

#### 仕様 → 実装ドリフト解消方針（追加記述）

| ドリフト軸 | 現状 | 解消方針 | 担当 |
| --- | --- | --- | --- |
| collision 防御 | repository pre-check のみ | partial UNIQUE index 追加（DB constraint） | 本タスク（migration）|
| back-fill 状態管理 | 単一 transaction | `processed_offset` 等の再開可能 state | 本タスク（workflow）|
| CPU budget 超過レスポンス | 不明確 | `backfill_cpu_budget_exhausted` retryable | 本タスク（route）|
| 大規模実測 | 未実施 | 10,000 行 staging 実測 | 本タスク Phase 11 |
| 50,000 行で恒常超過する場合の対処 | 未決 | 実測結果次第で queue / cron 分離 follow-up 起票 | 別タスク（detection に記録）|

### Task 3: documentation-changelog（`outputs/phase-12/documentation-changelog.md`）

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-05-01 | 新規 | docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/ | 13 Phase + index + artifacts.json + outputs/ |
| 2026-05-01 | 更新 | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | 状態を consumed / implemented-local workflow created に変更 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | retryable failure contract 追記 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/references/database-schema.md | partial UNIQUE index 追加追記 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | UT-07B 登録 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | UT-07B 導線追加 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory 追加 |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | UT-07B spec sync root |
| 2026-05-01 | 同期 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成 |
| 2026-05-01 | 追記 | docs/30-workflows/LOGS.md | UT-07B spec_created close-out 行 |

> workflow-local 同期と global skill sync を **別ブロック** で記録する（[Feedback BEFORE-QUIT-003] 対策）。実コード変更（migration / repository / workflow / route / test の追加）は Phase 13 PR の changed files で別途列挙し、本 changelog は **仕様書/索引** の変更のみを対象とする。

### Task 4: unassigned-task-detection（`outputs/phase-12/unassigned-task-detection.md`） / **0 件でも出力必須**

SF-03 設計タスク特有 4 パターンを必ず照合する:

| パターン | 検出結果 | 委譲先 |
| --- | --- | --- |
| 型定義→実装 | 0 件（本タスクは spec と code を同 PR で完結） | N/A |
| 契約→テスト | 0 件（unit / route / workflow test を本タスク Phase 9 で同梱） | N/A |
| UI 仕様→コンポーネント | UI 表示文言更新は対象外 | admin UI 改修 / 別タスク |
| 仕様書間差異→設計決定 | 親タスク 07b と本タスクの differential（DB constraint 追加 / retryable contract 追加）を Phase 5 runbook で吸収 | 本タスクで吸収済 |

**追加検出（既存タスク / 新規 follow-up 候補）**:

| 検出項目 | 種別 | 委譲先 | 配置先 |
| --- | --- | --- | --- |
| 50,000 行で CPU budget 恒常超過時の queue / cron 分離 | 実装（条件付） | follow-up（実測結果次第）| 新規起票候補（Phase 11 結果次第で記録のみ）|
| 管理 UI のエラー表示文言更新（retryable response 受領時の UX） | UI | admin UI 別タスク | 起票見送り（記録のみ） |
| 監視アラート閾値（retry 多発 / CPU 超過頻度） | 監視 | UT-08 監視タスク | 起票見送り（記録のみ） |
| 本番 D1 への migration 適用手順 | 運用 | Phase 13 PR merge 後の運用 runbook | Phase 5 migration-runbook 内で完結 |

> 0 件パターンも「設計タスク 4 パターン照合済 / 検出 4 項目」を summary に明記する（phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」対策）。

### Task 5: skill-feedback-report（`outputs/phase-12/skill-feedback-report.md`） / **改善点なしでも出力必須**

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | implementation / NON_VISUAL / spec_created / CLOSED Issue / 大規模実測の 5 軸組合せが phase-template に分散しており、10,000 行実測手順を NON_VISUAL に位置付ける指針が暗黙 | implementation × NON_VISUAL × 大規模実測の組合せパターンを references に追加 |
| aiworkflow-requirements | `api-endpoints.md` への retryable continuation 追記時の HTTP status / body / retry metadata 三点固定テンプレが暗黙 | retryable contract テンプレ（status / body schema / retry metadata）を references に追加 |
| github-issue-manager | CLOSED Issue を再 OPEN せず、追加実装タスクとして独立 spec 化するパターンの comment テンプレが未提供 | `gh issue comment` テンプレ（PR / 仕様書リンク + reopen 不要理由）追加 |
| Cloudflare CLI ラッパー（scripts/cf.sh） | 大規模 fixture 投入（10,000 行 SQL）の D1 execute 実用性に関する事例不足 | 大規模 fixture 投入の手順例を docs/00-getting-started-manual に追加検討 |

> 改善点なしの場合も「観察事項のみ / なし」を明記する。

### Task 6: phase12-task-spec-compliance-check（`outputs/phase-12/phase12-task-spec-compliance-check.md`）

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイル成果物が揃っている | main / implementation-guide / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | Part 1 例え話 3 つ以上 + 専門用語セルフチェック済 | PASS |
| Step 1-A / 1-B / 1-C 記述 | spec-update-summary に明示 | PASS |
| Step 2 判定（実施 / 根拠 3 項目） | 実施根拠 3 項目明記 + ドリフト解消方針記述 | PASS |
| same-wave sync 完了 | aiworkflow indexes 4 ファイル + references 3 ファイル + 原典 unassigned status + LOGS.md | PASS |
| 二重 ledger parity | root artifacts.json / outputs/artifacts.json drift 0 | PASS |
| workflow_state 維持 | `implemented-local` / `docsOnly=false` / `github_issue_state=CLOSED` | PASS |
| 不変条件 #5 遵守 | migration / repository / workflow / route が `apps/api/` 配下に閉じ、`apps/web` から D1 直アクセスなし | PASS |
| 機密情報非混入 | 実 token / database_id / 実会員 PII 0 件 | PASS |
| Issue #293 再 OPEN 禁止 | `gh issue reopen` を実行しない / Decision Log 1 段落明記 | PASS |
| Phase 11 NON_VISUAL 連動 | main / manual-evidence / link-checklist 揃い、screenshots/ 不在 / 10k 実測数値が implementation-guide Part 2 に転記済 | PASS |
| Phase 13 連動 | PR title / body 草案で `Refs #293` 採用 / `Closes #293` 不使用 / user_approval_required = true | PASS |

### same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| api-endpoints | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | YES |
| database-schema | .claude/skills/aiworkflow-requirements/references/database-schema.md | YES |
| task-workflow-active | .claude/skills/aiworkflow-requirements/references/task-workflow-active.md | YES |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES（`pnpm indexes:rebuild` で再生成） |
| 原典 unassigned | docs/30-workflows/completed-tasks/UT-07B-schema-alias-hardening-001.md | YES |
| LOGS | docs/30-workflows/LOGS.md | YES（完了行追記）|

### 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）が存在すれば必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly` / `task.metadata.github_issue_state`。
- 片方のみ更新は禁止（drift の主要原因）。
- **本タスクの drift 防止チェック**: `task.metadata.workflow_state = "implemented-local"` / `task.metadata.docsOnly = false` / `task.metadata.github_issue_state = "CLOSED"` の 3 項目が両 ledger と PR 境界で一致していること。
- `outputs/artifacts.json` が存在しない場合は root ledger が唯一正本である旨を compliance check に明記する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence + 10,000 行実測数値を `implementation-guide.md` Part 2 に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 / compliance-check の PASS を承認ゲートに引き渡す |
| 関連タスク | UT-04 / UT-09 / 親 07b の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも「partial UNIQUE index で何を防いでいるのか」「retryable response がなぜ必要か」を理解できるか。
- 実現性: Step 1-A の `api-endpoints.md` / `database-schema.md` 反映が現行ファイル構造と整合しているか（架空セクション名を作っていないか）。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先が **既存タスク or 記録のみ** で、不要な新規起票が発生していないか。queue / cron 分離は実測結果次第とし、Phase 11 結果が出るまで起票を保留する。
- 認可境界: 実装ガイドの SQL 例 / curl 例が DB 直アクセスを `apps/api` に閉じる（不変条件 #5）前提か / `wrangler` 直呼びを推奨していないか（`scripts/cf.sh` 経由）。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 API token / 実会員データが含まれていないか。
- Issue ライフサイクル: GitHub Issue #293 が CLOSED のまま、本 Phase で `gh issue reopen` を実行しないこと。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide Part 1（中学生） | 12 | spec_created | 例え話 4 つ以上必須 |
| 2 | implementation-guide Part 2（技術者） | 12 | spec_created | DDL / SQL / HTTP contract / 10k 実測転記 |
| 3 | system-spec-update-summary（Step 1-A/B/C） | 12 | spec_created | aiworkflow references 3 + indexes 4 + LOGS |
| 4 | system-spec-update-summary（Step 2 = 実施 / 根拠 3 項目） | 12 | spec_created | ドリフト解消方針記述 |
| 5 | documentation-changelog | 12 | spec_created | workflow-local / global を別ブロック |
| 6 | unassigned-task-detection（SF-03 4 パターン + 追加 4 項目） | 12 | spec_created | 0 件でも出力 / queue 分離は記録のみ |
| 7 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 8 | phase12-task-spec-compliance-check | 12 | spec_created | 12 項目 PASS |
| 9 | same-wave sync（aiworkflow references + indexes + 原典 + LOGS） | 12 | spec_created | 必須 |
| 10 | 二重 ledger 同期 | 12 | spec_created | workflow_state=implemented-local / CLOSED 維持 |
| 11 | Issue #293 comment（PR / 仕様書リンク） | 12 | spec_created | `gh issue reopen` 禁止 / `gh issue comment` のみ |
| 12 | Phase 11 10k 実測数値転記 | 12 | spec_created | implementation-guide Part 2 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者・DDL・HTTP contract・10k 実測） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/B/C + Step 2 = 実施 / 根拠 3 項目 + ドリフト解消方針 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 変更ファイル一覧（workflow-local / global 別ブロック） |
| 検出 | outputs/phase-12/unassigned-task-detection.md | SF-03 4 パターン + 追加 4 項目（0 件でも出力） |
| FB | outputs/phase-12/skill-feedback-report.md | 観察事項（改善点なしでも出力） |
| 集約 | outputs/phase-12/main.md | Phase 12 index と 7 成果物ナビ |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 12 項目 PASS 期待 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / `workflow_state=implemented-local` 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期（存在する場合） |

## 完了条件

- [ ] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成、Part 1 に例え話 4 つ以上、専門用語セルフチェック済
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（実施 / 根拠 3 項目）が明記
- [ ] documentation-changelog で workflow-local 同期と global skill sync が別ブロック
- [ ] unassigned-task-detection で SF-03 4 パターン照合済 / 追加 4 項目記述（必要な場合のみ follow-up 起票候補として保留）
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の 12 項目すべてが PASS
- [ ] same-wave sync（aiworkflow references 3 + indexes 4 + 原典 unassigned status + LOGS.md）完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が parity（drift 0）
- [ ] `metadata.workflow_state = "implemented-local"` / `metadata.docsOnly = false` / `metadata.github_issue_state = "CLOSED"` を維持
- [ ] 不変条件 #5 遵守（migration / repository / workflow / route が apps/api/ 配下に閉じる）
- [ ] GitHub Issue #293 を再 OPEN していない（`gh issue comment` のみで PR / 仕様書リンクを残す）
- [ ] index.md Decision Log に「Issue #293 を reopen せず UT-07B として独立タスク化する」根拠 1 段落明記
- [ ] Phase 11 の 10,000 行実測数値が implementation-guide Part 2 に転記済

## タスク 100% 実行確認【必須】

- 全実行タスク（12 件）の状態が `spec_created` で、Phase 完了時に `completed` へ更新可能な設計
- 必須 7 成果物が `outputs/phase-12/` に配置される設計
- implementation / spec_created タスクの workflow_state 据え置きルール / CLOSED Issue 据え置きルールが手順に含まれている
- artifacts.json の `phases[11].status` が `completed-local / staging-deferred`、`metadata.workflow_state` が `implemented-local`

## 次 Phase への引き渡し

- 次 Phase: 13（PR 作成 / **user_approval_required = true**）
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection（追加 4 項目 / 必要なら queue 分離 follow-up） → 関連タスクへの双方向リンク反映済み
  - workflow_state=implemented-local / docsOnly=false / Issue #293 CLOSED / `Refs #293` 採用方針 を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了
  - 二重 ledger に drift がある
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった
  - GitHub Issue #293 を再 OPEN してしまった
  - PR body に `Closes #293` を採用してしまった（→ Phase 13 で `Refs #293` のみ採用）
  - 不変条件 #5 違反（migration / route / workflow が apps/api 外に出ている）

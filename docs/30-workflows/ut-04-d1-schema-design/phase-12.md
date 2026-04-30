# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | D1 データスキーマ設計 (UT-04) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-29 |
| 前 Phase | 11 (NON_VISUAL evidence / docs-only smoke) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク分類 | implementation（spec_created / 実装着手前） |
| visualEvidence | NON_VISUAL |
| workflow_state | spec_created（実装着手まで本値を維持し、completed への書き換えは禁止） |
| user_approval_required | false |

## 目的

UT-04（Cloudflare D1 初期スキーマ設計）の Phase 1〜11 成果物を、workflow-local 文書と .claude/skills/aiworkflow-requirements/indexes/ に反映する。本タスクは GitHub Issue #53 の「タスク仕様書作成」段階に閉じており、metadata.workflow_state は spec_created を維持する。Phase 12 の必須 5 タスクを完了し、Phase 13（PR 作成）の承認ゲート前提を整える。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（Part 1: 中学生レベル / Part 2: 技術者レベル）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する（必須 7 ファイル目）。

## workflow_state 取り扱い【重要】

- 本タスクの taskType は **implementation** だが、本 PR は仕様書（spec）作成のみで、`apps/api/migrations/` の実 DDL はまだ commit しない。
- そのため Phase 12 完了後も:
  - `artifacts.json`（root）の `metadata.workflow_state` は **`spec_created` を維持** する（`completed` に書き換えない）。
  - `phases[*].status` は当該 Phase の docs 完了に応じて `completed` に更新してよい。
  - `metadata.docsOnly` は **true**（この spec PR は仕様書のみで、実コード変更を含めない）。`taskType=implementation` は後続の DDL / migration 実装へ接続する最終タスク種別を示す。
- docs-only / spec_created タスクは workflow root を据え置き、`phases[].status` のみ更新するルール（spec-update-workflow.md / phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン）に厳格に従う。
- 実装 Phase（後続の別タスク or 本タスクの Phase 13 後の実装着手）で migration が merge された段階で初めて `workflow_state = implementation_ready` → `implemented` へ昇格する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する。
- Task 12-3: documentation-changelog を `scripts/generate-documentation-changelog.js` 相当のフォーマットで出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（Phase 10 MINOR 指摘の formalize 含む）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
- Task 12-6: phase12-task-spec-compliance-check を実施する。
- Task 12-7: same-wave sync（aiworkflow indexes + 原典 unassigned status）を完了する。
- Task 12-8: 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。
- Task 12-9: 本 worktree に存在する検証手段で ledger / 参照整合を確認する。`validate-phase-output.js` と `verify-all-specs.js` は存在しないため N/A。
- Task 12-10: workflow_state が `spec_created` のまま、`docsOnly=true` / spec PR 境界（実 DDL 非混入）であることを最終チェックする。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 構造定義 |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れパターン / 苦戦防止 Tips |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | 実装ガイド執筆ガイド |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync |
| 必須 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 原典 / scope / 完了条件 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-02/ | DDL 設計成果物（テーブル定義） |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-03/ | Sheets→D1 マッピング表 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-05/ | migration runbook（dev / production） |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-10/go-no-go.md | GO 判定 / MINOR 指摘 |
| 必須 | docs/30-workflows/ut-04-d1-schema-design/outputs/phase-11/main.md | NON_VISUAL evidence / docs-only smoke |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | D1 schema 正本（Step 1-A の主同期先） |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Wrangler / D1 操作正本 |
| 必須 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | キーワード索引 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 必須 | CLAUDE.md | scripts/cf.sh ルール / 不変条件 #5（D1 直アクセスは apps/api 限定） |
| 参考 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-12.md | 構造リファレンス |
| 参考 | docs/00-getting-started-manual/specs/08-free-database.md | 無料枠制約 |

## 実行手順

### ステップ 1: 実装ガイド作成（タスク 1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話必須・3 つ以上）**:

- 「Cloudflare D1 という、クラウドの『大きなノート』に、UBM 兵庫支部会の会員情報を整理して書く設計図を作る作業です」
- 例え話 1: 「クラスの名簿（Google Sheets）と、先生がしまっている公式名簿（D1）。先生のノートは表（テーブル）ごとに『生徒一覧』『部活動一覧』と章立てされていて、各列（カラム）に『名前』『学年』『部活』とラベルがついている。今回はその章立てとラベルを決める仕事」
- 例え話 2: 「同じ名前の人が 2 人いても区別できるように、各行に出席番号（PRIMARY KEY）を必ず振る。出席番号はノート全体で 1 つだけしか使えない（UNIQUE）」
- 例え話 3: 「名簿の書き換えに失敗したら、最初の状態に戻せるように『書き直し手順書』（migration ファイル）を 1 枚ずつ番号付きで保管する。たとえば `0001_init.sql` は『最初に名簿を作った日の手順』」
- 例え話 4: 「『部活動一覧』の部活 ID を『生徒一覧』が指している（FOREIGN KEY）。部活が消えると生徒の所属先がいなくなるので、消すときは慎重に。ただし D1 ではこの『指している』ルールを最初に有効化（`PRAGMA foreign_keys = ON`）しないと働かない」

**Part 2（技術者レベル）**:

- DDL: `members` / `bands` / `events` 等の CREATE TABLE 定義（NOT NULL / UNIQUE / FOREIGN KEY / CHECK）
- インデックス戦略: 検索キー（email / responseId）への INDEX、複合 INDEX の優先順位
- マッピング契約: `responseEmail`（system field）/ `publicConsent` / `rulesConsent` のキー固定（CLAUDE.md 不変条件 #2/#3 準拠）
- migration 規約: `0001_init.sql` 以降の連番、`PRAGMA foreign_keys = ON` の先頭明記
- D1 SQLite 型制約: DATETIME は TEXT (ISO 8601) として統一、INTEGER PK の rowid 同居
- 適用手順: `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`（CLAUDE.md「Cloudflare 系 CLI 実行ルール」遵守、`wrangler` 直呼び禁止）
- ロールバック方針: down migration を持たない代わりに backup export + 新規 migration で復元する手順

### ステップ 2: システム仕様更新（タスク 2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: spec_created タスク記録 + 関連 doc リンク + indexes**

| 同期対象 | 記述内容 |
| --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | UT-04 workflow 導線追加 |
| `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | workflow inventory 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | UT-04 spec sync root 追加 |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` | 索引再生成 |
| `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` | 状態を `spec_created` に更新し後継 workflow を明記 |
| skill / LOGS 本体 | 正本仕様本文・skill 挙動を変更しないため未更新。改善候補は `skill-feedback-report.md` に記録 |

**Step 1-B: 実装状況テーブル更新（spec_created）**

- `docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md` のヘッダ「状態」を `unassigned` → `spec_created` に更新（または `docs/30-workflows/ut-04-d1-schema-design/index.md` への移動リンクを追加）。
- 統合 README（`docs/01-infrastructure-setup/03-serial-data-source-and-storage-contract/index.md` 等）の関連タスクテーブルで UT-04 を `spec_created` に更新。
- **本タスクは spec のみ**のため `implemented` には更新しない。実 migration が merge された段階で別 PR / 別タスクが `implemented` へ昇格させる。

**Step 1-C: 関連タスクテーブル更新**

- UT-02（WAL mode）/ UT-09（Sheets→D1 sync）/ UT-06（本番デプロイ）/ UT-21 の index.md の「上流 / 関連」テーブルに UT-04 spec 完了情報を反映。
- `docs/00-getting-started-manual/specs/08-free-database.md` の参照タスク欄に UT-04 を追記。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本タスクは D1 schema のみで、TypeScript インターフェース・API endpoint・IPC 契約の新規追加はない。
- ただし `references/database-schema.md` に DDL を追記するため、Step 2 相当の「DDL 正本同期」は Step 1-A に統合して実施する。
- TypeScript の型生成（`packages/shared/src/zod/*` 等）は別タスク（実装フェーズ）で行うため、本 Phase 12 ではスコープ外。**Step 2 は本仕様書段階では N/A** と明記する。

### ステップ 3: ドキュメント更新履歴作成（タスク 3）

`outputs/phase-12/documentation-changelog.md` を出力する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-29 | 新規 | docs/30-workflows/ut-04-d1-schema-design/ | UT-04 仕様書 13 Phase + index + artifacts.json |
| 2026-04-29 | 更新 | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | 状態を spec_created に変更し後継 workflow を明記 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | UT-04 workflow 導線 |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | workflow inventory |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | UT-04 spec sync root |
| 2026-04-29 | 同期 | .claude/skills/aiworkflow-requirements/indexes/keywords.json | 索引再生成 |

workflow-local 同期と global skill sync を別ブロックで記録する（[Feedback BEFORE-QUIT-003] 対策）。

### ステップ 4: 未割当タスク検出レポート（タスク 4 / 0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を出力する。Phase 10 MINOR 指摘 formalize を含める。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| TypeScript 型生成（zod schema 連動） | 実作業 | DDL から型を派生する自動化検討 | UT-shared-zod-codegen（新規 unassigned 候補） |
| seed data 投入手順の整備 | 実作業 | dev 環境 fixture / production 初期データ | UT-04-followup-seed |
| sync_job_logs / sync_locks との結合確認 | 設計 | UT-09 の追加テーブルとの整合性レビュー | UT-09（既存） |
| backup / export 自動化 | 運用 | `scripts/cf.sh d1 export` の cron 化 | UT-26 staging-deploy-smoke or 新規 |
| FOREIGN KEY 有効化検証 | 検証 | `PRAGMA foreign_keys = ON` の実行時保証 | UT-04 実装フェーズ |
| マイグレーション番号衝突防止 | 運用 | dev/main 並行開発時の連番調整 | UT-04 実装フェーズ |

0 件の場合も「該当なし」セクションを必ず作成する（phase-12-pitfalls.md「未タスク検出レポートで 0 件判定のまま未修正」対策）。

### ステップ 5: スキルフィードバックレポート（タスク 5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL / docs-only / spec_created の組み合わせ判定が phase-12-pitfalls.md で読み取れた | spec_created と implementation taskType の併存ケース（spec PR 段階）を SKILL.md にケース集として明文化 |
| aiworkflow-requirements | `database-schema.md` への DDL 反映手順がスキル内ガイドで簡素な記述しかない | DDL 反映時の「テーブル別セクション分割」「制約一覧表」のテンプレを references に追加 |
| github-issue-manager | Issue #53 とのリンクは `Closes #53` で問題なし | 改善点なし |

### ステップ 6: Phase 12 compliance check（必須 / 7 ファイル目）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 7 ファイルの成果物が揃っている | 実装ガイド / spec-update-summary / changelog / unassigned-detection / skill-feedback / compliance-check | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | Part 1 に例え話 3 つ以上 | PASS |
| Step 1-A / 1-B / 1-C が記述 | spec-update-summary に明示 | PASS |
| Step 2 の必要性判定が記録 | N/A 理由を明記 | PASS |
| same-wave sync が完了 | aiworkflow indexes + 原典 unassigned status | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| validate-phase-output.js | 本 worktree に存在しないため N/A | PASS |
| verify-all-specs.js | 本 worktree に存在しないため N/A | PASS |
| workflow_state 維持 | `spec_created` のまま据え置き、`docsOnly=true` / spec PR 境界維持 | PASS |
| 機密情報非混入 | DDL サンプルに実 token / 実データ無し | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| resource-map | .claude/skills/aiworkflow-requirements/indexes/resource-map.md | YES |
| quick-reference | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | YES |
| topic-map | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |
| keywords | .claude/skills/aiworkflow-requirements/indexes/keywords.json | YES |
| 原典 unassigned | docs/30-workflows/unassigned-task/UT-04-d1-schema-design.md | YES |
| skill / LOGS 本体 | 今回は仕様本文・skill 挙動を変更しないため N/A | N/A |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType` / `task.metadata.workflow_state` / `task.metadata.docsOnly`。
- 片方のみ更新は禁止（drift の主要原因）。
- **本タスクの drift 防止チェック**: `task.metadata.workflow_state = "spec_created"` / `task.metadata.docsOnly = true` / `apps/api/migrations/` 非混入が両 ledger と PR 境界で一致していること。

## implementation / spec_created 取り扱いルール【必須】

- 本タスクは `taskType=implementation` だが、本 PR で commit するのは `docs/30-workflows/ut-04-d1-schema-design/` 配下の仕様書のみ。
- `apps/api/migrations/*.sql` を本 PR に含めないこと。実 DDL は実装フェーズの別 PR で投入する。
- そのため `phases[*].status` は `completed` に進めてよいが、`metadata.workflow_state` は **`spec_created` を維持**する（phase-12-pitfalls.md「設計タスクの workflow root を completed にしてしまう」漏れパターン回避）。

## validate-phase-output.js / verify-all-specs.js 実行確認

本 worktree には `scripts/validate-phase-output.js` / `scripts/verify-all-specs.js` が存在しないため、Phase 12 では二重 ledger diff、成果物実在確認、参照 grep を代替 evidence とする。

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | NON_VISUAL evidence サマリーを `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | UT-02 / UT-06 / UT-09 / UT-21 の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも DDL の意図を理解できるレベルになっているか。
- 実現性: Step 1-A の `database-schema.md` 反映が現行ファイル構造と整合しているか（架空セクション名を作っていないか）。
- 整合性: same-wave sync の aiworkflow indexes / 原典 unassigned status が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID / 実在 wave か。
- 認可境界: 実装ガイドの migration 適用例が `scripts/cf.sh` 経由で書かれており、`wrangler` 直呼びになっていないか（CLAUDE.md / [UBM-012]）。
- Secret hygiene: ガイド内のサンプルに実 database_id / 実 API token / 実会員データが含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | spec_created | 例え話 3 つ以上必須 |
| 2 | 実装ガイド Part 2（技術者） | 12 | spec_created | DDL / migration / `cf.sh` |
| 3 | system-spec-update-summary | 12 | spec_created | Step 1-A/B/C + Step 2 N/A 明記 |
| 4 | documentation-changelog | 12 | spec_created | workflow-local / global を別ブロック |
| 5 | unassigned-task-detection | 12 | spec_created | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | spec_created | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | spec_created | 全 PASS |
| 8 | same-wave sync (aiworkflow indexes + 原典 unassigned status) | 12 | spec_created | 必須 |
| 9 | 二重 ledger 同期 | 12 | spec_created | workflow_state=spec_created 維持 |
| 10 | validate / verify スクリプト | 12 | spec_created | exit 0 |

## 成果物（必須 7 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + Step 2 N/A 判定 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| ドキュメント | outputs/phase-12/main.md | Phase 12 index と7成果物ナビ |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 全 PASS 期待 |
| メタ | artifacts.json (root) | Phase 12 状態の更新 / workflow_state は spec_created 維持 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 7 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（N/A 判定含む）が明記
- [ ] documentation-changelog で workflow-local 同期と global skill sync が別ブロック
- [ ] unassigned-task-detection が 0 件でも出力されている
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（aiworkflow indexes + 原典 unassigned status）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` は N/A、代替 evidence を確認
- [ ] `metadata.workflow_state = "spec_created"` / `metadata.docsOnly = true` を維持し、spec PR 境界として `apps/api/migrations/` 非混入を確認

## タスク100%実行確認【必須】

- 全実行タスク（10 件）の状態が `spec_created` で、Phase 完了時に `completed` へ更新可能な設計
- 必須 6 成果物が `outputs/phase-12/` に配置される設計
- spec_created タスクの workflow_state 据え置きルール（phase-12-pitfalls.md 漏れパターン）が手順に含まれている
- artifacts.json の `phases[11].status` が `completed`、`metadata.workflow_state` が `spec_created` のまま

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection → 関連タスクへの双方向リンク反映済み
  - workflow_state=spec_created / docsOnly=true / spec PR 境界（実 DDL 非混入）を Phase 13 PR body に明記
- ブロック条件:
  - 必須 7 ファイルのいずれかが欠落
  - same-wave sync 未完了（aiworkflow indexes + 原典 unassigned status）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - workflow_state を誤って `completed` / `implemented` に書き換えてしまった

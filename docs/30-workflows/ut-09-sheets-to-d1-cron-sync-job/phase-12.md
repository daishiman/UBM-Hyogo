# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | Sheets→D1 同期ジョブ実装 (UT-09) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-04-27 |
| 前 Phase | 11 (手動 smoke test) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| タスク分類 | application_implementation（close-out / docs sync） |
| user_approval_required | false |

## 目的

Phase 1〜11 で得られた設計・実装・smoke 知見を、`apps/api` の運用ドキュメント・正本仕様（`.claude/skills/aiworkflow-requirements/references/`）・LOGS / topic-map・GitHub Issue #11 に反映し、close-out に必須の 5 タスクと same-wave sync ルールを完了させる。実コード変更が入ったため `spec_created / docs_only` ではなく `implemented / docs_only=false` として clean close を担保し、`validate-phase-output.js` / `verify-all-specs.js` および二重 ledger 同期を必ず通す。

## 必須 5 タスク（task-specification-creator skill 準拠）

1. **実装ガイド作成（2 パート構成）** — `outputs/phase-12/implementation-guide.md`
2. **システム仕様更新（Step 1-A / 1-B / 1-C + 条件付き Step 2）** — `outputs/phase-12/system-spec-update-summary.md`
3. **ドキュメント更新履歴作成** — `outputs/phase-12/documentation-changelog.md`
4. **未割当タスク検出レポート（0 件でも出力必須）** — `outputs/phase-12/unassigned-task-detection.md`
5. **スキルフィードバックレポート（改善点なしでも出力必須）** — `outputs/phase-12/skill-feedback-report.md`

加えて **Phase 12 自身の compliance check** を `outputs/phase-12/phase12-task-spec-compliance-check.md` に出力する。

## 実行タスク

- Task 12-1: 実装ガイド（Part 1 中学生 / Part 2 技術者）を 1 ファイルに統合作成する。
- Task 12-2: system-spec-update-summary を Step 1-A / 1-B / 1-C + 条件付き Step 2 で構造化記述する。
- Task 12-3: documentation-changelog をスクリプト（`scripts/generate-documentation-changelog.js`）相当のフォーマットで出力する。
- Task 12-4: unassigned-task-detection を 0 件でも必ず出力する（Phase 10 MINOR 指摘の formalize 含む）。
- Task 12-5: skill-feedback-report を改善点なしでも必ず出力する。
6. phase12-task-spec-compliance-check を実施する。
7. same-wave sync（LOGS.md ×2 / SKILL.md ×2 / topic-map）を完了する。
8. 二重 ledger（root `artifacts.json` と `outputs/artifacts.json`）を同期する。
9. `validate-phase-output.js` と `verify-all-specs.js` を実行し、全 PASS を確認する。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/SKILL.md | Phase 12 必須 5 タスク仕様 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A/1-B/1-C / Step 2 / same-wave sync ルール |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-11/main.md | smoke 結果の引き継ぎ |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/outputs/phase-10/go-no-go.md | GO 判定 / 残課題 |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | 旧 UT-09 を direct implementation にしない current 方針 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | Forms schema sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | Forms response sync 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | `/admin/sync/schema` / `/admin/sync/responses` 正本 |
| 必須 | docs/30-workflows/02-application-implementation/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | Cron / sync_jobs runbook 正本 |
| 必須 | docs/30-workflows/LOGS.md | task-level LOGS 同期対象 |
| 参考 | docs/30-workflows/completed-tasks/ut-02-d1-wal-mode/phase-12.md | 構造リファレンス |

## 実行手順

### ステップ 1: 実装ガイド作成（タスク 1）

`outputs/phase-12/implementation-guide.md` に以下 2 パートを記述する。

**Part 1（中学生レベル / 日常の例え話必須）**:

- 「Google スプレッドシートに書かれた会員リストを、6 時間ごとに自動でデータベースに写す仕組みです」
- 例え話: 「学級委員のノート（Google Sheets）と先生のノート（D1）を、毎朝 6 時間ごとに係の人（Cron Trigger）が見比べて、新しい行を写してくれます。同じ人が 2 回書かれていたら 1 行にまとめます（冪等）」
- 例え話 2: 「写し忘れたら『先生、写したよ』『あれ？失敗した』とノート（`sync_job_logs`）に毎回書き残します」
- 例え話 3: 「同時に 2 人が同じノートを写そうとすると喧嘩になるので、『今写してます』の札（`sync_locks`）を立ててから始めます」

**Part 2（技術者レベル）**:

- TypeScript インターフェース: `SyncJobLog` / `SheetsRowMapping` / `SyncResult` / `AdminSyncResponse` の型シグネチャ
- API シグネチャ: `POST /admin/sync` のリクエスト / レスポンスフォーマット、`scheduled(controller, env, ctx)` のシグネチャ
- エラーハンドリング: `SQLITE_BUSY` retry policy（default max 5 / base 50ms + jitter / max 5000ms）、Sheets 401/403/429/5xx は UT-10 へ委譲、lock timeout（10 分）
- 設定可能パラメータ一覧表: `SYNC_BATCH_SIZE`（既定 100）/ `SYNC_MAX_RETRIES`（既定 5）/ `SYNC_RANGE` / `DEFAULT_LOCK_TTL_MS`（既定 600000）/ `CRON_STAGING` / `CRON_PROD`

### ステップ 2: システム仕様更新（タスク 2）

`outputs/phase-12/system-spec-update-summary.md` を以下 4 ステップで構造化する。

**Step 1-A: 完了タスク記録 + 関連 doc リンク + 変更履歴 + LOGS.md ×2 + topic-map**

| 同期対象 | 記述内容 |
| --- | --- |
| `docs/30-workflows/LOGS.md` | UT-09 の Phase 1〜13 完了行追記 |
| `.claude/skills/aiworkflow-requirements/LOGS.md` | requirements skill 側の同期参照ログ |
| `.claude/skills/task-specification-creator/LOGS.md` | task-specification skill 側のフィードバック記録ログ |
| `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴テーブル更新（更新事項がある場合） |
| `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴テーブル更新（更新事項がある場合） |
| `.claude/skills/aiworkflow-requirements/references/topic-map.md` | 「Sheets→D1 同期」キーワードへのリンク追加 |
| 関連 doc リンク | UT-01 / UT-02 / UT-03 / UT-04 / UT-21 / UT-26 への双方向リンク |

**Step 1-B: 実装状況テーブル更新（implemented）**

- 統合 README（`docs/30-workflows/02-application-implementation/README.md` 等）の実装状況テーブルで UT-09 を `implemented` ステータスに更新。
- `docs/30-workflows/unassigned-task/UT-09-sheets-d1-sync-job-implementation.md` から本タスクへの移動（または link）を記録。

**Step 1-C: 関連タスクテーブル更新**

- UT-01 / UT-02 / UT-03 / UT-04 / UT-21 / UT-26 の index.md の「下流 / 関連」テーブルに UT-09 完了情報を反映。

**Step 2（条件付き）: 新規インターフェース追加時のみ**

- 本ワークツリーには `SyncResult` / 単一 `POST /admin/sync` / `sync_locks` / `sync_job_logs` の実装があるが、現行正本は Forms API 分割方針を採用している。
- そのため stale な Sheets 契約を `.claude/skills/aiworkflow-requirements/references/` へ正本登録しない。
- **Step 2 は BLOCKED**。`task-ut09-direction-reconciliation-001.md` で Forms 方針へ撤回するか、Sheets 方針を正式採用して正本仕様を再設計する。

### ステップ 3: ドキュメント更新履歴作成（タスク 3）

`scripts/generate-documentation-changelog.js`（または相当の手動フォーマット）で `outputs/phase-12/documentation-changelog.md` を生成する。

| 日付 | 変更種別 | 対象ファイル | 変更概要 |
| --- | --- | --- | --- |
| 2026-04-27 | 新規 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/ | UT-09 仕様書 13 Phase + index + artifacts.json |
| 2026-04-27 | 同期 | docs/30-workflows/LOGS.md | UT-09 完了行追加 |
| 2026-04-27 | 同期 | docs/30-workflows/02-application-implementation/LOGS.md | close-out 記録 |
| 2026-04-27 | 同期 | .claude/skills/aiworkflow-requirements/LOGS.md | stale Sheets 契約を正本登録しない判断を記録 |
| 2026-04-27 | 新規 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | legacy umbrella と旧UT-09実装の衝突を formalize |

### ステップ 4: 未割当タスク検出レポート（タスク 4 / 0 件でも出力必須）

Phase 10 MINOR 指摘の formalize を含めて `outputs/phase-12/unassigned-task-detection.md` を出力する（0 件の場合も「該当なし」のセクションは必ず作成する）。

| 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- |
| staging load/contention test | 実作業 | 同時アクセス再現 / WAL 非前提検証 | UT-26 staging-deploy-smoke |
| sync_job_logs retention 方針 | 設計 | 90 日 / 365 日の選定 | UT-08 monitoring |
| 通知連携（Slack / Email） | 実作業 | sync 失敗時の通知 | UT-07 notification |
| エラー標準化との整合 | 設計 | retry/backoff 命名 | UT-10 error-handling |
| hybrid push（webhook）案 | 設計 | Phase 3 案 D の将来導入 | next wave |
| Cron 実スケジュール再計測 | 検証 | dev 1h / main 6h 適正性 | Phase 11 staging 観測 |

### ステップ 5: スキルフィードバックレポート（タスク 5 / 改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を出力する。

| スキル | フィードバック | 改善提案 |
| --- | --- | --- |
| task-specification-creator | NON_VISUAL 判定が Phase 11 で明確に分岐できた | NON_VISUAL の場合の `outputs/phase-11/screenshots/` 自動除外チェックをテンプレ化 |
| aiworkflow-requirements | Cron Triggers と D1 contention の交差領域に正本ドキュメントが薄い | `deployment-cloudflare.md` に Cron + D1 retry policy 共通セクション追加 |
| github-issue-manager | Issue #11 (CLOSED) との双方向同期に支障なし | 改善点なし |

### ステップ 6: Phase 12 compliance check（必須）

`outputs/phase-12/phase12-task-spec-compliance-check.md` で以下を検証する。

| チェック項目 | 基準 | 期待 |
| --- | --- | --- |
| 必須 5 タスクの成果物が揃っている | 6 ファイル（compliance check 含む） | PASS |
| 実装ガイドが Part 1 / Part 2 構成 | 中学生 / 技術者の 2 パート | PASS |
| Step 1-A / 1-B / 1-C が記述 | 仕様書同期サマリーに含まれる | PASS |
| Step 2 の必要性判定が記録 | 新規 IF 追加時のみ実施、混入チェック済み | PASS |
| same-wave sync が完了 | LOGS.md ×2 + SKILL.md ×2 + topic-map | PASS |
| 二重 ledger が同期 | root artifacts.json / outputs/artifacts.json | PASS |
| validate-phase-output.js | 全 Phase PASS | PASS |
| verify-all-specs.js | 全 spec PASS | PASS |
| implemented ステータス再判定 | git status で apps/ 配下の変更を確認し、docs_only=false に補正 | PASS |

## same-wave sync ルール【必須】

| 同期対象 | パス | 必須 |
| --- | --- | --- |
| LOGS #1 | .claude/skills/aiworkflow-requirements/LOGS.md | YES |
| LOGS #2 | .claude/skills/task-specification-creator/LOGS.md | YES |
| SKILL #1 | .claude/skills/aiworkflow-requirements/SKILL.md | YES（更新事項あれば） |
| SKILL #2 | .claude/skills/task-specification-creator/SKILL.md | YES（更新事項あれば） |
| Index | .claude/skills/aiworkflow-requirements/indexes/topic-map.md | YES |

## 二重 ledger 同期【必須】

- root `artifacts.json`（タスク直下）と `outputs/artifacts.json`（生成物 ledger）を必ず同時更新する。
- 同期項目: `phases[*].status` / `phases[*].outputs` / `task.metadata.taskType`。
- 片方のみ更新は禁止（drift の主要原因）。

## implemented close-out ルール【必須】

- 本タスクは当初 `metadata.taskType = "spec_created"` / `docs_only = true` だったが、`apps/api` 実装・migration・test が追加済みのため `implemented` / `docs_only=false` に再判定する。
- same-wave sync を必ず通し、LOGS / SKILL.md change history / topic-map / 関連タスクテーブル更新を完了させて初めて close-out とする。
- `apps/` / `packages/` の変更は意図した実装範囲かを `git status` で確認し、Step 2 の正本仕様同期を完了させる。

## validate-phase-output.js / verify-all-specs.js 実行確認

```bash
# Phase 単位の出力スキーマ検証
node scripts/validate-phase-output.js \
  --task ut-09-sheets-to-d1-cron-sync-job

# 全タスク仕様書の整合性検証
node scripts/verify-all-specs.js
```

- 期待: 両方とも exit code 0 / 全 PASS。
- FAIL 時: 該当 Phase の `outputs/` 不足ファイルまたは artifacts.json の drift を是正してから再実行。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | smoke 結果と既知制限を `system-spec-update-summary.md` に転記 |
| Phase 13 | documentation-changelog を PR 変更ファイル一覧の根拠として使用 |
| 関連タスク | UT-01 / UT-02 / UT-03 / UT-04 / UT-21 / UT-26 の index.md を双方向更新 |

## 多角的チェック観点

- 価値性: 実装ガイド Part 1 が非エンジニアでも読めるレベルになっているか。
- 実現性: Step 2 が実際の references 構造と整合しているか（架空のファイル名を作っていないか）。
- 整合性: same-wave sync の 2 LOGS / 2 SKILL と topic-map が最新コミットで一致しているか。
- 運用性: unassigned-task-detection の委譲先タスクが実在 ID / 実在 wave か。
- 認可境界: implementation-guide の API シグネチャが Phase 5 と一致しているか。
- Secret hygiene: ガイド内のサンプルコードに実 token / 実 SA JSON が含まれていないか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 実装ガイド Part 1（中学生） | 12 | completed | 例え話 3 つ以上 |
| 2 | 実装ガイド Part 2（技術者） | 12 | completed | IF / API / 設定パラメータ |
| 3 | system-spec-update-summary | 12 | completed | Step 1-A/B/C + Step 2 |
| 4 | documentation-changelog | 12 | completed | スクリプト準拠フォーマット |
| 5 | unassigned-task-detection | 12 | completed | 0 件でも出力 |
| 6 | skill-feedback-report | 12 | completed | 改善点なしでも出力 |
| 7 | phase12-compliance-check | 12 | completed | 全 PASS |
| 8 | same-wave sync (LOGS×2 / SKILL×2) | 12 | completed | 必須 |
| 9 | 二重 ledger 同期 | 12 | completed | root + outputs |
| 10 | validate / verify スクリプト | 12 | completed | exit 0 |

## 成果物（必須 6 ファイル）

| 種別 | パス | 説明 |
| --- | --- | --- |
| ガイド | outputs/phase-12/implementation-guide.md | Part 1（中学生） + Part 2（技術者） |
| サマリー | outputs/phase-12/system-spec-update-summary.md | Step 1-A/1-B/1-C + 条件付き Step 2 |
| 履歴 | outputs/phase-12/documentation-changelog.md | 全変更ファイル一覧 |
| 検出 | outputs/phase-12/unassigned-task-detection.md | 0 件でも必須 |
| FB | outputs/phase-12/skill-feedback-report.md | 改善点なしでも必須 |
| 検証 | outputs/phase-12/phase12-task-spec-compliance-check.md | 方針衝突により FAIL / PR blocker |
| メタ | artifacts.json (root) | Phase 12 状態の更新 |
| メタ | outputs/artifacts.json | 生成物 ledger 同期 |

## 完了条件

- [ ] 必須 6 ファイルが `outputs/phase-12/` 配下に揃っている
- [ ] implementation-guide が Part 1 / Part 2 構成で、Part 1 に日常の例え話が 3 つ以上含まれる
- [ ] system-spec-update-summary に Step 1-A / 1-B / 1-C / Step 2（必要性判定含む）が明記
- [ ] documentation-changelog に変更ファイルが網羅されている
- [ ] unassigned-task-detection が 0 件でも出力されている
- [ ] skill-feedback-report が改善点なしでも出力されている
- [ ] phase12-task-spec-compliance-check の全項目が PASS
- [ ] same-wave sync（LOGS ×2 / SKILL ×2 + topic-map）が完了
- [ ] 二重 ledger（root + outputs の artifacts.json）が同期
- [ ] `validate-phase-output.js` / `verify-all-specs.js` が exit code 0
- [x] 実コード混入を検出し `implemented` / `docs_only=false` へ再判定済み

## タスク100%実行確認【必須】

- 全実行タスク（10 件）が `completed`
- 必須 6 成果物が `outputs/phase-12/` に配置される設計になっている
- implemented タスクの close-out ルール（N/A にせず same-wave sync で閉じる）が遵守されている
- Step 2 再判定（実コード混入時）が手順に含まれている
- artifacts.json の `phases[11].status` が `completed`

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成)
- 引き継ぎ事項:
  - documentation-changelog の変更ファイル一覧 → PR description 草案の根拠
  - phase12-compliance-check の PASS 判定 → Phase 13 承認ゲートの前提条件
  - unassigned-task-detection → 関連タスクへの双方向リンク反映済み
- ブロック条件:
  - 必須 6 ファイルのいずれかが欠落
  - same-wave sync が未完了（LOGS ×2 / SKILL ×2 + topic-map）
  - 二重 ledger に drift がある
  - validate / verify スクリプトが FAIL
  - 実コード変更に対する Step 2 正本仕様同期が未実施

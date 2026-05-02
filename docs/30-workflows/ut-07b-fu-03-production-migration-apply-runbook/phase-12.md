# Phase 12: ドキュメント更新 / 正本仕様同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 12 |
| 状態 | spec_created |
| taskType | implementation / operations / runbook + scripts |
| 実装区分 | 実装仕様書 |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. Phase 1〜11 全成果物 + `artifacts.json` を確認する。
2. Task 12-1〜12-6 の必須 7 ファイル（`main.md` + 6 補助）を整備する。
3. 仕様書 root と `outputs/` の `artifacts.json` parity を確認する。
4. workflow_state を `spec_created` のまま据え置く（F1〜F9 は本サイクルでローカル実装済みだが、production 実 apply は別タスクで行うため）。
5. F1〜F9 実装ファイルの所在を aiworkflow-requirements skill reference へ追記候補としてマークする。
6. GitHub Issue #363（CLOSED）の再オープン or 新規 Issue 起票判断を Phase 11 evidence に基づき記録する。

## 目的

実装仕様書（F1〜F9）に対する Phase 12 の必須 7 ファイル parity を担保し、運用者向け / 中学生向け 2 部構成 implementation-guide で承認ゲート + scripts + CI gate の関係性を明示する。production への実 apply は別タスクで運用実行されるため `workflow_state` は `spec_created` のままとする。

正本仕様（aiworkflow-requirements skill / `docs/00-getting-started-manual/specs/`）への反映は、`scripts/d1/*.sh` と `d1-migration-verify.yml` の存在を D1 関連 reference に追記する候補としてのみ扱い、production の実 apply 結果値で正本仕様を上書きしない。

## 参照資料

- `index.md`
- `artifacts.json` / `outputs/artifacts.json`
- Phase 1〜11 全成果物
- `.claude/skills/task-specification-creator/references/phase-12-documentation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/`（D1 関連 reference 一式）
- `docs/00-getting-started-manual/specs/08-free-database.md`
- 上流: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/outputs/phase-12/`

## 必須タスク（5 タスク + root evidence + main）

| Task | 名称 | 必須 | 出力先 |
| --- | --- | --- | --- |
| 12-1 | 実装ガイド作成（Part 1 中学生向け + Part 2 運用者向け F1〜F9） | ✅ | outputs/phase-12/implementation-guide.md |
| 12-2 | システム仕様書更新サマリー（Step 1-A〜1-C, Step 2 判定） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| 12-3 | ドキュメント更新履歴 | ✅ | outputs/phase-12/documentation-changelog.md |
| 12-4 | 未タスク検出レポート（最低 3 件） | ✅ | outputs/phase-12/unassigned-task-detection.md |
| 12-5 | スキルフィードバックレポート | ✅ | outputs/phase-12/skill-feedback-report.md |
| 12-6 | Phase 12 task spec compliance check | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

加えて `outputs/phase-12/main.md` をサマリとして出力（合計 7 ファイル）。

## Task 12-1: 実装ガイド構成

### Part 1（中学生向け）

- 例え話: production D1 = 「学校の本物の名簿台帳」、migration = 「台帳に新しい欄を増やす作業」、runbook = 「手順書」、F1〜F4 scripts = 「手順書に沿って動く専用ロボット」、CI gate = 「ロボットの空運転を毎回必ず体育館（staging）でやってから職員室（main）に入れるルール」
- なぜ scripts と CI gate が必要か: 「人間が手順書を読み飛ばすかも」「スクリーンショットを取り忘れるかも」「機密情報を証跡に書いてしまうかも」を機械的に防ぐため
- なぜ本タスクで本物の台帳を変えないか: 「ロボットを作る仕事」と「ロボットに本物を触らせる仕事」は別。先にロボットを完成させて校長先生（ユーザー）の許可をもらってから本物を触る

### Part 2（運用者向け F1〜F9）

| 項目 | 内容 |
| --- | --- |
| 対象 migration | `apps/api/migrations/0008_schema_alias_hardening.sql` |
| 対象オブジェクト 5 件 | `schema_aliases` table / `idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` / `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status` |
| 6 段階承認ゲート | (G1) commit → (G2) PR → (G3) CI gate `d1-migration-verify` green → (G4) merge to main → (G5) ユーザー明示承認 → (G6) runbook 実走（別タスク） |
| F1 preflight.sh | `bash scripts/d1/preflight.sh <db> --env <env>` で未適用 migration を JSON 抽出 |
| F2 postcheck.sh | `bash scripts/d1/postcheck.sh <db> --env <env>` で 5 オブジェクト存在 verify（read-only）|
| F3 evidence.sh | `bash scripts/d1/evidence.sh <db> --env <env> --commit <sha> --migration <file>` で `.evidence/d1/<UTC-ts>/` に保存 |
| F4 apply-prod.sh | `bash scripts/d1/apply-prod.sh <db> --env <env> [DRY_RUN=1]` でオーケストレート |
| F5 cf.sh d1:apply-prod | `bash scripts/cf.sh d1:apply-prod ubm-hyogo-db-prod --env production`（F4 への薄ラッパ）|
| F6 CI gate | `.github/workflows/d1-migration-verify.yml` が PR で staging に対し DRY_RUN=1 を実行 |
| F7 bats テスト | `pnpm test:scripts` で 19 ケース全 PASS |
| F8 runbook 本体 | `outputs/phase-05/main.md` Part B（運用 runbook）|
| F9 package.json | `test:scripts` script 追加 |
| evidence 10 項目 | db, env, commit_sha, migration_filename, migration_sha, timestamp_utc, timestamp_jst, approver, dry_run, exit_code |
| failure handling exit code | 0 成功 / 1 verify失敗 / 2 引数誤り / 3 preflight失敗 / 4 apply失敗 / 5 postcheck失敗 / 6 evidence検証失敗（runbook 用に 10/30/40/80 拡張は Phase 6 参照） |
| 視覚証跡 | UI/UX 変更なし。代替証跡: `outputs/phase-11/{structure,grep,staging-dry-run,redaction,manual-smoke-log}` |

## Task 12-2: システム仕様書更新

| Step | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | active workflow / LOGS / topic-map 登録 | `spec_created` 状態として記録 |
| Step 1-B | 実装状況テーブル更新 | `spec_created / implemented-local`（F1〜F9 は本サイクルで実装済み、production 実 apply は未実行）|
| Step 1-C | 関連タスクテーブル更新 | 上流 UT-07B / U-FIX-CF-ACCT-01、下流 UT-07B-FU-04（運用実行）/ FU-01（queue split）/ FU-02（admin retry） |
| Step 2 | システム仕様更新（正本同期） | scripts/d1/* + CI gate の所在を aiworkflow-requirements reference に追記候補としてのみ |

### Step 2 更新対象（候補）

- `.claude/skills/aiworkflow-requirements/references/`（`scripts/d1/*.sh` + CI gate `d1-migration-verify` の所在 1 行追記）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（`bash scripts/cf.sh d1:apply-prod` の所在追記）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（`generate-index.js` で再生成）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 production migration の運用境界 1 段落追記）

> 既定方針: 「scripts は workflow 文書（`docs/30-workflows/`）に閉じる運用ツールであり skill reference には所在のみ追記する」。Phase 12 実行時に追記する / しないを明示判定。

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を別ブロックで記録:

- 旧仕様（runbook 文書のみ）→ 新仕様（実装仕様書化、F1〜F9 + CI gate + bats）への書き換え差分
- workflow-local 同期（`index.md` / `artifacts.json` / `outputs/artifacts.json` の更新差分）
- global skill sync（aiworkflow-requirements の `_legacy.md` / indexes / task-workflow / artifact inventory 更新。task-specification-creator は既存 SKILL.md 更新済みで追加差分なし）
- Step 1-A / 1-B / 1-C / Step 2 の結果（「該当なし」も記録）

## Task 12-4: 未タスク検出（最低 3 件）

1. **production migration apply 運用実行**（UT-07B-FU-04: ユーザー承認後に F4 apply-prod.sh を `--env production` で実走。状態: candidate / priority: HIGH）
2. **queue / cron split for large back-fill**（UT-07B-FU-01: schema diff queue 背景処理分割。状態: candidate / priority: MEDIUM）
3. **admin UI retry label**（UT-07B-FU-02: schema_diff_queue retry 状態の admin 画面表示。状態: candidate / priority: LOW）
4. **scripts/d1 を aiworkflow-requirements skill から逆引きできる index 整備**（candidate / priority: LOW）

## Task 12-5: スキルフィードバックレポート

- テンプレート改善: 実装仕様書 + NON_VISUAL + production runbook を組み合わせるタスクの Phase 11 evidence 標準化候補（bats / staging dry-run / CI gate / grep / redaction の 5 系統）
- ワークフロー改善: 「実装仕様書化したが production 実 apply は別タスク」境界の skill ガイドライン化（`workflow_state = spec_created` のまま据え置く根拠を明文化）
- ドキュメント改善: `docs/30-workflows/` 配下の runbook + scripts 系タスクを aiworkflow-requirements skill から逆引きできる index 整備提案
- bats fixture / mock wrangler 戦略をスキルテンプレートに追加する提案

## Task 12-6: Compliance check 必須項目

- Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて存在
- root `artifacts.json` と `outputs/artifacts.json` の phase / status / file parity（または root 単独正本宣言）
- aiworkflow-requirements same-wave 更新（`LOGS/_legacy.md` / indexes / task-workflow / artifact inventory）
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行結果（topic-map / quick-reference の stale 解消）
- 仕様書内に Token / Account ID / production 実 apply 結果値が含まれていない
- F1〜F9 各 AC（AC-1〜AC-20）が Phase 7 と Phase 12 で同一スコープでトレース
- GitHub Issue #363（CLOSED）に対し PR 本文で `Refs #363` を採用し `Closes #363` を採用しない

## GitHub Issue #363 再オープン判断

| 判定 | 条件 | アクション |
| --- | --- | --- |
| 再オープン不要 | runbook + F1〜F9 仕様が AC-1〜AC-20 を満たし、Phase 11 5 検証が全 PASS | 新規 Issue 起票せず PR 本文で `Refs #363` |
| 新規 Issue 起票 | Phase 11 で AC 不足が判明 | 「scripts/d1 実装 + CI gate 追補」として新規 Issue を起票し本タスクとリンク |
| 再オープン | #363 が完全包含と判断 | `gh issue reopen 363`（solo dev では原則新規 Issue を優先）|

> 既定方針: `Refs #363` 採用、`Closes #363` 不採用。

## Artifacts parity 同期手順

```bash
test -f outputs/artifacts.json \
  && diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json) \
  || echo "PASS: outputs/artifacts.json absent; root artifacts.json is canonical"

# Phase 1〜12 = spec_created のまま据え置き、Phase 13 = blocked_until_user_approval
```

## 4 条件評価

| 条件 | 内容 | 判定方法 |
| --- | --- | --- |
| 矛盾なし | 「実装仕様書化」と「production 実 apply 別タスク」境界が一貫 | 12-1 Part 2 / 12-2 Step 1-B / 12-4 候補 1 で一致 |
| 漏れなし | Phase 12 の 7 ファイル + 12-4 最低 3 候補 + F1〜F9 全件説明 | 12-6 で全項目検証 |
| 整合性あり | 正本仕様への追記が「候補のみ」 | 12-2 Step 2 境界 + redaction grep |
| 依存関係整合 | 上流 UT-07B / 並列 U-FIX-CF-ACCT-01 / 下流 FU-04/01/02 が 12-2 1-C と 12-4 で一致 | cross check |

## 完了条件

- [ ] Phase 12 の 7 ファイル生成宣言
- [ ] F1〜F9 が Part 2 で全件説明
- [ ] root `artifacts.json` と `outputs/artifacts.json` parity
- [ ] aiworkflow-requirements 同期は **候補列挙のみ**
- [ ] aiworkflow-requirements same-wave 更新
- [ ] workflow_state は `spec_created` のまま
- [ ] Token / Account ID / production 実 apply 結果値の記録なし
- [ ] `Refs #363` 方針が固定
- [ ] 4 条件評価 全 PASS

## 成果物

- `outputs/phase-12/main.md`
- `outputs/phase-12/implementation-guide.md`
- `outputs/phase-12/system-spec-update-summary.md`
- `outputs/phase-12/documentation-changelog.md`
- `outputs/phase-12/unassigned-task-detection.md`
- `outputs/phase-12/skill-feedback-report.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`

## 関連リンク

- `index.md`
- 上流: `docs/30-workflows/completed-tasks/ut-07b-schema-alias-hardening/`
- 並列依存: `docs/30-workflows/u-fix-cf-acct-01-cloudflare-api-token-scope-audit/`
- GitHub Issue: https://github.com/daishiman/UBM-Hyogo/issues/363（CLOSED）

## 苦戦想定

- F1〜F9 の bats テスト PASS で `completed` に昇格させたくなるが、本タスクは「実装仕様書 + 文書整備」であり production 実 apply（FU-04）が別タスクのため `spec_created` のまま据え置く。
- aiworkflow-requirements に scripts のコード詳細を写経したくなるが、所在のみ追記。
- `unassigned-task-detection.md` を 0 件で済ませたくなるが、最低 3 件（FU-04/01/02）を必須。
- Issue #363 CLOSED に対し `Closes #363` を反射的に書きたくなるが禁止、`Refs #363` のみ。
- production 実 apply 結果値（適用行数 / hash / 時刻）を「参考」として正本仕様に書きたくなるが本タスクでは触らない。

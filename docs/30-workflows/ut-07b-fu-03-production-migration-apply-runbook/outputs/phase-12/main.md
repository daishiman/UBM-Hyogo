# Phase 12: ドキュメント更新 / 正本仕様同期

## メタ情報

| 項目 | 値 |
| --- | --- |
| Task ID | UT-07B-FU-03 |
| Phase | 12 |
| 状態 | spec_created |
| taskType | requirements / operations / runbook |
| visualEvidence | NON_VISUAL |

## 実行タスク

1. 本 Phase の入力（Phase 1〜11 全成果物・artifacts.json）を確認する。
2. Task 12-1〜12-6 の必須 7 ファイル（`main.md` + 6 補助）が `outputs/phase-12/` に実体として存在することを確認した。
3. 仕様書 root と `outputs/` の `artifacts.json` parity を確認する。
4. workflow_state を `spec_created` のまま据え置く（runbook は文書完成しても、production 実 apply は別タスクで運用実行されるため `completed` には昇格しない）。
5. GitHub Issue #363（CLOSED）の再オープン or 新規 Issue 起票判断を Phase 11 evidence に基づき記録する。

## 目的

skill 規約に従い Phase 12 の必須 7 ファイルを揃え、close-out parity を担保する。本タスクは production migration apply **runbook の文書整備** タスクであり、production への実 apply は本タスクの範囲外であるため、`workflow_state` は `spec_created` のまま据え置く。

正本仕様（aiworkflow-requirements skill / `docs/00-getting-started-manual/specs/`）への反映は、runbook の存在を D1 関連 reference に追記する候補としてのみ扱い、production の実 apply 結果値で正本仕様を上書きしない。

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
| 12-1 | 実装ガイド作成（Part 1 中学生向け + Part 2 運用者向け） | ✅ | outputs/phase-12/implementation-guide.md |
| 12-2 | システム仕様書更新サマリー（Step 1-A〜1-C, Step 2 判定） | ✅ | outputs/phase-12/system-spec-update-summary.md |
| 12-3 | ドキュメント更新履歴 | ✅ | outputs/phase-12/documentation-changelog.md |
| 12-4 | 未タスク検出レポート（0 件不可・最低 3 件想定） | ✅ | outputs/phase-12/unassigned-task-detection.md |
| 12-5 | スキルフィードバックレポート（改善点なしでも出力必須） | ✅ | outputs/phase-12/skill-feedback-report.md |
| 12-6 | Phase 12 task spec compliance check（root evidence） | ✅ | outputs/phase-12/phase12-task-spec-compliance-check.md |

加えて `outputs/phase-12/main.md` をサマリとして出力済み（合計 7 ファイル）。本 Phase 12 close-out では宣言だけでなく、全 7 ファイルの実体を確認済み。

## Task 12-1: 実装ガイド構成

### Part 1（中学生向け）

- 例え話: production D1 は「学校の本物の名簿台帳」、migration は「台帳に新しい欄を増やす作業」、runbook は「その作業をするときの手順書」
- なぜ必要か: 本物の名簿台帳を書き換えるとき、手順書がないと「どの台帳を / どの順番で / 誰の許可で」変えたか分からなくなって、間違いを取り返せなくなる
- 何をしたか: 「本物の台帳を変える前に必ず確認すること」「変える命令」「変えた後にちゃんと変わったか見る方法」「失敗したら止める条件」を全部 1 つの紙に書いた
- 「なぜ本タスクでは本物の台帳を変えないのか」: 手順書を作ること と 手順書に従って実行すること は別の仕事。先に手順書を完成させて、許可をもらってから本物を触る

### Part 2（運用者向け）

- 対象 migration: `apps/api/migrations/0008_schema_alias_hardening.sql`
- 対象オブジェクト: `schema_aliases` table / `idx_schema_aliases_revision_stablekey_unique` / `idx_schema_aliases_revision_question_unique` / `schema_diff_queue.backfill_cursor` / `schema_diff_queue.backfill_status`
- 承認ゲート: commit / PR / merge 後 → ユーザー明示承認 → runbook に従い `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production`
- preflight: `migrations list` で未適用判定 / 対象 DB 名（`ubm-hyogo-db-prod`）の固定確認 / `--env production` の打鍵確認
- post-check: `schema_aliases` table 存在 + 2 UNIQUE index 存在 + `schema_diff_queue` への追加 2 カラム存在（read / dryRun 系のみ。destructive smoke は別承認）
- evidence 保存項目: 実行コマンド / 出力 / exit code / 時刻 / 承認者 / 対象 DB / migration hash or commit SHA（Token 値・Account ID 値は記録しない）
- failure handling: 二重適用 / UNIQUE 衝突 / DB 取り違え / ALTER TABLE 失敗時は **追加 SQL を即興実行せず判断待ち** に戻す
- 視覚証跡: UI/UX 変更なしのため Phase 11 スクリーンショット不要（代替証跡: `outputs/phase-11/structure-verification.md` / `grep-verification.md` / `staging-dry-run.md` / `redaction-check.md`）

## Task 12-2: システム仕様書更新

| Step | 内容 | 本タスクでの扱い |
| --- | --- | --- |
| Step 1-A | active workflow / LOGS / topic-map 登録 | `spec_created` 状態として記録。completed-tasks には移動しない |
| Step 1-B | 実装状況テーブル更新 | `spec_created` として記録。runbook 完成 = production 実 apply 完了 ではないため `completed` に昇格しない |
| Step 1-C | 関連タスクテーブル更新 | 上流 `UT-07B-schema-alias-hardening-001`（completed） / 並列依存 `U-FIX-CF-ACCT-01` / 下流（運用実行・queue split・admin retry label）の関係を current facts へ更新 |
| Step 2 | システム仕様更新（正本同期） | runbook の存在を D1 関連 reference に追記する候補のみ。production の実 apply 結果値で正本仕様を上書きしない |

### Step 2 更新対象（候補）

- `.claude/skills/aiworkflow-requirements/references/`（D1 / migration 系 reference に「production migration apply runbook の所在」だけを追記する候補）
- `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md`（runbook の所在を 1 行追記する候補）
- `.claude/skills/aiworkflow-requirements/indexes/topic-map.md`（`generate-index.js` で再生成）
- `docs/00-getting-started-manual/specs/08-free-database.md`（D1 production migration の運用境界 1 段落追記候補）

> 追記不要と判定する場合の根拠例: 「runbook はワークフロー文書（`docs/30-workflows/`）に閉じる運用ドキュメントであり、aiworkflow-requirements skill は実装契約・正本仕様を扱うため階層が異なる」。Phase 12 実行時に **追記する / しない** のいずれかを明示判定し、根拠を本ファイルに記録する。

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に以下を別ブロックで記録する:

- workflow-local 同期（本タスク仕様書配下の `index.md` / `artifacts.json` / `outputs/artifacts.json` の更新差分）
- global skill sync（aiworkflow-requirements / task-specification-creator の LOGS.md 更新）
- 各 Step 1-A / 1-B / 1-C / Step 2 の結果を個別に明記（「該当なし」も記録）

## Task 12-4: 未タスク検出（最低 3 件）

seed `unassigned-task-detection.md`（UT-07B Phase 12 由来）と整合する scope out 候補を最低限列挙する:

1. **production migration apply の運用実行**（本 runbook に従い、ユーザー承認後に `0008_schema_alias_hardening.sql` を `ubm-hyogo-db-prod` に apply する別タスク。状態: candidate / priority: HIGH）
2. **queue / cron split for large back-fill**（schema diff queue を背景処理に分割する設計タスク。UT-07B の苦戦想定で確認済み。状態: candidate / priority: MEDIUM）
3. **admin UI retry label の実装**（schema_diff_queue の retry 状態を admin 画面に表示するタスク。状態: candidate / priority: LOW）

各候補は `状態: candidate` / 関連タスク差分確認（上流 UT-07B との重複排除）/ 起票要否判定 を記載する。

## Task 12-5: スキルフィードバックレポート

`outputs/phase-12/skill-feedback-report.md` に以下を記録（改善点なしでも出力）:

- テンプレート改善: NON_VISUAL + production runbook タスクにおける Phase 11 evidence 命名（`structure-verification.md` / `grep-verification.md` / `staging-dry-run.md` / `redaction-check.md`）の標準化候補
- ワークフロー改善: 「runbook 文書整備タスクは production 実 apply を伴わないため `completed` 化しない」という境界の skill ガイドライン化
- ドキュメント改善: `docs/30-workflows/` 配下の runbook 系タスクを aiworkflow-requirements skill から逆引きできる index 整備の提案

## Task 12-6: Compliance check 必須項目

`outputs/phase-12/phase12-task-spec-compliance-check.md` に以下を確認する:

- Phase 12 の 7 ファイル（`main.md` + 6 補助）すべて存在
- root `artifacts.json` と `outputs/artifacts.json` の phase / status / file parity。`outputs/artifacts.json` がない場合は root `artifacts.json` が唯一正本であることを明記
- LOGS.md 2 ファイル更新（aiworkflow-requirements / task-specification-creator）
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 実行結果（topic-map / quick-reference の stale 解消）
- 仕様書内に Token 値・Account ID 値・production の実 apply 結果値が含まれていないこと
- GitHub Issue #363（CLOSED）に対して PR 本文で `Refs #363` を採用し `Closes #363` を採用しない方針が固定されていること

## GitHub Issue #363 再オープン判断

Phase 11 evidence の判定結果に応じて以下のいずれかを `outputs/phase-12/main.md` に明記する:

| 判定 | 条件 | アクション |
| --- | --- | --- |
| 再オープン不要 | runbook が AC-1〜AC-12 を満たし、Phase 11 は structure / grep / redaction PASS と staging dry-run `OPERATOR_GATE_OPEN` により DOC_PASS。本タスクは「文書整備の seed 消化」として CLOSED 状態のまま | 新規 Issue 起票せず、PR 本文で `Refs #363` のみ |
| 新規 Issue 起票 | Phase 11 で AC 不足が判明した場合 | 新規 Issue を「production migration apply runbook 文書整備の追補」として起票し、本タスクとリンク |
| 再オープン | Issue #363 のスコープに本タスクが完全包含されると判断された場合 | `gh issue reopen 363` を運用承認のもと実施。ただし solo 開発ポリシーでは原則新規 Issue を優先する |

> 既定方針: `Refs #363` を採用し `Closes #363` を採用しない（CLOSED Issue を再操作しない）。再オープンは Phase 11 evidence ベースで例外的に判断する。

### 判定結果（本タスク確定値）

| 項目 | 値 |
| --- | --- |
| 判定 | **再オープン不要** |
| 根拠 | runbook が AC-1〜AC-12 を充足し、Phase 7 / Phase 10 / Phase 11 の 4 種検証（structure / grep / redaction = PASS、staging dry-run = OPERATOR_GATE_OPEN）で文書整備の DOC_PASS 境界を満たす。本タスクは「文書整備の seed 消化」として CLOSED 状態のままで矛盾なし |
| Phase 13 PR 本文方針 | `Refs #363` のみ（`Closes #363` は採用しない） |
| 新規 Issue 起票要否 | **runbook 文書整備の追補 Issue は不要**。ただし下流の運用実行（`production migration apply の運用実行`）は `docs/30-workflows/unassigned-task/task-ut-07b-fu-04-production-migration-apply-execution.md` として同 wave で formalize 済み。GitHub Issue 起票は Phase 13 merge 後、ユーザー apply 承認取得時に行う |
| 再オープンしない理由 | solo 開発ポリシーで CLOSED Issue は新規 Issue を優先（再操作によるトレーサビリティ低下を避ける） |

## Artifacts parity 同期手順

```bash
# root と outputs の artifacts.json を diff（outputs mirror がある場合）
test -f outputs/artifacts.json \
  && diff <(jq -S . artifacts.json) <(jq -S . outputs/artifacts.json) \
  || echo "PASS: outputs/artifacts.json absent; root artifacts.json is the single canonical ledger for spec_created"

# どちらも phase 1〜12 = spec_created のまま据え置き（completed に昇格させない）
# Phase 13 status は blocked_until_user_approval のまま（user 承認待ち）
```

## 4 条件評価

| 条件 | 内容 | 判定方法 |
| --- | --- | --- |
| 矛盾なし | runbook 文書整備と production 実 apply の境界が一貫している | 12-1 Part 2 / 12-2 Step 1-B / 12-4 候補 1 で「実 apply は別タスク」と一致 |
| 漏れなし | Phase 12 の 7 ファイルが宣言され、12-4 が最低 3 候補を含む | 12-6 compliance check で全項目存在を検証 |
| 整合性あり | 正本仕様への追記が「候補のみ」で、production 実 apply 結果値による上書きを禁ずる | 12-2 Step 2 の境界文と redaction grep の整合 |
| 依存関係整合 | 上流 UT-07B / 並列 U-FIX-CF-ACCT-01 / 下流（運用実行・queue split・admin retry）が 12-2 Step 1-C と 12-4 で一致 | cross check |

## 完了条件

- [x] Phase 12 の 7 ファイル（`main.md` + 6 補助）の実体が存在する
- [x] 各 Task の Step が表化されている
- [x] root `artifacts.json` と `outputs/artifacts.json` parity が記録されている（`spec_created` 同値）
- [x] aiworkflow-requirements / `docs/00-getting-started-manual/specs/` への正本同期は runbook 所在・境界に限定し、production 実 apply 結果値による上書きが禁じられている
- [x] LOGS が same-wave で更新されている
- [x] workflow_state は `spec_created` のままで `completed` に昇格していない
- [x] 仕様書・ログに Token 値・Account ID 値・production 実 apply 結果値が含まれない
- [x] GitHub Issue #363 の再オープン or 新規 Issue 起票判断が記録され、`Refs #363` 方針が固定されている
- [x] 4 条件評価が全 PASS で記録されている

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

- runbook が文書として完成すると `completed` 化したくなるが、本タスクは「production 実 apply の運用実行」を含まないため `spec_created` のまま据え置く必要がある。境界を 12-1 Part 2 と 12-2 Step 1-B で 2 重に固定する。
- 正本仕様（aiworkflow-requirements）に runbook の手順そのものを写経したくなるが、runbook は workflow 文書に閉じる。skill reference には「所在のみ」を追記する境界を Step 2 で守る。
- `unassigned-task-detection.md` を 0 件で済ませたくなるが、UT-07B seed と本タスクの責務分離により最低 3 件（運用実行 / queue split / admin retry label）が必須。
- Issue #363 は CLOSED のため `Closes #363` を反射的に書きたくなるが禁止。`Refs #363` のみを採用する方針を 12-6 で固定する。
- production の実 apply 結果値（適用行数 / hash / 時刻）を「参考」として正本仕様に書きたくなるが、本タスクでは production を触らないため記録しない。

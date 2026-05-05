# Lessons Learned: UT-21 Forms sync conflict close-out（Sheets→D1 sync 旧仕様の Forms sync 正本吸収）

> 由来: `docs/30-workflows/completed-tasks/ut21-forms-sync-conflict-closeout/`
> 完了日: 2026-04-30
> タスク種別: docs-only / specification-cleanup / legacy-umbrella close-out / NON_VISUAL / spec_created
> 出典: `outputs/phase-12/system-spec-update-summary.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `implementation-guide.md`

## 概要

`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`（旧 Sheets→D1 sync 単一 endpoint + audit 実装案）と、現行 `apps/api/` で稼働する Forms sync 系統（`forms.get` / `forms.responses.list` + `sync_jobs` ledger + `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*`）の二重正本（dual-canonical）衝突を、`task-sync-forms-d1-legacy-umbrella-001` の姉妹形式として docs-only / NON_VISUAL の legacy umbrella close-out で解消した。`POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` は **新設しない方針** を本 close-out で確定し、UT-21 当初仕様書は削除せず「legacy / close-out 済」状態欄パッチで残存させた。Sheets direct 実装としては再開せず、有効な品質要件（Bearer 認可境界 / 409 排他 / D1 retry / SQLITE_BUSY backoff / batch-size / manual smoke）のみを 03a / 03b / 04c / 09b へ移植し、audit table 要否・実環境 smoke・実装パス境界は UT21-U02 / U04 / U05 に分離した。

## 苦戦箇所 5 件（L-UT21-001〜005）

### L-UT21-001: 「IF 新設禁止」が成果物そのものの場合に Step 2 が誤って required と判定される

通常の close-out では Step 2（新規 REST endpoint / D1 schema / binding / handler / Secret 追加判定）は新設を伴うため required になりやすい。本タスクのように `POST /admin/sync` / `GET /admin/sync/audit` / `sync_audit_logs` / `sync_audit_outbox` の **新設禁止** が成果物そのものとなる場合、Step 2 判定を「実装が空だから required」と機械的に評価すると、close-out の意図と矛盾する。

- **教訓**: 「IF 新設禁止」が成果物の場合、Step 2 は **not required** と明示し、`system-spec-update-summary.md` に判定根拠（観点表・対象なし理由）を記載する。後続実装可否は `unassigned-task-detection.md` の U02 / U04 / U05 へ完全分離する。
- **再発防止**: `task-specification-creator/references/phase-12-pitfalls.md` に「IF 新設禁止が成果物そのものの場合 Step 2 not required と明示」例を追加。

### L-UT21-002: `references/task-workflow.md` の current facts に legacy / current 区別メタデータが無い

UT-21 が legacy として残存していた間、`task-workflow.md` の current facts セクションには `last verified at` / `superseded_by` 等のメタデータが無く、「Forms sync 採用後も Sheets 由来段落が current として残っている」という暗黙的 drift を構造的に検出できなかった。`references/deployment-cloudflare.md` の Sheets 由来 cron / `runSync` / Sheets API v4 記述も同型の legacy current-fact 残存だった。

- **教訓**: references 各ファイル冒頭または各 entry に `last verified at: <YYYY-MM-DD>` / `superseded_by: <task-id\|null>` を必須メタデータ化し、legacy current-fact の残存を grep で検出可能にする。本 close-out では `deployment-cloudflare.md` 該当節に `> UT-21 close-out note (2026-04-30)` を注記し、runtime cron / wrangler 整理は UT21-U05 に委譲した。
- **後続タスク**: `task-ut21-impl-path-boundary-realignment-001`（UT21-U05）で wrangler.toml / cron / Sheets API current-fact 表現の棚卸し。

### L-UT21-003: `indexes/topic-map.md` に「legacy umbrella close-out 一覧」観点が無く UT-09 / UT-21 の横断参照が困難

UT-09 direction reconciliation と UT-21 forms-sync-conflict-closeout は同型の legacy umbrella close-out だが、topic-map に専用セクションが無く「同型タスクから設計を学習する」導線が欠落していた。同型タスクが今後追加された際の発見コストが高い。

- **教訓**: `indexes/topic-map.md` 冒頭に「Legacy umbrella close-out」セクションを新設し、UT-09 / UT-21 等を横断参照可能化。`indexes/quick-reference.md` にも UT-21 close-out 用導線（legacy 扱い / 現行 Forms sync 正本 / 後続判断 U02-U05 / 旧仕様の状態欄）を追加。`indexes/resource-map.md` にも「UT-21 Forms sync conflict close-out」行を current canonical set に追加。
- **再発防止**: 同型 close-out が増えるたびに topic-map の同セクションへ追記する運用を固定。

### L-UT21-004: 旧仕様書（unassigned-task）を削除せず状態欄パッチで残す運用境界の明確化が必要

UT-21 当初仕様書 `UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` を削除すると、検出元 `doc/03-serial-data-source-and-storage-contract/outputs/phase-12/unassigned-task-detection.md (U-04)` への traceability と、過去の判断履歴が失われる。一方で「active」のまま残すと再開実装の誤起動リスクが残る。

- **教訓**: legacy umbrella close-out では旧仕様書を削除せず、(1) 状態欄を「legacy / close-out 済（`<close-out-task-id>` により現行正本へ吸収）」に書き換え、(2) 各見出し冒頭に `> Legacy note: 本節は履歴であり、実装 ToDo ではない。実装可否・移植先は close-out 仕様書と Uxx を参照する。` を挿入し、(3) 完了条件節も同様に legacy note 化する。`組み込み先` 欄に close-out 仕様書パスを記入し双方向 traceability を確保する。
- **再発防止**: 本ファイル + UT-09 lessons-learned が legacy umbrella close-out の運用テンプレートとなる。

### L-UT21-005: docs-only / IF 新設禁止タスクでの `workflow_state` 据え置き運用と派生 implementation タスクの分離

docs-only / specification-cleanup / legacy-umbrella close-out タスクでは `workflow_state=spec_created` を据え置き、`implemented` への昇格は禁止する。`implemented` 昇格は派生 03a / 03b / 04c / 09b および後続 U02 / U04 / U05 完了後の責務とする。本 PR では「cross-link のみ」「新規実装コードは追加しない」「commit / PR / push は Phase 13 user 承認後」を厳守し、03a / 03b / 04c / 09b の `index.md` が未存在の場合は片方向 cross-link と U05 scope 追補で閉じる。

- **教訓**: docs-only close-out の `workflow_state` 据え置きルールを `task-specification-creator/SKILL.md` 変更履歴に明記。`metadata.docsOnly=true` 維持で `implemented` 再判定ルートに入らないことを Phase 12 compliance check で固定行検査する。実 patch 適用先 (`index.md`) の実体不在時は cross-link を片方向に留め、U05 または各タスク起票/再開時の Phase 内で patch 適用する。
- **再発防止**: `task-specification-creator/references/phase-12-spec.md` に「legacy umbrella close-out 専用 Step 1-A テンプレート（current facts 追記文言の固定化）」セクションを追加提案。

## 運用ルール 2 件（legacy umbrella close-out 系の固定運用）

| 規則 | 内容 |
| --- | --- |
| OP-UT21-1 | legacy umbrella close-out では旧仕様書を削除せず状態欄パッチ（legacy / close-out 済 + close-out 仕様書 path）+ 各見出し冒頭の Legacy note 注記で残存させる。`組み込み先` 欄に close-out 仕様書パスを記入し双方向 traceability を確保する。 |
| OP-UT21-2 | 「IF 新設禁止」が成果物そのものの close-out では Step 2 = not required を `system-spec-update-summary.md` に観点表で明示し、後続実装判定は `unassigned-task-detection.md` の Uxx に完全分離する。本 PR には派生実装タスクを混入させない。 |

## 同期完了サマリー（same-wave sync）

| 同期対象 | パス | 反映内容 |
| --- | --- | --- |
| workflow LOG | `docs/30-workflows/LOGS.md` | UT-21 close-out 行（2026-04-30） |
| SKILL #1 | `.claude/skills/aiworkflow-requirements/SKILL.md` | 変更履歴 `v2026.04.30-ut21-forms-sync-closeout` 行 |
| SKILL #2 | `.claude/skills/task-specification-creator/SKILL.md` | 変更履歴 `v2026.04.30-ut21-legacy-umbrella-closeout` 行（legacy umbrella close-out 再利用例） |
| LOGS skill #1 | `.claude/skills/aiworkflow-requirements/LOGS/_legacy.md` | 最新更新ヘッドラインに UT-21 close-out same-wave sync 行 |
| LOGS skill #2 | `.claude/skills/task-specification-creator/LOGS/_legacy.md` | UT-21 legacy umbrella close-out Phase 12 feedback セクション |
| references current facts | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | line 9 付近に UT-21 close-out 済 current facts 段落 |
| references stale note | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Sheets 由来 cron / `runSync` / Sheets API v4 を legacy current-fact と注記、UT21-U05 に委譲 |
| topic-map | `.claude/skills/aiworkflow-requirements/indexes/topic-map.md` | 「Legacy umbrella close-out」セクション新設、UT-21 行追加 |
| quick-reference | `.claude/skills/aiworkflow-requirements/indexes/quick-reference.md` | 「UT-21 Forms sync conflict close-out（2026-04-30）」セクション追加 |
| resource-map | `.claude/skills/aiworkflow-requirements/indexes/resource-map.md` | current canonical set に UT-21 Forms sync conflict close-out 行追加 |
| lessons-learned | 本ファイル | L-UT21-001〜005 + OP-UT21-1/2 |
| lessons-learned hub | `.claude/skills/aiworkflow-requirements/references/lessons-learned.md` | 本ファイルへの参照行追加 |
| 二重 ledger | `artifacts.json` (root) + `outputs/artifacts.json` | parity 確保 |
| UT-21 当初仕様書 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | 状態欄 / 組み込み先 / 各節 Legacy note を 2026-04-30 付でパッチ |

## 関連 unassigned-task（UT21-U02 / U04 / U05）

| ID | unassigned-task | 種別 |
| --- | --- | --- |
| UT21-U02 | `task-ut21-sync-audit-tables-necessity-judgement-001` | audit table 要否判定（`sync_audit_logs` / `sync_audit_outbox` 新設可否） |
| UT21-U04 | `task-ut21-phase11-smoke-rerun-real-env-001` | Phase 11 smoke の実環境再実行（実 secrets / 実 D1） |
| UT21-U05 | `task-ut21-impl-path-boundary-realignment-001` | 実装パス境界の再整列（`apps/api/src/sync/*` 想定 vs 実構成 + `wrangler.toml` Sheets cron 棚卸し） |

## 派生品質要件の移植先（implementation 引き渡し）

| UT-21 由来の品質要件 | 移植先 |
| --- | --- |
| Bearer 認可境界（401 / 403 / 200） | 04c-parallel-admin-backoffice-api-endpoints |
| 409 排他（`sync_jobs.status='running'` 同種 job 衝突） | 03a / 03b |
| D1 retry / `SQLITE_BUSY` backoff / 短い transaction / batch-size 制限 | 03a / 03b |
| manual smoke（実 secrets / 実 D1 環境） | 09b runbook + 09a / 09c smoke |

> 実 patch 適用は各タスクの Phase で行う。本 close-out は cross-link のみで完結する。

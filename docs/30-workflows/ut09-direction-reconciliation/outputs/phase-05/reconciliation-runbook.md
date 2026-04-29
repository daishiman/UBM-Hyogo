# Phase 5 実装ランブック（撤回 / 移植手順）

正本仕様: `../../phase-05.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
採用方針: **A — current Forms 分割方針へ寄せる**（base case / Phase 3 確定 / ユーザー承認不要）
AC トレース: AC-2 / AC-4 / AC-5 / AC-7 / AC-8 / AC-11 / AC-13 / AC-14

---

## 0. 本 runbook の位置づけ（先頭固定）

本 runbook は **docs-only** タスクとして「方針統一を文書として完了させる reconciliation 実行手順」を確定するものである。
コード撤回（`apps/api/src/jobs/sync-sheets-to-d1.ts` 系の削除）/ migration down（`sync_locks` / `sync_job_logs` の down 適用）/ Cloudflare Secret 削除 / `wrangler.toml` 変更 / PR 作成 / commit / push は **本タスクのスコープ外** とする。

これらの実コード操作はすべて **別タスクへ register** する。本 Phase の役割は:

1. 撤回ランブックの **手順チェックリスト** を確定すること
2. 移植ランブックの **品質要件保存先と記述方針** を確定すること
3. ロールバック条件 / Secret 削除順序 / aiworkflow-requirements references 更新順序を runbook 上で固定すること

> 別タスク化 register は Phase 12 unassigned-task-detection で実施。本 Phase は配置先パスと仮称のみを予約する。

---

## 1. 採用 A 撤回ランブック（チェックリスト形式 / 別タスク実施）

> 撤回ステップ A1〜A5 はすべて **別タスクで実施する前提**。本 runbook は手順・順序・ロールバック条件を確定するのみ。

### 1.1 撤回対象一覧

| # | 撤回対象 | 種別 | 実施担当（別タスク仮称） |
| --- | --- | --- | --- |
| A1 | `apps/api/src/jobs/sync-sheets-to-d1.ts` および同 `__tests__` 系 | コード | `task-ut09-sheets-implementation-withdrawal-001` |
| A1 | `apps/api/src/routes/admin/sync.ts`（単一 endpoint 実装） | コード | 同上 |
| A2 | D1 migration: `sync_locks` テーブル定義 | migration down | 同上 |
| A2 | D1 migration: `sync_job_logs` テーブル定義 | migration down | 同上 |
| A3 | Cloudflare Secret: `GOOGLE_SHEETS_SA_JSON` | Secret 削除 | 同上 |
| A3 | Cloudflare Variable: `SHEETS_SPREADSHEET_ID` | Variable 削除 | 同上 |
| A4 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md` を legacy umbrella 参照に戻す | 文書復元 | `task-ut09-root-restore-legacy-umbrella-ref-001` |
| A5 | `wrangler.toml` の `[triggers]` を Forms 2 経路前提に揃える | 設定変更 | 09b implementation 連携 |

### 1.2 撤回ステップ実行順序（厳格）

撤回は以下の順序で別タスクが実行する。順序を入れ替えると D1 整合性 / Secret 不在で job 失敗 / 文書 dangling 参照を誘発する。

```
[Step A0] 事前 baseline 取得（Phase 4 scan を Step 0 として実行 / 採用 A 確定の最終再確認）
   ↓
[Step A1] コード削除 PR を作成（feature branch / dev → main）
   ├─ apps/api/src/jobs/sync-sheets-to-d1.ts を削除
   ├─ apps/api/src/routes/admin/sync.ts を削除
   ├─ scheduled handler の sheets 経路呼び出しを削除
   └─ typecheck / lint / test green を確認
   ↓
[Step A2] migration down 適用（A1 deploy 後 / 旧コードが Secret/テーブルに依存しない状態で実行）
   ├─ down migration file を追加（sync_job_logs → sync_locks の順で DROP）
   ├─ bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-prod --env production
   └─ bash scripts/cf.sh d1 export ubm-hyogo-db-prod --env production --output backup-pre-down.sql で事前 backup
   ↓
[Step A3] Cloudflare Secret / Variable 削除（A1 deploy + A2 完了後 / コード参照が消えた状態でのみ実施）
   ├─ bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production
   ├─ bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env staging
   └─ wrangler.toml [vars] から SHEETS_SPREADSHEET_ID を削除（PR 化）
   ↓
[Step A4] 旧 UT-09 root を legacy umbrella 参照に復元（コード撤回完了後 / 文書整合性回復）
   └─ docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md を「task-sync-forms-d1-legacy-umbrella-001 へ統合済み」記述に書換
   ↓
[Step A5] wrangler.toml [triggers] を Forms 2 経路前提に整合（09b implementation 連携 / 03a + 03b PR 着手前に完了）
```

### 1.3 Secret 削除順序（厳格 / hygiene 観点）

Secret 削除は **コード参照が完全に消えた後にのみ** 実行する。順序違反は実 production の job が Secret 不在で 5xx を返す事故に直結する。

| # | 操作 | 前提条件 |
| --- | --- | --- |
| 1 | A1 PR の production deploy 完了確認（旧 endpoint が 404 を返すこと） | A1 完了 |
| 2 | A2 migration down 完了確認（`sync_locks` / `sync_job_logs` が DROP 済み） | A2 完了 |
| 3 | staging Secret 削除: `bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env staging` | 1, 2 完了 |
| 4 | staging で Forms 経路 smoke 走行（pending → PASS への遷移確認） | 3 完了 |
| 5 | production Secret 削除: `bash scripts/cf.sh secret delete GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env production` | 4 PASS |
| 6 | `wrangler.toml` から `SHEETS_SPREADSHEET_ID` 行削除 PR | 5 完了 |

> `wrangler` 直接実行禁止。すべて `bash scripts/cf.sh` 経由。1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式のみ。

### 1.4 撤回時のロールバック条件

| 状況 | ロールバック手順 |
| --- | --- |
| A1 deploy 後に Forms 2 経路の scheduled handler が 5xx を返す | 直前の version_id へ rollback: `bash scripts/cf.sh rollback <VERSION_ID> --config apps/api/wrangler.toml --env production`。A2 / A3 は未着手の前提を維持 |
| A2 migration down 後に D1 整合性エラーが検出 | `backup-pre-down.sql` から restore（`bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file backup-pre-down.sql`）。A3 / A4 / A5 は中止 |
| A3 Secret 削除後に staging で Forms 経路が機能不全 | Secret 削除は不可逆のため再投入: `bash scripts/cf.sh secret put GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env staging`（1Password 値を再注入）。撤回方針自体を Phase 2 に差し戻し |
| A4 文書復元後に 03a / 03b / 04c / 09b の参照リンクが 404 化 | 当該 PR を `git revert` し、参照経路を Phase 9 同期確認で再点検 |
| reconciliation 全体の停止 | artifacts.json の `phases[2].status` を `blocked` に戻し、Phase 2 へ差し戻す（Phase 3 NO-GO 条件発動相当） |

---

## 2. 採用 A 移植ランブック（D1 contention mitigation 5 知見）

> 移植ランブックは **品質要件記述の保存先と記述方針** を確定するもの。記述追加 PR（実文書編集）は別タスク `task-ut09-d1-contention-knowledge-port-001` で実施する。

### 2.1 移植元・移植先マッピング

| 移植 # | 知見（移植内容） | 移植元 | 移植先文書 | 記述追加位置 |
| --- | --- | --- | --- | --- |
| P1 | WAL 非前提 / short transaction（D1 のロック特性に依存しない設計 / 1 transaction の処理量制限） | 旧 UT-09 sheets-to-d1 cron sync-job 設計知見 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` | 「品質要件 / 不変条件」セクション（schema sync 側） |
| P1 | 同上 | 同上 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` | 「品質要件 / 不変条件」セクション（response sync 側） |
| P2 | retry/backoff（exponential backoff / 最大試行回数）/ batch-size 制限（1 sync あたり処理件数の上限） | 同上 | `03a/index.md` | 「品質要件 / AC」セクション |
| P2 | 同上 | 同上 | `03b/index.md` | 「品質要件 / AC」セクション |
| P2 | 同上（cron 起動側で観測する分） | 同上 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` | 「監視 AC / メトリクス」セクション |
| P3 | 二重起動防止（scheduled / manual 同時起動時の lock or idempotency strategy） | 同上 | `09b/index.md` | 「runbook / 二重起動防止」セクション |
| P4 | 移植記述の整合確認（Phase 4 移植対象スキャン再実行で 5 知見すべてが移植先文書にヒット） | scan-checklist.md | 4 文書（03a / 03b / 09b / 09b）すべて | Phase 9 スキャン結果として保存 |

### 2.2 移植ステップ実行順序

```
[Step P0] Phase 4 移植対象スキャン baseline を取得（5 知見が移植先に未出現の状態を記録）
   ↓
[Step P1] WAL 非前提 / short transaction 知見を 03a/03b へ追記（PR1）
   ├─ 03a/index.md: schema sync transaction の処理量制限を AC 化
   └─ 03b/index.md: response sync transaction の短時間化を AC 化
   ↓
[Step P2] retry/backoff / batch-size 制限を 03a / 03b / 09b へ追記（PR2）
   ├─ 03a/index.md: exponential backoff + 最大試行回数 + 1 sync あたり処理件数上限
   ├─ 03b/index.md: 同上
   └─ 09b/index.md: 監視メトリクスとして retry 回数・batch サイズを観測対象に追加
   ↓
[Step P3] 二重起動防止 runbook を 09b へ追記（PR3）
   └─ 09b/index.md: scheduled / manual 同時起動時の lock or idempotency 方針を runbook 化
   ↓
[Step P4] Phase 9 で再スキャンし 5 知見すべてが移植先にヒットすることを diff 確認
```

> P1〜P3 の PR はそれぞれ独立で revert 可能であること。撤回 PR（A1〜A5）と移植 PR（P1〜P3）は **分離 PR** とし、相互依存しない。これによりロールバック粒度を最小化する。

### 2.3 移植先 4 文書の記述方針

| 文書 | 記述方針 |
| --- | --- |
| `03a/index.md` | Forms schema sync の責務境界を保ちつつ、D1 transaction の短時間化・batch-size 上限・retry/backoff を AC として追加。schema を mapper.ts に閉じる方針（不変条件 #1）を破壊しない |
| `03b/index.md` | Forms response sync の current response resolver の冪等性を保ちつつ、short transaction / retry/backoff / batch 上限を AC として追加。admin-managed data 専用テーブル分離（不変条件 #4）を破壊しない |
| `09b/index.md`（品質要件側） | scheduled handler の retry 観測 / batch サイズ観測を監視 AC として追加 |
| `09b/index.md`（runbook 側） | 二重起動防止（lock or idempotency strategy）を runbook 化。scheduled / manual の同時起動シナリオを明示 |

### 2.4 移植時のロールバック条件

| 状況 | ロールバック手順 |
| --- | --- |
| P1 追記後に 03a / 03b の AC が schema を mapper.ts に閉じる方針を侵食 | P1 PR を `git revert`。Phase 2 reconciliation 設計から記述方針を再導出 |
| P2 追記後に 09b の監視 AC が冪等性方針を破壊 | P2 PR を `git revert`。03a / 03b 側の追記は維持（独立 PR のため） |
| P3 追記後に 09b runbook が `/admin/sync` 単一前提の記述に逆戻り | P3 PR を `git revert`。S4（04c 同期確認）で 2 endpoint 維持を再確認 |
| 全体方針再選定 | P1〜P3 全 PR を `git revert` し、Phase 2 へ差し戻し |

---

## 3. aiworkflow-requirements references 更新順序

> A 採用時は references の **新規登録は不要**（current 維持）。ただし Sheets 系 contract が誤って登録されていないことを確認する手順を runbook 化する。B 採用時のみ same-wave 更新が発生するが、本 runbook は採用 A を base case として記述する。

### 3.1 採用 A 時の references 確認順序（更新ではなく確認）

| # | references | 確認観点 | 確認コマンド |
| --- | --- | --- | --- |
| R1 | `.claude/skills/aiworkflow-requirements/references/api-endpoints.md` | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint のみ正本登録 / `/admin/sync` 単一が登録されていないこと | `rg -n '/admin/sync(/schema\|/responses)?' .claude/skills/aiworkflow-requirements/references/api-endpoints.md` |
| R2 | `.claude/skills/aiworkflow-requirements/references/database-schema.md` | `sync_jobs` 単一 ledger のみ正本登録 / `sync_locks` / `sync_job_logs` が登録されていないこと | `rg -n 'sync_jobs\|sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` |
| R3 | `.claude/skills/aiworkflow-requirements/references/environment-variables.md` | Forms 系（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY`）のみ登録 / Sheets 系（`GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID`）が登録されていないこと | `rg -n 'GOOGLE_(SHEETS\|FORMS\|FORM\|SERVICE_ACCOUNT)\|SHEETS_SPREADSHEET_ID' .claude/skills/aiworkflow-requirements/references/environment-variables.md` |
| R4 | `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | Sheets 系 Secret 削除手順が含まれず Forms 経路 deploy のみ記述されていること | `rg -n 'GOOGLE_SHEETS_SA_JSON\|SHEETS_SPREADSHEET_ID' .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` |

### 3.2 references 更新順序（万一 stale contract が混入していた場合 / 別タスク）

| # | 操作 | 順序の根拠 |
| --- | --- | --- |
| 1 | api-endpoints.md から `/admin/sync` 単一 endpoint 記述を削除 | endpoint 認可境界（AC-4）を最優先で正本化 |
| 2 | database-schema.md から `sync_locks` / `sync_job_logs` 記述を削除 | D1 ledger 一意性（AC-5）を次順で確保 |
| 3 | environment-variables.md から Sheets 系 Secret 記述を削除 | Secret hygiene を確保（コード撤回 A3 と同期） |
| 4 | deployment-cloudflare.md から Sheets 経路 deploy 記述を削除 | 上記 3 件の整合反映 |
| 5 | `mise exec -- pnpm indexes:rebuild` 実行 | indexes / topic-map / quick-reference / resource-map を同時更新 |
| 6 | `git status .claude/skills/aiworkflow-requirements/indexes/` で drift 0 確認 | CI gate `verify-indexes-up-to-date` 通過確認 |
| 7 | PR 作成（撤回 PR / 移植 PR とは分離） | 独立 revert 粒度を維持 |

> 順序 1 → 2 → 3 → 4 を逆転させると、indexes rebuild 時に部分的な不整合が cache に残り、後続 PR で diff が二重発生する。必ず R1 → R2 → R3 → R4 → indexes:rebuild の順を守る。

### 3.3 references 更新時のロールバック条件

| 状況 | ロールバック手順 |
| --- | --- |
| indexes rebuild 後に drift が 0 にならない | rebuild 出力 diff を確認し、references 側の編集ミスを特定。`git checkout` で個別 references を復元してから再 rebuild |
| CI `verify-indexes-up-to-date` が fail | indexes/ 配下を再生成し commit に含める（手書き編集禁止） |
| 採用方針が B に変更 | references 4 件を same-wave で B 採用記述に書換（別 reconciliation タスクとして再起票） |

---

## 4. 別タスク register 一覧（手順チェックリスト）

本 runbook で確定した撤回 / 移植 / references 更新は、以下の別タスクとして Phase 12 unassigned-task-detection で起票する。本 Phase は配置先パスと仮称を予約するのみ。

| open# | 別タスク仮称 | 配置先 | カバー範囲 | Phase 12 起票 |
| --- | --- | --- | --- | --- |
| 1 | `task-ut09-sheets-implementation-withdrawal-001` | `docs/30-workflows/unassigned-task/task-ut09-sheets-implementation-withdrawal-001.md` | A1 / A2 / A3 / A5（コード削除 + migration down + Secret 削除 + wrangler.toml 整合） | YES |
| 2 | `task-ut09-d1-contention-knowledge-port-001` | `docs/30-workflows/unassigned-task/task-ut09-d1-contention-knowledge-port-001.md` | P1 / P2 / P3（5 知見の 03a / 03b / 09b 移植） | YES |
| 3 | （open#3 は記録のみ） | `outputs/phase-12/unassigned-task-detection.md` 内記録 | 案 b（Sheets 採用）の将来採用判断時期 / ユーザー承認前提 | YES（detection 記録のみ） |
| 4 | `task-ut09-root-restore-legacy-umbrella-ref-001` | `docs/30-workflows/unassigned-task/task-ut09-root-restore-legacy-umbrella-ref-001.md` | A4（旧 UT-09 root を legacy umbrella 参照に復元） | YES |
| 5 | （Phase 9 で実施） | 本タスク Phase 9 | references 4 件の確認スキャン（§3.1） | NO |
| 6 | `task-cleanup-verification-reports-001` | `docs/30-workflows/unassigned-task/task-cleanup-verification-reports-001.md` | unrelated verification-report 削除（本 PR に混ぜない） | YES |

---

## 5. 採用 A 同期確認（5 文書）

撤回 + 移植 + references 確認の完了後、以下の 5 文書を同期確認する（コマンド実行は Phase 9）。

| # | 文書 | 同期観点 | 同期確認コマンド |
| --- | --- | --- | --- |
| S1 | `task-sync-forms-d1-legacy-umbrella-001.md` | 「旧 UT-09 を direct implementation にしない」方針の存続 | `rg '旧 UT-09 を direct implementation' docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` |
| S2 | `03a/index.md` | Forms schema sync 責務境界 + 移植 P1/P2 反映 | `rg 'forms.get\|exponential backoff\|batch' docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` |
| S3 | `03b/index.md` | Forms response sync + 移植 P1/P2 反映 | `rg 'forms.responses.list\|short transaction' docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |
| S4 | `04c/index.md` | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 維持 | `rg '/admin/sync/(schema\|responses)' docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` |
| S5 | `09b/index.md` | scheduled handler が 2 経路呼び出し + 二重起動防止 P3 反映 | `rg 'scheduled\|二重起動' docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` |

---

## 6. 採用 B 着手時のランブック（参考 / 要ユーザー承認）

> 採用 B は Phase 3 評価で MAJOR 1（current facts）/ MINOR 4 が残り、ユーザー承認なしには着手不可。本節は **承認後の手順雛形** として残し、本 reconciliation タスク内で着手することはない。

| # | ステップ | 対象 | 順序の根拠 |
| --- | --- | --- | --- |
| B0 | ユーザー承認取得（承認文を `outputs/phase-05/user-approval-record.md` に保存） | — | 承認なし着手は Phase 3 NO-GO 条件 |
| B1 | legacy umbrella spec 更新（direct-implementation 禁止方針の更新） | `task-sync-forms-d1-legacy-umbrella-001.md` | 正本起点を最優先で書換 |
| B2 | 03a / 03b / 04c / 09b 責務境界の再設計（Sheets API + 単一 `/admin/sync` 前提） | 4 文書 | 正本起点に応じた波及更新 |
| B3 | references same-wave 更新（api-endpoints / database-schema / environment-variables / deployment-cloudflare） | 4 references | §3.2 の順序（1 → 2 → 3 → 4 → indexes:rebuild）を継承 |
| B4 | `mise exec -- pnpm indexes:rebuild` + drift 0 確認 | indexes / | CI gate 通過保証 |
| B5 | UT-26 staging-deploy-smoke シナリオ切替 | UT-26 仕様書 | 監視・smoke の最終整合 |

> 採用 B 時は §5 同期確認スキャンの期待結果を反転する（Phase 4 scan-checklist.md「期待結果（採用 B 時）」列を再利用）。

---

## 7. 共通ロールバック手順（採用 A / B 横断）

| 状況 | ロールバック先 | コマンド / 手順 |
| --- | --- | --- |
| 採用 A の Step A1（撤回別タスク化）後に方針再選定が必要 | 別タスク仕様書を `blocked` 化し、本 reconciliation を Phase 2 に差し戻す | `outputs/phase-12/unassigned-task-detection.md` から該当別タスクを取り下げ |
| 採用 A の Step P1〜P3 移植記述追加後に取り消したい | 該当 PR を revert（移植記述追加 PR） | `git revert`（撤回 PR と分離されているため独立 revert 可能） |
| 採用 A の Step A2 migration down 後に整合性破壊検出 | `backup-pre-down.sql` から restore | `bash scripts/cf.sh d1 execute ubm-hyogo-db-prod --env production --file backup-pre-down.sql` |
| 採用 A の Step A3 Secret 削除後に Forms 経路機能不全 | 1Password から Secret 再注入 | `bash scripts/cf.sh secret put GOOGLE_SHEETS_SA_JSON --config apps/api/wrangler.toml --env <env>` |
| 採用 B 着手後に承認撤回 | 採用 A へフォールバック（Phase 2 Mermaid の B 未承認経路） | Step B1〜B5 の差分を revert し、本 runbook §1〜§5 採用 A 手順に切替 |
| reconciliation 全体の停止 | Phase 3 NO-GO 条件発動 | artifacts.json の `phases[2].status` を `blocked` に戻し、Phase 2 へ差し戻す |

---

## 8. sanity check（実行前 / 実行後）

```bash
# 実行前 baseline（Phase 9 Step 0 で実行）
bash -c 'rg -n "/admin/sync" docs/ .claude/skills/ | wc -l'
bash -c 'rg -n "sync_locks" .claude/skills/aiworkflow-requirements/references/database-schema.md | wc -l'
bash -c 'rg -n "GOOGLE_SHEETS_SA_JSON" .claude/skills/aiworkflow-requirements/references/ | wc -l'

# reconciliation 実行（採用 A）後（Phase 9 Step 5 で実行）
# - /admin/sync/schema|responses のヒットは横ばい or 増加（移植記述追加分）
# - sync_locks の正本ヒットは 0 件、ヒットが残る場合は「廃止候補」コンテキストのみ
# - GOOGLE_SHEETS_SA_JSON の references ヒットは 0 件
```

---

## 9. 禁止事項チェックリスト（docs-only タスク特有 / 本 Phase 自己点検）

- [x] 本 Phase でコード変更（`apps/api/src/**`, `apps/web/src/**`）を行っていない
- [x] 本 Phase で migration の up/down を実行していない
- [x] 本 Phase で `bash scripts/cf.sh secret put|delete` を実行していない（コマンド定義のみ）
- [x] 本 Phase で PR 作成 / commit / push を行っていない
- [x] `wrangler` を直接呼んでいない（runbook 上のコマンドはすべて `bash scripts/cf.sh` 経由）
- [x] 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式のみ
- [x] unrelated verification-report 削除を本 reconciliation runbook に混ぜていない（別タスク `task-cleanup-verification-reports-001` へ register）
- [x] 採用 B 着手にユーザー承認の前提が runbook に明記（§6 Step B0）
- [x] 移植先 4 文書（03a / 03b / 09b 品質要件 / 09b runbook）すべてに移植内容が割当（§2.1）
- [x] 5 文書同期確認コマンドが 5 件すべて記述（§5）

---

## 10. AC トレース（本 Phase 確定分）

| AC | 本 runbook での確定 | 参照節 |
| --- | --- | --- |
| AC-2 | 採用 A 撤回 5 ステップ + 移植 4 ステップを別タスク化前提で確定 | §1, §2, §4 |
| AC-4 | `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint 維持を S4 で確認 | §5 S4 |
| AC-5 | `sync_jobs` 単一 ledger 維持。`sync_locks` / `sync_job_logs` 撤回を A2 で確定 | §1.1 A2, §3.1 R2 |
| AC-7 | Phase 12 compliance の 3 値判定ルール（PASS / FAIL / pending）を §1.3 staging smoke 遷移確認に組込 | §1.3 |
| AC-8 | references に stale contract を登録しない確認手順 R1〜R4 を確定 | §3.1 |
| AC-11 | 30 種思考法は Phase 3 完了 8 種 + Phase 10 補完 22 種で AC-11 最終 PASS（本 Phase は前提として継承） | — |
| AC-13 | staging smoke pending を PASS と書かない運用を §1.3 順序 4「pending → PASS への遷移確認」に組込 | §1.3 |
| AC-14 | unrelated verification-report 削除を本 PR に混ぜない方針を §4 別タスク register #6 で固定 | §4 |

---

## 11. 完了確認

- [x] 採用 A の撤回手順が 5 ステップ（A1〜A5）で記述、各ステップが「別タスク化」明記（§1.1, §1.2）
- [x] 採用 A の移植手順が 4 ステップ（P1〜P4）で記述、移植先 4 文書すべてに記述追加方針あり（§2.1, §2.3）
- [x] D1 contention mitigation の 5 知見（WAL 非前提 / short transaction / retry/backoff / batch-size / 二重起動防止）が 03a / 03b / 09b 品質要件に保存（§2.1, §2.3）
- [x] Secret 削除順序が 6 ステップで記述、staging → production / pre-deploy 確認込み（§1.3）
- [x] aiworkflow-requirements references 更新順序が R1 → R2 → R3 → R4 → indexes:rebuild の 7 ステップで記述（§3.2）
- [x] 採用 A 同期確認手順が 5 文書 × 同期観点 + コマンドで記述（§5）
- [x] 採用 B 手順が 6 ステップ（B0〜B5）で記述、ユーザー承認が前提として明記（§6）
- [x] ロールバック手順が 6 ケース以上記述（§1.4, §2.4, §3.3, §7）
- [x] 別タスク register 一覧が 6 件記述、うち 4 件が Phase 12 起票対象として明示（§4）
- [x] sanity check が実行前 / 実行後の 2 ポイントで記述（§8）
- [x] 禁止事項チェックリスト 10 項目が記述（§9）
- [x] 撤回 / 移植は別タスクで実施する旨を冒頭で明示（§0）

---

状態: spec_created

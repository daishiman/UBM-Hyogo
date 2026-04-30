# Phase 8: DRY 化 / 重複解消（仕様書・正本ベース）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 / 重複解消（reconciliation 文脈） |
| 作成日 | 2026-04-29 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証 / 5 点同期チェック) |
| 状態 | spec_created |
| タスク分類 | docs-only / direction-reconciliation（仕様書 DRY） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

本タスクは **docs-only** のため、Phase 8 のスコープは「コード DRY」ではなく **仕様書 / 正本（spec）の重複解消** に再定義する。具体的には、Forms 分割方針（A）と Sheets 採用方針（B）を扱う 2 系統の正本記述が二重化している箇所を棚卸しし、(a) 削除対象（撤回するべき記述）、(b) 保持対象（採用 base case = 案 a に整合する記述）、(c) 共通項として全 Wave で残すべき knowledge（D1 contention mitigation 等）に分類する。Phase 9 の 5 点同期チェック前に、文書 navigation drift と命名 drift を 0 件化する。

> 本 Phase は **コード抽出方針も migration 撤回手順も含まない**。重複解消の対象は仕様書・index.md・aiworkflow-requirements references・unassigned-task spec のみ。実コード DRY は別タスク。

## 実行タスク

1. Phase 1〜7 と参照 5 文書（legacy umbrella / 03a / 03b / 04c / 09b）/ 旧 UT-09 root / Sheets 系 spec（ut-21）を横断 grep し、重複定義 / 表現揺れを表化する（完了条件: 重複候補 5 件以上を表化）。
2. 削除対象（撤回するべき記述）を 5 軸（仕様 / endpoint 表記 / ledger 表記 / Secret 表記 / Cron schedule 表記）で確定する（完了条件: 5 軸すべてに対応する削除対象が記述）。
3. 保持対象（base case = 案 a に整合する正本記述）を 5 軸で確定する（完了条件: 削除対象と 1:1 対応）。
4. 共通項（採用方針に依らず全 Wave で保持すべき knowledge）を 5 件以上抽出する（完了条件: D1 contention mitigation 5 知見が含まれる）。
5. 用語・AC 番号・Phase 番号・採用結論の表記揺れチェックリストを作成し navigation drift 0 を確認する（完了条件: 不一致 0）。
6. outputs/phase-08/main.md に上記すべてを統合記述する（完了条件: 4 区分 + 共通項 + drift チェックが 1 ファイルに統合）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-01.md 〜 phase-07.md | DRY 化対象 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | 用語・AC 番号の正本 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/artifacts.json | path 整合の起点 |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本（案 a） |
| 必須 | docs/30-workflows/unassigned-task/task-ut09-direction-reconciliation-001.md | 原典 |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | 03a 正本 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 03b 正本 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 04c 正本 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 09b 正本 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回対象 root |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | endpoint 命名 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Secret 名規約 |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-08.md | DRY 化お手本（コード DRY 文脈との差分参照） |

## 重複候補の棚卸し（reconciliation 文脈）

| # | 重複候補 | 出現箇所（例） | 採用方針 | 処理方針 |
| --- | --- | --- | --- | --- |
| 1 | sync ledger 表記（`sync_jobs` vs `sync_locks` + `sync_job_logs`） | database-schema.md / 旧 UT-09 / ut-21 spec / 09b runbook | 案 a で `sync_jobs` 単一に統一 | `sync_locks` / `sync_job_logs` 系記述を削除対象として 09 番台 spec から撤去（実 migration 撤回は別タスク） |
| 2 | admin sync endpoint 表記（`/admin/sync` 単一 vs `/admin/sync/schema` + `/admin/sync/responses` 2 endpoint） | api-endpoints.md / 04c index / 旧 UT-09 / ut-21 | 案 a で 2 endpoint に統一 | 単一 `/admin/sync` 記述を削除対象。04c index と api-endpoints.md の 2 endpoint 表記を保持 |
| 3 | Service Account secret 名（`GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` vs `GOOGLE_SHEETS_SA_JSON`） | environment-variables.md / deployment-cloudflare.md / index.md Secrets 一覧 | 案 a で Forms 系を正本 | Sheets 系 secret 表記は「廃止候補」明示で残し、正本登録からは外す |
| 4 | sync 実装の責務（Forms API 上流 vs Sheets API 上流） | legacy umbrella / 旧 UT-09 root / 03a / 03b | 案 a で Forms API 上流 | 旧 UT-09 root の direct implementation 化記述を撤回し legacy umbrella 参照に戻す |
| 5 | Cron schedule 前提（Forms 2 経路 vs Sheets 単一経路） | 09b runbook / 旧 UT-09 / ut-21 | 案 a で Forms 2 経路 | Sheets 単一経路前提の schedule 記述を 09b から削除対象とする |
| 6 | trigger 種別（`'cron' / 'manual' / 'backfill'` の語彙統一） | 03a / 03b / 04c / 09b / ut-21 | 案 a 採用方針共通の語彙 | union 型相当の語彙統一は採用方針共通として保持（コード化は別タスク） |
| 7 | sync log 命名（`sync_audit_logs` vs `sync_job_logs`） | database-schema.md / 03-serial / ut-21 | 案 a 採用時は `sync_jobs` row を audit 源とし、`sync_audit_logs` は別文脈（ut-21 / 03-serial）として保持 | 文脈分離を明示し、reconciliation で混同しないことを明記 |
| 8 | staging smoke 表記（pending を PASS と誤記する痕跡） | 旧 UT-09 / ut-21 spec | 全採用方針共通 | pending / PASS / FAIL 区別を Phase 3 運用ルールで固定済。文中の誤記は削除対象 |

## 削除対象 / 保持対象（5 軸 1:1 対応）

| 軸 | 削除対象（撤回するべき記述） | 保持対象（base case 整合） | 理由 |
| --- | --- | --- | --- |
| 仕様 | 旧 UT-09 root の direct implementation 化記述・ut-21 を Sheets 採用前提とする記述 | legacy umbrella spec（current 方針）の Forms 分割記述 | 案 a 採用で current facts 整合を最優先 |
| endpoint 表記 | 単一 `POST /admin/sync` の正本登録 | `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 endpoint | 04c との整合維持 |
| ledger 表記 | `sync_locks` + `sync_job_logs` の正本登録 | `sync_jobs` 単一 ledger | database-schema.md 現行登録維持 |
| Secret 表記 | `GOOGLE_SHEETS_SA_JSON` / `SHEETS_SPREADSHEET_ID` の正本扱い | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` 系 + admin 共通 secret | environment-variables.md / deployment-cloudflare.md 現行登録維持 |
| Cron schedule | Sheets 単一経路前提の `0 * * * *` 表記 | 09b runbook の Forms 2 経路前提 schedule | 09b との整合維持 |

> 「削除対象」は **本タスクで仕様書から削除する** 範囲ではなく、reconciliation 結論として **撤回する正本記述の対象** を意味する。実削除 PR は別タスク化（Phase 3 open question #1 / #4）。

## 共通項（採用方針に依らず保持する knowledge）

reconciliation 結論 = 案 a でも、旧 UT-09 / ut-21 系で蓄積された以下の knowledge は **品質要件として 03a / 03b / 09b に移植** する。Phase 2 の移植対象 5 知見と完全一致。

| # | 共通 knowledge | 移植先 | 保持理由 |
| --- | --- | --- | --- |
| 1 | WAL 非前提設計（D1 のロック特性に依存しない） | 03a / 03b 設計 AC | 採用方針が変わっても D1 仕様は同一 |
| 2 | retry / exponential backoff（最大試行回数の規定） | 03a / 03b / 09b runbook | 上流 API quota / transient error に対応 |
| 3 | short transaction（1 transaction 当たりの処理量制限） | 03a / 03b 実装 AC | D1 contention 回避の基本原則 |
| 4 | batch-size 制限（1 sync 当たりの処理件数上限） | 03a / 03b / 09b | quota 保護と冪等性の両立 |
| 5 | scheduled / manual 二重起動防止（lock or idempotency） | 09b runbook | trigger 経路に依らず必須 |
| 6 | trigger 種別語彙統一（`'cron' / 'manual' / 'backfill'`） | 03a / 03b / 04c / 09b | union 型相当の語彙安定化 |
| 7 | staging smoke 表記の pending / PASS / FAIL 区別 | 全 Phase の運用ルール | 採用方針に依らず Phase 12 compliance 前提 |
| 8 | unrelated 削除を本 PR に混ぜない運用ルール | 全 reconciliation 系タスク | governance 不変 |

## navigation drift / 表記揺れチェック

| 項目 | 確認方法 | 想定結果 |
| --- | --- | --- |
| AC 番号 | index.md と phase-01.md の AC-1〜AC-14 の文言一致 | 完全一致 |
| Phase 番号 / 名称 | index.md の Phase 一覧 と phase-XX.md のメタ情報 | 完全一致 |
| 採用結論表記（案 a / 採用 A / Forms 分割方針） | 全 Phase で 3 表現が混在しないか | 「案 a (採用 A / Forms 分割方針)」で初出固定、以後は文脈で略 |
| 5 文書同期対象の列挙順 | legacy umbrella / 03a / 03b / 04c / 09b の順序が Phase 2 / 9 / 10 で一致 | 一致 |
| Secret 名（op 参照含む） | `op://Employee/ubm-hyogo-env/<FIELD>` 形式統一 | 統一 |
| artifacts.json `phases[*].outputs` × 実 path | grep `outputs/phase-` | 完全一致 |
| index.md `Phase 一覧` の file 列と実ファイル | ls 照合 | 完全一致 |
| phase-XX.md 内 `../phase-YY.md` 相対参照 | 全リンク辿り | リンク切れ 0 |
| 原典 unassigned-task 参照 | `../unassigned-task/task-ut09-direction-reconciliation-001.md` | 実在 |
| current 方針正本参照 | `../unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 実在 |
| Skill reference 参照 | `.claude/skills/aiworkflow-requirements/references/{api-endpoints,database-schema,deployment-secrets-management}.md` | 実在 |

## 共通化パターン

- 命名: snake_case（DB） / camelCase（TS 変数） / PascalCase（型） / kebab-case（ファイル）。
- 4 条件は「価値性 / 実現性 / 整合性 / 運用性」順序固定。
- 採用結論は **案 a (採用 A / Forms 分割方針へ寄せる)** で表記統一。略記時も同一順序。
- AC ID は `AC-1`〜`AC-14` のハイフン区切りで全 Phase 統一。
- 1Password 参照は `op://Employee/ubm-hyogo-env/<FIELD>` 形式に統一。
- staging smoke 表記は `pending` / `PASS` / `FAIL` の 3 値で区別。
- 5 文書同期対象は legacy umbrella / 03a / 03b / 04c / 09b の順序固定。

## 実行手順

### ステップ 1: 重複候補の grep 抽出

- `rg 'sync_jobs|sync_locks|sync_job_logs' docs/30-workflows/` で ledger 二重表記を抽出。
- `rg 'POST /admin/sync($|/)' docs/30-workflows/` で endpoint 二重表記を抽出。
- `rg 'GOOGLE_(SHEETS|FORMS)_SA_JSON' docs/30-workflows/ .claude/skills/aiworkflow-requirements/references/` で Secret 二重表記を抽出。
- 重複候補表（8 件以上）を Phase 8 main.md に固定。

### ステップ 2: 削除対象 / 保持対象の 5 軸マッピング

- 仕様 / endpoint / ledger / Secret / Cron schedule の 5 軸で 1:1 対応表を作成。
- 削除対象は「reconciliation 結論として撤回する正本記述」と明示し、実削除 PR は別タスクであることを併記。

### ステップ 3: 共通項抽出

- D1 contention mitigation 5 知見 + trigger 語彙 + 運用ルール 2 件 の計 8 共通項を保持対象として固定。
- 移植先 Phase / Wave を併記。

### ステップ 4: navigation drift / 表記揺れ確認

- AC 番号・Phase 番号・採用結論表記・5 文書同期対象・Secret 名 を全 Phase で統一確認。
- artifacts.json と phase-XX.md の outputs path を完全一致確認。

### ステップ 5: outputs/phase-08/main.md に統合

- 重複棚卸し表 + 削除 / 保持マッピング + 共通項 + drift チェック の 4 ブロックを単一ファイルに集約。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化済み正本表記を 5 点同期チェックの前提に使用 |
| Phase 10 | navigation drift 0 を GO/NO-GO 根拠 |
| Phase 12 | system-spec-update-summary.md / documentation-changelog.md に重複解消結果を反映（別タスクへの引き継ぎ含む） |
| 別タスク（実コード撤回） | 削除対象 5 軸を実 migration / route 撤回 PR の入力に渡す |
| 別タスク（品質要件移植） | 共通項 8 件を 03a / 03b / 09b への移植 PR の入力に渡す |

## 多角的チェック観点

- 価値性: 仕様書の重複解消により 03a / 03b / 04c / 09b の判断面が安定化するか。
- 実現性: docs-only 範囲で grep + 表化のみで完結するか。
- 整合性: 不変条件 #1（schema を mapper に閉じる）/ #4（admin-managed data 分離）/ #5（D1 access は apps/api 内）/ #6（GAS prototype 延長禁止）が削除 / 保持マッピングで維持されているか。
- 運用性: 削除対象が「reconciliation 結論としての撤回」であり実 PR は別タスクである旨が明記されているか。
- 認可境界: `/admin/sync*` の 2 endpoint 表記が保持対象として確定しているか。
- ledger 一意性: `sync_jobs` 単一が保持、`sync_locks` + `sync_job_logs` が削除対象として固定されているか。
- Secret hygiene: Forms 系正本 / Sheets 系廃止候補の区別が表記に反映されているか。
- staging smoke 表記: pending / PASS / FAIL の 3 値区別が共通項として保持されているか。
- unrelated 削除混入: 本 PR に unrelated verification-report 削除を混ぜない方針が共通項に含まれているか。
- docs-only 境界: コード DRY ではなく仕様書 DRY であることが Phase 8 全体で一貫しているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 重複候補棚卸し（8 件以上） | 8 | spec_created | grep ベース |
| 2 | 削除対象 / 保持対象 5 軸マッピング | 8 | spec_created | 1:1 対応 |
| 3 | 共通項抽出（8 件） | 8 | spec_created | D1 contention 5 知見含む |
| 4 | navigation drift / 表記揺れ確認 | 8 | spec_created | drift 0 |
| 5 | 実コード撤回が別タスクである旨の明記 | 8 | spec_created | docs-only 境界維持 |
| 6 | outputs/phase-08/main.md 作成 | 8 | spec_created | 4 ブロック統合 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | 重複候補棚卸し / 削除 - 保持マッピング / 共通項 / navigation drift チェック |
| メタ | artifacts.json | Phase 8 状態の更新 |

## 完了条件

- [ ] 重複候補が 5 件以上（8 件想定）棚卸しされている
- [ ] 削除対象 / 保持対象が 5 軸（仕様 / endpoint / ledger / Secret / Cron schedule）で 1:1 対応している
- [ ] 共通項が 5 件以上抽出されている（D1 contention mitigation 5 知見を含む）
- [ ] navigation drift が 0
- [ ] 採用結論表記が「案 a (採用 A / Forms 分割方針へ寄せる)」で統一
- [ ] 実コード撤回 / migration 撤回が別タスクである旨が明記
- [ ] outputs/phase-08/main.md が作成済み

## タスク100%実行確認【必須】

- 全実行タスク（6 件）が `spec_created`
- 成果物 `outputs/phase-08/main.md` が配置予定
- 重複候補 8 件以上、削除 / 保持 5 軸、共通項 8 件
- navigation drift 0
- artifacts.json の `phases[7].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 9 (品質保証 / 5 点同期チェック)
- 引き継ぎ事項:
  - DRY 化済み正本表記（採用 base case = 案 a 整合）を 5 点同期チェックの前提として渡す
  - 共通項 8 件を Phase 9 の品質要件移植トレース対象に渡す
  - navigation drift 0 状態を Phase 9 link 検証で再確認
  - docs-only 境界（実コード撤回は別タスク）を Phase 9 以降の制約として固定
- ブロック条件:
  - 重複候補が 5 件未満
  - 削除 / 保持マッピングに 5 軸未満
  - 共通項に D1 contention mitigation 5 知見が欠落
  - navigation drift が残る
  - 実コード撤回を本タスクに含める方針が混入

# Phase 7: AC マトリクス（トレーサビリティ表）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス / トレーサビリティ |
| 作成日 | 2026-04-29 |
| 前 Phase | 6 (異常系検証) |
| 次 Phase | 8 (DRY 化) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #94 は CLOSED でも仕様書 blocked） |
| タスク分類 | docs-only / direction-reconciliation（traceability） |

## 目的

index.md で定義された **AC-1〜AC-14** に対し、Phase 1〜Phase 6 の成果物 / 検証コマンド / 期待結果 / 担当 outputs / 関連 failure case ID（Phase 6）を **5 軸トレーサビリティ表** として縦串で結び、Phase 8 DRY 化以降に引き継ぐ。本タスクは docs-only / NON_VISUAL であるため、coverage 計測（line/branch %）は対象外とし、代わりに **「scan ヒット数の baseline / after diff」と「文書整合性」** をトレーサビリティの主軸とする。同時に、Phase 4 で確定した `rg` 11 キーワード × Phase 5 runbook 5 セクション × Phase 6 failure case 17 件を AC ごとに正しく射影できているかを最終確認する。

## 実行タスク

1. AC × 5 列（AC 内容 / 検証 Phase / 検証コマンド or 観点 / 期待結果 / 担当 outputs）+ 関連 failure case 列の 6 列 × 14 行マトリクスを完成する（完了条件: 空セルなし）。
2. AC ごとに「base case = 採用 A 時の期待結果」と「採用 B 時の期待結果」が分岐する場合は両方記述する（完了条件: AC-1 / AC-3 / AC-4 / AC-5 / AC-10 のような採用方針依存 AC で両期待結果が記述）。
3. AC-12（4条件最終 PASS）は Phase 1 / Phase 3 / Phase 10 / 本 Phase の累積判定として扱う（完了条件: 累積判定の根拠が明示）。
4. AC-9（unassigned-task-detection 登録手順）の受け皿が Phase 12 であることを明示する（完了条件: Phase 12 outputs `unassigned-task-detection.md` への引き継ぎ記述）。
5. coverage 計測の代替指標（scan ヒット数 baseline / after diff）の取得方針を確定する（完了条件: Phase 9 で実測する scan 種別 × 件数の allowlist）。
6. 広域指定（コード coverage 全域計測）禁止ルールの代わりに、**スキャン対象の絞り込み禁止**ルールを文書化する（完了条件: 5 文書 + references 3 件のスキャン allowlist が広域でも狭域でもないことの正当性記述）。
7. Phase 8 / Phase 9 / Phase 10 への引き継ぎ項目を予約する（完了条件: 各 Phase の入力が箇条書き明示）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | AC-1〜AC-14 原典 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-01.md | 真の論点 / 4条件 / Ownership 宣言 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | 撤回 / 移植 / same-wave 差分マッピング |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 案 a / 30 種思考法 / 運用ルール / open question 6 件 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-04.md | 4 種スキャン / 11 キーワード / scan-checklist.md |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-05.md | reconciliation runbook / 別タスク register |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-06.md | 17 件 failure case |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | endpoint 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | secret 正本 |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-07.md | 同種 Sheets 系 blocked タスクの先行 AC マトリクス |

## AC マトリクス（5 軸トレーサビリティ + failure case 列）

> AC は index.md と完全一致。`reconciliation` / `legacy umbrella` / `Forms 分割方針` / `5 文書同期` 等の用語は Phase 1〜6 と整合。

| AC# | AC 内容（要約） | 検証 Phase | 検証コマンド or 観点 | 期待結果（採用 A） | 期待結果（採用 B） | 担当 outputs | 関連 failure case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 4条件 + 5 観点比較表が完成 | 2 | `rg '価値性\|実現性\|整合性\|運用性' phase-02.md` で 9 行マトリクスのヒット | 9 行 × 2 列が空セルゼロ | 同左（採用方針別の期待値が両列に並列） | outputs/phase-02/option-comparison.md | #8, #9 |
| AC-2 | 採用方針が 1 つに決定し、3 軸（current 整合 / same-wave コスト / 03a-09b 影響）で文書化 | 1, 3 | `rg 'current 整合\|same-wave\|影響範囲' phase-01.md phase-03.md` | base case = 案 a（採用 A）/ MAJOR ゼロ・MINOR ゼロ | 採用 B 時はユーザー承認 record + MAJOR/MINOR 解消手順 | outputs/phase-01/main.md, outputs/phase-03/main.md | #13, #16 |
| AC-3 | 撤回対象 / 移植対象が差分マッピング表で明示 | 2 | `rg '撤回対象\|移植対象' phase-02.md` で 5 軸 + 5 知見 | 5 軸 + 5 知見の表化 | same-wave 更新対象 5 軸の表化 | outputs/phase-02/reconciliation-design.md | #1, #2, #3, #4, #5, #6, #7 |
| AC-4 | `/admin/sync` 単一 vs 2 endpoint の認可境界比較 / 04c との整合 | 2, 3 | `rg '/admin/sync(/schema\|/responses)?' docs/30-workflows/02-application-implementation/04c*/index.md` で 2 endpoint ヒット | 2 endpoint 維持 | 単一 endpoint への same-wave 更新 | outputs/phase-02/reconciliation-design.md | #8 |
| AC-5 | D1 ledger 統一方針が一意 | 2, 3 | `rg 'sync_jobs\|sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` で 1 種のみ正本 | `sync_jobs` 単一 | `sync_locks` + `sync_job_logs` の 2 ledger | outputs/phase-02/reconciliation-design.md | #2, #9 |
| AC-6 | 5 文書同期チェック手順が定義 / Phase 9 で実施 | 2 | scan-checklist.md「5 文書同期スキャン」5 行 × 2 列 | 5 文書 × 採用 A 期待値が空セルゼロ | 5 文書 × 採用 B 期待値が空セルゼロ | outputs/phase-04/scan-checklist.md, outputs/phase-09/main.md | #8 |
| AC-7 | Phase 12 compliance が PASS / FAIL を実態どおり | 3 | `rg 'pending\|PASS\|FAIL' outputs/phase-12/` で 3 値表記 | staging smoke 表記が pending / PASS / FAIL の 3 値で区別 | 同左 | outputs/phase-03/main.md, outputs/phase-12/phase12-task-spec-compliance-check.md | #12 |
| AC-8 | aiworkflow-requirements 正本に stale contract を登録しない | 3, 4 | `mise exec -- pnpm indexes:rebuild && git status .claude/skills/aiworkflow-requirements/indexes/` で diff ゼロ | drift ゼロ / `sync_locks` の正本登録ゼロ | drift ゼロ / `sync_jobs` の正本登録ゼロ（B 採用時の正本変更） | outputs/phase-04/test-strategy.md, outputs/phase-09/main.md | #2, #3, #10, #15 |
| AC-9 | unassigned-task-detection への登録手順 | 5, 12 | Phase 5 別タスク register 表（6 件）と Phase 12 unassigned-task-detection.md の整合 | 4 件（withdrawal / d1-contention-port / root-restore / cleanup-verification）が登録 | 4 件は採用 A 撤回系のため不要、代わりに same-wave 更新タスクを登録 | outputs/phase-05/reconciliation-runbook.md, outputs/phase-12/unassigned-task-detection.md | #17 |
| AC-10 | 採用 B 時の正本仕様広範囲更新リスト + ユーザー承認前提が明記 | 2, 3 | `rg 'same-wave\|ユーザー承認' phase-02.md phase-03.md` | 採用 A 時は適用外（記述存続のみ） | 5 ステップ（B1〜B5）+ 承認 record の取得 | outputs/phase-02/reconciliation-design.md, outputs/phase-03/main.md, outputs/phase-05/reconciliation-runbook.md | #13 |
| AC-11 | 30 種思考法レビューで PASS/MINOR/MAJOR 判定が代替案ごと | 3, 10 | `rg '思考法\|First Principles\|Inversion\|Pre-mortem' phase-03.md phase-10.md` | Phase 3 代表 8 種 + Phase 10 補完 22 種 = 全 30 種 PASS | 同左（B 採用時は再評価が必要） | outputs/phase-03/main.md, outputs/phase-10/go-no-go.md | （全件） |
| AC-12 | 4条件最終判定が PASS、根拠が記述 | 1, 3, 10 | Phase 1 / Phase 3 / Phase 10 の 4条件評価表の累積 | 全 PASS（Phase 1 / 3 で確定 → Phase 10 で再評価） | 採用 B 時は MAJOR 1 / MINOR 4 が解消されたかの再評価 | outputs/phase-01/main.md, outputs/phase-03/main.md, outputs/phase-10/go-no-go.md | （全件） |
| AC-13 | staging smoke pending を PASS と誤記しない運用ルール | 3 | `rg 'pending\b' phase-03.md outputs/phase-03/main.md` で運用ルール記述 | 3 値表記の運用ルール存続 | 同左 | outputs/phase-03/main.md | #12 |
| AC-14 | unrelated verification-report 削除を本 PR に混ぜない | 3, 6, 13 | `git diff --name-status main...HEAD \| rg '^D.*verification-report'` でヒットゼロ | 削除混入ゼロ / 別タスク化（cleanup-verification-reports） | 同左 | outputs/phase-03/main.md, outputs/phase-06/failure-cases.md, outputs/phase-13/local-check-result.md | #11 |

> 14 行 × 6 列 + failure case 列 = 7 列 × 14 行のマトリクス。空セルゼロを Phase 7 完了条件とする。

## AC ごとの採用方針別期待値分岐

採用 A / B で期待値が分岐する AC（5 件）を以下にまとめる:

| AC# | 採用 A 期待値 | 採用 B 期待値 | 切替時の影響 |
| --- | --- | --- | --- |
| AC-3 | 撤回 5 軸 + 移植 5 知見 | same-wave 5 軸 | Phase 5 runbook の採用 A / B section 切替 |
| AC-4 | 2 endpoint 維持 | 単一 endpoint へ更新 | 04c index.md / api-endpoints.md 更新 |
| AC-5 | `sync_jobs` 単一 | `sync_locks` + `sync_job_logs` | database-schema.md 更新 |
| AC-6 | 5 文書 採用 A 期待値 | 5 文書 採用 B 期待値 | scan-checklist.md の期待結果列切替 |
| AC-10 | 適用外（記述存続のみ） | B1〜B5 5 ステップ実行 | Phase 5 採用 B section の活性化 |

## AC-12 累積判定（4条件最終 PASS）

```
Phase 1 4条件評価   → 全 PASS（base case 仮確定）
   ↓
Phase 3 13 観点評価  → 全 PASS（base case 確定）
   ↓
Phase 7 トレース表  → 14 AC × 5 軸が空セルゼロ
   ↓
Phase 10 go-no-go    → 4条件 + GO 条件 8 件すべて満足
   ↓
AC-12 PASS 確定（採用 A の場合）
```

採用 B 時は Phase 10 で MAJOR 1（current facts）/ MINOR 4 が解消されたかを再評価し、解消なき場合は AC-12 NO-GO とする（Phase 3 NO-GO 条件と同期）。

## coverage 代替指標（scan ヒット数 baseline / after diff）

docs-only タスクのため line/branch coverage は計測しない。代わりに **scan ヒット数の baseline / after diff** を Phase 9 で実測する:

| scan 種別 | baseline 取得対象 | after 取得対象 | 期待差分（採用 A） |
| --- | --- | --- | --- |
| 5 文書同期スキャン | 5 文書 × 11 キーワード | 同上 | 採用 A 用キーワードのヒット数横ばい or 増加（移植記述追加分） |
| 撤回対象スキャン | コード遺物 / migration / Secret 系キーワード | 同上 | 「正本」コンテキストのヒットゼロ化（「廃止候補」コンテキストのみ残存） |
| 移植対象スキャン | WAL / retry / batch / 二重起動 | 同上 | ヒット数増加（03a / 03b / 09b への移植反映） |
| aiworkflow-requirements indexes | indexes/ ディレクトリ | 同上 | drift ゼロ（`pnpm indexes:rebuild` 後 git status で出力なし） |

### スキャン allowlist（広域でも狭域でもない正当性）

```
対象（合計 8 文書）:
  - 5 文書: legacy umbrella / 03a / 03b / 04c / 09b
  - references 3 件: api-endpoints.md / database-schema.md / environment-variables.md / deployment-cloudflare.md

禁止対象:
  - `docs/**` 全域（広域指定。本 reconciliation 範囲外の文書を巻き込む）
  - `apps/api/src/**` のコードファイル（docs-only タスクのためコード変更ゼロを別途確認）
  - `outputs/**` の自身（自己ループ防止）
```

> 本 allowlist は「reconciliation 対象 5 文書 + reconciliation で正本登録される 3 references」という合理的範囲。狭すぎず広すぎない。

## coverage 実測の代替: scan 実測の証跡記録

```bash
# Phase 9 で実施
mkdir -p docs/30-workflows/ut09-direction-reconciliation/outputs/phase-09/{baseline,after}

# baseline / after の各 scan 結果を保存（Phase 5 Step 0 / Step 5 と同期）
# Phase 9 main.md に baseline/after の diff 結果と scan ヒット数の比較表を保存

# 期待される証跡ファイル:
# - outputs/phase-09/baseline/admin-sync.txt
# - outputs/phase-09/baseline/ledger.txt
# - outputs/phase-09/baseline/secrets.txt
# - outputs/phase-09/after/admin-sync.txt
# - outputs/phase-09/after/ledger.txt
# - outputs/phase-09/after/secrets.txt
# - outputs/phase-09/main.md（diff サマリ + AC マトリクス更新）
```

## 実行手順

### ステップ 1: AC マトリクス本体作成

- 14 行 × 7 列（AC# / AC 内容 / 検証 Phase / 検証コマンド / 期待結果 A / 期待結果 B / 担当 outputs / 関連 failure case）を `outputs/phase-07/ac-matrix.md` に転記する。
- 空セルゼロを確認する。

### ステップ 2: 採用方針別期待値分岐の整理

- AC-3 / AC-4 / AC-5 / AC-6 / AC-10 の 5 件を採用 A / B の 2 列で記述する。
- 切替時の影響（どの Phase / どの文書を更新するか）を併記する。

### ステップ 3: AC-12 累積判定の確定

- Phase 1 / Phase 3 / Phase 7 / Phase 10 の 4 段累積で AC-12 PASS が成立する論理を明文化する。

### ステップ 4: scan 代替指標の確定

- 4 種類スキャン × baseline / after × 期待差分の 3 軸表を確定する。
- スキャン allowlist 8 文書（5 文書 + references 3 件）の正当性を記述する。

### ステップ 5: 広域指定 / 狭域指定の禁止ルール

- スキャン対象が `docs/**` 全域または `apps/**` 全域に広がっていないことを保証する。
- 同時に、5 文書のうち 1 件でも欠落していないことを保証する。

### ステップ 6: Phase 8 / 9 / 10 への引き継ぎ予約

- 引き継ぎ項目を箇条書きで明示する。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 8 | 撤回 / 移植 / 同期スキャンの bash 1-liner 集約（DRY 化）の入力に AC マトリクスの「検証コマンド」列を提供 |
| Phase 9 | scan baseline / after 実測 → AC マトリクスの「期待結果」列との照合 |
| Phase 10 | AC-12 累積判定の最終評価（GO/NO-GO 根拠） |
| Phase 11 | 採用 A 時 / 採用 B 時の期待値分岐（AC-3 / 4 / 5 / 6 / 10）を手動 dry-run で検証 |
| Phase 12 | AC-9 の受け皿として unassigned-task-detection.md に 4 件登録 |
| Phase 13 | AC-14（unrelated 削除混入ゼロ）の最終 local check |

## 多角的チェック観点

- 価値性: 14 件 AC が抜け漏れなく検証 → 担当 outputs → failure case → Phase にトレースされているか。
- 実現性: scan 代替指標が Phase 9 で実測可能なコマンドで構成されているか。
- 整合性（不変条件 #1）: AC-3 移植対象に schema mapper 閉じ込め方針が含まれるか。
- 整合性（不変条件 #4）: AC-5 ledger 一意性 ・ AC-8 references drift が admin-managed data 専用テーブル分離を維持するか。
- 整合性（不変条件 #5）: AC マトリクスが `apps/api` 内 D1 access の閉じ込めに違反する記述を含んでいないか。
- 整合性（不変条件 #6）: AC-2 採用方針決定が GAS prototype 延長扱いを排除しているか。
- 運用性: scan 実測コマンドが `mise exec` / `bash scripts/cf.sh` / `pnpm indexes:rebuild` のいずれかで再現可能か。
- 認可境界: AC-4 が `/admin/sync*` の 04c 整合に対応しているか。
- D1 ledger 一意性: AC-5 が `sync_jobs` / `sync_locks` の二重正本化禁止を保証しているか。
- Secret hygiene: AC-8 が `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` 正本登録 + `GOOGLE_SHEETS_SA_JSON` 廃止候補化を保証しているか。
- 5 文書同期: AC-6 が 5 文書すべてに展開されているか。
- docs-only 境界: AC マトリクスがコード変更 / migration を「期待結果」列に記述していないか。
- 採用 B 承認: AC-10 が承認 record 取得を必須前提としているか。
- failure case 全件参照: AC マトリクスの「関連 failure case」列が Phase 6 の 17 件のうち少なくとも 12 件をカバーしているか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC マトリクス 14 行 × 7 列 | 7 | spec_created | 空セルゼロ |
| 2 | 採用方針別期待値分岐 5 件 | 7 | spec_created | AC-3/4/5/6/10 |
| 3 | AC-12 累積判定の論理確定 | 7 | spec_created | 4 段累積 |
| 4 | scan 代替指標 4 種 | 7 | spec_created | baseline / after |
| 5 | スキャン allowlist 8 文書 | 7 | spec_created | 広域 / 狭域禁止 |
| 6 | Phase 8/9/10 引き継ぎ予約 | 7 | spec_created | 6 行以上 |
| 7 | failure case 列の 12 件以上カバー確認 | 7 | spec_created | Phase 6 17 件中 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC × 検証 Phase × 検証コマンド × 期待結果（A/B）× 担当 outputs × failure case の 7 列トレース表 + scan allowlist |
| メタ | artifacts.json | Phase 7 状態の更新 |

## 完了条件

- [ ] AC マトリクス 14 行 × 7 列に空セル無し
- [ ] 採用方針別期待値分岐（AC-3 / 4 / 5 / 6 / 10）が 2 列で並列記述
- [ ] AC-12 累積判定の 4 段論理（Phase 1 → 3 → 7 → 10）が明文化
- [ ] scan 代替指標 4 種が baseline / after / 期待差分の 3 軸で記述
- [ ] スキャン allowlist 8 文書（5 文書 + references 3 件）が広域 / 狭域でないことの正当性記述
- [ ] 広域指定（`docs/**` 全域）と狭域指定（5 文書未満）の禁止が明記
- [ ] 関連 failure case 列が Phase 6 の 17 件のうち少なくとも 12 件をカバー
- [ ] Phase 8 / 9 / 10 への引き継ぎ項目が箇条書き

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 成果物が `outputs/phase-07/ac-matrix.md` に配置済み
- AC-1〜AC-14 の 14 行が全て埋まる
- 関連 failure case 列が Phase 6 の case# を 1 つ以上参照（AC-11 / AC-12 は「全件」可）
- scan allowlist と Phase 4 / Phase 5 の対象文書一覧が一致
- artifacts.json の `phases[6].status` が `spec_created`

## 次 Phase への引き渡し

- 次 Phase: 8 (DRY 化)
- 引き継ぎ事項:
  - AC マトリクス → Phase 10 go-no-go の根拠として再利用
  - scan 代替指標 → Phase 9 で実測値取得
  - スキャン allowlist 8 文書 → Phase 8 / Phase 9 で逸脱を防ぐ
  - AC-3 (撤回 / 移植マッピング) / AC-6 (5 文書同期) / AC-8 (indexes drift) を Phase 8 DRY 抽出の優先候補に指定
  - 採用方針別期待値分岐 5 件 → Phase 11 手動 dry-run 対象
  - failure case wire-in（17 件中 12 件以上）→ Phase 9 / Phase 10 で参照
- ブロック条件:
  - AC マトリクス空セル残存
  - スキャン allowlist が広域指定（`docs/**`）に変質
  - 5 文書のうち 1 件でも欠落
  - 採用方針別期待値分岐が AC-3/4/5/6/10 の 5 件未満
  - AC-12 累積判定の論理が Phase 10 まで到達していない

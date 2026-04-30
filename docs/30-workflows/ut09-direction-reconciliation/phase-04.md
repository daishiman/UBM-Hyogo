# Phase 4: テスト戦略（doc / spec consistency 検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-09 direction reconciliation（task-ut09-direction-reconciliation-001） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略（docs-only 文書整合性検証） |
| 作成日 | 2026-04-29 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (reconciliation 実行ランブック) |
| 状態 | spec_created |
| タスク状態 | blocked（GitHub Issue #94 は CLOSED でも仕様書 blocked） |
| タスク分類 | docs-only / direction-reconciliation（test-strategy → doc consistency 検証） |

## 目的

本タスクは **docs-only / NON_VISUAL** であり、コード実装を伴わない方針決定タスクである。したがって従来の Vitest unit / integration テストではなく、**「正本仕様文書（5 文書）と aiworkflow-requirements references / コード遺物の整合性」**を検証対象とする。Phase 3 で確定した base case（採用 A: Forms 分割方針）を前提に、撤回対象（Sheets 系遺物）が「正本扱い」されていないこと、移植対象（D1 contention mitigation 知見）が 03a / 03b / 09b に保存されていることを `rg`（ripgrep）スキャン + 手動 review で検出する戦略を定義する。Phase 5 の reconciliation runbook 実行前後で「同じスキャンを 2 回回し、差分を比較する」運用を `outputs/phase-04/` 成果物として固定する。

## 実行タスク

1. doc/spec consistency 検証戦略を 4 種類（5 文書同期 / 撤回対象スキャン / 移植対象スキャン / aiworkflow-requirements drift）に分類する（完了条件: スキャン種別 × 検証観点のマトリクスに空セルが無い）。
2. `rg` キーワードスキャン手順を確定する（完了条件: キーワード × 期待ヒット文書 × 期待結果（採用 A 時）の 3 軸で記述）。
3. aiworkflow-requirements indexes drift 検証手順を定義する（完了条件: `pnpm indexes:rebuild` 実行差分 + CI gate `verify-indexes-up-to-date` の確認手順を記述）。
4. 撤回対象 / 移植対象の検証マトリクスを作成する（完了条件: Phase 2 の差分マッピング表 5 軸 × 5 知見の各項目に対し検証コマンドが指定）。
5. AC マッピングを記述する（完了条件: AC-1〜AC-14 のうち本 Phase で起点・経由するものに 1 行以上の検証手順）。
6. 検証スクリプトを 1 ファイルにまとめずに、**docs-only タスクの軽量さ**を保つため bash 1-liner を表内に直書きする運用ルールを記述する（完了条件: シェルスクリプト追加禁止が明記）。
7. 成果物 2 ファイル（`test-strategy.md` / `scan-checklist.md`）を分離して作成する（完了条件: 戦略と実行チェックリストを別ファイルにする）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/index.md | AC-1〜AC-14 の正本 |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-02.md | 撤回 / 移植 / same-wave 更新 差分マッピング |
| 必須 | docs/30-workflows/ut09-direction-reconciliation/phase-03.md | base case = 採用 A、open question 6 件 |
| 必須 | docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md | current 方針正本（5 文書同期チェック対象 #1） |
| 必須 | docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md | 5 文書 #2 |
| 必須 | docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md | 5 文書 #3 |
| 必須 | docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md | 5 文書 #4 |
| 必須 | docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md | 5 文書 #5 |
| 必須 | docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md | 撤回 or 採用の対象 root |
| 必須 | .claude/skills/aiworkflow-requirements/references/api-endpoints.md | `/admin/sync*` 命名・認可境界 |
| 必須 | .claude/skills/aiworkflow-requirements/references/database-schema.md | ledger 正本 |
| 必須 | .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md | Service Account secret 名 |
| 必須 | CLAUDE.md | `pnpm indexes:rebuild` / verify-indexes CI gate |
| 参考 | docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/phase-04.md | 同種 Sheets 系 blocked タスクの先行事例 |

## 検証スイート設計（4 種類 × docs-only 翻訳）

### 1. 5 文書同期スキャン（base case 採用 A 維持確認）

| 文書 | スキャン観点 | 期待結果（採用 A 時） |
| --- | --- | --- |
| `task-sync-forms-d1-legacy-umbrella-001.md` | 「旧 UT-09 を direct implementation にしない」方針記述の存続 | ヒット 1 件以上、削除なし |
| `03a/index.md` | Forms schema sync 責務境界 / `forms.get` 上流 | Sheets API 言及なし |
| `03b/index.md` | Forms response sync / `forms.responses.list` 上流 | Sheets API 言及なし |
| `04c/index.md` | `/admin/sync/schema` + `/admin/sync/responses` の 2 endpoint 記述 | 単一 `/admin/sync` を正本としない |
| `09b/index.md` | scheduled handler が 2 経路（schema + responses）を呼ぶ runbook | 単一 sync 経路言及なし |

### 2. 撤回対象スキャン（Sheets 遺物が「正本」扱いされていないことの確認）

| 撤回対象 | スキャン場所 | 期待結果（採用 A 時 / reconciliation 後） |
| --- | --- | --- |
| `apps/api/src/jobs/sync-sheets-to-d1.ts` | `apps/api/src/jobs/`, `docs/`, references | 仕様書側で「正本」として参照される箇所ゼロ。コード自体の撤回は別タスクで実施 |
| `apps/api/src/routes/admin/sync.ts`（単一 endpoint） | `apps/api/src/routes/admin/`, `04c/index.md`, `api-endpoints.md` | 04c 正本に「単一 `/admin/sync` を採用」の記述ゼロ |
| `sync_locks` テーブル | `database-schema.md`, `apps/api/migrations/` | 正本側 `database-schema.md` で `sync_locks` を「採用 A 時の正本」と記述しない |
| `sync_job_logs` テーブル | 同上 | 同上 |
| `GOOGLE_SHEETS_SA_JSON` | `environment-variables.md / deployment-cloudflare.md`, `wrangler.toml`, `.env` 参照 | 採用 A 時は「廃止候補」として扱う記述（reconciliation 後は完全廃止予定） |
| 旧 UT-09 root の direct implementation 化記述 | `ut-09-sheets-to-d1-cron-sync-job/index.md` | legacy umbrella 参照に戻す方針が記述 |

### 3. 移植対象スキャン（D1 contention mitigation 知見の保存確認）

| 知見 | 移植先文書 | 期待結果 |
| --- | --- | --- |
| WAL 非前提 | `03a/index.md`, `03b/index.md` | 「D1 のロック特性に依存しない設計」を AC として記述 |
| retry/backoff | `03a/index.md`, `03b/index.md`, `09b/index.md` | exponential backoff / 最大試行回数の記述 |
| short transaction | `03a/index.md`, `03b/index.md` | 1 transaction の処理量制限 AC |
| batch-size 制限 | `03a/index.md`, `03b/index.md`, `09b/index.md` | 1 sync あたり処理件数上限の記述 |
| 二重起動防止 | `09b/index.md` | scheduled / manual 同時起動時の lock or idempotency strategy |

### 4. aiworkflow-requirements indexes drift 検証

| 観点 | 検証コマンド | 期待結果 |
| --- | --- | --- |
| `pnpm indexes:rebuild` 実行後の差分 | `mise exec -- pnpm indexes:rebuild && git status` | reconciliation 完了時点で `.claude/skills/aiworkflow-requirements/indexes/` に未コミット差分ゼロ |
| CI gate `verify-indexes-up-to-date` | `.github/workflows/verify-indexes.yml` を local check で確認 | job が成功する状態で PR 化（本タスクは PR 化を含まないが、後続別タスクへの引継条件） |
| `api-endpoints.md` 正本一致 | `rg '/admin/sync' .claude/skills/aiworkflow-requirements/references/api-endpoints.md` | 採用 A 時: `/admin/sync/schema` + `/admin/sync/responses` のみが正本登録 |
| `database-schema.md` 正本一致 | `rg 'sync_jobs\|sync_locks\|sync_job_logs' .claude/skills/aiworkflow-requirements/references/database-schema.md` | 採用 A 時: `sync_jobs` のみが正本登録、`sync_locks` / `sync_job_logs` は登録されていないか「廃止候補」として記述 |
| `environment-variables.md / deployment-cloudflare.md` 正本一致 | `rg 'GOOGLE_SHEETS_SA_JSON|GOOGLE_FORM_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|GOOGLE_PRIVATE_KEY' .claude/skills/aiworkflow-requirements/references/environment-variables.md / .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 採用 A 時: `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` を正本、Sheets 系は記述されないか「廃止候補」 |

## `rg` キーワードスキャン手順

### スキャン対象キーワード × 期待ヒット文書

| キーワード | 期待ヒット文書（採用 A 時） | 期待結果 | 危険信号（採用 A 違反） |
| --- | --- | --- | --- |
| `/admin/sync/schema` | `04c/index.md`, `09b/index.md`, `api-endpoints.md`, legacy umbrella spec | 4 文書以上にヒット | 0 件ヒット = 採用 A 不整合 |
| `/admin/sync/responses` | 同上 | 4 文書以上にヒット | 0 件ヒット = 採用 A 不整合 |
| `^POST /admin/sync$`（単一 endpoint） | `ut-09-sheets-to-d1-cron-sync-job/index.md`（撤回前提）以外にヒットしない | 検出ゼロ（例外: 撤回対象記述としての言及） | 04c / 09b / api-endpoints.md にヒット = 採用 A 違反 |
| `sync_locks` | `database-schema.md`（廃止候補記述のみ） | 「正本テーブル」としての登録なし | 正本登録あり = 二重 ledger 化の兆候 |
| `sync_job_logs` | 同上 | 同上 | 同上 |
| `sync_jobs` | `database-schema.md`, `04c/index.md`, `09b/index.md`, legacy umbrella spec | 4 文書以上にヒット | 0 件ヒット = 採用 A 不整合 |
| `GOOGLE_SHEETS_SA_JSON` | 旧 UT-09 root（撤回対象記述）, ut-21（同様 blocked）, 本タスク | 3 文書以下、いずれも「廃止候補」「採用 B 時のみ」コンテキスト | references / 04c / 09b にヒット = 採用 A 違反 |
| `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` | `environment-variables.md / deployment-cloudflare.md`, legacy umbrella spec, 03a / 03b | 4 文書以上にヒット | 0 件ヒット = 採用 A 不整合（secret 名未確定） |
| `ut-09-sheets-to-d1-cron-sync-job` | legacy umbrella spec（参照記述）, 本タスク, ut-21 | 3 文書、いずれも「legacy umbrella 参照に戻す」コンテキスト | direct implementation 化記述のままなら違反 |
| `Forms 分割方針` / `Forms API 分割` | legacy umbrella spec, 03a, 03b, 04c, 09b, 本タスク | 6 文書以上にヒット | 0 件ヒット = 用語ぶれ |
| `Sheets 採用方針` | 本タスク, ut-21 のみ | 2 文書のみ、いずれも「未承認 / 検討候補」コンテキスト | 04c / 09b で正本扱いなら違反 |

### 実行コマンド例（bash 1-liner）

```bash
# 5 文書 + references を一括スキャン
rg '/admin/sync' docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/ \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/ \
  .claude/skills/aiworkflow-requirements/references/api-endpoints.md

# `sync_locks` の正本登録チェック
rg -n 'sync_locks' .claude/skills/aiworkflow-requirements/references/database-schema.md

# 撤回対象コードファイルの存在確認（撤回は別タスクだが、仕様書側で正本扱いされていないことを確認）
rg -l 'sync-sheets-to-d1' docs/ .claude/

# Forms 分割方針の用語ぶれ検査
rg -c 'Forms\s*(API\s*)?分割方針' docs/30-workflows/
```

> 上記コマンドは Phase 5 の reconciliation runbook 実行前後で 2 回実行し、`outputs/phase-09/` で diff を保存する。

## AC マッピング（本 Phase 起点・経由）

| AC# | 検証手順（本 Phase 内） | 検証コマンド / 観点 |
| --- | --- | --- |
| AC-1 | 4条件 + 5 観点比較表が現存する | `rg '価値性\|実現性\|整合性\|運用性' docs/30-workflows/ut09-direction-reconciliation/phase-02.md` |
| AC-3 | 撤回対象 / 移植対象差分マッピングが文書化 | Phase 2 の表 5 軸 + 5 知見を本 Phase スキャン対象に転写 |
| AC-4 | endpoint 認可境界比較が 04c と矛盾なし | `rg '/admin/sync(/schema\|/responses)?'` 5 文書一括 |
| AC-5 | D1 ledger 統一方針が一意 | `rg 'sync_jobs\|sync_locks' .claude/skills/aiworkflow-requirements/references/database-schema.md` |
| AC-6 | 5 文書同期チェック手順が定義済 | 本 Phase 「5 文書同期スキャン」表 |
| AC-7 | Phase 12 compliance 判定ルール | staging smoke 表記スキャン: `rg 'pending\|PASS\|FAIL' outputs/` |
| AC-8 | aiworkflow-requirements stale contract 不登録ルール | indexes drift 検証手順 |
| AC-10 | 採用 B 時 same-wave 更新リスト存続 | `rg 'same-wave' phase-02.md phase-03.md` |
| AC-13 | staging smoke pending vs PASS 区別ルール | `rg 'pending\b' phase-03.md` で運用ルール記述確認 |
| AC-14 | unrelated verification-report 削除分離方針 | `rg 'unrelated\|verification-report' phase-03.md` |

> AC-2 / AC-9 / AC-11 / AC-12 は Phase 1 / 3 / 10 主担当のため本 Phase は素通り。AC マトリクス全体トレースは Phase 7 で実施。

## 軽量運用ルール（docs-only タスク特有）

- **シェルスクリプト追加禁止**: 本タスクは docs-only。`scripts/` 配下にスキャン用シェルを追加しない。検証コマンドは本仕様書 / `outputs/phase-04/scan-checklist.md` 内の bash 1-liner 直書きで運用する。
- **Vitest / Playwright 追加禁止**: コード実装を伴わないため、`apps/api/test/` / `apps/web/test/` にテストファイルを追加しない。
- **scan 結果の保存先**: Phase 9 で実行した scan 結果（`rg` 出力）は `outputs/phase-09/` に保存する。本 Phase ではコマンド定義までに留める。
- **`bash scripts/cf.sh` 経由**: 本 Phase で wrangler 系コマンドは原則登場しないが、もし D1 schema 確認が必要な場合は CLAUDE.md ルールに従い `bash scripts/cf.sh d1 ...` 経由で実行する。
- **1Password 参照**: secret 値の実体取得は本 Phase で不要。secret 名のみ正本確認する。

## 実行手順

### ステップ 1: Phase 3 base case の取り込み

- 採用 base case = 案 a（採用 A: Forms 分割方針）を確認する。
- open question 6 件を本 Phase で扱わず、Phase 5 / Phase 12 / 別タスクへ素通りさせる。

### ステップ 2: 4 種類スキャンの定義

- 5 文書同期スキャン / 撤回対象スキャン / 移植対象スキャン / aiworkflow-requirements indexes drift の 4 種を `outputs/phase-04/test-strategy.md` に固定する。
- 各種で 5 行以上のチェック対象を埋める。

### ステップ 3: `rg` キーワードリスト確定

- 11 キーワード × 期待結果 × 危険信号の 3 列マトリクスを `outputs/phase-04/scan-checklist.md` に固定する。
- bash 1-liner 例を 4 件以上記述する。

### ステップ 4: AC マッピング

- AC-1 / AC-3〜AC-8 / AC-10 / AC-13 / AC-14 の 10 件を本 Phase 起点・経由として明示する。
- 残 AC は Phase 7 トレース表で吸収する旨を記述する。

### ステップ 5: 軽量運用ルール明文化

- シェル / Vitest / Playwright 追加禁止の docs-only ルールを `outputs/phase-04/test-strategy.md` 末尾に固定する。

### ステップ 6: 成果物 2 ファイル分離

- `outputs/phase-04/test-strategy.md`: 4 種スキャン分類・AC マッピング・軽量運用ルール。
- `outputs/phase-04/scan-checklist.md`: 11 キーワードマトリクス + bash 1-liner 集。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | reconciliation runbook の実行前 / 実行後 sanity check として `rg` スキャンを再利用 |
| Phase 6 | 撤回漏れ / 移植漏れ / unrelated 削除混入 / ledger 二重化 / secret 名不一致 の 5 ケースに対応するスキャン項目を提供 |
| Phase 7 | AC マトリクスの「検証コマンド」列に本 Phase の `rg` 1-liner を流し込み |
| Phase 9 | 5 文書同期チェックの実施。scan 結果を `outputs/phase-09/` に保存 |
| Phase 11 | 手動 smoke として scan 結果を目視 review |

## 多角的チェック観点

- 価値性: スキャン戦略が AC-1〜AC-14 のうち 10 件以上をカバーするか。
- 実現性: docs-only タスクで実行可能なコマンドのみで構成されているか（コード追加なし）。
- 整合性（不変条件 #1）: schema を mapper.ts に閉じる方針のスキャン項目を含むか。
- 整合性（不変条件 #4）: ledger テーブル正本の一意化スキャンを含むか。
- 整合性（不変条件 #5）: D1 access が `apps/api` 内のみのスキャンを含むか（`rg 'D1Database' apps/web/`）。
- 整合性（不変条件 #6）: 旧 UT-09 を direct implementation 化していないかのスキャンを含むか。
- 運用性: bash 1-liner で再実行可能か / シェルスクリプト追加なしで運用可能か。
- docs-only 境界: コード追加・migration 実行・secret 操作を本 Phase に含めていないか。
- 採用 A / B 切替時の差分: 採用 B が選ばれた場合の期待結果も同表で並列定義しているか（option-comparison 整合）。
- 5 文書同期: legacy umbrella / 03a / 03b / 04c / 09b すべてがスキャン対象に含まれるか。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 4 種類スキャン分類確定 | 4 | spec_created | test-strategy.md |
| 2 | `rg` 11 キーワードマトリクス | 4 | spec_created | scan-checklist.md |
| 3 | aiworkflow-requirements indexes drift 検証 | 4 | spec_created | `pnpm indexes:rebuild` + CI gate |
| 4 | 撤回 / 移植検証マトリクス | 4 | spec_created | Phase 2 表との 1:1 対応 |
| 5 | AC マッピング 10 件 | 4 | spec_created | Phase 7 へ引き継ぎ |
| 6 | 軽量運用ルール明文化 | 4 | spec_created | シェル / Vitest 追加禁止 |
| 7 | 成果物 2 ファイル分離 | 4 | spec_created | test-strategy.md / scan-checklist.md |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/test-strategy.md | 4 種スキャン分類・AC マッピング・軽量運用ルール |
| ドキュメント | outputs/phase-04/scan-checklist.md | 11 キーワードマトリクス + bash 1-liner 集 |
| メタ | artifacts.json | Phase 4 状態の更新 |

## 完了条件

- [ ] 4 種類スキャン × 5 行以上のチェック対象が空セルゼロで記述
- [ ] `rg` キーワードマトリクスが 11 行 × 4 列で記述
- [ ] aiworkflow-requirements indexes drift 検証手順が `pnpm indexes:rebuild` + CI gate `verify-indexes-up-to-date` を含む
- [ ] 撤回対象 5 軸 / 移植対象 5 知見が 1:1 で検証マトリクスにマッピング
- [ ] AC-1 / AC-3〜AC-8 / AC-10 / AC-13 / AC-14 の 10 件に検証手順が割当
- [ ] シェルスクリプト / Vitest / Playwright 追加禁止の docs-only ルールが明記
- [ ] 成果物 2 ファイルに分離（test-strategy.md / scan-checklist.md）
- [ ] bash 1-liner 例が 4 件以上記述

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が `spec_created`
- 全成果物が `outputs/phase-04/` 配下に配置済み
- 異常系（撤回漏れ / 移植漏れ / ledger 二重化 / secret 名不一致 / unrelated 混入）の検出手順が 1 つ以上提示
- artifacts.json の `phases[3].status` が `spec_created`
- artifacts.json の `phases[3].outputs` に `test-strategy.md` + `scan-checklist.md` の 2 ファイルが列挙されている

## 次 Phase への引き渡し

- 次 Phase: 5 (reconciliation 実行ランブック)
- 引き継ぎ事項:
  - 4 種類スキャンを Phase 5 runbook の sanity check（実行前 / 実行後）として埋め込む
  - `rg` 11 キーワードを reconciliation 実行時の差分検出に再利用
  - aiworkflow-requirements indexes drift 検証を Phase 5 / Phase 9 の必須ゲートに固定
  - AC マッピング 10 件を Phase 7 AC マトリクスに引き継ぎ
  - 軽量運用ルール（シェル追加禁止）を Phase 5 / Phase 12 制約として固定
- ブロック条件:
  - スキャン対象 5 文書のいずれかが欠落
  - `rg` キーワードが 11 件未満
  - indexes drift 検証手順が未定義
  - シェルスクリプト追加が runbook に紛れ込む

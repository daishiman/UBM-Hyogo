# Phase 4 主成果物 — スキャンチェックリスト（rg キーワードマトリクス + bash 1-liner 集）

正本仕様: `../../phase-04.md` / `../../index.md`
タスク ID: task-ut09-direction-reconciliation-001
作成日: 2026-04-29
実行種別: docs-only / direction-reconciliation / NON_VISUAL
base case: 案 a（採用 A — current Forms 分割方針へ寄せる）
連携: `test-strategy.md`（4 種スキャン定義）／ Phase 5（実行前後 sanity check）／ Phase 9（scan 結果保存）

---

## 0. 使い方（先頭固定）

- 本書は **コピー & ペースト前提の bash 1-liner 集**である。
- `scripts/` 配下にシェルを新設しない。本書をそのままターミナルで実行する。
- スキャン結果は **本 Phase では保存しない**。Phase 9 で実行し `outputs/phase-09/` に保存する。
- すべての `rg` コマンドは **リポジトリルート**から実行する（worktree なら worktree ルート）。
- 期待結果と異なる場合は「危険信号」列を確認し、reconciliation 違反として Phase 5 / Phase 6 / Phase 9 にエスカレートする。

---

## 1. キーワードマトリクス（11 キーワード × 期待ヒット文書 × 期待結果 × 危険信号）

| # | キーワード | 期待ヒット文書（A 採用時） | 期待結果 | 危険信号（A 違反） |
| --- | --- | --- | --- | --- |
| K1 | `/admin/sync/schema` | `04c/index.md`, `09b/index.md`, `api-endpoints.md`, legacy umbrella spec | 4 文書以上にヒット | 0 件 = 採用 A 不整合 |
| K2 | `/admin/sync/responses` | 同上 | 4 文書以上にヒット | 0 件 = 採用 A 不整合 |
| K3 | `^POST /admin/sync$`（単一 endpoint） | 旧 UT-09 root（撤回前提）/ 本タスク / ut-21 のみ | 0〜3 件・撤回コンテキストのみ | 04c / 09b / api-endpoints.md にヒット = 採用 A 違反 |
| K4 | `sync_locks` | `database-schema.md`（廃止候補記述のみ）, 旧 UT-09 root, ut-21, 本タスク | 「正本テーブル」登録なし | 正本登録 = 二重 ledger 化 |
| K5 | `sync_job_logs` | 同上 | 同上 | 同上 |
| K6 | `sync_jobs` | `database-schema.md`, `04c/index.md`, `09b/index.md`, legacy umbrella spec | 4 文書以上にヒット | 0 件 = 採用 A 不整合 |
| K7 | `GOOGLE_SHEETS_SA_JSON` | 旧 UT-09 root（撤回対象記述）, ut-21（同種 blocked）, 本タスク | 3 文書以下、すべて「廃止候補 / 採用 B 時のみ」コンテキスト | references / 04c / 09b にヒット = 採用 A 違反 |
| K8 | `GOOGLE_FORM_ID` / `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_PRIVATE_KEY` | `environment-variables.md`, `deployment-cloudflare.md`, legacy umbrella, 03a, 03b | 4 文書以上にヒット | 0 件 = secret 名未確定 |
| K9 | `ut-09-sheets-to-d1-cron-sync-job` | legacy umbrella（参照記述）, 本タスク, ut-21 | 3 文書、すべて「legacy umbrella 参照に戻す」コンテキスト | direct implementation 化記述のままなら違反 |
| K10 | `Forms 分割方針` / `Forms API 分割` | legacy umbrella, 03a, 03b, 04c, 09b, 本タスク | 6 文書以上にヒット | 0 件 = 用語ぶれ |
| K11 | `Sheets 採用方針` | 本タスク, ut-21 のみ | 2 文書のみ、いずれも「未承認 / 検討候補」コンテキスト | 04c / 09b で正本扱いなら違反 |

---

## 2. 5 文書同期チェック（D1〜D5）

| 文書ID | パス |
| --- | --- |
| D1 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` |
| D2 | `docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md` |
| D3 | `docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md` |
| D4 | `docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md` |
| D5 | `docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md` |

---

## 3. bash 1-liner 集（コピー & ペースト用）

### 3.1 5 文書同期スキャン（S1）

```bash
# 5 文書一括で /admin/sync 系 endpoint の現状確認（K1 / K2 / K3）
rg -n '/admin/sync(/schema|/responses)?' \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md \
  docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md \
  docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
```

```bash
# 5 文書で Sheets API 言及がないか（D2/D3/D4/D5 で 0 件期待）
rg -n -i 'sheets\s*api|spreadsheets\.values|sheets\.googleapis\.com' \
  docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md \
  docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
```

```bash
# legacy umbrella で「direct implementation にしない」方針の存続確認
rg -n 'direct implementation|legacy umbrella' \
  docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md
```

### 3.2 撤回対象スキャン（S2 / Sheets 残骸検出）

```bash
# Sheets 系コードファイルが docs / references で正本扱いされていないか（W1）
rg -l 'sync-sheets-to-d1' docs/ .claude/skills/aiworkflow-requirements/references/
```

```bash
# 単一 /admin/sync が 04c / api-endpoints で正本登録されていないか（W2 / W3 / K3）
rg -n 'POST\s+/admin/sync\b' \
  docs/30-workflows/02-application-implementation/04c-parallel-admin-backoffice-api-endpoints/index.md \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md \
  .claude/skills/aiworkflow-requirements/references/api-endpoints.md
```

```bash
# sync_locks / sync_job_logs が database-schema で正本扱いされていないか（W4 / W5 / K4 / K5）
rg -n 'sync_locks|sync_job_logs' \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

```bash
# Sheets 系 secret が references で正本登録されていないか（W6 / W7 / K7）
rg -n 'GOOGLE_SHEETS_SA_JSON|SHEETS_SPREADSHEET_ID' \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

```bash
# 旧 UT-09 root が legacy umbrella 参照に戻る方針か（W8 / K9）
rg -n 'legacy umbrella|direct implementation' \
  docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md
```

### 3.3 移植対象スキャン（S3 / D1 contention mitigation 5 知見）

```bash
# retry/backoff (M2) / batch-size (M4) が 03a / 03b / 09b にあるか
rg -n -i 'retry|backoff|batch[-_ ]?size' \
  docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
```

```bash
# WAL 非前提 (M1) / short transaction (M3) が 03a / 03b にあるか
rg -n -i 'WAL|short\s*transaction|transaction\s*(の)?処理量' \
  docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md
```

```bash
# 二重起動防止 (M5) が 09b にあるか
rg -n -i '二重起動|idempoten|lock\s*TTL|scheduled.*manual' \
  docs/30-workflows/09b-parallel-cron-triggers-monitoring-and-release-runbook/index.md
```

### 3.4 aiworkflow-requirements drift スキャン（S4）

```bash
# indexes 再生成差分の検証（R1）
mise exec -- pnpm indexes:rebuild && git status .claude/skills/aiworkflow-requirements/indexes/
```

```bash
# api-endpoints.md 正本一致（R3 / K1 / K2 / K3）
rg -n '/admin/sync' .claude/skills/aiworkflow-requirements/references/api-endpoints.md
```

```bash
# database-schema.md 正本一致（R4 / K4 / K5 / K6）
rg -n 'sync_jobs|sync_locks|sync_job_logs' \
  .claude/skills/aiworkflow-requirements/references/database-schema.md
```

```bash
# secret 名正本一致（R5 / K7 / K8）
rg -n 'GOOGLE_SHEETS_SA_JSON|GOOGLE_FORM_ID|GOOGLE_SERVICE_ACCOUNT_EMAIL|GOOGLE_PRIVATE_KEY|SHEETS_SPREADSHEET_ID' \
  .claude/skills/aiworkflow-requirements/references/environment-variables.md \
  .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md
```

```bash
# CI gate 確認（R2）
rg -n 'verify-indexes-up-to-date' .github/workflows/verify-indexes.yml
```

### 3.5 Forms 採用方針整合性スキャン（横串 F1〜F7）

```bash
# F1: Forms 分割方針の用語ぶれ検査（K10 / 6 件以上ヒット期待）
rg -c 'Forms\s*(API\s*)?分割方針' docs/30-workflows/
```

```bash
# F2: 上流 API 一意性（03a で forms.get / 03b で forms.responses.list のみ）
rg -n 'forms\.get|forms\.responses\.list' \
  docs/30-workflows/02-application-implementation/03a-parallel-forms-schema-sync-and-stablekey-alias-queue/index.md \
  docs/30-workflows/02-application-implementation/03b-parallel-forms-response-sync-and-current-response-resolver/index.md
```

```bash
# F6: 不変条件 #5 整合（apps/web から D1 直接アクセスがないこと / 0 件期待）
rg -n 'D1Database|env\.DB' apps/web/ || echo "OK: apps/web から D1 直接アクセスなし"
```

```bash
# F7: 不変条件 #6 整合（旧 UT-09 を direct implementation 化していないか）
rg -n 'direct implementation' docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md
```

### 3.6 staging smoke 表記スキャン（AC-13）

```bash
# pending を PASS と書き換えていないかの検出
rg -n 'pending|PASS|FAIL' docs/30-workflows/ut09-direction-reconciliation/outputs/
```

### 3.7 unrelated 削除分離スキャン（AC-14）

```bash
# unrelated verification-report 削除が本 PR に混入していないかの検出
rg -n 'unrelated|verification-report' docs/30-workflows/ut09-direction-reconciliation/phase-03.md \
  docs/30-workflows/ut09-direction-reconciliation/outputs/phase-03/main.md
```

---

## 4. 実行ガイド（Phase 5 / Phase 9 連携）

| タイミング | 用途 | 結果保存先 |
| --- | --- | --- |
| Phase 5 reconciliation 実行 **前** | 現状ベースライン取得（pre-scan） | Phase 9 `outputs/phase-09/pre-scan.txt`（実装は Phase 9） |
| Phase 5 reconciliation 実行 **後** | 反映後の状態取得（post-scan） | Phase 9 `outputs/phase-09/post-scan.txt`（同上） |
| diff 比較 | pre / post の差分が期待通りか | Phase 9 `outputs/phase-09/contract-sync-check.md` |

> 本 Phase 4 では **コマンド定義のみ**を確定する。実行と保存は Phase 9 が担当する。

---

## 5. 期待結果サマリー（採用 A 時のクイックリファレンス）

| 項目 | 期待 |
| --- | --- |
| `/admin/sync/schema` ヒット文書数 | 4 以上 |
| `/admin/sync/responses` ヒット文書数 | 4 以上 |
| 単一 `POST /admin/sync` ヒット | 0〜3（撤回コンテキストのみ） |
| `sync_jobs` 正本登録 | あり（database-schema.md） |
| `sync_locks` / `sync_job_logs` 正本登録 | なし |
| `GOOGLE_SHEETS_SA_JSON` references 登録 | なし（廃止候補のみ） |
| Forms 系 secret references 登録 | あり |
| `pnpm indexes:rebuild` 後の git diff | ゼロ |
| `verify-indexes-up-to-date` CI gate | PASS |
| `apps/web` からの D1 直接アクセス | ゼロ |

---

状態: spec_created

# UT-21 Forms sync conflict close-out (Sheets 仕様の正本吸収)

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-forms-sync-conflict-closeout-001 |
| タスク名 | UT-21 Sheets sync 仕様を Forms sync 現行正本へ吸収する close-out |
| 分類 | 改善 / legacy umbrella |
| 優先度 | HIGH |
| 推奨Wave | Wave 1（03a / 03b / 04c / 09b 並走中に着手） |
| 状態 | 未実施 |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | 03a / 03b / 04c / 09b（実装は既存タスクへ移植・本タスクで新規実装は行わない） |
| 検出元 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` (UT21-U01) |

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

UT-21（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）は Google Sheets API v4 を同期元とする「Sheets→D1 sync endpoint と audit logger」実装タスクとして起票された。
しかし現行正本仕様では、同期元は Google Forms API (`forms.get` / `forms.responses.list`)、admin endpoint は `POST /admin/sync/schema` と `POST /admin/sync/responses`、監査台帳は `sync_jobs` ledger に分解済みである（`task-sync-forms-d1-legacy-umbrella-001` で旧 UT-09 と同様の置換処理が完了している）。

### 1.2 問題点・課題

UT-21 を当初仕様のまま「直接実装」してしまうと、Sheets sync と Forms sync の二重正本が発生し、`apps/api` に不要な Sheets API クライアント、`sync_audit_logs` / `sync_audit_outbox` テーブル、単一 `POST /admin/sync` および `GET /admin/sync/audit` ルートが追加される。これらは現行 03a / 03b / 04c / 09b で確立された境界と衝突する。

### 1.3 放置した場合の影響

- 実装者が UT-21 仕様書だけを参照し、Forms sync 経路と並列で Sheets sync 経路をコード化するリスクがある
- `sync_jobs` ledger と `sync_audit_logs` の二重監査が走り、`responseId` / `memberId` / consent snapshot の整合性が壊れる
- `POST /admin/sync` を新設すると `task-sync-forms-d1-legacy-umbrella-001` の「単一 `/admin/sync` を新設しない」方針と矛盾する
- UT-21 が要求する有効な品質要件（Bearer guard / 409 排他 / D1 retry / manual smoke）が現行タスクへ未移植のまま残る

---

## 2. 何を達成するか（What）

### 2.1 目的

UT-21 を Sheets direct implementation として進めず、有効な品質要件のみを 03a / 03b / 04c / 09b へ吸収する close-out を完了する。`POST /admin/sync` と `GET /admin/sync/audit` は新設しない方針を、本ファイルと現行タスク受入条件の双方で固定する。

### 2.2 最終ゴール

この指示書を読めば、UT-21 を直接実装せず、現行 Forms sync タスク群の受入条件として品質要件のみを取り込む判断が一意にできる状態にする。

### スコープ

#### 含むもの

- UT-21 の有効な品質要件を抽出し、移植先タスクへの対応表を作る
  - Bearer guard（401 / 403 / 200 の認可境界）→ 04c
  - 409 排他（`sync_jobs.status='running'` 同種 job 衝突）→ 03a / 03b
  - D1 retry / `SQLITE_BUSY` backoff / 短い transaction / batch-size 制限 → 03a / 03b
  - manual smoke（実 secrets / 実 D1 環境）→ 09b runbook + 09a / 09c smoke
- `POST /admin/sync` と `GET /admin/sync/audit` を追加しない方針を本ファイルと UT-21 仕様書の状態欄に明記する
- UT21-U02 / U04 / U05 を後続タスクとして別ファイル化する（本ファイルの「後続タスク」欄でリンクする）

#### 含まないもの

- Google Sheets API v4 を正本仕様へ復活させること
- `sync_audit_logs` / `sync_audit_outbox` テーブルの新設（必要性判定は U02 で別途行う）
- 新規 sync 実装コードの追加（実装は 03a / 03b / 04c / 09b の Phase 実行で行う）
- commit / push / PR 作成

---

## 3. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-sync-forms-d1-legacy-umbrella-001` | 旧 UT-09 と同形式の legacy umbrella 処理。本タスクはその姉妹タスク |
| 上流 | 03a-parallel-forms-schema-sync-and-stablekey-alias-queue | `forms.get` / `POST /admin/sync/schema` の正本 |
| 上流 | 03b-parallel-forms-response-sync-and-current-response-resolver | `forms.responses.list` / `POST /admin/sync/responses` の正本 |
| 上流 | 04c-parallel-admin-backoffice-api-endpoints | Bearer guard / admin endpoint expose の正本 |
| 上流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | cron / runbook / smoke の正本 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `sync_jobs` repository と D1 直接アクセス境界 |
| 横 | UT21-U02 / U04 / U05 後続タスク | 本ファイルから派生する独立スコープ |

---

## 4. Phase 構成

### Phase 1: stale 前提の棚卸し

UT-21 に含まれる以下の前提を stale として明示する。

| stale 前提 | 現行正本 |
| --- | --- |
| 同期元 = Google Sheets API v4 | Google Forms API (`forms.get`, `forms.responses.list`) |
| 単一 `POST /admin/sync` | `POST /admin/sync/schema` + `POST /admin/sync/responses` の 2 系統 |
| `GET /admin/sync/audit` 公開 | `sync_jobs` ledger を内部参照（admin UI 経由） |
| `sync_audit_logs` / `sync_audit_outbox` テーブル | `sync_jobs` ledger（必要性は U02 で再判定） |
| 実装パス `apps/api/src/sync/*` 一式 | `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` |

### Phase 2: 有効な品質要件の抽出と移植先割当

| UT-21 由来の品質要件 | 移植先タスク | 受入条件への反映観点 |
| --- | --- | --- |
| Bearer guard（401 / 403 / 200） | 04c | `Authorization: Bearer <SYNC_ADMIN_TOKEN>` middleware を `/admin/sync/*` 全ルートへ適用 |
| 既存 job 実行中 = 409 Conflict | 03a / 03b | `sync_jobs.status='running'` の同種 job 検出で 409 を返却するテスト |
| D1 retry / `SQLITE_BUSY` backoff | 03a / 03b | 短い transaction、batch-size 制限、指数バックオフ retry |
| manual smoke（実 secrets / D1） | 09b runbook + 09a/09c smoke | NON_VISUAL 証跡として `outputs/phase-11/` 系へログを残す |

### Phase 3: 「追加しない方針」の明文化

- 本ファイルの「含まないもの」へ `POST /admin/sync` と `GET /admin/sync/audit` の新設禁止を明記する
- UT-21 仕様書（`UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md`）は legacy としてそのまま残し、本ファイル ID をクロスリンクする
- `task-sync-forms-d1-legacy-umbrella-001` と同様、stale path は新規作成しない

### Phase 4: 検証

```bash
node .claude/skills/task-specification-creator/scripts/audit-unassigned-tasks.js \
  --target-file docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md

rg -n "POST /admin/sync\b|GET /admin/sync/audit|sync_audit_logs|sync_audit_outbox" \
  docs/30-workflows/02-application-implementation \
  .claude/skills/aiworkflow-requirements/references
```

---

## 5. 後続タスク（別ファイル化）

| ID | ファイル | 概要 |
| --- | --- | --- |
| UT21-U02 | `task-ut21-sync-audit-tables-necessity-judgement-001.md` | `sync_audit_logs` / `sync_audit_outbox` の必要性を `sync_jobs` 不足分析として再判定 |
| UT21-U04 | `task-ut21-phase11-smoke-rerun-real-env-001.md` | Phase 11 smoke を実 secrets / 実 D1 環境で再実行（NON_VISUAL） |
| UT21-U05 | `task-ut21-impl-path-boundary-realignment-001.md` | `apps/api/src/sync/*` 想定と実構成（`apps/api/src/jobs/*` / `apps/api/src/sync/schema/*`）の境界整理 |

UT21-U03（Phase 12 成果物欠落）は phase-12 配下で既に成果物追加済みのため新規タスク化不要。

---

## 6. 苦戦箇所【記入必須】

### 6.1 中学生レベルの説明（Part 1 由来）

- UT-21 は「Google スプレッドシートの回答を D1 に毎時間写す」設計図だった
- いま実際の正本は「Google Forms から直接読み取る」方式へ更新済み
- つまり古い地図（Sheets）と新しい地図（Forms）が両方ある状態。両方を同時に正しいものとして扱うと、次の実装者が間違った方の地図を見て、要らない API やテーブルを増やしてしまう
- 解決の例え: 古い地図には「これは古い版」と大きく書いて、新しい地図に必要な道（Bearer guard / 409 / retry / smoke）だけを書き写す

### 6.2 技術詳細（Part 2 由来）

| 項目 | 内容 |
| --- | --- |
| 症状 | UT-21 仕様（Sheets API v4 + `sync_audit_logs/outbox` + 単一 `/admin/sync`）が現行 Forms sync 正本と二重正本化していた |
| 原因 1: 同期元差異 | UT-21 は `spreadsheets.values.get` 想定、正本は `forms.get` / `forms.responses.list`。DTO が `SheetRow` から Forms response へ変わっており、`SHA-256(response_id)` 冪等キーの算出根拠も列インデックスではなく Forms `responseId` ベースになる |
| 原因 2: audit table 設計判定の難しさ | `sync_audit_logs` + `sync_audit_outbox` の二段監査は Sheets sync の best-effort モデル前提。現行 `sync_jobs` ledger だけで「実行履歴・実行中ジョブ・metrics_json・失敗詳細」をカバーできるかの判定が必要で、即座に新設テーブルを追加するのは過剰実装になる |
| 原因 3: 実装パス想定ずれ | UT-21 は `apps/api/src/sync/{core,manual,scheduled,audit}.ts` を提案するが、現行は `apps/api/src/jobs/sync-forms-responses.ts` + `apps/api/src/sync/schema/*` 構成。仕様だけ追従すると import path / Cron handler 配置が壊れる |
| 原因 4: API 境界の衝突 | UT-21 の `POST /admin/sync` 単一 endpoint は、03a/03b/04c の `POST /admin/sync/schema` + `POST /admin/sync/responses` 2 系統と排他関係。`GET /admin/sync/audit` も `sync_jobs` を admin UI 経由で参照する現行方針と衝突 |
| 対応 | UT-21 を legacy として残し、有効な品質要件（Bearer guard / 409 / D1 retry / manual smoke）だけを 03a / 03b / 04c / 09b の受入条件へ移植。新規 endpoint・新規テーブルは追加しない |
| 再発防止 | (a) 旧仕様タスクは Phase 12 unassigned-task-detection で必ず「正本との差分表」を作る。(b) `aiworkflow-requirements` の current facts と照合し、既に分割済みなら direct implementation ではなく legacy umbrella として閉じる。(c) `POST /admin/sync` のような「単一エンドポイントへの統合」誘惑には、`sync_jobs` の job_kind 分離原則を優先する |

### 6.3 将来同種課題への一般化

- 「古い設計タスク」と「現行正本」が並存する場合、原則として古い側を direct implementation のままにせず legacy umbrella ファイルへ降格させる
- 監査テーブル新設の判定は「既存 ledger の不足分析」を先に行い、不足が証明できない場合は新設しない
- API 境界の差分は「単一 endpoint vs 多 endpoint」の好みではなく、job_kind の単一責務原則で決める

---

## 7. システム仕様反映メモ（aiworkflow-requirements 関連）

| 領域 | 反映先 | 内容 |
| --- | --- | --- |
| 同期実装 | `apps/api/src/jobs/sync-forms-responses.ts` | Forms response sync の正本実装。Sheets 経路は追加しない |
| schema 同期 | `apps/api/src/sync/schema/*` | `forms.get` で取得した schema を `schema_questions` / `schema_versions` / `schema_diff_queue` へ反映 |
| 監査台帳 | `sync_jobs` ledger | `status` / `job_kind` / `metrics_json` / `started_at` / `finished_at` を正本とする。`sync_audit_logs` / `sync_audit_outbox` は新設しない（必要性は U02 で判定） |
| 認可境界 | `SYNC_ADMIN_TOKEN`（Bearer） | `/admin/sync/schema` / `/admin/sync/responses` に middleware で適用。401（header なし）/ 403（不一致）/ 200（一致）/ 409（同種 job 実行中）の 4 状態 |
| D1 アクセス | `apps/api` のみ | `apps/web` から D1 直接アクセス禁止（CLAUDE.md 不変条件 5） |
| Cron | Workers Cron Triggers | 09b runbook の pause / resume / evidence 手順に従う |

---

## 8. 完了条件チェックリスト

- [ ] UT-21 を direct implementation task ではなく close-out として扱う
- [ ] 有効な品質要件 4 種（Bearer guard / 409 / D1 retry / manual smoke）の移植先が 03a / 03b / 04c / 09b に割り当てられている
- [ ] `POST /admin/sync` と `GET /admin/sync/audit` を新設しない方針が明記されている
- [ ] `sync_audit_logs` / `sync_audit_outbox` の新設は U02 判定後まで保留
- [ ] 後続タスク UT21-U02 / U04 / U05 が別ファイルで作成済み
- [ ] `audit-unassigned-tasks.js` の current violations が 0 件
- [ ] commit / PR は本タスク内で実行しない

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` | 検出原典 |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/implementation-guide.md` | 差分表・API 境界・苦戦点ヒント |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/index.md` | UT-21 メタ情報・正本語彙 |
| 必須 | `docs/30-workflows/unassigned-task/task-sync-forms-d1-legacy-umbrella-001.md` | 旧 UT-09 close-out の参考フォーマット |
| 必須 | `docs/30-workflows/unassigned-task/UT-21-sheets-d1-sync-endpoint-and-audit-implementation.md` | UT-21 当初仕様（legacy） |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | D1 / sync_jobs / deployment current facts |

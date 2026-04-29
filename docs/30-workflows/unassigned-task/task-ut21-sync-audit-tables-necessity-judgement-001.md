# UT-21 sync audit tables necessity judgement (`sync_jobs` 不足分析)

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| タスク名 | `sync_audit_logs` / `sync_audit_outbox` の必要性判定（`sync_jobs` ledger 不足分析） |
| 分類 | 設計判定 / 仕様精査 |
| 優先度 | MEDIUM |
| 推奨Wave | Wave 1（closeout-001 と並走可） |
| 状態 | 未実施 |
| 作成日 | 2026-04-29 |
| 既存タスク組み込み | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary（不足が証明された場合に schema 拡張で吸収） |
| 検出元 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` (UT21-U02) |
| 親タスク | `task-ut21-forms-sync-conflict-closeout-001.md` |

---

## 1. 目的

UT-21 が要求していた `sync_audit_logs`（毎実行の詳細監査）と `sync_audit_outbox`（audit 書き込み失敗時の retry 用 best-effort バッファ）を新規テーブルとして導入すべきか、現行 `sync_jobs` ledger の拡張で十分かを判定する。

判定結果に応じて:
- **不足が証明できない場合**: 新規テーブル追加なし。本ファイルを判定証跡として残す
- **不足が証明できる場合**: 02c-parallel タスクへ schema 拡張（追加カラム or 追加テーブル）の受入条件として移植する

---

## 2. スコープ

### 含むもの

- `sync_jobs` ledger が現状提供する情報の棚卸し
- UT-21 が要求する audit 観点（実行ごと詳細・best-effort 失敗バッファ・後追い清書）の列挙
- ギャップ分析と判定（テーブル新設要 / `sync_jobs` 拡張で吸収 / 既存で十分）
- 判定結果の `task-ut21-forms-sync-conflict-closeout-001.md` への反映

### 含まないもの

- 新テーブルのマイグレーション SQL 作成（必要と判定された場合は別タスク）
- `apps/api` 側 audit writer の実装
- commit / PR 作成

---

## 3. 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | `task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out。本判定の方針整合先 |
| 上流 | 02c-parallel-admin-notes-audit-sync-jobs-and-data-access-boundary | `sync_jobs` repository の正本 |
| 横 | 03a / 03b | sync 実行から書き込まれる ledger の使用者 |

---

## 4. 判定フレームワーク

### 4.1 `sync_jobs` ledger が現状提供する情報

| カラム / 機能 | 内容 |
| --- | --- |
| `id` | job 識別子 |
| `job_kind` | `schema_sync` / `response_sync` 等 |
| `status` | `running` / `succeeded` / `failed` |
| `started_at` / `finished_at` | 実行時刻 |
| `metrics_json` | 件数・差分・エラーサマリ等の JSON |
| 同種 job 排他 | `status='running'` 検出で 409 |

### 4.2 UT-21 が要求した audit 観点

| 観点 | UT-21 仕様での扱い | `sync_jobs` で足りるか |
| --- | --- | --- |
| 実行ごとの詳細ログ | `sync_audit_logs` 行ごと書き込み | `metrics_json` で代替可能か要判定 |
| audit 書き込み失敗時の retry | `sync_audit_outbox` で best-effort 蓄積 | `sync_jobs` 自体が落ちた場合のリカバリ経路がない |
| 後追い清書 | outbox から audit_logs へ flush | 同上 |
| 個別行レベルの差分追跡 | row 単位 audit row | `metrics_json` で集計値のみ。行単位は不可 |

### 4.3 判定基準

以下のいずれかが該当する場合のみ新設を検討:
1. 行単位の差分追跡が運用上の必須要件である
2. `sync_jobs` テーブル自体への書き込み失敗を別経路で記録する必要がある
3. 監査要件（外部監査・コンプラ）で「実行履歴を別テーブルに分離する」要請がある

該当しない場合: `metrics_json` の構造化と `sync_jobs` の retention 方針で足りる。

---

## 5. Phase 構成

1. **棚卸し**: `sync_jobs` schema 確認（02c の DDL）と既存 `metrics_json` 想定構造の確認
2. **要件抽出**: UT-21 が想定した audit 観点を列挙し、現行 Forms sync 運用で実需があるかを確認
3. **判定**: 4.3 の判定基準で「新設不要 / `sync_jobs` 拡張 / 新規テーブル必要」のいずれかに分類
4. **反映**: 判定結果を closeout-001 の「含まないもの」または「移植要件」に反映

---

## 6. 苦戦箇所【記入必須】

### 中学生レベルの説明

- 「先生が同期を実行したノート（`sync_jobs`）」と「もっと細かい記録ノート（`sync_audit_logs`）」と「失敗したときの貼り紙（`sync_audit_outbox`）」の 3 種類を持つかどうかの判断
- 3 種類あれば手厚いが、毎回 3 つ書くのは手間。1 つ（`sync_jobs`）の中身を工夫して書けば足りるかもしれない
- 「足りない」と証明できないのに増やすと、テーブルが散らかって後で混乱する

### 技術詳細

| 項目 | 内容 |
| --- | --- |
| 症状 | UT-21 仕様が `sync_audit_logs` + `sync_audit_outbox` を前提にしているが、現行は `sync_jobs` ledger のみ |
| 原因 | UT-21 は Sheets sync の best-effort モデル（行単位 audit + 失敗時 outbox 退避）前提で書かれていた。Forms sync では `forms.responses.list` 自体が冪等なので、行単位 audit よりも job 単位の `metrics_json` で十分なケースが多い |
| 判定の難しさ | 「将来の監査要件」を理由に新設すると過剰実装になる。逆に「現状不要」で却下すると、後で実需が出たときに schema migration が必要になる。判定基準を 4.3 のように事前明文化することが重要 |
| 再発防止 | 監査テーブル新設の判定は (a) 既存 ledger の不足を行単位 / job 単位 / 失敗リカバリの 3 軸で示す、(b) 運用イベント（外部監査 / コンプラ）の有無を確認、の 2 段階で行う |

---

## 7. システム仕様反映メモ

| 領域 | 反映先 | 内容 |
| --- | --- | --- |
| 監査台帳 | `sync_jobs` ledger | 既定は本台帳のみ。新設は本タスクの判定後に限る |
| schema 拡張 | 02c-parallel | 不足が証明された場合のみカラム追加 or 新テーブル DDL を 02c の受入条件へ追加 |
| `metrics_json` | `apps/api/src/jobs/sync-forms-responses.ts` | 構造化キー（処理件数・skip 件数・失敗件数・最終 cursor 等）を JSON Schema 化 |

---

## 8. 完了条件

- [ ] `sync_jobs` 現行 schema の棚卸しが完了
- [ ] UT-21 audit 観点 vs `sync_jobs` のギャップ表が作成済み
- [ ] 判定結果（新設不要 / 拡張 / 新設）が記録されている
- [ ] closeout-001 への反映（"含まないもの" 確定または移植要件追加）が完了
- [ ] commit / PR は実行しない

---

## 9. 参照情報

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/unassigned-task-detection.md` | 検出原典 |
| 必須 | `docs/30-workflows/ut-21-sheets-d1-sync-endpoint-and-audit-implementation/outputs/phase-12/implementation-guide.md` | audit / outbox の元仕様 |
| 必須 | `docs/30-workflows/unassigned-task/task-ut21-forms-sync-conflict-closeout-001.md` | 親 close-out |
| 必須 | `.claude/skills/aiworkflow-requirements/references/task-workflow.md` | `sync_jobs` current facts |

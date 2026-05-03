# Phase 1: 要件定義 — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 1 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |
| taskType | implementation-spec / implemented |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 03b forms response sync 本体 / 04c admin backoffice API endpoints / 02a member identity-status repository |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

未完了の真因、scope、依存境界、成功条件を確定する。03b が `EMAIL_CONFLICT` エラーコード返却に
留めた状態で残った「admin 手動 merge 経路」を、判定基準 spec / API / UI / runbook の責務単位で
分解し AC を確定する。本サイクルでは実コード実装は完了済みであり、本 phase は実装結果と
完全整合する要件として spec を確定する。

## 実行タスク

1. 参照資料と該当 spec / 03b 元 followup を確認する。完了条件: identity merge の境界が記録される。
2. 本タスク固有の scope / AC / evidence を確認する。完了条件: AC と evidence path が対応する。
3. user approval または上流 gate が必要な操作を分離する。完了条件: 自走禁止操作が明記される。

## 参照資料

- docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/00-overview.md
- apps/api/src/jobs/sync-forms-responses.ts (`classifyError()` の `EMAIL_CONFLICT` 分類)
- apps/api/src/middleware/require-admin.ts

## 実行手順

- 対象 directory: `docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/`
- 本仕様書作成では deploy / commit / push / PR 作成を行わない。
- 実コードは既に実装済み（Phase 2 の「変更対象ファイル一覧」に状態を反映）。
- 実機 D1 migration apply / smoke は Phase 5 / Phase 11 の runbook で扱う。

## 統合テスト連携

- 上流: 03b sync 本体（`EMAIL_CONFLICT` 検出ロジック）/ 04c admin auth-router foundation / 02a identity-status repository
- 下流: 04c admin E2E / 公開ディレクトリ重複解消運用 smoke

## 多角的チェック観点

- #1 Google Form schema をコードに固定しすぎない（identity merge メタは admin-managed として 3 テーブルに分離）
- #3 PII 取扱（responseEmail は admin UI / API 応答で部分マスク、merge reason は redaction）
- #5 D1 直アクセスは apps/api 限定（apps/web は generic proxy `[...path]` 経由）
- #11 管理者も他人本文を直接編集しない（merge は alias と audit のみ。本文 column 不可変）
- #13 admin audit logging（`identity_merge_audit` 独立テーブル + `audit_log` への append の二重ガード）
- 自動 merge は scope out。第一段階は厳格な完全一致 + 二段階確認のみ。

## サブタスク管理

- [x] refs を確認する
- [x] AC と evidence path を対応付ける
- [x] blocker / approval gate を明記する
- [x] outputs/phase-01/main.md を作成する

## 成果物

- outputs/phase-01/main.md

## 完了条件

- 重複候補判定基準（第一段階: `name` 完全一致 AND `affiliation` 完全一致 / `trim` + `NFKC` 正規化のみ許容）が spec として明文化されている
- 3 endpoint（list / merge / dismiss）の責務と入出力が決まっている
- merge transaction が D1 transactional batch（fallback なし）で atomic に閉じる方針が確定している
- `identity_merge_audit` / `identity_aliases` / `identity_conflict_dismissals` の存在と必須カラムが決まっている
- admin UI の二段階確認フローが定義されている（Row コンポーネント内 stage state）
- 不変条件 #1 #3 #5 #11 #13 と矛盾しない

## 追加セクション（Phase 1）

### true issue
- 03b は sync ジョブ責務に閉じ、`EMAIL_CONFLICT` を `sync_jobs.error_json` に記録するに留めた。
- 同一人物が別メールで再回答した場合、UNIQUE 制約に触れず別 identity で採番されるため、放置すると公開ディレクトリに重複混入する。
- 自動 merge は判定アルゴリズム合意未了で scope out 済み。本タスクは admin による手動解消経路の確定を真因とする。

### 依存境界
- 上流: 03b（sync 本体・current_response_resolver） / 04c（admin auth/router foundation, generic `[...path]` proxy） / 02a（identity-status repo） / 03b-followup-003（response_email UNIQUE DDL）
- 下流: 公開ディレクトリ重複解消の運用閉路 / 03b-followup-006 アラートとの連携

### 価値とコスト
- 価値: `EMAIL_CONFLICT` を運用閉路上で解消可能にし、公開ディレクトリ・consent 撤回の整合性を担保する。
- コスト: admin route 1 ファイル（3 endpoint） / repository 2 本（identity-conflict, identity-merge） / detector 1 本 / DDL 3 本 / admin page 1 本 + Row component 1 本 / shared schema 1 本。

### 4 条件
- 価値性: 公開ディレクトリ重複と PII / consent 不整合の構造的回避。
- 実現性: D1 transactional batch 必須契約と既存 repository のみで実装可能。
- 整合性: #1 / #3 / #5 / #11 / #13 と矛盾しない。
- 運用性: 第一段階は完全一致のみ。二段階確認 + 監査ログ二重ガードで誤 merge 追跡可能性を担保。

### 自走禁止操作
- 実機 D1 migration apply（`bash scripts/cf.sh d1 migrations apply`）
- production deploy
- commit / push / PR 作成
- production secret の参照・記録

## タスク100%実行確認

- [x] この Phase の必須セクションがすべて埋まっている
- [x] 完了済み本体タスクの復活ではなく follow-up gate の仕様になっている
- [x] 実装後も deploy / commit / push / PR は実行していない

## 次 Phase への引き渡し

Phase 2 へ、AC、blocker、evidence path、approval gate を渡す。

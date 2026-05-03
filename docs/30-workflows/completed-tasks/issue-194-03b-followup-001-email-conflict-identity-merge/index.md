# issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書] — admin API / UI / merge transaction / DDL を実装済み（本ワークフローでは
spec を実装結果と完全整合させる更新のみを扱う）。

## wave / mode / owner

| 項目 | 値 |
| --- | --- |
| wave | 04c-fu |
| mode | parallel |
| owner | - |
| 状態 | implemented-local / implementation-spec / runtime pending |
| visualEvidence | VISUAL_ON_EXECUTION |
| GitHub Issue | #194 (closed / spec再構成のみ) |
| 作成日 | 2026-05-02 |
| 更新日 | 2026-05-03 |

## purpose

03b（forms response sync）が `apps/api/src/jobs/sync-forms-responses.ts` の `classifyError()` で
UNIQUE/constraint 違反を `EMAIL_CONFLICT` エラーコードに分類して `sync_jobs.error_json` に
記録するに留めた未タスクを、admin backoffice 側で同一人物が別メールで再回答した場合の
identity を手動 merge する経路として閉じる。

GitHub Issue #194 の要件を Phase 1-13 の実装可能粒度に再構成し、判定基準 spec / admin API /
merge transaction / admin UI / runbook を単一仕様書として確定する。
**実コードはローカル差分として実装済み** であり、本ワークフローの spec は実装と完全整合した
「実装仕様書（CONST_005 準拠）」として最新化されている。commit / push / PR / staging migration apply /
visual smoke は user gate 後にのみ実行する。

## why this is not a restored old task

03b 本体は `EMAIL_CONFLICT` エラーコード返却までで scope を closed しており、本タスクは
03b 内部に取り込めない「admin による手動 merge UI」という独立責務を follow-up として確定する。
既存の `apps/api/src/jobs/sync-forms-responses.ts` の sync 処理本体は変更せず、
admin route / merge service / DDL 追加 / admin UI を追加する差分仕様として閉じている。

## scope in / out

### Scope In
- 重複候補判定アルゴリズム（第一段階: `name` 完全一致 AND `affiliation` 完全一致 / `trim` + `NFKC` 正規化のみ許容）
- admin backoffice API 3 系統の endpoint 設計と route handler 実装
  - `GET /admin/identity-conflicts`
  - `POST /admin/identity-conflicts/:id/merge`
  - `POST /admin/identity-conflicts/:id/dismiss`
- merge トランザクション仕様（`identity_aliases` による source→target canonical 解決 / response 本文 immutable）
- admin 画面（候補リスト / merge 二段階確認 / 別人マーク操作）
- 監査ログテーブル `identity_merge_audit` / canonical alias テーブル `identity_aliases` /
  別人マーク永続化 `identity_conflict_dismissals` の DDL 追加
- merge 失敗時のリカバリ runbook
- `EMAIL_CONFLICT` 件数アラートとの連携点（03b-followup-006 参照）

### Scope Out
- 自動 merge（判定基準の合意と検証が固まるまで scope out）
- 03b sync ジョブ本体の変更（`EMAIL_CONFLICT` 検出ロジックは既に実装済み）
- 物理削除の導入（merge 後も論理保持）
- 公開ディレクトリ側の物理統合・本文移動（04a 表示では archived source を除外する）
- production secret 値の記録
- 未承認 commit / push / PR
- 実機 D1 migration apply（手動 runbook で別段階）

## dependencies

### Depends On
- 03b-parallel-forms-response-sync-and-current-response-resolver（マージ済み前提）
- 04c-parallel-admin-backoffice-api-endpoints（auth/router foundation, generic proxy `[...path]`）
- 02a member identity / status repository
- 03b-followup-003 `member_responses.response_email` UNIQUE 制約 DDL 明文化

### Blocks
- 公開ディレクトリ重複解消の運用閉路
- 04c admin backoffice の E2E 完全パス
- 03b-followup-006 `EMAIL_CONFLICT` 月次件数アラートの運用引き渡し

### 内部依存
- `execution_mode=parallel` は wave 分類であり、実行順は **03b 本体 → 04c admin endpoints → 本タスク** の依存を優先する。
- 判定基準 spec → API → merge service → UI → runbook の順で内部 phase 依存を持つ。

## refs

- docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-001-email-conflict-identity-merge.md
- docs/00-getting-started-manual/specs/01-api-schema.md
- docs/00-getting-started-manual/specs/08-free-database.md
- docs/00-getting-started-manual/specs/11-admin-management.md
- docs/00-getting-started-manual/specs/00-overview.md
- apps/api/src/jobs/sync-forms-responses.ts (`classifyError()` の `EMAIL_CONFLICT` 分類)
- apps/api/src/middleware/require-admin.ts
- apps/api/src/routes/admin/identity-conflicts.ts (実装)
- apps/api/src/repository/identity-conflict.ts (実装)
- apps/api/src/repository/identity-merge.ts (実装)
- apps/api/src/services/admin/identity-conflict-detector.ts (実装)
- apps/api/migrations/0010_identity_merge_audit.sql / 0011_identity_aliases.sql / 0012_identity_conflict_dismissals.sql
- packages/shared/src/schemas/identity-conflict.ts (実装)
- apps/web/app/(admin)/admin/identity-conflicts/page.tsx (実装)
- apps/web/src/components/admin/IdentityConflictRow.tsx (実装)

## AC

- 重複候補判定基準（第一段階: `name` 完全一致 AND `affiliation` 完全一致 / `trim` + `NFKC` 許容）が spec として明文化されている → `apps/api/src/services/admin/identity-conflict-detector.ts`
- `GET /admin/identity-conflicts` が `EMAIL_CONFLICT` を起点とした候補一覧を返す（cursor pagination 対応） → `apps/api/src/routes/admin/identity-conflicts.ts`
- `POST /admin/identity-conflicts/:id/merge` が単一 D1 transactional batch で `identity_aliases` /
  `identity_merge_audit` / `audit_log` を atomic に記録する
- `POST /admin/identity-conflicts/:id/dismiss` が当該候補を「別人」として再検出から除外する（`identity_conflict_dismissals` UNIQUE pair）
- merge 実行時に `identity_aliases.source_member_id -> target_member_id` が永続化され、raw response 本文は移動・編集されない
- merge 完了後、`resolveCanonicalMemberId()` 経由で source identity が canonical target に解決される
- merge 完了後、公開 member list / public stats / admin member list では archived source が二重表示されない
- `identity_merge_audit` テーブルに actor / source / target / redacted reason / merged_at / sync_job_id が永続化される
- `audit_log` にも `action='identity.merge'` / `target_type='member'` が永続化される（#13 二重ガード）
- admin UI（`/admin/identity-conflicts`）で候補確認 / merge 二段階確認 / 別人マークができる
- 全 admin endpoint が `requireAdmin` middleware で保護される（不変条件 #11 #13）
- apps/web は D1 直参照せず apps/api 経由（generic proxy `[...path]`）で取得する（不変条件 #5）
- responseEmail は admin UI 上で部分マスク表示（`maskResponseEmail`）し、PII 取扱（不変条件 #3）を遵守する
- merge `reason` 内のメール / 電話番号は `[redacted]` に置換して永続化される

## 13 phases

- [phase-01.md](phase-01.md) — 要件定義
- [phase-02.md](phase-02.md) — 設計
- [phase-03.md](phase-03.md) — 設計レビュー
- [phase-04.md](phase-04.md) — テスト戦略
- [phase-05.md](phase-05.md) — 実装ランブック
- [phase-06.md](phase-06.md) — 異常系検証
- [phase-07.md](phase-07.md) — AC マトリクス
- [phase-08.md](phase-08.md) — DRY 化
- [phase-09.md](phase-09.md) — 品質保証
- [phase-10.md](phase-10.md) — 最終レビュー
- [phase-11.md](phase-11.md) — 手動 smoke / 実測 evidence
- [phase-12.md](phase-12.md) — ドキュメント更新
- [phase-13.md](phase-13.md) — PR 作成

## outputs

実装は完了しており、Phase 1-4 の outputs は実装結果（evidence file path 付き）として実体化済み。
Phase 5-13 の runtime outputs は実機適用 / smoke / PR 段階で更新する。

- outputs/phase-01/main.md (実装済み reflect)
- outputs/phase-02/main.md (実装済み reflect)
- outputs/phase-03/main.md (実装済み reflect)
- outputs/phase-04/main.md (実装済み reflect)
- outputs/phase-05/main.md
- outputs/phase-06/main.md
- outputs/phase-07/main.md
- outputs/phase-08/main.md
- outputs/phase-09/main.md
- outputs/phase-10/main.md
- outputs/phase-11/main.md
- outputs/phase-12/main.md
- outputs/phase-13/main.md

## invariants touched

- #1 schema 固定回避（admin-managed identity merge メタは Google Form schema 外として 3 テーブルに分離）
- #3 PII 取扱（responseEmail は admin UI 上で部分マスク表示 / merge reason の email・電話を redaction）
- #5 D1 直アクセスは apps/api 限定（apps/web は generic proxy `[...path]` 経由のみ）
- #11 管理者も他人本文を直接編集しない（merge は canonical alias / audit のみ、`member_responses` / `response_fields` / `member_status` の本文 column は触らない）
- #13 admin audit logging（`identity_merge_audit` 独立テーブル + `audit_log` への append の二重ガード）

## completion definition

全 phase 仕様書、Phase 11/12 の close-out helper、実装・実測時の evidence path と user approval gate が明確であること。
本サイクルでは実装は既に完了している（Phase 1-4 spec と outputs/phase-01〜04/main.md の整合済み）。
deploy / commit / push / PR 作成は本仕様書作成タスクには含めない。

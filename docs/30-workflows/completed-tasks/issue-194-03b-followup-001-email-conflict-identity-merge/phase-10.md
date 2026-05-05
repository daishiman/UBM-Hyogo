# Phase 10: 最終レビュー — issue-194-03b-followup-001-email-conflict-identity-merge

## 実装区分

[実装区分: 実装仕様書]

実装は既存。本 phase は GO/NO-GO 判定、不変条件再確認、threat model、blocker 一覧を確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | issue-194-03b-followup-001-email-conflict-identity-merge |
| phase | 10 / 13 |
| wave | 04c-fu |
| mode | parallel |
| 作成日 | 2026-05-02 |
| taskType | implementation-spec |
| visualEvidence | VISUAL_ON_EXECUTION |
| 上流 | 03b / 04c / 02a |
| 下流 | 公開ディレクトリ重複解消運用 / 04c admin E2E |

## 目的

Phase 1-9 の整合性、セキュリティ、PII、不変条件 #1 #3 #5 #11 #13 を最終確認し、GO/NO-GO を判定する。

## 実行タスク

1. Phase 1-9 の AC / 実装 / 検証結果の整合性レビュー
2. セキュリティ（require-admin / fail closed / PII マスク）レビュー
3. 簡易 threat model
4. blocker 列挙と GO/NO-GO 判定

## 参照資料

- `docs/30-workflows/issue-194-03b-followup-001-email-conflict-identity-merge/phase-01.md` … `phase-09.md`
- 実装: `apps/api/src/middleware/require-admin.ts`
- 実装: `apps/api/src/routes/admin/identity-conflicts.ts:34` `createAdminIdentityConflictsRoute`

## セキュリティレビュー

- 全 admin endpoint が `require-admin` middleware 配下にマウントされ fail closed（不変条件 #11 #13）
- merge は `member_responses` / `response_fields` / `member_status` への UPDATE を一切行わず、
  `identity_aliases` の canonical 解決と `identity_merge_audit` への append のみ（不変条件 #11 違反防止）
- `audit_log` と `identity_merge_audit` の二重記録で監査痕跡を担保（不変条件 #13）
- responseEmail は `maskResponseEmail` でマスク済みの値のみ API 応答に含める（不変条件 #3）

## 簡易 threat model

| Threat | Mitigation |
| --- | --- |
| 非 admin による merge / dismiss | `require-admin` 403、cookie + email allowlist |
| 誤 merge による identity 損失 | 二段階確認 UI、`reason` 必須、`identity_merge_audit` 永続化 |
| 自己参照 merge（source = target） | `MergeSelfReference` で 400 |
| 既統合 conflict への再 merge | `MergeConflictAlreadyApplied` で 409 |
| dismiss 二重実行 | UNIQUE 制約で 409 |
| PII screenshot 漏洩 | UI 上は常時マスク、`reveal` は audit 必須 |
| free text injection | `reason` 500 文字制限 + redaction、`audit_log.before/after_json` は metadata 限定 |

## 不変条件再確認

- #1 schema 固定回避 — admin-managed 3 テーブルは Google Form schema 外で分離済み
- #3 PII 取扱 — `maskResponseEmail` で API 応答時点でマスク
- #5 D1 直アクセス apps/api 限定 — `apps/web` は `(admin)` ページから API fetch のみ
- #11 管理者も他人本文を直接編集しない — merge は alias + audit のみ、response 本文 column 不変
- #13 admin audit logging — `identity_merge_audit` + `audit_log` の二重記録

## GO/NO-GO 判定

| 観点 | 判定 | 理由 |
| --- | --- | --- |
| 仕様完全性 | GO | AC / failure / runbook / DDL / shared schema / route / UI が揃い |
| 不変条件整合 | GO | #1 #3 #5 #11 #13 違反なし |
| 無料枠 | GO | 上限内 |
| 実装着手準備 | GO | 実装完了済み（migrations 0010-0012 含む） |
| 誤 merge リスク | GO（条件付） | 第一段階は完全一致のみ + 二段階確認 + 監査ログ |

総合: **GO**（PR 作成は user 明示 approval gate あり）

## blocker 一覧

- 03b 本体未マージの場合は実装着手不可（既マージ前提）
- 04c admin auth-router 未完了の場合は require-admin の組み込み不可（既完了前提）
- 03b-followup-003（response_email UNIQUE DDL）未適用の場合は EMAIL_CONFLICT 候補抽出不可
- staging D1 への migration 適用権限が無い場合は manual smoke 不可

## 残課題（scope out）

- E2E（Playwright）: response_fields 付き seed harness が必要なため別タスクで先行整備
- detector の dismissal 統合: `listIdentityConflicts` 内 post-filter で対応、設計維持

## サブタスク管理

- [ ] Phase 1-9 整合性 review
- [ ] セキュリティ / PII / threat model 確認
- [ ] GO/NO-GO 判定を outputs/phase-10/main.md に記録
- [ ] blocker / 残課題を明記

## 成果物

- `outputs/phase-10/main.md`

## 完了条件

- GO/NO-GO 判定が記録されている
- blocker / 残課題が記録されている
- 不変条件再確認が完了している

## タスク100%実行確認

- [ ] この Phase の必須セクションがすべて埋まっている
- [ ] 実装に対する review であり、コード変更を行っていない
- [ ] commit / push / PR を実行していない

## 次 Phase への引き渡し

Phase 11 へ、GO 判定、blocker、approval gate を渡す。

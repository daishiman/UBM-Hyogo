# Phase 11: 手動テスト検証（NON_VISUAL）

> **CONST_004 / CONST_005 準拠の実装仕様書**。本ドキュメントは production runtime smoke の取得手順と evidence 配置を確定するための spec であり、コード実装そのものは含まない（実装手順の記述は必須）。

## メタ情報
| 項目 | 値 |
| --- | --- |
| Source | `outputs/phase-11/phase-11.md` |
| visualEvidence | NON_VISUAL |
| 状態語彙 | spec 段階: `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` / `blocked_runtime_evidence_pending` / production smoke 完遂後: `PASS_RUNTIME_VERIFIED` |
| 親 Issue | #572（CLOSED） |
| 関連 Issue | #531 / #371 / #571（すべて CLOSED） |
| taskType | implementation |

## 目的
production で `/admin/members*` および `/me*` の read-only GET smoke を PASS させ、issue-371 を `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` から `PASS_RUNTIME_VERIFIED` / `completed` に昇格する。DI-bound evidence として `.attendance | type == "array"` を `/admin/members/:memberId` と `/me/profile` の双方で確認する。evidence は summary-only（session cookie / Bearer / cf-* token / OAuth secret / email / fullName 実値除外）で構成する。

## 実行タスク
詳細は `outputs/phase-11/phase-11.md` を正本とする。

## 統合テスト連携
本 Phase が attendanceProvider DI 完了化の NON_VISUAL production runtime smoke 統合検証ポイントである。staging では既に boundary-synced 確認済みであり、本 Phase は **production 環境 GET smoke** のみが対象。

## 参照資料
- `outputs/phase-11/phase-11.md`
- 親 Issue #371（attendanceProvider DI 完了化）
- `apps/api/src/routes/admin/members.ts` / `apps/api/src/routes/me/index.ts`
- `scripts/cf.sh`

## 成果物
- `outputs/phase-11/phase-11.md`
- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/build.log`
- `outputs/phase-11/evidence/grep-gate.log`
- `outputs/phase-11/production-smoke-summary.md`
- `outputs/phase-11/redact-filter-zero-hit.log`
- `outputs/phase-11/wrangler-binding-diff.md`
- `outputs/phase-11/user-approval-evidence.md`

## 完了条件
- production GET smoke が `/admin/members*` および `/me*` で PASS（DI-bound evidence: `.attendance | type == "array"` を双方で確認）。
- redact filter zero-hit を `redact-filter-zero-hit.log` で確認（cookie / Bearer / cf-* / OAuth secret / email / fullName 実値の grep gate 0 件）。
- 親 Issue #371 を `PASS_RUNTIME_VERIFIED` / `completed` に昇格する PR が作成済（commit hash を `production-smoke-summary.md` に記録）。
- user 明示承認 evidence が `user-approval-evidence.md` に summary-only でキャプチャ済。
- production smoke 完遂までは `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`、完遂後に `PASS_RUNTIME_VERIFIED` へ遷移し、`PASS` 単独表記は使用しない。

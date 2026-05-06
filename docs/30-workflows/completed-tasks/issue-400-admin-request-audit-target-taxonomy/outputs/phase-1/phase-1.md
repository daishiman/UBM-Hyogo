# Phase 1: 要件定義 / taskType・visualEvidence 確定

## taskType / visualEvidence

| 項目 | 値 | 根拠 |
| --- | --- | --- |
| taskType | implementation | TS enum / route audit value / test 期待値 / UI placeholder の実コード変更を伴う |
| visualEvidence | NON_VISUAL | UI 変更は placeholder 文言のみで挙動・スクリーンショット差分は本タスクの完了条件ではない |
| docs-only? | No | CONST_004 デフォルト適用。Issue ラベル `enhancement` / `type:improvement` が示唆する filter 精度改善は実コード変更で達成 |

## 要件（Acceptance Criteria）

| ID | 要件 | 検証方法 |
| --- | --- | --- |
| AC-1 | admin request resolution 時の新規 audit 行は `target_type='admin_member_note'` で append される | requests.test.ts: resolve 後に SELECT で確認 |
| AC-2 | 既存 `target_type='member'` 行が `/admin/audit` で読み取り可能 | audit.test.ts: 既存 fixture 行の listFiltered で行数を維持 |
| AC-3 | `/admin/audit?targetType=admin_member_note` filter が新規行のみを返す（member 一般変更は混在しない） | audit.test.ts: 新旧両方 fixture を入れて分離確認 |
| AC-4 | `AuditTargetType` TS 型に `admin_member_note` が含まれ、`append({targetType:'member',...})` も型エラーにならない（後方互換） | auditLog.test.ts + tsc |
| AC-5 | shared zod の audit `targetType` schema は `string` 受容を維持しつつ docs に enum 値の正規一覧を残す | viewmodel.ts コメント / docs |
| AC-6 | UI placeholder（AuditLogPanel）は新 type を例示する形に更新される（最小） | AuditLogPanel.test.tsx の placeholder 検証（必要に応じ追加） |

## 不変条件

- 既存行の DB migration を行わない（CONST: migration-safe）
- audit_log は append-only（既存不変条件 #6 を継続）
- `note_id` を `target_id` に格納し、`memberId` は `after_json` で保持（PII 不混入ルール継続）

## 完了条件

- 要件 AC-1〜6 を本仕様書に記載済み
- artifacts.json `metadata.visualEvidence=NON_VISUAL` を反映済み

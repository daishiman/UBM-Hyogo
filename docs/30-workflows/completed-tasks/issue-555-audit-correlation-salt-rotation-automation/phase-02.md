# Phase 2: dual-hash データモデル設計 / 永続化 schema 影響判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 2 / 13 |
| Source | `outputs/phase-2/phase-2.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

`NormalizedAuditEvent bridge shape` に `fingerprintVersion: 1 | 2` と `fingerprintHashes?: { v1?: string, v2?: string }` を導入する型拡張を確定し、親タスク FU-01 が D1 永続化を実装済か否かを再確認した上で migration の要否（追加するなら次番号、不要なら spec-only 記録）を判定する。canonical hash 入力組合せ（email-based + IP 急変検知両立）を Phase 1 確定値に紐づけて再固定する。

## 実行タスク

詳細は `outputs/phase-2/phase-2.md` を正本とする。要点:

- `NormalizedAuditEvent bridge shape` 型拡張案: `fingerprintVersion: 1 | 2`、`fingerprintHashes?: { v1?: string, v2?: string }`、`legacyHash` 廃止可否
- 永続化 (D1 `incident_records` 等) 影響調査: 親 FU-01 が永続化未実装ならば本タスクで migration 追加せず spec-only 記録
- migration 番号確定（追加時のみ）: `apps/api/migrations/` 既存最大番号を `ls` で確認 → 次番号採番（例: `0016_audit_correlation_fingerprint_version.sql`）
- canonical hash 入力組合せ（email-based 方式維持）の再確認と、rotation 跨ぎの正規化規則
- v1 → v2 migration 時の既存 record バックフィル方針（None: 過去 record は v1 のまま、新規 record のみ v2）

## 統合テスト連携

Phase 4 の vitest シナリオで、`NormalizedAuditEvent bridge shape.fingerprintVersion` および `fingerprintHashes.v1 / v2` の出現条件を assertion する。Phase 6 redact 実装が本 phase の型 skeleton と整合することを test で gate する。

## 参照資料

- `apps/api/src/audit-correlation/redact.ts`（存在時 / 親 FU-01）
- `apps/api/src/audit-correlation/types.ts`（存在時）
- `apps/api/migrations/`（既存番号確認）
- `outputs/phase-1/phase-1.md`

## 成果物

- `outputs/phase-2/phase-2.md`

## 完了条件

- `NormalizedAuditEvent bridge shape` 型拡張が確定し、永続化 schema 影響有無が判定され、migration 必要時のみ番号採番された skeleton が記述されている（不要時は不要判定の根拠を記録）。

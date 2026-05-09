# Phase 1: 要件定義 / production smoke の不可侵条件確定 / GO 判定

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| Source | `outputs/phase-1/phase-1.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 状態 | pending |

## 目的

production runtime smoke の不可侵条件（evidence summary-only / shell 履歴漏洩防止 / API URL 取り違え検出 / redact filter 拡張要件 / user 明示承認 gate）を SSOT として確定し、Phase 2（スコープ確定）着手の GO/NO-GO を判定する。

## 実行タスク

詳細は `outputs/phase-1/phase-1.md` を正本とする。要点:

- 不可侵条件 5 件（evidence summary-only / shell 履歴非保持 / API URL guard / redact filter production 拡張 / user 承認 gate）の確定
- DI-bound evidence の jq filter 仕様（`type == "array"` / `length` / `keys_count` のみ抽出、body 値非保持）
- 上流前提（issue-371 / issue-531 / issue-571 が CLOSED 状態であること）の確認手順
- 含む / 含まない（write 系 smoke 不可、新規 endpoint 不可、D1 schema 変更不可）の固定

## 統合テスト連携

Phase 4 / 10 で、redact filter が production 固有 pattern に対して 0 hit を保証する fixture test を設計する。Phase 1 で確定した不可侵条件は、すべて test またはスクリプト内 guard として実装される。

## 参照資料

- Issue #572 本文（CLOSED）
- Issue #371 / #531 / #571 の各 spec
- `apps/api/scripts/runtime-smoke/` 既存 staging smoke スクリプト群

## 成果物

- `outputs/phase-1/phase-1.md`

## 完了条件

- 不可侵条件 5 件と DI-bound evidence 仕様が SSOT として確定し、Phase 2 着手 GO/NO-GO 判定基準が記載されている。

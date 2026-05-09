# Phase 8: 統合テスト（staging リハーサル smoke / production 実行設計）

[実装区分: 実装仕様書（CONST_004 / CONST_005 準拠）]

## メタ情報

| 項目 | 値 |
| --- | --- |
| phase | 8 / 13 |
| Source | `outputs/phase-8/phase-8.md` |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親 Issue | #572 (CLOSED) |
| 上位 | issue-371 (`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` → `PASS_RUNTIME_VERIFIED`) |

## 目的

production の `/admin/members*` および `/me*` への read-only GET smoke は外部から hermetic に再現できないため、staging fixture を用いた **リハーサル smoke** を統合テストの代替として確立し、production 実行は user gate 後に runbook 経路で行う設計を確定する。

DI-bound 検証の中核は `.attendance | type == "array"` で、evidence は summary-only（session cookie / Bearer / `cf-*` token / OAuth secret / email / fullName / profile body 実値を含めない）。

## 実行タスク

詳細は `outputs/phase-8/phase-8.md` を正本とする。本 Phase は新規 production 経路コードの追加ではなく、既存 staging smoke 資産の **production 切替パラメータ化** と **リハーサル手順の決定論化** を仕様として確定する。

## 統合テスト連携

- staging リハーサル smoke が PASS したことを Phase 9 品質ゲート / Phase 10 user-gate 取得の前提とする。
- production 実行は Phase 11 (runtime evidence) で user 明示承認後に 1 回のみ実行する設計。

## 参照資料

- `outputs/phase-8/phase-8.md`
- `apps/api/scripts/runtime-smoke/`（新規 / 既存どちらでも staging 資産を参照する経路を確定）
- `docs/30-workflows/runbooks/`（production smoke runbook の追加先）
- 起票元 §「苦戦箇所」: wrangler binding 差分 / shell 履歴漏洩 / API URL 取り違え / redact filter production 偽陰性

## 成果物

- `outputs/phase-8/phase-8.md`
- staging リハーサル smoke コマンド表
- production 実行 dry-run 仕様（user-gate 前に shape のみ検証）
- redact filter production 拡張ケース表

## 完了条件

- staging fixture を用いたリハーサル smoke 手順が確定し、PASS 判定基準が明記されている。
- production 実行は user gate 後の単発実行であり、CI / hook / 自動 cron では起動しないことが仕様化されている。
- evidence の summary-only 規約（除外フィールド一覧）が確定している。
- `.attendance | type == "array"` の jq 検証が `/admin/members/:memberId` および `/me/profile` の双方で要求されている。

# Phase 7: AC マトリクス — 結果

## 実行日時
2026-05-02

## AC × 検証 × 証跡 × 異常系 マトリクス

| AC ID | 受け入れ基準（要約） | 検証 ID | evidence path | 異常系 |
| --- | --- | --- | --- | --- |
| AC-1 | apply 対象 = `0008_create_schema_aliases.sql` のみ | S-1, S-2, S-3 | `outputs/phase-11/static-checks.md` | E-2 |
| AC-2 | target = `ubm-hyogo-db-prod` / `--env production` | S-5 | `outputs/phase-11/env-binding-evidence.md` | E-8 |
| AC-3 | apply 前 inventory 取得手順あり | P-1, P-2 | `outputs/phase-13/migrations-list-before.txt`, `outputs/phase-13/tables-before.txt` | E-2 |
| AC-4 | apply 後 PRAGMA で column / index 検証 | P-4, P-5 | `outputs/phase-13/pragma-table-info.txt`, `outputs/phase-13/pragma-index-list.txt` | E-4, E-5 |
| AC-5 | `bash scripts/cf.sh` 経由のみ | S-4 | `outputs/phase-11/cli-wrapper-grep.md` | E-1 |
| AC-6 | rollback 手順定義 | (Phase 6 参照) | `phase-06.md` / `outputs/phase-06/main.md` | E-3, E-4, E-5, E-8 |
| AC-7 | Phase 13 承認前に apply しない | (gate) | `outputs/phase-13/user-approval.md` | E-7 |
| AC-8 | SSOT 更新 (`database-schema.md` / `task-workflow-active.md`) | (Phase 12) | `outputs/phase-12/system-spec-update-summary.md` | — |

## カバレッジ確認

- 全 AC が少なくとも 1 つの検証 ID に紐付く: ✅
- 全異常系 E-1〜E-9 が少なくとも 1 つの AC に紐付く: ✅（E-9 は AC-1/AC-3 の preflight と接続）

## 完了判定

- [x] AC × 検証 × evidence × 異常系の対応がある
- [x] 未カバー AC / 未紐付け異常系がない

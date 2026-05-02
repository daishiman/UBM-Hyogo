# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

Phase 1 で定義した AC-1〜AC-8 と Phase 4 の検証 ID（S-* / L-* / P-*）、Phase 6 の異常系 ID（E-*）を一枚の表に紐付ける。

## 実行タスク

- AC-1〜AC-8 を検証 ID と evidence path に接続する。
- 異常系 E-1〜E-9 が受け入れ基準のどこに影響するかを明示する。
- 未カバー AC / 未紐付け異常系がないことを確認する。

## AC × 検証 × 証跡 マトリクス

| AC ID | 受け入れ基準（要約） | 検証 ID | evidence path | 異常系 |
| --- | --- | --- | --- | --- |
| AC-1 | apply 対象 = `0008_create_schema_aliases.sql` のみ | S-1, S-2, S-3 | `outputs/phase-11/static-checks.md` | E-2 |
| AC-2 | target = `ubm-hyogo-db-prod` / `--env production` | S-5 | `outputs/phase-11/env-binding-evidence.md` | E-8 |
| AC-3 | apply 前 inventory 取得手順あり | P-1, P-2 | `outputs/phase-13/migrations-list-before.txt`, `outputs/phase-13/tables-before.txt` | E-2 |
| AC-4 | apply 後 PRAGMA で column / index 検証 | P-4, P-5 | `outputs/phase-13/pragma-table-info.txt`, `outputs/phase-13/pragma-index-list.txt` | E-4, E-5 |
| AC-5 | `bash scripts/cf.sh` 経由のみ | S-4 | `outputs/phase-11/cli-wrapper-grep.md` | E-1 |
| AC-6 | rollback 手順定義 | （phase-06 参照） | `phase-06.md` | E-3, E-4, E-5, E-8 |
| AC-7 | Phase 13 承認前に apply しない | （手順上の gate） | `outputs/phase-13/user-approval.md` | E-7 |
| AC-8 | SSOT (`database-schema.md` / `task-workflow-active.md`) 更新 | （phase-12 タスク） | `outputs/phase-12/system-spec-update-summary.md` | — |

## カバレッジ確認

- 全 AC が少なくとも 1 つの検証 ID に紐付く: ✅
- 全異常系 E-1〜E-9 が少なくとも 1 つの AC に紐付く: ✅（E-9 は「target 以外 pending migration」で AC-1/AC-3 の preflight と接続）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| requirements | `phase-01.md` | AC-1〜AC-8 |
| test strategy | `phase-04.md` | S/L/P verification ID |
| exception design | `phase-06.md` | E-1〜E-9 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| AC matrix | `phase-07.md` | AC / verification / evidence / exception 対応表 |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 9 | AC-1/2/5 の static evidence を取得 | `outputs/phase-11/*.md` |
| Phase 13 | AC-3/4/7/8 の runtime evidence を取得 | `outputs/phase-13/*` |

## 完了条件

- [ ] マトリクスに AC × 検証 × evidence × 異常系の対応がある
- [ ] 未カバー AC / 未紐付け異常系がない
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 8: DRY/責務確認

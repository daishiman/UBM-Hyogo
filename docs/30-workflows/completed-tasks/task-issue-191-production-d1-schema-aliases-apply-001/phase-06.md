# Phase 6: 異常系設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 6 |
| 機能名 | task-issue-191-production-d1-schema-aliases-apply-001 |
| visualEvidence | NON_VISUAL |

## 目的

production D1 apply で発生し得る異常系を列挙し、検知 / 対応 / rollback を確定する。

## 実行タスク

- Cloudflare auth / inventory / apply / PRAGMA / approval evidence の失敗ケースを列挙する。
- rollback DDL を参照用として分離し、実行には追加承認が必要であることを明示する。
- completed 化してよい条件とユーザーへエスカレーションする条件を分ける。

## 異常系マトリクス

| ID | 状況 | 検知 | 一次対応 | rollback / 復旧 |
| --- | --- | --- | --- | --- |
| E-1 | `bash scripts/cf.sh whoami` 失敗（API token 不正 / op 未認証） | exit code != 0 | apply 経路停止。`op` 認証 / 1Password Vault の `CLOUDFLARE_API_TOKEN` を確認 | 再実行のみ。state 変化なし |
| E-2 | apply 前 inventory で `schema_aliases` が既に存在 | `tables-before.txt` に hit | 状態調査（誰がいつ apply したか）。本タスクの apply は実行せず Phase 13 で報告 | 必要に応じてユーザーへエスカレーション |
| E-3 | `migrations apply` 中にネットワーク失敗 | log にエラー + non-zero exit | 即座に `migrations list` を再実行し apply 状態を確認。partial apply の有無を判断 | partial の場合も rollback / re-apply は追加ユーザー承認まで実行しない |
| E-4 | apply 後 PRAGMA で必須 column 不一致 | `pragma-table-info.txt` に欠損 | apply 失敗扱い。差分原因（migration ファイル drift）を調査 | rollback DDL は下記を参照し、追加承認後にのみ実行 |
| E-5 | apply 後 PRAGMA で index 数 ≠ 3 | `pragma-index-list.txt` の行数不一致 | 不足 index の原因を調査。個別 SQL / table drop のどちらも追加承認対象 | 同 E-4 |
| E-6 | apply 完了したが `migrations list` に applied 反映なし | `migrations-list-after.txt` で未反映 | Cloudflare の eventual consistency を考慮し 30 秒後再取得。それでも未反映なら Cloudflare サポートチケット | state 変化があれば手動 sync |
| E-7 | ユーザー承認テキストが Phase 13 evidence に未記録 | evidence 不在 | apply 経路を中断 | 再承認取得 |
| E-8 | 誤って `--env production` 以外で apply 実行 | log の environment 表示 | 即座に停止し、対象 environment / applied migration / table state を記録してユーザーへ報告 | `DROP TABLE` や re-apply は追加の明示承認後にのみ実行 |
| E-9 | apply 前 migration list で target 以外の pending migration を検出 | `migrations-list-before.txt` に `0008_create_schema_aliases.sql` 以外の unapplied 行 | apply を実行せず NO-GO。対象外 migration の扱いを別途判断 | state 変化なし |

## rollback DDL（参照用）

以下は緊急時の検討材料であり、本 Phase では実行しない。Phase 13 で apply 後に不整合が検出された場合でも、破壊的 rollback はユーザーへ状況・影響・DDL を提示し、追加の明示承認を得てから実行する。

```sql
-- E-4 / E-5 / E-8 共通の rollback
DROP INDEX IF EXISTS idx_schema_aliases_revision_question_unique;
DROP INDEX IF EXISTS idx_schema_aliases_revision_stablekey_unique;
DROP INDEX IF EXISTS idx_schema_aliases_stable_key;
DROP TABLE IF EXISTS schema_aliases;
```

## エスカレーション基準

- partial apply / state drift / index 欠損が解決できない場合は、ユーザーに即報告し apply 完了扱いにしない。
- 本タスクの apply は冪等 (`IF NOT EXISTS`) なため、再実行は基本安全。ただし PRAGMA 結果が期待と一致するまで `completed` には移行しない。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| implementation plan | `phase-05.md` | runbook / evidence path |
| migration SSOT | `apps/api/migrations/0008_create_schema_aliases.sql` | rollback 対象の table / index |
| Phase 13 approval gate | `.claude/skills/task-specification-creator/references/phase-template-phase13.md` | destructive follow-up の承認境界 |

## 成果物

| 成果物 | パス | 説明 |
| --- | --- | --- |
| exception matrix | `phase-06.md` | E-1〜E-9 と escalation / rollback boundary |

## 統合テスト連携

| 連携先 | 確認内容 | evidence |
| --- | --- | --- |
| Phase 7 | AC matrix の failure mode へ接続 | `phase-07.md` |
| Phase 13 | failure 時の中断 / 報告 / 追加承認判断 | `outputs/phase-13/migrations-apply.log` |

## 完了条件

- [ ] E-1〜E-9 が検知 / 一次対応 / rollback まで定義されている
- [ ] rollback DDL が実行可能な形で記載されている
- [ ] 本Phase内の全タスクを100%実行完了

## 次Phase

Phase 7: ACマトリクス

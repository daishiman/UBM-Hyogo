# Phase 7: AC マトリクス

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 7 |
| status | `done` |

## 目的

AC-1〜AC-9 を検証 Phase と evidence path に対応付ける。

## 実行タスク

- 各 AC の検証手段を明示する。
- 未実行 evidence を pending follow-up として分類する。

## 参照資料

- `index.md`
- `phase-04.md`
- `phase-11.md`

## 統合テスト連携

統合テスト相当の確認は Phase 11 の NON_VISUAL evidence に集約する。

## トレーサビリティ

| AC | 検証 Phase | 検証手段 | 成果物 | 状態 |
| --- | --- | --- | --- | --- |
| AC-1: spec doc に「UNIQUE は `member_identities` 側のみ」明示 | Phase 4 / 5 | `grep "正本 UNIQUE" database-schema.md` | outputs/phase-11/grep-spec.md | gate defined / pending follow-up execution |
| AC-2: 0001 `member_responses.response_email` 行に UNIQUE 不在コメント | Phase 4 / 5 | `grep "UNIQUE は付与しない" 0001_init.sql` | outputs/phase-11/grep-0001.md | gate defined / pending follow-up execution |
| AC-3: 0001 `member_identities.response_email` 行に正本コメント | Phase 4 / 5 | `grep "正本 UNIQUE" 0001_init.sql` | outputs/phase-11/grep-0001.md | gate defined / pending follow-up execution |
| AC-4: 0005 既存コメントと文言整合 | Phase 4 / 6 | `diff` 比較 | outputs/phase-11/diff-0001-0005.md | gate defined / pending follow-up execution |
| AC-5: SQL semantic diff = 0 | Phase 4 | `git diff` 検証 | outputs/phase-11/sql-semantic-diff.md | gate defined / pending follow-up execution |
| AC-6: typecheck / lint PASS | Phase 4 / 5 | `pnpm typecheck && pnpm lint` | outputs/phase-11/quality-gates.md | gate defined / pending follow-up execution |
| AC-7: D1 migration hash drift なし | Phase 6 | `cf.sh d1 migrations list` | outputs/phase-11/migration-list.md | gate defined / pending follow-up execution |
| AC-8: 検出表 #4 訂正記録 | Phase 12 | 本 workflow Phase 12 main.md に正本記録 | outputs/phase-12/main.md | gate defined / pending follow-up execution |
| AC-9: skill 検証 4 条件 PASS | Phase 3 / 10 | レビューチェック | outputs/phase-10/main.md | COVERED_BY_PLANNED_TEST |

## 完了条件

- [x] 全 AC が Phase へマッピングされている
- [x] 検証手段とコマンドが特定されている
- [x] 成果物パスが宣言されている（実体は Phase 11 / 12 実行時に作成）

## 成果物

- `outputs/phase-07/main.md`: 本マトリクスのコピー

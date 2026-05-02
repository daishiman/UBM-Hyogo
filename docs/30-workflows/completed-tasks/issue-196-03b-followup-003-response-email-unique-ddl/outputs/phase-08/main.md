# Phase 8: DRY 化

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 8 |
| status | `done` |

## 目的

正本 UNIQUE 文言を重複させすぎず、必要な参照経路だけに集約する。

## 実行タスク

- 共通語彙を確認する。
- 不要な新規セクションや重複表を避ける。

## 参照資料

- `phase-02.md`
- `phase-12.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 統合テスト連携

DRY レビューのみ。実測 evidence は Phase 11 に委譲する。

## DRY 観点レビュー

### 1. 文言の共通化

「正本 UNIQUE = `member_identities.response_email`」を 3 ファイルで同一文言テンプレ（Phase 2）にしているため、文字列差異による grep 漏れが起きない。

| 箇所 | キーワード |
| --- | --- |
| `database-schema.md` 行 50 | `UNIQUE 制約は付与しない` / `正本 UNIQUE` |
| `database-schema.md` 行 51 | `正本 UNIQUE` |
| `0001_init.sql` 行 54 周辺 | `UNIQUE は付与しない` / `正本 UNIQUE` |
| `0001_init.sql` 行 90 周辺 | `正本 UNIQUE` |
| `0005_response_sync.sql` 行 7 | `正本 UNIQUE` |

### 2. 不要な重複の排除

- `database-schema.md` に「主要 UNIQUE 一覧表」が既存する場合は 1 行追加のみ。新たに別表を作らない。
- `0001_init.sql` の SQL コメントは行 54 / 90 の **2 箇所のみ**。CREATE TABLE 全体の冒頭にも書くと冗長になるため避ける。

### 3. spec / コード間の同期方針

将来の更新（例: `member_identities` テーブルの責務変更時）に文言が片側だけ更新されるリスクを軽減するため、`lessons-learned-03b-response-sync-2026-04.md` に「UNIQUE 所在を変更する場合は spec doc + 0001 + 0005 の 3 箇所同時更新が必要」と一文追加することを Phase 12 で検討する。

## 完了条件

- [x] 文言テンプレートが Phase 2 / 5 / 8 で一貫している
- [x] 重複セクション新設の否定が明示されている
- [x] 将来同期リスクへの対処が Phase 12 へ移譲されている

## 成果物

- `outputs/phase-08/main.md`: 本 DRY 化記録のコピー

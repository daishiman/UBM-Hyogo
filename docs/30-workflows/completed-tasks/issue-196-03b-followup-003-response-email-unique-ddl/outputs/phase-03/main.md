# Phase 3: 設計レビュー

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 3 |
| status | `done` |

## 目的

Phase 2 の設計案をレビューし、スキーマ変更なしで UNIQUE 所在を正本化できることを確認する。

## 実行タスク

- 代替案を比較する。
- 採用案の 4 条件を再評価する。

## 参照資料

- `phase-02.md`
- `apps/api/migrations/0001_init.sql`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 統合テスト連携

設計レビューのみ。検証実行は Phase 11 に委譲する。

## 代替案検討

| 案 | 内容 | 判定 | 理由 |
| --- | --- | --- | --- |
| A. spec doc のみ更新 | DDL コメントは触らない | MINOR REJECT | ソースを grep で読んだ実装者が UNIQUE 所在を判断できず、再ドリフト発生 |
| B. DDL コメントのみ更新 | spec doc は触らない | MINOR REJECT | aiworkflow-requirements skill 経由で参照する側に届かない |
| C. spec + DDL コメント両方更新（採用） | 両方を共通語彙で統一 | PASS | 両経路（仕様参照 / コード参照）から到達可能 |
| D. `member_responses(response_email)` への partial UNIQUE 追加 | 履歴行に重複防止を加える | REJECT | 履歴行の不変条件違反。同一 email から複数 response が時系列で発生する設計と矛盾 |
| E. migration 新設で UNIQUE 制約を再宣言 | `ALTER TABLE` で UNIQUE 再表明 | REJECT | 既に `0001_init.sql` で宣言済み。重複宣言は migration drift / hash 不整合のリスク |

## レビューポイント

1. **`member_responses` 履歴行性の確認**: spec / コードに「履歴行」と明示する箇所があるか確認 → `database-schema.md` 既存行 50 で「`response_id` 単位の履歴」と既に記述されており整合。
2. **0005 既存コメントとの整合**: 「再宣言なし」を「正本 UNIQUE が宣言済み（再宣言・再付与なし）」へリファインすることで、0001 側の「正本」コメントと共通語彙化される。
3. **Phase 12 検出表 #4 の取り扱い**: `completed-tasks/03b-.../phase-12/unassigned-task-detection.md` は履歴のため改ざん禁止。本 workflow Phase 12 で「正本: `member_identities`」訂正を新規記録する。

## 4 条件再評価

| 条件 | 状態 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 採用案 C は `0001_init.sql` の現行 SQL と一致 |
| 漏れなし | PASS | 編集 3 ファイル、訂正 1 仕様参照（検出表）すべて Phase で扱う |
| 整合性 | PASS | 共通語彙（"正本 UNIQUE = member_identities.response_email"）で全箇所統一 |
| 依存関係 | PASS | 上流 03b workflow / 下流 01a 連携を `index.md` に明記 |

## 判定

**PASS** — 採用案 C で Phase 4 以降に進む。

## 完了条件

- [x] 代替案が比較されている
- [x] 採用案が 4 条件で評価されている

## 成果物

- `outputs/phase-03/main.md`: 本レビュー結果のコピー

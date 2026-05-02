# Phase 1: 要件定義

[実装区分: 実装仕様書 / NON_VISUAL]

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow | `issue-196-03b-followup-003-response-email-unique-ddl` |
| phase | Phase 1 |
| status | `done` |

## 目的

`response_email` UNIQUE 制約の所在ドリフト（spec / 検出表 上は `member_responses` 側、実態は `member_identities` 側）を、DDL コメントと spec doc の正本化により恒常的に解消する。

## 真の論点

- 「UNIQUE はどこにあるのか」は実装時の調査対象になり続けている。`0001_init.sql:90` で確定しているが、spec doc / 検出表に反映されていないため毎回 SQL を grep する状態。
- `member_responses.response_email` は履歴行であるため UNIQUE であってはならない。この設計判断（同一 email から複数 response が時系列で追加される）を spec に明記しないと、今後「`member_responses` にも UNIQUE が必要では?」という誤った提案が再発するリスクがある。

## 因果と境界

- 原因: 検出表 #4 の文言が誤って `member_responses.response_email` を指していた → spec doc 側にも UNIQUE 所在の明示記述がなく、検出表が誤りである根拠を当時参照できなかった。
- 境界: 本タスクは「spec 文言と DDL コメントの正本化」までで、CREATE TABLE 構造変更や migration 追加は範囲外。

## 価値とコスト

- 価値: 今後の DB 仕様調査コストを削減。`member_responses` への誤った UNIQUE 追加提案を未然に阻止。
- コスト: 文言編集のみで実装コスト極小。production D1 への影響なし。

## 実行タスク

- UNIQUE 所在ドリフトの原因と境界を定義する。
- `taskType` / `visualEvidence` / `workflow_state` を artifacts.json と同期する。

## 参照資料

- `apps/api/migrations/0001_init.sql`
- `apps/api/migrations/0005_response_sync.sql`
- `.claude/skills/aiworkflow-requirements/references/database-schema.md`

## 統合テスト連携

本 Phase は仕様定義のみ。統合テストは Phase 11 の NON_VISUAL evidence container で実装 follow-up 時に取得する。

## artifacts.json metadata（Phase 1 必須）

| キー | 値 |
| --- | --- |
| `taskType` | `implementation` |
| `visualEvidence` | `NON_VISUAL` |
| `workflow_state` | `implemented-local-static-evidence-pass` |

## 4 条件評価

| 条件 | 状態 | 根拠 |
| --- | --- | --- |
| 矛盾なし | OK | 既存 SQL（`0001_init.sql:90`）と本タスクの正本化方針が一致 |
| 漏れなし | OK | 編集対象 3 ファイル（spec doc / 0001 / 0005）を全て列挙 |
| 整合性 | OK | aiworkflow-requirements skill と本仕様書で同一文言を採用 |
| 依存関係 | OK | 上流 03b workflow / 0001 / 0005 を参照、下流影響なし |

## 完了条件

- [x] 受入条件 AC-1 〜 AC-9 が `index.md` に定義されている
- [x] 編集対象ファイル 3 件が `artifacts.json.changeTargets` に列挙されている
- [x] 後続 Phase が参照する語彙（"正本 UNIQUE = `member_identities.response_email`" / "`member_responses` は履歴行で UNIQUE なし"）が確定している

## 成果物

- `outputs/phase-01/main.md`: 本要件定義（コピー先）

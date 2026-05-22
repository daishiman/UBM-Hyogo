# serial-05 step-03 schema alias recompute trigger - タスク指示書

## メタ情報

| 項目 | 内容 |
| --- | --- |
| タスクID | serial-05-step-03-followup-005-schema-alias-recompute-trigger |
| タスク名 | Schema alias rollback 後の集計再実行トリガー |
| 分類 | follow-up / aggregation consistency |
| 対象機能 | `/admin/schema` rollback 後の再集計 |
| 優先度 | 中 |
| ステータス | pending |
| 発見元 | `docs/30-workflows/issue-778-schema-alias-rollback-undo/` |
| 発見日 | 2026-05-19 |

## なぜこのタスクが必要か

Issue #778 の rollback / undo 本体は、誤 resolve を API + audit log 経由で取り消す経路を提供する。一方で、既に集計済みの表示や派生テーブルがある場合、alias row の soft delete だけでは過去に計算された集計結果は自動では変わらない。

rollback modal では「影響応答件数」と「再集計要否」を表示するが、再集計の実行方式は集計 view の正本仕様が複数候補のため本体タスクから分離する。

## スコープ

### 含む

- rollback 後に必要な再集計対象の定義
- admin actor が明示的に再集計を実行できる API / UI / job contract
- audit log への再集計実行記録
- staging runtime evidence

### 含まない

- rollback / undo 本体の UI / API（Issue #778 workflow に含む）
- bulk rollback
- notification policy

## 受入条件

- 再集計対象が stableKey / aliasId / affected response count で特定できる
- 再集計実行は admin API + audit log を通る
- rollback 直後に自動実行せず、admin actor の明示操作または明示 job trigger とする
- runtime evidence で rollback → recompute → affected view の整合を確認する

## 参照

- `docs/30-workflows/issue-778-schema-alias-rollback-undo/`
- `docs/30-workflows/unassigned-task/serial-05-step-03-followup-004-schema-alias-rollback-undo.md`

## 苦戦箇所【記入必須】

- 再集計の idempotency 設計: 同一 rollback に対する重複 trigger を安全に吸収する必要がある（同 aliasId × revision の二重実行で派生 view が二重カウントしないこと）。
- 再集計範囲の決定: 全件再集計か、影響 stableKey / revision 単位か、affected response 単位かで cost と整合性が変わる。本体タスクで未確定のため設計判断が必要。
- `schema_diff_queue` および派生集計 view の状態遷移と rollback タイミングの race: rollback 進行中に新規 resolve が走ったケースの順序保証。
- admin actor 明示操作と job trigger の二経路に対する audit log の意味付け統一。
- 再集計失敗時の partial 状態を可視化する UI / API 表現（pending / running / failed）。

## リスクと対策

- リスク: 重複集計による派生 view の不整合 → 対策: aliasId × revision × triggerKey を unique key として持ち、idempotent に処理する。
- リスク: rollback 後に再集計が忘れられて表示が古いまま残る → 対策: rollback modal 上に「再集計未実行」バッジを表示し、未実行件数を audit で集計可能にする。
- リスク: 大量 response の再集計による runtime timeout → 対策: 再集計を chunk 単位で進捗を audit log に残し、再開可能にする。
- リスク: 並列 resolve と再集計の race による集計漏れ → 対策: 再集計対象 revision を trigger 時点でスナップショットし、以降の更新は別 trigger に委ねる。

## 検証方法

- unit: idempotency test（同一 triggerKey で 2 回実行しても派生 view が変わらない）。
- contract: admin API の re-compute endpoint が affected count / status を返すこと。
- integration: rollback → 明示 trigger → 派生 view 反映の順序が audit log で追跡できる。
- E2E (staging): rollback 直後は派生 view が rollback 前のままで、trigger 実行後に整合することを runtime evidence として記録。
- failure path: 再集計を意図的に失敗させ、status=failed が audit log と UI に表示されることを確認。

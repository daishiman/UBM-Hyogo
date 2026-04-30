# Phase 3 補助: 代替案詳細

## Alternative A: schema_aliases 専用テーブル新設（Phase 2 推奨）

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #1 | PASS | alias を独立 source に分離 |
| 03a 冪等性 | PASS | 03a は read-only |
| 出自追跡 | PASS | resolved_by / resolved_at / source 保持 |
| 移行容易性 | MINOR | fallback 期間の二重 source 運用ルールで吸収 |
| 運用容易性 | PASS | admin UI からは alias テーブルだけで完結 |
| D1 無料枠 | PASS | 数十〜百行、index 1 本 |

**総合: PASS-MINOR**（運用ルール文書化が前提）

## Alternative B: schema_questions に alias_of カラム追加

`schema_questions.alias_of TEXT REFERENCES schema_questions(id)` を追加し自己参照で alias 関係を表現。

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #1 | MINOR | 03a が触る既存テーブルへの破壊的変更 |
| 03a 冪等性 | MAJOR | 03a の upsert path と alias 確定 path が同テーブル上で競合 |
| 出自追跡 | MAJOR | resolved_by / resolved_at / source を持たせるとカラム膨張 |
| 移行容易性 | PASS | テーブル新設不要 |
| 運用容易性 | MINOR | admin UI が「alias 関係」と「sync 結果」の区別を負う |

**総合: MAJOR**（03a 冪等性破壊が決定打）

## Alternative C: alias を JSON カラムに集約

`schema_aliases_meta TEXT` に `{ "<question_id>": "<stable_key>", ... }` で全 alias を保持。

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| 不変条件 #1 | MINOR | JSON 構造そのものが暗黙 schema |
| 03a 冪等性 | MINOR | partial update が read-modify-write、競合に弱い |
| 出自追跡 | MAJOR | 履歴を JSON 内に持たせると配列肥大、監査クエリ不能 |
| 運用容易性 | MAJOR | JSON 編集 UI 複雑性、SQL 検索性低下 |

**総合: MAJOR**（出自追跡 / 運用性で詰む）

## Alternative D: 解決を schema_diff_queue 行内で完結

`schema_diff_queue.resolved_stable_key` を足し queue 行自体を alias 正本とする。

| 評価軸 | 判定 | 根拠 |
| --- | --- | --- |
| 03a 冪等性 | MINOR | queue 行は 03a 側で削除/再投入される可能性、alias 寿命と整合せず |
| 出自追跡 | PASS | - |
| 運用容易性 | MAJOR | queue（一時状態）と alias（永続）の責務混同 |

**総合: MAJOR**（責務混同）

## 推奨確定

A を採用する。MINOR の「移行期間二重 source」は Phase 2 の lookup 順序固定（aliases 優先 / questions fallback）で運用上吸収する。

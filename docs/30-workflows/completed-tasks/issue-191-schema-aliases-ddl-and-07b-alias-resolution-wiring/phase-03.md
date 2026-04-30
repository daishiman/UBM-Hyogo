# Phase 3: 設計レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-04-30 |
| 前 Phase | 2（設計） |
| 次 Phase | 4（テスト戦略） |
| 状態 | spec_created |

## 目的

Phase 2 で確定した「`schema_aliases` 専用テーブル新設」案を絶対視せず、3 つ以上の代替案と比較し、PASS / MINOR / MAJOR で評価して推奨案を確定する。

## 評価軸

| 軸 | 説明 |
| --- | --- |
| 不変条件適合 | #1（schema 固定禁止）/ #5（apps/api 限定）/ #14（schema 集約） |
| 03a 冪等性 | sync 再実行で alias が破壊されないこと |
| 出自追跡 | 誰がいつ alias を確定したか記録できること |
| 移行容易性 | 既存 `schema_questions.stable_key` からの移行コスト |
| 運用容易性 | admin UI / lint rule / 監査の実装容易性 |
| D1 無料枠影響 | row 数 / index コスト |

## 代替案

### Alternative A: schema_aliases 専用テーブル新設（Phase 2 推奨）

| 評価軸 | 判定 |
| --- | --- |
| 不変条件 #1 | PASS（alias を独立 source として分離） |
| 03a 冪等性 | PASS（03a は read-only） |
| 出自追跡 | PASS（resolved_by / resolved_at / source カラム保持） |
| 移行容易性 | MINOR（fallback 期間の二重 source を運用ルールで吸収） |
| 運用容易性 | PASS（admin UI からは alias テーブルだけ見れば良い） |
| D1 無料枠 | PASS（数十〜百行、index 1 本） |

**総合: PASS-MINOR**（移行期間運用ルール文書化が前提）

### Alternative B: schema_questions に `alias_of` カラム追加

`schema_questions` に `alias_of TEXT REFERENCES schema_questions(id)` を追加し、alias 関係を自己参照で表現する案。

| 評価軸 | 判定 |
| --- | --- |
| 不変条件 #1 | MINOR（schema 変更は #14 集約点と整合するが、03a が触る既存テーブルへの破壊的変更） |
| 03a 冪等性 | MAJOR（03a が `schema_questions` を upsert する path と alias 確定 path が同テーブル上で競合） |
| 出自追跡 | MAJOR（resolved_by / resolved_at / source を持たせるとカラムが膨れる） |
| 移行容易性 | PASS（テーブル新設不要） |
| 運用容易性 | MINOR（admin UI が同テーブルの「alias 関係」と「sync 結果」を区別する複雑性を負う） |
| D1 無料枠 | PASS |

**総合: MAJOR**（03a 冪等性破壊が決定打）

### Alternative C: alias を JSON カラムに集約

`schema_aliases_meta TEXT` のような JSON カラムを単一行に持たせ、`{ "<question_id>": "<stable_key>", ... }` で全 alias を保持する案。

| 評価軸 | 判定 |
| --- | --- |
| 不変条件 #1 | MINOR（コードに直書きはしないが、JSON 構造そのものが暗黙 schema となる） |
| 03a 冪等性 | MINOR（partial update で全件 read-modify-write が必要、競合に弱い） |
| 出自追跡 | MAJOR（履歴を JSON 内に持たせると配列が肥大化、監査クエリが書けない） |
| 移行容易性 | PASS（マイグレーションは軽い） |
| 運用容易性 | MAJOR（JSON 編集 UI の複雑性、SQL 検索性低下） |
| D1 無料枠 | PASS |

**総合: MAJOR**（出自追跡 / 運用性で詰む）

### Alternative D（参考）: 解決を schema_diff_queue 行内で完結させる

`schema_diff_queue.resolved_stable_key` カラムを足し、解決済 row 自体を alias 正本として扱う案。

| 評価軸 | 判定 |
| --- | --- |
| 03a 冪等性 | MINOR（diff queue 行は 03a 側で削除 / 再投入される可能性があり alias 寿命と整合しない） |
| 出自追跡 | PASS |
| 運用容易性 | MAJOR（queue と alias 永続層を意味的に混同する。queue は trans な状態） |

**総合: MAJOR**（queue と alias の責務混同）

## 比較サマリ

| 案 | 不変条件 | 03a 冪等性 | 出自追跡 | 移行 | 運用 | 総合 |
| --- | --- | --- | --- | --- | --- | --- |
| **A: schema_aliases 新設** | PASS | PASS | PASS | MINOR | PASS | **PASS-MINOR** |
| B: schema_questions に alias_of | MINOR | MAJOR | MAJOR | PASS | MINOR | MAJOR |
| C: JSON カラム集約 | MINOR | MINOR | MAJOR | PASS | MAJOR | MAJOR |
| D: schema_diff_queue 内完結 | - | MINOR | PASS | PASS | MAJOR | MAJOR |

## 推奨案: Alternative A（schema_aliases 専用テーブル新設）

### 推奨理由

1. **03a 冪等性を保てる唯一の案**。03a は alias テーブルを read-only でしか触らないため、sync 再実行で alias 行が破壊される事故が構造的に発生しない。
2. **出自追跡（resolved_by / resolved_at / source）を SQL で正規にクエリ可能**。監査要件への将来拡張余地が高い。
3. **不変条件 #14（/admin/schema 集約）と整合**。07b workflow が書き込み起点を独占でき、alias 編集経路が一本化する。
4. MINOR 評価の「移行期間中の二重 source」は Phase 2 の lookup 順序固定（aliases 優先 / questions fallback）で吸収可能。Phase 12 で fallback 廃止計画をドキュメント化する。

### 受け入れる MINOR の対処計画

| MINOR 項目 | 対処 |
| --- | --- |
| 移行期間中の二重 source | Phase 2 の lookup 順序ルールで吸収。Phase 4 でテストケース化 |
| 移行終端条件未確定 | Phase 12 ドキュメント更新で「fallback 廃止予告」を明記し、後続 issue で別途扱う |

## 実行タスク

- [ ] 本 Phase の目的に対応する仕様判断を本文に固定する
- [ ] docs-only / spec_created 境界を崩す実行済み表現がないことを確認する
- [ ] 次 Phase が参照する入力と出力を明記する

## 参照資料

- `index.md`
- `artifacts.json`
- `.claude/skills/task-specification-creator/references/phase-templates.md`
- `.claude/skills/task-specification-creator/references/quality-gates.md`
- `.claude/skills/aiworkflow-requirements/indexes/resource-map.md`

## 成果物

- `outputs/phase-03/main.md`
- root `artifacts.json` と `outputs/artifacts.json` の parity

## 統合テスト連携

本 workflow は spec_created / docs-only のため、この Phase では統合テストを実行しない。実装タスクでは Phase 4 の verify suite と Phase 7 の AC matrix を入力に、apps/api 側で契約テストと NON_VISUAL evidence を収集する。

## 完了条件

- [ ] alternative 3 案以上を PASS / MINOR / MAJOR で評価
- [ ] 推奨案 A の理由が 4 条件と不変条件で説明されている
- [ ] MINOR 項目の対処計画が記載されている
- [ ] artifacts.json の phase 3 が `spec_created`

## 次 Phase への引き渡し

- 推奨案: A（schema_aliases 専用テーブル新設）
- 引き継ぎ事項: Phase 2 設計を確定とし、Phase 4 テスト戦略で AC-1〜AC-6 ごとのテスト設計を進める
- 残 open question: id 採番（ULID / UUID）— 既存リポジトリの ULID 採用慣習があれば踏襲、なければ Phase 4 で確定

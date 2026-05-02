# member_responses.response_email UNIQUE 制約の DDL / spec 明文化 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                |
| ------------ | ----------------------------------------------------------------------------------- |
| タスクID     | 03b-followup-003-response-email-unique-ddl                                          |
| タスク名     | member_responses.response_email UNIQUE 制約の DDL / spec 明文化                     |
| 分類         | 仕様整備                                                                            |
| 対象機能     | D1 schema における `response_email` UNIQUE 契約（`member_identities` 側）の正本化   |
| 優先度       | 中                                                                                  |
| 見積もり規模 | 小規模                                                                              |
| ステータス   | consumed_by_issue_196_workflow                                                      |
| 発見元       | 03b Phase 12 unassigned-task-detection #4                                           |
| 発見日       | 2026-04-28                                                                          |
| 引き取り候補 | 01a-parallel-d1-database-schema-migrations-and-tag-seed                             |

---

## Consumed / Superseded Status

この follow-up は `docs/30-workflows/issue-196-03b-followup-003-response-email-unique-ddl/` に昇格済み。正本訂正は Issue #196 workflow 側で管理する。

- 正本 UNIQUE: `member_identities.response_email`
- 非 UNIQUE: `member_responses.response_email`（履歴行のため同一 email の複数 response を許容）
- 旧表題の `member_responses.response_email UNIQUE` は誤記として扱う。履歴改ざんを避けるため本ファイルの原文は残し、この consumed 節で現在状態を明示する。

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

03b では Forms response sync ロジックを実装した際、`response_email` を識別キーとした upsert + `current_response_id` 切替を行う前提で sync を構築した。この前提が成立する根拠は **`response_email` に対する UNIQUE 制約が D1 schema に張られていること** だが、03b 着手時点では DDL 上どこに UNIQUE が張られているかが曖昧で、grep / マイグレーション本文の両方を追わないと確認できなかった。

実体としては:

- `apps/api/migrations/0001_init.sql` L90 で `member_identities.response_email TEXT NOT NULL UNIQUE` が宣言済み
- `member_responses.response_email` は UNIQUE **ではない**（`response_id` 単位の履歴テーブルのため、同一メールが複数 response_id で出現することを許容する設計）
- `0005_response_sync.sql` のヘッダーコメント L7 に「`member_identities.response_email` は 0001_init.sql で UNIQUE 済み（再宣言なし）」とのみ記載

つまり「`member_responses.response_email` の UNIQUE」は存在せず、UNIQUE が張られているのは `member_identities` 側であり、Phase 12 検出表 #4 の表記自体が **spec ドリフトの兆候** になっている。

### 1.2 問題点・課題

- Phase 12 検出表 #4 の表現（`member_responses.response_email` UNIQUE）と実 DDL（`member_identities.response_email` UNIQUE）が一致していない
- 03b sync ロジック（同一メールでの upsert + `current_response_id` 切替）の正当性は `member_identities` 側 UNIQUE に依存しているが、spec 側にその因果関係が再掲されていない
- `database-schema.md` には `member_identities` が `response_email` ごとの identity と書かれているが、UNIQUE 制約が DDL のどの行に紐付くかへのアンカーが無い
- 履歴テーブル (`member_responses`) と identity テーブル (`member_identities`) の役割境界が spec 上で明示されていないため、将来の review で「`member_responses` にも UNIQUE を追加すべきでは？」という誤った変更提案が出るリスクがある

### 1.3 放置した場合の影響

- 01a のマイグレーション spec を後続タスクが参照した際、UNIQUE 契約の所在が誤認され、`member_responses.response_email` に UNIQUE を追加する誤マイグレーションが書かれる
- そうした誤変更が入ると、本人が Google Form で再回答した瞬間に UNIQUE 違反で sync が失敗し、03b の `current_response_id` 切替が成立しなくなる
- 03b の実装意図（履歴は重複可・identity は一意）が spec 上の正本に残らないため、将来の schema 変更でドリフトを検知する gate が存在しない

---

## 2. 何を達成するか（What）

### 2.1 目的

「`response_email` の UNIQUE 制約は `member_identities` 側にのみ存在し、`member_responses` 側には存在しない」という不変条件を **spec / DDL コメントの両方に明文化** し、03b sync ロジックが依存している契約を将来の変更からも守れるようにする。

### 2.2 最終ゴール

- `database-schema.md` に「UNIQUE 制約は `member_identities.response_email` のみ・`member_responses.response_email` は履歴のため重複可」が明記されている
- `apps/api/migrations/0001_init.sql` の `member_responses` / `member_identities` 各 CREATE TABLE 直前のコメントに、UNIQUE の所在と意図が再掲されている
- 01a の正本タスク仕様書（`01a-parallel-d1-database-schema-migrations-and-tag-seed`）に同等の記述が反映されている
- Phase 12 検出表 #4 の表記を「`member_identities.response_email` UNIQUE 制約の DDL / spec 明文化」へ訂正済み

### 2.3 スコープ

#### 含むもの

- `database-schema.md`（`.claude/skills/aiworkflow-requirements/references/database-schema.md`）への UNIQUE 制約所在表の追記
- `apps/api/migrations/0001_init.sql` の DDL コメント追記（**新規 ALTER は行わない**。コメントのみ）
- `apps/api/migrations/0005_response_sync.sql` のヘッダーコメント文言調整（`member_responses` ではなく `member_identities` であることを再確認）
- 01a タスク仕様書側への参照リンク追加
- Phase 12 検出表 #4 の文言訂正

#### 含まないもの

- 新規マイグレーション発行（DDL の構造変更は不要）
- `member_responses.response_email` への UNIQUE 追加（**禁止**。03b sync の前提に反する）
- D1 indexes の構造変更
- 03b sync ロジック本体の改修

### 2.4 成果物

- `database-schema.md` 差分（UNIQUE 所在表 + 履歴/identity 役割境界の明文化）
- `0001_init.sql` のコメント追記差分
- `0005_response_sync.sql` のヘッダーコメント微修正差分
- 01a タスク仕様書への反映差分
- Phase 12 検出表 #4 の文言訂正差分

---

## 3. どのように実行するか（How）

### 3.1 前提条件

- `apps/api/migrations/0001_init.sql` L88-96（`member_identities` 定義）と L49-62（`member_responses` 定義）を読める
- `apps/api/migrations/0005_response_sync.sql` L5-7 のコメントを読める
- 03b sync ロジックが `response_email` 単位で identity upsert している事実を理解している
- 不変条件 #3（`response_email` は system field）を理解している

### 3.2 実行手順

1. `database-schema.md` に UNIQUE 制約所在表を追加（`member_identities.response_email` UNIQUE / `member_responses.response_email` 重複可）
2. `0001_init.sql` の `member_responses` CREATE TABLE 直前と `member_identities` CREATE TABLE 直前にコメントを追記
   - `member_responses`: 「`response_email` は履歴のため UNIQUE しない。一意性は `member_identities` 側で担保」
   - `member_identities`: 「`response_email` UNIQUE は 03b sync の `current_response_id` 切替契約の正本」
3. `0005_response_sync.sql` のヘッダーコメント L7 を「`member_identities.response_email` は 0001_init.sql で UNIQUE 済み」と明示的な所在で再記述（既に該当文言は存在するが、本タスクで根拠リンクを追加する）
4. 01a タスク仕様書の AC に「UNIQUE 制約所在の明文化」を追加
5. Phase 12 検出表 #4 の文言を訂正（`member_responses` → `member_identities`）
6. typecheck / lint には影響しないため、`pnpm typecheck` のみ通せば OK

### 3.3 受入条件 (AC)

- AC-1: `database-schema.md` に UNIQUE 制約所在表が追加され、`member_identities.response_email` UNIQUE と `member_responses.response_email` 非 UNIQUE が明記されている
- AC-2: `0001_init.sql` の `member_responses` / `member_identities` 各 CREATE TABLE 直前に意図コメントが追記されている
- AC-3: `0005_response_sync.sql` のヘッダーコメントが UNIQUE 所在を `member_identities` と明示している
- AC-4: 01a タスク仕様書に同内容の参照が追加されている
- AC-5: Phase 12 検出表 #4 の文言が訂正されている
- AC-6: 新規マイグレーションが発行されていない（DDL 構造は変更しない）
- AC-7: `mise exec -- pnpm typecheck` が pass する（schema 変更なしのため影響無し想定）

---

## 4. 苦戦箇所 / 学んだこと（03b で得た知見）

### 4.1 UNIQUE 制約の所在を grep + 本文の二段で追わざるを得なかった

03b 着手時、`member_responses.response_email` に UNIQUE が張られているかを確認するために、`grep -n "UNIQUE" apps/api/migrations/*.sql` で候補を出し、さらに各候補行の前後を読んで「どのテーブルの列に対する UNIQUE か」を判定する必要があった。spec 側に「UNIQUE 所在表」が無いと、後続タスクでも同じ確認コストが繰り返し発生する。

### 4.2 履歴テーブルと identity テーブルの役割境界

`member_responses` は response_id 単位の履歴で、同一 `response_email` が複数行存在することが正常系の挙動（再回答ごとに 1 行追加）。一方 `member_identities` は email 単位の identity で UNIQUE が必要。この境界を spec 上で 1 行で説明できる文を残しておくことが、将来「`member_responses` にも UNIQUE を追加すべき」という誤レビューを防ぐ最短手段になる。

### 4.3 ドリフト検知 gate の不在

DDL コメントは CI で構造的に検証できないため、`database-schema.md` 側の所在表が事実上の正本になる。`member_responses` schema を変更するマイグレーションが将来出された際、所在表との整合を PR review の必須確認項目に含める運用が望ましい（自動化は本タスクのスコープ外）。

---

## 5. 制約 / 不変条件

- 不変条件 #1（実フォームの schema をコードに固定しすぎない）: 本タスクは DDL 構造変更を行わないため抵触しない
- 不変条件 #3（`responseEmail` は system field として扱う）: 本タスクの正本明文化は #3 を強化する方向に作用する
- 不変条件 #5（D1 直接アクセスは `apps/api` に閉じる）: 本タスクは spec / コメントのみのため影響なし
- **禁止**: `member_responses.response_email` への UNIQUE 追加（履歴テーブルとして同一メール複数行を許容することが 03b sync の前提）
- **禁止**: 本タスクで新規マイグレーションを発行すること（コメント / spec 追記のみで完結）

---

## 6. 関連リソース

- `apps/api/migrations/0001_init.sql` L49-62（`member_responses`）/ L88-96（`member_identities`）
- `apps/api/migrations/0005_response_sync.sql` L5-7（UNIQUE 所在ヘッダーコメント）
- `.claude/skills/aiworkflow-requirements/references/database-schema.md` L51-52（`member_responses` / `member_identities` 役割記述）
- `docs/30-workflows/03b-parallel-forms-response-sync-and-current-response-resolver/outputs/phase-12/unassigned-task-detection.md` #4
- `doc/00-getting-started-manual/specs/01-api-schema.md`（`response_email` の system field 定義）
- 引き取り候補: `01a-parallel-d1-database-schema-migrations-and-tag-seed`

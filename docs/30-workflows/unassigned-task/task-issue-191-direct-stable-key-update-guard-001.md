# task-issue-191-direct-stable-key-update-guard-001

## メタ情報

| Field | Value |
| --- | --- |
| Status | unassigned |
| Priority | Medium |
| Source | issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring |
| Type | quality |
| GitHub Issue | #300 |
| Production apply prerequisite | satisfied by `task-issue-191-production-d1-schema-aliases-apply-001` Phase 13 already-applied verification |

## 1. なぜこのタスクが必要か（Why）

issue-191 では、07b alias assignment workflow の正本書き込み先を `schema_questions.stable_key` 直更新から `schema_aliases` 専用テーブルへ分離する方針を固定している。

`.claude/skills/aiworkflow-requirements/references/database-implementation-core.md` は `UPDATE schema_questions SET stable_key` を禁止し、静的検査は Phase 9 の grep guard を起点に、後続実装で repository / AST guard へ強化すると定義している。

この未タスクは、禁止された直更新が再混入しないように CI の不変条件として検出するための品質タスクである。不変条件 #14「schema 変更の人手解決は `/admin/schema` 系 workflow（後続 06c/07b）へ集約する」を守るため、手動解決の書き込み境界を `schema_aliases` / `/admin/schema/aliases` に閉じる。

2026-05-02 時点で production D1 の `schema_aliases` table は Phase 13 evidence により required shape 確認済みである。この guard は production apply 待ちではなく、直更新再混入を防ぐ CI 品質タスクとして scheduling 可能な状態である。

## 2. 何を達成するか（What）

- `schema_questions.stable_key` または `schema_questions.stableKey` の直接更新を CI で拒否する guard を追加する。
- Phase 9 の grep guard を初期実装の起点にする。
- 後続実装で repository 層の禁止 API 検査、SQL AST / TypeScript AST guard、SQL wrapper guard へ強化できる形にする。
- 例外許可範囲を migrations と test fixture に限定し、許可理由を文書化する。
- issue-191 Phase 9 と `database-implementation-core.md` から追跡できる未タスク仕様として維持する。

## 3. どのように実行するか（How）

初期実装では、CI から実行できる静的検査を追加し、`UPDATE schema_questions SET stable_key` を明示的に拒否する。必要に応じて `stableKey` の camelCase 更新、`schema_questions` に対する update builder、repository helper 経由の mutation も検出対象に含める。

ただし grep は暫定手段である。後続タスクでは、実装パターンが固まった段階で以下へ強化する。

- repository API で `schema_questions` の stable key 更新メソッドを持たないことを検査する。
- SQL を組み立てる wrapper / query builder の呼び出しを AST で検出する。
- multiline SQL、テンプレートリテラル、helper 経由更新を検出できるルールにする。
- migrations / test fixture の許可リストを明示し、通常実装からの例外拡大を防ぐ。

## 4. 実行手順

1. issue-191 Phase 9 の grep guard 仕様と `database-implementation-core.md` の `Schema Alias Resolution Contract` を確認する。
2. CI で実行可能な guard script または既存 lint/test コマンドへの追加箇所を決める。
3. `UPDATE schema_questions SET stable_key` を最小検出条件として追加する。
4. `schema_questions.stable_key` / `schema_questions.stableKey` の direct update、query builder、helper 呼び出しの検出候補を洗い出す。
5. migrations / test fixture のみを例外許可し、許可対象と理由を script 内または近接ドキュメントに残す。
6. CI 失敗時のメッセージに、正しい書き込み先が `schema_aliases` / `POST /admin/schema/aliases` であることを表示する。
7. 後続の repository / AST guard 強化タスクへ引き継げる TODO または未タスク参照を残す。

## 5. 完了条件チェックリスト

- CI が direct `schema_questions.stable_key` または `schema_questions.stableKey` update attempt で失敗する。
- `UPDATE schema_questions SET stable_key` 禁止が guard の検出対象に含まれる。
- migrations / test fixture 以外の例外が許可されていない。
- 例外許可範囲と理由が文書化されている。
- guard が issue-191 Phase 9 と `database-implementation-core.md` の方針に接続されている。
- 後続で repository / AST guard へ強化する前提が仕様内に残っている。

## 6. 検証方法

- `UPDATE schema_questions SET stable_key = ...` を含む一時的な実装差分で guard が失敗することを確認する。
- `schema_questions.stableKey` の camelCase mutation を含む一時的な実装差分で guard が失敗することを確認する。
- migrations / test fixture に限定した許可ケースが必要な場合のみ通過することを確認する。
- 通常の lint / test / CI command に組み込まれていることを確認する。
- guard failure message が `schema_aliases` または `/admin/schema/aliases` への修正方針を示すことを確認する。

## 7. リスクと対策

| リスク | 対策 |
| --- | --- |
| grep だけでは multiline SQL、query builder、camelCase、helper 経由更新を検出できない | Phase 9 grep guard は起点と位置付け、後続で repository / AST guard へ強化する |
| 例外許可が広すぎると通常実装で直更新が再混入する | 例外は migrations / test fixture に限定し、パス単位で許可理由を管理する |
| guard が強すぎると読み取り処理や fallback 参照まで誤検出する | 更新操作を主対象にし、`findStableKeyById` など移行期間中の読み取り fallback は拒否対象にしない |
| 後続実装で query builder の表現が変わり guard が陳腐化する | repository 契約に「`schema_questions` は stableKey を更新しない」を持たせ、CI guard と二重化する |

## 8. 参照情報

- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-09/main.md`
- `docs/30-workflows/completed-tasks/issue-191-schema-aliases-ddl-and-07b-alias-resolution-wiring/outputs/phase-12/implementation-guide.md`
- `.claude/skills/aiworkflow-requirements/references/database-implementation-core.md`
- `Schema Alias Resolution Contract`: `UPDATE schema_questions SET stable_key` は禁止。静的検査は Phase 9 の grep guard を起点に、後続実装で repository / AST guard へ強化する。
- 不変条件 #14: schema 変更の人手解決は `/admin/schema` 系 workflow（後続 06c/07b）へ集約する。

## 9. 備考

このタスクは未割り当ての品質タスクであり、issue-191 本体の実 DDL 適用、repository 実装、03a/07b 配線は含まない。guard の初期実装は小さく開始してよいが、grep の限界を前提に後続強化へつなげる。

## 苦戦箇所【記入必須】

単純 grep では、以下の direct stableKey mutation を逃す可能性がある。

- multiline SQL: `UPDATE schema_questions` と `SET stable_key` が別行、別テンプレート片、別 helper に分かれる。
- query builder: `.update(schemaQuestions).set({ stableKey: ... })` のように SQL 文字列が直接現れない。
- camelCase: DB column は `stable_key` でも TypeScript 側で `stableKey` と表現される。
- helper 経由更新: `updateQuestionStableKey(...)` のような関数名や repository helper 内部で mutation が隠れる。

また、例外許可範囲を migrations と test fixture に限定する必要がある。移行作業や検証データ作成以外で例外を許すと、不変条件 #14 と `schema_aliases` への分離方針が崩れる。

## スコープ（含む/含まない）

含む:

- direct `schema_questions.stable_key` / `schema_questions.stableKey` update を拒否する CI guard の仕様化。
- Phase 9 grep guard を起点にした初期検出方針。
- repository / AST guard へ強化する後続方針。
- migrations / test fixture に限定した例外許可方針。
- 不変条件 #14 と `UPDATE schema_questions SET stable_key` 禁止の明示。

含まない:

- `schema_aliases` の DDL 適用。
- 03a sync / 07b alias assignment の実装変更。
- `/admin/schema/aliases` endpoint の実装。
- `schema_questions.stable_key` fallback 廃止。
- 既存 migration data の実変換。

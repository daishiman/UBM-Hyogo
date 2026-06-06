# skill-feedback-report

> 改善点なしでも出力必須。

## テンプレート改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| FB-I1069-001 | issue 最適化 | 古い issue を「現行コードに最適化」する際、issue が高リスクと記す前提（AC-3: member_tags 参照整合）が実スキーマ（tag_id 参照）で杞憂と判明することがある。task-spec 作成時は **issue の risk 記述を必ず現行 schema で再検証**し、杞憂なら `issue_optimization_note` に明示する運用を標準化すると良い。 |
| FB-I1069-002 | supersede 記録 | 親タスクの `issue_optimization_note` が下した設計判断（code immutable）を後続タスクが覆す場合、artifacts.json に `supersedes` フィールドを置き、どの判断を上書きしたか追跡可能にすると、設計判断の系譜が辿れる。 |

## ワークフロー改善

| ID | 観点 | 内容 |
| --- | --- | --- |
| FB-I1069-003 | 後方互換破壊の局所性確認 | repository 関数の戻り値型を `T | null` → discriminated union へ変える破壊的変更では、Phase 2 で **call site と既存テストアサーションの棚卸し**（本件は call site 1 + test 3）を必須化すると手戻りを防げる。 |
| FB-I1069-004 | 既存テストの副作用検出 | 既存 contract test が PATCH body に `code:"ignored"`（新 CODE_RE を通過する値）を含んでおり、rename 実装後に意図せず rename される副作用を Phase 4/6 で検出した。**body 拡張タスクでは「既存テストが新フィールドに偶発的に該当する値を送っていないか」を grep 確認**する手順を Phase 4 チェックに加えると良い。 |

## ドキュメント改善

- optimistic concurrency を schema 変更（version 列）なしで実現する `expectedCode` compare-and-swap パターンは、他の admin mutation でも再利用可能な横断ガイドライン候補。ただし「事前 SELECT で一致確認」だけでは CAS として弱いため、`expectedCode` は mutation field 指定時に必須化し、`UPDATE ... WHERE id AND expected_value` の atomic 更新行数で stale を判定することをテンプレ化するとよい。

## 総合

改善提案 4 件（テンプレート 2 / ワークフロー 2）。本 workflow では実行済み/予定 wording の補正、既存 test body の `code:"ignored"` hazard 除去、Phase 11 NON_VISUAL 補助成果物追加、unassigned formalize を同一 wave で反映した。
</content>

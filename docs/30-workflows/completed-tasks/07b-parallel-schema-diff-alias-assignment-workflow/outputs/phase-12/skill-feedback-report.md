# Skill Feedback Report

| skill | feedback |
|------|---------|
| task-specification-creator | 仕様書記述 (`response_fields.questionId` / `is_deleted`) と実 DB スキーマに差分があり、実装段階で吸収が必要だった。仕様書作成時に `apps/api/migrations/*.sql` を grep で検証する step を追加すると差分早期発見可能 |
| aiworkflow-requirements | back-fill 系 workflow の CPU budget + idempotent 続行パターンの reference があると良い |
| task-specification-creator | mode union (apply / dryRun) を持つ workflow の TS discriminated union pattern を template 化推奨 |

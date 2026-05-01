# Skill Feedback Report

| skill | feedback |
| --- | --- |
| task-specification-creator | NON_VISUAL implementation の Phase 12 で「workflow_state 据え置き + phases[].status 更新」のパターンが reference に明示されると良い。本タスクでは仕様書側にも「artifacts.json は本タスクで更新しない」と書かれており明快だった。 |
| task-specification-creator | 仕様書のディレクトリ命名（`repositories/` 複数形）と既存規約（`repository/` 単数）の差分が発生したため、phase-02 で「既存規約優先」を明示する template があると良い。 |
| aiworkflow-requirements | tag_assignment_queue の audit payload 標準形（`admin.tag.queue_*`）を topic-map に追加すると 07a 系の整合確認が早くなる。 |
| int-test-skill | `apps/api` の repository が fakeD1 を共有している前提で、`expectTypeOf` を使った type-level test ファイル（`*.test-d.ts`）が typecheck で評価される運用は確認できた。`vitest --typecheck` 起動コマンドの README 化は将来課題。 |

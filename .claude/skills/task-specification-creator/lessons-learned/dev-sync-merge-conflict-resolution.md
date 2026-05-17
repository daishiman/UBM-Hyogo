# task-specification-creator: dev sync merge conflict 解消パターン

タスク仕様書生成 skill 配下（SKILL.md / SKILL-changelog.md / outputs/ / references/）は複数並行ワークツリーから additive に更新されるため、`origin/dev` 取り込み時に merge conflict が頻発する。正本は `.claude/skills/aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md`（L-DEVSYNC-001..005）。

## 本 skill 固有の補足

### SP-DEVSYNC-001: SKILL.md / SKILL-changelog.md の表 conflict
- changelog 表は append-only。HEAD と dev の追加行を**両方採用**し、`||||||| base` セクションは破棄。
- 自動 regex（diff3 base optional）:
  ```
  <<<<<<< HEAD\n(?P<a>.*?)(?:\|\|\|\|\|\|\| [^\n]*\n.*?)?=======\n(?P<c>.*?)>>>>>>> dev\n  →  {a}{c}
  ```

### SP-DEVSYNC-002: outputs/phase-*/implementation-guide.md の conflict
- 各タスクの outputs は task ごとに固有 path のため通常 conflict しないが、root/output artifacts parity を持つメタファイルは衝突しうる。両側採用 → Phase 12 strict 7 validator (`pnpm validate:phase11-paths` 等) を再実行して整合確認。

### SP-DEVSYNC-003: merge commit ガード
- pre-commit `staged-task-dir-guard` は `MERGE_HEAD` 検出で自動 skip。`--no-verify` を付けないことが原則。`--no-verify` が必要だった場合は hook の `MERGE_HEAD` 判定漏れを疑う。

### SP-DEVSYNC-004: 共通の正本リンク
- 詳細は [[lessons-learned-dev-sync-merge-conflict-resolution-2026-05]] （aiworkflow-requirements 配下）を参照。

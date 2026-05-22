# dev sync: visual-harness `allowed` Set への両側追加は union 解消

- 日時: 2026-05-20
- ブランチ: `feat/profile-loading-skeleton-oklch` ← `dev`
- 事象: `apps/web/app/visual-harness/[name]/page.tsx` の `allowed` Set リテラルに、HEAD 側で `"profile-loading"`、dev 側で `"parallel-02-css-rules"` がそれぞれ追加されていたため、`pnpm sync:resolve` の resolver では handle されず `WARN unhandled conflict` として残置された。
- 解消: 両側の新規エントリは独立した visual scenario 名であり相互排他ではないため、両方を残す union 解消で対応。`if (name === "profile-loading") {...}` などの専用 branch は HEAD 側のロジックを保持。
- 一般化ルール: `allowed`/`registry`/`Set`/`Record` のような **enum 風コレクションリテラル** に両側追加コンフリクトが発生した場合、union 採用を既定とする（branch-sync skill の自律判断ルール B-3「両側の変更意図を保持」に該当）。
- 反映先:
  - `aiworkflow-requirements/lessons-learned/lessons-learned-dev-sync-merge-conflict-resolution-2026-05.md` の L-DEVSYNC-* に enum-collection union パターンを追記推奨
  - `task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md` の visual-harness 関連 checklist 参照先として本 changelog を引用

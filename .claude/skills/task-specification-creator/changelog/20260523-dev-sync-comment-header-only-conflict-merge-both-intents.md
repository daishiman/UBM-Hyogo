# dev sync: コメントヘッダのみの 3-way conflict は両 intent を結合する

- 日時: 2026-05-23
- ブランチ: `feat/issue-277-next-proxy-migration` ← `dev`
- 関連: `aiworkflow-requirements/changelog/20260523-dev-sync-comment-header-only-conflict-merge-both-intents.md`
- 事象: `git merge dev` で `apps/web/app/(admin)/layout.tsx` のコメントヘッダのみが衝突。コード本体は同一。
  - HEAD: issue-277 next proxy migration 文脈の「proxy.ts 非配置」コメント
  - dev: parallel-03 S-02 AppShell 契約のコメント（`data-theme="cool"` / `data-shell` / `data-route` / middleware 二段防御）
- Phase 9 (実装) のタスク仕様策定における示唆:
  - **コメントヘッダはタスク横断で更新されやすく、3-way conflict の頻発ポイント**。Phase 9 で「ファイル先頭にタスク識別コメントを置く」設計を採用する場合は、後続タスクが追記する余地を残す書式（複数タスク ID を `/` 区切りで列挙）を初期から検討する
  - 仕様書テンプレート側で「既存コメントを置換せず append する」運用ガイドを明示すると、本事例の merge cost を予防できる
- 解消ルール: 両側の intent を 1 つの統合コメントブロックに集約する（自律判断ルール B-3 の派生形）
- 反映: `references/pr-pre-flight-ci-gate-checklist.md` または dev-sync 関連 reference に「コメントヘッダ単独衝突は両 intent 結合」のパターンを追記する候補として記録

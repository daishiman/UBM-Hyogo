# dev sync: コメントヘッダのみの 3-way conflict は両 intent を結合する

- 日時: 2026-05-23
- ブランチ: `feat/issue-277-next-proxy-migration` ← `dev`
- 関連: `task-specification-creator/changelog/20260523-dev-sync-comment-header-only-conflict-merge-both-intents.md`
- 事象: `git merge dev` 後の UU は以下 5 ファイル
  - skill indexes 4 件 (`aiworkflow-requirements/indexes/{quick-reference,resource-map,topic-map}.md`, `references/task-workflow-active.md`) — `pnpm sync:resolve` で union 解消
  - `apps/web/app/(admin)/layout.tsx` — **コードは同一、ファイル先頭のコメントヘッダのみ衝突**
- コメントヘッダ衝突の構造:
  - HEAD (issue-277): proxy.ts rename 文脈で「proxy.ts は配置しない（root proxy.ts と layout 内 auth() で完結）」
  - merge base: 旧 task-15 W5 のコメント（middleware.ts 言及）
  - dev (parallel-03 S-02): AppShell 契約「`data-theme="cool"` / `data-shell` / `data-route`」と「middleware と二段防御」
- 解消ルール（自律判断ルール B-3 ソースコード両 intent 保持の派生形）:
  - **コメントだけが衝突しているケースでは、両側の intent を 1 つの統合コメントブロックに集約する**
  - 一方を捨てる前に「本ブランチ主題」「dev 側で追記された契約説明」が両方とも将来読者の理解に必要かを判定する
  - 今回は両方必要だったため、`task-15 W5 / parallel-03 S-02` の合成見出しと `data-shell` 契約 + proxy.ts 非配置 + 二段防御の 3 点を 4 行に圧縮
- 反映:
  - 本 skill `references/task-workflow-active.md` の dev-sync runbook に「コメントヘッダのみ UU の場合は両 intent 結合」を追記する候補として記録
  - `task-specification-creator` 側の同名 changelog に「Phase 9 のコメント設計判定で同パターンが発生し得る」旨を追記
- 補足: `pnpm sync:resolve` は WARN 表示で停止し、unhandled として手動解消対象に振り分ける。これは仕様通りで層 3（手動解消ルール）に該当。

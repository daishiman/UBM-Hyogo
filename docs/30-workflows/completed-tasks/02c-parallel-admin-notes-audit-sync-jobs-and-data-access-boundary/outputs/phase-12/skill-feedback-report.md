# skill-feedback-report

02c タスク実行を通じて気づいた skill / template への改善提案。

| # | 対象 | 提案 | 背景 |
| --- | --- | --- | --- |
| 1 | `phase-template-app.md` | boundary tooling（dep-cruiser / ESLint / 自前 lint script）を扱うタスク用に「意図的 violation snippet を作って **error が出ること** を確認する」観点を Phase 9 / 11 に追加 | 02c の Phase 11 S-6 で重要だった観点。green だけでなく「赤がちゃんと赤になる」確認 |
| 2 | `artifacts-template.json` | `boundary_tooling_introduced: string[]` フィールドを許可（dep-cruiser config / ESLint rule / lint script の正本管理者を機械可読化） | 下流タスクが「どのファイルが boundary 正本か」を JSON で見つけられる |
| 3 | README 不変条件 #5 | 「dep-cruiser + ESLint + 自前 lint script の **三重防御**」と明記 | 02c では dep-cruiser バイナリ未導入のため `scripts/lint-boundaries.mjs` で代替したが、両方を残す価値がある |
| 4 | README 不変条件 #12 | 「adminNotes は builder の **引数で受け取る、戻り値に含めない**」を一行で明記 | view model に混ざらない理由を構造で説明 |
| 5 | `task-specification-creator` skill | 実装を伴う NON_VISUAL タスクの Phase 11 ガイドラインを追加 | 「staging 未配備時の代替 evidence」プレイブックを skill 側で標準化したい |
| 6 | phase-template-app Phase 11 | staging 未配備時の代替手段（in-memory + typecheck + lint）と、それが何をカバーし、何を 09a に申し送るかの差分表テンプレを追加 | 02c で同じ判断を再現性なく毎回することになる |

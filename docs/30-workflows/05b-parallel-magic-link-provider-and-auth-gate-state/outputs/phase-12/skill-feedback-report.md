# Skill Feedback Report (05b)

aiworkflow-requirements / task-specification-creator skill への feedback。

| # | 観点 | feedback | 改善提案 |
|---|---|---|---|
| 1 | failure case 命名 | Phase 6 で F-01〜F-17 の連番を rate-limit / mail / token / session 等カテゴリ別に振れたことで、Phase 7 AC マトリクスとの紐付けが容易だった | template の Phase 6 に「カテゴリ別連番 (F-XX)」要件を明記済 → 継続維持 |
| 2 | 不変条件番号引用 | Phase 1〜10 すべての「多角的チェック観点」に不変条件 #2/#5/#7/#9/#10 を番号付きで引用したことで、Phase 9 cross-check が機械的に書けた | template に「不変条件番号必須引用」を継続維持 |
| 3 | 外部依存と無料枠 | Resend / D1 / Workers の月次見積を Phase 9 に表で書く運用が機能した | template の Phase 9 に「外部依存ごとの無料枠表」要件を明記推奨 |
| 4 | UI route 不在タスクの smoke 代替 | `artifacts.json` の `ui_routes: []` を根拠に Phase 11 を vitest 契約 smoke で代替できた | template の Phase 11 に「ui_routes: [] の場合の smoke 代替手順」を一節追加推奨 |
| 5 | apps/web -> apps/api 文字列衝突 | `lint-boundaries.mjs` がコメント内の `apps/api` 文字列も検知するため、proxy 実装で表記を「web/api worker」に統一する必要があった | skill 側で「apps/web 内のコメントで apps/api 直書き禁止」を chk リストに追加推奨 |
| 6 | shared types 衝突 | viewmodel/index.ts の branded SessionUser と新規 auth.ts が衝突しかけた。Phase 5 序盤で shared 既存 export を grep する step を runbook に書いた方が良い | runbook template に「S0: shared 既存 export を grep」を追加推奨 |

## 全般評価

- task-specification-creator が出した 13 phase template は 05b の規模 (4 endpoint + 1 middleware + 1 mailer + 4 use-case + 7 test file) に対して過不足なくフィットした
- Phase 5 を「実装ランブック + 実コード」と一体運用する運用は workable

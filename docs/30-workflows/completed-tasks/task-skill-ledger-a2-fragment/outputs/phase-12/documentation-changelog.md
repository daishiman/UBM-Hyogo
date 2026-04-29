# Documentation Changelog（A-2 fragment 化）

## workflow-local 同期（task-skill-ledger-a2-fragment）

| 日付 | 変更内容 | 場所 |
| ---- | -------- | ---- |
| 2026-04-28 | Phase 1〜13 仕様書 13 ファイル作成 | `docs/30-workflows/task-skill-ledger-a2-fragment/phase-*.md` |
| 2026-04-28 | outputs/ 36 ファイル作成（main / 各補助成果物） | `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/phase-*/` |
| 2026-04-28 | artifacts.json 確定（13 phases × outputs[]） | `docs/30-workflows/task-skill-ledger-a2-fragment/outputs/artifacts.json` |

## global skill sync（FB-BEFORE-QUIT-003 対応）

| 日付 | 変更内容 | 場所 |
| ---- | -------- | ---- |
| 2026-04-28 | render/append helper 実装 | `scripts/skill-logs-{render,append}.ts` |
| 2026-04-28 | 共通ライブラリ追加 | `scripts/lib/{branch-escape,fragment-path,front-matter,retry-on-collision,timestamp}.ts` |
| 2026-04-28 | vitest テスト 15 件追加 | `scripts/skill-logs-*.test.ts` |
| 2026-04-28 | `package.json` script 追加 | `skill:logs:render` / `skill:logs:append` |
| 2026-04-28 | `vitest.config.ts` include 追加 | `scripts/**/*.test.ts` |
| 2026-04-28 | 8 skills の LOGS / changelog / lessons-learned 受け皿作成 | `.claude/skills/<skill>/<dir>/.gitkeep` |
| 2026-04-28 | 92 ファイル legacy 退避（git mv） | `.claude/skills/<skill>/<dir>/_legacy*.md` |

## 本タスクで実施しない（後続タスクへ移譲）

| 項目 | 理由 | 移譲先 |
| ---- | ---- | ------ |
| `log_usage.js` 4 件の writer 切替 | 本レビューで完了 | 完了 |
| 4 worktree smoke 実機実行 | 証跡フォーマット固定済み | UT-A2-SMOKE-001 |
| topic-map.md 再生成 | Phase 13 ユーザー承認後の commit 時に実施 | Phase 13 |
| `pnpm lint` フルラン | 本タスク変更は scripts のみ | 後続 implementation タスク |

## 生成スクリプト

```bash
node scripts/generate-documentation-changelog.js
```

（本タスクではスクリプトを実行する代わりに手書きで列挙。実コミット時に script 経由で再生成する。）

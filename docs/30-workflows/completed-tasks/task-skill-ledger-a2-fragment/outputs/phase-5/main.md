# Phase 5 — 実装ランブック main

## 実装サマリー

| 項目 | 値 |
| ---- | -- |
| Step 数 | 4（受け皿 → legacy 退避 → render → append helper） |
| 新規スクリプト | `scripts/skill-logs-render.ts` / `scripts/skill-logs-append.ts` |
| 共通ライブラリ | `scripts/lib/{branch-escape,fragment-path,front-matter,retry-on-collision,timestamp}.ts` |
| 新規テスト | 15 件（render 9 / append 6） |
| migration | LOGS.md / SKILL-changelog.md / lessons-learned-*.md → `_legacy*.md`（git mv） |
| package.json | `skill:logs:render` / `skill:logs:append` script 追加 |

## 新規 / 修正 / rename ファイル

新規:
- `scripts/skill-logs-render.ts`
- `scripts/skill-logs-render.test.ts`
- `scripts/skill-logs-append.ts`
- `scripts/skill-logs-append.test.ts`
- `scripts/lib/branch-escape.ts`
- `scripts/lib/fragment-path.ts`
- `scripts/lib/front-matter.ts`
- `scripts/lib/retry-on-collision.ts`
- `scripts/lib/timestamp.ts`
- `.claude/skills/<8 skills>/{LOGS,changelog,lessons-learned}/.gitkeep`

修正:
- `package.json`（scripts 追加・`tsx` 追加）
- `vitest.config.ts`（include に `scripts/**/*.test.ts`）

rename:
- 各 skill `LOGS.md` → `LOGS/_legacy.md`
- 各 skill `SKILL-changelog.md` → `changelog/_legacy.md`
- 各 skill `lessons-learned-<base>.md` → `lessons-learned/_legacy-<base>.md`

## 実コミット保留

実コミットは **Phase 13 でユーザー承認後** に実行する。Phase 5 では runbook（手順）と参考 commit message のみ記載する。

詳細手順は [`runbook.md`](./runbook.md) を参照。

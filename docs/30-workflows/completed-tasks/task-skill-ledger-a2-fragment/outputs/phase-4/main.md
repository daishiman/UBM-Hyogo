# Phase 4 — テスト設計 main

## 命名規則分析

- スクリプト: `kebab-case.ts`（`skill-logs-render.ts` / `skill-logs-append.ts`）
- ライブラリ: `scripts/lib/<kebab>.ts`
- 公開関数: `camelCase`（`renderSkillLogs` / `appendFragment`）
- 定数: `UPPER_SNAKE`（`FRAGMENT_NAME_REGEX` / `PATH_BYTE_LIMIT`）
- テスト: `*.test.ts`（vitest）

## 依存整合チェック（Phase 5 着手前）

```bash
mise exec -- pnpm install
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## targeted vitest run リスト

```bash
mise exec -- pnpm vitest run \
  scripts/skill-logs-render.test.ts \
  scripts/skill-logs-append.test.ts
```

`scripts/**/*.test.ts` を `vitest.config.ts` の `include` に追加済。

## private method テスト方針

- `extractTimestampFromLegacy()` は `export function` として公開し、render 内部で利用しつつ独立テスト可能にする。
- 共通 helper（`fragment-path` / `front-matter` / `branch-escape` / `retry-on-collision` / `timestamp`）はすべて `scripts/lib/` 配下に切り出して個別 import 可能。

## TDD Red 宣言

Phase 4 時点では Red を宣言：実装着手前の `pnpm vitest run` は `Cannot find module './skill-logs-render.js'` 等で全件 fail する。Phase 5 Step 3 / Step 4 完了で順次 Green 化する。

## テスト粒度

- 単体: 15 件（C-1〜C-12 + F-1〜F-11 のうち重複除く）
- 4 worktree smoke: Phase 11 証跡フォーマット固定（実機検証は UT-A2-SMOKE-001）

詳細は [`test-matrix.md`](./test-matrix.md) を参照。

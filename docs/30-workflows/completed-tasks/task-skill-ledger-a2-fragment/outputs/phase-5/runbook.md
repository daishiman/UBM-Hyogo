# Implementation Runbook（Step 1〜4 厳守）

## Step 1: fragment 受け皿作成

- 対象 skill 各々に `LOGS/.gitkeep` / `changelog/.gitkeep` / `lessons-learned/.gitkeep` を作成
- `scripts/lib/fragment-path.ts` に `FRAGMENT_NAME_REGEX` / `PATH_BYTE_LIMIT` / `dirForType` / `buildFragmentRelPath` / `isWithinPathByteLimit` を先置き

ガード:
- `mise exec -- pnpm typecheck` PASS
- `mise exec -- pnpm lint` PASS

参考 commit: `chore(skill): create fragment receivers (.gitkeep) for A-2`

## Step 2: legacy 退避（1 commit に集約）

- `git mv .claude/skills/<skill>/LOGS.md .claude/skills/<skill>/LOGS/_legacy.md`
- 同様に `SKILL-changelog.md` / `lessons-learned-<base>.md`

ガード:
- `git log --follow .claude/skills/aiworkflow-requirements/LOGS/_legacy.md` で旧履歴連続性確認

参考 commit: `refactor(skill): move ledgers to fragment dir as _legacy (A-2)`

## Step 3: render script 実装

- `scripts/lib/front-matter.ts`（YAML parse / build / `FrontMatterError`）
- `scripts/skill-logs-render.ts`（`renderSkillLogs(options)` 実装）
- `scripts/skill-logs-render.test.ts`（C-4〜C-12 + F-9〜F-11）
- `package.json`: `"skill:logs:render": "tsx scripts/skill-logs-render.ts"` 追加
- `tsx` を devDependencies に追加

ガード:
- C-4 〜 C-12 / F-9 〜 F-11 が Green
- `mise exec -- pnpm typecheck` PASS

参考 commit: `feat(skill): implement pnpm skill:logs:render (A-2 T-5)`

## Step 4: append helper 切替（最終 step）

- `scripts/lib/branch-escape.ts` / `timestamp.ts` / `retry-on-collision.ts`
- `scripts/skill-logs-append.ts`（`appendFragment(options)` 実装）
- `scripts/skill-logs-append.test.ts`（C-1〜C-3 + F-1〜F-8）
- `package.json`: `"skill:logs:append": "tsx scripts/skill-logs-append.ts"` 追加
- 既存 `log_usage.js` 系 writer を fragment helper 経由に書換え（後続タスクとして分離可：本タスクは implementation）

ガード:
- C-1 〜 C-3 / F-1 〜 F-8 が Green
- `git grep -n 'LOGS\.md\|SKILL-changelog\.md' .claude/skills/` で writer 経路 0 件（log_usage.js が残る場合は Phase 9 で検出 → Phase 12 で未タスク化）

参考 commit: `feat(skill): unify skill-logs-append helper for fragment writer (A-2)`

## 全 Step 完了後の確認

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run scripts/skill-logs-render.test.ts scripts/skill-logs-append.test.ts
```

## 実コミット保留

`git add` / `git commit` / `git push` / `gh pr create` は **Phase 13 のユーザー承認後** に実行。

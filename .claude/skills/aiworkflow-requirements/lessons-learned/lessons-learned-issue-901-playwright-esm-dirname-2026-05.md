# lessons-learned: issue-901 Playwright ESM `__dirname` 未定義による authenticated-visual job 失敗（2026-05-26）

## 事象

PR #946（feat/issue-901-authenticated-profile-admin-staging-visual）の CI `authenticated-visual` ジョブが下記で fail。

```
ReferenceError: __dirname is not defined in ES module scope
   at visual-staging-authenticated/admin-dashboard-authenticated.spec.ts:9
   at visual-staging-authenticated/profile-authenticated.spec.ts:9
   at visual-staging-authenticated/setup.staging-auth.ts:10
```

連鎖して `Cookie/token leak guard (grep gate)` も fail（teardown が実行されず `apps/web/playwright/.auth` 残留）。

## 原因

`apps/web/playwright/playwright.config.ts` は ESM 化されており、その下の spec / setup / teardown も ESM 解釈される。`__dirname` は CommonJS 限定の globals のため ESM では未定義。

`pnpm typecheck` / `pnpm lint` / pre-push hooks では検出されない（型上は globalThis 扱い）。CI で実行して初めて失敗が顕在化する。

## 解消

4ファイルすべてに以下 3 行を追加して `__dirname` を復元:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
```

正本パターンは `apps/web/playwright/tests/profile-readonly.spec.ts:1-6` に既存。

## L-I901-PWESM 系 lessons

- **L-I901-PWESM-001**: 新規 Playwright spec / setup / teardown を起こす際は、`__dirname` を使う場合に上記 3 行を冒頭に必ず含める。spec template / Phase 4 acceptance に明記する。
- **L-I901-PWESM-002**: `import.meta.dirname`（Node 20.11+）への置換は CI 環境（ts-node / esbuild loader 経由）で undefined になる可能性があるため、`fileURLToPath(import.meta.url)` 経由を正本とする。
- **L-I901-PWESM-003**: setup の ESM エラーで test 0 件のまま終了すると、teardown が走らず `.auth` 残留 → `Cookie/token leak guard` step が連鎖 fail する。一見独立した 2 fail を見たら setup の ESM 失敗を最初に疑う。
- **L-I901-PWESM-004**: typecheck / lint / pre-push hooks では検出できない。Phase 6 quality gate に `pnpm exec playwright test --list` の local 実行を含めて runtime resolution エラーを早期検出する。
- **L-I901-PWESM-005**: 共通化候補。`apps/web/playwright/fixtures/auth-paths.ts` のような共通モジュールで `AUTH_DIR` / `MEMBER_STATE` / `ADMIN_STATE` を export し、spec 側から `__dirname` 直参照を排除する設計が将来の同種失敗を構造的に防ぐ（issue-901 では時間制約により最小修正のみ実施）。

## 反映先

- `.claude/skills/task-specification-creator/references/patterns-lessons-and-pitfalls.md`: 「Playwright spec / setup の ESM `__dirname` 対応」セクションを末尾に追加（L-PWESM-001..004 として汎化）。
- `.claude/skills/aiworkflow-requirements/lessons-learned/`: 本ファイル。

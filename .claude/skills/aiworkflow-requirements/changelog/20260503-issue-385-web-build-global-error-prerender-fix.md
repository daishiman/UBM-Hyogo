# 2026-05-03 issue-385 web build /_global-error prerender fix close-out sync

## 変更概要

- `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/` を Plan A（`apps/web/src/lib/auth.ts` の `getAuth()` lazy factory + `apps/web/package.json` build scripts `NODE_ENV=production` 明示）として正本へ同期。
- Next.js 16.2.4 + React 19.2.5 環境で `/_global-error` / `/_not-found` prerender が `useContext` null で fail する経路を、`next-auth` 静的 import 隔離 と `.mise.toml` 由来 `NODE_ENV=development` の build script 上書き不足の複合問題として解消。
- `apps/web/src/lib/auth/oauth-client.ts` / `session.ts` および 4 route handler (`auth/[...nextauth]` / `auth/callback/email` / `admin/[...path]` / `me/[...path]`) を `await getAuth()` / `await import("next-auth/react")` 経由に書き換え。
- spec docs `docs/00-getting-started-manual/specs/02-auth.md` に「route handler 実装ガイドライン（Plan A lazy factory）」段落を追記。`13-mvp-auth.md` は影響なし注記のみ。
- `lessons-learned-05a-authjs-admin-gate-2026-04.md` の旧 first choice (`"use client"` 撤廃 / global-error RSC 化) 記述を Plan A / Phase 11 PASS 反映で更新（LL-1 同 wave 反映）。
- 既存 unassigned task 3 件（fetchPublic / privacy-terms-pages / wrangler service-binding）は重複作成せず canonical path 参照を維持。
- skill indexes (quick-reference / resource-map / task-workflow-active) の path 参照を `completed-tasks/` 配下へ更新。

## 苦戦箇所

- 最初の仮説 (`app/global-error.tsx` の `"use client"` 撤廃 / Next 16 内蔵 default 採用) を実装試行で disprove → 真因の二次仮説 (`next-auth` top-level import が prerender 経路で `React.createContext(undefined)` を実行し React 19 Dispatcher 解決順を破壊) を切り分け実験で確定 → lazy factory による隔離方針へピボット、という 3 段階のプロセスが必要だった。Phase 1-2 の設計レビューで「first hypothesis disprove → 真因再評価」フローを残せると後続調査が早い。
- `serverExternalPackages: ["next-auth", "@auth/core"]` fallback は useContext null は解消するが next-auth/lib の `next/server` ESM 拡張子問題を新たに招くため不採用。`pnpm patch next-auth` も保守性低で Plan A 正規完了条件に含めない判断。
- `apps/web/package.json` の `build` / `build:cloudflare` に `NODE_ENV=production` を明示しないと `.mise.toml` 由来 `NODE_ENV=development` で build され prerender 結果が production と乖離する罠がある。

## 採用方針

- Plan A — `getAuth()` lazy factory + build scripts `NODE_ENV=production` 明示（next / react / react-dom / next-auth の version、middleware、next.config は不変）
- 不採用案: `"use client"` 撤廃 / Next patch upgrade / React downgrade / `serverExternalPackages` / pnpm patch / Next.js 上流修正待ち

## 影響対象 references

- `references/lessons-learned-05a-authjs-admin-gate-2026-04.md` — LL-1 stale 解消・末尾追記
- `references/task-workflow-active.md` — issue-385 row 追加
- `indexes/quick-reference.md` — Issue #385 専用セクション追加
- `indexes/resource-map.md` — issue-385 row 追加
- `changelog/20260503-issue-385-web-build-global-error-prerender-fix.md` — 本ファイル

## Phase 11 evidence

- `pnpm --filter @ubm-hyogo/web typecheck` PASS
- `pnpm --filter @ubm-hyogo/web lint` PASS
- `pnpm --filter @ubm-hyogo/web test` PASS（lazy factory mock 整合 AC-9）
- `pnpm --filter @ubm-hyogo/web build` exit 0（AC-1）
- `pnpm --filter @ubm-hyogo/web build:cloudflare` exit 0（AC-2）
- `apps/web/.open-next/worker.js` 生成確認
- build ログに `Cannot read properties of null (reading 'useContext')` 0 件（AC-3）
- `apps/web/src/lib/auth.ts` top-level next-auth value import 0 件 / type-only 可（AC-6）

## approval gate

- deploy / commit / push / PR / Issue reopen は user approval 後にのみ実行
- 下流 follow-up（P11-PRD-003 fetchPublic / P11-PRD-004 privacy-terms / wrangler service-binding / 09a staging smoke / 09c production deploy）は本 build 緑化後に再開

## 検証予定

- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js`
- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js`
- `.claude/skills/aiworkflow-requirements` → `.agents/skills/aiworkflow-requirements` mirror sync
- `diff -qr .claude/skills/aiworkflow-requirements .agents/skills/aiworkflow-requirements`

## source

- `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/outputs/phase-12/implementation-guide.md`
- `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/outputs/phase-12/system-spec-update-summary.md`
- `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/outputs/phase-12/skill-feedback-report.md`
- `docs/30-workflows/completed-tasks/issue-385-web-build-global-error-prerender-fix/outputs/phase-12/documentation-changelog.md`

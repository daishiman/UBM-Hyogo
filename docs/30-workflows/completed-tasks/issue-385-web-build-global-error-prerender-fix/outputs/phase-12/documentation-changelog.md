[実装区分: 実装仕様書]

# Documentation Changelog

| 項目 | 値 |
| --- | --- |
| task | issue-385-web-build-global-error-prerender-fix |
| 採用方針 | Plan A — `getAuth()` lazy factory |
| 改訂日 | 2026-05-03 |

> 実 commit / push / PR は本 Phase で実施しない（Phase 13 で user 承認後に実行）。

## 変更履歴

| Date | Scope | Change | Status |
| ---- | ----- | ------ | ------ |
| 2026-05-02 | docs/30-workflows/issue-385-web-build-global-error-prerender-fix/ | 初版ワークフロー作成（first choice: `"use client"` 撤廃 / global-error RSC 化） | superseded |
| 2026-05-03 | docs/30-workflows/issue-385-web-build-global-error-prerender-fix/ | Plan A 採択への仕様改訂（`getAuth()` lazy factory + route handler + oauth-client/session dynamic auth access）。phase-01〜13 / outputs / artifacts.json を全面改訂 | applied |
| 2026-05-03 | docs/00-getting-started-manual/specs/02-auth.md | route handler 実装ガイドラインに `await getAuth()` lazy factory パターンを 1 段落追記 | applied |
| 2026-05-03 | docs/00-getting-started-manual/specs/13-mvp-auth.md | 影響なし確認（本文追記なし） | no-op |
| 2026-05-03 | apps/web/CLAUDE.md | top-level next-auth value import 禁止 / lazy factory 規約を 1 節追記 | skipped（2026-05-03 実確認でファイル不在。root `CLAUDE.md` は本タスク専用規約の追記対象外） |
| 2026-05-03 | apps/web/src/lib/auth.ts ほか route/session files | Plan A 実コード差分を適用。`getAuth()` 内の provider factories は request ごとの env override を保持する形に修正。deploy / commit / push / PR は未実行 | applied |
| 2026-05-03 | apps/web/package.json | `.mise.toml` 由来の `NODE_ENV=development` を build 時に上書きするため、`build` / `build:cloudflare` に `NODE_ENV=production` を明示 | applied |
| 2026-05-03 | pnpm-workspace.yaml / patches/next-auth@5.0.0-beta.25.patch | `serverExternalPackages` fallback 調査用 patch を実差分として検出。Plan A の完了条件には不要であり、PR 同梱可否は最終差分整理対象 | detected |

## 変更対象ファイル列挙

### docs（spec 直接更新）

- `docs/00-getting-started-manual/specs/02-auth.md` — route handler ガイドライン追記
- `docs/00-getting-started-manual/specs/13-mvp-auth.md` — 影響なし注記
- `apps/web/CLAUDE.md` — lazy factory 規約追記（存在時）
- `docs/30-workflows/issue-385-web-build-global-error-prerender-fix/` — 本ワークフロー一式（index.md / phase-01〜13.md / outputs / artifacts.json）

### コード（Phase 13 PR で同梱）

- `apps/web/src/lib/auth.ts`
- `apps/web/src/lib/auth/oauth-client.ts`
- `apps/web/app/api/auth/[...nextauth]/route.ts`
- `apps/web/app/api/auth/callback/email/route.ts`
- `apps/web/app/api/admin/[...path]/route.ts`
- `apps/web/app/api/me/[...path]/route.ts`
- 関連テスト（route.test.ts など mock 整合修正）

### 同期 wave

- wave: issue-385

## diff 概要

| ファイル | diff 概要 |
| --- | --- |
| apps/web/src/lib/auth.ts | top-level `import NextAuth, GoogleProvider, CredentialsProvider, JWT type` 削除、`export async function getAuth()` 追加。provider factories は lazy load し、request ごとの env override で provider option を再構成。`fetchSessionResolve` 等の純粋関数は据置 |
| apps/web/src/lib/auth/oauth-client.ts | top-level `import { signIn } from "next-auth/react"` 削除、関数内 `const { signIn } = await import("next-auth/react");` に置換 |
| apps/web/app/api/auth/[...nextauth]/route.ts | `export { GET, POST }` 直接再 export を `async function GET/POST(req)` 内で `await getAuth()` 経由 |
| apps/web/app/api/auth/callback/email/route.ts | `signIn` を `await getAuth()` 経由で取得 |
| apps/web/app/api/admin/[...path]/route.ts | `auth()` を `await getAuth()` 経由で取得 |
| apps/web/app/api/me/[...path]/route.ts | 同上 |
| 02-auth.md | 「route handler 実装ガイドライン（Plan A lazy factory）」段落追加 |
| apps/web/CLAUDE.md | 2026-05-03 実確認で不在のため未編集 |

## skill index rebuild 実行記録

```bash
mise exec -- pnpm indexes:rebuild
```

| 項目 | 値 |
| --- | --- |
| 実行日時 | 2026-05-03 |
| stdout 末尾（最後 5 行） | `1. トピックマップ生成...` / `✅ indexes/topic-map.md` / `2. キーワード索引生成...` / `✅ indexes/keywords.json (3572キーワード)` / `✅ インデックス生成完了` |
| diff 件数（追加 / 変更 / 削除） | 実走済み。最終値は本レビュー後の `git diff --stat` を参照 |
| CI `verify-indexes-up-to-date` 期待 | PASS（rebuild 実行済み、最終差分で再確認） |

> drift があった場合は `.claude/skills/aiworkflow-requirements/indexes` の更新差分を Phase 13 PR に同梱する。

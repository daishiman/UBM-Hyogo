# Phase 4: 実装仕様（CONST_005 必須）

Phase 1-3 で確定した A / B 両 stream の実装内容を、変更ファイル絶対パス / 関数シグネチャ / TypeScript 型 / 追加 spec file / 実行コマンド / DoD まで完全に書ききる。**コードは書かない。仕様のみ**。

## 0. メタ

| key | value |
|---|---|
| 対象 branch | `feat/admin-identity-conflicts-prototype-alignment` |
| CONST_005 適用 | 関数シグネチャ・型・テスト方針・ローカル実行コマンド・DoD を一切省略しない |
| skill 参照 | 本ファイル末尾「aiworkflow-requirements skill 参照表」参照 |

## 1. Stream A — 変更ファイル一覧（絶対パス）

| # | path | 種類 | 変更概要 |
|---|---|---|---|
| 1 | `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` | 既存編集 | `<main>` + `<header>` + `<Breadcrumb>` を `<AdminPageHeader>` に置換、`<ul divide-y>` を `<section class="card card-pad-lg"><ul class="stack">` に置換 |
| 2 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 既存編集 | Tailwind 直書きを `Button` / `Chip` primitive + `var(--ubm-color-*)` token に置換。modal 再構成（surface のみ）。merge / dismiss 関数の signature 無改変 |
| 3 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 新規 or 更新 | primitive 利用 / token 利用 / 二段階 modal 開閉の unit テスト |
| 4 | `apps/web/app/(admin)/admin/identity-conflicts/__tests__/page.component.spec.tsx` | 新規 or 更新 | `AdminPageHeader` 利用 / list wrapper class 構造 / empty state / error 表示の component テスト |
| 5 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | 既存編集 | class 依存 selector を role / data-* 依存に書き換え（merge / dismiss / authz の振る舞い検証は維持） |

## 2. 関数シグネチャ / 型（A 系統）

### 2.1 page.tsx

```ts
// apps/web/app/(admin)/admin/identity-conflicts/page.tsx
export const dynamic = "force-dynamic";

export default async function AdminIdentityConflictsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<JSX.Element>;

// 内部 helper（既存維持）
declare function toSingle(value: string | string[] | undefined): string | undefined;
```

> 改修ポイント: render される JSX top-level を `<AdminPageHeader />` + 分岐（error / empty / list）に変更。`<main>` wrapper を返さない（layout 提供前提）。

### 2.2 IdentityConflictRow.tsx

```ts
// apps/web/src/components/admin/IdentityConflictRow.tsx
import type { IdentityConflictRow as IdentityConflictRowItem } from "@ubm-hyogo/shared";

export interface IdentityConflictRowProps {
  readonly item: IdentityConflictRowItem;
}

export function IdentityConflictRow(props: IdentityConflictRowProps): JSX.Element;

// 内部 state（既存維持・signature 無改変）
type MergeStep = 0 | 1 | 2;        // 0=closed, 1=confirm, 2=reason
type DismissStep = 0 | 1;          // 0=closed, 1=confirm

// 内部 handler（既存維持・signature 無改変）
declare function openMergeStep1(): void;
declare function closeMerge(): void;
declare function submitMerge(reason: string): Promise<void>;
declare function openDismiss(): void;
declare function submitDismiss(): Promise<void>;
```

> 改修ポイント: render する JSX のみ tokens + primitives に置換。state / handler / fetch wrapper の signature は一切変更しない。

### 2.3 primitive 利用前提

| primitive | 期待 props |
|---|---|
| `AdminPageHeader` | `{ title: string; description?: string; breadcrumbs?: ReadonlyArray<{label: string; href?: string}>; actions?: ReactNode }` |
| `Button` | `{ variant: "primary"\|"ghost"\|"danger"; size: "sm"\|"md"\|"lg"; loading?: boolean; disabled?: boolean; leftIcon?: ReactNode; block?: boolean }` |
| `Chip` | `{ tone: "neutral"\|"warn"\|"ok"\|"err"; children: ReactNode }` |
| `Modal` | `{ open: boolean; onClose: () => void; ariaLabelledBy?: string }` |
| `Field` / `Input` | members alignment と同じ既存 contract |

> 上記 primitive のうち `Chip` / `Modal` の存在確認は Phase 4 実装着手時に `grep -rln 'export function Chip' apps/web/src/components/ui/` 等で実施。存在しない場合は alignment 内で **新規 primitive を生やさず** 既存 admin modal 流用（meetings / tags で利用中の物）に倒す。

## 3. Stream B — 復旧手順（ops + 必要時 code）

### 3.1 観測コマンド（read-only / Phase 4 で実行）

```sh
# H1 deploy 配置確認
bash scripts/cf.sh deployments list --config apps/api/wrangler.toml --env staging

# H3 D1 migration 確認
bash scripts/cf.sh d1 migrations list ubm-hyogo-db-staging --env staging

# H2 env 確認（git で wrangler.toml 観測 / secret は key 一覧のみ）
git show HEAD:apps/web/wrangler.toml | grep -nE 'INTERNAL_API_BASE_URL'
bash scripts/cf.sh secret list --config apps/web/wrangler.toml --env staging

# H4 session 確認（Chrome devtools / curl with cookie）
curl -v -H "Cookie: <admin-session-cookie>" https://<staging-web-origin>/api/admin/identity-conflicts

# H5 proxy path 確認（local 再現）
pnpm --filter web dev
pnpm --filter api dev
curl -v -H "Cookie: <local-admin-session>" http://localhost:3000/api/admin/identity-conflicts
# api 側 tail で受信 path を観測
```

### 3.2 復旧コマンド（hit 仮説別 / Gate-C user-gated）

| hit | コマンド | 補足 |
|---|---|---|
| H1 | `bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging` | `origin/dev` HEAD で実行 |
| H2 | `apps/web/wrangler.toml` の `[env.staging.vars]` の `INTERNAL_API_BASE_URL` を正値に修正 → `bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging` | コード変更を含む |
| H3 | `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging` | forward-only |
| H4 | admin として再 sign-in。構造的問題（短すぎる session 期限など）なら別 issue 起票 | 本 workflow scope 外 |
| H5 | `apps/web/app/api/admin/[...path]/route.ts` の `proxy()` の `target` 連結を最小 patch + `apps/web/src/lib/admin/__tests__/proxy-path.spec.ts` 新規 vitest 追加 | コード変更を含む |

### 3.3 H5 hit 時の追加変更ファイル / 関数 signature

```ts
// apps/web/app/api/admin/[...path]/route.ts （既存）
// 既存 proxy() 関数の signature は無改変。target 連結の最小 patch のみ。
async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response>;

// apps/web/src/lib/admin/__tests__/proxy-path.spec.ts （新規）
// vitest unit。fetch を mock し、proxy()(req, ctx) が呼ぶ upstream URL を assert する。
describe("admin proxy path", () => {
  it("forwards /api/admin/identity-conflicts to <apiBase>/admin/identity-conflicts", async () => {
    // ...
  });
  it("preserves search params", async () => { /* ... */ });
  it("does not double-prefix /admin/admin", async () => { /* ... */ });
});
```

## 4. ローカル実行コマンド

```sh
# 依存（mise + pnpm 経由）
mise exec -- pnpm install

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint

# focused vitest
mise exec -- pnpm --filter @ubm-hyogo/web vitest run -- IdentityConflictRow
mise exec -- pnpm --filter @ubm-hyogo/web vitest run -- identity-conflicts.page

# proxy path 回帰（H5 hit 時のみ）
mise exec -- pnpm --filter @ubm-hyogo/web vitest run -- proxy-path

# Playwright e2e
mise exec -- pnpm exec playwright test admin-identity-conflicts

# design token CI gate (local)
mise exec -- pnpm verify:design-tokens || true   # script 名は CI workflow 側で確認

# build (OpenNext Workers)
mise exec -- pnpm --filter @ubm-hyogo/web build

# staging 復旧（Gate-C user-gated）
# bash scripts/cf.sh deploy --config apps/api/wrangler.toml --env staging
# bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging
```

## 5. テスト方針（Phase 4 内）

| 層 | テスト | 期待 |
|---|---|---|
| unit (vitest) | `IdentityConflictRow.spec.tsx` | row が `Button` / `Chip` を render。merge Step1 → Step2 遷移 / reason 必須 / dismiss 確認 / submit 失敗時の error 表示 |
| component (vitest) | `page.component.spec.tsx` | `AdminPageHeader` を render。list / empty / error 3 状態を render |
| unit (vitest, H5 hit 時) | `proxy-path.spec.ts` | `/api/admin/identity-conflicts` → upstream `/admin/identity-conflicts`（二重 prefix 禁止） |
| e2e (playwright) | `admin-identity-conflicts.spec.ts` | merge / dismiss / authz の既存 flow を維持 |
| visual (Phase 11) | local screenshot 3 枚（list / empty / merge Step1） | 規範 admin alignment と同等の見た目 |
| runtime (Phase 11) | staging で `/admin/identity-conflicts` GET 200 | `ADMIN_FETCH_404` が描画されない |

## 6. DoD（Phase 4 全体）

- [ ] Stream A の 5 変更ファイルが Phase 1-3 の規範通りに修正される
- [ ] Stream B の root-cause が 1 つ以上特定され、復旧手段が決定される
- [ ] `pnpm typecheck` / `pnpm --filter web lint` / `pnpm --filter web vitest run` / `pnpm exec playwright test admin-identity-conflicts` が全て PASS
- [ ] HEX 直書き / Tailwind 色 utility が `apps/web/app/(admin)/admin/identity-conflicts/` 配下と `apps/web/src/components/admin/IdentityConflictRow.tsx` で 0 件
- [ ] H5 hit 時のみ `proxy-path.spec.ts` 追加 + PASS
- [ ] staging 復旧 evidence（Phase 11 で取得）の取得手順がこのファイルから再現可能

## 7. aiworkflow-requirements skill 参照表（実装時）

| ref file | 利用目的 |
|---|---|
| `.claude/skills/aiworkflow-requirements/references/architecture-admin-api-client.md` | admin proxy / requireAdmin 境界 / fetchAdmin の wiring 確認 |
| `.claude/skills/aiworkflow-requirements/references/database-admin-repository-boundary.md` | D1 直接アクセス禁止と repository 境界の不変条件 |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-admin-ui-prototype-alignment-2026-05.md` | admin UI alignment 全般の汎化パターン |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-B-admin-members-2026-05.md` | AdminPageHeader 配線パターン（members 確立形） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-C-admin-tags-2026-05.md` | card-pad-lg + stack 構造パターン（tags 確立形） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-06c-E-admin-meetings-2026-05.md` | list row 構成の規範（meetings 確立形） |
| `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-194-identity-merge-2026-05.md` | 二段階 merge / dismiss の UX 不変条件 |
| `.claude/skills/aiworkflow-requirements/references/patterns-runtime-evidence-followup.md` | 404 / runtime 不全の followup evidence 取得パターン |
| `.claude/skills/aiworkflow-requirements/references/patterns-troubleshooting-worktree-cloudflare.md` | Cloudflare 系 ops コマンド（`scripts/cf.sh` 経由）の必須利用 |

## 8. CONST_005 / CONST_007 自己チェック

- [x] 関数シグネチャを TypeScript 型で明示
- [x] 変更ファイル絶対パスを列挙
- [x] 追加 spec file 名を確定
- [x] ローカル実行コマンドを `mise exec --` 付きで明示
- [x] DoD をチェックボックスで列挙
- [x] 1 サイクル完了スコープ（A と B を 1 PR で完結）を維持
- [x] 先送り禁止（H4 のみ別 issue 起票が許容、それ以外は本 cycle 内）

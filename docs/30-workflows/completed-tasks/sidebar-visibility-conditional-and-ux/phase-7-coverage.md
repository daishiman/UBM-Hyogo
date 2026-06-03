# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 4（TC）/ Phase 6（fail path・回帰 guard）, Phase 2 設計（変更ファイル一覧） |
| 出力 | 変更ファイル/分岐に限定した coverage 対象範囲・計測コマンド・実測記録方針 |
| 方針 | 全体 X% でなく **変更行/分岐の line / branch を実測**して残す（Feedback BEFORE-QUIT-002 / Feedback 5） |

## 目的

本タスクは「route topology 移動 + middleware 1 行注入 + 既存 layout / shell コンポーネントの薄い分岐追加」であり、新規の純関数・ビジネスロジックを大量には追加しない。よって coverage は **全ファイル一律でなく、T1/T2/T3 が実際に変更した行・新設分岐に限定** して計測・確認する。shell 内部（`SidebarShell.server.tsx` / `useSidebarState` / `shell-config.ts`）や移動のみの page（`login/_components/*`）は対象外とする。

## カバレッジ対象範囲

| 区分 | 対象ファイル | 計測対象か | 理由 |
|------|-------------|-----------|------|
| T1 新設 layout | `apps/web/app/(auth)/layout.tsx` | ✅ 対象 | 新規 bare layout（render される全 line を踏む） |
| T2 middleware 分岐 | `apps/web/middleware.ts`（**x-pathname 注入行のみ**） | ✅ 対象（限定） | `requestHeaders.set("x-pathname", ...)` 追加行 + guarded/unguarded 双方で乗ること（既存 guard 分岐は本タスク非変更） |
| T2 admin activePath 解決 | `apps/web/app/(admin)/layout.tsx`（**activePath 解決分岐のみ**） | ✅ 対象（限定） | `headers().get("x-pathname") ?? "/admin"` の **両 branch**（注入あり / fallback） |
| T3 viewer 分岐 | `apps/web/src/components/shell/SidebarUserMenu.tsx`（viewer identity / login CTA 分岐） | ✅ 対象 | viewer ゲスト表記 + CTA 強調 + collapsed sr-only の新設分岐 |
| T3 viewer avatar variant | `apps/web/src/components/shell/SidebarUserAvatar.tsx`（viewer variant 追加分） | ✅ 対象 | viewer variant の追加 line（admin badge 既存分は回帰） |
| T3 active/badge 視認性 | `apps/web/src/components/shell/SidebarNavItem.tsx`（active / badge 視認 line） | ✅ 対象（限定） | active class / badge collapsed 縮約の line（`aria-current`/`data-active` 既存分は回帰維持） |
| 移動のみ login | `apps/web/app/(auth)/login/page.tsx` / `_components/*` | ❌ 対象外 | 本文ロジック不変（`git mv` による物理移動のみ。差分は import 深度 0 / 配置変更のみ） |
| shell 内部 | `apps/web/src/components/shell/SidebarShell.server.tsx` / `useSidebarState.ts` / `shell-config.ts` / `user-menu-config.ts` | ❌ 対象外 | Task A/B の責務。本タスクは mount / prop 渡しのみで当該ロジックを変更しない |
| middleware 既存 guard | `middleware.ts` の admin/profile redirect 分岐 | ❌ 対象外 | 本タスク非変更（既存 spec が担保）。x-pathname が guard を壊さないことは Phase 6 FP-3 で確認 |

## 計測する変更行・分岐（line / branch）

本タスクで新たに導入される branch は限定的。両側を spec で踏むことを必須とする。

| 計測ポイント | 場所 | branch 両側の踏み方 | 対応 TC |
|---|---|---|---|
| `requestHeaders.set("x-pathname", req.nextUrl.pathname)` | `middleware.ts` | unguarded path / guarded path（admin 通過・profile 通過）双方で next 経路 request header に乗ることを確認（redirect 経路では request header 注入が副作用を出さない） | TC-T2-01/02/04, FP-3/FP-7 |
| `(await headers()).get("x-pathname") ?? "/admin"` | `(admin)/layout.tsx` | (a) `get→"/admin/members"` で左辺採用 / (b) `get→null` で `?? "/admin"` fallback の 2 ケースを `headers()` mock 切替 | TC-T2-06/07, FP-4 |
| viewer identity / login CTA 分岐 | `SidebarUserMenu.tsx` | role="viewer"（ゲスト表記 + CTA 描画 + collapsed sr-only）/ role="member"・"admin"（identity ブロック）の双方を render | TC-T3-01/02/04/05, FP-5/FP-6 |
| viewer avatar variant | `SidebarUserAvatar.tsx` | role="viewer"（viewer variant）/ role="admin"（badge dot 既存）双方 | TC-T3-01, RG-5 |
| active class / badge collapsed 縮約 | `SidebarNavItem.tsx` | active / 非 active、badge 有 collapsed=false / collapsed=true の各分岐 | TC-T3-06..10 |
| `(auth)/layout.tsx` 全 line | `(auth)/layout.tsx` | bare wrapper の単一 return path を 1 render で踏む | TC-T1-03, FP-2 |

> middleware の x-pathname 注入は `requestHeaders.set` の 1 行であり独立分岐を持たないが、「guarded / unguarded / redirect」の 3 経路で「乗る or 副作用なし」を確認することで実質的な経路 coverage を担保する（line coverage は 1 行だが経路網羅で品質を裏付ける）。

## カバレッジ計測コマンド

`apps/web/package.json` の `test:coverage` は既定で `--coverage.include="apps/web/src/**"` のため `app/**`（layout）は include に含まれない。本タスクの変更ファイルは `app/**` と `src/components/shell/**` に跨るため、**対象 path を明示した一時計測** を行う。

```bash
# Node 24 固定・リポジトリルートから実行（CLAUDE.md 規約）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  --root=../.. --config=vitest.config.ts \
  --coverage \
  --coverage.reportsDirectory=apps/web/coverage \
  --coverage.include="apps/web/app/(auth)/layout.tsx" \
  --coverage.include="apps/web/app/(admin)/layout.tsx" \
  --coverage.include="apps/web/middleware.ts" \
  --coverage.include="apps/web/src/components/shell/SidebarUserMenu.tsx" \
  --coverage.include="apps/web/src/components/shell/SidebarUserAvatar.tsx" \
  --coverage.include="apps/web/src/components/shell/SidebarNavItem.tsx" \
  "apps/web/app/(auth)/login/__tests__/login-page.spec.tsx" \
  "apps/web/app/(admin)/layout.spec.tsx" \
  "apps/web/src/__tests__/middleware-x-pathname.spec.ts" \
  "apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx" \
  "apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx"
```

> 簡易版（focused run のみ・coverage 数値不要時）:
> `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/__tests__/middleware.spec.ts" "apps/web/app/(admin)/layout.spec.tsx"`

### 実測記録方針（Feedback BEFORE-QUIT-002）

- 上記コマンドの出力から、**対象ファイルの line / branch 実測値**（例: `(admin)/layout.tsx` の x-pathname fallback branch が both-covered か）を Phase 12 outputs に転記する。
- 「全体 X%」ではなく **変更行 / 新設 branch の covered 有無** を記す。未達 branch（例: fallback 片側のみ）が出た場合は本ファイルの「両側の踏み方」に従い focused spec を補完する。
- shell 内部や移動のみ page の coverage 数値は対象外として明記し、低くても本タスクの未達とはみなさない。

## カバレッジ未達時の方針

- 未達がある場合は Phase 12 で未タスク化（バックログ送り）せず、**同一 execution wave 内**で focused spec を補完する（親 workflow 方針継承 / CONST_007 の 1 サイクル完結）。
- 特に T2 の admin activePath fallback（両 branch）と T3 viewer 分岐は AC-5 / AC-6 直結のため、片側未踏は必ず補完する。

## 参照資料

- Phase 4 テスト計画（TC-T1/T2/T3 / SSR・headers モック方針）
- Phase 6 テスト追加（fail path FP-3/4/7 / 回帰 guard）
- Phase 2 設計（変更ファイル一覧 / x-pathname 注入 / viewer・active・badge 分岐）
- `apps/web/package.json`（`test:coverage` の include 既定が `src/**` である事実）
- 参考: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-7-coverage.md`（変更 path 限定計測 / `--coverage.include` 明示パターン）

## 完了条件

- [ ] coverage 対象を変更ファイル / 新設分岐に限定し、対象外（shell 内部・移動のみ page）を明記している
- [ ] x-pathname 注入経路・admin activePath fallback 両 branch・viewer 分岐・active/badge 分岐の踏み方が定義されている
- [ ] 対象 path を明示した coverage 計測コマンドが確定している
- [ ] 全体 % でなく変更行 line / branch 実測を残す方針が明記されている（Feedback BEFORE-QUIT-002 / Feedback 5）
- [ ] 未達時は同一 wave 内で focused spec を補完する方針が明記されている

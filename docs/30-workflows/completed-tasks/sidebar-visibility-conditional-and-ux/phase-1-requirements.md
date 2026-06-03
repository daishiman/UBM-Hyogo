# Phase 1: 要件定義

> **[実装区分: 実装仕様書]** — 本ワークフローは route topology / middleware / shell コンポーネントへの **コード変更を伴う実装仕様書** である（CONST_004）。判定根拠: 「ログイン前にサイドバーが表示される」現象の是正は layout 配置変更・header 注入・コンポーネント分岐の追加を必須とし、ドキュメント変更だけでは目的を達成できないため。

## メタ情報

| 項目 | 値 |
|------|-----|
| task_id | `sidebar-visibility-conditional-and-ux` |
| 作成日 | 2026-06-02 |
| task_type | implementation |
| visual_category | VISUAL（サイドバーの表示/非表示・identity 表記・active 表示が視覚的成果物） |
| implementation_mode | `new`（新規の振る舞い追加 + 既存 layout の修正） |
| spec_classification | implementation_spec |
| workflow_state | implemented_local_evidence_captured（実コード・direct focused tests・typecheck・lint・local screenshot 4 PNG 完了。admin/staging screenshot・commit・PR は user-gated） |
| 関連 spec | `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md` §1.2 / §1.6 |
| 親系譜 | `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`（統合シェル）, `docs/30-workflows/unified-sidebar-shell-task-e-mobile-drawer-responsive/`（mobile drawer）, `docs/30-workflows/issue-1024-...`（collapse cookie） |

## 真の論点（要件レビュー思考法）

1. **真の論点**: 「ログイン画面でサイドバーが出る」は表層。主問題は **サイドバーの表示条件（route × 認証状態 × role）が単一の正本で表現されておらず、`(public)/layout.tsx` が無条件描画している** こと。正本仕様 09h §1.6 は既に「`/login` は shell 外 bare」と規定済み = **実装が正本仕様から逸脱している（spec drift bug）**。
2. **依存関係・責務境界の問題**: 「どの route が shell を被るか」の決定権が現状 layout 実装に散在し、宣言的な単一ソースが無い。Next.js の route group がこの責務の自然な所有者。
3. **価値とコストの不均衡**: login bare 化は低コスト・高価値（仕様逸脱の解消）。一方 SSR active 表示の正確化（`x-pathname` 注入）は middleware 1 行 + layout 数行で全 route に波及する高レバレッジ。
4. **改善優先順位**: (1) login bare 化（バグ） → (2) 表示条件の単一正本化（route group + invariant test） → (3) SSR active 正確化 → (4) viewer identity / active・badge 視認性。
5. **4条件評価**:
   - 価値性: 未ログインユーザーの認証導線の二重化を解消し、全 role でサイドバー表示を予測可能にする。
   - 実現性: 既存 SidebarShell / shell-config を再利用し、新規 primitive を増やさず初回サイクルで完了可能。
   - 整合性: 正本 09h の route→shell マトリクスへ実装を一致させる（drift 解消）。route group が表示条件の単一所有者。
   - 運用性: invariant test（login が shell 外）と middleware spec で回帰を機械担保。

## P50 前提確認チェック

| 確認項目 | 結果 |
|----------|------|
| current branch に実装が存在するか | Yes（`apps/web` に route topology / middleware / shell UX 実装差分あり） |
| upstream（dev/main）にマージ済みか | No（commit / push / PR は user-gated） |
| 前提タスク（依存）が完了済みか | Yes。SidebarShell（Task A）/ user-menu（Task B）/ mobile drawer（Task E）/ public-member 統合（Task C）は dev にマージ済み。本件はその上の差分修正 |

→ implementation_mode = `new`。Phase 5 は通常実装手順（route 移動 + 修正）。

## 既存コードベースの命名規則（FB-01 / FB-SDK-07-4）

| 種別 | 規則 | 実例 |
|------|------|------|
| route group dir | `(kebab)` | `(public)` / `(member)` / `(admin)` / `(dev)` |
| layout/page | Next.js 固定名 | `layout.tsx` / `page.tsx` |
| shell コンポーネント | PascalCase + 役割 suffix | `SidebarShell` / `SidebarUserMenu` / `SidebarNavItem` |
| server entry | `*.server.tsx` | `SidebarShell.server.tsx` |
| 純関数 config | `kebab-config.ts` | `shell-config.ts` / `user-menu-config.ts` |
| role union | `ShellRole = "viewer" | "member" | "admin"` | `shell-config.ts` |
| test | colocated `__tests__/*.spec.tsx`（不変条件 #8: `.spec` のみ） | `__tests__/SidebarUserMenu.spec.tsx` |
| data 属性 | `data-shell-*` / `data-route-group` / `data-testid` | `data-shell="root"` / `data-route-group="public"` |

→ 新規 layout は `(auth)/layout.tsx`、新規分岐は既存 `SidebarUserMenu` / `SidebarUserAvatar` / `SidebarNavItem` 内に閉じ、新規 primitive を増やさない（不変条件: プロトタイプ正本順位 #3）。

## 要件（FR / NFR）

### 機能要件
- **FR-1**: `/login` はサイドバー（SidebarShell）を一切描画しない bare レイアウトで表示する（正本 09h §1.6 への一致）。
- **FR-2**: サイドバーの表示/非表示は route group を単一正本とする。`(auth)` = shell 無し、`(public)` / `(member)` / `(admin)` = shell 有り。
- **FR-3**: 全 route で SSR 時点の active nav 表示が正しい（`x-pathname` を middleware が注入し、各 layout が `activePath` として渡す）。hydration 前の active 誤表示（admin の `/admin` ハードコード含む）を解消する。
- **FR-4**: 未ログイン（viewer）時のサイドバー identity 表記は「ゲスト/未ログイン」であることが明確で、ログイン導線（CTA）が視認できる（メンバー風の誤認を解消）。
- **FR-5**: ログイン済（member / admin）のサイドバーで現在ページの active 表示と admin badge（schema diff 件数）が視認しやすい。

### 非機能要件
- **NFR-1**: 既存 API endpoint surface のみ利用。D1 schema / Google Form 仕様の変更禁止（不変条件 #1, #5, UI alignment #1）。
- **NFR-2**: 色は OKLch トークン正本（`tokens.css` / 09b-design-tokens.md）のみ。HEX 直書き / `bg-[#xxx]` 禁止（UI alignment #2、CI gate `verify-design-tokens`）。
- **NFR-3**: 新規 primitive を生やさず既存 shell primitives で構成（UI alignment #3）。
- **NFR-4**: `apps/web` から D1 binding への直接アクセス禁止（不変条件 #5）。
- **NFR-5**: 認証境界は fail-closed を維持（admin/profile の middleware + layout 二段防御 = 不変条件 #11 を壊さない）。shell の role 判定は従来通り fail-open（viewer fallback）。

## Acceptance Criteria

| ID | 受入条件 | 検証手段 |
|----|----------|----------|
| AC-1 | `/login` のレンダリング DOM に `data-testid="public-shell"` / `aside`（サイドバー）が存在しない | login page render test（jsdom） |
| AC-2 | `/login` が `app/(auth)/login/page.tsx` に存在し、`(auth)/layout.tsx` は SidebarShellServer を import しない | ファイル存在 + `git grep` invariant test |
| AC-3 | `/login` の URL は変わらず `/login` のまま（route group はパスに出ない） | 既存 login query / redirect テストが green |
| AC-4 | middleware が全 request に `x-pathname` request header を設定する | middleware spec |
| AC-5 | `(admin)/layout.tsx` が `activePath` を `x-pathname` から解決する（`/admin` ハードコードを撤廃） | admin layout test / grep |
| AC-6 | viewer 時、`SidebarUserMenu` が「ゲスト」表記 + ログイン CTA を描画し、member/admin と視覚的に区別される | SidebarUserMenu.spec.tsx（role="viewer"） |
| AC-7 | member/admin 時、active nav item が `aria-current="page"` と視認可能なスタイルを持つ | SidebarNavItem.spec.tsx |
| AC-8 | 表示条件マトリクス（route × role × shell）が 09h §1.6 に反映され、login=shell外を保証する invariant test が存在する | static invariant spec + 09h diff |
| AC-9 | `pnpm typecheck` / `pnpm lint` / 対象 vitest が green、HEX 直書き 0 | CI gate / grep |

## タスク分類（Feedback 3 / Phase 11 判定の固定）

- **UI task / VISUAL**。サイドバーの表示・非表示・identity 表記・active 表示は視覚的成果物。Phase 11 は VISUAL（local deterministic evidence は取得済み。pixel screenshot / staging visual baseline は running stack 依存の user-gated として分離）。

## 実装作業の分解（単一責務 / 3 タスク・全て1サイクル内 — CONST_007）

| Task | 責務 | 主変更ファイル | 並列性 |
|------|------|---------------|--------|
| **T1** route topology | login を `(auth)` group へ移動し bare 化 + 表示条件マトリクス正本化 + invariant test | `app/(auth)/layout.tsx`(新), `app/(auth)/login/**`(移動), 09h spec, invariant spec | 独立（先行） |
| **T2** SSR active | middleware `x-pathname` 注入 + 全 layout の activePath 正確化（admin の hardcode 撤廃） | `middleware.ts`, `app/(admin)/layout.tsx`, （`(public)`/`(member)` は fallback のみ） | T1 と独立 |
| **T3** shell UX | viewer=ゲスト/ログインCTA + active/badge 視認性 | `SidebarUserMenu.tsx`, `SidebarUserAvatar.tsx`, `SidebarNavItem.tsx` | T1/T2 と独立 |

> 分離理由は「関心ごとの分離・並列実行」であり先送りではない。T1〜T3 は同一実装サイクル（03.実装.md）で完了するスコープ。未タスク（バックログ）への分離は本ワークフローでは行わない。

## targeted test ファイルリスト（FB-UI-02-2 / 全件 run 回避）

```
apps/web/app/(auth)/login/__tests__/login-page.spec.tsx        # 移動後 + shell非表示
apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts    # invariant: login=shell外（新規）
apps/web/middleware.spec.ts もしくは src/__tests__/middleware-x-pathname.spec.ts  # x-pathname 注入（新規/拡張）
apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx   # viewer ゲスト表記
apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx    # active aria-current/視認性
apps/web/src/components/shell/__tests__/shell-config.spec.ts        # 既存回帰
```

実行例: `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/app/(auth)" "apps/web/src/components/shell" "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" "apps/web/src/__tests__/static-invariants.runtime.spec.ts" "apps/web/__tests__/middleware.spec.ts"`

## carry-over 確認（git log -5）

- `7f91b1494` docs(issue-235) / `ba8bbff0c` feat(issue-230 lefthook) / `52af4e488` feat(public members tags) / `6e227f06f` docs(issue-264 cron) / `745c95115` feat(member-publish-recovery)。
- 本件と直接重複なし。サイドバー系の直近実装（Task C/E, issue-1024）は dev マージ済みで、本件はその差分修正。

## 参照資料

- 正本仕様: `docs/00-getting-started-manual/specs/09h-shell-and-fixtures.md`（§1.2 role→nav, §1.6 route→shell, §1.7 実装出典）
- 認証: `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md`
- デザイントークン: `docs/00-getting-started-manual/specs/09b-design-tokens.md` / `apps/web/src/styles/tokens.css`
- 着手前状態: `apps/web/app/(public)/layout.tsx`, `apps/web/app/(member)/layout.tsx`, `apps/web/app/(admin)/layout.tsx`, `apps/web/app/(public)/login/page.tsx`, `apps/web/middleware.ts`, `apps/web/src/components/shell/SidebarShell.server.tsx`, `apps/web/src/components/shell/shell-config.ts`, `apps/web/src/components/shell/SidebarUserMenu.tsx`

## 完了条件

- [x] 実装区分（実装仕様書）と判定根拠を明記した
- [x] FR/NFR/AC を定義した（AC-1〜AC-9）
- [x] タスク分類（UI/VISUAL）を固定した
- [x] 実装作業を単一責務の 3 タスク（T1/T2/T3）に分解し、全て1サイクル内に収まることを明記した（CONST_007）
- [x] targeted test ファイルリストを事前列挙した
- [x] 既存命名規則・参照資料を記録した

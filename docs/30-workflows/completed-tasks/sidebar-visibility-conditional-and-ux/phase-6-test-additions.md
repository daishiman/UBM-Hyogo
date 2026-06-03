# Phase 6: テスト追加

> Phase 4（Red の主軸）を補完し、**fail path・境界・既存挙動の回帰 guard** を追加する。
> Phase 5 実装後に green であることを確認し、Phase 7（coverage）/ Phase 9（QA）へ trace する。

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 4 テスト計画（TC-T1/T2/T3）, Phase 2 設計（状態所有権 / fail-open・fail-closed 境界） |
| 出力 | fail path / 回帰 guard ケース表 |
| 方針 | fail path は「壊れた入力でも throw / 認証境界崩壊しない」を、回帰 guard は「既存契約の不変」を機械担保 |

## 目的

T1〜T3 の主系統（Phase 4）に対し、(1) `getSession` 失敗・x-pathname 未注入・viewer 直リンク等の fail/境界 path、(2) 既存 shell-config / SidebarShell.server / login query / 認証 redirect 契約の回帰 guard、(3) HEX 直書き 0 の静的 guard を追加し、Phase 5 実装で全 green へ転じることを確認する。

## 追加するfail path・回帰テスト

### 1. fail path

| # | ケース | 対象 | 検証 | 期待 | AC |
|---|--------|------|------|------|-----|
| FP-1 | `(auth)/login` は session 取得失敗でも bare のまま | `(auth)/login/__tests__/login-page.spec.tsx` | `getSession` を reject（throw）に mock し、現行 page の throw 伝播挙動を確認。`(auth)/layout.tsx` 単体は session を呼ばないことを別途確認 | `(auth)/layout.tsx` は `getSession` を import / 呼出しない（grep）。layout 単体 render は session 非依存で常に bare（`aside` 不在） | AC-1/AC-2 |
| FP-2 | `(auth)/layout.tsx` が session に依存しない（責務境界） | `src/__tests__/sidebar-shell-route-topology.spec.ts` | `(auth)/layout.tsx` を `readFileSync` し `getSession` / `next-auth` を含まないか検査 | いずれも **含まない**（bare は認証非依存） | AC-2 |
| FP-3 | middleware: x-pathname 注入が guard 判定を阻害しない | `src/__tests__/middleware-x-pathname.spec.ts` | guarded `/admin` 未ログイン（claims=null） | `admin_required` redirect が従来どおり発火し、redirect レスポンスに余計な request header 注入で副作用が出ない（location が `/login?gate=admin_required`） | AC-4 |
| FP-4 | x-pathname 未注入時の admin layout fallback | `(admin)/layout.spec.tsx` | `headers().get("x-pathname")→null` | throw せず `activePath="/admin"`（fallback。TC-T2-07 と同等を fail path として明示） | AC-5 |
| FP-5 | viewer は popover action を開かず直リンク（誤誘導なし） | `SidebarUserMenu.spec.tsx` | role="viewer", user=null | viewer の login CTA は `<a>`/`Link` の直リンク（`href="/login"`）であり、member/admin の `<details>` popover に依存せず単独でクリック可能（CTA 要素が `summary` 配下の popover 内に閉じ込められていない、もしくは popover を開かずに到達可能） | AC-6 |
| FP-6 | viewer に存在しない action を出さない | `SidebarUserMenu.spec.tsx` | role="viewer" | `[data-action="profile"]` / `[data-action="edit-request"]` / `[data-action="admin-dashboard"]` / `[data-testid="sign-out-button"]` が全て **null** | AC-6 |
| FP-7 | middleware: 深い guarded path（`/admin/members/...`）でも x-pathname が full pathname | `src/__tests__/middleware-x-pathname.spec.ts` | guarded `/admin/members/123`（admin claims 有効） | next 経路 request header `x-pathname="/admin/members/123"`（`startsWith("/admin")` guard 通過 + pathname 全長注入） | AC-4/AC-5 |

### 2. 回帰 guard（既存契約の不変）

| # | ケース | 対象 | 検証 | 期待 | AC |
|---|--------|------|------|------|-----|
| RG-1 | login query / redirect 契約不変 | `(auth)/login/__tests__/page.spec.tsx`（移動後） | 既存 6 ケース（anonymous render / authenticated→/profile / safe next / array next / unsafe next fallback / loop 防止）を `git mv` 後そのまま実行 | 全 green（URL `/login` 不変・redirect 契約不変） | AC-3 |
| RG-2 | `shell-config.spec.ts` green 維持 | `apps/web/src/components/shell/__tests__/shell-config.spec.ts` | 無変更で再実行 | 全 green（`buildNavForRole` / `isNavItemActive` 不変。本タスクは shell-config を変更しない） | AC-9 |
| RG-3 | `SidebarShell.server.spec.tsx` green 維持 | `apps/web/src/components/shell/__tests__/SidebarShell.server.spec.tsx` | 無変更で再実行 | 全 green（shell mount 配線・role 判定不変） | AC-9 |
| RG-4 | active nav 既存アサーション維持 | `SidebarNavItem.spec.tsx` | 既存 3 ケース（external anchor / 内部 active aria-current/data-active / collapsed sr-only） | 全 green（T3 視認性追加で既存契約を壊さない） | AC-7 |
| RG-5 | member/admin user menu 既存アサーション維持 | `SidebarUserMenu.spec.tsx` | 既存 member / admin / avatar data-role / collapsed の各ケース | 全 green（viewer 強化で member/admin 契約を壊さない） | AC-6 |
| RG-6 | middleware の x-nonce / CSP 不変 | `src/__tests__/middleware-x-pathname.spec.ts` | 任意 path | request header `x-nonce` / `Content-Security-Policy` と response の security headers が従来どおり付与（x-pathname 追加が既存 header を消さない） | AC-4 |
| RG-7 | URL に route group が漏れない | `src/__tests__/sidebar-shell-route-topology.spec.ts` | `apps/web` 配下を grep | リンク文字列に `"/(auth)/"` / `"/(public)/"` が **ヒット 0**（route group がリンク先 URL に混入していない） | AC-3 |

### 3. 表示条件マトリクス invariant（09h §1.6 反映の guard）

| # | ケース | 対象 | 検証 | 期待 | AC |
|---|--------|------|------|------|-----|
| MX-1 | login=shell外 invariant | `src/__tests__/sidebar-shell-route-topology.spec.ts` | `(auth)/layout.tsx` が shell を import しない（FP-2 / TC-T1-07 と統合）+ `(public)/(member)/(admin)/layout.tsx` は `SidebarShellServer` を import する | `(auth)` のみ shell 非 import、他 3 group は shell import を保持（マトリクスの「shell 有無」を構造で固定） | AC-8 |
| MX-2 | 09h §1.6 マトリクス反映 | doc diff（QA step） | 09h §1.6 に `(auth)/login = bare / 非表示` 行が存在 | doc に当該行が反映済み（grep `(auth)` + `login` + `bare`/`非表示`） | AC-8 |

## 回帰guard一覧（静的 / CI step）

unit ではなく QA / CI step として Phase 9 で再実行する。

| # | チェック | コマンド | 期待 | AC |
|---|---------|---------|------|-----|
| G-1 | `(auth)/layout.tsx` が shell を import しない | `grep -n "SidebarShellServer\|SidebarShell.server\|SidebarMobileTrigger" "apps/web/app/(auth)/layout.tsx"` | ヒット 0 | AC-2 |
| G-2 | admin layout の `activePath="/admin"` ハードコード撤廃 | `grep -n 'activePath="/admin"' "apps/web/app/(admin)/layout.tsx"` | ヒット 0（`?? "/admin"` fallback は別表現で許容） | AC-5 |
| G-3 | middleware に x-pathname 注入が存在 | `grep -n 'x-pathname' apps/web/middleware.ts` | ヒット ≥1（`requestHeaders.set("x-pathname", ...)`） | AC-4 |
| G-4 | 旧 login パス不在 | `test ! -e "apps/web/app/(public)/login"` | true | AC-2 |
| G-5 | HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` 0（変更ファイル） | `grep -rnE '#[0-9a-fA-F]{3,8}\b\|bg-\[#\|text-\[#' "apps/web/app/(auth)" "apps/web/src/components/shell/SidebarUserMenu.tsx" "apps/web/src/components/shell/SidebarUserAvatar.tsx" "apps/web/src/components/shell/SidebarNavItem.tsx" --include="*.tsx"` | ヒット 0（OKLch token のみ / NFR-2 / `verify-design-tokens`） | AC-9 |
| G-6 | route group が URL リンクに漏れない | `grep -rn '"/(auth)/"\|"/(public)/"' apps/web/ --include="*.ts" --include="*.tsx" \| grep -v node_modules` | ヒット 0 | AC-3 |
| G-7 | 型 / lint | `mise exec -- pnpm typecheck && mise exec -- pnpm lint` | exit 0 | AC-9 |

## 既存「維持すべきアサーション」（壊さない契約）

| 既存アサーション | 維持方針 |
|---|---|
| `SidebarNavItem.spec.tsx`: external anchor / 内部 active `aria-current="page"` / `data-active` / collapsed sr-only | **維持**。T3 は視認スタイル + collapsed 識別性を追加するのみ |
| `SidebarUserMenu.spec.tsx`: member/admin の action 集合 / `data-role="admin"` / collapsed sr-only | **維持**。viewer 分岐強化で member/admin を壊さない |
| `(public)/login/__tests__/page.spec.tsx` の 6 ケース | **維持**（`git mv` で `(auth)` へ追従。アサーション不変） |
| middleware の `x-nonce` / CSP / security headers | **維持**。x-pathname は追加であり既存 header を消さない |
| `shell-config.spec.ts` / `SidebarShell.server.spec.tsx` | **無変更で green**（本タスクは shell-config / shell.server のロジックを変更しない） |

## 参照資料

- Phase 4 テスト計画（TC-T1/T2/T3 / Red 期待結果）
- Phase 2 設計（§2.3 状態所有権 / §1.4 表示条件マトリクス / NFR-5 fail-closed・fail-open 境界）
- 対象実コード: `apps/web/middleware.ts`, `apps/web/app/(admin)/layout.tsx`, `apps/web/src/components/shell/SidebarUserMenu.tsx` / `SidebarNavItem.tsx`
- 既存 spec: `apps/web/src/components/shell/__tests__/shell-config.spec.ts` / `SidebarShell.server.spec.tsx` / `SidebarUserMenu.spec.tsx` / `SidebarNavItem.spec.tsx`
- 09h-shell-and-fixtures.md §1.6 / NFR-2（design tokens）/ `verify-design-tokens` gate
- 参考: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-6-test-additions.md`（grep gate / fail path / 回帰保護の構成）

## 完了条件

- [ ] fail path（FP-1〜FP-7）が AC-1/2/4/5/6 へ trace されている
- [ ] 回帰 guard（RG-1〜RG-7）と表示条件マトリクス invariant（MX-1/MX-2）が確定している
- [ ] 静的 guard コマンド（G-1〜G-7）が Phase 9 で再実行可能な形で確定している
- [ ] HEX 直書き 0（G-5）guard が変更ファイルに対して定義されている
- [ ] 既存「維持すべきアサーション」が保護対象として明示されている

# Phase 9: 品質保証

> 本件の QA は「**login が shell 外へ移り（旧 path live import 0）、表示条件が route group 正本で表現され、SSR active が x-pathname で正確化され、viewer/active の視認が改善され、auth 境界（不変条件 #11）と URL が不変である**」ことの確認に集中する。

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 5 実装手順 / Phase 8 リファクタ |
| 出力 | QA チェック項目、削除（移動）確認、AC→QA マッピング、検証コマンド |
| 拘束 | 不変条件 #5（D1 直アクセス禁止）/ #11（auth 二段防御非破壊）/ NFR-2（OKLch token のみ） |

## 目的

local gate（typecheck / lint / focused test / grep / git status / diff）で AC-1〜9 を機械的に検証し、Phase 10 最終レビュー・Phase 11 inventory へ trace 可能にする。VISUAL タスクのため local screenshot は取得し、staging/admin screenshot は staging 認証必須のため Gate-C user-gated とする。

## QA チェック項目

| 区分 | 項目 | PASS 基準 |
| --- | --- | --- |
| typecheck | 型エラー 0（移動後 import 解決 / `(admin)` の `headers()` 追加を含む） | `mise exec -- pnpm typecheck` green |
| lint | eslint 違反 0 | `mise exec -- pnpm lint` green |
| focused test | 対象 spec が green | 下記 focused run が pass |
| HEX gate | 本件変更ファイルに HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` が 0（NFR-2 / verify-design-tokens） | 下記 grep が **ヒット 0** |
| 不変条件 #5 | `apps/web` から D1 binding 直アクセスを増やしていない | `git diff` に D1 binding 直参照の新規追加が無い |
| 不変条件 #11 | admin / profile の middleware guard + layout guard 二段防御が非破壊 | middleware の guard 分岐順序不変・`(admin)/layout` の `!session` / `!session.isAdmin` redirect 不変 |
| API / D1 / Form 不変 | endpoint surface / D1 migration / Google Form schema 無変更（NFR-1） | `git diff --stat` に当該 path が出ない |
| URL 不変 | `/login` が引き続き解決（route group `()` は URL 非寄与） | build route manifest（static）+ 既存 login query/redirect test green |
| a11y | active item に `aria-current="page"`、viewer CTA / badge の collapsed 表現に `sr-only` ラベル | SidebarNavItem.spec / SidebarUserMenu.spec |

## 削除確認（移動の PASS 基準）— Feedback FB-UI-02-1

T1 は **git delete でなく `git mv`（移動）** であるため、削除の PASS 基準「git delete されている OR stub 化かつ live import 0」を **「rename されている AND 旧 path への live import / path 参照 0」** として判定する。

### (1) 移動（rename）の確認

```bash
# login dir 一式が (public) → (auth) へ rename されている（R = rename）
git status --porcelain | grep -E '^R.*\(public\)/login.*\(auth\)/login' \
  || git status --porcelain | grep -E '\(auth\)/login'
# 期待: (public)/login -> (auth)/login の rename（または add (auth)/login + delete (public)/login）が現れる
```

### (2) 旧 path への live import / path 参照のグレップ 0（AC-2 / AC-1 の前提）

```bash
# 旧 (public)/login への live 参照が apps/web に残っていない
grep -rn 'app/(public)/login\|app/login' apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules \
  && echo "FAIL: 旧 login path live 参照残存" || echo "OK: 旧 login path 参照 0"
```

> `docs/30-workflows/**`（本仕様書）の言及は `apps/web` スコープ外のため誤検知しない。ヒットが残れば移動漏れ / 旧参照残存 → FAIL。

## (auth) layout が shell 外であることの確認（AC-1 / AC-2）

```bash
# (auth)/layout に SidebarShellServer / SidebarMobileTrigger の import が無い（bare 保証）
grep -n "SidebarShellServer\|SidebarMobileTrigger" "apps/web/app/(auth)/layout.tsx" \
  && echo "FAIL: (auth) layout に shell import" || echo "OK: (auth) layout は bare"

# login render DOM に public-shell / aside（サイドバー）が無い（AC-1）— jsdom render test で判定
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/app/(auth)/login/__tests__/page.spec.tsx"
```

- invariant spec（`apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts`）が (a) `(auth)/layout` の shell 非 import、(b) `app/(auth)/login/page.tsx` 存在、(c) `app/(public)/login` 不在 を静的 assert（AC-8 回帰担保）。

## HEX gate（NFR-2 / verify-design-tokens）

```bash
grep -rnE '#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#' \
  "apps/web/app/(auth)/layout.tsx" \
  "apps/web/app/(admin)/layout.tsx" \
  "apps/web/src/components/shell/SidebarUserMenu.tsx" \
  "apps/web/src/components/shell/SidebarUserAvatar.tsx" \
  "apps/web/src/components/shell/SidebarNavItem.tsx" \
  && echo "FAIL: HEX/角括弧色直書き残存" || echo "OK: HEX 0（token のみ）"
```

> viewer CTA / avatar variant / active border 補強は全て `var(--ubm-color-*)` / `var(--shell-*)` token のみで表現する。tokens.css 未定義 token を参照していないことも実装時に `grep -n "<token>" apps/web/src/styles/tokens.css` で確認。

## SSR active 正確化の確認（AC-4 / AC-5）

```bash
# middleware が x-pathname を request header に注入（redirect 非対象）
grep -n 'requestHeaders.set("x-pathname"' apps/web/middleware.ts \
  && echo "OK: x-pathname 注入あり" || echo "FAIL: x-pathname 未注入"

# (admin)/layout の activePath ハードコード撤廃
grep -n 'activePath="/admin"' "apps/web/app/(admin)/layout.tsx" \
  && echo "FAIL: activePath ハードコード残存" || echo "OK: ハードコード撤廃"
```

- middleware spec（`apps/web/src/__tests__/middleware-x-pathname.spec.ts` or `apps/web/middleware.spec.ts`）で「全 request の request header に `x-pathname = nextUrl.pathname`」「redirect 経路には付与しない」を assert。

## auth 境界 / D1 / API 不変の確認（不変条件 #5 / #11 / NFR-1）

```bash
# API / D1 migration / Google Form schema に差分が出ていないこと
git diff --name-only | grep -E "apps/api/|migrations/|google-form/" \
  && echo "REVIEW: api/d1/form に差分（本件スコープ外なら FAIL）" || echo "OK: api/d1/form 無変更"

# middleware の guard 分岐（admin/profile redirect）と (admin) layout の二段防御 guard が非破壊
git diff -- apps/web/middleware.ts | grep -E "buildAdminLoginRedirect|buildAdminForbiddenRedirect|buildProfileLoginRedirect" \
  && echo "REVIEW: guard 周辺に差分 — 順序/内容が不変か目視確認" || echo "OK: guard 関数に差分なし"
git diff -- "apps/web/app/(admin)/layout.tsx" | grep -E "redirect\(.*login" \
  && echo "REVIEW: admin guard redirect に差分 — !session/!isAdmin 二段が不変か目視" || echo "OK: admin guard redirect 不変"
```

> middleware への変更は `x-pathname` request header の 1 行追加のみ。guard 判定（`guardedMiddleware`）・redirect ビルダー・matcher は不変であること（不変条件 #11）。

## URL 不変性の確認（AC-3）

- route group `(auth)` の `()` は URL セグメントに含まれない（Next.js App Router 仕様）。`app/(public)/login` → `app/(auth)/login` 移動後も `/login` のまま。

```bash
# build 後の route manifest で /login URL が保持されているか（static 検証）
mise exec -- pnpm --filter @ubm-hyogo/web build --webpack 2>&1 | grep -E "/login" || true
# 既存 login query / redirect テスト green = 契約不変
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts "apps/web/app/(auth)/login"
# runtime smoke（user-gated）: curl -I http://localhost:3000/login が 200
```

## focused test run

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)/login/__tests__/page.spec.tsx" \
  "apps/web/src/__tests__/sidebar-shell-route-topology.spec.ts" \
  "apps/web/__tests__/middleware.spec.ts" \
  "apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx" \
  "apps/web/src/components/shell/__tests__/SidebarNavItem.spec.tsx" \
  "apps/web/src/components/shell/__tests__/shell-config.spec.ts"
```

> middleware spec のパスは Phase 5 Step 10 の確定先（`src/__tests__/middleware-x-pathname.spec.ts` または既存 `middleware.spec.ts` 拡張）に合わせる。不変条件 #8: 新規 test は `*.spec.{ts,tsx}` のみ。

## AC-1..9 → QA 手段マッピング

| AC | 条件要旨 | QA 手段 | 判定 Phase |
| --- | --- | --- | --- |
| AC-1 | `/login` DOM に `public-shell` / `aside` 不在 | login render test（jsdom） | 9 / 11 |
| AC-2 | `/login` が `(auth)/login` に存在、`(auth)/layout` が shell 非 import | ファイル存在 + grep + invariant spec | 9 |
| AC-3 | `/login` URL 不変 | build route manifest + 既存 login query/redirect test green | 9 |
| AC-4 | middleware が全 request に `x-pathname` 注入 | middleware spec + grep | 9 |
| AC-5 | `(admin)` が x-pathname から activePath 解決（ハードコード撤廃） | grep + admin layout test | 9 |
| AC-6 | viewer ゲスト表記 + ログイン CTA、member/admin と区別 | SidebarUserMenu.spec（role=viewer） | 9 / 11 |
| AC-7 | active nav に `aria-current="page"` + 視認 style | SidebarNavItem.spec | 9 / 11 |
| AC-8 | 09h §1.6 マトリクス反映 + login=shell外 invariant test | 09h diff + invariant spec | 9 |
| AC-9 | typecheck / lint / 対象 vitest green、HEX 0 | 検証コマンド一覧 | 9 / 10 |

## 検証コマンド一覧

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --passWithNoTests --root=../.. --config=vitest.config.ts \
  "apps/web/app/(auth)" \
  "apps/web/src/components/shell" \
  "apps/web/src/__tests__"
git status --porcelain | grep -E '\(auth\)/login'                                   # 移動 (rename) 確認
grep -rn 'app/(public)/login\|app/login' apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules || echo "OK"  # 旧 path 参照 0
grep -rnE '#[0-9a-fA-F]{3,8}\b|bg-\[#|text-\[#' "apps/web/app/(auth)/layout.tsx" "apps/web/app/(admin)/layout.tsx" "apps/web/src/components/shell/SidebarUserMenu.tsx" "apps/web/src/components/shell/SidebarUserAvatar.tsx" "apps/web/src/components/shell/SidebarNavItem.tsx" || echo "OK: HEX 0"
grep -n 'requestHeaders.set("x-pathname"' apps/web/middleware.ts                     # x-pathname 注入
grep -n 'activePath="/admin"' "apps/web/app/(admin)/layout.tsx" && echo "FAIL" || echo "OK"  # ハードコード撤廃
git diff --name-only | grep -E "apps/api/|migrations/|google-form/" || echo "OK: api/d1/form 無変更"
```

## Visual gate（Gate-C user-gated）

- Linux runner で `/login`（shell 不在）/ viewer・member・admin サイドバー identity / active 表示の screenshot を生成・比較する計画。macOS local baseline は参考に限定し commit しない（親 workflow 方針）。
- screenshot pending は **PASS と書かない**（Phase 10 visual boundary 観点）。本サイクルでは local deterministic evidence を取得済みで、pixel capture は running stack / staging 認証依存の user-gated として分離する。

## 参照資料

- Phase 5（実装手順）grep 機械確認 §5 / DoD §6
- Phase 8（リファクタ）AC 非破壊確認観点
- Phase 1（要件）AC-1〜9 / targeted test ファイルリスト
- 不変条件: CLAUDE.md #5 / #11、UI alignment #1〜4
- 参考粒度: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-9-qa.md`

## 完了条件

- typecheck / lint / focused test / HEX gate / 旧 path 参照 0 / 移動(rename)確認 が全 green
- 不変条件 #5（D1 直アクセスなし）/ #11（auth 二段防御非破壊）/ URL 不変 を機械的に確認した
- AC-1〜9 → QA 手段マッピングが Phase 10 最終レビューと Phase 11 inventory へ trace 可能
- screenshot pending は PASS と書かず Gate-C user-gated として明示した

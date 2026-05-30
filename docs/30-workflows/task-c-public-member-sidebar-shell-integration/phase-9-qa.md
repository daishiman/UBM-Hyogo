# Phase 9: 品質保証

Task C の QA は「shell 統合が正しく配線され、旧 header が完全に消え、URL と auth 境界が不変である」ことの確認に集中する。

## QA チェックリスト

| 区分 | 項目 | PASS 基準 |
| --- | --- | --- |
| typecheck | 型エラー 0（移動後 import 解決を含む） | `pnpm --filter @ubm-hyogo/web typecheck` green |
| lint | eslint 違反 0 | `pnpm --filter @ubm-hyogo/web lint` green |
| focused test | 対象 5 spec が green | 下記 focused run が pass |
| grep gate（削除確認） | `PublicHeader` / `MemberHeader` の live import 0 | 下記 grep が **ヒット 0**（doc/アーカイブ除く） |
| URL 不変 | `/` `/privacy` `/terms` `/login` が引き続き解決 | route group `()` は URL 非寄与（後述） |
| auth 境界不変 | middleware / D1 / API / Google Form schema 無変更 | `git diff --stat` に当該ファイルが出ない |
| 相対 import 健全 | 移動 page の import 解決 | typecheck green = 解決 OK |

## 削除確認の PASS 基準（Feedback FB-UI-02-1）

削除の PASS 基準は「**git delete されている OR stub 化かつ live import 0**」。
Task C は **git delete 方針**（Phase 2 設計確定）なので、以下 2 段で判定する。

### (1) git delete の確認

```bash
git status --porcelain | grep -E "^ ?D .*(PublicHeader|MemberHeader)"
# 期待: 以下 4 ファイルが削除 (D) として現れる
#   apps/web/src/components/public/PublicHeader.tsx
#   apps/web/src/components/public/__tests__/PublicHeader.spec.tsx
#   apps/web/src/components/layout/MemberHeader.tsx
#   apps/web/src/components/layout/__tests__/MemberHeader.spec.tsx
```

### (2) live import / 参照のグレップ 0（AC-C2）

```bash
git grep -n "PublicHeader\|MemberHeader" -- apps/web
# 期待: ヒット 0
# 除外: docs/ 配下（本ワークフロー doc）・アーカイブは対象外（apps/web スコープ限定で grep 済）
```

> `apps/web` スコープに限定しているため、`docs/30-workflows/**` の本仕様書内の言及は grep に含まれず、誤検知しない。
> ヒットが残る場合は live import 未除去 → FAIL。

## URL 不変性の確認（AC-C7）

- route group `(public)` の `()` は **URL セグメントに含まれない**（Next.js App Router 仕様）。`app/page.tsx` → `app/(public)/page.tsx` 移動後も `/` のまま。
- 同様に `/privacy` `/terms` `/login` も group 集約後に URL 不変。
- 確認方法（実 runtime は Gate-C user-gated）:

```bash
# build 後の route manifest で URL が保持されているか確認（static 検証）
mise exec -- pnpm --filter @ubm-hyogo/web build --webpack 2>&1 | grep -E "^(├|└|●|○|λ| ).*/(privacy|terms|login)?$" || true
# runtime smoke（user-gated）: 各 URL が 200 を返すこと
#   curl -I http://localhost:3000/ ; curl -I .../privacy ; .../terms ; .../login
```

## auth middleware / D1 / API 不変の確認（AC-C8）

```bash
# middleware・API・D1 migration・Google Form schema に差分が出ていないこと
git diff --stat -- apps/web/src/middleware.ts apps/web/middleware.ts apps/api/ apps/web/migrations/ 2>/dev/null
# 期待: 出力なし（= 無変更）
git diff --name-only | grep -E "middleware|apps/api/|migrations/" || echo "OK: no auth/api/d1 changes"
```

> `x-pathname` は middleware に注入せず、layout の `?? "/"` fallback + client `usePathname()` で吸収する（不変条件 #4）。

## 相対 import 健全性（AC-C10）

- 移動した page の `../src/...` 深度補正が正しければ **typecheck が green** になる。typecheck green = import 解決 OK と判定する。
- `@/` alias 利用箇所は移動で深度が変わらないため補正不要（Phase 2 設計）。
- `login/` は dir ごと `git mv` するため dir 内相対 import は不変。dir 外参照のみ typecheck で確認。
- smoke / harness route（`app/__smoke__` `app/smoke` `app/visual-harness` `app/(dev)`）が移動 page を参照していないことを grep 確認:

```bash
git grep -n "app/page\|/privacy/page\|/terms/page\|/login/page" -- apps/web/app/__smoke__ apps/web/app/smoke apps/web/app/visual-harness "apps/web/app/(dev)" || echo "OK: no smoke/harness refs to moved pages"
```

## focused test run

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "apps/web/app/(public)/layout.spec.tsx" \
  "apps/web/app/(member)/layout.spec.tsx" \
  "apps/web/app/(public)/page.spec.tsx" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/app/(public)/login/page.spec.tsx"
```

## AC-C1..C10 → QA 手段マッピング

| AC | 条件要旨 | QA 手段 | 判定 Phase |
| --- | --- | --- | --- |
| AC-C1 | 7 route が同一 shell DOM 契約（`data-shell-mode="sidebar"`） | layout.spec で `data-shell-mode` 属性アサート + Phase 11 visual | 9 / 11 |
| AC-C2 | `PublicHeader`/`MemberHeader` 参照 grep 0 | `git grep -n ... -- apps/web` = 0 | 9 |
| AC-C3 | 旧 component 本体 + spec が git delete | `git status --porcelain` で D 4 件 | 9 |
| AC-C4 | `PublicFooter` が shell 配下で描画継続 | layout.spec で `PublicFooter` 描画アサート + Phase 11 | 9 / 11 |
| AC-C5 | layout が async + `SidebarShellServer` mount、role 再判定なし | layout.spec で `SidebarShellServer` 呼出 + layout に role 分岐不在を確認 | 9 |
| AC-C6 | profile の MemberHeader 直 mount 2 箇所除去 | profile/page.spec で header DOM 不在 + grep | 9 |
| AC-C7 | 移動後 URL 不変・200 | build route manifest（static）+ runtime curl（user-gated） | 9 / 11 |
| AC-C8 | API/D1/Form schema/middleware 無変更 | `git diff --stat` で当該 path 不在 | 9 |
| AC-C9 | typecheck + lint + test green | 下記検証コマンド一覧 | 9 / 10 |
| AC-C10 | 移動 page の import/colocated test/smoke 参照健全 | typecheck green + smoke grep 0 | 9 |

## 検証コマンド一覧

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web lint
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "apps/web/app/(public)/layout.spec.tsx" \
  "apps/web/app/(member)/layout.spec.tsx" \
  "apps/web/app/(public)/page.spec.tsx" \
  "apps/web/app/(member)/profile/page.spec.tsx" \
  "apps/web/app/(public)/login/page.spec.tsx"
git status --porcelain | grep -E "^ ?D .*(PublicHeader|MemberHeader)"   # 削除 4 件
git grep -n "PublicHeader\|MemberHeader" -- apps/web                      # ヒット 0
git diff --name-only | grep -E "middleware|apps/api/|migrations/" || echo "OK"
```

## Visual gate（Gate-C user-gated）

- Linux runner で公開・会員 shell の screenshot（7 route）を生成・比較。macOS local baseline は参考に限定し commit しない（親 workflow 方針）。
- screenshot pending は **PASS と書かない**（Phase 10 visual boundary 観点）。

## 完了条件

local gates（typecheck / lint / focused test / grep / git status / diff）が全 green、
AC マッピングが Phase 10 最終レビューと Phase 11 inventory へ trace 可能。

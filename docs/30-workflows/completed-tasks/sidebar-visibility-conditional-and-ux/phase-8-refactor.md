# Phase 8: リファクタリング

> 本件のリファクタは「**サイドバー表示条件の所有権を layout 実装ロジックから route group（ディレクトリ構造）へ移す**」配線整理である。新規ロジック・新規 primitive を増やさず、表示条件の散在と active 解決の重複・ハードコードを構造的に解消する。

## メタ情報

| 項目 | 値 |
|------|-----|
| 対象 task_id | `sidebar-visibility-conditional-and-ux` |
| 入力 | Phase 5 実装手順（T1/T2/T3） |
| 出力 | 対象 / Before / After / 理由 テーブル、navigation drift / duplicate 確認 |
| 原則 | 再利用優先（FB-SDK-07-1）・新規 primitive ゼロ（NFR-3 / UI alignment #3） |

## 目的

1. **表示条件の単一正本化**: 「どの route が shell を被るか」を layout 内の暗黙的配置でなく route group の宣言（`(auth)`=bare / `(public)`・`(member)`・`(admin)`=shell）で表現し、09h §1.6 と一致させる（spec drift 解消）。
2. **SSR active の単一注入元化**: 現在 pathname の供給を middleware の `x-pathname` 1 注入元に統一し、各 layout の fallback ハードコード（特に `(admin)` の `activePath="/admin"`）依存を撤廃する。
3. **viewer identity / active 視認の責務集約**: viewer 表現・active 表現を既存 shell primitive の分岐内に閉じ、layout / page に表示ロジックを漏らさない。

## リファクタ対象（対象 / Before / After / 理由）— Feedback RT-03

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `app/(public)/login/` dir | `(public)` group 配下にあり `(public)/layout.tsx` の SidebarShell が **login にも被る**（認証導線の二重化 = bug / 09h §1.6 逸脱） | `app/(auth)/login/` へ dir ごと `git mv`。`(auth)/layout.tsx`（bare）配下に置き shell を被せない | 「shell を被るか」を route group の宣言で表現。表示条件が実装ロジックでなくディレクトリ構造で決まり、正本 09h §1.6「login=shell外」へ一致 |
| `app/(auth)/layout.tsx` | （存在しない） | 新規 bare layout（`data-shell-mode="bare"` / shell import なし） | shell を被らない route group の単一所有者を新設。layout に pathname 条件分岐を持ち込まない（route group が責務の自然な所有者） |
| `middleware.ts` | `x-nonce` / CSP のみ request header に設定。`x-pathname` を **注入していない** → 全 layout の `headers().get("x-pathname")` が常に fallback | `requestHeaders.set("x-pathname", req.nextUrl.pathname)` を 1 行追加（共通 header 部・redirect 非対象） | 現在 pathname の供給を middleware の単一注入元へ集約。各 layout は header を読むだけにする |
| `app/(admin)/layout.tsx` | `activePath="/admin"` を **ハードコード** → `/admin/members` 等で SSR active が常に dashboard にハイライト（hydration まで誤表示・FOUC） | `const pathname = (await headers()).get("x-pathname") ?? "/admin"; activePath={pathname}` | active 解決を他 layout（`(public)`/`(member)`）と同一パターンへ統一。ハードコード由来の SSR active drift を解消。auth 二段防御 guard は不変 |
| `app/(public)/layout.tsx` / `app/(member)/layout.tsx` | 既に `headers().get("x-pathname") ?? fallback` を読むが **注入元が無く fallback のみ機能** | コード変更なし。middleware 注入により自動的に正確化 | 既に正しい消費形。注入元を直せば全 layout が同一契約で正確化される（変更最小） |
| `SidebarUserMenu.tsx` viewer 分岐 | viewer でも member 風の identity ブロックに見え未ログインと気づきにくい。viewer の唯一 action `LOGIN` が popover 内に埋もれる | viewer 専用 return（「ゲスト / 未ログイン」表記 + primary tone の `data-shell-block="login-cta"` 直リンク） | viewer の認知（未ログイン）と次アクション（ログイン）を 1 ブロックに集約。member/admin の `<details>` popover 経路は不変 |
| `SidebarUserAvatar.tsx` | viewer も accent-soft の initials 円（`?`）= メンバー風 | viewer variant（中立 surface + ゲスト表現）を分岐追加。admin badge dot は admin 専用のまま | avatar の見た目で role（ゲスト / 会員 / 管理）を即時識別。新規 component を増やさず既存分岐拡張 |
| `SidebarNavItem.tsx` | 既に `aria-current="page"` / `data-active` / token active style / collapsed badge sr-only を持つ（= 大半が実装済） | collapsed 時の active 識別性（左 accent border 等）と badge dot 縮約を **検証・必要時のみ token で補強** | active 表現は既存資産を活かし、collapsed という弱点だけを最小補強。新規 Chip variant を作らない |
| 表示条件の所有 | layout 配置（暗黙）+ 各 layout の fallback ハードコードに散在 | route group（宣言）+ middleware x-pathname（単一注入）+ invariant test（機械担保） | 表示条件の決定権を 1 系統に収束させ、回帰を静的 test で守る |

## navigation drift / duplicate 確認

| 観点 | 確認内容 | 解消状態 |
| --- | --- | --- |
| 表示条件の二重定義 | 「login が shell 外」を layout 内 pathname 分岐でも表現していないか | route group のみで表現（layout に pathname 分岐を持ち込まない）。二重定義なし |
| active 解決の重複 | SSR active の供給が複数経路に分散していないか | middleware `x-pathname` 単一注入元に統一。layout は header 読込のみ。client `usePathname()`（`SidebarNavItem`）は二重保険として維持（意図的冗長・drift ではない） |
| activePath fallback のハードコード重複 | `(admin)` の `"/admin"` 固定が他 layout と非対称でないか | 固定を撤廃し `?? "/admin"` fallback（他 layout の `?? "/"` / `?? "/profile"` と同形）へ統一 |
| nav 構築の重複 | nav リンク集合が複数定義されていないか | 既に `shell-config.ts`（`buildNavForRole`）に一本化済み（Task A/C）。本件で新たな nav 定義は増やさない |
| viewer action の重複 | ログイン導線が popover とサイドバー下部で二重に出ないか | viewer は CTA ブロック 1 経路のみ（popover を描画しない）。`buildUserMenuActions("viewer")` の `LOGIN` を CTA に流用し action 定義を重複させない |
| 新規 primitive | 表示条件 / viewer / active のために新 component を生やしていないか | ゼロ。`(auth)/layout.tsx`（薄い wrapper）以外は既存 primitive の分岐拡張のみ（NFR-3 充足） |

## リファクタ後も AC を壊さない確認観点

| 確認観点 | 関連 AC | 確認方法 |
| --- | --- | --- |
| `/login` が shell 外（`public-shell` / `aside` 不在） | AC-1 | login render test + route-topology invariant |
| `(auth)/layout` が shell import 0 | AC-2 | grep / invariant spec |
| URL 不変 | AC-3 | route group `()` は URL 非寄与（`git mv` は物理移動のみ） |
| middleware x-pathname 単一注入 | AC-4 | middleware spec |
| `(admin)` activePath ハードコード撤廃 | AC-5 | grep（`activePath="/admin"` 0）+ admin layout test |
| viewer ゲスト表記 + CTA | AC-6 | SidebarUserMenu.spec（role=viewer） |
| active 視認 + `aria-current` | AC-7 | SidebarNavItem.spec |
| 09h マトリクス反映 + invariant | AC-8 | 09h diff + invariant spec |
| auth 境界 / D1 / API 不変 | NFR-1/4/5・不変条件 #5/#11 | `git diff` に api/migration/guard 改変が出ない・admin guard 順序不変 |

## 参照資料

- Phase 2（設計）§1 route topology / §2 SSR active / §3 shell UX
- Phase 5（実装手順）Step 1〜10
- 参考粒度: `docs/30-workflows/task-c-public-member-sidebar-shell-integration/phase-8-refactor.md`

## 完了条件

- 表示条件の所有権が layout 実装から route group へ移り、login=shell外がディレクトリ構造で表現される
- SSR active の供給が middleware x-pathname の単一注入元に統一され、`(admin)` のハードコードが撤廃される
- viewer / active 表現が既存 primitive の分岐内に閉じ、新規 primitive・重複 nav・二重表示条件が残らない
- Before/After テーブルが Phase 9 QA gate と AC へ trace 可能

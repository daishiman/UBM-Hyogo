# Phase 6: テスト拡充（fail path / 回帰 guard）

> Phase 4（Red の主軸）を補完し、**境界・fail path・既存挙動の回帰保護**を追加する。
> Phase 5 実装後に green であることを確認し、Phase 7（coverage）/ Phase 9（QA）へ trace する。

## 1. 追加テストケース

### 1.1 旧 header 残存参照 0 の自動 guard（AC-C2 / AC-C3）

grep ベースの静的 guard。CI / QA step として実行し、回帰（誰かが再導入）を検出する。

| # | チェック | 実装 | 期待 |
| --- | --- | --- | --- |
| A-1 | `PublicHeader` import / 参照 0 | `grep -rn "PublicHeader" apps/web/ --include="*.ts" --include="*.tsx" \| grep -v node_modules` | ヒット 0 |
| A-2 | `MemberHeader` import / 参照 0 | `grep -rn "MemberHeader" apps/web/ --include="*.ts" --include="*.tsx" \| grep -v node_modules` | ヒット 0 |
| A-3 | 旧 component ファイル不在 | `test ! -e "apps/web/src/components/public/PublicHeader.tsx" && test ! -e "apps/web/src/components/layout/MemberHeader.tsx"` | true |

> import 静的チェックを vitest 化する場合は、layout / profile page spec 内で「shell スタブ以外の header マーカーが DOM に出ない」アサーション（Phase 4 P-6 / M-5 / PR-1..3）が実質的な import guard になる。grep gate は CI（Phase 9）で重畳する。

### 1.2 移動後 URL 不変の回帰（route group が URL に出ないこと / AC-C7）

| # | ケース | 検証方法 | 期待 |
| --- | --- | --- | --- |
| B-1 | `(public)/page.tsx` が `/` を担う | import 解決 smoke（`(public)/page.spec.tsx`）+ Phase 11 で `GET /` 200 | route group `()` は URL セグメント非寄与のため `/` 不変 |
| B-2 | `/privacy` `/terms` `/login` 不変 | Phase 11 で各 `GET` 200 + Playwright smoke route 参照確認 | 旧 URL のまま 200 |
| B-3 | route group 名が URL に漏れない | `grep -rn '"/(public)/"' apps/web/` が **ヒット 0**（誰かが `/(public)/...` をリンク先に書いていない） | ヒット 0 |

> 実 HTTP 200 検証は Phase 11（manual / smoke）が正本。Phase 6 では「リンク文字列に route group が混入していない」静的 guard（B-3）と import 解決 smoke（B-1）で構造を守る。

### 1.3 admin ユーザーが `/profile` を開いた時の境界（member layout 経由で shell）

Task C は role を再判定しないため、admin が `/profile` を開いても **member layout の shell**（`SidebarShellServer`）を通る。role=admin に応じた nav（ADMIN グループ）は shell 内部（Task A/B）の責務。

| # | ケース | 検証 | 期待 | 備考 |
| --- | --- | --- | --- | --- |
| C-1 | admin が `/profile` を開いても member layout の shell を通る | `(member)/layout.spec.tsx` で shell スタブが mount される（role に関わらず） | `[data-testid="sidebar-shell-stub"]` 存在。Task C は role 分岐を持たない | role 別 nav は A/B の spec が担保。Task C は「shell に委譲している」事実のみ確認 |
| C-2 | layout 側に role 判定コードが無い | `grep -n "isAdmin\|role" "apps/web/app/(member)/layout.tsx" "apps/web/app/(public)/layout.tsx"` | ヒット 0（AC-C5: 再判定しない） | 責務境界の静的 guard |

### 1.4 `x-pathname` fallback 時の active state 非クラッシュ

| # | ケース | 検証 | 期待 |
| --- | --- | --- | --- |
| D-1 | x-pathname なしで layout が throw しない | headers スタブ `get → null`、`render(await PublicLayout({ children }))` | throw なし、`[data-active-path="/"]`（public）/ `[data-active-path="/profile"]`（member） |
| D-2 | x-pathname ありで fallback を使わない | headers スタブ `get → "/members"` | `[data-active-path="/members"]` |

## 2. fail path

### 2.1 `getSession` 失敗時に layout が throw しない

session 取得・失敗ハンドリングは `SidebarShellServer` 内部（Task A）に閉じる。Task C の layout は session を直接呼ばないため、layout 自体は session 失敗で throw しない設計。

| # | ケース | 検証 | 期待 |
| --- | --- | --- | --- |
| E-1 | layout が getSession を直接呼ばない | `grep -n "getSession" "apps/web/app/(public)/layout.tsx" "apps/web/app/(member)/layout.tsx"` | ヒット 0（session は shell 内部 / AC-C5） |
| E-2 | shell 内部 session 失敗が layout を壊さない | shell スタブを「session 失敗 → viewer fallback で children を描く」挙動にした上で `render(await PublicLayout(...))` | throw なし。children が描画される（viewer fallback 委譲は Task A の責務で、Task C 側は委譲だけ） |

> E-2 は「Task C が shell に委譲しており、shell の fallback 挙動を Task C が阻害しない」ことの確認。実 session 失敗時の viewer fallback そのものは Task A の spec が正本。

### 2.2 profile degrade path での header 非 render（fail path × header 除去の交差）

| # | ケース | 検証 | 期待 |
| --- | --- | --- | --- |
| F-1 | /me 失敗 degrade で MemberHeader 不在 | 既存 spec の「セッション情報を取得できませんでした」分岐（`render(await ProfilePage())`） | alert 文言は維持 + MemberHeader マーカー null（Phase 4 PR-2） |
| F-2 | profile 失敗 degrade で MemberHeader 不在 | 既存「プロフィールを読み込めませんでした」分岐 | alert 文言維持 + MemberHeader マーカー null（PR-3） |

## 3. 既存テストの回帰保護

Phase 5 で layout を改修するが、**既存アサーションのうち維持すべきもの**を壊さない。

| 既存アサーション | 維持方針 |
| --- | --- |
| `(public)/layout.spec.tsx`: `data-theme="warm"` / `data-route-group="public"` | **維持**（wrapper に残す）。`data-shell-mode="sidebar"` を追加 |
| `(member)/layout.spec.tsx`: `data-theme="warm"` / `data-route-group="member"` | **維持** + `data-shell-mode="sidebar"` 追加 |
| `(public)/layout.spec.tsx`: `[data-shell="topbar"]` / `[data-shell="footer"]` / `main[data-route="public"]` | **置換**。topbar（旧 header）は削除されるためアサーションを除去し、shell mount + PublicFooter 存在へ差し替え（Phase 4 P-5/P-6） |
| `(member)/layout.spec.tsx`: `[data-shell="topbar"]` / `main[data-route="member"]` | **置換**。同上（M-5） |
| 両 layout.spec: `axe critical 違反 0` | **維持**（shell スタブ下でも critical 0 を確認 / P-11・M-9） |
| `profile/page.spec.tsx`: redirect / notFound / degrade ×2 の 4 ケース | **維持**（MemberHeader 除去で挙動不変。PR-4） |

> `data-shell="topbar"` / `data-shell="footer"` のアサーションは旧 header / footer wrapper 構造に紐づくため、shell 化で構造が変わる。これらは「壊してはいけない既存挙動」ではなく「Task C の設計変更で意図的に変わる構造」なので、置換は回帰ではない（Phase 4 §5 Red 対象）。逆に `data-theme` / `data-route-group` / axe は不変契約として保護する。

## 4. 補助コマンド

```bash
# focused 再 run（Phase 5 後 green 確認）
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "apps/web/app/(public)" "apps/web/app/(member)"

# 静的 guard（A-1..A-3 / B-3 / C-2 / E-1）
grep -rn "PublicHeader\|MemberHeader" apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -rn '"/(public)/"' apps/web/ --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -n "isAdmin\|role\|getSession" "apps/web/app/(public)/layout.tsx" "apps/web/app/(member)/layout.tsx"

# 旧 component 不在確認
test ! -e "apps/web/src/components/public/PublicHeader.tsx" \
  && test ! -e "apps/web/src/components/layout/MemberHeader.tsx" \
  && echo "OK: legacy headers removed"

# 型 / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

## 完了条件

- fail path（E / F）と境界（C / D）・回帰 guard（A / B / §3）が AC-C2/C5/C6/C7/C8/C9 へ trace される。
- 既存「維持すべきアサーション」（`data-theme` / `data-route-group` / axe / profile 4 ケース）が保護対象として明示される。
- 静的 guard コマンドが Phase 9（QA）で再実行可能な形で確定する。

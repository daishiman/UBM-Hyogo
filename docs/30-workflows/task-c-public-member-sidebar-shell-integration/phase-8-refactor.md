# Phase 8: リファクタリング

Task C のリファクタリングは「**shell 所有権を page から layout へ移す**」配線整理である。
新規ロジックは増やさず、二重 shell / 二重 nav / 重複 mount を構造的に解消する。

## 変更内容（対象 / Before / After / 理由）— Feedback RT-03

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `(public)/layout.tsx` | `<header><PublicHeader/></header>` を layout が直接描画。同期関数 | `async` 化し `SidebarShellServer` で children を wrap。`PublicFooter` を children 末尾に保持 | shell 所有権を layout へ集約。role/nav 再実装をせず A の contract を mount するだけにする |
| `(member)/layout.tsx` | `<header><MemberHeader/></header>` を直接描画 | `async` 化し `SidebarShellServer` で wrap（member theme 維持） | 公開層と同一 shell に統一し、層をまたぐ flash を構造で排除 |
| `app/page.tsx`（root `/`） | route group 外（root 直下）に存在し、page 内で `<PublicHeader/>` を直書き mount | `(public)/page.tsx` へ `git mv` し、header 直書きを削除（layout が担う） | 「shell が page に漏れている」状態を解消。group 集約で単一 mount 点に従属させる |
| `app/privacy/page.tsx` / `app/terms/page.tsx` | route group 外。layout の shell 適用を受けられない | `(public)/privacy|terms/page.tsx` へ `git mv`（本文不変、import 深度のみ補正） | group 配下に入れることで `(public)/layout.tsx` の単一 shell を自動適用 |
| `app/login/` dir 一式 | route group 外 | `(public)/login/` へ dir ごと `git mv`（dir 内相対 import 不変） | 同上。`/login` も単一 shell 配下へ |
| `(member)/profile/page.tsx` | `MemberHeader` を **2 回**直接 mount（重複） | `MemberHeader` import + 2 箇所の mount を削除 | header 重複描画の解消。shell は layout が 1 度だけ持つ |
| `src/components/public/PublicHeader.tsx`（+spec） | 公開 header の本体 | **git delete** | shell へ統合され役割消滅。dead code を残さない |
| `src/components/layout/MemberHeader.tsx`（+spec） | 会員 header の本体 | **git delete** | 同上 |

## 重複（duplicate）削減

| 重複箇所 | 解消方法 |
| --- | --- |
| `(member)/profile/page.tsx` の `MemberHeader` **2 回 mount** | 両方を削除。header は `(member)/layout.tsx` の shell が 1 度だけ提供する |
| `/` page（旧 `app/page.tsx`）の `PublicHeader` 直書き + `(public)/layout.tsx` の header という二重 header 経路 | page 側を削除し layout 1 経路に統合 |
| route group 内外で公開ページの shell 適用パターンが分岐（`(public)` 配下は layout shell・group 外は page 直書き） | 全公開 route を `(public)` group へ集約し、shell mount 点を **1 箇所**（`(public)/layout.tsx`）に統一 |

## navigation drift 除去

- `PublicHeader` / `MemberHeader` はそれぞれ独自の nav リンク集合を持っていた（公開 nav と会員 nav が別実装＝drift 源）。
- これらを削除し、nav は `SidebarShellServer` 内部の `buildNavForRole()`（Task A）に **一本化**する。
- 結果として「公開 header の nav」「会員 header の nav」「sidebar の nav」という 3 系統が **1 系統（role 駆動 sidebar nav）** に収束し、リンク追加・文言変更の二重管理が消える。

## 新規 primitive を生やさない（CLAUDE.md / 親 invariant）

- 再利用優先（FB-SDK-07-1）。Task C は `SidebarShellServer` / `SidebarUserMenu` / `SidebarMobileTrigger` / `PublicFooter` を **mount するだけ**で、新しい layout 用 primitive やラッパー component を新設しない。
- `x-pathname` の解釈は layout 内 inline 3 項（`?? "/"` / `?? "/profile"`）に留め、専用 util module を切らない（配線最小化）。

## リファクタ後も AC を壊さない確認観点

| 確認観点 | 関連 AC | 確認方法 |
| --- | --- | --- |
| 7 route が同一 shell DOM 契約（`data-shell-mode="sidebar"`）を共有 | AC-C1 | layout が両 group で同一 `data-*` 属性 + `SidebarShellServer` を mount |
| `PublicHeader`/`MemberHeader` 参照 grep 0 | AC-C2 | Phase 9 grep gate |
| 旧 component が git delete | AC-C3 | Phase 9 `git status` 確認 |
| `PublicFooter` が shell 配下で描画継続 | AC-C4 | `(public)/layout.tsx` の children 末尾に保持（削除しない） |
| layout が role 再判定しない | AC-C5 | layout に `getSession()`/role 分岐を持ち込まない（shell 内部のみ） |
| profile の MemberHeader 2 mount 除去 | AC-C6 | page.spec で header DOM 不在を確認 |
| URL 不変 | AC-C7 | route group `()` は URL 非寄与。`git mv` で物理移動のみ |
| middleware/API/D1 不変 | AC-C8 | `x-pathname` 注入を middleware に追加しない（layout fallback で吸収） |
| 相対 import 健全 | AC-C10 | typecheck green で移動後の import 解決を保証 |

## 完了条件

旧 shell component（PublicHeader / MemberHeader）の責務が新 shell（layout 集約）へ移り、
二重 shell / 二重 header / 二重 nav が残らない。Before/After テーブルが Phase 9 QA gate へ trace 可能。

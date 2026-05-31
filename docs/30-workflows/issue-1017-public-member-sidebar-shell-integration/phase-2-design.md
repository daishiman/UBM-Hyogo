`[実装区分: 実装仕様書]`

# Phase 2: 設計（issue-1017 / verify_existing）

本 Phase は landed 実装（commit `278001606` / PR #1028）の構造を正本設計として固定する。

## トポロジ（責務の縦割り）

```
RouteGroupLayout (server, async)
  ├─ headers() → x-pathname（active path 取得・fallback あり）
  ├─ data-* 属性付与（theme / route-group / shell-mode / testid）
  └─ <SidebarShellServer activePath routeKey sectionRhythm mobileTriggerSlot>
        ├─ getSession() → role 解決（viewer / member / admin）
        ├─ buildNavForRole(role, { schemaDiffCount }) → navGroups
        └─ <SidebarShell role user navGroups ...>   (client)
              ├─ useSidebarState()  … collapse 状態（client 所有）
              ├─ SidebarNav / SidebarNavGroup / SidebarNavItem
              ├─ SidebarMobileTrigger / SidebarDrawer
              └─ {children} + （public のみ）<PublicFooter />
```

| 層 | 種別 | 責務 |
| --- | --- | --- |
| `PublicLayout` / `MemberLayout` | server component（async） | `x-pathname` 取得・`data-*` 属性・slot 配線のみ。**role 判定も nav 構築も行わない** |
| `SidebarShellServer` | server component | `getSession()` で role 解決、`buildNavForRole` で nav 構築、`schemaDiffCount` 取得（admin のみ）、plain object を client へ渡す |
| `SidebarShell` | client component | collapse 状態（`useSidebarState`）、レンダリング、mobile drawer 制御 |

## 責務境界

- **layout の責務は最小**: `activePath`（= `x-pathname`）と slot（`mobileTriggerSlot`）の受け渡しに限定。
  `routeKey` / `sectionRhythm` の固定値を渡すのみ。役割解決ロジックを layout に複製しない（不変条件 #4）。
- **role 判定は `SidebarShellServer` に閉じる**: `getSession()` → `resolveRole()` → `buildNavForRole()` の連鎖は server wrapper の内部に隔離。
  layout から session/role が漏れない。`getSession()` 失敗時も throw せず `viewer` へ fail-open（shell 自体は描画継続）。
- **client は state のみ**: collapse の開閉状態は `useSidebarState`（client）が所有。server から渡る nav/role/user は plain object（serializable）。

## 状態所有権

| 状態 | 所有者 | 層 |
| --- | --- | --- |
| sidebar collapse（開閉） | `useSidebarState` | client |
| session / role | `SidebarShellServer`（`getSession`） | server |
| active path | layout（`headers()` の `x-pathname`）+ client `usePathname` 確定 | server → client |
| schemaDiffCount（admin badge） | `SidebarShellServer`（`loadSchemaDiffCount`） | server |

## route group 移行設計（URL 不変）

- `/`,`/privacy`,`/terms`,`/login` の page を `app/(public)/` 配下へ `git mv`。
  route group `(...)` は URL セグメントに**寄与しない**ため、移動後も URL は不変（`/`, `/privacy`, `/terms`, `/login`）。
- これにより公開 6 route が `(public)/layout.tsx` 1 箇所で shell を mount する単一 shell 構造になり、page ごとの header mount を排除する。
- `/members`, `/register` は既に `(public)` group 配下のため移動不要。`/profile` は `(member)` group。

## 既存コンポーネント再利用可否

| コンポーネント | 再利用可否 | 備考 |
| --- | --- | --- |
| `SidebarShell` / `SidebarShell.server` 系 primitive | **再利用（新規実装ゼロ）** | Task A/B/E で実装済み。layout は薄い配線のみ |
| `SidebarMobileTrigger` / `SidebarDrawer` | **再利用** | Task E 同梱（#1028） |
| `buildNavForRole` / `useSidebarState` | **再利用** | shell-config / hook を消費 |
| `PublicFooter` | **再利用** | shell 配下へ移設して保持 |
| `PublicHeader` / `MemberHeader` | **削除** | shell へ責務移管したため production import を 0 件にする |

→ layout の実装は「SidebarShellServer を mount し props を渡す」薄い配線に集約され、**新規 UI 実装はゼロ**。

## x-pathname fallback 設計

- `x-pathname` は middleware が常時注入する保証がないため、layout は fallback を持つ。
  - public: `(await headers()).get("x-pathname") ?? "/"`
  - member: `(await headers()).get("x-pathname") ?? "/profile"`
- active 判定の最終確定は client 側 `usePathname` が担うため、初回 SSR の fallback と client hydration 後で active item が一致する。
  server で誤った active を出さないための保守的 default を route group 代表 path に置く。

## data 属性契約

| 属性 | public | member |
| --- | --- | --- |
| `data-theme` | `warm` | `warm` |
| `data-route-group` | `public` | `member` |
| `data-shell-mode` | `sidebar` | `sidebar` |
| `data-testid` | `public-shell` | `member-shell` |

`data-shell-mode="sidebar"` は 7 route で共通（AC-1 の DOM 契約）。

## 設計上の不変条件確認

- API 呼び出しは `SidebarShellServer` 内 `loadSchemaDiffCount`（admin のみ・既存 `/admin/schema/diff`）に限定。新 endpoint なし。
- 色は `tokens.css` の `--shell-*` 経由。layout/component に HEX 直書きなし。

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 2 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 2 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 2 記録を正本として維持する。
- #1028 の landed 実装と本 Phase の境界を確認する。

## 参照資料

- `docs/30-workflows/completed-tasks/unified-sidebar-shell-public-and-admin/tasks/task-C-public-and-member-layout-integration.md`
- `docs/30-workflows/task-c-public-member-sidebar-shell-integration/`
- commit `278001606` / PR #1028

## 成果物

- 本ファイル
- `artifacts.json` / `outputs/artifacts.json` parity
- Phase 11/12 outputs

## 完了条件

- [x] Phase 2 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。

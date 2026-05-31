`[実装区分: 実装仕様書]`

# Phase 5: 実装（差分確認 / verify_existing）

## 差分確認セクション（verify_existing）

本タスクは `implementation_mode: verify_existing`。実装は commit `278001606`（PR #1028, 2026-05-31 dev マージ）として
既に landed 済みであるため、本 Phase は「新規実装」ではなく **git diff による差分確認 + 回帰確認**を行う。

確認コマンド:

```bash
git show --stat 278001606
```

## 変更ファイル一覧（Task C コア・変更種別付き）

凡例: `A`=新規作成 / `M`=修正 / `D`=削除 / `R`=git mv（rename・URL 不変）

### layout / page（route group 統合の中核）

| 種別 | パス | 要点 |
| --- | --- | --- |
| M | `apps/web/app/(public)/layout.tsx` | async 化。`headers()` で `x-pathname` 取得（fallback `"/"`）、`SidebarShellServer` を mount、`PublicFooter` を shell 配下へ保持 |
| M | `apps/web/app/(member)/layout.tsx` | 同様。`routeKey="member"`、fallback `"/profile"`、PublicFooter なし |
| M | `apps/web/app/(member)/profile/page.tsx` | `MemberHeader` 直接 mount を除去（shell へ責務移管） |
| A | `apps/web/app/(public)/page.tsx` | `/` を `(public)` group へ移設（URL 不変） |
| A | `apps/web/app/(public)/privacy/page.tsx` | `/privacy` を `(public)` group へ移設 |
| A | `apps/web/app/(public)/terms/page.tsx` | `/terms` を `(public)` group へ移設 |
| R | `apps/web/app/login/page.tsx` → `apps/web/app/(public)/login/page.tsx` | `/login` を `(public)` group へ git mv（`_components/*` / `error.tsx` / `loading.tsx` 一式含む） |
| D | `apps/web/app/page.tsx` / `app/privacy/page.tsx` / `app/terms/page.tsx` | 旧 page（移設元）削除 |

### テスト（landed 実装同梱の回帰 spec）

| 種別 | パス |
| --- | --- |
| M | `apps/web/app/(public)/layout.spec.tsx` |
| M | `apps/web/app/(member)/layout.spec.tsx` |
| A | `apps/web/app/(public)/page.spec.tsx` |
| M | `apps/web/app/(member)/profile/page.spec.tsx` |
| D | `apps/web/app/__tests__/page.spec.tsx` / `app/privacy/__tests__/page.spec.tsx` / `app/terms/__tests__/page.spec.tsx`（移設元 colocated spec 削除） |

### 依存 primitive（Task A/B/E・#1028 同梱）

| 種別 | パス |
| --- | --- |
| M | `apps/web/src/components/shell/SidebarShell.server.tsx`（`routeKey` / `sectionRhythm` prop 追加） |
| M | `apps/web/src/components/shell/SidebarShell.tsx` / `shell-config.ts` / `useSidebarState.ts` |
| A | `apps/web/src/components/shell/SidebarMobileTrigger.tsx` / `SidebarDrawer.tsx`（+ 各 spec） |

### 削除（旧 header 撤去・AC-4）

| 種別 | パス |
| --- | --- |
| D | `apps/web/src/components/public/PublicHeader.tsx`（+ `__tests__/PublicHeader.spec.tsx`） |
| D | `apps/web/src/components/layout/MemberHeader.tsx`（+ `__tests__/MemberHeader.spec.tsx`） |

## シグネチャ（landed）

```ts
// (public)/layout.tsx
export default async function PublicLayout(
  { children }: { readonly children: ReactNode }
): Promise<JSX.Element>

// (member)/layout.tsx
export default async function MemberLayout(
  { children }: { readonly children: ReactNode }
): Promise<JSX.Element>

// SidebarShell.server.tsx
export async function SidebarShellServer(props: {
  readonly activePath: string;
  readonly children: ReactNode;
  readonly mobileTriggerSlot: ReactNode;
  readonly userMenuSlot?: ReactNode;
  readonly routeKey?: string;
  readonly sectionRhythm?: string;
  readonly schemaDiffCount?: number;
}): Promise<JSX.Element>

// shell-config.ts
export function buildNavForRole(
  role: ShellRole,
  ctx?: { schemaDiffCount?: number }
): ShellNavGroup[]
```

## 入出力

| 関数 | 入力 | 出力 |
| --- | --- | --- |
| `PublicLayout` | `children`（+ runtime: `headers()` の `x-pathname`） | `SidebarShellServer`（`routeKey="public"`）配下に children + `PublicFooter` |
| `MemberLayout` | `children`（+ runtime: `x-pathname`） | `SidebarShellServer`（`routeKey="member"`）配下に children |
| `SidebarShellServer` | `activePath` / slot / role（内部 `getSession`） | `SidebarShell`（client）へ role / user / navGroups を plain object で渡す |
| `buildNavForRole` | `role`, `schemaDiffCount` | viewer=`[PUBLIC]` / member=`[PUBLIC,MEMBERS]` / admin=`[PUBLIC,MEMBERS,ADMIN]` |

## before → after 差分要点

### `(public)/layout.tsx`

| before | after |
| --- | --- |
| 同期 component。`<PublicHeader />`（topbar）を page/layout で mount | `async` component。`headers()` で `x-pathname` 取得 → `<SidebarShellServer activePath routeKey="public" sectionRhythm="comfortable" mobileTriggerSlot>` を mount。`PublicFooter` を shell 配下へ |

### `(member)/layout.tsx` / `profile/page.tsx`

| before | after |
| --- | --- |
| `MemberHeader` を layout / `profile/page.tsx` 内 2 箇所で直接 mount | `async` layout が `SidebarShellServer`（`routeKey="member"`）を mount。`profile/page.tsx` から `MemberHeader` 直接 mount を除去 |

### role / nav

| before | after |
| --- | --- |
| header 側で role 判定・nav 表示が分散 | `SidebarShellServer` 内 `getSession` → `resolveRole` → `buildNavForRole` に集約。layout は role を扱わない |

## 回帰確認手順（verify_commands）

```bash
# 型チェック
mise exec -- pnpm typecheck

# lint
mise exec -- pnpm lint

# targeted focused run（4 spec）
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  "app/(public)/layout.spec.tsx" \
  "app/(member)/layout.spec.tsx" \
  "app/(public)/page.spec.tsx" \
  "app/(member)/profile/page.spec.tsx"

# 旧 header production import 0 件
git grep -n "PublicHeader\|SessionAwarePublicHeader\|PublicHeaderWithPath\|MemberHeader" \
  -- apps/web/app apps/web/src
```

### 本ブランチ再確認実績

- typecheck: 6 packages green
- lint: exit 0
- apps/web test: **1385 passed | 1 skipped**
- 旧 header production import grep: **0 件**

## DoD（Definition of Done）

| 項目 | 判定基準 |
| --- | --- |
| AC-1 | 7 route（`/`,`/members`,`/register`,`/privacy`,`/terms`,`/login`,`/profile`）で `data-shell-mode="sidebar"` の同一 shell |
| AC-2 | role 別 nav（viewer=PUBLIC / member=+MEMBERS / admin=+ADMIN+badge） |
| AC-3 | `PublicFooter` が shell 配下で描画 |
| AC-4 | 旧 `PublicHeader*` / `MemberHeader` の production import grep = 0 件 |
| 回帰 | typecheck 6 packages green / lint exit 0 / targeted 4 spec PASS |
| 不変条件 | 新 API なし / D1 直接アクセスなし / OKLch トークン経由 / CONST_007 単一サイクル |

## メタ情報

| 項目 | 値 |
| --- | --- |
| task_id | issue-1017-public-member-sidebar-shell-integration |
| Phase | 5 |
| mode | verify_existing |

## 目的

issue-1017 の verify_existing 仕様として、landed 実装 PR #1028 の対象 Phase 5 証跡を明確化する。

## 実行タスク

- 既存本文の Phase 5 記録を正本として維持する。
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

- [x] Phase 5 の判断・証跡が本文に記録されている。
- [x] task-specification-creator の必須見出しを満たす。

## 統合テスト連携

- verify_existing のため新規統合テストは追加しない。
- #1028 landed 実装の focused specs / typecheck / lint / grep gate を Phase 11 証跡として参照する。

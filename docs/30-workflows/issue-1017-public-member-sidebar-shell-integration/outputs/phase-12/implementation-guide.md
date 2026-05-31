---
Phase: 12
status: completed
task_id: issue-1017-public-member-sidebar-shell-integration
implementation_mode: verify_existing
visual_category: VISUAL
---

# 実装ガイド（issue-1017 公開 / 会員 layout の SidebarShell 統合）

---

## Part 1. 中学生にもわかる説明

### なぜ必要か

家を想像してください。リビング、寝室、キッチンと部屋がたくさんありますが、
どの部屋に行っても「同じ廊下」を通って移動します。その廊下に「どこへ行けるかの案内板（メニュー）」が貼ってあれば、
家のどこにいても迷わずに次の部屋へ行けます。

このサイトも同じです。トップページ、会員一覧、登録ページ、自分のプロフィールページなど、
ページ（＝部屋）がたくさんあります。これまでは、それぞれのページが**自分専用の案内板を別々に持っていました**。
そうすると、案内板を 1 つ直したいだけでも、全部のページを 1 枚ずつ直さなければならず、
直し忘れて「このページだけ案内板が古い」という事故が起きやすくなります。

### 何をするか

そこで、案内板（サイドバー）を「ページごと」ではなく「廊下（layout）に 1 つだけ」貼ることにしました。

- どのページを開いても、同じ案内板（サイドバー）が出る
- 案内板を直すときは 1 か所だけ直せばよい
- ログインしているかどうかで、案内板に出るメニューが変わる
  - ログインしていない人 → みんな向けメニューだけ
  - ログイン済みの会員 → みんな向け ＋ 会員向けメニュー
  - 管理者 → みんな向け ＋ 会員向け ＋ 管理者向けメニュー

また、ページの一番下にある「フッター（連絡先や規約へのリンク）」はこれまで通り残します。
古くなった昔の案内板の部品（旧ヘッダー）は、もう誰も使わないので片付けました。

> このサイトの URL（住所）は変わりません。引っ越し（フォルダの整理）はしましたが、外から見た住所は同じままです。

---

## Part 2. 技術者向け説明

### 2.1 全体像

`(public)` / `(member)` の各 route group の `layout.tsx` が shell の所有権を持ち、
共通 `SidebarShellServer` を route group layout で **1 度だけ** mount する。
page 側は shell を持たず、children として layout に挿し込まれる。role 判定・navigation 構築は
`SidebarShellServer` 内に閉じ、layout は表示位置（`activePath`）と slot のみを渡す。

### 2.2 型定義

```ts
type SidebarShellServerProps = {
  activePath: string;        // 現在のパス（nav のアクティブ判定に使用）
  mobileTriggerSlot: ReactNode; // モバイル時のドロワー起動トリガー
  userMenuSlot?: ReactNode;  // 任意: ユーザーメニュー slot
  routeKey?: string;         // route group 識別（"public" / "member"）
  sectionRhythm?: string;    // セクション間リズム（"comfortable" 等）
  schemaDiffCount?: number;  // admin nav バッジ用の schema 差分件数
  children: ReactNode;       // page 本体
};
```

### 2.3 layout.tsx の使用例

`apps/web/app/(public)/layout.tsx`（async server component）:

```tsx
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  return (
    <SidebarShellServer
      activePath={pathname}
      mobileTriggerSlot={<SidebarMobileTrigger />}
      routeKey="public"
      sectionRhythm="comfortable"
    >
      {children}
      <PublicFooter />
    </SidebarShellServer>
  );
}
```

`apps/web/app/(member)/layout.tsx` は同形だが `routeKey="member"`、`PublicFooter` なし、
fallback pathname は `"/profile"`。

### 2.4 role → nav の対応

`SidebarShellServer` 内で `getSession()` → role 判定 → `buildNavForRole(role, { schemaDiffCount })` を呼ぶ。

| role | nav グループ |
|------|------|
| viewer（未ログイン） | PUBLIC |
| member | PUBLIC + MEMBERS |
| admin | PUBLIC + MEMBERS + ADMIN |

role 判定・nav 構築は `SidebarShellServer` に閉じ、layout からは制御しない（責務境界）。

### 2.5 x-pathname fallback のエラーハンドリング

- `(await headers()).get("x-pathname")` は middleware が注入する現在パスを参照する。
- header が未注入（`null`）の場合に備え、`?? "/"`（member layout は `?? "/profile"`）で fallback する。
- これにより header 欠落時も nav のアクティブ判定が安全側に倒れ、例外で layout が落ちることはない。

### 2.6 設定可能 props 一覧

| prop | 必須 | 既定/例 | 用途 |
|------|------|---------|------|
| `activePath` | 必須 | `pathname` | nav アクティブ判定 |
| `mobileTriggerSlot` | 必須 | `<SidebarMobileTrigger />` | モバイルドロワー起動 |
| `routeKey` | 任意 | `"public"` / `"member"` | route group 識別 |
| `sectionRhythm` | 任意 | `"comfortable"` | セクション間リズム |
| `userMenuSlot` | 任意 | `ReactNode` | ユーザーメニュー差し込み |
| `schemaDiffCount` | 任意 | `number` | admin nav バッジ件数 |
| `children` | 必須 | page 本体 | shell 配下にレンダリング |

### 2.7 旧 header 撤去と route group 移行

- 削除済み: `apps/web/src/components/public/PublicHeader.tsx`（+spec）、`apps/web/src/components/layout/MemberHeader.tsx`（+spec）。
- production import grep（`PublicHeader` / `SessionAwarePublicHeader` / `PublicHeaderWithPath` / `MemberHeader`）= 0 件。
- `/`, `/privacy`, `/terms`, `/login` を `(public)` route group へ git mv（URL 不変）。

---

## 視覚証跡

本タスクは VISUAL 区分だが `implementation_mode: verify_existing` であり、実装は #1028 として landed 済み。
そのため Phase 11 の主証跡は **landed 実装に対する回帰テスト + 旧 header 撤去 grep + local runtime screenshot** とする。

| 証跡 | パス | 状態 |
|------|------|------|
| 手動テスト結果 | `outputs/phase-11/manual-test-result.md` | present（主証跡） |
| 回帰テストログ | `outputs/phase-11/regression-test.log` | present（主証跡） |
| screenshot plan | `outputs/phase-11/screenshot-plan.json` | present |
| local screenshot | `outputs/phase-11/screenshots/public-shell-guest-local.png` | present |
| local screenshot | `outputs/phase-11/screenshots/member-shell-profile-local.png` | present |
| local Playwright report | `outputs/phase-11/playwright-report/results.json` | present |
| staging visual baseline（screenshot） | Task F（#1019）staging deploy で取得予定 | pending |

local screenshot は `/` guest と `/profile` member の shell 描画確認で取得済み。
staging screenshot は Task F（#1019）の execution wave で取得する。

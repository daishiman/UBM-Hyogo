# 09-ui-ux.md 章スケルトン（§1〜§10）

> 本ファイルは Phase 2 設計成果物。実装本体は `docs/00-getting-started-manual/specs/09-ui-ux.md`（396 行・契約のみ版）に展開済み。

```
1. 位置づけと正本主義
   1.1 「契約のみ」スコープ
   1.2 link 先（09a / 09b / 09c..09h / Storybook）index 表
2. 19 routes 全画面の契約一覧
   2.1 公開層 (6 routes)
     2.1.1 `/` (Public Top)
     2.1.2 `/(public)/members`
     2.1.3 `/(public)/members/[id]`
     2.1.4 `/(public)/register`
     2.1.5 `/privacy`
     2.1.6 `/terms`
   2.2 会員層 (2 routes)
     2.2.1 `/login`
     2.2.2 `/profile`
   2.3 管理層 (8 routes)
     2.3.1 `/(admin)/admin`
     2.3.2 `/(admin)/admin/members`
     2.3.3 `/(admin)/admin/tags`
     2.3.4 `/(admin)/admin/meetings`
     2.3.5 `/(admin)/admin/schema`
     2.3.6 `/(admin)/admin/requests`
     2.3.7 `/(admin)/admin/identity-conflicts`
     2.3.8 `/(admin)/admin/audit`
   2.4 共通 (3 routes + global fallback)
     2.4.1 `app/error.tsx`
     2.4.2 `app/global-error.tsx`
     2.4.3 `app/not-found.tsx`
     2.4.4 `app/loading.tsx`
3. component 契約一覧
   3.1 primitives (13 種)
     3.1.1 Button / 3.1.2 Card / 3.1.3 Badge / 3.1.4 Input / 3.1.5 Select
     3.1.6 Table / 3.1.7 Tabs / 3.1.8 Sidebar / 3.1.9 Toast / 3.1.10 Skeleton
     3.1.11 DataTable / 3.1.12 EmptyState / 3.1.13 ErrorState
   3.2 feature components (29 種)
4. 状態列挙の規範
   4.1 ページ標準 5 値 (idle / loading / empty / error / success)
   4.2 login 5 状態 (input / sent / unregistered / deleted / error)
   4.3 申請 pending state (server-pending を上書き禁止)
   4.4 [移植元] §4.5 prototype 由来契約 19 行マッピング表
   4.5 [移植元] §4.6 不採用 4 項目
5. アクセシビリティ契約
   5.1 全画面共通
   5.2 dialog / drawer
   5.3 form / input
   5.4 live region
6. token 参照規則
   6.1 視覚値の決定権は 09b にある
   6.2 OKLch tokens を CSS 変数経由でのみ参照
   6.3 token 名 prefix 規則（8 種 prefix）
7. Storybook 正本主義
   7.1 contract と Storybook story の責務分担
   7.2 component の正解スクリーンショットは Storybook の VRT 画像が正本
8. 不採用画面・不採用パターン
9. 用語集
10. 改訂履歴
```

## §2 列構成

```
| 認可 | layout | 主 component | API | 状態 | 主 props | a11y | token | 視覚詳細 link | 不採用 |
```

## §3 列構成

```
| variants | sizes | props | a11y | state | token | 視覚詳細 link | Storybook |
```

## 09a..09h index 表（§1.2 配置）

| ファイル | 担当 task |
| --- | --- |
| 09a-prototype-map.md | task-07 |
| 09b-design-tokens.md | task-08 |
| 09c-primitives.md | task-19 |
| 09d-icons.md | task-22 |
| 09e-screen-blueprints-public.md | task-21 |
| 09f-screen-blueprints-member.md | task-21 |
| 09g-screen-blueprints-admin.md | task-21 |
| 09h-shell-and-fixtures.md | task-22 |

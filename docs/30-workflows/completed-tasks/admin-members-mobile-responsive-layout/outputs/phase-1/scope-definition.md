# スコープ定義

## 含む（4ファイル）

| # | パス | 種別 |
| - | ---- | ---- |
| F1 | `apps/web/src/features/admin/components/_members/MembersTable.tsx` | 編集（属性追加のみ） |
| F2 | `apps/web/src/styles/globals.css` | 編集（`@media` カード化） |
| F3 | `apps/web/src/features/admin/components/__tests__/MembersTable.spec.tsx` | 編集（TC-MT-21〜24） |
| F4 | `apps/web/playwright/tests/admin-members-mobile.spec.ts` | 新規 |

## 含まない（baseline OOS-1）

他 admin 一覧テーブル（tags/meetings/requests/audit）のレスポンシブ化。別画面・別コンポーネント・別責務のため今回サイクル分離（CONST_007 例外1）。「分量」理由ではない。

## CONST_007 宣言

F1-F4 を今回サイクル1回で完了。先送り・別PR分割なし。

# Phase 11 手動スモークログ（Task D: admin サイドバー Form回答リンク）

主証跡は `main.md` の自動テストである。本ファイルは補助証跡として手動スモークの手順と確認状況を記録する。

## 手動スモーク手順

| # | 操作 | 期待結果 | 紐づく AC |
| --- | --- | --- | --- |
| 1 | admin として認証し `/(admin)/admin` を開く | サイドバー nav に「Form回答 ↗」項目が表示される（外部リンクアイコン付き） | AC-D1 |
| 2 | 「Form回答 ↗」をクリックする | **別タブ**で Google Form 編集画面（`FORM_RESPONSES_EDIT_URL`）が開く | AC-D2 |
| 3 | 元の admin 画面（クリック元タブ）を確認する | 元 admin 画面は遷移していない（SPA 内部遷移していない） | AC-D2 |
| 4 | 内部 nav 項目（例: メンバー）と外部項目の active 表示を見比べる | 内部項目は pathname 一致時に active が付くが、外部「Form回答 ↗」項目には active（`aria-current` / `data-active`）が付かない | AC-D4 |
| 5 | サイドバー collapsed トグル後に外部項目を確認 | collapsed 時はラベルが sr-only になりアイコンのみ表示、リンク自体は維持 | （collapsed 回帰） |

## 確認状況

| 環境 | 状況 | 備考 |
| --- | --- | --- |
| local（jsdom unit） | **確認済み（present）** | 上記 #1/#2/#4/#5 に対応する DOM 振る舞いを `SidebarNavItem.spec.tsx` で機械検証（`target=_blank` / `rel=noopener noreferrer` / active 非付与 / sr-only）。#1 の nav 出現は `shell-config.spec.ts`、#2 の URL は `form-responses.spec.ts` で担保 |
| local（手動ブラウザ） | 任意 | `mise exec -- pnpm --filter web dev` で localhost からも目視可能だが、主証跡は unit のため必須ではない |
| staging（admin ログイン） | **未実施（pending / user-gated）** | admin 認証必須のため screenshot と合わせて user-gated。許可時に main.md の取得計画に沿って実施 |

## 自動テストへの写像

手動スモーク各ステップは以下の自動テストで機械化されており、回帰は CI / local unit で検知される。

- #1（nav 出現）→ `shell-config.spec.ts`（admin group の form-responses external 項目）
- #2（別タブ / rel / URL）→ `SidebarNavItem.spec.tsx`（`target=_blank` / `rel=noopener noreferrer` / `href`）+ `form-responses.spec.ts`（canonical URL）
- #4（外部項目に active を付けない）→ `SidebarNavItem.spec.tsx`（外部 `aria-current=null` / `data-active=null` と内部 active の対比）
- #5（collapsed sr-only）→ `SidebarNavItem.spec.tsx`（collapsed 時 label sr-only）

## 完了条件

完了条件は以下をすべて満たすこと。

1. 手動スモーク手順（#1〜#5）が AC（AC-D1 / AC-D2 / AC-D4）に紐付けて記載されている。
2. local（unit）が確認済み（present）、staging（admin ログイン）が user-gated（pending）であることが明記されている。
3. 各手動ステップが対応する自動テストへ写像されている。

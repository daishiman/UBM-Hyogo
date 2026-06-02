# Phase 11 リンク / 参照整合チェック（Task D: admin サイドバー Form回答リンク）

外部リンク項目の URL・属性・定数経由参照が正本と整合していることを機械検証可能な形で記録する。

## 定数 / URL 整合チェック

| # | チェック項目 | 期待値 | 充足証跡 | 状況 |
| --- | --- | --- | --- | --- |
| L-1 | リンク先 URL が定数 `FORM_RESPONSES_EDIT_URL` 経由である（href hardcode しない） | `item.href = FORM_RESPONSES_EDIT_URL` | `SidebarNavItem.spec.tsx`（href 一致）/ `shell-config.spec.ts`（nav 定義が定数参照） | OK |
| L-2 | `FORM_RESPONSES_EDIT_URL` の `formId` が CLAUDE.md フォーム固定値と一致 | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | `form-responses.spec.ts`（canonical URL 一致）/ `apps/web/src/lib/constants/form.ts:6-7` | OK |
| L-3 | URL の末尾が編集 surface（`/edit`） | `https://docs.google.com/forms/d/<formId>/edit` | `apps/web/src/lib/constants/form.ts:7` | OK |
| L-4 | 別タブ遷移属性 `target=_blank` が付与されている | `target="_blank"` | `SidebarNavItem.spec.tsx`（`getAttribute("target") === "_blank"`） | OK |
| L-5 | セキュリティ属性 `rel=noopener noreferrer` が付与されている | `rel="noopener noreferrer"` | `SidebarNavItem.spec.tsx`（`getAttribute("rel")` 一致） | OK |
| L-6 | 外部項目に active（`aria-current` / `data-active`）が付かない | `aria-current=null` / `data-active=null` | `SidebarNavItem.spec.tsx` | OK |
| L-7 | nav 項目の icon が網羅型に含まれる（icon 名 `form-responses`） | icon set に `form-responses` 存在 | `SidebarNavItem` の icon マップ / nav 定義（`shell-config`） | OK |

## CLAUDE.md フォーム固定値との突合

| 固定値 | CLAUDE.md 値 | 本タスクでの利用 |
| --- | --- | --- |
| `formId` | `119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg` | `FORM_RESPONSES_EDIT_URL` の `/forms/d/<formId>/edit` に埋め込み（L-2） |
| `responderUrl` | `https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform` | 別定数 `FORM_RESPONDER_URL`（本タスクの編集リンクとは別 surface・混同しないこと） |

> 注意: `FORM_RESPONSES_EDIT_URL`（編集 `/edit`）と `FORM_RESPONDER_URL`（回答 `/viewform`）は surface が異なる。
> Task D の admin リンクは **編集 URL（`/edit`）** を指す。両者を取り違えていないことを L-2 / L-3 で固定する。

## ドキュメント内リンク整合

| 参照元 | 参照先 | 状況 |
| --- | --- | --- |
| `phase-11.md` | `outputs/phase-11/main.md` / `manual-smoke-log.md` / `link-checklist.md` | OK（本ディレクトリに 3 ファイル実在） |
| `main.md` evidence inventory | 3 spec の実パス | OK（landed 実装に実在） |
| `main.md` 取得計画 | `outputs/phase-11/screenshots/*.png` | pending（user-gated・未生成が正） |

## 完了条件

完了条件は以下をすべて満たすこと。

1. URL が `FORM_RESPONSES_EDIT_URL` 定数経由であり hardcode していないこと（L-1）が記録されている。
2. `formId` が CLAUDE.md フォーム固定値と一致すること（L-2）が記録されている。
3. `target=_blank` / `rel=noopener noreferrer` の付与（L-4 / L-5）が記録されている。
4. icon 網羅型に `form-responses` が含まれること（L-7）が記録されている。
5. 編集 URL（`/edit`）と回答 URL（`/viewform`）の取り違えがないことが明記されている。

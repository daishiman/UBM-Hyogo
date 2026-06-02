# Phase 10: 最終レビュー結果

> 対象: admin サイドバー nav への Google Form 回答編集 外部リンク追加（タスク D）
> ステータス: implemented_local_evidence_captured（実装は dev landed / 親 PR #1064 / commit 745c95115）
> 親ワークフロー: member-publish-recovery-form-ops-and-admin-link

## 判定

**PASS** — Phase 11（証跡取得）へ進めてよい。blocker なし。

## 受け入れ条件 充足判定

| AC | 内容 | 充足 | 根拠 |
| --- | --- | --- | --- |
| AC-D1 | admin サイドバー項目クリックで Form 編集 URL が別タブで開く（元画面は遷移しない） | 満たす | `SidebarNavItem.tsx` の `item.external` 分岐が `<a href={item.href} target="_blank">` を描画。href は `FORM_RESPONSES_EDIT_URL`（`.../edit`） |
| AC-D2 | `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） | 満たす | external `<a>` に `target="_blank" rel="noopener noreferrer"` を付与。tabnabbing / opener 遮断 |
| AC-D3 | href は `FORM_RESPONSES_EDIT_URL` 定数経由（ハードコード禁止） | 満たす | `shell-config.ts` が定数を import し `buildAdminGroup` の項目 href に使用。URL 直書きなし。`form-responses.spec.ts` で定数値を assert |
| AC-D4 | 外部リンク判別（`↗` + sr-only）かつ active 判定対象外 | 満たす | `↗`（`aria-hidden`・非 collapsed）+ sr-only「（外部リンク）」で判別。external 分岐は `data-active`/`aria-current` を出さない。`SidebarNavItem.spec.tsx` で assert |

## レビュー観点表

| 観点 | 評価 | 根拠 |
| --- | --- | --- |
| AC 充足 | OK | AC-D1〜AC-D4 をすべて満たす（上表） |
| 実コード整合 | OK | landed 4 ファイル（`constants/form.ts` / `shell-config.ts` / `icons.tsx` / `SidebarNavItem.tsx`）と 3 spec を Phase 2/4/5 が verbatim 反映。`git diff origin/dev...HEAD -- apps/web` は空 |
| 責務境界 | OK | 定数 / nav config / icon / 描画 の 4 レイヤに責務分離。active 判定は内部 `<Link>` 分岐に閉じ external へ漏れない |
| セキュリティ（不変条件 #7） | OK | `rel="noopener noreferrer"` で `window.opener` 遮断・referrer 抑制。iframe 不採用。外部静的 URL のみで D1/API/Form schema 不変 |
| アクセシビリティ | OK | `↗`（`aria-hidden`）+ sr-only「（外部リンク）」の多重告知。external は `aria-current`/`data-active` 非出力で screen reader が active 誤認しない。collapsed 時は icon のみ |
| OKLch トークン正本化 | OK | className は OKLch トークン変数のみ。HEX 直書き・`bg-[#xxx]`・inline style なし。`verify-design-tokens` 通過 |
| 後方互換 | OK | `external?` は optional。既存内部項目は従来どおり `<Link>` + active 判定（回帰なし）。`appliedQuery` 等の外部 surface に影響なし |
| スコープ | OK | nav リンク 1 項目追加で 1 サイクル完結（CONST_007）。Form 権限設計・D1 取り込みは Task A/B/C の責務でスコープ外（先送りではない） |

## 設計健全性チェック

- 新規 primitive ゼロ。既存 `<a>` / `ShellIcon` / `Chip` / OKLch トークンを再利用し、`RegisterCallout.tsx` の外部リンクパターンを踏襲。
- icon/label/badge の markup は `content` 変数に集約し内部/外部分岐で共有（重複なし）。
- `ShellNavItemId` union 拡張により icon `PATHS` 追加が型レベルで必須化され、icon 追加漏れを構造的に防止。

## 残課題（blocker / 申し送り）

- blocker: なし。
- screenshot は staging 認証必須のため未取得（user-gated）。主証跡は jsdom render unit（`SidebarNavItem.spec.tsx`）/ 純関数 unit（`shell-config.spec.ts`）/ 定数 unit（`form-responses.spec.ts`）。
- Phase 11 への申し送り: VISUAL 境界の証跡として local jsdom render（external `<a>` 属性・`↗`・sr-only・active 非出力）と `buildNavForRole("admin")` 純関数結果を `outputs/phase-11/main.md` に記録する。staging screenshot は user-gated 項目として明示し未取得を正とする。
- Phase 13 への申し送り: 実装は親 PR #1064 で landed 済みのため、本 workflow の Phase 13 は仕様書 docs を対象とし apps 差分を新規発生させない。commit/push/PR は user-gated。

## 結論

landed 実装は AC-D1〜AC-D4 を充足し、責務境界・セキュリティ・a11y・OKLch トークン・後方互換・スコープの
各観点で健全である。blocker は存在せず、Phase 11 の証跡取得へ進める。

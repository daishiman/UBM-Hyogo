# Phase 12 — 未タスク検出（Task D: admin サイドバー外部リンク）

## 結論

**必須未タスク 0 件。** 受け入れ条件 AC-D1〜AC-D4 はすべて landed 実装（親 PR #1064 / commit `745c95115`）で
充足済みであり、残 TODO はない。後段の任意候補は「先送り」ではなく**責務分離による別レーン**であり、本タスクの
完了を妨げない。

## AC 充足状況

| AC | 条件 | 充足 | 担保 |
| --- | --- | --- | --- |
| AC-D1 | 別タブで Form 編集 URL を開く（元画面は遷移しない） | 充足 | `SidebarNavItem.tsx` external 分岐 `<a target="_blank">` |
| AC-D2 | `target="_blank"` + `rel="noopener noreferrer"`（不変条件 #7） | 充足 | external 分岐に固定付与・`SidebarNavItem.spec.tsx` |
| AC-D3 | href は `FORM_RESPONSES_EDIT_URL` 定数経由 | 充足 | `form.ts` 定数 + `buildAdminGroup()` 参照・`form-responses.spec.ts` |
| AC-D4 | `↗` + sr-only 判別 + active 対象外 | 充足 | external 分岐で `↗`/sr-only 付与・active 除外・`shell-config.spec.ts` |

## 残 TODO 走査

| 観点 | 結果 |
| --- | --- |
| 実装上の TODO / FIXME | なし（landed 4 ファイルに未解決 marker なし） |
| 未配線の AC | なし（4/4 充足） |
| テスト欠落 | なし（定数 spec / 描画 spec 3 test / nav config spec の 3 spec が green） |
| 不変条件違反 | なし（#7 担保・OKLch トークン HEX 直書きなし・D1 非接触） |

## 任意の将来候補（必須ではない・責務分離）

以下はいずれも本タスクのスコープ外であり、**起票しなくても Task D は完結**する。実需が生じた時点で
別レーン（別 Issue / 別 workflow）として扱う候補に留める。

| 候補 | 内容 | 区分 | なぜ必須でないか |
| --- | --- | --- | --- |
| C-1 | 外部リンク nav 項目に admin role gating（権限による表示出し分け） | enhancement | 現要件は admin shell 配下にのみ存在し、admin 認証境界で既に保護される。追加の出し分け要件は未提示 |
| C-2 | external リンクパターンの汎用 primitive 抽出（他の外部導線が増えた場合） | refactor | 現状 external 項目は 1 件のみ。primitive 早期抽出は過剰一般化（YAGNI） |
| C-3 | staging での screenshot 視覚回帰（playwright-smoke への組み込み） | testing | admin 認証必須で user-gated。主証跡は local unit で充足済み |

> 上記は「先送り」ではなく、現時点で**実需が確認できない**ための責務分離。必須未タスクとしては起票しない。

## 二重起票防止

本 workflow は親 workflow `member-publish-recovery-form-ops-and-admin-link`（PR #1064）の sub-task の正本記述である。
親側で既に landed 済みであり、Task D 由来で新規 Issue は起票しない。

## 完了条件

- AC-D1〜AC-D4 の充足状況が表で示されていること。
- 残 TODO 走査の結果が記録され、必須未タスク 0 件と結論づけられていること。
- 任意候補が「必須ではない（責務分離）」と明記されていること。

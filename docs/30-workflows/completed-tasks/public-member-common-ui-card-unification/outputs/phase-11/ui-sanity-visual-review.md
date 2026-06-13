# Phase 11: UI サニティ / 視覚レビュー（implemented local / screenshot pending）

- task_id: `public-member-common-ui-card-unification`
- タスク種別: **VISUAL**（UI 共通化＝視覚差分あり）
- 状態: implemented_local_visual_pending。代表4 screenshot は取得済み、残り planned screenshot と staging/profile authenticated baseline は pending。

## Representative screenshots

| File | Visual note |
| --- | --- |
| `screenshots/home-desktop.png` | Hero / stats / card rhythm render without blank page or layout collapse |
| `screenshots/home-mobile.png` | Mobile header and hero card render; dev issue badge overlays bottom only |
| `screenshots/members-desktop.png` | Filter SectionCard and empty/all-hidden fallback render after `topTags` compatibility fix |
| `screenshots/login-mobile.png` | Login SectionCard renders in narrow mobile layout |

## VISUAL 判定の根拠

本タスクは公開層＋会員層＋login の8画面のカード・ボタン・背景・タイポを共通レイアウト層へ移行するため、視覚差分が発生する VISUAL タスクである（NON_VISUAL ではない）。screenshot 証跡（16枚）を実装後に取得する。

## レビュー観点（Apple HIG / トークン整合）— 実装後に評価

| 観点 | 確認内容 | 状態 |
|------|---------|------|
| 一貫性 | 8画面でカード枠 radius/padding/shadow がトークン統一されているか | pending |
| 階層 | PageHeader（h1 serif）→ SectionCard 見出し → ContentCard の視覚階層が明確か | pending |
| ボタン | primary/accent/ghost/soft/danger が Button/ButtonLink で同一視覚か | pending |
| 背景 | PageShell の data-bg で背景が一元化されているか | pending |
| レスポンシブ | mobile(390) でカードが縦積みで破綻しないか | pending（staging 実機） |
| a11y | 見出し階層・role・コントラストが既存レベル以上か | pending |

## jsdom 非適用領域

@media / hover / gradient / 実フォントは jsdom で再現されないため、staging 実機 screenshot で確認する（`screenshot-plan.json#boundary`）。

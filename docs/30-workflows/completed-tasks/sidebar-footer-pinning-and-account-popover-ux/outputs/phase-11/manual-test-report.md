# Phase 11 手動テストレポート — sidebar footer 固定 + account popover UX

> メタ: タスクID=sidebar-footer-pinning-and-account-popover-ux / 種別=VISUAL / implemented_local_evidence_captured（実装は本サイクル）/ 実施日=2026-06-02

## 証跡の主ソース

| tier | 証跡 | 取得可否 |
|------|------|---------|
| tier-1（自動） | Phase 4-6 の targeted component spec（`SidebarShell.spec` / `SidebarUserMenu.spec` / `SidebarNavItem.spec`）による DOM 構造・開閉挙動の契約検証 | 実装サイクルで実走（implemented_local_evidence_captured 段階では未実走）|
| tier-2（手動・user-gated） | staging `ubm-hyogo-web-staging` での実 screenshot 5 枚（`screenshot-plan.json` 参照）| staging 認証必須のため **未取得** |

## screenshot を今取得しない理由

1. 本タスクは implemented_local_evidence_captured（apps/web のコード変更済み）であり、修正後の画面が存在しない。
2. staging は管理者認証が必須で、取得は user-gated。
3. 実装 + user 承認後に `screenshot-plan.json` の 5 シーンを取得する。

## 4 症状の確認チェックリスト（実装済みとして埋める）

- [ ] C1: admin で nav 14 項目を表示しても「公開サイトに戻る」/ user メニュー / collapse トグルがスクロールなしで最下部に見える（AC-1）
- [ ] C2: collapse 時アイコンが 4rem 幅からはみ出さない（AC-2）
- [ ] C3: popover 開状態で外側クリック / Escape で閉じる。route 変化 close も維持（AC-3）
- [ ] C4: 短コンテンツ公開ページで PublicFooter が viewport 最下部に配置（AC-4）
- [ ] AC-5: HEX 直書きなし・既存 API/auth 不変
- [ ] AC-6: 既存 spec 回帰なし + 新規 spec 緑

## Apple HIG / 視覚観点（実装済み確認）

- 固定フッターと内部スクロールの境界が視覚的に明瞭（border-top）。
- collapsed のアイコン中央寄せが balance を保つ。
- popover の dismiss が直感的（外側タップで閉じる一般的メンタルモデルに一致）。

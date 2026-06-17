# Phase 11 Manual Test

## テストケース

| TC-ID | 対象 | 期待する視覚状態 |
| --- | --- | --- |
| TC-11-1 | `/profile` 410 | 退会済みタイトル、問い合わせ案内、公開トップ CTA が表示され、再読み込みリンクがない |
| TC-11-2 | admin MemberDrawer deleted state | 退会済みセクションと `member-restore-button` が表示される |
| TC-11-3 | admin MemberDrawer after restore | 成功 toast が表示され、退会済みセクションが消滅する |

## 画面カバレッジマトリクス

| TC-ID | 画面 | 証跡 |
| --- | --- | --- |
| TC-11-1 | `/profile` | `screenshots/profile-410-deleted-guidance.png` |
| TC-11-2 | `/admin/members` | `screenshots/admin-member-drawer-restore-button.png` |
| TC-11-3 | `/admin/members` | `screenshots/admin-member-drawer-after-restore.png` |

## 備考

Local static visual contract screenshots are present under `outputs/phase-11/screenshots/`.
Staging authenticated screenshots and D1 restore mutation remain `pending_user_gate`.

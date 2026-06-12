# Phase 11 Link Checklist（NON_VISUAL）

タスク種別 NON_VISUAL（UI 表現変更なし）。本タスクは UI リンク・導線を変更しないため、確認対象は transport 解決経路と既存導線の回帰のみ。

| 対象 | 種別 | Status |
|------|------|--------|
| `/me`（server-side fetch 経路） | transport 解決（service-binding 優先・localhost 不到達） | covered by focused tests（T1/T2/T3・実装時 / user-gated） |
| `/login?redirect=/profile`（401 redirect） | 既存導線・回帰確認 | covered by focused tests（T3-4・回帰ゼロ・実装時 / user-gated） |
| `server_fetch_failed` ログ（`transportKind`/`baseHost`/`status`） | observability 出力 | covered by focused tests（T4）+ staging 実機ログ（MT-B・user-gated） |
| staging `/profile`（認証ルート実機） | 実機観測 | user-gated（MT-A〜MT-D） |

UI リンクの新規追加・変更はなし（NON_VISUAL）。スクリーンショットは取得しない。

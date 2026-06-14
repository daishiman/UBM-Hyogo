# Phase 11 Link Checklist（NON_VISUAL / implemented_local_evidence_captured）

タスク種別 NON_VISUAL（UI 表現変更なし・apps/web 非接触）。本タスクは UI リンク・導線を変更しないため、確認対象は `/me` 系 endpoint の挙動契約と既存導線の回帰のみ。全て本サイクル / user-gated で確認する。

| 対象 | 種別 | Status |
|------|------|--------|
| `GET /me`（session-guard 経由） | D1 例外時の 500 problem+json（`UBM-5001`）契約 | covered by TC-1/TC-2（本サイクル・present） |
| `GET /me/profile`（一次データ） | `buildMemberProfile` 例外時の 500 分類契約 | covered by TC-3（本サイクル・present） |
| `GET /me/profile`（二次データ） | `getPendingRequestsForMember` 例外時の 200 + `pendingRequests: {}` degrade | covered by TC-4（本サイクル・present） |
| 既存導線（200/401/404/410 系・`/login` redirect） | 回帰確認（status 体系不変・AC-4） | full `/me` contract spec 34/34 PASS（本サイクル・present） |
| staging `/profile` → `/me`（実機） | 実機観測（`UBM-5001` + scope ログ） | user-gated（MT-5〜MT-6・pending） |

UI リンクの新規追加・変更はなし（NON_VISUAL・apps/web 非接触）。スクリーンショットは取得しない。

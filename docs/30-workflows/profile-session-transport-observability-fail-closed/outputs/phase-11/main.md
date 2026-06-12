# Phase 11 Main（NON_VISUAL）

タスク種別 NON_VISUAL（fetch/transport 層 + 構造化ログのみ・UI 表現変更なし）。証跡の主ソースは focused tests（T1-T5）と staging 実機の `server_fetch_failed` ログ（`{transportKind, baseHost, status}`）。スクリーンショットは取得しない（screenshots/ は空）。

- workflow_state: `implemented_local_evidence_captured`。
- focused tests（T1-T5）: PASS（5 files / 70 tests）。
- staging 実機ログ確認（MT-A〜MT-D・`baseHost=service-binding.local` の localhost 否定証明 + 真因 410/5xx/transport 確定）: pending（user-gated・DoD の一部）。
- staging deploy・wrangler tail・commit・PR: user-gated。

詳細は `phase-11.md`（MT-A〜MT-D 手順）/ `manual-test-result.md`（NON_VISUAL 証跡メタ・T1-T5 件数）/ `ui-sanity-visual-review.md`（NON_VISUAL 宣言）を参照。

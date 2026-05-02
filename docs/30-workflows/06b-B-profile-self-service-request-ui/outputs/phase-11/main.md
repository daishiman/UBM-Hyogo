# Output Phase 11: 手動 smoke / 実測 evidence

## status

BLOCKED — runtime smoke は 06b-A の Auth.js session resolver が production で解決できる状態になるまで待機。

## planned evidence (06b-A 完了後)

| AC | runtime evidence path | owner |
| --- | --- | --- |
| 公開停止/再公開申請を送れる | `outputs/phase-11/profile-visibility-request-smoke.md` | 06b-B execution（本タスクの実行ターン） |
| 退会申請を送れる | `outputs/phase-11/profile-delete-request-smoke.md` | 06b-B execution |
| 409 duplicate を表示する | `outputs/phase-11/profile-request-duplicate-409.md` | 06b-B execution |
| screenshot / E2E | `docs/30-workflows/02-application-implementation/06b-C-profile-logged-in-visual-evidence/outputs/phase-11/` | 06b-C |

## local smoke (実施済)

- vitest（21 files / 125 passing）でモック fetch 経由の 202 / 401 / 403 / 409 / 422 / 429 ハンドリングを確認。
- 実 production session を伴う screenshot は 06b-A → 06b-C で取得する設計。

## reason for block

- 06b-A の session resolver evidence が揃うまで `/api/me/visibility-request` は本人セッションで 401 を返さず到達できる保証がない。
- 本ブロックは index.md の運用ポリシー（serial-gated execution）に整合。

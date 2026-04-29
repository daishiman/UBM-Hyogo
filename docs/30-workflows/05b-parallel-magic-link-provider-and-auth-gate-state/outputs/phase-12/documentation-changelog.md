# Documentation Changelog (本タスク 05b)

| 日付 | 変更 | 影響範囲 |
|---|---|---|
| 2026-04-29 | `outputs/phase-01/main.md` 作成 (AC-1〜AC-10, 5 state 表) | 設計ベースライン |
| 2026-04-29 | `outputs/phase-02/{main,architecture,api-contract}.md` 作成 | apps/web ↔ apps/api 接続図、zod schema 草案 |
| 2026-04-29 | `outputs/phase-03/main.md` 作成 (5 alternatives review) | 設計選択の根拠 |
| 2026-04-29 | `outputs/phase-04/{main,test-matrix}.md` 作成 | AC × test ID matrix |
| 2026-04-29 | `outputs/phase-05/{main,runbook}.md` 作成 + 実装コード一式 | apps/api auth, apps/web proxy, magic_tokens.deleteByToken |
| 2026-04-29 | `outputs/phase-06/main.md` 作成 (F-01〜F-17 失敗ケース) | 異常系 |
| 2026-04-29 | `outputs/phase-07/{main,ac-matrix}.md` 作成 | AC × test × runbook × failure 紐付け |
| 2026-04-29 | `outputs/phase-08/main.md` 作成 (DRY/naming Before/After) | リファクタ証跡 |
| 2026-04-29 | `outputs/phase-09/main.md` 作成 (品質 gate 結果) | typecheck/lint/test/fs-check 全 PASS |
| 2026-04-29 | `outputs/phase-10/main.md` 作成 (GO/NO-GO=GO) | 最終レビュー |
| 2026-04-29 | `outputs/phase-11/{main, evidence 8 件}` 作成 | 手動 smoke 代替 (vitest 契約) |
| 2026-04-29 | `outputs/phase-12/*` 作成 (本書含む 7 ファイル) | ドキュメント更新 |
| 2026-04-29 | `apps/api/scripts/no-access-fs-check.sh` 作成 | AC-7 機械検証 |
| 2026-04-29 | `/no-access` 不採用を再確認 (不変条件 #9) | 06a/b/c 引き継ぎ |
| 2026-04-29 | rate-limit 要件 (email 5/h / IP 30/h / IP 60/h) を実装 + ドキュメント化 | apps/api middleware |

## 仕様矛盾の検出有無

- `docs/00-getting-started-manual/specs/` の現行記述と本実装の間に矛盾は検出されず。
- ただし spec 側に「ない情報」(rate-limit の数値、`/auth/gate-state` 等) は `system-spec-update-summary.md` に改訂候補として記録。

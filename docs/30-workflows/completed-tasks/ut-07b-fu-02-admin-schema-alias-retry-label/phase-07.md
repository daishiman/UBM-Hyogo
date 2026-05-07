# Phase 7: AC マトリクス

`[実装区分: 実装仕様書]`

| AC | 内容 | 検証 Phase | 検証手段 |
| --- | --- | --- | --- |
| AC-1 | HTTP 202 + `backfill.status='exhausted'` + `retryable=true` を retryable continuation として識別 | Phase 5 / 9 | `api.test.ts` API-02 / `SchemaDiffPanel.test.tsx` UI-02 |
| AC-2 | API client が status code と body を component から判定可能 | Phase 5 | `api.test.ts` API-01〜05 で `r.status` と `r.data` を検証 |
| AC-3 | 4 状態（success / validation / conflict / retryable）の表示区別 | Phase 5 / 9 | `SchemaDiffPanel.test.tsx` UI-01〜04 |
| AC-4 | retryable label と通常エラー label が異なる role / wording | Phase 2 / 5 | `role="status"` vs `role="alert"` / 文言一覧 |
| AC-5 | API contract 不変 | Phase 9 | `git diff main...HEAD apps/api/` が空であること |
| AC-6 | 不変条件 #5 違反ゼロ | Phase 9 | `apps/web/` から D1 直接アクセスを追加していないことを `rg` で確認 |
| AC-7 | component test で 4 fixture 区別 | Phase 9 | UI-01 / UI-02 / UI-03 / UI-04 が独立 PASS |
| AC-8 | `api.test.ts` で 202 status / body 透過 | Phase 9 | API-02 PASS |
| AC-9 | `pnpm typecheck` / `lint` / `web unit test` GREEN | Phase 9 | コマンド出力 |
| AC-10 | Phase 12 で 7 必須成果物（中学生レベル + 技術者レベル + skill feedback + unassigned 検出 + compliance check） | Phase 12 | `outputs/phase-12/` 配下のファイル実体 |

## ゲート

- [ ] 全 AC が verification artifact と紐付いている
- [ ] AC-5（API contract 不変）が Phase 9 で `git diff` 検証されることが明記

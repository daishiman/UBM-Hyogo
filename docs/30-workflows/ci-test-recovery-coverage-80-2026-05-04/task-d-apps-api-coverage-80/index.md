# タスク仕様書: Task D — apps/api カバレッジ ≥80% 達成

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | ci-recover-task-d-apps-api-coverage-80 |
| 親 wave | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/` |
| 配置先 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-d-apps-api-coverage-80/` |
| 作成日 | 2026-05-04 |
| 状態 | spec_created |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 親タスクの wave | wave-2 |
| dependencies | Task B (`ci-recover-task-b-api-test-recovery`) **完了必須**（13 件 test failure 解消で coverage-summary.json 生成可能になっていること） |
| 並列実行 | wave-2 内で Task C と並列可能（apps/web と apps/api は独立） |
| ブランチ（想定） | `feat/ci-recover-task-d-apps-api-coverage-80` |
| 想定 PR 数 | 1 |
| coverage AC | Statements / Branches / Functions / Lines いずれも **≥80%**（apps/api 全体 `coverage-summary.json#total`） |

## 目的

Task B 完了後、`apps/api` の coverage を全 metric ≥80% に到達させる。Issue #320 系で取り上げられた public use-case 4 本（`get-form-preview` / `list-public-members` / `get-public-stats` / `get-public-member-profile`）と、それぞれの route handler（`apps/api/src/routes/public/*.ts`）を含む未達ファイル群を 4 lane（route / use-case / repository / middleware）に分割して並列補強する。

## スコープ

| 含む | 含まない |
| --- | --- |
| `apps/api/src/routes/**/*.test.ts` の新規/補強（Hono `app.fetch` integration test） | API 仕様変更・新規 endpoint 追加 |
| `apps/api/src/use-cases/**/*.test.ts` の新規/補強（domain pure unit + repository mock） | use-case のビジネスロジック変更 |
| `apps/api/src/repository/**/*.test.ts` の新規/補強（Mock provider + Miniflare D1 binding） | D1 schema migration / 新規テーブル追加 |
| `apps/api/src/middleware/**/*.test.ts` の補強（auth gate / rate limit / session resolver / error handler） | middleware の責務変更 |
| `apps/api/src/_shared/` `apps/api/src/utils/` `apps/api/src/view-models/` `apps/api/src/workflows/` の未達分補強 | `apps/api/src/sync/` 配下の sheets 連携実装変更 |
| `apps/api/vitest.config.ts` の `coverage.exclude` 微調整（fixture / barrel / type-only export を除外） | グローバル閾値 80% の引き上げ・引き下げ |
| Issue #320 系 public use-case 4 本 + route handler の網羅 | UI 機能変更 / E2E test 拡充 |

## 不変条件（CLAUDE.md 継承）

- 不変条件 #5: D1 への直接アクセスは `apps/api` に閉じる（test 内でも `apps/web` から D1 binding へ直接触らない）
- 不変条件 #6: GAS prototype は本番バックエンド仕様に昇格させない
- 不変条件 #1: 実フォームの schema をコードに固定しすぎない（fixture は schema-version 経由で生成）
- CONST_007: 本 Task で発生した未解決事項は別 PR / 別 wave に送らず、`outputs/phase-12/unassigned-task-detection.md` に「除外理由付き 0 件 close」「`coverage.exclude` 採用理由」「fixture 追加で確定」のいずれかで吸収する

## 完了条件（spec 段階）

- [x] Phase 1-13 の `phase-N.md` が存在し、各 Phase が `## メタ情報` / `## 目的` / `## 実行タスク` / `## 完了条件` を持つ
- [x] coverage AC（≥80% / `bash scripts/coverage-guard.sh --package apps/api` exit 0）が Phase 6 / Phase 9 / Phase 11 完了条件に明記されている
- [x] Phase 4 設計で 4 lane（route / use-case / repository / middleware）への lane 分割と各 lane 対象ファイル列挙が記述されている
- [x] Phase 13 が blocked placeholder（commit / push / PR / deploy 禁止）として配置されている
- [x] dependencies に Task B の完了必須が明記されている

## 完了条件（実装段階）

- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test` exit 0（Task B 由来の 13 件 failure が再発しないこと）
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api test:coverage` で `apps/api/coverage/coverage-summary.json` 生成
- [ ] `coverage-summary.json#total` の Lines / Branches / Functions / Statements が **すべて ≥80%**
- [ ] `bash scripts/coverage-guard.sh --package apps/api` exit 0
- [ ] Issue #320 系 4 ファイル（`get-form-preview` / `list-public-members` / `get-public-stats` / `get-public-member-profile`）の use-case + route handler が両方 ≥80%
- [ ] 既存テスト regression 0（Task B 完了時のテスト件数 ± 新規追加分のみ）
- [ ] `outputs/phase-11/coverage-after.json` と `outputs/phase-11/coverage-diff.md`（before/after metric 表）が存在

## 参照資料

| 参照資料 | パス |
| --- | --- |
| 親 wave 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/index.md` |
| Phase 1-3 共通設計 | `../outputs/phase-{1,2,3}/*.md` |
| Task B 仕様 | `docs/30-workflows/ci-test-recovery-coverage-80-2026-05-04/task-b-apps-api-test-recovery/` |
| coverage-guard | `scripts/coverage-guard.sh` |
| coverage-standards | `.claude/skills/task-specification-creator/references/coverage-standards.md` |
| patterns-testing | `.claude/skills/task-specification-creator/references/patterns-testing.md` |
| int-test-skill | `.claude/skills/int-test-skill/SKILL.md`（Mock provider + D1 binding pattern） |
| 既存資産（重複回避） | `docs/30-workflows/completed-tasks/ut-08a-01-public-use-case-coverage-hardening/` |
| apps/api package.json | `apps/api/package.json`（test / test:coverage script 定義） |
| apps/api wrangler.toml | `apps/api/wrangler.toml`（D1 binding / env 定義） |

## Phase 一覧

| Phase | 名称 | 状態 |
| --- | --- | --- |
| 1 | 要件定義（baseline coverage 取得 + 未達ファイル抽出） | spec_created |
| 2 | 設計（4 lane 分割 + lane 別対象ファイル一覧 + テスト方針） | spec_created |
| 3 | アーキテクチャ確認（依存グラフ・simpler alternative） | spec_created |
| 4 | テスト設計（lane 別 test case 列挙 + Mock provider 設計） | spec_created |
| 5 | 実装準備（fixture / mock / D1 binding helper 整備） | spec_created |
| 6 | テスト実装・カバレッジ確認（lane 並列実装） | spec_created |
| 7 | テストカバレッジ確認（80% 達成判定） | spec_created |
| 8 | 統合テスト（Hono `app.fetch` + Miniflare） | spec_created |
| 9 | 品質検証（regression 0 / coverage-guard exit 0） | spec_created |
| 10 | 最終レビュー（lane 横断レビュー） | spec_created |
| 11 | 手動テスト / runtime evidence（NON_VISUAL 3 点） | spec_created |
| 12 | ドキュメント更新（7 必須成果物） | spec_created |
| 13 | コミット・PR 作成 | blocked（user 明示承認後のみ） |

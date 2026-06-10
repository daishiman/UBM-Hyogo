# ドキュメント changelog

- task_id: `public-home-member-card-info-and-tag-clarity`
- status: **implemented_local_evidence_captured**（実コード・仕様書・Phase 11 local visual evidence・Phase 12 strict 7 を同一サイクルで反映済み。staging screenshot / commit / push / PR は user-gated）

## 全 Step 結果サマリ

| Step | 結果 |
| --- | --- |
| Step1-A 要件 | 反映済み（AC 変更なし。実装済み state へ同期） |
| Step1-B 設計 | 反映済み（Phase 2 設計と実装識別子の対応を維持） |
| Step1-C テスト | 反映済み（focused Vitest 6 files / 50 tests PASS、local visual PNG あり） |
| Step2 公開仕様 | **反映済み**（`PublicMemberListItem` に optional `businessSummary`、`GET /public/members` に `expand=tags` / `businessSummary` 契約を同期） |

## workflow-local（本ワークフロー配下の変更）

- `docs/30-workflows/completed-tasks/public-home-member-card-info-and-tag-clarity/phase-11-manual-test.md`: 新規（screenshot 計画 + 3 層評価手順）。
- `.../phase-12-documentation.md`: 新規（6 必須タスク → 7 成果物索引）。
- `.../phase-13-pr.md`: 新規（commit/PR/release 手順・user-gated）。
- `.../outputs/phase-11/manual-test-result.md` / `screenshot-plan.json` / `phase11-capture-metadata.json` / `screenshot-coverage.md`: local visual evidence あり（`member-card-home-comfy-with-tags.png`）・staging は user-gated。
- `.../outputs/phase-12/*.md`: 新規（本 7 成果物）。
- `.../outputs/phase-11/screenshots/member-card-home-comfy-with-tags.png`: Playwright local harness で取得済み。

## global sync（リポジトリ横断 / 公開仕様の同期）

- `docs/00-getting-started-manual/specs/01-api-schema.md`: `GET /public/members` list item 出力に optional `businessSummary`、query に `expand=tags` を追記済み。
- `docs/00-getting-started-manual/specs/09e-screen-blueprints-public.md`: 旧「businessOverview/tags は一覧 item contract に存在しない」前提を `businessSummary` + opt-in `tags` の現行 contract へ更新済み。
- `.claude/skills/aiworkflow-requirements/` の changelog / quick-reference / resource-map / api-endpoints / task-workflow-active に同一 wave で反映済み。

## 注記

- 本タスクは `relatedIssue: null`（staging 観察起点）。Issue 連動の changelog 反映は不要。
- skill changelog は `.claude/skills/aiworkflow-requirements/SKILL-changelog.md` に登録済み。task-specification-creator 側のテンプレート改善は検出なし。

# Phase 12 main — ドキュメント更新サマリ

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 状態 | completed as scaffolding-only / visual evidence deferred |
| 前 Phase | 11（手動 smoke / scaffolded） |
| 次 Phase | 13（PR 作成） |
| 作成日 | 2026-04-30 |

## 目的

Phase 1〜11 の成果物を 6 種ドキュメントに集約し、後続実装者 / 別エージェントへの引き継ぎコストを最小化する。

## 成果物 index

| # | 種別 | パス | 用途 |
| --- | --- | --- | --- |
| 1 | summary | [main.md](./main.md) | 本ファイル / phase-12 サマリ |
| 2 | guide | [implementation-guide.md](./implementation-guide.md) | **PR 本文の元**。runbook / spec signature / page object / fixture / axe / CI yml |
| 3 | spec 差分 | [system-spec-update-summary.md](./system-spec-update-summary.md) | 09-ui-ux / 13-mvp-auth / 11-admin-management 提案差分 |
| 4 | changelog | [documentation-changelog.md](./documentation-changelog.md) | 本タスクで追加・更新したファイル一覧 |
| 5 | unassigned | [unassigned-task-detection.md](./unassigned-task-detection.md) | 未タスク検出（5 件） |
| 6 | feedback | [skill-feedback-report.md](./skill-feedback-report.md) | task-specification-creator skill 改善提案 |
| 7 | compliance | [phase12-task-spec-compliance-check.md](./phase12-task-spec-compliance-check.md) | 13 phase 全体の仕様準拠チェック |

## カバー範囲ハイライト

- **scaffolding 完了**: `apps/web/playwright/` 配下に config 1 / fixtures 2 / page-objects 12 / tests 7 spec を配置済み。ただし spec は `test.describe.skip` のままで、実 gate ではない。
- **CI 雛形**: `.github/workflows/e2e-tests.yml` 追加。偽 green 防止のため `workflow_dispatch` の手動実行のみ。
- **依存追加**: `apps/web/package.json` に `@playwright/test ^1.50.0` と `@axe-core/playwright ^4.10.0`。
- **不変条件 #4 / #8 / #9 / #15** は test scaffold として記述済み（ac-matrix.md トレース）。実証跡は未取得。
- **AC-1〜8** は Phase 7 マトリクスに trace 済み。AC-7 / AC-8 は実 screenshot / 実 axe 未取得のため `DEFERRED`。
- **実 evidence 撮影は後続委譲**: 上流 wave 6/7 完全 green 後に 09a / 後続 task が `pnpm --filter @ubm-hyogo/web test:e2e` で取得する運用。

## 完了条件チェック

- [x] 6 種ドキュメント生成
- [x] compliance-check で scaffold と実 evidence の境界を明記
- [x] unassigned 5 件記載（うち実 E2E 実行は正式未タスク化）
- [x] system-spec-update-summary が 3 spec 以上に提案差分と同期状態を記録（4 spec 記載）

## 次 Phase

Phase 13（PR 作成 / user 承認後）へ。PR 本文では「実行済み E2E」ではなく「E2E scaffold + VISUAL_DEFERRED」と表現する。

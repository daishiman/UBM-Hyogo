# Phase 12: ドキュメント更新

[実装区分: 実装仕様書]

Phase 12 strict 7 成果物の概要インデックス。本タスクは NON_VISUAL implementation task で、
`workflow_state = PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`。local 実装・focused regression・grep gate は完了し、
Cloudflare staging runtime smoke / commit / push / PR のみ user-gated として残す。

| Task      | Output                                       | 責務                                                             | Status |
| --------- | -------------------------------------------- | ---------------------------------------------------------------- | --------------------------- |
| Task 12-0 | `phase-12.md`                                | Phase 12 タスク仕様書本体（Task 12-1〜12-6 の指示書）           | present                     |
| Task 12-0 | `main.md`                                    | Phase 12 概要インデックス（本ファイル）                          | present                     |
| Task 12-1 | `implementation-guide.md`                    | 実装ガイド（Part 1 中学生 / Part 2 技術者 + 視覚証跡）           | present                     |
| Task 12-2 | `system-spec-update-summary.md`              | システム仕様整合記録（Step 1-A/1-B/1-C + Step 2 + deviation）   | present                     |
| Task 12-3 | `documentation-changelog.md`                 | 全 Step 結果（workflow-local / global sync を別ブロック）        | present                     |
| Task 12-4 | `unassigned-task-detection.md`               | 未タスク検出（`public.ts` 同型改善は同サイクル完了、未タスク 0） | present                     |
| Task 12-5 | `skill-feedback-report.md`                   | スキルフィードバック（改善点なしでも出力）                       | present                     |
| Task 12-6 | `phase12-task-spec-compliance-check.md`      | root evidence（canonical heading / Phase 11 / 6 成果物充足）     | present                     |

## 中核設計（一次情報）

- 対象: `apps/web/src/lib/auth.ts` の `process.env.*` / `getCloudflareContext().env` 直接参照、および
  `apps/web/src/lib/fetch/public.ts` の public fetch env 直接参照。
- 統一先: `apps/web/src/lib/env.ts` の `getAuthEnv()`（`AuthEnvSchema.safeParse(readRawEnv())` partial +
  `API_SERVICE` binding 同梱・throw しない）と `getPublicFetchEnv()`。
- 不変条件: invariant #11（fail-closed = env 欠落でも throw せず `unregistered` 返却）を維持。
- deviation: issue #862 は「`getEnv()` 経由」「parse 失敗 throw 維持」と記すが、現行 `getEnv()` は throw 設計で
  auth の fail-closed と非互換。auth 境界は `getAuthEnv()`（safeParse・throw しない）へ再解釈し、throw は
  data-fetch 境界に閉じる。

## Runtime boundary

Cloudflare staging deploy、authenticated `/login → /admin` runtime smoke、commit、push、PR は user-gated。
local Phase 12 では実行せず `pending` として扱う。

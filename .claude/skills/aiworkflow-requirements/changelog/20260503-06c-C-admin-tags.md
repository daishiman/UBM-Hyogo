# 2026-05-03 06c-C admin tags queue-only follow-up close-out sync

## 変更概要

- `docs/30-workflows/completed-tasks/06c-C-admin-tags/` を `implemented-local / implementation-spec / docs-only / VISUAL_ON_EXECUTION` として正本へ同期。
- `TagQueuePanel.tsx` で `TagQueueStatus` に `dlq` を追加（issue-109 DLQ 列と整合）し、`TERMINAL_STATUSES = {resolved, rejected, dlq}` を export して `page.tsx` 側 status リテラルと型 single-source-of-truth 化。
- `AdminTagsPage.ts` (Playwright POM) を旧 CRUD locator (`admin-tag-list` / `admin-add-tag-button` / `clickAddTag`) から `queueList` / `reviewPanel` / `statusFilters` + `assertQueueShell()` へ置換。`admin-pages.spec.ts` も `assertQueueShell()` 呼び出しに更新。
- 正本境界を再確認: `/admin/tags` は queue-only、API は `GET /admin/tags/queue` + `POST /admin/tags/queue/:queueId/resolve` のみ、契約 schema は `tagQueueResolveBodySchema`、apps/web → D1 直接アクセス禁止。
- 固有教訓 `lessons-learned-06c-C-admin-tags-2026-05.md`（L-06CC-001〜005）と artifact inventory `workflow-06c-C-admin-tags-artifact-inventory.md` を新規追加。

## 苦戦箇所

- `/admin/tags` という URL から「タグ辞書 CRUD」を連想する罠が強く、Phase 1 着手前の `12-search-tags.md` + `11-admin-management.md` 必読を境界化する必要があった。
- issue-109 で `tag_queue.status` に `dlq` が追加された後、UI 側 status union が未追従で UI / POM / page guard / フィルタボタン配列の 4 箇所に分散しており、Panel export による single-source-of-truth 化で 1 箇所更新化した。
- 旧 CRUD POM が skip 中で残存しており、queue-only 化と同 PR で必ず置換しないと将来 unskip 時に 100% fail する事故導線が温存される。
- runtime visual evidence は authenticated admin + sanitized D1 fixture が前提で 06c-C 単独不可のため、08b / 09a へ委譲境界をテンプレ化（06c-A / 06c-B と同パターン）。

## 検証

- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` PASS（warning は pre-existing なファイルサイズ超過のみ）。
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を再実行し、`indexes/topic-map.md` / `indexes/keywords.json` の drift がないことを確認する。
- `mise exec -- pnpm indexes:rebuild` で indexes drift 0 を確認する。
- runtime visual evidence は 08b admin Playwright E2E / 09a staging smoke で実測する（本 wave では取得しない）。

## 同期対象

| target | path |
| --- | --- |
| SKILL changelog | `SKILL.md`（v2026.05.03-06c-C-admin-tags 行）|
| quick-reference | `indexes/quick-reference.md`（§UBM-Hyogo Admin Tags Remaining Spec 早見、既反映）|
| resource-map | `indexes/resource-map.md`（completed-tasks/06c-C-admin-tags 行、既反映）|
| task-workflow-active | `references/task-workflow-active.md`（06c-C-admin-tags 行、既反映）|
| legacy register | `references/legacy-ordinal-family-register.md`（06c-C-admin-tags 行、本 wave 追加）|
| lessons hub | `references/lessons-learned.md`（lessons-learned-06c-C-admin-tags-2026-05.md エントリ追加）|
| lessons child | `references/lessons-learned-06c-C-admin-tags-2026-05.md`（新規）|
| artifact inventory | `references/workflow-06c-C-admin-tags-artifact-inventory.md`（新規）|
| changelog | `changelog/20260503-06c-C-admin-tags.md`（本ファイル）|

## 0 件 unassigned-task の根拠

`outputs/phase-12/unassigned-task-detection.md` で「0 new unassigned tasks」と明記。旧 CRUD / alias /
direct-assignment 案は正本仕様（queue-only 境界）に違反するため撤回済み。新規 unassigned task は発生しない。
ただし「SKILL.md merge conflict marker 残存検出 hook（pre-commit）」は将来追加候補として L-06CC-004 に
記録（現時点では unassigned task 化しない、運用観察フェーズ）。

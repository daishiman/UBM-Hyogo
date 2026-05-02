# 2026-05-02 06c-B admin members follow-up close-out sync

## 変更概要

- `docs/30-workflows/completed-tasks/06c-B-admin-members/` を `implemented-local / implementation / VISUAL_ON_EXECUTION` として正本へ同期。
- admin members API baseline (`GET /admin/members`, detail, `POST .../delete`, `POST .../restore`) に `q` / `tag` / `zone` / `sort` / `density` / `page` を `apps/api` に実装し、`apps/web` 側は URL 状態を `MembersClient` で復元、`packages/shared/src/admin/search.ts` に zod schema + helper + 定数を追加。
- `filter=published|hidden|deleted` を canonical 語彙、`/admin/members` 右ドロワーを canonical detail UI、`audit_log` を canonical audit table 名、role mutation / profile 直接編集を scope-out として固定。
- 固有教訓 `lessons-learned-06c-B-admin-members-2026-05.md`（L-06CB-001〜007）と artifact inventory `workflow-06c-B-admin-members-artifact-inventory.md` を新規追加。
- `docs/00-getting-started-manual/specs/07-edit-delete.md` の admin endpoint 表を `PATCH .../delete` から `POST .../delete` に補正。

## 苦戦箇所

- `docs-only / outputs_contract_only / remaining-only` ラベルを信用しすぎると、AC が runtime 挙動を要求している follow-up を未着手のまま close-out してしまう。Phase 12 review で AC を再走査し、必要なら同 wave で `implemented-local / implementation` に再分類してから skill を同期する。
- spec 側の `filter=active|hidden|deleted` / `{ items, total, page, pageSize }` / `/admin/members/[id]` 別 route / `:id` notation / plural `audit_logs` といった stale 表記が複数箇所に残っており、code 側 `published|hidden|deleted` / `{ total, members }` 互換 / drawer 詳細 / `:memberId` / 単数形 `audit_log` を canonical として全置換する必要があった。
- admin members の Phase 11 visual evidence は staging admin Google account + sanitized D1 fixture を要求するため 06c-B 単体では再現できず、08b admin Playwright E2E / 09a staging smoke に委譲することで placeholder screenshot を実測 PASS と誤認する事故を回避した。
- `apps/web` から D1 / API repository を直接参照しない不変条件 #5 を維持するため、Server Component は `fetchAdmin('/admin/members?...')` のみを使い、`MembersClient` 側で URL state / zod 復元 / SearchParams 同期を完結させる責務分離が必要だった。

## 検証

- `node .claude/skills/aiworkflow-requirements/scripts/validate-structure.js` PASS（warning 5 件は pre-existing なファイルサイズ超過のみ）
- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を再実行し、`indexes/topic-map.md` / `indexes/keywords.json` の drift がないことを確認する。
- `apps/api` Vitest（members.test.ts 14 件 + member-delete.test.ts 3 件）PASS、`mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` PASS（既存 string-literal warning 2 件のみ）。
- runtime visual evidence は 08b admin Playwright E2E / 09a staging smoke で実測する（本 wave では取得しない）。

## 同期対象

| target | path |
| --- | --- |
| SKILL changelog | `SKILL.md`（v2026.05.02-06c-B-admin-members 行） |
| quick-reference | `indexes/quick-reference.md`（§UBM-Hyogo Admin Members Follow-up 早見） |
| resource-map | `indexes/resource-map.md`（completed-tasks/06c-B-admin-members 行） |
| task-workflow-active | `references/task-workflow-active.md`（06c-B-admin-members 行） |
| api-endpoints | `references/api-endpoints.md`（GET /admin/members 行） |
| legacy register | `references/legacy-ordinal-family-register.md`（06c-B-admin-members 行） |
| lessons hub | `references/lessons-learned.md`（lessons-learned-06c-B-admin-members-2026-05.md エントリ追加） |
| manual spec | `docs/00-getting-started-manual/specs/07-edit-delete.md`（POST delete 行） |

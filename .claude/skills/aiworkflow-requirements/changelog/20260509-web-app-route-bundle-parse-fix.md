# 2026-05-09 web-app-route-bundle-parse-fix

- workflow root: `docs/30-workflows/web-app-route-bundle-parse-fix/`
- state: `implemented_local_runtime_pending / implementation / NON_VISUAL / PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`
- issue policy: 単独 task（Issue 紐付けなし）。CD migration / favicon / Turbopack 復帰は `unassigned-task-detection.md` で候補化済み（新規起票は不要）

## 同一 wave 同期

- `references/task-workflow-active.md` に active workflow 状態、user-gated runtime、evidence path、inventory / lessons へのポインタを追加
- `references/lessons-learned.md` の index 表に L-WBRB-001〜005 entry を追加
- `references/lessons-learned-web-app-route-bundle-parse-fix-2026-05.md` を追加（L-WBRB-001〜005）
- `references/workflow-web-app-route-bundle-parse-fix-artifact-inventory.md` を追加
- `indexes/quick-reference.md` / `indexes/resource-map.md` / `indexes/topic-map.md` / `indexes/keywords.json` を同期
- `LOGS/_legacy.md` にこの変更の 1 行 log を追加
- `SKILL.md` / `SKILL-changelog.md` に v2026.05.09 entry を反映
- `CLAUDE.md` `apps/web` env 不変条件に「production build は OpenNext Workers 互換のため `next build --webpack` を正本」を追記
- `docs/00-getting-started-manual/specs/00-overview.md` の `apps/web` 構成説明に `--webpack` 正本メモを追記

## 境界

- `apps/web/package.json` の production build を `NODE_ENV=production next build --webpack` に固定
- `scripts/patch-next-standalone-instrumentation.mjs` に webpack output 向け skip guard を追加（`existsSync` 不在時 explicit skip log + `exit(0)`）
- `apps/web/app/(admin)/admin/audit/audit-query.ts` を新設し `jstLocalToUtcIso` を sibling module へ抽出（App Router page module の named export 制約遵守）
- Phase 11 local evidence: typecheck / lint / build:cloudflare / `[project]/` grep / artifacts parity（`cmp -s` exit 0）
- Phase 12 strict 7 outputs（main / implementation-guide / documentation-changelog / unassigned-task-detection / skill-feedback-report / system-spec-update-summary / phase12-task-spec-compliance-check）を実体化
- Runtime staging / production deploy, smoke, tail evidence, commit / push / PR は user-gated（実行禁止）

## Phase 13 status

- 未実行（commit / push / PR は user 指示があるまで保留）

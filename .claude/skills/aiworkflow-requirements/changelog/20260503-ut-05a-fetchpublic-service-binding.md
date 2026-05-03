# 2026-05-03 UT-05A fetchPublic service-binding spec sync

## 変更概要

- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/` を `spec_created / implementation / VISUAL_ON_EXECUTION / runtime evidence pending_user_approval` として skill 正本へ同期。
- `apps/web/src/lib/fetch/public.ts` に `logTransport()` を追加し、`env.API_SERVICE.fetch(...)` 優先 + `PUBLIC_API_BASE_URL` HTTP fallback の二経路を `transport: 'service-binding' | 'http-fallback'` の構造化 console.log で出力する仕様を確立。
- `apps/web/src/lib/fetch/public.test.ts` を新規作成し、AC-1（service-binding 優先）/ HTTP fallback / logTransport 出力を `vi.mock` + `vi.stubGlobal` で検証。
- `apps/web/wrangler.toml` の staging `ubm-hyogo-api-staging` / production `ubm-hyogo-api` service binding と `apps/api/wrangler.toml` の Worker name を service-binding 正本として記録。
- 苦戦箇所 L-UT05A-FP-001〜005 を `references/lessons-fetch-service-binding-testing.md` に新規記録（500 行以内）。
- Issue #387 は CLOSED 維持、commit / push / PR / production deploy は user 明示指示後のみ。

## 苦戦箇所（要約）

- `getCloudflareContext()` mock は module closure + `beforeEach` reset でないとテスト間 leak が起きる（L-UT05A-FP-001）。
- service-binding テストでは `globalThis.fetch` も並行 mock し、双方向 call count を assert しないと fallback すり抜けを検知できない（L-UT05A-FP-002）。
- transport label は構造化 console.log で出力し、test の `vi.spyOn(console, 'log')` 観測と `bash scripts/cf.sh tail` の grep を同一契約で動かす（L-UT05A-FP-003）。
- HTTP fallback URL は `PUBLIC_API_BASE_URL` 経由だが、staging で同一 account の `*.workers.dev` loopback subrequest が 404 を返すため service-binding を一次経路にする必要がある（L-UT05A-FP-004）。
- 静的 PASS と runtime PASS を分離し、`runtime evidence pending_user_approval` 境界を堅持する（L-UT05A-FP-005）。

## 検証

- `node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` を実行して `indexes/topic-map.md` / `indexes/keywords.json` の drift 0 を確認する。
- 各 skill ファイルが 500 行以内であることを `wc -l` で確認。

## 同期対象

| target | path |
| --- | --- |
| SKILL changelog | `SKILL.md`（v2026.05.03-ut-05a-fetchpublic-service-binding-spec 行） |
| quick-reference | `indexes/quick-reference.md`（§UT-05A fetchPublic service-binding） |
| resource-map | `indexes/resource-map.md`（UT-05A fetchPublic service-binding 行） |
| task-workflow-active | `references/task-workflow-active.md`（UT-05A fetchPublic service-binding 行） |
| lessons hub | `references/lessons-learned.md`（lessons-fetch-service-binding-testing.md エントリ追加） |
| 新規 lessons | `references/lessons-fetch-service-binding-testing.md` |

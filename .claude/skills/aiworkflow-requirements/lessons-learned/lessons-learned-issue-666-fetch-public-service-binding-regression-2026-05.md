# Lessons Learned: Issue #666 fetch/public service binding priority regression (2026-05)

> Workflow root: `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/`
> Phase 12 出典: `outputs/phase-12/system-spec-update-summary.md`, `outputs/phase-12/implementation-guide.md`
> 反映日: 2026-05-14
> 関連先行: `lessons-learned-e2e-stage3b-server-component-mock-api-2026-05.md` L-E2EQU3B-001

このファイルは Issue #666 で fetch/public が production / staging でも HTTP fallback を優先してしまうリグレッションを修正した実装の苦戦箇所を残す。同様の「テスト都合の env 分岐が production 側に漏れる」問題に再遭遇したとき、根本原因と判定境界を即座に取り戻すための decision log。

---

## L-666-001: `CI=true` 単独を fallback trigger にしてはいけない

### What

`apps/web/src/lib/fetch/public.ts` の HTTP fallback 判定に `process.env.CI === "true"` を含めると、Cloudflare Workers の production / staging deploy（GitHub Actions 経由）でも `CI=true` が立っているため、本番でも service binding がスキップされ、`PUBLIC_API_BASE_URL` の HTTP 経由になってしまう。同一 account の workers.dev 間 fetch loopback で 404 / 503 を引く。

### Why

Stage 3b 実装当初は「CI 上で deterministic mock API に差し替えたい」要件だけを見て `CI=true` を許容条件にしていた。しかし `CI=true` は GitHub Actions の任意 job（build / deploy / Lighthouse / CodeQL）でも自動付与される env で、「Playwright を走らせている」ことの十分条件にならない。production deploy job でも `CI=true` のまま `wrangler deploy` が走るため、service binding 設定が `wrangler.toml` 上は正しくても、ランタイムで HTTP fallback が選択されて binding が機能しない状態になっていた。

### How to apply

- HTTP fallback を許可する判定は `NODE_ENV === "test"`（Vitest）または `PLAYWRIGHT_TEST === "1"`（Playwright webServer 経由でのみ立てる明示フラグ）に限定する。
- `CI=true` は **fallback trigger に絶対に入れない**。CI 上で意図的に立てたい場合は、`PLAYWRIGHT_TEST=1` のような目的特化 env を `apps/web/playwright.config.ts` の `webServer.env` で明示する。
- `apps/web/playwright.config.ts` の `webServer.env` に `PLAYWRIGHT_TEST: "1"` を必ず含める。これを忘れると Playwright E2E でも HTTP fallback が選ばれず service binding 経由になり、mock API に届かない。
- 判定ロジックは `isTestOrPlaywright()` という名前のヘルパに 1 箇所閉じ込め、`apps/web/src` 内で `process.env.CI` の直参照を増やさない（grep gate 対象）。

### Evidence

- `apps/web/src/lib/fetch/public.ts` L45-52 `isTestOrPlaywright()` / L54-59 `getServiceBinding()`
- `apps/web/src/lib/fetch/public.spec.ts` AC-R-01..03 + edge-1..3（NODE_ENV=test / PLAYWRIGHT_TEST=1 / production / CI 単独 全分岐）
- `apps/web/playwright.config.ts` `PLAYWRIGHT_TEST=1` 明示

---

## L-666-002: production / staging では `PUBLIC_API_BASE_URL` の存在を service binding スキップ条件にしてはいけない

### What

「`PUBLIC_API_BASE_URL` が設定されているなら HTTP fallback を使うべき」と読める素朴な実装にすると、production / staging で env override（運用緊急 hotfix で binding 経由を避けたいなど）の用途として `PUBLIC_API_BASE_URL` を立てた瞬間、service binding が完全に無効化される。同一 account の workers.dev に対する外向き fetch は loopback で 404 / 503 を返すため、production traffic が壊れる。

### Why

`PUBLIC_API_BASE_URL` は `wrangler.toml` の `[vars]` で local / staging / production すべてに値を持たせる運用になっており、「設定されている == fallback したい」という意味ではない。値の有無を fallback の根拠にすると、設定そのものが production を壊すスイッチになってしまう。ランタイム context（test / Playwright か否か）と env value（PUBLIC_API_BASE_URL の有無）は直交する concern なので、両方を AND 条件に組まないといけない。

### How to apply

- `getServiceBinding()` は `isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL` の **AND** で初めて undefined を返す。どちらか片方だけでは絶対に skip しない。
- production / staging では `PUBLIC_API_BASE_URL` の値があっても `API_SERVICE` binding を最優先する。これにより `wrangler.toml` の `[vars]` で全環境に同 key を置く運用が安全に維持できる。
- 「local `next dev` で binding 不在 → HTTP fallback」というケースは `getCloudflareContext()` が throw → `readEnv()` が `{}` を返し、`API_SERVICE` が undefined になる経路で自然に成立する。env value で分岐しなくてよい。

### Evidence

- `apps/web/src/lib/fetch/public.ts` L54-59（AND 条件）
- `apps/web/wrangler.toml` `[vars]` / `[env.staging.vars]` / `[env.production.vars]` の `PUBLIC_API_BASE_URL` 全環境定義

---

## L-666-003: drift 経路 ─ workflow を `completed-tasks/` に移動したら全 index 参照を同 wave で書き換える

### What

Phase 13 完了後にワークフロー dir を `docs/30-workflows/issue-666-fetch-public-service-binding-regression/` から `docs/30-workflows/completed-tasks/issue-666-fetch-public-service-binding-regression/` へ移動した際、`resource-map.md` / `quick-reference.md` / `task-workflow-active.md` / `workflow-issue-666-...artifact-inventory.md` / `changelog/20260514-issue666-...md` の 5 ファイルに残っていた旧 path（`docs/30-workflows/issue-666-fetch-...`）が drift として残った。同様に source unassigned-task ファイルも `unassigned-task/` から `completed-tasks/` に移動していたのに inventory / quick-reference / task-workflow-active が旧 path を指したままになっていた。

### Why

`completed-tasks/` への移動は workflow lifecycle の一部であり、task-specification-creator skill の `completed-tasks 移動` フェーズで実行される。しかし aiworkflow-requirements skill 側の index 同期（resource-map / quick-reference / artifact inventory / changelog / task-workflow-active）は別 wave で行われる慣習があり、移動とインデックス書き換えが時間的にズレるとリンク切れが残る。

### How to apply

- 「completed-tasks への移動」操作と「resource-map / quick-reference / artifact-inventory / changelog / task-workflow-active のパス書き換え」を **同一 wave で必ずセット実行**する（CONST_004 監査並列・編集直列の原則を保ちつつ、編集対象を取りこぼさない）。
- 対象 file 列を inventory に明示しておく（このファイル自体も inventory に追記すること）。
- 移動後の検証として `grep -r "docs/30-workflows/<旧 dir 名>" .claude/` が空になることを確認する。
- 完了タスク内のドキュメント自身（`docs/30-workflows/completed-tasks/<dir>/phase-*.md` / `artifacts.json` / `index.md`）が旧 path を指している分は意図的に保存（履歴）として扱い、書き換えない。

### Evidence

- 2026-05-14 修正前: `grep -rn "docs/30-workflows/issue-666-fetch" .claude/` で 8 件 hit
- 2026-05-14 修正後: skill 側 hit 0 件（completed-tasks 配下の workflow doc 自身の参照のみ残存・意図通り）

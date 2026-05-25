# Lessons learned — issue-880 `(public)` segment error / loading boundary (2026-05-24)

> 親 workflow: `docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/`
> 関連 SSOT: [lessons-learned-serial-06-form-response-binding-2026-05.md](./lessons-learned-serial-06-form-response-binding-2026-05.md), [phase12-strict-7-workflow-root-parity-gate.md](../../task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md)

---

## L-PUBERR-001: route-group 専用 boundary は production guard 付き smoke route で検証する

- **Why**: Next.js App Router の `error.tsx` / `loading.tsx` は parent boundary がフォールバックするため、`(public)` 専用 boundary を追加しても「実際に発火しているか」を runtime evidence で示せないと precondition drift が残る。ただし `throw new Error()` を含む page を `(public)` 配下に常設すると production でクローラに 500 が露出する。
- **How to apply**:
  - boundary smoke 用 route は `apps/web/app/(public)/error-boundary-smoke/page.tsx` のように **route-group 内に置く**（boundary 継承を実物で証明する）。
  - 1行目で `if (process.env.NODE_ENV === "production") { notFound(); }` を実行し、production では 404 に倒す。development / preview だけ throw する。
  - `export const dynamic = "force-dynamic"` を付与し ISR / SSG に巻き込まれない。
  - Playwright spec で `[data-route-group="public"]` と `[data-page="error"]` の **両方** が visible であることを assert し、parent root `error.tsx` ではなく `(public)/error.tsx` が描画されたことを区別する。
- **Evidence**:
  - `apps/web/app/(public)/error-boundary-smoke/page.tsx`
  - `apps/web/playwright/tests/public-error-boundary.spec.ts` line 19-26
  - `docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/outputs/phase-11/screenshots/public-error-boundary.png`
- **Related**: L-S06-001（parent-sub strict-7 集約）

## L-PUBERR-002: worktree 環境で Playwright `webServer.ready` がタイムアウトするときの回避手順

- **Why**: 本 worktree (`.worktrees/task-20260524-221856-wt-8`) では `playwright.config` の `webServer` ready wait が dev server 起動完了前にタイムアウトし、テスト実行へ移れなかった。worktree ごとに `node_modules` が独立する関係上、初回コンパイル時間が CI と worktree で大きく異なる。
- **How to apply**:
  - 別ターミナルで `mise exec -- pnpm --filter @ubm-hyogo/web dev` を先行起動し、`http://127.0.0.1:3000` の応答を `curl` で確認してから Playwright を流す。
  - Playwright 実行時は `PLAYWRIGHT_SKIP_WEB_SERVER=1` を付け、`webServer` ブロックを skip する。
  - evidence 出力先は `PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/<workflow>/outputs/phase-11/evidence` で明示し、workflow root へ直接落とす。
  - Playwright config 本体は改変しない（CI と worktree で挙動を分岐させない）。env override で吸収する。
- **Evidence**:
  - `docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/outputs/phase-12/implementation-guide.md` § Known limits / Verification commands
  - `docs/30-workflows/completed-tasks/issue-880-public-segment-error-loading-boundary/outputs/phase-11/evidence/playwright-report/results.json`
- **Related**: 同パターンが他 issue でも再発した場合、本ファイルへ追記し、root 原因（dev server 初回コンパイル時間）が解消したら本 lesson は obsolete としてマークする。

## L-PUBERR-003: structured logging の scope は route-group と 1:1 で揃える

- **Why**: 親 `apps/web/app/error.tsx` は scope なし、`(admin)/admin/error.tsx` は `scope: "admin"` で `logger.error` を呼ぶ。`(public)/error.tsx` を追加する際に scope を省略すると、Sentry / log aggregation 側で公開導線エラーと admin エラーが区別できなくなり、alert 設計の前提が崩れる。
- **How to apply**:
  - `(public)/error.tsx` は client component として `logger.error(error, { scope: "public" })` 相当のタグを付ける。
  - scope 名は `route-group` の正式名（`public` / `admin` / root は scope なし）に揃え、自由命名しない。
  - error UI 内のリンクは route-group の公開導線（`/members` / `/`）に限定し、admin / login 等のクロス導線を入れない。
- **Evidence**:
  - `apps/web/app/(public)/error.tsx`
  - `apps/web/playwright/tests/public-error-boundary.spec.ts` line 29-36（公開導線 link の存在 assertion）
- **Related**: admin 側 boundary lesson（runtime smoke gate / Sentry alert IaC）と整合させる場合は `lessons-learned-issue-863-*` / `lessons-learned-issue-864-*` 参照。

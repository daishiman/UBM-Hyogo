# changelog fragment: ut-05a-followup-google-oauth-completion sync

- date: 2026-05-01
- worktree: task-20260430-181640-wt-5 / branch: feat/wt-5
- task: `docs/30-workflows/ut-05a-followup-google-oauth-completion/`
- wave: 5 / followup / implementation / VISUAL（privacy/terms 公開ページ追加）

## 同期内容

- `apps/web/middleware.ts`: Auth.js 二段防御 middleware（cookie 検査 / JWT verify only / D1 不接触 / `/login` redirect with gate param）
- `apps/web/src/lib/auth.ts`: signIn callback で `/auth/session-resolve` を service-binding or fetch 経由で呼び D1 lookup → JWT claims に memberId/isAdmin。env 層化（processEnv → globalEnv → cloudflareEnv → requestEnv）。fail-closed 設計
- `apps/web/src/lib/fetch/public.ts`: service-binding (`env.API_SERVICE.fetch`) を主、`PUBLIC_API_BASE_URL` 外向き fetch を local fallback に統一（同一アカウント workers.dev loopback 404 回避）
- `apps/web/wrangler.toml` / `apps/api/wrangler.toml`: staging/production の vars / `[[env.*.services]]` binding = `API_SERVICE` 追加、cron trigger 整理（schema sync 1日1回 / form response sync 15 分間隔）
- `apps/web/app/global-error.tsx`: 新規 client component。Next 16 + React 19 prerender 失敗の部分緩和試行（解消未達、L-05A-009 / build-prerender-failure-001 で追跡）
- `apps/web/app/privacy/page.tsx` / `apps/web/app/terms/page.tsx`: 暫定文面で実装（Google OAuth verification consent screen URL 要件対応 / 法務レビュー pending）
- `scripts/patch-open-next-worker.mjs`: 新規 post-build patch。OpenNext 出力の `.open-next/worker.js` に `buildAuthEnv()` を注入し globalThis + request header (x-ubm-*) の二重経路で Cloudflare env を edge runtime に bridge
- `packages/shared/src/utils/consent.ts` (+test): legacy key mapping / nested textAnswers / 真偽値・数値 normalization 強化、`ConsentStatus = "consented" | "declined" | "unknown"` 型化
- `packages/integrations/google/src/forms/auth.ts`: 環境別 credentials 解決の整理
- `docs/00-getting-started-manual/specs/02-auth.md` / `13-mvp-auth.md`: 05a OAuth flow / internal endpoint / session JWT 最小化策の正本反映
- `references/environment-variables.md`: `AUTH_SECRET` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `INTERNAL_AUTH_SECRET` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` を統合表で追加（500 行制約維持）
- `references/auth-google-oauth-cf-integration.md`: 新規ハブ reference（middleware 二段防御 / service-binding / session-resolve / OpenNext patch / env 層化 / 落とし穴チェックリスト）
- `references/lessons-learned-05a-authjs-admin-gate-2026-04.md`: L-05A-007〜011 の 5 教訓を末尾追記（OpenNext bridge / loopback 404 / prerender failure / privacy-terms 上流依存 / env 層化）
- `references/legacy-ordinal-family-register.md`: 05a path drift（`unassigned-task/05a-authjs-google-oauth-admin-gate/` → `ut-05a-followup-google-oauth-completion/`）+ 05a ordinal alias family 6 件登録
- `references/task-workflow-active.md`: 05a Phase 1-12 完了状態の記録（既存）
- `indexes/topic-map.md`: 機械生成インデックスを `pnpm indexes:rebuild` で再生成（aiworkflow scripts/generate-index.js が canonical 化）
- `docs/30-workflows/unassigned-task/task-05a-*-001.md` (6 件): 「苦戦箇所【記入必須】」「リスクと対策」「検証方法」3 セクションを末尾追記
- `changelog/`（本ファイル）: ut-05a-followup-google-oauth-completion close-out entry を追加

## 検証

- 仕様根拠: `docs/30-workflows/ut-05a-followup-google-oauth-completion/outputs/phase-12/main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `phase12-task-spec-compliance-check.md` (`PASS_WITH_EXTERNAL_PENDING`)
- 実装: 上記同期内容に列挙
- 制約: 各 reference 500 行以内維持（environment-variables: 500 行、lessons-learned-05a: 245 行、auth-google-oauth-cf-integration: 178 行、legacy-ordinal-family-register: 330 行）
- 残存 blocker: L-05A-009 build prerender failure（task-05a-build-prerender-failure-001 で追跡、main HEAD でも再現する pre-existing）

## 不変条件 trace

- 不変条件 #5（D1 直接アクセスは apps/api に閉じる）: middleware.ts は JWT verify のみ・D1 不接触で遵守、session-resolve は internal endpoint 経由のみ
- 不変条件 #2（consent キー統一）: consent.ts の legacy key mapping で `publicConsent` / `rulesConsent` に正規化
- 不変条件 #4（admin-managed data 分離）: session-resolve 経由で memberId/isAdmin のみ JWT に積み、admin-managed フィールドは別経路

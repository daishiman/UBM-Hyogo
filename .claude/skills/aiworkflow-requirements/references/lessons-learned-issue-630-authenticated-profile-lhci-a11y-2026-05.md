# Lessons Learned — Issue #630 authenticated `/profile` LHCI a11y（2026-05-13）

## 概要

認証済み `/profile` ルートに対する Lighthouse CI a11y 計測を `apps/web/lhci/lhci-auth.cjs`（Puppeteer storageState 注入）と `apps/web/scripts/lhci-profile-mock-api.ts`（決定論的 mock backend）で実装。`packages/shared/src/auth.ts` の `signSessionJwt()` で発行した NextAuth 互換 JWT を `authjs.session-token` cookie として注入し、`lighthouserc.authenticated.json` と `.github/workflows/lighthouse.yml` の authenticated step で CI gate 化。Issue #630 は本実装着手前に既に CLOSED 済みであり、PR 文言は `Refs #630` を正本とする。本 lessons は同種の「auth-gated CI gate / NON_VISUAL / implemented-local-runtime-pending」ワークフローを将来短時間で再現するための知見集。

## 苦戦箇所と知見

### L-I630-001: CLOSED issue に対する PR 参照ポリシー drift

**苦戦**: Issue #630 は実装着手前 `2026-05-12T06:26:21Z` に既に CLOSED されており、`Closes #630` / `Fixes #630` の close keyword を PR に書くと CLOSED issue の自動再オープン or 警告挙動が発生する。初期ドラフトで close keyword を使用してしまいやり直しが発生。

**知見**: 着手時点で issue が CLOSED の場合、PR 文言は **必ず `Refs #630`** とし、close keyword を使わない。task-workflow-active.md / changelog / Phase 12 system-spec-update-summary.md の sync 表でも `refsPolicy: "Refs #630"` を明示記録する。

**How to apply**: 同種 issue を扱う場合は Phase 1 で `gh issue view <number> --json state` の取得を必須とし、`state == CLOSED` なら refsPolicy を `Refs` に固定する。

### L-I630-002: `signSessionJwt` の API shape を spec から推測しない

**苦戦**: Phase 4 仕様書の擬似コードに `signSessionJwt({ subject, email, expSeconds })` のような署名例を書いてしまい、実際の `packages/shared/src/auth.ts` の export とパラメータ名が一致せず Phase 7 で実装手戻り。

**知見**: 共有パッケージ（`packages/shared/`）の既存 API を呼び出す Phase 4/7 では、**spec への擬似コード記載前に必ず実装ファイルを Read** し、export 名・引数 shape・戻り値型を正本として転記する。

**How to apply**: task-specification-creator の Phase 4 / Phase 7 出力前 chk として、`packages/shared/src/<api>.ts` を Read した evidence を Phase 11 `runtime-evidence` に記録する。

### L-I630-003: `tsx` などのランタイム依存を target package 単位で検証する

**苦戦**: mock API 起動を `pnpm --filter @ubm-hyogo/web exec tsx scripts/lhci-profile-mock-api.ts` で実行する想定だったが、`apps/web/package.json` に `tsx` が devDependencies に無く LHCI step が落ちた。リポジトリ root には存在したため見落とした。

**知見**: monorepo の filter exec で実行する CLI（`tsx` / `vitest` / `wrangler` 等）は、**target package の `package.json` を必ず確認**する。root devDependencies は filter exec のスコープに入らない。

**How to apply**: Phase 7 仕様書の「依存」節に `cat apps/<app>/package.json | jq '.devDependencies'` で確認する手順を埋め込む。

### L-I630-004: LHCI `puppeteerScript` / `outputDir` の cwd 起点ずれ

**苦戦**: `pnpm --filter @ubm-hyogo/web exec lhci collect` で実行すると LHCI の cwd は `apps/web/` になるが、`lighthouserc.authenticated.json` を repo root に置いて `puppeteerScript: "apps/web/lhci/lhci-auth.cjs"` と書いたため、解決時に `apps/web/apps/web/lhci/...` を探して FileNotFound。`storageState` 出力先や `outputDir` も同様に二重 prefix。

**知見**: LHCI 設定の path は **実行 cwd（filter exec の場合は対象 package dir）からの相対** に統一する。設定ファイルを repo root に置く場合でも、path 記載は target cwd 基準。同 wave で `puppeteerScript` / `outputDir` / `storageState` 出力先の cwd 整合を grep で確認する。

**How to apply**: LHCI / Playwright / Vitest など cwd 依存ツールを `pnpm --filter ... exec` で起動する場合、Phase 7 仕様で「実行 cwd = `<target-pkg-dir>`」を明示し、すべての relative path を target cwd 基準で書く。

### L-I630-005: Server Component の LHCI 計測には deterministic backend が必須

**苦戦**: `/profile` は Next.js Server Component で `fetch('/api/me/profile')` を SSR 時に呼ぶため、Puppeteer の browser cookie 注入だけでは server-side fetch の auth context を満たせず 401 / fetch エラーで a11y 計測対象 DOM が描画されない。当初は cookie 注入のみで計測しようとして空ページが計測される事象が発生。

**知見**: LHCI で Server Component ページを計測する場合、**browser cookie 注入と server-side fetch の両方** を満たす必要がある。決定論的 mock backend（本件では `lhci-profile-mock-api.ts` を `127.0.0.1:8787` で起動、`NEXT_PUBLIC_API_BASE_URL` を mock に向ける）を同 wave で用意し、cookie の JWT subject と mock 応答の member id を一致させる。

**How to apply**: Server Component / RSC ルートを LHCI / Playwright で計測する task の Phase 2 では、「browser cookie 注入のみで成立するか / server-side fetch も mock が必要か」を必ず判定し、後者なら mock backend artifact を Phase 7 成果物として独立 task 化する。

## 運用知見

| ID | 教訓 |
| --- | --- |
| OP-I630-1 | `implemented-local-runtime-pending` ワークフロー（local 実装完了 / GitHub Secret 注入・CI artifact 取得は user-gated）は Phase 11 evidence を `runtime_pending` で確定し、Phase 12 close-out を妨げない。CI runtime artifact は PR merge 後に GitHub Actions が生成する分離タイムライン |
| OP-I630-2 | LHCI authenticated step の cookie TTL は 60 秒で十分（LHCI collect は数十秒）。長すぎると test session JWT が他テストに混入するリスク。`exp` は短く固定 |
| OP-I630-3 | 認証 fixture のテストメンバー ID（`e2e-lhci-member-0001`）は `apps/web/playwright/fixtures/auth.ts` と `apps/web/scripts/lhci-profile-mock-api.ts` で共有し、Playwright / LHCI 間で auth contract を再利用する |
| OP-I630-4 | a11y minScore は `0.90`、その他 category（performance / best-practices / seo）は `0.80-0.90`。authenticated route の初期実装では a11y を最優先 gate とし、performance は smoke 取得後に閾値調整 |

## 参照

- workflow root: `docs/30-workflows/issue-630-authenticated-profile-lhci-a11y/`
- Phase 12 outputs: `outputs/phase-12/main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `skill-feedback-report.md`
- changelog: `.claude/skills/aiworkflow-requirements/changelog/20260513-issue-630-authenticated-profile-lhci-a11y.md`
- spec 更新: `docs/00-getting-started-manual/specs/02-auth.md` LHCI test session JWT 節
- backlog: `docs/30-workflows/e2e-quality-uplift/backlog.md` EXT-X1 entry（closed-by-issue #630 / implemented-local-runtime-pending successor）

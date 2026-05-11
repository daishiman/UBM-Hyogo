# Lessons Learned: task-17 admin-schema-conflicts-audit (2026-05)

> Workflow: `docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/`
> Date: 2026-05-10
> State: `implemented-local / implementation / VISUAL_ON_EXECUTION / local_visual_evidence_pass`

## L-TASK17-001: Server Component fetch は browser route() で mock できない

`apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx` は Server Component で `apps/web/src/lib/admin/server-fetch.ts` 経由 D1/API を fetch する。Phase 11 evidence 取得時、Playwright `page.route()` で `/api/admin/*` を intercept しても server-side fetch には届かず、screenshot が空 / loading 状態になる。task-17 では `PLAYWRIGHT_TASK17_ADMIN_FIXTURE` 環境変数で gate した server-side fixture branch を `server-fetch.ts` に追加して解決した（`NODE_ENV !== "production"` でのみ active）。

- **Why:** Server Component の fetch は Node ランタイム側で完結するため、ブラウザ層の network intercept は到達しない。fixture を server 側 helper に注入する以外に visual evidence を確定的に得る経路がない。
- **How to apply:** Server Component 主体の admin 画面で Phase 11 visual evidence を取る場合は、`server-fetch.ts` 等の SSR helper に env-gated fixture branch を実装する（production では絶対に branch しないこと、env 変数名は task ID prefix で衝突回避）。Phase 4 設計時に「fetch 起点が SSR か CSR か」を分類し、SSR なら fixture 戦略を明記する。

## L-TASK17-002: artifacts.json は root と outputs の二元化が drift 源

`docs/30-workflows/completed-tasks/task-17-admin-schema-conflicts-audit/artifacts.json` と `outputs/artifacts.json` を並走管理しており、片側だけ更新すると Phase 12 parity check (`cmp -s`) で fail する。task-17 では手動 mirror で揃えたが、根本解決は `task-specification-creator/scripts/generate-index.js` 側で単一 source 化する必要がある。

- **Why:** Phase 12 strict 7 outputs gate は parity を要求するが、責務分離の一環で root/outputs を分けたために drift の構造的余地が残った。
- **How to apply:** 新 task で artifacts.json を扱う際は片方だけを source of truth として扱い、もう片方は generate-index.js で生成する想定で進める。自動化未達のうちは手動 mirror 後に `cmp -s` を必ず通す。延期分は既存 unassigned-task `TASK-SPEC-PHASE-FILENAME-DETECTION-001` に集約し新規 followup は起票しない。

## L-TASK17-003: `new` 前提で task spec を起こす前に worktree inventory を取る

task-17 は当初「admin schema/conflicts/audit 画面を新規実装」前提で起票されていたが、worktree 上に既に `apps/web/app/(admin)/admin/{schema,identity-conflicts,audit}/page.tsx` と対応 components / api が実装済みであった。Phase 1 の inventory で `existing-*-hardening` に再分類して衝突を回避した。

- **Why:** Phase 1 起票時に既存 route / component を確認せず `implementation_mode: new` を default にすると、Phase 4 以降で stale path（`apps/web/src/app` / `apps/web/src/features/admin`）が混入し、build / typecheck が壊れる。
- **How to apply:** Phase 1 で `apps/web/app/<route>` / `apps/web/src/components/**` / `apps/web/src/lib/**` を grep し、ヒットがあれば `existing-*-hardening` または `existing-*-alignment` に再分類する。`task-specification-creator/references/phase-template-phase1.md` の inventory gate に従うこと。production canonical の app router は `apps/web/app/`（`apps/web/src/app/` ではない）。

## L-TASK17-004: Phase 11 evidence の AUTH_SECRET override は fixture cookie を無効化する

`apps/web/playwright.config.ts` で identity-conflicts evidence-only に `AUTH_SECRET` を上書きしていたが、task-17 fixture が依存する admin session cookie が別 secret で署名されており、SSR fetch 時に session が解決できず admin ページが redirect で消える状態を引き起こした。task-17 では override を撤去して解決した。

- **Why:** `AUTH_SECRET` は Auth.js の cookie 署名鍵で、test 内で per-test override すると同 worker の他 fixture cookie が一斉に invalid 化する。evidence 用と他 admin test で secret が分裂すると相互に壊し合う。
- **How to apply:** Playwright config レベルで `AUTH_SECRET` を上書きしないこと。test 単位での secret 切替が必要な場合は worker 分離 (`fullyParallel + project`) を検討する。session 依存 evidence は単一 secret 前提で設計する。

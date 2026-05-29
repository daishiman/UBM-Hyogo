# Phase 11: Evidence (証跡) 取得仕様

## 0. メタ情報

| key | value |
|---|---|
| workflow root | `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/` |
| taskType | `implementation` |
| visualEvidence | `VISUAL_ON_EXECUTION` |
| evidence canonical path | `outputs/phase-11/evidence/` および `outputs/phase-11/screenshots/` |
| 状態 | `local_visual_evidence_captured` |
| 関連 reference | `.claude/skills/task-specification-creator/references/phase-11-screenshot-guide.md` |

## 1. 目的

(A) `/admin/identity-conflicts` プロトタイプ整合 UI 改修 + (B) staging `ADMIN_FETCH_404` の修正完了後、AC を客観的に検証する evidence を tracked-commit する。

evidence 2 カテゴリ:

- **non-visual evidence**: typecheck / lint / vitest / build / grep gate (PII / D1 / legacy hook) / contract spec / playwright admin spec / safe-server-fetch warn vitest
- **visual evidence**: Playwright で local 取得する screenshot 8 枚以上 (空状態 + データあり + merge 二段階 + dismiss modal + mobile)

VISUAL_ON_EXECUTION 規範に従い:
- **local screenshot 8 枚以上を本 Phase 11 で取得・tracked-commit**
- **staging visual smoke は user-gated** (Phase 13 / FU-AIDC-003)

## 2. 取得手順

### 2.1 共通前提

```bash
mise exec -- pnpm install --force
WF=docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix
mkdir -p "$WF/outputs/phase-11/evidence"
mkdir -p "$WF/outputs/phase-11/screenshots"
```

### 2.2 non-visual evidence の取得

```bash
mise exec -- pnpm typecheck 2>&1 | tee "$WF/outputs/phase-11/evidence/typecheck.log"
mise exec -- pnpm lint 2>&1 | tee "$WF/outputs/phase-11/evidence/lint.log"
mise exec -- pnpm --filter @ubm-hyogo/web test 2>&1 | tee "$WF/outputs/phase-11/evidence/test-web.log"
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/identity-conflicts.contract.spec.ts 2>&1 \
  | tee "$WF/outputs/phase-11/evidence/contract-spec.log"
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee "$WF/outputs/phase-11/evidence/build.log"

# Phase 9 §7: PII / D1 / legacy hook grep
rg -n '@[a-z0-9.-]+\.[a-z]{2,}' apps/web/app/\(admin\)/admin/identity-conflicts apps/web/src/components/admin/IdentityConflictRow.tsx \
  | tee "$WF/outputs/phase-11/evidence/pii-grep.log" || true
rg -n 'D1Database|env\.DB\b' apps/web/app/\(admin\)/admin/identity-conflicts \
  | tee "$WF/outputs/phase-11/evidence/d1-grep.log" || true
rg -n 'from "@/lib/useAdminMutation"' apps/web/src/components/admin/IdentityConflictRow.tsx \
  | tee "$WF/outputs/phase-11/evidence/legacy-hook-grep.log" || true

# Phase 8 §6: safe-server-fetch warn vitest
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/admin/safe-server-fetch.spec.ts 2>&1 \
  | tee "$WF/outputs/phase-11/evidence/safe-server-fetch-warn.log"
```

> `.log` が `.gitignore` で除外される場合は `.txt` に rename する。

### 2.3 visual evidence の取得

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev  # 別ターミナル
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_EVIDENCE_DIR=../../$WF/outputs/phase-11/evidence \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium
```

撮影対象 (最低 8 枚):

| # | state | URL / 操作 | viewport |
|---|-------|-----------|----------|
| 1 | empty list (desktop) | `/admin/identity-conflicts` (mock 空配列) | 1440x900 |
| 2 | empty list (mobile) | 同上 | 375x812 |
| 3 | non-empty list (desktop) | 同上 (mock 3 候補) | 1440x900 |
| 4 | non-empty list (tablet) | 同上 | 768x1024 |
| 5 | merge 1st confirm | merge ボタン押下後 | 1440x900 |
| 6 | merge 2nd confirm | confirm modal | 1440x900 |
| 7 | dismiss modal | dismiss ボタン押下後 | 1440x900 |
| 8 | error state (ADMIN_FETCH_500) | mock 500 | 1440x900 |

撮影後、生成 PNG は `outputs/phase-11/screenshots/` 配下に保存。

### 2.4 staging smoke (user-gated)

```bash
# user 明示承認後のみ実行
curl -i https://ubm-hyogo-web-staging.daishimanju.workers.dev/admin/identity-conflicts \
  | tee "$WF/outputs/phase-11/evidence/staging-curl.txt"
# 期待: 200 (admin cookie) / 302 → /login (cookie 無し)。404 禁止
```

staging 認証後 screenshot は user 操作で取得し、Phase 13 後の FU-AIDC-003 unassigned task で扱う。

## 3. provenance

| 種別 | provenance | 補足 |
|---|---|---|
| typecheck.log 〜 build.log | local `mise exec -- pnpm` | Node 24.15.0 / pnpm 10.33.2 |
| *-grep.log | local `rg` | Phase 9 §7 と等価判定 |
| contract-spec.log | local vitest (api d1 lane) | `vitest.d1.config.ts` 経由 |
| safe-server-fetch-warn.log | local vitest | Sentry mock で warn 発火確認 |
| screenshots/*.png | local Playwright (chromium) | staging fresh evidence は user-gated |
| staging-curl.txt | user 操作 | 認証 cookie 含めない (anonymous redirect 確認のみ) |

## 4. Phase 11 evidence file inventory

| Classification | Path | Status |
| --- | --- | --- |
| local validation summary | outputs/phase-11/evidence/local-validation-summary.txt | present |
| typecheck log | outputs/phase-11/evidence/typecheck.txt | present (exit 0) |
| lint log | outputs/phase-11/evidence/lint.txt | present (exit 0) |
| web vitest log (IdentityConflictRow filter) | outputs/phase-11/evidence/test-web-identity-conflict-row.txt | present (1154/1155 PASS) |
| api contract spec log | outputs/phase-11/evidence/contract-spec.txt | present (414/414 PASS) |
| build log | outputs/phase-11/evidence/build.log | pending (Phase 13 verify-pr-ready.sh で取得) |
| PII grep log | outputs/phase-11/evidence/pii-grep.txt | present (0 hits) |
| D1 grep log | outputs/phase-11/evidence/d1-grep.txt | present (0 hits) |
| legacy hook grep log | outputs/phase-11/evidence/legacy-hook-grep.txt | present (0 hits) |
| safe-server-fetch warn vitest log | outputs/phase-11/evidence/safe-server-fetch-warn.txt | present (1154/1155 PASS) |
| screenshot (empty desktop) | outputs/phase-11/screenshots/identity-conflicts-empty-desktop.png | pending (user-gated — Playwright dev server 必須) |
| screenshot (empty mobile) | outputs/phase-11/screenshots/identity-conflicts-empty-mobile.png | pending (user-gated) |
| screenshot (list desktop) | outputs/phase-11/screenshots/identity-conflicts-list-desktop.png | pending (user-gated) |
| screenshot (list tablet) | outputs/phase-11/screenshots/identity-conflicts-list-tablet.png | pending (user-gated) |
| screenshot (merge confirm 1) | outputs/phase-11/screenshots/identity-conflicts-merge-confirm-1.png | pending (user-gated) |
| screenshot (merge confirm 2) | outputs/phase-11/screenshots/identity-conflicts-merge-confirm-2.png | pending (user-gated) |
| screenshot (dismiss modal) | outputs/phase-11/screenshots/identity-conflicts-dismiss-modal.png | pending (user-gated) |
| screenshot (error 500) | outputs/phase-11/screenshots/identity-conflicts-error-500.png | pending (user-gated) |
| staging curl evidence | outputs/phase-11/evidence/staging-curl.txt | user-gated (Phase 13) |

## 5. 受け入れ判定との対応

| AC | 対応 evidence |
|---|---|
| AC-1 (AdminPageHeader 採用) | screenshots/identity-conflicts-list-desktop.png |
| AC-2 (primitive 整合 / Tailwind 直書き 0) | grep-gate.log + screenshots |
| AC-3 (empty / error 表示) | empty-desktop.png / error-500.png |
| AC-4 (merge 二段階) | merge-confirm-1.png / merge-confirm-2.png |
| AC-5 (dismiss modal) | dismiss-modal.png |
| AC-6 (mobile responsive) | empty-mobile.png |
| AC-7 (B 系 404 修復) | staging-curl.txt (user-gated) + safe-server-fetch-warn.log |
| AC-8 (PII redaction) | pii-grep.log |
| AC-9 (D1 直接アクセス 0) | d1-grep.log |
| AC-10 (admin hook 規約) | legacy-hook-grep.log |
| AC-11 (typecheck / lint / build / contract) | local-validation-summary.txt |
| AC-12 (verify-pr-ready.sh) | Phase 13 で取得 |

## 6. 落とし穴と回避策

| 落とし穴 | 回避策 |
|---|---|
| `.log` 拡張子が `.gitignore` で除外されて compliance check fail | commit 前に `git check-ignore -v` 確認、必要なら `.txt` に rename |
| Server Component の SSR fetch を Playwright `page.route()` で intercept できない | identity-conflicts は Server Component。`INTERNAL_API_BASE_URL` を Playwright fixture で stub server (`localhost:8788`) に向ける。または fetch を Server 側 mock module に差し替える |
| dev overlay (Next dev tools portal) が screenshot に写り込む | spec 内で `nextjs-portal` selector を `display:none` 化 |
| visual baseline (Linux) が macOS local screenshot と一致しない | local screenshot は evidence 用、CI baseline は Linux bot で生成する (Phase 10 §4 参照) |
| Playwright が `data-state` を待たずに撮ってしまう | merge / dismiss の confirm modal は `await expect(modal).toBeVisible()` 後に screenshot |
| staging curl で `404` が返る場合の hypothesis 切り分け | curl レスポンスヘッダ (`cf-ray` / `x-served-by` / `set-cookie`) を full log で取得し H1-H5 仮説と照合 |

## 7. Phase 11 完了条件

- [ ] §4 inventory 表の screenshot 8 件が `Status=present`
- [ ] non-visual evidence (local validation summary) が tracked commit 対象に含まれる
- [ ] AC-1〜AC-12 の evidence trail が §5 表で full-coverage (AC-7 と AC-12 は user-gated boundary であることを明示)
- [ ] Phase 12 compliance check のセクション 1 / 4 へ本 inventory を転記済み
- [ ] staging curl / 認証後 staging screenshot は **user-gated** として未取得のまま `pending_user_approval` 表記

# Implementation Guide (Phase 12 strict 7)

実装の正本は **`outputs/phase-4/phase-4.md`** を参照すること。本ファイルは PR 本文 / レビュー entry の集約ビュー (CONST_005 必須 5 項目: 背景 / 要約 / 実装ステップ / 検証コマンド / 既知制限 を充足)。

## 1. 背景

- (A) `/admin/identity-conflicts` は他 admin route と異なり `AdminPageHeader` を未採用で Tailwind 直書き構造 (`apps/web/app/(admin)/admin/identity-conflicts/page.tsx` 71 行)。他 admin ページは prototype 整合済 (AdminMembersPage / AdminTagsPage パターン)。
- (B) staging で `/admin/identity-conflicts` が `ADMIN_FETCH_404` を返す事象が観測された。API route (`apps/api/src/routes/admin/identity-conflicts.ts`) は実装済で `apps/api/src/index.ts:283` で mount 済。404 原因は H1〜H5 の仮説いずれかに帰着する想定 (Phase 4 / 7 参照)。

## 2. 変更スコープ一行サマリー

(A) UI を `AdminMembersPage` 系 primitive (page-head / eyebrow / card / table or list) に整合させつつ既存 e2e / contract spec を破壊せず維持し、(B) staging 404 を H1-H5 仮説検証で切り分けて修復する。

## 3. ファイル変更マップ (Phase 4 §1 から転記)

### A 系 (UI 整合)
- 編集: `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` (AdminPageHeader 採用 + primitive へ置換)
- 編集 (必要時): `apps/web/src/components/admin/IdentityConflictRow.tsx` (token 直書きが残れば置換)
- 編集: `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` (新構造に合わせて selector 更新)
- 編集: visual baseline 3 枚 (mobile / tablet / desktop Linux)

### B 系 (404 修復)
- 修正対象は H1〜H5 のうち再現した仮説に応じて確定 (Phase 4 §B の判断フロー参照):
  - H1 (build 未デプロイ) → `apps/web/wrangler.toml` / deploy pipeline (要 user 判断)
  - H2 (`INTERNAL_API_BASE_URL` mismatch) → `apps/web/wrangler.toml` `[env.staging.vars]` 修正
  - H3 (D1 migration 未適用) → `bash scripts/cf.sh d1 migrations apply ubm-hyogo-db-staging --env staging`
  - H4 (admin auth 401→404 化) → middleware / `safe-server-fetch.ts` 修正
  - H5 (proxy path strip) → proxy 実装の path 正規化
- 観測性 (Phase 8): `apps/web/src/lib/admin/safe-server-fetch.ts` に `admin_fetch_404` warn を追加
- spec: `apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts` (warn 発火検証)

### docs / skill (same-wave)
- `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/**` (Phase 1-13 + evidence)
- `docs/30-workflows/LOGS.md` (1 行追加)
- `.claude/skills/aiworkflow-requirements/**` (resource-map / quick-reference / task-workflow-active / SKILL-changelog / artifact-inventory)
- `docs/00-getting-started-manual/specs/` への影響有無は `system-spec-update-summary.md` を参照

## 4. 実装ステップ

1. Phase 4 §B の H1-H5 切り分けフローを staging tail で実行し原因 hypothesis を確定する
2. (B) を最小修正で修復 (cf.sh / wrangler.toml / safe-server-fetch のいずれか)
3. `safe-server-fetch.ts` に `admin_fetch_404` warn (Phase 8 §1) を追加 + 単体 spec 更新
4. (A) `page.tsx` を `AdminPageHeader` + primitive に書き換え (Tailwind 直書き 0 件化)
5. e2e spec の selector を新構造に合わせる
6. Phase 11 §2.2 / §2.3 の evidence を取得 (local validation summary + screenshot 8 枚)
7. visual baseline 3 枚を CI bot で regenerate (Phase 10 §4)
8. same-wave skill sync を実施し indexes:rebuild で drift 0 を確認
9. Phase 13 §2 の PR 前検証コマンドをすべて exit 0 化
10. PR 作成 (base=dev) → CI green → user 承認 → merge

## 5. ローカル DoD コマンド (CONST_005 検証コマンド)

```bash
mise exec -- pnpm install --force
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm --filter @ubm-hyogo/api test apps/api/src/routes/admin/identity-conflicts.contract.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web build

# grep gate (Phase 9 §7)
rg -n '@[a-z0-9.-]+\.[a-z]{2,}' apps/web/app/\(admin\)/admin/identity-conflicts apps/web/src/components/admin/IdentityConflictRow.tsx
rg -n 'D1Database|env\.DB\b' apps/web/app/\(admin\)/admin/identity-conflicts
rg -n 'from "@/lib/useAdminMutation"' apps/web/src/components/admin/IdentityConflictRow.tsx

# Playwright (local screenshot evidence)
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/outputs/phase-11/evidence \
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/admin-identity-conflicts.spec.ts --project=desktop-chromium

bash scripts/verify-pr-ready.sh
```

全コマンド exit 0 で実装 DoD クリア。

## 6. AC summary

| AC | 内容 | evidence |
|----|------|---------|
| AC-1 | AdminPageHeader + eyebrow / h-page 採用 | screenshots/identity-conflicts-list-desktop.png |
| AC-2 | Tailwind 直書き 0 / primitive 整合 | grep-gate + screenshots |
| AC-3 | empty / error UI が AdminSectionErrorClient + EmptyState で表現 | empty-desktop / error-500 |
| AC-4 | merge 二段階 confirm が既存挙動を維持 | merge-confirm-1 / merge-confirm-2 |
| AC-5 | dismiss modal が既存挙動を維持 | dismiss-modal |
| AC-6 | mobile responsive | empty-mobile |
| AC-7 | (B) staging 404 修復 | staging-curl.txt (user-gated) + safe-server-fetch-warn.log |
| AC-8 | PII redaction (responseEmail raw 0 件) | pii-grep.log |
| AC-9 | D1 直接アクセス 0 件 (不変条件 #5) | d1-grep.log |
| AC-10 | legacy useAdminMutation 不使用 (不変条件 #10) | legacy-hook-grep.log |
| AC-11 | local validation 全 green | local-validation-summary.txt |
| AC-12 | `verify-pr-ready.sh` exit 0 | Phase 13 user-gated |

## 7. 既知制限 (CONST_005 既知制限)

- staging curl + 認証後 staging screenshot は **user-gated** であり本サイクル Phase 11 では取得しない (Phase 11 §2.4)
- visual baseline は Linux 環境 (CI bot) でのみ生成可能。macOS local screenshot は evidence 用に独立保存する
- B 系 H1 (build 未デプロイ) が真因の場合、コード変更は 0 で deploy pipeline 修復のみとなる。その場合は本 workflow の AC-7 evidence は deploy 再実行ログとなり、コード diff は (A) のみ
- merge / dismiss の現行 UX (二段階 confirm + modal) は本サイクルでは変更しない。改善は FU-AIDC-002 に分離

## 8. 入口

- 実装着手者: Phase 4 → Phase 5 → Phase 6 → Phase 11
- レビュー者: 本ファイル → `phase12-task-spec-compliance-check.md` → Phase 11 evidence inventory
- PR 作成者: Phase 13

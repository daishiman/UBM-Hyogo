---
workflow_id: issue-901-authenticated-profile-admin-staging-visual
phase: 12
task: implementation-guide
status: present
---

# Implementation Guide (Phase 12 SSOT)

## Part 1: 中学生レベルの説明

### なぜ必要か

UT-DSF-07 では staging の `/profile` と `/admin` を撮っていますが、実際にはログインしていない guard 画面です。これだけでは、ログイン後のプロフィール本文や管理画面 dashboard が staging で正しく見えるかを確認できません。

### 日常の例え

店の入口の写真だけでは、店内の席やレジがきちんと準備できているかは分かりません。本タスクは、入口ではなく会員証を持って店内に入り、会員席と管理カウンターを撮影するための手順を作ります。

### 今回作ったもの

- Issue #901 の canonical workflow root
- Phase 11 の authenticated screenshot 計画と storageState 生成手順
- Phase 12 strict 7 outputs
- source proto-spec の consumed pointer
- 親 UT-DSF-07 への child workflow back-reference
- aiworkflow-requirements の quick-reference / resource-map / task-workflow-active / artifact inventory / changelog / LOGS 同期

### まだ実行していないもの

authenticated Playwright screenshot、parent gate release、commit、push、PR は user-gated の Gate-C で行います。実コード実装とローカル unit gate は本レビューサイクルで完了済みですが、spec_created を runtime PASS と扱いません。

## Part 2: 技術者向け契約

| Area | Contract |
| --- | --- |
| New CLI | `apps/web/playwright/scripts/mint-staging-storage-state.ts` — `signSessionJwt` HS256, TTL=600s, `authjs.session-token` cookie, mode 0600 output |
| Unit test | `apps/web/playwright/scripts/__tests__/mint-staging-storage-state.spec.ts` — 11 cases (cookie structure / TTL / isAdmin / value-not-logged / dry-run / file mode) |
| Playwright projects (new) | `setup-authenticated-staging` / `staging-visual-authenticated` / `teardown-authenticated-staging` in `apps/web/playwright.config.ts` |
| New specs | `apps/web/playwright/tests/visual-staging-authenticated/{profile,admin-dashboard}-authenticated.spec.ts` — visibility assert + `toHaveScreenshot` |
| Baseline naming | `*-authenticated-staging-visual-chromium-linux.png` (namespace-separated from existing UT-DSF-07 baselines) |
| Evidence root | `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/` |
| Required env (CI) | `STAGING_AUTH_SECRET` / `STAGING_ADMIN_MEMBER_ID` / `STAGING_ADMIN_EMAIL` / `STAGING_ME_MEMBER_ID` / `STAGING_ME_EMAIL` / `STAGING_WORKER_HOST` / `PLAYWRIGHT_STAGING_BASE_URL` |
| CI workflow | `.github/workflows/playwright-staging-visual-authenticated.yml` — mint storageState in setup project, run authenticated specs, upload HTML report only, cleanup `.auth/` |
| Gitignore | `apps/web/.gitignore` adds `playwright/.auth/` (storageState never committed) |
| Grep gate | `scripts/lib/grep-no-auth-leak.sh` — 0 hits on concrete JWT values, `authjs.session-token=` cookie assignments, and concrete `STAGING_AUTH_SECRET=` assignments |
| Parent release | Update `ut-dsf-07-staging-visual-runtime-evidence` from `VISUAL_RUNTIME_AUTHENTICATED_PENDING` to `VISUAL_RUNTIME_AUTHENTICATED_OK` only after authenticated baselines exist. |
| Proto-spec consumed | Append `status: consumed` + `canonical_workflow:` YAML frontmatter to `docs/30-workflows/completed-tasks/UT-DSF-07-FU-01-authenticated-profile-admin-staging-visual.md` |
| Issue mode | CLOSED-stay; PR uses `Refs #901` only (`Closes #901` forbidden) |
| Forbidden | New API endpoint, D1 schema change, Google Form change, production deploy, storageState git commit, fake PNG placeholders, `staging-visual` (UT-DSF-07) baseline rewrite |

### TypeScript 型定義

```ts
type Role = "member" | "admin";

interface MintArgs {
  role: Role;
  out: string;
  ttlSec?: number;
  dryRun?: boolean;
}

interface MintSummary {
  role: Role;
  sub: string;
  exp: number;
  isAdmin: boolean;
}

export async function mintStagingStorageState(
  args: MintArgs,
  env?: NodeJS.ProcessEnv,
): Promise<{ summary: MintSummary }>;
```

### API / CLI シグネチャ

```bash
tsx playwright/scripts/mint-staging-storage-state.ts \
  --role=member \
  --out=playwright/.auth/member.storageState.json

tsx playwright/scripts/mint-staging-storage-state.ts \
  --role=admin \
  --out=playwright/.auth/admin.storageState.json
```

実装は `signSessionJwt(secret, input)` を使う。引数順は `packages/shared/src/auth.ts` の正本に従い、`input.ttlSeconds = 600` を渡す。

### 使用例

```ts
await mintStagingStorageState({
  role: "member",
  out: "apps/web/playwright/.auth/member.storageState.json",
});

await mintStagingStorageState({
  role: "admin",
  out: "apps/web/playwright/.auth/admin.storageState.json",
});
```

### エラーハンドリング

| ケース | 挙動 |
| --- | --- |
| required env 不足 | exit 1。stderr は env 名のみ。値は出力しない |
| `--role` 不正 | exit 1。許可値 `member/admin` を表示 |
| `--out` 不正 | exit 1。path traversal / directory 不在を拒否 |
| JWT self-verify fail | exit 1。`auth-secret-drift` として扱い token 値は出力しない |
| dry-run | storageState を書かず summary のみ返す。cookie 値は出力しない |

### エッジケース

| ケース | 対応 |
| --- | --- |
| `data-testid` 不在 | `apps/web/app/profile/page.tsx` / `apps/web/app/(admin)/admin/page.tsx` に最小 attribute 追加 |
| cookie prefix drift | Set-Cookie 一次根拠に合わせて cookie name option を追加 |
| staging seed 不在 | visibility assert が guard 画面で fail し、seed 不足として切り分け |
| TTL 失効 | setup project 直後に authenticated project を走らせ、TTL=600s 内に完了 |
| baseline drift | fake PNG を禁止し、CI ubuntu 生成 PNG だけを baseline とする |

### 設定 / 定数一覧

| 名前 | 値 / 役割 |
| --- | --- |
| `DEFAULT_TTL_SECONDS` | `600` |
| cookie name | `authjs.session-token` |
| storageState dir | `apps/web/playwright/.auth/` |
| baseline suffix | `-authenticated-staging-visual-chromium-linux.png` |
| max diff | `0.05` |
| member testid | `profile-authenticated-root` |
| admin testid | `admin-dashboard-root` |

### テスト構成

| 層 | 対象 |
| --- | --- |
| unit | mint CLI env validation / TTL / cookie structure / dry-run / no secret logging |
| Playwright setup | member/admin storageState generation and JSON shape |
| Playwright visual | `/profile` and `/admin` visibility assert + screenshot |
| grep gate | JWT / cookie value / secret value leak 0 hit |
| compliance | gate metadata / Phase 11 canonical paths / Phase 12 strict 7 |

### Verification Commands

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web test -- mint-staging-storage-state
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx \
  playwright/scripts/mint-staging-storage-state.ts --role=member --out=playwright/.auth/member.storageState.json
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec tsx \
  playwright/scripts/mint-staging-storage-state.ts --role=admin --out=playwright/.auth/admin.storageState.json
op run --env-file=.env -- mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated --update-snapshots
rm -rf apps/web/playwright/.auth
bash scripts/lib/grep-no-auth-leak.sh
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance
bash scripts/verify-pr-ready.sh
```

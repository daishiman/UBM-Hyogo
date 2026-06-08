# Server Component E2E パターン

Next.js App Router の Server Component / Server Action 系画面に対する Playwright E2E 仕様書を作成する際の正本パターン。
e2e-quality-uplift stage-3-impl 3b（e2e-tests-hard-gate）の Phase 12 skill-feedback で確立。

## 適用条件

- 対象画面が **Server Component** または `"use server"` で `fetch()` を server-side で発行する
- E2E でその `fetch()` 経路を mock したい / contract verify したい
- Phase 4 / 6 / 7 / 11 の test 設計と evidence に影響する

---

## 不変条件

### 1. `page.route()` を server-side fetch の evidence にしない

Playwright `page.route()` はブラウザの Network 層を hook するため、**Node.js プロセス（Worker / Next dev server）から発行される `fetch()` は捕捉できない**。Server Component から `fetch('https://api...')` した場合、`page.route()` で 200 / 404 を強制しても本物の上流が呼ばれ、テストは silent に false-PASS する。

**禁止**:

- Phase 2 / 4 のテスト設計で `page.route()` だけを mock 戦略として記載する
- Phase 11 evidence で `page.route()` 経由のレスポンス改変を server-side fetch の証拠に使う

### 2. 決定論的 mock API + seed + `INTERNAL_API_BASE_URL` 差し替えを Phase 2 / 4 / 11 に必須化

Server Component E2E では、以下 3 点をテスト設計 / evidence の必須要素とする:

| 要素 | 配置 | 役割 |
| --- | --- | --- |
| Deterministic mock API server | `scripts/e2e-mock-api.mjs` 等。Playwright `webServer` config で start | 上流 fetch を localhost に向ける |
| Seed data | `tests/e2e/fixtures/<domain>-seed.json` / `.sql` | mock API のレスポンス固定 |
| `INTERNAL_API_BASE_URL` 差し替え | `.env.test` / `playwright.config.ts` の `webServer.env` | Next dev server が mock API を上流とする |

仕様書記載例（Phase 2 / Phase 4）:

```markdown
## E2E mock 戦略

- Server Component 内 `fetch(env.INTERNAL_API_BASE_URL + '/members')` は `page.route()` で捕捉**不可**
- `scripts/e2e-mock-api.mjs` を Playwright `webServer` から起動し、`INTERNAL_API_BASE_URL=http://127.0.0.1:<port>` を webServer.env に注入
- Seed: `tests/e2e/fixtures/members-seed.json`
```

### 3. Phase 11 evidence は tracked file を canonical にする

`.gitignore` 対象の `*.log` を PASS 根拠にしない。canonical evidence は次のいずれか:

- `outputs/phase-11/evidence/e2e-run.txt`（tracked）
- `outputs/phase-11/evidence/e2e-summary.md`（tracked）
- `outputs/phase-11/evidence/playwright-report.json`（tracked）

`coverage/`, `test-results/`, `*.log` 等は補助 evidence。Phase 12 compliance check では tracked file の存在を root 判定に使う。

---

## Phase 別チェック

### Phase 2（要件 / scope）

- mock API 経路 / seed file path / `INTERNAL_API_BASE_URL` 差し替え方針を記載
- `page.route()` を server-side mock として使わないことを明記

### Phase 4（テスト設計）

- spec 一覧表に Server Component 経路 / Client Component 経路を区別
- Server Component spec は mock API + seed 経由で検証
- Client Component spec のみ `page.route()` を許可

### Phase 6 / 7（test 実装）

- `playwright.config.ts` の `webServer` に mock API server を追加
- env injection を `webServer.env` 経由で行う

### Phase 11（evidence）

- `e2e-run.txt`（tracked）に Playwright stdout を保存
- `coverage-summary.json` / lines coverage ≥ 80% を tracked file で保存
- `*.log` は補助のみ

### Phase 12（compliance）

- canonical evidence file が tracked か `git ls-files` で確認
- `page.route()` が server-side fetch evidence として使われていないことを `rg` で確認

```bash
# Server Component spec で page.route() が server fetch mock として誤用されていないか
rg -n "page\.route\(" tests/e2e/ | grep -i "server\|fetch" && echo "REVIEW" || echo "OK"
```

---

## 適用例（3b e2e-tests-hard-gate）

- `scripts/e2e-mock-api.mjs` を新設し、Playwright `webServer` で起動
- `.github/workflows/e2e-tests.yml` で mock API を Playwright 実行前に start
- `apps/web` の Server Component 由来 fetch を `INTERNAL_API_BASE_URL` で差し替え
- Phase 11 evidence は `e2e-run.txt` / `coverage-summary.json` を tracked で保存

## Server Component redirect の vitest pattern（2026-05-19 追加 / parallel-03-appshell-layouts 由来）

Server Component（`async function` layout / page）が `next/navigation` の `redirect()` を呼ぶ場合、`redirect` は内部的に special error を throw して制御フローを切断する。これを vitest から検証するには **`redirect` を throw に mock し `rejects.toThrow` で assert** する。

### 適用条件

- `apps/web/app/(admin)/layout.tsx` のように Server Component で `getSession()` の結果に応じて `redirect('/login')` する
- middleware 単独に依存せず、layout レベルでも 2 段防御として redirect する

### canonical pattern

```ts
// apps/web/app/(admin)/layout.spec.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

import AdminLayout from './layout';
import { getSession } from '@/lib/auth';

describe('AdminLayout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('redirects to /login when session is null', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(
      AdminLayout({ children: null as any }),
    ).rejects.toThrow('NEXT_REDIRECT:/login');
  });

  it('renders children for admin session', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { role: 'admin' } } as any);
    const result = await AdminLayout({ children: 'OK' as any });
    expect(result).toBeDefined();
  });
});
```

### 不変条件

- `redirect` mock は **必ず throw する関数** にする。`vi.fn()` 単体（throw なし）だと layout が `redirect()` の後の処理を続行し false-PASS する
- spec 名は `layout.spec.tsx`（`.test.tsx` 禁止、CLAUDE.md 不変条件 #8）
- Server Component を直接 `await Component(props)` で実行する。`@testing-library/react` の `render` は async server component に対応していないため使わない
- `redirect` の throw を `try/catch` で握り潰して assert すると失敗パスが見えなくなる。**必ず `rejects.toThrow` を使う**

## Server Component runtime smoke token-compatibility gate（2026-05-24 / Issue #864）

Authenticated Server Component route を staging / production runtime smoke で叩く場合、HTTP probe は UI route の手前にある edge middleware と route/layout 側の session resolver の **両方**を通過する必要がある。Phase 1/2 で次を確認してから runner を実装する。

| 確認 | 判定 |
| --- | --- |
| edge gate | `middleware.ts` / `proxy.ts` が読む cookie 名と decode helper |
| route gate | layout/page の `getSession()` / Auth.js `auth()` が使う `session.strategy` と `jwt.encode/decode` |
| cookie mint | edge と route が同一 JWT 契約なら shared encode helper を再利用。Auth.js default JWE 等で非対称なら runner 実装前に互換 encode/decode を追加 |
| tests | mint helper は pure function として focused `*.spec.ts` で decode round-trip を検証し、runner は curl/tail stub で 200 / redirect / 403 / render-error digest を分類する |

適用例: `issue-864-admin-staging-runtime-smoke-ci-gate` は `apps/web/src/lib/auth.ts` が `session.strategy="jwt"` かつ `encodeAuthSessionJwt` / `decodeAuthSessionJwt` を Auth.js adapter に使うことを確認し、`mint-staging-session-cookie.mts` が同じ HS256 contract の cookie を発行する。

### Multi-environment mint helper extension（2026-05-25 / Issue #922）

staging で確立した Server Component runtime smoke を production へ横展開する場合、mint helper を複製せず env prefix resolution を純粋関数として追加する。`resolveEnvPrefix("staging") = "STAGING"` / `resolveEnvPrefix("production") = "PRODUCTION"` を focused test で固定し、unsupported env は exit 2 にする。CLI は後方互換のため引数なしを staging とし、production job だけ `production` 引数を渡す。

## 二重 mock の serving-path 切替と negative-query 規約の単一ソース化（2026-05-24 追加 / members-page-prototype-alignment e2e gate 由来）

SSR mock が**2系統**存在し、実行環境でどちらが応答するかが切り替わる構成では、テストの期待値とモックの応答規約を**単一ソースに固定**しないと「local は PASS / CI は FAIL（またはその逆）」が起きる。

### 構成と落とし穴

| 系統 | 起動主体 | 応答する条件 |
| --- | --- | --- |
| `apps/web/playwright/fixtures/auth.ts` 内蔵 HTTP server | テストプロセスの `ensureMockApi()` が `:8787` に bind | local 単体実行（8787 が空いている時） |
| `scripts/e2e-mock-api.mjs` | CI の `.github/workflows/e2e-tests.yml` が full suite 前に先起動 | CI（auth fixture の `ensureMockApi()` は **EADDRINUSE フォールバックで既存サーバを再利用**するため） |

`ensureMockApi()` は `server.once('error', ...)` で `EADDRINUSE` を捕捉すると自前 server を起動せず `waitForMockApiReady()` で既存（= e2e-mock-api.mjs）を reuse する。
→ **同じ spec でも local では auth.ts、CI では e2e-mock-api.mjs が応答する**。片方だけ直すと CI で効かない。

### 不変条件

1. **negative-query（空結果を返す検索語）は contracts fixture を単一ソースにする**。`packages/contracts/src/fixtures.mjs` の `fixtures.public.negativeQuery`（`"zzz_no_match_zzz"`）が正本で、`index.spec.ts` が値を assert する。テスト・両 mock はこの値に揃える。独自 prefix（`zzznotfound-${Date.now()}` 等）を spec ごとに作らない。
2. **mock の空系レスポンスも `.strict()` zod schema の必須キーを満たす**。`PublicMemberListViewZ` は `.strict()` かつ `topTags` 必須。空系で `topTags` を省略すると `listMembers()` 内の `.parse()` が throw → ページが error boundary に落ち、EmptyState が描画されず spec が timeout する。正常系と空系で同一 schema を満たすこと。
3. **mock を 2 系統持つ場合は応答規約（条件分岐・キー）を両系統で一致させる**。`auth.ts` と `e2e-mock-api.mjs` の `/public/members` ハンドラは同じ negative-query 判定（`q === fixtures.public.negativeQuery`）と同じレスポンス shape にする。
4. **drift は negative-query に限らない。endpoint 追加・body field 追加・enum 値変更も同型 drift 源**（2026-06-07 / issue-1101 attendance analytics calc correction 由来）。issue-1101 では attendance dashboard の overview に `uniqueAttendeeCount` / `uniqueAttendanceRate` 追加、zone-distribution の値を `0→1` 等から `zone_0` / `zone_1_9` / `zone_10_99` / `zone_100_plus` へ変更、`/admin/dashboard/attendance/absentees` を画面が server-side fetch するよう追加したが、`auth.ts` だけ更新し `e2e-mock-api.mjs` を忘れた結果、`e2e (desktop/mobile 3 project)` と `e2e-tests-coverage-gate` が **CI でのみ** FAIL した（404 → ページ degrade、KPI testid not found、zone ラベル欠落）。ローカル vitest / unit test は in-process mock を見ないため検知できない。**新規 endpoint を画面が server-side fetch する場合は `e2e-mock-api.mjs` に route handler 追加も必須**（body 関数の追加だけでは route 分岐に到達せず 404 のまま）。

### Phase 別チェック追記

- Phase 4 / 6：spec が使う negative-query / empty-state トリガ語は contracts fixture を import or 同値参照する。spec 独自のマジック文字列を増やさない。
- Phase 6 / 7：admin/public dashboard 系の mock body（overview / zone-distribution / absentees 等）や endpoint を変更したら、`auth.ts` と `e2e-mock-api.mjs` を **同一 wave で揃える**。変更後に両系統を grep 突合する:

  ```bash
  # field / enum / route が両系統で一致しているか
  grep -n "uniqueAttendeeCount\|zone_100_plus\|attendance/absentees" \
    apps/web/playwright/fixtures/auth.ts scripts/e2e-mock-api.mjs
  ```
- Phase 11：EmptyState 系 spec / 新 endpoint 依存 spec は CI serving-path（e2e-mock-api.mjs を 8787 先起動 → `CI=1 playwright test`）でも green を確認する。local の auth.ts 単体 PASS だけを根拠にしない。新 endpoint は push 前に 200 応答を確認する:

  ```bash
  E2E_MOCK_API_PORT=8799 node scripts/e2e-mock-api.mjs &
  node -e "fetch('http://127.0.0.1:8799/admin/dashboard/attendance/absentees?lastN=3').then(r=>console.log(r.status))"
  ```

```bash
# CI 相当の serving-path 再現（e2e-mock-api.mjs を先起動してから spec 実行）
node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &
CI=1 pnpm --filter @ubm-hyogo/web exec playwright test tests/<spec>.spec.ts --project=desktop-chromium
```

## 関連 reference

- [quality-gates.md](quality-gates.md) — §7 テスト常時実行可能性 DoD / §7.5 E2E lines coverage ≥ 80%
- [phase-template-phase11.md](phase-template-phase11.md) — Phase 11 evidence canonical path
- [phase-11-non-visual-alternative-evidence.md](phase-11-non-visual-alternative-evidence.md) — tracked evidence rule
- [workflow-state-vocabulary.md](workflow-state-vocabulary.md) — runtime_pending / completed 区別
- [task-type-decision.md](task-type-decision.md) — `implementation_mode: existing-layout-alignment`

# Phase 7: 統合テスト（mock ↔ contracts ↔ contract spec 境界）

## メタ情報

| key | value |
|-----|-------|
| Phase | 7 |
| Phase Name | 統合テスト（mock ↔ contracts ↔ contract spec 境界） |
| 作成日 | 2026-05-14 |
| 前 Phase | 6 |
| 次 Phase | 8 |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 関連 AC | AC-1 / AC-2 / AC-3 / AC-4 |

## 目的

Phase 4-6 で個別実装した 3 拠点（`packages/contracts/` / `scripts/e2e-mock-api.mjs` / `scripts/__tests__/e2e-mock-api.contract.spec.ts`）を **境界横断の統合テスト**として束ね、real network I/O (`fetch` over loopback) を通じて schema parse / state reset / seed injection / 異常系返却が drift なく成立することを検証する。

本 Phase は単体テスト（Phase 4）と区別され、以下を確実にする:

- contract spec が **実際に mock プロセスを spawn し**、`fetch()` で HTTP を叩いて assert する
- contract spec の port は **CI default `8787` と衝突しない別 port `38787`** を使う
- contract spec は **`apps/web` E2E (Playwright) と独立して `.github/workflows/ci.yml` の test job または root `pnpm test` 経路から実行**される

## 実行タスク

1. 別 port `38787` 起動 + 終了 lifecycle を Vitest `globalSetup` / `globalTeardown` に集約
2. inventory（Phase 1）の全 endpoint について「mock fetch → zod parse → not.toThrow」を assert
3. `POST /__test__/reset` で seed が初期状態に戻ることを assert
4. `POST /__test__/seed-pending` で seed が正しく注入されることを assert
5. 不正 body POST で `400` / `500` を返すこと（旧 `{ok:true}` fallthrough 廃止検証）を assert
6. 不明 path / method で `404` を返すことを assert
7. `.github/workflows/ci.yml` の test job または root `pnpm test` から `scripts/**/*.spec.ts` glob で contract spec が拾われることを確認

## 参照資料

- `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/index.md`
- `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/phase-1.md`（endpoint-inventory.md）
- `docs/30-workflows/issue-667-stage3b-mock-api-fixture-coverage/phase-2.md`（Concern C contract test topology）
- `scripts/e2e-mock-api.mjs`（Phase 6 実装後）
- `packages/contracts/src/`（Phase 6 実装後）
- `.github/workflows/ci.yml`

## 実行手順

### 1. Vitest globalSetup / globalTeardown 配置

`scripts/__tests__/globalSetup.ts` を新規作成し、mock プロセスを Vitest 全体で 1 度だけ起動・終了する。

```ts
// scripts/__tests__/globalSetup.ts
import { spawn, type ChildProcess } from 'node:child_process';

let proc: ChildProcess | null = null;
const PORT = '38787';

export async function setup() {
  proc = spawn('node', ['scripts/e2e-mock-api.mjs'], {
    env: { ...process.env, E2E_MOCK_API_PORT: PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // readiness wait (≤30s)
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('mock API readiness timeout');
}

export async function teardown() {
  if (proc) proc.kill('SIGTERM');
}
```

`scripts/vitest.config.ts`（または既存 vitest config の test.globalSetup）に登録:

```ts
export default {
  test: {
    globalSetup: ['scripts/__tests__/globalSetup.ts'],
    include: ['scripts/__tests__/**/*.spec.ts'],
    coverage: { thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 } },
  },
};
```

> mock 側は `process.env.E2E_MOCK_API_PORT` が指定された場合にその port で `server.listen()` する実装になっていること（Phase 6 で確認）。

### 2. 統合テストケース matrix

| # | カテゴリ | endpoint / 操作 | 期待 |
|---|---------|----------------|------|
| IT-01 | happy / GET | `/health` | 200 / body `{ ok: true }` |
| IT-02 | happy / GET | `/me`, `/me/profile` | 200 / `MeResponseZ.parse` not throw |
| IT-03 | happy / POST | `/me/visibility-request`, `/me/delete-request` | 202 or 200 / `VisibilityRequestResponseZ.parse` not throw |
| IT-04 | happy / GET | `/public/stats`, `/public/members`, `/public/members/m-1`, `/public/form-preview` | 200 / 各 `*Z.parse` not throw |
| IT-05 | happy / GET | `/admin/dashboard`, `/admin/members`, `/admin/members/m-1`, `/admin/tags/queue`, `/admin/schema`, `/admin/schema/diff`, `/admin/meetings`, `/admin/meetings/mtg-1`, `/admin/requests`, `/admin/identity-conflicts`, `/admin/audit` | 200 / `*Z.parse` not throw |
| IT-06 | happy / POST | `/admin/meetings/mtg-1/attendance`, `/admin/requests/req-1/resolve`, `/admin/identity-conflicts/cf_001/merge`, `/admin/identity-conflicts/cf_001/dismiss` | 200 / 各 response schema parse not throw |
| IT-07 | state / POST | `/__test__/reset` 実行 → `/admin/identity-conflicts` 取得 → seed が初期 fixture と完全一致 | 200 / `fixtures.identityConflicts` と deep equal |
| IT-08 | state / POST | `/__test__/seed-pending` 実行 → `/admin/requests` 取得 → pending request が injection された seed と一致 | 200 / 注入 seed と deep equal |
| IT-09 | error / POST | `/admin/identity-conflicts/cf_001/merge` に schema 違反 body | 400 or 500 / body に `zodIssues` を含む |
| IT-10 | error / unknown | `/foo/bar` GET / 未定義 method POST | 404（旧 `{ok:true}` fallthrough 廃止検証） |

### 3. spec 雛形

```ts
// scripts/__tests__/e2e-mock-api.contract.spec.ts（Phase 6 で作成済 / Phase 7 で拡充）
import { describe, it, expect, beforeEach } from 'vitest';
import {
  MeResponseZ,
  MeProfileResponseZ,
  PublicStatsZ,
  PublicMemberListZ,
  AdminDashboardZ,
  AdminMembersListZ,
  IdentityConflictListZ,
  MergeIdentityResponseZ,
  fixtures,
} from '@ubm-hyogo/contracts';

const BASE = `http://127.0.0.1:${process.env.E2E_MOCK_API_PORT ?? '38787'}`;

async function getJson(path: string) {
  const res = await fetch(`${BASE}${path}`);
  expect(res.status).toBe(200);
  return res.json();
}

beforeEach(async () => {
  await fetch(`${BASE}/__test__/reset`, { method: 'POST' });
});

describe('/health', () => {
  it('IT-01 returns ok', async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe('happy paths parse with contracts SSOT', () => {
  it('IT-02 /me, /me/profile', async () => {
    expect(() => MeResponseZ.parse(/* await */ getJson('/me'))).not.toThrow;
    const me = await getJson('/me');
    expect(() => MeResponseZ.parse(me)).not.toThrow();
    const profile = await getJson('/me/profile');
    expect(() => MeProfileResponseZ.parse(profile)).not.toThrow();
  });

  // IT-04, IT-05 を同様に展開
});

describe('error paths', () => {
  it('IT-09 invalid merge body returns 4xx/5xx with zodIssues', async () => {
    const res = await fetch(`${BASE}/admin/identity-conflicts/cf_001/merge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ broken: true }),
    });
    expect([400, 500]).toContain(res.status);
    const body = await res.json();
    expect(body).toHaveProperty('zodIssues');
  });

  it('IT-10 unknown path returns 404 (no fallthrough)', async () => {
    const res = await fetch(`${BASE}/foo/bar`);
    expect(res.status).toBe(404);
  });
});
```

### 4. 別 port 構造の確認

```bash
# CI default 8787 と衝突しないこと
grep -nE "8787" scripts/e2e-mock-api.mjs scripts/__tests__/*.ts
# → mock 側は process.env.E2E_MOCK_API_PORT || 8787 / spec 側は 38787
```

### 5. CI test job への組込確認

```bash
grep -nE "pnpm test|vitest|scripts/" .github/workflows/ci.yml
# → scripts/**/*.spec.ts が glob 範囲に含まれること
```

含まれない場合、`ci.yml` の既存 test job に `pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts` の明示実行ステップを追加する（Concern D の patch とは別ファイルなので E2E workflow を改変しない）。

### 6. 実行

```bash
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts --reporter=verbose
```

期待: 10 ケース PASS / 0 skip / 0 fail / exit 0。

## 統合テスト連携

- 本 Phase の contract spec は **Phase 8（パフォーマンス）/ Phase 9（品質ゲート）/ Phase 11（regression 確認）** の入力となる
- E2E (Playwright) は本統合テストとは独立。同じ `packages/contracts` を import することで shape drift を unit 段で先回り検出
- failure 時は Phase 6（実装）に差し戻し、mock dispatcher / contracts schema / spec のいずれかを最小差分で修正

## 多角的チェック観点（AI が判断）

- [ ] 統合テスト port `38787` が CI default `8787` と衝突しない構造になっているか
- [ ] `globalSetup` / `globalTeardown` でプロセスリーク（zombie node process）が発生しないか（`SIGTERM` で kill）
- [ ] `beforeEach` の `__test__/reset` がすべてのテストで実行され state 汚染が発生しないか
- [ ] 旧 `{ok:true}` fallthrough が `404` 化されたことを IT-10 で確実に検証しているか
- [ ] `apps/web` E2E と独立に走ること（Playwright を spawn しない）
- [ ] readiness wait timeout (30s) が CI step timeout (6 分) より十分短いか
- [ ] inventory（Phase 1）の endpoint 数と contract spec assert 数が一致しているか

## サブタスク管理

| ID | サブタスク | 状態 |
|----|-----------|------|
| ST-7-1 | globalSetup / teardown 実装 | 未着手 |
| ST-7-2 | IT-01..IT-10 spec 拡充 | 未着手 |
| ST-7-3 | `ci.yml` test job または root `pnpm test` から拾われる確認 | 未着手 |
| ST-7-4 | drift 検出（mock dispatcher count vs inventory 行数） | 未着手 |

## 成果物

- `scripts/__tests__/globalSetup.ts`（新規）
- `scripts/__tests__/e2e-mock-api.contract.spec.ts`（IT-01..IT-10 拡充版）
- `scripts/vitest.config.ts`（または既存 config への globalSetup 追記）
- `outputs/phase-7/integration-test-report.md`（10 ケース実行ログ / coverage 数値）

## 完了条件（coverage AC 必須）

- [ ] IT-01..IT-10 全 10 ケース PASS / 0 skip / 0 fail
- [ ] `mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts --coverage` で Statements/Branches/Functions/Lines すべて **≥80%**
- [ ] readiness wait 実測 ≤ 30 秒
- [ ] `globalTeardown` 後に `lsof -i :38787` が空（zombie process なし）
- [ ] inventory（Phase 1）行数と `expect(...parse(...)).not.toThrow()` 出現数が一致（drift gate）
- [ ] AC-1 / AC-2 / AC-3 / AC-4 がそれぞれ機械検証可能な assert として spec に存在

## タスク100%実行確認【必須】

- [ ] 実行手順 1-6 全完了
- [ ] サブタスク ST-7-1..ST-7-4 全完了
- [ ] 成果物 4 件作成済み
- [ ] coverage ≥80% を `outputs/phase-7/integration-test-report.md` に貼付

## 次 Phase

Phase 8: パフォーマンス / 非機能要件確認

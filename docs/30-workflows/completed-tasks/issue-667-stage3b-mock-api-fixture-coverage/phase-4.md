# Phase 4: テスト作成 (TDD RED)

## メタ情報

| key | value |
|-----|-------|
| Phase | 4 |
| Phase Name | テスト作成（TDD RED） |
| 作成日 | 2026-05-14 |
| 前 Phase | 3 |
| 次 Phase | 5 |
| 分類ラベル | `existing-hardening` |
| 実装区分 | 実装仕様書（テストコード追加） |
| visualEvidence | NON_VISUAL |
| TDD フェーズ | RED |

## 目的

Phase 1 endpoint inventory（23 endpoint + `/health`）と Phase 2 concern A-D を入力として、本 workflow の RED テストを作成する。RED の意味は CLAUDE.md / phase-template-core.md L115 の通り「ファイル不在」ではなく「**既存 `scripts/e2e-mock-api.mjs` が新規 AC を満たさない**」こと。

本 Phase 終了時点では:

- `packages/contracts/` の zod schema 実体は **まだ存在しない** ため、`packages/contracts/src/index.spec.ts` は import 解決で RED 化する
- `scripts/__tests__/e2e-mock-api.contract.spec.ts` は schema 不在 + mock の `{ ok: true }` fallthrough により RED 化する
- いずれも Phase 6 GREEN で test を実装側に追従させる前提

> **RED テストの commit ポリシー**: Vitest が RED のままで `pnpm typecheck` / `pnpm lint` を pass させるため、テストファイル自身は **構文 valid** な状態で書く（`expect(...).toBe(...)` 自体は通る形）。schema import 失敗 / parse 失敗のみが RED 要因になるよう局所化する。

## Phase 4 開始 gate（Phase 3 から重複明記）

- [ ] Phase 1 成果物（`outputs/phase-1/{endpoint-inventory,spec-extraction-map,acceptance-criteria}.md`）完了
- [ ] Phase 2 成果物（`outputs/phase-2/{design,dependency-matrix,validation-matrix}.md`）完了
- [ ] Phase 3 判定: no-go = 0 / major = 0
- [ ] visualEvidence = `NON_VISUAL` を `artifacts.json` で確認

## 実行タスク

1. `packages/contracts/src/index.spec.ts` を新規作成: 各 zod schema の **self-test**（valid fixture が parse 成功 / invalid fixture が parse 失敗）
2. `scripts/__tests__/e2e-mock-api.contract.spec.ts` を新規作成: 全 23 endpoint + `/health` の **契約テスト**
3. 異常系（不正 body POST → 400 / parse 失敗時 500）を contract spec に組込
4. test glob 包含確認: ルート `vitest.config.ts` または scripts 専用 config に `scripts/__tests__/**/*.spec.ts` / `packages/contracts/**/*.spec.ts` が含まれることを `outputs/phase-4/test-plan.md` に記録
5. `mise exec -- pnpm vitest run` を実行し、想定通り RED であることを確認、結果ログを `outputs/phase-4/red-evidence.md` に保存

## 参照資料

- Phase 1: `outputs/phase-1/endpoint-inventory.md`（23 endpoint + `/health`）
- Phase 2: `outputs/phase-2/design.md` concern A-D / `validation-matrix.md`
- 既存 mock: `scripts/e2e-mock-api.mjs`（463 行）
- 既存 shared zod: `packages/shared/src/zod/identity.ts`（`MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` 既存）
- API route 実装: `apps/api/src/routes/{admin,public,me}/`
- 既存 vitest 設定: `find . -path ./node_modules -prune -o -name "vitest.config.*" -print`

## 変更対象ファイル一覧

| パス | 種別 | 行数目安 | RED 要因 |
|------|------|----------|---------|
| `packages/contracts/src/index.spec.ts` | 新規 | 120-180 | `import { schemas, fixtures } from '..'` が解決できない（実体 Phase 6） |
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` | 新規 | 200-280 | mock の dispatcher が schema を満たさない / 未対応 endpoint で 404 / `{ok:true}` fallthrough |
| `outputs/phase-4/test-plan.md` | 新規 | 60-100 | ドキュメント成果物 |
| `outputs/phase-4/red-evidence.md` | 新規 | 30-60 | RED 実行ログ |

## 実行手順

### 1. `packages/contracts/src/index.spec.ts`（zod schema self-test）

```ts
import { describe, expect, it } from 'vitest';
import {
  schemas,
  fixtures,
} from '../src/index';

describe('packages/contracts: zod schema self-test', () => {
  describe('me.MeResponseZ', () => {
    it('valid fixture が parse 成功する', () => {
      expect(() => schemas.MeResponseZ.parse(fixtures.me.meResponse)).not.toThrow();
    });
    it('invalid fixture (memberId 欠落) で parse 失敗する', () => {
      const broken = { ...fixtures.me.meResponse, memberId: undefined };
      expect(() => schemas.MeResponseZ.parse(broken)).toThrow();
    });
  });

  describe('public.PublicMemberListZ', () => {
    it('valid fixture で parse 成功する', () => {
      expect(() => schemas.PublicMemberListZ.parse(fixtures.public.memberList)).not.toThrow();
    });
    it('items が空配列でも parse 成功する（一覧 0 件は許容）', () => {
      expect(() => schemas.PublicMemberListZ.parse({ items: [], total: 0 })).not.toThrow();
    });
  });

  describe('admin.AdminMemberListZ', () => {
    it('valid fixture で parse 成功する', () => {
      expect(() => schemas.AdminMemberListZ.parse(fixtures.admin.memberList)).not.toThrow();
    });
    it('total が string だと parse 失敗する', () => {
      expect(() => schemas.AdminMemberListZ.parse({ items: [], total: 'NaN' as unknown as number })).toThrow();
    });
  });

  describe('identity-conflicts.MergeIdentityRequestZ', () => {
    it('valid body で parse 成功する', () => {
      expect(() => schemas.MergeIdentityRequestZ.parse(fixtures.identityConflicts.mergeRequest)).not.toThrow();
    });
    it('targetMemberId 欠落で parse 失敗する', () => {
      const broken = { ...fixtures.identityConflicts.mergeRequest, targetMemberId: undefined };
      expect(() => schemas.MergeIdentityRequestZ.parse(broken)).toThrow();
    });
  });

  describe('fixtures invariants (AC-4)', () => {
    it('members が 3 件である', () => {
      expect(fixtures.public.memberList.items.length).toBe(3);
    });
    it('zone が 2 種 (Kobe / Himeji) を含む', () => {
      const zones = new Set(fixtures.public.memberList.items.map((m) => m.ubmZone));
      expect(zones).toEqual(new Set(['Kobe', 'Himeji']));
    });
    it('membership が 2 種 (regular / honorary) を含む', () => {
      const types = new Set(fixtures.public.memberList.items.map((m) => m.ubmMembershipType));
      expect(types).toEqual(new Set(['regular', 'honorary']));
    });
    it('tag facet が 2 件 (ABC法 / DEF法) である', () => {
      expect(fixtures.admin.tagFacets).toEqual(expect.arrayContaining(['ABC法', 'DEF法']));
      expect(fixtures.admin.tagFacets.length).toBe(2);
    });
    it('negative query が canonical 値 "zzz_no_match_zzz" である', () => {
      expect(fixtures.public.negativeQuery).toBe('zzz_no_match_zzz');
    });
  });
});
```

### 2. `scripts/__tests__/e2e-mock-api.contract.spec.ts`（契約テスト）

```ts
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { schemas } from '@ubm-hyogo/contracts';

const PORT = 38787;
const BASE = `http://127.0.0.1:${PORT}`;
let mock: ChildProcess;

const waitForReady = async () => {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch { /* not ready */ }
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error('mock not ready');
};

beforeAll(async () => {
  mock = spawn('node', ['scripts/e2e-mock-api.mjs'], {
    env: { ...process.env, E2E_MOCK_API_PORT: String(PORT) },
    stdio: 'pipe',
  });
  await waitForReady();
}, 15_000);

afterAll(async () => {
  mock?.kill('SIGTERM');
});

beforeEach(async () => {
  await fetch(`${BASE}/__test__/reset`, { method: 'POST' });
});

describe('contract: /health', () => {
  it('200 + status:"ok" を返す', async () => {
    const r = await fetch(`${BASE}/health`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toMatchObject({ status: 'ok' });
  });
});

describe('contract: /me 系', () => {
  it('GET /me が MeResponseZ を満たす', async () => {
    const r = await fetch(`${BASE}/me`);
    expect(r.status).toBe(200);
    expect(() => schemas.MeResponseZ.parse(await r.json())).not.toThrow();
  });
  it('GET /me/profile が MeProfileResponseZ を満たす', async () => {
    const r = await fetch(`${BASE}/me/profile`);
    expect(() => schemas.MeProfileResponseZ.parse(await r.json())).not.toThrow();
  });
  it('POST /me/visibility-request が valid body で 200', async () => {
    const r = await fetch(`${BASE}/me/visibility-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ requestedState: 'unlisted', reason: 'test' }),
    });
    expect(r.status).toBe(200);
  });
  it('POST /me/delete-request が valid body で 200', async () => {
    const r = await fetch(`${BASE}/me/delete-request`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'test' }),
    });
    expect(r.status).toBe(200);
  });
});

describe('contract: /public/* 系', () => {
  it.each([
    ['/public/stats', 'PublicStatsZ'],
    ['/public/members', 'PublicMemberListZ'],
    ['/public/members/m-1', 'PublicMemberDetailZ'],
    ['/public/form-preview', 'PublicFormPreviewZ'],
  ] as const)('GET %s が %s を満たす', async (path, schemaName) => {
    const r = await fetch(`${BASE}${path}`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(() => (schemas as Record<string, { parse: (v: unknown) => unknown }>)[schemaName].parse(body)).not.toThrow();
  });

  it('negative query "zzz_no_match_zzz" は 0 件を返す', async () => {
    const r = await fetch(`${BASE}/public/members?q=zzz_no_match_zzz`);
    const body = await r.json();
    expect(body.items.length).toBe(0);
  });
});

describe('contract: /admin/* 系', () => {
  it.each([
    ['/admin/dashboard', 'AdminDashboardZ'],
    ['/admin/members', 'AdminMemberListZ'],
    ['/admin/members/m-1', 'AdminMemberDetailZ'],
    ['/admin/tags/queue', 'AdminTagQueueZ'],
    ['/admin/schema', 'AdminSchemaZ'],
    ['/admin/schema/diff', 'AdminSchemaDiffZ'],
    ['/admin/meetings', 'AdminMeetingListZ'],
    ['/admin/meetings/mt-1', 'AdminMeetingDetailZ'],
    ['/admin/requests', 'AdminRequestListZ'],
    ['/admin/identity-conflicts', 'IdentityConflictListZ'],
    ['/admin/audit', 'AdminAuditListZ'],
  ] as const)('GET %s が %s を満たす', async (path, schemaName) => {
    const r = await fetch(`${BASE}${path}`);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(() => (schemas as Record<string, { parse: (v: unknown) => unknown }>)[schemaName].parse(body)).not.toThrow();
  });
});

describe('contract: identity-conflicts mutation', () => {
  it('POST /admin/identity-conflicts/cf_001/merge が valid body で 200', async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/merge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetMemberId: 'm_dst_01', reason: 'duplicate' }),
    });
    expect(r.status).toBe(200);
    expect(() => schemas.MergeIdentityResponseZ.parse(await r.json())).not.toThrow();
  });
  it('POST /admin/identity-conflicts/cf_001/merge で targetMemberId 欠落は 400 or 500', async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/merge`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'broken' }),
    });
    expect([400, 500]).toContain(r.status);
  });
  it('POST /admin/identity-conflicts/cf_001/dismiss が valid body で 200', async () => {
    const r = await fetch(`${BASE}/admin/identity-conflicts/cf_001/dismiss`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'false-positive' }),
    });
    expect(r.status).toBe(200);
  });
});

describe('contract: admin member PATCH', () => {
  it('PATCH /admin/members/m-1 が valid body で 200', async () => {
    const r = await fetch(`${BASE}/admin/members/m-1`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibility: 'hidden' }),
    });
    expect(r.status).toBe(200);
  });
});

describe('contract: 未定義 path/method の 404 化', () => {
  it('未定義 path は 404 ({ok:true} fallthrough 廃止)', async () => {
    const r = await fetch(`${BASE}/no-such-path`);
    expect(r.status).toBe(404);
  });
});
```

### 3. test glob 包含確認

```bash
# ルート vitest 設定の存在確認
find . -path ./node_modules -prune -o -name "vitest.config.*" -print

# `scripts/**/*.spec.ts` / `packages/contracts/**/*.spec.ts` を含むか確認
mise exec -- pnpm vitest run --reporter=verbose scripts/__tests__/e2e-mock-api.contract.spec.ts \
  --no-color 2>&1 | tee /tmp/phase-4-red.log
```

### 4. RED 確認の期待結果

| テスト | RED 要因（Phase 6 で解消） |
|-------|----------------------------|
| `packages/contracts/src/index.spec.ts` | `Cannot find module '../src/index'` / schema 不在 |
| `scripts/__tests__/e2e-mock-api.contract.spec.ts` | `Cannot find module '@ubm-hyogo/contracts'` / mock の 23 endpoint 未網羅 / `{ ok: true }` fallthrough |

## 統合テスト連携

- 本 Phase の RED テストは Phase 6 で GREEN になる
- contract test は `.github/workflows/ci.yml` test job または root `pnpm test` の test glob を介して CI runtime に乗る（Phase 2 Concern C）
- E2E (Playwright) との関係: contract test が shape を担保することで Phase 11 の E2E regression が shape drift 起因で flaky 化することを防止

## 多角的チェック観点（AI が判断）

- [ ] contract spec が Phase 1 endpoint inventory の 23 endpoint + `/health` をすべてカバーしているか
- [ ] AC-4 の seed 不変条件（members 3 / zone 2 / membership 2 / negative / tag facet 2）が `index.spec.ts` に invariants として固定されているか
- [ ] 異常系（不正 body / 不正 path）が最低 2 ケース含まれているか
- [ ] mock 起動 / teardown が `beforeAll` / `afterAll` で確実に行われ、test 間で state が残らないか（`beforeEach` で `__test__/reset`）
- [ ] RED ログが `outputs/phase-4/red-evidence.md` に保存されているか
- [ ] テストファイルが構文として valid（typecheck 通過）であり、Phase 5 / Phase 6 で実装側を追従させる前提が崩れていないか

## サブタスク管理

なし（単一 Phase 内完結）

## 成果物

| 種別 | パス |
|------|------|
| コード | `packages/contracts/src/index.spec.ts` |
| コード | `scripts/__tests__/e2e-mock-api.contract.spec.ts` |
| ドキュメント | `outputs/phase-4/test-plan.md`（テスト計画・RED 要因マトリクス） |
| ドキュメント | `outputs/phase-4/red-evidence.md`（RED 実行ログ） |

## 完了条件

- [ ] `packages/contracts/src/index.spec.ts` が作成され、AC-4 invariants を含む
- [ ] `scripts/__tests__/e2e-mock-api.contract.spec.ts` が作成され、23 endpoint + `/health` + 異常系 2 件以上をカバー
- [ ] `mise exec -- pnpm vitest run` が **RED 状態** で stop し、失敗理由が schema/mock 未実装に局所化されている
- [ ] `outputs/phase-4/test-plan.md` / `outputs/phase-4/red-evidence.md` が作成済み
- [ ] テストファイル自体は構文 valid（`pnpm typecheck` 通過。実装不在による import エラーのみが Vitest runtime で出る）
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）— **本 Phase 終了時点は実装未着手のため measurement のみ記録。Phase 6 / 9 で再評価**
- [ ] `bash scripts/coverage-guard.sh` exit 0 は Phase 6 / Phase 9 / Phase 11 完了条件で再確認

## タスク100%実行確認【必須】

- [ ] 実行タスク 1-5 全完了
- [ ] 成果物 4 件作成
- [ ] RED 確認ログを `outputs/phase-4/red-evidence.md` に保存
- [ ] Phase 5 で参照する test 構造を `outputs/phase-4/test-plan.md` に明記

## 次 Phase

Phase 5: 環境準備（`packages/contracts/` scaffold + pnpm workspace 反映 + ローカル動作確認）

# Phase 6: 実装（TDD GREEN — Concern A-D 統合実装）

## メタ情報

| key | value |
|-----|-------|
| Phase | 6 |
| Phase Name | 実装（TDD GREEN） |
| 作成日 | 2026-05-14 |
| 前 Phase | 5 |
| 次 Phase | 7 |
| 分類ラベル | `existing-hardening` |
| 実装区分 | 実装仕様書（本体実装） |
| visualEvidence | NON_VISUAL |
| TDD フェーズ | GREEN |
| Concern 数 | 4（A: contracts 実体 / B: mock 拡張 / C: contract test GREEN / D: CI workflow patch） |

## 目的

Phase 4 の RED テスト（`packages/contracts/src/index.spec.ts` + `scripts/__tests__/e2e-mock-api.contract.spec.ts`）を **すべて GREEN にする**。Phase 2 で確定した Concern A-D の実装を同一 PR 内で完遂し、AC-1〜AC-7 を全充足する。

| AC | 充足する Concern |
|----|----------------|
| AC-1（網羅）| Concern B |
| AC-2（SSOT + parse 必須）| Concern A + Concern B |
| AC-3（契約テスト）| Concern A + Concern C |
| AC-4（seed 強化）| Concern A |
| AC-5（CI 健全化）| Concern D |
| AC-6（既存 E2E green 維持）| Concern B（dispatcher chain 順序変更禁止） |
| AC-7（型・lint・coverage ≥80%）| Concern A + Concern B + Concern C |

## 前提（Phase 5 完了確認）

- [x] `packages/contracts/` scaffold 完了（package.json / tsconfig / plain ESM `.mjs` / vitest）
- [ ] `apps/api` / `apps/web` の `package.json#dependencies` に `@ubm-hyogo/contracts: workspace:*` 追記済
- [ ] `mise exec -- pnpm install` 完走済
- [ ] ローカル `/health` smoke 200 確認済

## 実行タスク

1. **Concern A**: `packages/contracts/src/{me,public,admin,identity-conflicts,fixtures,index}.mjs` 実コード作成
2. **Concern B**: `scripts/e2e-mock-api.mjs` を `safeJson` ラッパー化 + 未対応 endpoint 追加 + `{ok:true}` fallthrough 廃止
3. **Concern C**: Phase 4 の RED test を実行して GREEN を確認
4. **Concern D**: `.github/workflows/e2e-tests.yml` に readiness wait step + log upload-artifact step を追加
5. typecheck / lint / contract test / coverage-guard をすべて PASS させる
6. 既存 E2E spec (`task10-ui-primitives.spec.ts` / `admin-identity-conflicts.spec.ts`) を local 実行し regression 不在を確認

## 参照資料

- Phase 1: `outputs/phase-1/endpoint-inventory.md`（23 endpoint）
- Phase 2: `outputs/phase-2/design.md` Concern A-D 設計
- Phase 4: `outputs/phase-4/test-plan.md`, `red-evidence.md`
- 既存 mock: `scripts/e2e-mock-api.mjs`（463 行）
- 既存 shared zod: `packages/shared/src/zod/identity.ts`
- 既存 API route handler: `apps/api/src/routes/{admin,public,me}/**` （response shape の参照元）
- 既存 CI: `.github/workflows/e2e-tests.yml`（L42-43 patch 対象）

---

## Concern A: `packages/contracts/` 実コード

### 変更対象ファイル

| パス | 種別 | 行数目安 |
|------|------|---------|
| `packages/contracts/src/index.mjs` | 編集（stub → 実体） | 30-50 |
| `packages/contracts/src/me.mjs` | 新規 | 60-90 |
| `packages/contracts/src/public.mjs` | 新規 | 80-120 |
| `packages/contracts/src/admin.mjs` | 新規 | 150-220 |
| `packages/contracts/src/identity-conflicts.mjs` | 新規 | 40-60 |
| `packages/contracts/src/fixtures.mjs` | 新規 | 120-180 |

### `src/me.ts` 関数シグネチャ

```ts
import { z } from 'zod';

export const MeResponseZ = z.object({
  memberId: z.string().min(1),
  email: z.string().email(),
  isAdmin: z.boolean(),
  ubmZone: z.enum(['Kobe', 'Himeji']),
  ubmMembershipType: z.enum(['regular', 'honorary']),
});

export const MeProfileResponseZ = z.object({
  memberId: z.string().min(1),
  summary: z.object({
    fullName: z.string(),
    nickname: z.string(),
    location: z.string(),
    occupation: z.string(),
    ubmZone: z.enum(['Kobe', 'Himeji']),
    ubmMembershipType: z.enum(['regular', 'honorary']),
  }),
  publicSections: z.array(z.object({
    key: z.string(),
    title: z.string(),
    fields: z.array(z.object({
      stableKey: z.string(),
      label: z.string(),
      value: z.unknown(),
      kind: z.string(),
      visibility: z.enum(['public', 'membersOnly', 'private']),
      source: z.enum(['forms', 'admin']),
    })),
  })),
});

export const VisibilityRequestBodyZ = z.object({
  requestedState: z.enum(['public', 'unlisted', 'private']),
  reason: z.string().min(1).max(500),
});

export const DeleteRequestBodyZ = z.object({
  reason: z.string().min(1).max(500),
});
```

> **shape 確定方法**: `grep -nE "z\\.object|\\.parse\\(" apps/api/src/routes/me/*.ts` で既存 route handler の zod 定義を抜き出し、本 contracts の定義と field 名・型を 1:1 対応させる。

### `src/public.ts` / `src/admin.ts`

各 endpoint について同様に zod schema を定義する。例:

```ts
export const PublicStatsZ = z.object({
  totalMembers: z.number().int().nonnegative(),
  publicMembers: z.number().int().nonnegative(),
  zones: z.record(z.string(), z.number().int().nonnegative()),
  lastUpdatedAt: z.string().datetime(),
});

export const PublicMemberListItemZ = z.object({
  memberId: z.string(),
  fullName: z.string(),
  nickname: z.string().nullable(),
  ubmZone: z.enum(['Kobe', 'Himeji']),
  ubmMembershipType: z.enum(['regular', 'honorary']),
  occupation: z.string(),
});
export const PublicMemberListZ = z.object({
  items: z.array(PublicMemberListItemZ),
  total: z.number().int().nonnegative(),
});

export const PublicMemberDetailZ = z.object({
  memberId: z.string(),
  summary: PublicMemberListItemZ,
  publicSections: z.array(z.unknown()),
});

export const PublicFormPreviewZ = z.object({
  formId: z.string(),
  sectionCount: z.number().int(),
  questionCount: z.number().int(),
  responderUrl: z.string().url(),
});
```

admin 系（dashboard / members / tags / schema / meetings / requests / audit）も同じ要領で API route 実装の grep 結果に追従。

### `src/identity-conflicts.ts`（contracts SSOT — shared 依存禁止）

```ts
import { z } from 'zod';

export const MergeIdentityRequestZ = z.object({
  targetMemberId: z.string(),
  sourceMemberId: z.string(),
  strategy: z.enum(['merge_profile', 'keep_separate']),
});

export const DismissIdentityConflictRequestZ = z.object({
  reason: z.string().min(1).max(500),
});

export const IdentityConflictItemZ = z.object({
  conflictId: z.string(),
  sourceMemberId: z.string(),
  candidateTargetMemberId: z.string(),
  matchedFields: z.array(z.enum(['name', 'affiliation'])),
  detectedAt: z.string().datetime(),
  responseEmailMasked: z.string(),
  syncJobId: z.string().nullable(),
});
export const IdentityConflictListZ = z.object({
  items: z.array(IdentityConflictItemZ),
  total: z.number().int().nonnegative(),
});

export const MergeIdentityResponseZ = z.object({
  targetMemberId: z.string(),
  archivedSourceMemberId: z.string(),
  mergedAt: z.string().datetime(),
  auditId: z.string(),
});

export const DismissIdentityConflictResponseZ = z.object({
  dismissedAt: z.string().datetime(),
});
```

### `src/fixtures.ts`（AC-4 canonical seed）

```ts
export const fixtures = {
  me: {
    meResponse: {
      memberId: 'm-1',
      email: 'taro@example.com',
      isAdmin: false,
      ubmZone: 'Kobe' as const,
      ubmMembershipType: 'regular' as const,
    },
    meProfileResponse: { /* ... */ },
  },
  public: {
    negativeQuery: 'zzz_no_match_zzz',
    memberList: {
      items: [
        { memberId: 'm-1', fullName: '山田 太郎', nickname: 'taro', ubmZone: 'Kobe' as const,
          ubmMembershipType: 'regular' as const, occupation: 'エンジニア' },
        { memberId: 'm-2', fullName: '佐藤 花子', nickname: 'hana', ubmZone: 'Himeji' as const,
          ubmMembershipType: 'honorary' as const, occupation: '医師' },
        { memberId: 'm-3', fullName: '鈴木 次郎', nickname: null, ubmZone: 'Himeji' as const,
          ubmMembershipType: 'regular' as const, occupation: '教員' },
      ],
      total: 3,
    },
    stats: { /* ... */ },
    formPreview: { /* ... */ },
  },
  admin: {
    tagFacets: ['ABC法', 'DEF法'] as const,
    memberList: { /* total: 3 / 同 items */ },
    dashboard: { /* unresolvedSchema 等 */ },
    auditList: { items: [], total: 0 },
    /* ... 他 admin endpoint 用 */
  },
  identityConflicts: {
    list: {
      items: [
        { conflictId: 'cf_001', sourceMemberId: 'm_src_01', candidateTargetMemberId: 'm_dst_01',
          matchedFields: ['name', 'affiliation'] as const,
          detectedAt: '2026-05-08T00:00:00Z', responseEmailMasked: 't***@example.com', syncJobId: 'sync_001' },
        { conflictId: 'cf_002', sourceMemberId: 'm_src_02', candidateTargetMemberId: 'm_dst_02',
          matchedFields: ['name'] as const,
          detectedAt: '2026-05-08T01:00:00Z', responseEmailMasked: 'h***@example.com', syncJobId: null },
      ],
      total: 2,
    },
    mergeRequest: { targetMemberId: 'm_dst_01', reason: 'duplicate' },
    mergeResponse: {
      targetMemberId: 'm_dst_01', archivedSourceMemberId: 'm_src_01',
      mergedAt: '2026-05-09T00:00:00Z', auditId: 'aud_merge_001',
    },
    dismissRequest: { reason: 'false-positive' },
    dismissResponse: { dismissedAt: '2026-05-09T00:00:00Z' },
  },
};
```

不変条件（AC-4）:

| 不変条件 | チェック式 |
|---------|-----------|
| members 3 件 | `fixtures.public.memberList.items.length === 3` |
| zone 2 種 | `new Set(items.map(m => m.ubmZone)).size === 2` |
| membership 2 種 | `new Set(items.map(m => m.ubmMembershipType)).size === 2` |
| negative query | `fixtures.public.negativeQuery === 'zzz_no_match_zzz'` |
| tag facet 2 種 | `fixtures.admin.tagFacets.length === 2` |

### `src/index.ts`

```ts
export * as schemas from './schemas';
// schemas namespace に各 *Z を集約
export { fixtures } from './fixtures';
```

`schemas.ts` aggregator:

```ts
export * from './me';
export * from './public';
export * from './admin';
export * from './identity-conflicts';
```

---

## Concern B: `scripts/e2e-mock-api.mjs` 拡張

### 変更対象

| パス | 種別 | 行数目安 |
|------|------|---------|
| `scripts/e2e-mock-api.mjs` | 編集（463 → 700-900 行） | +250-450 |

### topology 変更

1. **冒頭 import 追加**

```js
import { schemas, fixtures } from '@ubm-hyogo/contracts';
```

> Node 24 の native ESM + pnpm workspace で `@ubm-hyogo/contracts` の `exports."."` から `dist/index.js` を解決する。Phase 5 で `pnpm install` 後 `pnpm --filter @ubm-hyogo/contracts build` を一度走らせる（Phase 6 実行手順 §1 末尾で実施）。

2. **`safeJson` ラッパー新設**

```js
const safeJson = (res, status, body, schema) => {
  if (schema) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      res.writeHead(500, { 'content-type': 'application/json', ...CORS_HEADERS });
      res.end(JSON.stringify({ error: 'mock_schema_violation', zodIssues: parsed.error.issues }));
      return;
    }
  }
  res.writeHead(status, { 'content-type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(body));
};
```

3. **dispatcher 既存行を `safeJson` 経由に置換**

| 既存（抜粋） | 置換後 |
|-------------|--------|
| `json(res, 200, buildMe())` | `safeJson(res, 200, buildMe(), schemas.MeResponseZ)` |
| `json(res, 200, { items: [...] })` (`/public/members`) | `safeJson(res, 200, fixtures.public.memberList, schemas.PublicMemberListZ)` |
| `json(res, 200, {})` (`/admin/tags/queue`) | `safeJson(res, 200, { items: [], total: 0 }, schemas.AdminTagQueueZ)` |

4. **新規 endpoint 追加**

```js
// /admin/identity-conflicts (GET) — fixtures 駆動
if (method === 'GET' && pathname === '/admin/identity-conflicts') {
  return safeJson(res, 200, fixtures.identityConflicts.list, schemas.IdentityConflictListZ);
}

// /admin/identity-conflicts/:id/merge (POST)
const mergeMatch = pathname.match(/^\/admin\/identity-conflicts\/([^/]+)\/merge$/);
if (method === 'POST' && mergeMatch) {
  const body = await readBody(req);
  const parsed = schemas.MergeIdentityRequestZ.safeParse(body);
  if (!parsed.success) {
    return safeJson(res, 400, { error: 'invalid_body', zodIssues: parsed.error.issues });
  }
  return safeJson(res, 200, fixtures.identityConflicts.mergeResponse, schemas.MergeIdentityResponseZ);
}

// /admin/identity-conflicts/:id/dismiss (POST)
const dismissMatch = pathname.match(/^\/admin\/identity-conflicts\/([^/]+)\/dismiss$/);
if (method === 'POST' && dismissMatch) {
  const body = await readBody(req);
  const parsed = schemas.DismissIdentityConflictRequestZ.safeParse(body);
  if (!parsed.success) {
    return safeJson(res, 400, { error: 'invalid_body', zodIssues: parsed.error.issues });
  }
  return safeJson(res, 200, fixtures.identityConflicts.dismissResponse, schemas.DismissIdentityConflictResponseZ);
}

// PATCH /admin/members/:id
const memberPatchMatch = pathname.match(/^\/admin\/members\/([^/]+)$/);
if (method === 'PATCH' && memberPatchMatch) {
  await readBody(req);
  return safeJson(res, 200, fixtures.admin.memberPatchResponse, schemas.AdminMemberPatchResponseZ);
}

// GET /admin/audit
if (method === 'GET' && pathname === '/admin/audit') {
  return safeJson(res, 200, fixtures.admin.auditList, schemas.AdminAuditListZ);
}
```

5. **`{ok:true}` fallthrough 廃止**

```js
// 旧:
// return json(res, 200, { ok: true });
// 新:
return safeJson(res, 404, { error: 'not_found', method, pathname });
```

6. **`/health` は parse 対象外**（contract test では string match のみ）

```js
if (method === 'GET' && pathname === '/health') {
  return safeJson(res, 200, { status: 'ok', ts: NOW });
}
```

7. **既存 test hook 維持**: `POST /__test__/reset` / `POST /__test__/seed-pending` / `POST /__test__/admin-dashboard` の挙動は変更しない（AC-6 既存 E2E green 維持）

### dispatcher chain 順序の不変条件

- 既存の `pathname ===` 系完全一致 → `pathname.startsWith` 系の順序は変えない
- 新規追加 endpoint は **完全一致と startsWith の間** に挿入する（fallthrough 404 の手前）

---

## Concern C: `scripts/__tests__/e2e-mock-api.contract.spec.ts` GREEN 化

Phase 4 で作成した RED test を以下手順で GREEN にする:

```bash
# packages/contracts を build（mock が dist/ を import するため）
mise exec -- pnpm --filter @ubm-hyogo/contracts build

# contract spec 単独実行
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts \
  --coverage --reporter=verbose 2>&1 | tee /tmp/phase-6-contract.log
```

期待:
- 全 23 endpoint + `/health` + 異常系 GREEN
- Vitest coverage report で `scripts/e2e-mock-api.mjs` / `packages/contracts/src/**` が ≥80%

### coverage 不足時の追加テスト方針

| 不足箇所 | 追加テスト |
|---------|-----------|
| `safeJson` の parse 失敗分岐 | mock を直接単体起動し、意図的に schema を破る body で parse 失敗 → 500 を別ケースで assert |
| dispatcher 404 分岐 | 未定義 path / method 組合せを 2-3 件 assert |
| fixtures.* の各 leaf | `packages/contracts/src/index.spec.ts` で各 leaf を 1 ケース parse |

---

## Concern D: `.github/workflows/e2e-tests.yml` patch

### 変更対象

| パス | 種別 | 行数目安 |
|------|------|---------|
| `.github/workflows/e2e-tests.yml` | 編集 | +18-25 行 |

### patch 内容（Phase 2 §Concern D を確定）

```yaml
      - name: Start deterministic mock API
        run: node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &

      - name: Wait for mock API readiness
        run: |
          for i in $(seq 1 30); do
            if curl -sf http://127.0.0.1:8787/health; then
              echo "mock API ready (attempt=$i)"
              exit 0
            fi
            sleep 1
          done
          echo "mock API not ready after 30s"
          cat /tmp/e2e-mock-api.log || true
          exit 1

      # ... 既存 Playwright 実行 step ...

      - name: Upload mock API log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-mock-api-log-${{ matrix.project || github.job }}-${{ github.sha }}
          path: /tmp/e2e-mock-api.log
          retention-days: 7
```

検証:

```bash
# actionlint があれば
mise exec -- pnpm exec actionlint .github/workflows/e2e-tests.yml || true

# yaml 構文
mise exec -- pnpm exec yaml-lint .github/workflows/e2e-tests.yml || python3 -c "import yaml,sys;yaml.safe_load(open('.github/workflows/e2e-tests.yml'))"
```

---

## 実行手順（Phase 6 全体）

```bash
# 1. Concern A: contracts 本体実装
#    （上記コード templates を src/*.mjs に書き出す）

# 2. contracts build
mise exec -- pnpm --filter @ubm-hyogo/contracts build

# 3. contracts unit test (Concern A 検証)
mise exec -- pnpm --filter @ubm-hyogo/contracts test

# 4. Concern B: mock 拡張
#    （scripts/e2e-mock-api.mjs を編集）

# 5. Concern C: contract test GREEN 確認
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts --coverage

# 6. Concern D: workflow patch
#    （.github/workflows/e2e-tests.yml を編集）

# 7. 全体検証
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm vitest run --coverage
bash scripts/coverage-guard.sh

# 8. 既存 E2E spec の regression 不在確認（AC-6）
node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api-phase6.log 2>&1 &
MOCK_PID=$!
for i in {1..30}; do curl -sf http://127.0.0.1:8787/health && break || sleep 1; done
mise exec -- pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium \
  apps/web/playwright/tests/task10-ui-primitives.spec.ts \
  apps/web/playwright/tests/admin-identity-conflicts.spec.ts
kill $MOCK_PID
```

## DoD（Definition of Done）

| # | DoD | 検証コマンド | 期待 |
|---|-----|------------|------|
| 1 | Phase 4 RED test が GREEN | `pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts packages/contracts` | exit 0 |
| 2 | typecheck PASS | `mise exec -- pnpm typecheck` | exit 0 |
| 3 | lint PASS | `mise exec -- pnpm lint` | exit 0 |
| 4 | coverage ≥80%（全パッケージ） | `mise exec -- pnpm vitest run --coverage` | Statements/Branches/Functions/Lines ≥80% |
| 5 | coverage-guard PASS | `bash scripts/coverage-guard.sh` | exit 0 |
| 6 | mock の `{ok:true}` fallthrough 廃止 | `grep -n "ok: true" scripts/e2e-mock-api.mjs` | 0 hit |
| 7 | mock 内 zod parse 必須化 | `grep -nE "safeJson\(" scripts/e2e-mock-api.mjs \| wc -l` | dispatcher 数と一致 |
| 8 | workflow patch 反映 | `grep -nE "Wait for mock API readiness\|upload-artifact" .github/workflows/e2e-tests.yml` | 2 hit |
| 9 | 既存 E2E spec green 維持 | `pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium` | green |
| 10 | contracts 依存境界確認 | `cat packages/contracts/package.json` + `rg -n "@ubm-hyogo/shared" packages/contracts` | dependencies は `zod` のみ / shared 参照 0 hit |

## 統合テスト連携

- contract test（Vitest）と E2E（Playwright）は同じ `packages/contracts` を import → shape drift を unit 段で先回り検出
- AC-6 regression 確認は本 Phase の DoD #9 で local 実行、Phase 11 で CI gate として再確認
- AC-5 の readiness wait は Phase 5 でローカル等価を確認済 → 本 Phase で CI step に昇格

## 多角的チェック観点（AI が判断）

- [ ] Concern A の各 zod schema が `apps/api/src/routes/**` の既存 zod 定義と field 名・型で 1:1 対応している（grep で双方確認）
- [ ] `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` は `packages/contracts` 内で定義し、`packages/contracts` から `@ubm-hyogo/shared` への参照が 0 hit
- [ ] mock の `safeJson` ラッパーが全 dispatcher 経路に適用され、`{ok:true}` の fallthrough が grep で 0 hit
- [ ] 未定義 path/method で 404 が返り、200 fallthrough が起きない
- [ ] 新 endpoint 追加で既存 dispatcher chain の **先頭から完全一致順序** が変わっていない（AC-6）
- [ ] CI workflow の readiness wait timeout（30 秒）が Playwright step の timeout より十分短い
- [ ] `upload-artifact@v4` の `name` が matrix project ごとに unique（GHA v4 の同名禁止に抵触しない）
- [ ] coverage threshold は root `vitest.config.ts` / coverage guard 経路で確認されている
- [ ] mock の native ESM import は `packages/contracts/src/index.mjs` 直参照で、build step 不要で解決する点が手順に明記されている

## サブタスク管理

| サブタスク | Concern | 完了確認 |
|-----------|---------|---------|
| contracts 実体（schema + fixtures） | A | DoD #1, #4 |
| mock 拡張（safeJson + 新 endpoint + 404 化） | B | DoD #6, #7 |
| contract test GREEN | C | DoD #1 |
| workflow patch | D | DoD #8 |

並列実行可（Concern A → B/C は順序依存、D は独立）。

## 成果物

| 種別 | パス |
|------|------|
| コード | `packages/contracts/src/index.mjs`（編集） |
| コード | `packages/contracts/src/me.mjs`（新規） |
| コード | `packages/contracts/src/public.mjs`（新規） |
| コード | `packages/contracts/src/admin.mjs`（新規） |
| コード | `packages/contracts/src/identity-conflicts.mjs`（新規） |
| コード | `packages/contracts/src/fixtures.mjs`（新規） |
| コード | `scripts/e2e-mock-api.mjs`（編集・拡張） |
| コード | `.github/workflows/e2e-tests.yml`（編集） |
| ドキュメント | `outputs/phase-6/green-evidence.md`（GREEN 実行ログ） |
| ドキュメント | `outputs/phase-6/coverage-report.md`（coverage ≥80% 実測） |
| ドキュメント | `outputs/phase-6/regression-evidence.md`（既存 E2E spec green 確認） |
| ドキュメント | `outputs/phase-6/dod-checklist.md`（DoD #1-10 実測） |

## 完了条件

- [ ] DoD #1-10 すべて PASS
- [ ] Phase 4 RED test が全 GREEN
- [ ] `mise exec -- pnpm typecheck` exit 0
- [ ] `mise exec -- pnpm lint` exit 0
- [ ] coverage Statements >=80%, Branches >=80%, Functions >=80%, Lines >=80%（apps/api / apps/web / packages/* 全パッケージ）
- [ ] `bash scripts/coverage-guard.sh` exit 0
- [ ] AC-1 〜 AC-7 全充足（`outputs/phase-6/dod-checklist.md` に AC 単位の evidence link）
- [ ] contracts 依存境界（`zod` のみ / `@ubm-hyogo/shared` 参照 0 hit）を確認
- [ ] 既存 E2E spec（task10-ui-primitives / admin-identity-conflicts）が local 実行で green

## タスク100%実行確認【必須】

- [ ] Concern A-D 全 4 領域実装完了
- [ ] 実行手順 1-8 完走
- [ ] 成果物 12 件作成（コード 8 / ドキュメント 4）
- [ ] DoD #1-10 すべて実測ログ付きで記録
- [ ] regression evidence（既存 E2E green）を `outputs/phase-6/regression-evidence.md` に保存

## 次 Phase

Phase 7: コードレビュー（self-review + 観点別チェック / Concern A-D 横断 / contracts 依存境界確認）

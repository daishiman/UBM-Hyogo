# Phase 2: 設計（target topology / validation matrix / dependency matrix）

## メタ情報

| key | value |
|-----|-------|
| Phase | 2 |
| Phase Name | 設計 |
| 作成日 | 2026-05-14 |
| 前 Phase | 1 |
| 次 Phase | 3 |

## 目的

`packages/contracts/` の package 構造、mock 拡張の internal topology、CI workflow patch 範囲を設計確定する。concern 数は 4 のため同一ファイル内セクション分割（`phase-template-core.md` 推奨）。

## 既存実装検査ゲート（再確認）

| 対象 | 分類 | 根拠 |
|------|------|------|
| `scripts/e2e-mock-api.mjs` | 既存 hardening | 463 行・dispatcher chain あり |
| `packages/contracts/` | greenfield | `ls packages/` で不在確認 |
| `scripts/__tests__/` | greenfield | `find` で不在 |
| `.github/workflows/e2e-tests.yml` | 既存 patch | L42-43 mock 起動行のみ存在 |

Phase 3 ラベル: **`existing-hardening`**。RED の意味 = 「既存コードが新規 AC を満たさない」。

## CI workflow 実在確認ゲート

```bash
ls .github/workflows/e2e-tests.yml .github/workflows/ci.yml
grep -nE "pnpm test|vitest" .github/workflows/ci.yml
```

| Workflow | 役割 | canonical owner |
|----------|------|-----------------|
| `e2e-tests.yml` | E2E + mock 起動 | 本 task で patch（readiness wait + log artifact） |
| `ci.yml` 中の test job | Vitest 実行 | 本 task で contract test を root `pnpm test` 経路へ組込 |

dependency matrix owner / co-owner（**Phase 2 並列 wave 必須**）:

| 共有モジュール | 用途 | owner | co-owner | 同期タイミング |
|--------------|------|-------|----------|--------------|
| `packages/contracts/src/*.mjs` | API/mock/web 共通 zod | 本 workflow | apps/api / apps/web（参照のみ） | 同 PR 内 |
| `packages/contracts/src/fixtures.mjs` | seed canonical | 本 workflow | mock + contract test 双方 | 同 PR 内 |
| `scripts/e2e-mock-api.mjs` | mock 実装 | 本 workflow | apps/web/playwright | 同 PR 内 |

並列 wave なし（single-task workflow）だが、`packages/contracts/` は将来 `apps/api` 側 zod を集約する余地があるため owner を明示。

## Concern 構成（同一ファイル内 4 concern）

### Concern A: `packages/contracts/` package 設計

```
packages/contracts/
├── package.json              # name: @ubm-hyogo/contracts
├── tsconfig.json             # extends pnpm workspace base
├── src/*.mjs                 # plain ESM direct exports
├── src/
│   ├── index.mjs             # named export aggregator
│   ├── me.mjs                # MeResponseZ, MeProfileResponseZ, VisibilityRequestBodyZ, DeleteRequestBodyZ ...
│   ├── public.mjs            # PublicStatsZ, PublicMemberListZ, PublicMemberDetailZ, PublicFormPreviewZ ...
│   ├── admin.mjs             # AdminDashboardZ, AdminMemberListZ, AdminMemberDetailZ, AdminMeetingsZ, AdminRequestsZ, AdminAuditZ ...
│   ├── identity-conflicts.mjs # IdentityConflictListZ, MergeIdentityRequestZ, MergeIdentityResponseZ, DismissIdentityConflictRequestZ ...
│   ├── fixtures.mjs          # canonical seed (member 3 / zone 2 / membership 2 / negative case / tag facet 2)
│   └── index.spec.ts         # zod self-test
```

- pnpm workspace に追加: `pnpm-workspace.yaml` の `packages` glob に `packages/contracts` が含まれることを `cat pnpm-workspace.yaml` で確認
- 依存: `zod` のみ（runtime）。apps / shared への依存なし
- `apps/api` / `apps/web` の `package.json#dependencies` に `@ubm-hyogo/contracts: workspace:*` を追加
- 既存 `packages/shared/src/zod/identity.ts` の `MergeIdentityRequestZ` / `DismissIdentityConflictRequestZ` と同じ契約を `packages/contracts/src/identity-conflicts.mjs` に移し、後方互換が必要な場合は shared 側から contracts を re-export する。`contracts -> shared` 依存は禁止（contracts の SSOT 化と `zod` のみ依存を両立するため）。

### Concern B: `scripts/e2e-mock-api.mjs` 拡張 topology

現 dispatcher chain（`if (method && pathname) return json(...)`）を維持しつつ次を導入:

1. `import { schemas, fixtures } from '@ubm-hyogo/contracts'` を mock 冒頭に追加
2. dispatcher 行ごとに `safeJson(res, status, body, schema)` ラッパー経由で返却。`safeJson` 内で `schema.parse(body)` → 失敗時 HTTP 500 + zod issue
3. endpoint 追加: merge / dismiss / admin/members PATCH / admin/identity-conflicts list（fixture 駆動）/ admin/audit list / public/form-preview 拡張
4. seed source は `fixtures` のみ。inline literal による member 定義は廃止
5. test hook: `POST /__test__/reset` / `POST /__test__/seed-pending` / `POST /__test__/admin-dashboard` は維持
6. `/health` は parse 対象外（contract test では string match のみ）

### Concern C: 契約テスト topology

```
scripts/__tests__/e2e-mock-api.contract.spec.ts
```

- Vitest（既存 `vitest.config.ts` または scripts 専用 vitest.config を新設）
- `beforeAll`: `child_process.spawn('node', ['scripts/e2e-mock-api.mjs'], { env: { E2E_MOCK_API_PORT: '38787' } })` で別ポート起動
- `afterAll`: `kill -SIGTERM`
- `beforeEach`: `POST /__test__/reset` で state 初期化
- 各 endpoint について `fetch` → `response.json()` → `schema.parse(json)` を `expect(() => ...).not.toThrow()`
- 異常系: 不正 path / 不正 method で `404` を assert
- POST `/admin/identity-conflicts/:id/merge` で `MergeIdentityRequestZ` を満たさない body を送り `400` or `500` を assert（mock 側 request body validation の確認）

vitest 既存 config:

```bash
find . -path ./node_modules -prune -o -name "vitest.config.*" -print
```

`.github/workflows/ci.yml` が root `pnpm test` を実行する前提で、Vitest glob に `scripts/**/*.spec.ts` と `packages/contracts/**/*.spec.ts` を含める。含まれない場合は `ci.yml` の既存 test job に明示ステップを追加する。

### Concern D: `.github/workflows/e2e-tests.yml` patch 範囲

現 L42-43:

```yaml
      - name: Start deterministic mock API
        run: node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &
```

patch 後（差分 6-12 行）:

```yaml
      - name: Start deterministic mock API
        run: node scripts/e2e-mock-api.mjs > /tmp/e2e-mock-api.log 2>&1 &

      - name: Wait for mock API readiness
        run: |
          for i in {1..30}; do
            if curl -sf http://127.0.0.1:8787/health; then
              echo "mock API ready"; exit 0
            fi
            sleep 1
          done
          echo "mock API not ready"; cat /tmp/e2e-mock-api.log; exit 1
      # ... existing steps ...

      - name: Upload mock API log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-mock-api-log-${{ matrix.project }}-${{ github.sha }}
          path: /tmp/e2e-mock-api.log
          retention-days: 7
```

## Validation matrix（command 単位）

| 検証対象 | command | 期待 | 実行 Phase |
|---------|---------|------|-----------|
| typecheck | `mise exec -- pnpm typecheck` | exit 0 | 6 / 9 |
| lint | `mise exec -- pnpm lint` | exit 0 | 6 / 9 |
| contracts unit | `mise exec -- pnpm --filter @ubm-hyogo/contracts test` | exit 0 / coverage ≥80% | 6 / 9 |
| mock contract test | `mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts` | exit 0 | 6 / 9 |
| coverage guard | `bash scripts/coverage-guard.sh` | exit 0 | 9 / 11 |
| E2E regression | `pnpm --filter @ubm-hyogo/web e2e --project=desktop-chromium` | green | 11 |
| workflow YAML lint | `mise exec -- pnpm exec actionlint .github/workflows/e2e-tests.yml`（actionlint があれば） | exit 0 | 6 |
| readiness wait dry-run | local で `node scripts/e2e-mock-api.mjs &` → `curl -sf .../health` | 200 | 11 |

## 仕様語 ↔ 実装語 対応表

| 仕様語 | 実装語 | 追従対象 |
|-------|-------|---------|
| 契約 schema | `*Z` 接尾辞の zod schema | `packages/contracts/src/*.mjs` |
| seed canonical | `fixtures.*` namespace | `packages/contracts/src/fixtures.mjs` |
| readiness wait | `curl --retry`（または bash loop） | `.github/workflows/e2e-tests.yml` |
| log artifact | `actions/upload-artifact@v4` step | 同上 |

## DI 境界の型配置判断

| Factory / 型 | 注入先 | 配置 |
|-------------|--------|------|
| `MergeIdentityRequestZ` | `apps/api` / `apps/web` / mock 3 拠点 | `packages/contracts/` に集約 |
| `fixtures` 構造 | mock + contract test 2 拠点 | `packages/contracts/src/fixtures.mjs` |
| mock 内部 `safeJson` ラッパー | mock 1 ファイル内のみ | `scripts/e2e-mock-api.mjs` 内 |

## 統合テスト連携

- contract test は Vitest（unit テスト境界）
- E2E regression は Playwright（既存 workflow）
- 両者で同じ `packages/contracts` を import することで shape drift を unit 段で先回り検出

## 多角的チェック観点（AI が判断）

- [ ] `packages/contracts/` の owner / co-owner 列が dependency matrix に存在
- [ ] 既存 `packages/shared/src/zod/identity.ts` の export 経路を破壊しない（re-export 戦略）
- [ ] mock の dispatcher chain 順序を変更しない（既存 E2E spec の green 維持）
- [ ] readiness wait timeout が CI step timeout より十分短い（30 秒 vs 6+ 分）
- [ ] Phase 4 開始 gate（Phase 1-3 完走）が本 phase に明記されている

## サブタスク管理

なし（concern A-D は同一 phase 内）

## 成果物

- `outputs/phase-2/design.md`（concern A-D 統合）
- `outputs/phase-2/dependency-matrix.md`
- `outputs/phase-2/validation-matrix.md`

## 完了条件

- [ ] concern A-D すべてに具体的な実装パス・型シグネチャ・差分行数目安が記載
- [ ] validation matrix が 8 command すべて記載
- [ ] dependency matrix に owner / co-owner 明記
- [ ] 仕様語 ↔ 実装語 対応表完成
- [ ] Phase 4 開始 gate 重複明記（本 phase / Phase 1 / Phase 3）

## タスク100%実行確認【必須】

- [ ] concern A-D 全完了
- [ ] validation matrix 全 command 確認
- [ ] 成果物 3 ファイル作成

## 次 Phase

Phase 3: 設計レビュー（ready / minor / major / no-go 判定）

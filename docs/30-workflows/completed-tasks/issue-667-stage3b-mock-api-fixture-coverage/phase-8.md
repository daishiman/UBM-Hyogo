# Phase 8: パフォーマンス / 非機能要件確認

## メタ情報

| key | value |
|-----|-------|
| Phase | 8 |
| Phase Name | パフォーマンス / 非機能要件確認 |
| 作成日 | 2026-05-14 |
| 前 Phase | 7 |
| 次 Phase | 9 |
| visualEvidence | NON_VISUAL |
| 実装区分 | 実装仕様書 |
| 関連 AC | AC-5 / AC-7（非機能側面） |

## 目的

mock startup / contract test 実行時間 / メモリフットプリント / readiness wait 実測 / log artifact サイズが CI feedback loop を劣化させないことを定量検証する。リファクタリングは「動作を変えない範囲」で性能 regression のみ最小修正する。

## 非機能要件 targets

| # | 指標 | target | 計測コマンド | 失敗時対処 |
|---|------|--------|-------------|-----------|
| NFR-1 | mock startup time | **< 3 秒**（CI step timeout 6 分の 1% 未満） | `time node scripts/e2e-mock-api.mjs &`（`/health` 200 までの実測） | dispatcher 順序最適化 / require 段数削減 |
| NFR-2 | contract test 全体実行時間 | **< 30 秒**（CI feedback loop 維持） | `time pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts` | テスト数削減ではなく `beforeEach` の reset cost 確認 |
| NFR-3 | mock メモリフットプリント（起動直後） | `process.memoryUsage().heapUsed` **< 50MB** | `/__test__/metrics` または mock 内 startup log で出力 | fixture サイズ確認 / unused import 削除 |
| NFR-4 | readiness wait 総時間 | **≤ 30 秒**（curl `--retry 5 --retry-delay 1` または bash loop 30 回） | `time bash -c 'for i in {1..30}; do curl -sf .../health && break; sleep 1; done'` | mock 内部の sync I/O 削除 |
| NFR-5 | log artifact サイズ | **< 1MB**（retention 7 日で問題ない範囲） | `wc -c /tmp/e2e-mock-api.log` を CI 実行 1 回後に確認 | mock 内 `console.log` 不要出力削除 |
| NFR-6 | endpoint 1 件あたり parse latency | **< 5ms / req**（heuristic） | spec 内 `performance.now()` で 100 req loop 計測 | zod schema 構造の `.lazy()` / `.strict()` 過剰使用確認 |

## 実行タスク

1. mock startup time を実測し NFR-1 を判定
2. contract test 実行時間を実測し NFR-2 を判定
3. mock メモリフットプリントを計測し NFR-3 を判定
4. readiness wait の総時間を CI と同等条件で実測し NFR-4 を判定
5. log artifact サイズを実測し NFR-5 を判定
6. endpoint 1 件あたり parse latency を heuristic 計測し NFR-6 を判定
7. NFR target を割り込む場合、最小差分で性能 regression 修正（dispatcher 順序最適化 / 不要 `console.log` 削除）
8. 計測結果を `outputs/phase-8/perf-report.md` に集約

## 参照資料

- `phase-7.md`（contract spec 実装 / globalSetup）
- `scripts/e2e-mock-api.mjs`（Phase 6 実装後）
- `.github/workflows/e2e-tests.yml`（Concern D 適用後）
- `.claude/skills/task-specification-creator/references/quality-standards.md`

## 実行手順

### 1. mock startup time（NFR-1）

```bash
# シンプル計測
PORT=38787
time (
  node scripts/e2e-mock-api.mjs > /tmp/perf-mock.log 2>&1 &
  PID=$!
  while ! curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null; do sleep 0.1; done
  echo "ready"
  kill -SIGTERM "$PID"
) 2>&1 | tee outputs/phase-8/startup-time.txt
```

期待: `real < 3.000s`。`/health` 200 までの wall-clock time を採用。

### 2. contract test 実行時間（NFR-2）

```bash
time mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts \
  2>&1 | tee outputs/phase-8/contract-test-time.txt
```

期待: `real < 30.000s`。

### 3. mock メモリフットプリント（NFR-3）

mock 内 startup 直後の log:

```js
// scripts/e2e-mock-api.mjs 末尾（startup 完了時）
const mem = process.memoryUsage();
console.log(`[mock-api] heapUsed=${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB rss=${(mem.rss / 1024 / 1024).toFixed(2)}MB`);
```

実測:

```bash
node scripts/e2e-mock-api.mjs > /tmp/perf-mem.log 2>&1 &
sleep 1
grep heapUsed /tmp/perf-mem.log
kill %1
```

期待: `heapUsed < 50MB`。

### 4. readiness wait 実測（NFR-4）

```bash
node scripts/e2e-mock-api.mjs > /tmp/perf-wait.log 2>&1 &
time bash -c '
  for i in {1..30}; do
    if curl -sf http://127.0.0.1:8787/health; then
      echo ready after $i tries; break
    fi
    sleep 1
  done
'
kill %1
```

期待: `real ≤ 3s`（mock startup が早ければ 1-2 retry で抜ける）。最悪値 30 秒以内。

### 5. log artifact サイズ（NFR-5）

```bash
# contract test 1 回実行後の log サイズ
mise exec -- pnpm vitest run scripts/__tests__/e2e-mock-api.contract.spec.ts > /dev/null
wc -c /tmp/e2e-mock-api.log 2>/dev/null || echo "log file pattern depends on CI"
```

期待: `< 1_000_000` bytes (1MB)。超過する場合 mock 内 verbose log を絞る。

### 6. parse latency heuristic（NFR-6）

spec に追加（perf-only。production 実行では `it.skip` で良い）:

```ts
// scripts/__tests__/e2e-mock-api.perf.spec.ts（任意）
import { describe, it, expect } from 'vitest';
import { PublicMemberListZ } from '@ubm-hyogo/contracts';

const BASE = `http://127.0.0.1:${process.env.E2E_MOCK_API_PORT ?? '38787'}`;

describe.skip('perf (manual only)', () => {
  it('avg /public/members parse < 5ms', async () => {
    const N = 100;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      const r = await fetch(`${BASE}/public/members`);
      PublicMemberListZ.parse(await r.json());
    }
    const avg = (performance.now() - t0) / N;
    expect(avg).toBeLessThan(50); // network 込で 50ms。pure parse は <5ms 想定
  });
});
```

### 7. regression 対処方針

| 症状 | 対処 |
|------|------|
| startup > 3s | top-level `require`/`import` の段数確認。`packages/contracts` の barrel が重い場合は named import に変更 |
| contract test > 30s | `beforeEach` reset の中で `fetch` を直列実行している箇所を確認。テストグループ単位 reset に切替 |
| heapUsed > 50MB | fixture 内の重複オブジェクト確認。zod schema を `.lazy()` で循環していないか |
| readiness > 30s | mock 起動 banner より前に sync I/O（`fs.readFileSync`）が無いか |
| log > 1MB | 各 endpoint の request log を `process.env.MOCK_VERBOSE` ガード |

## 統合テスト連携

- 本 Phase の計測値（NFR-1..NFR-6）を `outputs/phase-8/perf-report.md` に固定
- Phase 9（品質）で coverage / lint / typecheck と並列で本 Phase の数値を再確認
- Phase 11（regression）で実 CI 実行時の log artifact サイズと NFR-5 を突合

## 多角的チェック観点（AI が判断）

- [ ] 計測手法が deterministic（cold start / warm start を区別）か
- [ ] 計測値が CI ランナー (`ubuntu-latest`) と local mac で oversize ずれていないか（CI 計測も別途取得）
- [ ] perf-only spec が CI 通常実行に影響しない (`describe.skip` または別 config) か
- [ ] regression 対処方針が**振る舞いを変えない**範囲に限定されているか（AC-1..AC-7 の semantics を壊さない）
- [ ] log redaction（NFR-5 対処）で PII 化された値が新たに出ていないか

## サブタスク管理

| ID | サブタスク | 状態 |
|----|-----------|------|
| ST-8-1 | NFR-1..NFR-6 実測 | 未着手 |
| ST-8-2 | regression 発生時の最小修正 | 未着手 |
| ST-8-3 | perf-report.md 作成 | 未着手 |

## 成果物

- `outputs/phase-8/perf-report.md`（NFR-1..NFR-6 実測値・判定・regression 修正履歴）
- `outputs/phase-8/startup-time.txt`
- `outputs/phase-8/contract-test-time.txt`
- （任意）`scripts/__tests__/e2e-mock-api.perf.spec.ts`

## 完了条件（coverage AC 必須）

- [ ] NFR-1: mock startup time < 3s
- [ ] NFR-2: contract test 実行 < 30s
- [ ] NFR-3: heapUsed < 50MB
- [ ] NFR-4: readiness wait ≤ 30s
- [ ] NFR-5: log artifact < 1MB
- [ ] NFR-6: parse latency < 5ms / req（heuristic）
- [ ] Phase 7 の coverage ≥80% が本 Phase の最小差分修正で劣化していないこと
- [ ] `outputs/phase-8/perf-report.md` に全 NFR 実測値が記録されている

## タスク100%実行確認【必須】

- [ ] 実行手順 1-7 全完了
- [ ] サブタスク ST-8-1..ST-8-3 全完了
- [ ] NFR target 全件 PASS（または regression 修正後再計測で PASS）
- [ ] 成果物 3 件作成済み

## 次 Phase

Phase 9: 品質検証（typecheck / lint / coverage / coverage-guard / actionlint / E2E regression）

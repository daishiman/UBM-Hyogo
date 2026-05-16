# Phase 5: 実装

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 5 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 5 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-05/main.md

## 完了条件

- [x] Phase 5 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 05 — 実装ランブック

[実装区分: 実装仕様書]

## 編集対象ファイル

| ファイル | 操作 | 概要 |
| --- | --- | --- |
| `scripts/smoke/tag-queue-race.mjs` | 新規作成 | Phase 02 設計のとおり実装。Node 24 ESM、no-deps（標準 `fetch` のみ）|
| `scripts/smoke/__tests__/tag-queue-race.test.sh` | 新規作成 | Phase 04 case 1〜4 |
| `scripts/smoke/README.md` | 追記 or 新規 | 使い方・staging 前提・evidence path |

## 実装順序

1. `tag-queue-race.mjs` のスケルトン（`parseArgs` / `--dry-run` / `--analyze-only`）
2. `analyzeResults` 実装 + shell test case 2..4 で確認
3. `--dry-run` 出力 + shell test case 1 で確認
4. `buildPayload` / `runConcurrentResolve` / `writeEvidence` / `main` 実装
5. `redact` 実装と stdout/evidence からの cookie 漏洩テスト（手動目視）
6. `scripts/smoke/README.md` 追記

## 擬似コード

```js
// scripts/smoke/tag-queue-race.mjs
#!/usr/bin/env node
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

function parseArgs(argv) {
  const opts = { concurrency: 5, action: 'confirmed' };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    switch (k) {
      case '--env': opts.env = v; i++; break;
      case '--queue-id': opts.queueId = v; i++; break;
      case '--concurrency': opts.concurrency = Number(v); i++; break;
      case '--base-url': opts.baseUrl = v; i++; break;
      case '--session-cookie': opts.sessionCookie = v; i++; break;
      case '--action': opts.action = v; i++; break;
      case '--tag-codes': opts.tagCodes = v.split(','); i++; break;
      case '--reason': opts.reason = v; i++; break;
      case '--out': opts.out = v; i++; break;
      case '--dry-run': opts.dryRun = true; break;
      case '--analyze-only': opts.analyzeOnly = true; break;
      case '--input': opts.input = v; i++; break;
    }
  }
  return opts;
}

function buildPayload(opts) {
  return opts.action === 'rejected'
    ? { action: 'rejected', reason: opts.reason }
    : { action: 'confirmed', tagCodes: opts.tagCodes ?? [] };
}

async function runConcurrentResolve(opts, fetchImpl = fetch) {
  const url = `${opts.baseUrl}/admin/tags/queue/${opts.queueId}/resolve`;
  const payload = buildPayload(opts);
  const tasks = Array.from({ length: opts.concurrency }, (_, i) => async () => {
    const startedAt = new Date().toISOString();
    const t0 = performance.now();
    try {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: opts.sessionCookie },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.json().catch(() => ({}));
      return { index: i, status: res.status, body, latencyMs: performance.now() - t0,
               startedAt, finishedAt: new Date().toISOString() };
    } catch (e) {
      return { index: i, status: 0, body: { error: 'network', message: String(e) },
               latencyMs: performance.now() - t0, startedAt,
               finishedAt: new Date().toISOString() };
    }
  });
  return Promise.all(tasks.map((t) => t()));
}

function analyzeResults(results) {
  let successes = 0, raceLosts = 0, others = 0;
  for (const r of results) {
    if (r.status === 200 && r.body?.ok === true) successes++;
    else if (r.status === 409 && r.body?.error === 'race_lost') raceLosts++;
    else others++;
  }
  let verdict = 'fail', reason = '';
  if (successes === 1 && raceLosts >= 1 && others === 0) {
    verdict = 'pass'; reason = `successes==1 && raceLosts==${raceLosts}`;
  } else {
    reason = `successes=${successes} raceLosts=${raceLosts} others=${others}`;
  }
  return { successes, raceLosts, others, verdict, reason };
}

function redact(opts) { return { ...opts, sessionCookie: '***' }; }

async function writeEvidence(opts, results, analysis) {
  const out = opts.out ?? `outputs/phase-11/${new Date().toISOString().replace(/[:.]/g, '-')}/result.json`;
  await mkdir(dirname(out), { recursive: true });
  const doc = { version: 1, env: opts.env, queueId: opts.queueId, concurrency: opts.concurrency,
                action: opts.action, payload: buildPayload(opts),
                startedAt: results[0]?.startedAt, finishedAt: results.at(-1)?.finishedAt,
                results, analysis };
  await writeFile(out, JSON.stringify(doc, null, 2));
  return out;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (opts.analyzeOnly) {
    const arr = JSON.parse(await readFile(opts.input, 'utf-8'));
    const a = analyzeResults(arr);
    process.stdout.write(JSON.stringify(a));
    process.exit(a.verdict === 'fail' ? 1 : 0);
  }
  if (opts.dryRun) {
    process.stdout.write(JSON.stringify(redact(opts)));
    process.exit(0);
  }
  // 必須引数バリデーション省略（実装時に追加）
  const results = await runConcurrentResolve(opts);
  const analysis = analyzeResults(results);
  const out = await writeEvidence(opts, results, analysis);
  console.log(JSON.stringify({ verdict: analysis.verdict, out, analysis }));
  process.exit(analysis.verdict === 'fail' ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
```

## `scripts/smoke/README.md` 追記内容（30 行程度）

```md
## tag-queue-race.mjs

staging 実 D1 上で tag queue resolve workflow の race_lost 分岐を検証する smoke。

### 前提
- staging API に admin session で到達できる cookie を 1Password から取得
- staging D1 に fixture queue を 1 件作成（Phase 11 手順参照）

### 実行
node scripts/smoke/tag-queue-race.mjs \
  --env staging --queue-id q_xxx --concurrency 5 \
  --base-url https://api-staging.example \
  --session-cookie "$(op read 'op://Vault/Staging/admin_cookie')" \
  --action confirmed --tag-codes tag1

### evidence
outputs/phase-11/<ISO-ts>/result.json に並行 fetch 結果と判定を保存。
verdict=pass で exit 0、fail で exit 1、usage error / concurrency<2 / 接続不能で exit 2。
```

## DoD

- `node scripts/smoke/tag-queue-race.mjs --dry-run ...` が parsed options JSON を吐く
- `node scripts/smoke/tag-queue-race.mjs --analyze-only --input <path>` が analysis JSON を吐く
- shell test 4 case が pass

## 成果物

- `outputs/phase-05/main.md`
- `outputs/phase-05/implementation-runbook.md`

## 次 Phase

- [phase-06.md](./phase-06.md): 異常系検証

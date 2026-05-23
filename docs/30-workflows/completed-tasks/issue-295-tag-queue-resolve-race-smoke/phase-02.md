# Phase 2: 設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| taskId | issue-295-tag-queue-resolve-race-smoke |
| phase | 2 |
| status | completed |
| taskType | implementation |
| visualEvidence | NON_VISUAL |

## 目的

Issue #295 / UT-07A-03 の tag queue resolve race smoke を、local implementation と runtime_pending evidence 境界が読み違えられない形で進める。

## 実行タスク

- Phase 2 の成果物を current implementation / runtime_pending 境界に同期する。
- 関連する証跡と downstream Phase 12 compliance へ trace を残す。

## 参照資料

- docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/index.md
- scripts/smoke/tag-queue-race.mjs
- scripts/smoke/__tests__/tag-queue-race.test.sh

## 成果物

- outputs/phase-02/main.md

## 完了条件

- [x] Phase 2 の主成果物が存在する。
- [x] runtime_pending / user-gated 境界を必要箇所に明記する。

## 統合テスト連携

- この Phase の成果は focused shell test / Phase 11 NON_VISUAL evidence / Phase 12 compliance に接続する。

---

# Phase 02 — 設計

[実装区分: 実装仕様書]

## 対象ファイル

| ファイル | 種別 | 役割 |
| --- | --- | --- |
| `scripts/smoke/tag-queue-race.mjs` | 新規 | 並行 POST 実行 + 結果集計 + evidence 保存 |
| `scripts/smoke/__tests__/tag-queue-race.test.sh` | 新規 | unit-level shell test |
| `scripts/smoke/README.md` | 追記 or 新規 | runbook / 引数仕様 |

## `tag-queue-race.mjs` シグネチャ

```text
node scripts/smoke/tag-queue-race.mjs \
  --env <staging|local> \
  --queue-id <id> \
  --concurrency <n=5> \
  --base-url <url> \
  --session-cookie <cookie> \
  [--action confirmed|rejected] \
  [--tag-codes <csv>] \
  [--reason <text>] \
  [--out <path>] \
  [--side-effect-input <json>]
```

| 引数 | 型 | 必須 | 既定 | 説明 |
| --- | --- | --- | --- | --- |
| `--env` | enum | yes | — | `staging` or `local`。log redaction / out path に使う |
| `--queue-id` | string | yes | — | 並行 POST 先 queue id |
| `--concurrency` | int | no | 5 | 並行 POST 数（>=2） |
| `--base-url` | string | yes | — | 例: `https://api-staging.ubm-hyogo.example` |
| `--session-cookie` | string | yes | — | admin session cookie。stdout には redact |
| `--action` | enum | no | `confirmed` | `confirmed` or `rejected` |
| `--tag-codes` | csv | confirmedのみ必須 | — | 例: `tag1,tag2` |
| `--reason` | string | rejectedのみ必須 | — | reject reason |
| `--out` | path | no | `outputs/phase-11/<ISO-ts>/result.json` | evidence 保存先 |
| `--side-effect-input` | path | no | — | before/after SQL から作った副作用 summary。指定時は `memberTagsDelta` / `auditLogDelta` / `queueStatus` を自動判定 |

## 内部関数（純関数 / I/O 関数を分離）

| 関数 | シグネチャ | 役割 |
| --- | --- | --- |
| `parseArgs(argv)` | `(string[]) => Options` | 引数 parse + validation。不足は throw |
| `buildPayload(opts)` | `(Options) => RequestPayload` | `{ action, tagCodes?, reason? }` を生成 |
| `runConcurrentResolve(opts)` | `(Options) => Promise<Array<ResolveResult>>` | `Promise.all` で N 件 fetch、timeout 10s |
| `analyzeSideEffects(sideEffects)` | `(SideEffectEvidence?) => SideEffectAnalysis` | AC-4 の D1 副作用差分を判定 |
| `analyzeResults(results, sideEffects?)` | `(ResolveResult[], SideEffectEvidence?) => Analysis` | `{ successes, raceLosts, others, sideEffects, verdict }` |
| `writeEvidence(opts, results, analysis)` | `(Options, ResolveResult[], Analysis) => void` | `outputs/phase-11/<ts>/result.json` に JSON 書き出し |
| `redact(opts)` | `(Options) => SafeOptions` | cookie / token を `***` に置換した log 用 options |
| `main()` | `() => Promise<void>` | 上記を順に呼ぶ。`verdict !== 'pass'` なら `process.exit(1)` |

## 型（JSDoc / TS 風表記）

```ts
type Options = {
  env: 'staging' | 'local';
  queueId: string;
  concurrency: number;       // >= 2 推奨。1 は warn
  baseUrl: string;
  sessionCookie: string;     // 機密
  action: 'confirmed' | 'rejected';
  tagCodes?: string[];
  reason?: string;
  out: string;
  sideEffectInput?: string;
};

type ResolveResult = {
  index: number;
  status: number;            // HTTP status. network error 時は 0
  body: unknown;             // response JSON or { error: 'network', message }
  latencyMs: number;
  startedAt: string;         // ISO
  finishedAt: string;        // ISO
};

type Analysis = {
  successes: number;         // status===200 && body.ok===true
  raceLosts: number;         // status===409 && body.error==='race_lost'
  others: number;            // 上記以外
  networkErrors: number;     // status===0
  total: number;
  verdict: 'pass' | 'fail';
  reason: string;            // verdict 判定理由
  sideEffects: SideEffectAnalysis;
};

type SideEffectEvidence = {
  expected: { memberTagsDelta: number; auditLogDelta: number; queueStatus: 'resolved' | 'rejected' };
  actual: { memberTagsDelta: number; auditLogDelta: number; queueStatus: string };
};

type SideEffectAnalysis = {
  checked: boolean;
  verdict: 'pass' | 'fail' | 'not_checked';
  reason: string;
};
```

## verdict 判定ルール

| 条件 | verdict |
| --- | --- |
| `successes === 1 && raceLosts >= 1 && others === 0` | `pass` |
| HTTP 条件 pass + `--side-effect-input` の expected/actual が一致 | `pass` |
| 上記以外 | `fail` |

## 入出力 / 副作用

- 入力: CLI 引数のみ。`.env` 読み込まない（cookie は引数で受ける）。
- 出力: stdout に JSON summary（redact 後）、stderr に warn / error。終了コード `0=pass`, `1=fail`, `2=usage error / 接続不能`。
- 副作用: `--out` 配下に `result.json` を新規書き出し。fetch 本数 = `concurrency`。

## エラーハンドリング

- 引数不足: `parseArgs` で throw → stderr + exit 2。
- fetch timeout (10s): その request のみ `status=0, body={error:'timeout'}` として others へ。
- DNS / connect error: 同上で `body={error:'network', message}`。全件 network error の場合は exit 2（接続不能）。

## evidence JSON schema

```json
{
  "version": 1,
  "env": "staging",
  "queueId": "q_xxx",
  "concurrency": 5,
  "action": "confirmed",
  "payload": { "action": "confirmed", "tagCodes": ["tag1"] },
  "startedAt": "2026-05-15T12:00:00Z",
  "finishedAt": "2026-05-15T12:00:01Z",
  "results": [
    { "index": 0, "status": 200, "body": { "ok": true, "result": { /* ... */ } }, "latencyMs": 312, "startedAt": "...", "finishedAt": "..." },
    { "index": 1, "status": 409, "body": { "ok": false, "error": "race_lost" }, "latencyMs": 298, "startedAt": "...", "finishedAt": "..." }
  ],
  "analysis": {
    "successes": 1,
    "raceLosts": 4,
    "others": 0,
    "verdict": "pass",
    "reason": "successes==1 && raceLosts==4",
    "sideEffects": { "checked": true, "verdict": "pass" }
  }
}
```

## DoD

- 上記 6 関数の責務が単一（SRP）
- 機密情報は evidence JSON にも stdout にも書き出さない（cookie redact）
- `--out` 不指定でも自動生成パスで保存される

## 成果物

- `outputs/phase-02/main.md`
- `outputs/phase-02/script-design.md`

## 次 Phase

- [phase-03.md](./phase-03.md): 設計レビュー

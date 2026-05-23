# Implementation Guide

## Part 1: 中学生レベル

なぜ必要か。人が同じ申請に同時に「OK」を押したとき、二重に記録されると名簿が壊れます。たとえば教室の係が同じ生徒を同じ班へ二回登録してしまうと、あとで人数確認が合わなくなります。

何をするか。今回作ったものは、同じ tag queue を同時に何回も resolve して、最初の 1 回だけが勝ち、残りが `race_lost` で止まることを確かめる smoke runner です。画面を変えた仕事ではないため、スクリーンショットは不要です。

### 今回作ったもの

| 作ったもの | 役割 |
| --- | --- |
| `scripts/smoke/tag-queue-race.mjs` | staging API に同時 POST し、HTTP 結果と任意の副作用 summary を判定する |
| `scripts/smoke/__tests__/tag-queue-race.test.sh` | dry-run、結果分析、AC-4 副作用判定、機密 redaction、引数不足をローカル検証する |
| `scripts/smoke/README.md` | operator が staging smoke を実行するための手順をまとめる |
| `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/` | Issue #295 / UT-07A-03 の current canonical workflow |

## Part 2: Technical

### TypeScript 型定義

```ts
type Options = {
  env: "staging" | "local";
  queueId: string;
  concurrency: number;
  baseUrl: string;
  sessionCookie: string;
  action: "confirmed" | "rejected";
  tagCodes?: string[];
  reason?: string;
  out: string;
  input?: string;
  sideEffectInput?: string;
  dryRun?: boolean;
  analyzeOnly?: boolean;
};

type ResolveResult = {
  index: number;
  status: number;
  body: unknown;
  latencyMs: number;
  startedAt: string;
  finishedAt: string;
};

type SideEffectEvidence = {
  expected: {
    memberTagsDelta: number;
    auditLogDelta: number;
    queueStatus: "resolved" | "rejected";
  };
  actual: {
    memberTagsDelta: number;
    auditLogDelta: number;
    queueStatus: string;
  };
};

type Analysis = {
  successes: number;
  raceLosts: number;
  others: number;
  networkErrors: number;
  total: number;
  verdict: "pass" | "fail";
  reason: string;
  sideEffects: {
    checked: boolean;
    verdict: "pass" | "fail" | "not_checked";
    reason: string;
  };
};
```

### CLIシグネチャ

```bash
node scripts/smoke/tag-queue-race.mjs \
  --env staging \
  --queue-id "$QUEUE_ID" \
  --concurrency 5 \
  --base-url "$STAGING_API_BASE" \
  --session-cookie "$COOKIE" \
  --action confirmed \
  --tag-codes "$TAG_CODE" \
  --out "$OUT" \
  --side-effect-input "$SIDE_EFFECT_SUMMARY"
```

`--analyze-only --input <results.json>` は HTTP 結果だけを判定します。`--side-effect-input <summary.json>` を併用すると、AC-4 の `member_tags` 増分、`audit_log` 増分、queue 最終 status も exit code に反映します。

### 使用例

```bash
bash scripts/smoke/__tests__/tag-queue-race.test.sh

node scripts/smoke/tag-queue-race.mjs \
  --dry-run \
  --env staging \
  --queue-id q1 \
  --base-url https://example.invalid \
  --session-cookie c \
  --action confirmed \
  --tag-codes t1
```

Runtime smoke は staging admin cookie と D1 fixture が必要な operator step です。現時点の Phase 11 は `runtime_pending` であり、`result.json` / `before.txt` / `after.txt` は未取得です。

### エラーハンドリング

| ケース | 終了コード | 挙動 |
| --- | --- | --- |
| 引数不足 / unknown option / `--concurrency < 2` | 2 | usage error として stderr に理由を出す |
| 全 request が network error | 2 | 接続不能として扱う |
| HTTP 判定または副作用判定が不一致 | 1 | `verdict:"fail"` を stdout に出す |
| HTTP 判定 pass、かつ指定された副作用判定も pass | 0 | evidence JSON を保存する |

### エッジケース

| Edge case | 期待 |
| --- | --- |
| 成功 2 件以上 | fail。guarded update が破れている可能性がある |
| 成功 0 件 | fail。fixture / auth / state を確認する |
| 敗者が `race_lost` 以外 | fail。route error contract と不整合 |
| 副作用 summary の expected/actual 不一致 | fail。HTTP は pass でも AC-4 未達 |
| `--side-effect-input` なし | HTTP 判定のみ。Phase 11 の before/after SQL は別 evidence として必須 |

### 設定項目と定数一覧

| 項目 | 値 |
| --- | --- |
| `DEFAULT_CONCURRENCY` | `5` |
| `DEFAULT_TIMEOUT_MS` | `10000` |
| default output | `docs/30-workflows/issue-295-tag-queue-resolve-race-smoke/outputs/phase-11/<ISO-ts>/result.json` |
| supported env | `staging`, `local` |
| required visual evidence | `NON_VISUAL`。スクリーンショット不要 |

### テスト構成

| Command | Scope |
| --- | --- |
| `bash scripts/smoke/__tests__/tag-queue-race.test.sh` | focused tests: dry-run, analyze pass/fail, side-effect pass/fail, redaction, usage error |
| `pnpm smoke:test` | existing smoke shell tests + tag queue race test |
| `node .claude/skills/task-specification-creator/scripts/validate-phase12-implementation-guide.js --workflow docs/30-workflows/issue-295-tag-queue-resolve-race-smoke` | Phase 12 implementation guide content gate |

### Runtime Pending Boundary

この workflow は `implemented_local_evidence_captured / runtime_pending` です。local script と docs は完了していますが、staging D1 fixture 作成、admin cookie 利用、before/after SQL、runtime `result.json` は user/operator gated のため、PR 本文では runtime PASS と書かず pending として扱います。

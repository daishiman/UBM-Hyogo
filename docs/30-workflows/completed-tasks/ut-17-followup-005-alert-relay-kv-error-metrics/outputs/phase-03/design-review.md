# Phase 3 成果物: 設計レビュー GO/NO-GO

> AC-1〜AC-6, AC-10 の Phase 2 設計が implementation-ready であるかを 7 軸で判定する。

## 1. レビュー対象

| ファイル | 紐付け AC |
| --- | --- |
| outputs/phase-02/log-schema.md | AC-3, AC-4 |
| outputs/phase-02/helper-design.md | AC-1, AC-2, AC-4 |
| outputs/phase-02/emit-points.md | AC-5, AC-6 |
| outputs/phase-02/get-fail-open-policy.md | AC-5, AC-10 |

## 2. 観点別判定

| # | 観点 | 判定 | 根拠 |
| --- | --- | --- | --- |
| R-1 | alert-relay 主機能不変 | PASS | emit-points.md 第 6 節で `createAlertRelayRoute` シグネチャ・middleware・dedupe TTL・formatter・Slack 配信を改変しないことを明示 |
| R-2 | `get` fail-open 化の妥当性 | PASS | get-fail-open-policy.md で原典 6.3 章との整合・運用インパクト非対称性・観測可能性確保を根拠化。唯一の意図的 behaviour change として明示 |
| R-3 | `put` catch 置換の挙動不変 | PASS | emit-points.md 第 4 節で `return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false })` が完全不変であることを明示 |
| R-4 | log schema 固定強度 | PASS | log-schema.md で `event` 文字列リテラル固定 / field 名一覧 / 互換性ポリシーを正本化 |
| R-5 | isolateId 採番方式 | PASS | helper-design.md 第 2 節 / emit-points.md 第 2 節で module top 1 回採番を明示 |
| R-6 | dedupeKeyHash 計算 | PASS | helper-design.md 第 3 節 (2) / log-schema.md 3.4 で SHA-256 first 12 hex chars lowercase を明示 |
| R-7 | helper 隔離 | PASS | helper-design.md 第 1 節「可視性: module 内 private」/ 第 6 節「export 禁止」 |

## 3. ファイル別チェック結果

### `apps/api/src/routes/internal/alert-relay.ts`

- [x] module top に `const isolateId = crypto.randomUUID();` 1 回採番（emit-points.md 第 2 節）
- [x] top-level に `async function logKvOperationError(op, err, dedupeKey)` 定義、`export` なし（helper-design.md 第 1, 6 節）
- [x] `get` 呼出を try/catch で囲み、catch 内で helper 呼出 + fail-open（emit-points.md 第 3 節 / get-fail-open-policy.md 第 2 節）
- [x] `put` 既存 catch の `console.warn` を helper 呼出に置換、`return c.json(..., dedupPersisted: false)` 不変（emit-points.md 第 4 節）
- [x] `createAlertRelayRoute` シグネチャ・dedupe TTL・formatter・Slack 配信不変（emit-points.md 第 6 節）

### `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

- [x] T-01〜T-04 の 4 ケース追加方針が phase-02.md に記載
- [x] `afterEach(() => vi.restoreAllMocks())` で spy leak 防止が明示
- [x] 既存 case 温存方針が明示

### `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

- [x] Phase 8 で「KV 操作エラーログの確認」セクション追加方針が記録（index.md スコープ / phase-02.md 変更対象一覧）
- [x] grep 例・しきい値・schema 表が追記対象として明示

## 4. CONDITIONAL 解消確認

| Phase 1 CONDITIONAL | 解消状況 |
| --- | --- |
| `get` fail-open 化を Phase 12 documentation-changelog に明示記録 | get-fail-open-policy.md 第 4 節で Phase 12 申し送り明記 ✓ |
| `event` 文字列リテラル `"alert_relay_kv_op_failed"` 正本化 | log-schema.md 3.1 / 第 6 節で固定リテラル & 互換性ポリシー正本化 ✓ |

## 5. 残課題 / Phase 4 以降への申し送り

- Phase 6（implementation-steps）で hex 化ループの実装方式（`for` ループ or `Array.from`）を確定
- Phase 7（test-plan）で既存 spec.ts に `KV.get` throw → 500 期待 case があるか調査し、ある場合は fail-open 期待に書き換える計画を立てる
- Phase 8（docs-updates）で runbook に schema 表（field 名・型・例値）を log-schema.md 第 3 節から転記
- Phase 12（documentation-changelog）で `get` fail-open 化を意図的 behaviour change として記録

## 6. 最終判定

**GO**

- 7 観点すべて PASS
- Phase 1 CONDITIONAL 2 件すべて解消
- ファイル別チェック完了
- alert-relay 主機能ロジック改変なし
- `get` fail-open 化は唯一の意図的 behaviour change として承認

Phase 4（タスク分解）以降の実装着手を承認する。

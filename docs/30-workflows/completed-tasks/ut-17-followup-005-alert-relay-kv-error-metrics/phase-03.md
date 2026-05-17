# Phase 3: 設計レビュー

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 2 で設計したコード変更（`alert-relay.ts` への helper 追加・module top 採番・`get` try/catch 新設・`put` catch 置換）の GO/NO-GO 判定を行うレビュー Phase。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 3 / 13 |
| Phase 名称 | 設計レビュー |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 2 (設計) |
| 次 Phase | 4 (タスク分解) |
| 状態 | completed |

## 目的

Phase 2 設計成果物 4 件（log-schema / helper-design / emit-points / get-fail-open-policy）に対し、以下 7 軸で GO / NO-GO 判定を行い、`outputs/phase-03/design-review.md` に判定根拠を記録する。

## レビュー観点

| # | 観点 | 判定基準 |
| --- | --- | --- |
| R-1 | alert-relay 主機能不変 | `createAlertRelayRoute` のシグネチャ・middleware・dedupe TTL・formatter・Slack 配信・レスポンス body / status を改変していない |
| R-2 | `get` fail-open 化の妥当性 | `seen = null` 相当として通常配信続行する設計が明示されており、これが唯一の意図的 behaviour change として記録されている（AC-10） |
| R-3 | `put` catch 置換の挙動不変 | 既存 `{ ok: true, attempts, dedupPersisted: false }` レスポンス挙動が完全に保たれている（AC-6） |
| R-4 | log schema 固定強度 | `event` 文字列リテラル固定 / field 名（op, errorClass, dedupeKeyHash, isolateId, ts）が正本化されている。後段 logpush の filter 契約となる |
| R-5 | isolateId 採番方式 | module top で 1 回採番・handler 内で再採番しない設計が明示されている（AC-1） |
| R-6 | dedupeKeyHash 計算 | SHA-256 first 12 hex chars（lowercase）が helper 内で実装される設計で、raw key がログに出ない（AC-4） |
| R-7 | helper 隔離 | `logKvOperationError` が module 内 private（export なし）として定義され、外部から import されない（AC-2） |

## 主要レビュー項目（変更対象ファイル別）

### `apps/api/src/routes/internal/alert-relay.ts`

- [ ] module top（import 群直後）に `const isolateId = crypto.randomUUID();` が 1 回採番されている
- [ ] top-level に `async function logKvOperationError(op, err, dedupeKey)` が定義され、`export` キーワードが付いていない
- [ ] `get` 呼出（既存 :66 行）が try/catch で囲まれ、catch 内で `await logKvOperationError("get", err, dedupeKey)` を呼び、`seen` を `null` 相当として通常処理を継続する
- [ ] `put` 既存 catch（既存 :93-102）の `console.warn` 行が `await logKvOperationError("put", err, dedupeKey)` に置換され、`return c.json({ ok: true, attempts: result.attempts, dedupPersisted: false })` は不変
- [ ] `createAlertRelayRoute` のシグネチャ / 引数 / 戻り値型は不変
- [ ] dedupe TTL（`dedupeTtlMs`）/ `formatCloudflareAlertToSlack` / `sendSlackMessage` 呼出は不変
- [ ] `verifyCfWebhookAuth` middleware 適用は不変

### `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts`

- [ ] T-01〜T-04 の 4 ケースが追加される計画になっている
- [ ] `afterEach(() => vi.restoreAllMocks());` で spy leak 防止が記述される計画になっている
- [ ] 既存 case は behaviour change なしを担保するため温存される

### `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md`

- [ ] Phase 8 で「KV 操作エラーログの確認」セクション追加方針が記録されている
- [ ] `grep` コマンド例・しきい値（直近 1 時間で 10 件超なら調査開始）・schema 表が追記対象として明示されている

## レビュー実行手順

1. Phase 2 で作成された `outputs/phase-02/` 配下 4 ファイル全てを読み込む
2. 各観点 R-1〜R-7 に対し PASS / FAIL / CONDITIONAL を判定
3. 変更対象ファイル別レビュー項目を全てチェック
4. `outputs/phase-03/design-review.md` に判定結果を以下構造で記録:
   - 観点別判定表（R-1〜R-7）
   - ファイル別チェック結果
   - CONDITIONAL の解消条件 / NO-GO の場合の差し戻し事項
   - 最終 GO / NO-GO 判定
5. NO-GO 時は Phase 2 へ差し戻し、解消後再レビュー

## DoD（Phase 3 完了条件）

- [ ] `outputs/phase-03/design-review.md` が作成されている
- [ ] R-1〜R-7 観点別判定が全て記録されている
- [ ] 変更対象ファイル別レビュー項目に対する判定根拠が記載されている
- [ ] 最終 GO / NO-GO 判定が結論として明示されている
- [ ] `get` fail-open 化が「唯一の意図的 behaviour change」として記録されている（AC-10 紐付け）

## ローカル実行・検証コマンド

```bash
# Phase 02 成果物の存在確認
ls docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/outputs/phase-02/

# 参照整合性チェック（手動）
grep -r "ut-17-followup-005" docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/
```

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | phase-02.md | レビュー対象 Phase |
| 必須 | outputs/phase-02/log-schema.md | R-4, R-6 評価対象 |
| 必須 | outputs/phase-02/helper-design.md | R-5, R-6, R-7 評価対象 |
| 必須 | outputs/phase-02/emit-points.md | R-1, R-3 評価対象 |
| 必須 | outputs/phase-02/get-fail-open-policy.md | R-2 評価対象 |
| 必須 | index.md | AC-1〜AC-10 紐付け |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-03/design-review.md | 設計レビュー結果（GO/NO-GO） |

## 次 Phase

- 次: 4 (タスク分解)
- 引き継ぎ事項: GO 判定の場合は Phase 4 以降の実装計画着手可。NO-GO の場合は差し戻し事項を Phase 2 に返却
- ブロック条件: `outputs/phase-03/design-review.md` 未作成、または GO/NO-GO 判定未記載の場合は Phase 4 へ進まない

## 実行タスク

- Phase 2 設計を R-1〜R-6 でレビューし、GO/NO-GO を判定する。

## 完了条件

- [x] `outputs/phase-03/design-review.md` に GO/NO-GO と差し戻し条件が記録されている。

## 統合テスト連携

Phase 7 の focused Vitest で設計レビューの GO 条件を実測する。

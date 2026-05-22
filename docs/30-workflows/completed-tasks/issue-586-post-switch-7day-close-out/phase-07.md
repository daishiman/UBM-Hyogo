# Phase 7: テスト計画（focused / dry-run / 7 日 regression）

## 目的

Phase 6 で実装した変更の検証戦略を確定する。本タスクは新規 TS code が原則 0 で workflow YAML 改修と SSOT 同期が中心であるため、テストの主軸は「親 #549 の既存 focused test 再走 + 7day summary workflow の dry-run + 7 日 hourly run の regression telemetry 検証」となる。新規 focused test は `expectedSnapshots` 件数検証を `post-switch-monitor` aggregation に追加する場合のみ追加する。

## 完了条件

- [ ] unit / focused test レイヤ（既存 + 新規がある場合）がすべて pass
- [ ] integration test として `cf-audit-log-7day-summary.yml` の `workflow_dispatch` dry-run が成功する（artifact 0 件で aggregation `actualSnapshots: 0` を返し PR 起票しない挙動）
- [ ] regression test として 7 日 hourly run の 4 観測軸（Issue 起票数 / fallback rate / p95 latency / leakage grep）がすべて within
- [ ] DoD（`pass_runtime_synced` 昇格条件）を満たす
- [ ] ローカル実行コマンド一覧が確定し、CI と整合する

## 前 Phase 依存

- Phase 5: I/O 契約
- Phase 6: 実装手順 / 各ステップの期待出力

## 7-1. テスト分類と責務

| レイヤ | 対象 | 範囲 | 実行場所 |
| --- | --- | --- | --- |
| unit / focused | 親 #549 既存 `post-switch-monitor` test | 集計ロジック / D1 query mock | local + CI |
| unit / focused | 親 #549 既存 `fallback-rate-alert` test | 閾値判定 / Issue 起票 mock | local + CI |
| unit / focused | 親 #549 既存 `secret-leakage-grep` test | `--exit-on-detect` の exit code | local + CI |
| unit / focused（新規・条件付き） | `expectedSnapshots: 168` 件数検証 | aggregation 出力に `actualSnapshots !== expectedSnapshots` で `errors: ['snapshots_mismatch']` を含めるか | local + CI |
| integration | `cf-audit-log-7day-summary.yml` workflow_dispatch dry-run | YAML 構文 + step 接続 + artifact pattern | GitHub Actions |
| integration | `cf-audit-log-monitor.yml` の hourly run（merge 直後の 1 回） | env 解決 / post-step 動作 / artifact upload | GitHub Actions |
| regression | hourly run 7 日観測 | 4 観測軸 telemetry / fallback rate alert 非発火 / leakage 0 件 | GitHub Actions（7 日間）|

## 7-2. focused test 必須項目

### 7-2-1. `post-switch-monitor.test.ts`

- 既存: aggregation 出力 schema 検証
- 新規（条件付き）:
  - `actualSnapshots === 168` のとき OK
  - `actualSnapshots < 168` のとき `errors: ['snapshots_mismatch']` を含む
  - `fallbackRateMean > 0.05` のとき `warnings: ['fallback_rate_high']`
  - `leakageHits > 0` のとき `errors: ['leakage_detected']`

### 7-2-2. `fallback-rate-alert.test.ts`

- 既存: 3 hour 連続で 5% 超 → `gh issue create` mock 発火
- 既存: 2 hour 連続で 5% 超 → 発火しない
- 既存: 4 hour 中 1 hour だけ 5% 超 → 発火しない

### 7-2-3. `secret-leakage-grep.test.ts`

- 既存: positive fixture（dummy token）→ exit 1
- 既存: clean fixture → exit 0
- 既存: directory scan で再帰的に grep される

## 7-3. integration test（dry-run）

### 7-3-1. 7day summary workflow_dispatch dry-run

```bash
gh workflow run cf-audit-log-7day-summary.yml --ref dev
gh run watch <run-id>
```

期待挙動:
- artifact 0 件で aggregation script が `actualSnapshots: 0` を出力
- PR 起票はせず exit 1（add-paths が空のため `peter-evans/create-pull-request` 自体は no-op で skip）
- workflow run 全体は `failure`（aggregation の exit 1 を反映）または「artifact 0 件で early exit」のどちらかを実装方針として確定し test に書く

NG 時: YAML 構文エラー / cross-run `gh api` artifact pattern miss / `permissions` 不足

### 7-3-2. hourly run の merge 直後 1 回

PR merge 直後に hourly schedule の次回 run を観察。`gh run list --workflow cf-audit-log-monitor.yml --limit 1` で:

- `env.CF_AUDIT_CLASSIFIER == 'ml'` が GitHub Actions UI 上の env section に表示される
- artifact `hourly-snapshot-<run_id>` が retention-days 8 で保存される
- post-step 3 つ（leakage grep / fallback alert / artifact upload）すべて success

## 7-4. regression test（7 日観測）

D+0〜D+7 で daily check:

| 日 | 確認 | 記録先 |
| --- | --- | --- |
| D+1 | hourly run 24 件 success / artifact 24 件存在 / leakage 0 | `outputs/phase-11/evidence/hourly-run-daily-check.md` |
| D+3 | hourly 72 件 / leakage 0 / fallback rate sample mean ≤ 5% | 同上 |
| D+5 | hourly 120 件 / leakage 0 / Issue 起票数 baseline 比較中間値 | 同上 |
| D+7 | hourly 168 件 / 7day summary workflow 起票 PR | `outputs/phase-11/evidence/hourly-run-7day.md` |

## 7-5. ローカル実行コマンド

| 用途 | コマンド |
| --- | --- |
| focused test | `mise exec -- pnpm vitest run scripts/cf-audit-log/observation/__tests__ scripts/cf-audit-log/__tests__/evaluation.test.ts --reporter=verbose` |
| 7day summary aggregation dry-run（fixture） | `mise exec -- pnpm tsx scripts/cf-audit-log/observation/post-switch-monitor.ts --aggregate --input fixtures/hourly-7day --window 168 --out /tmp/summary.json` |
| YAML lint | `mise exec -- pnpm prettier --check .github/workflows/` |

## 7-6. CI 必須 status check

| check | 内容 | 必須 |
| --- | --- | --- |
| typecheck | `pnpm typecheck` | yes |
| lint | `pnpm lint` | yes |
| focused test | observation + evaluation | yes |
| verify-indexes | `verify-indexes-up-to-date` | yes（既存）|
| audit-correlation-verify | （Issue #554）| yes（既存・branch protection）|

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 07 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 参照資料

- `phase-05.md`
- `phase-06.md`
- 親 `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-07.md`

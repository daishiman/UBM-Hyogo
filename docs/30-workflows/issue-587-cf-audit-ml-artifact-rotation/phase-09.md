# Phase 9: テスト計画（unit / canary dry-run / leakage grep）

## 目的

Phase 6 の関数シグネチャ・Phase 8 の異常系を網羅する focused test 計画を確定する。global typecheck/lint は既存 `@sentry/*` known-failure を許容し、新規エラー 0 件を target とする。E2E / 7 日観測は本サイクル外。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. テストレイヤ分担

| レイヤ | 対象 | 実装サイクル |
| --- | --- | --- |
| unit | `rotation-evidence-collector.ts`（純粋関数 / gate 判定） | 実装サイクル |
| unit | `artifact-canary.ts`（mock load 経路） | 実装サイクル |
| integration | canary workflow（`workflow_dispatch` で manual 起動 / staging dry-run） | 実装サイクル（手動実行） |
| grep gate | dataset-grep / leakage-grep / candidate path 実値混入 grep | 実装サイクル + CI |
| E2E | 次世代 artifact 投入後の hourly run + rollback | 本サイクル外（Gate-R0〜R3 通過後） |

## 2. focused test 一覧（実装サイクルで作成）

### `__tests__/rotation-evidence-collector.test.ts`

| # | test | 期待 |
| --- | --- | --- |
| C1 | canary-out.json を読み rotation-evidence.json を出力 | 必須 field 全て埋まる / `phase = 'canary'` |
| C2 | candidate.precisionProxy < baseline.precisionProxy | `gate.R1_replayPass = false` / `decision = 'candidate_discarded'` |
| C3 | fallbackRate >= 0.05 | `gate.R2_latencyAndFallbackPass = false` |
| C4 | p95LatencyMs > baseline * 1.5 | `gate.R2_latencyAndFallbackPass = false` |
| C5 | leakageHits > 0 | `decision = 'candidate_discarded'` |
| C6 | 全 gate pass | `decision = 'promotion_pr_pending'` |
| C7 | rotationId 省略 | ISO timestamp ベースで自動生成 |
| C8 | --result 書き込み失敗 | throw / process exit 1 |

### `__tests__/artifact-canary.test.ts`

| # | test | 期待 |
| --- | --- | --- |
| A1 | candidate / baseline mock load + offline replay 1 hour | `verdict = 'candidate_pass'` |
| A2 | candidate load throw | `verdict = 'candidate_fail_load'` / exit 1 |
| A3 | leakage grep mock で hits > 0 | `verdict = 'candidate_fail_leakage'` / exit 1 |
| A4 | candidate metrics が baseline 以下 | `verdict = 'candidate_fail_metrics'` / exit 1 |
| A5 | --no-exit-on-leakage で leakage 検出 | exit 0 / verdict は `candidate_fail_leakage` のまま |
| A6 | candidate path 実値が log に出ない | log capture で実値文字列が見つからない |
| A7 | error stack trace の redaction | err.message に実値含まれない |
| A8 | --out 書き込み確認 | JSON が schema 通りに書き出される |

### grep gate test（CI / 開発時）

| # | test | 期待 |
| --- | --- | --- |
| G1 | dataset-grep（`.csv` / `.parquet` / `.jsonl` 検出） | hits = 0 |
| G2 | candidate path 実値 grep（仕様書 / commit message / log） | hits = 0 |
| G3 | `wrangler` 直接実行 grep | hits = 0（`bash scripts/cf.sh` 経由のみ） |
| G4 | `secret-leakage-grep.ts` 流用 vs 再実装 | 再実装が無いことを確認（class / function 重複なし） |

## 3. mock 戦略

| mock 対象 | 方法 |
| --- | --- |
| `op run` | child_process spawn を mock し、固定 op 参照文字列を返す（実値は返さない） |
| `MLClassifier.load` | A1: 成功 / A2: throw を切替可能な test fixture |
| `secret-leakage-grep.ts` 子プロセス | spawn mock で exit 0 / 1 を切替 |
| event log（offline replay） | fixture JSON（10〜50 件、安全な dummy event） |
| `bash scripts/cf.sh whoami` | shell out を mock し成功扱い |

fixture event は **実 event の copy 禁止**。dummy / synthetic のみ（dataset-grep に引っかからない構造）。

## 4. global checks

```
mkdir -p docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence
(mise exec -- pnpm typecheck; echo "exit_code=$?") 2>&1 | tee docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/typecheck.log
(mise exec -- pnpm lint; echo "exit_code=$?") 2>&1 | tee docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/lint.log
(mise exec -- pnpm vitest run scripts/cf-audit-log/rotation/__tests__/; echo "exit_code=$?") 2>&1 | tee docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/outputs/phase-11/evidence/test.log
```

evidence 出力先:

- `outputs/phase-11/evidence/typecheck.log`
- `outputs/phase-11/evidence/lint.log`
- `outputs/phase-11/evidence/test.log`
- `outputs/phase-11/evidence/canary-dry-run.json`（手動 staging dry-run）
- `outputs/phase-11/evidence/leakage-grep.log`
- `outputs/phase-11/evidence/dataset-grep.log`

## 5. 本サイクル外のテスト

- 次世代 artifact 投入後の hourly run sample（`outputs/phase-11/evidence/hourly-run-after-promotion.json`）
- 7 日観測（promotion 後の `post-switch-monitor.ts` 出力）
- rollback の実 PR 動作確認

これらは Gate-R0〜R3 通過後の実装サイクルで取得し、本サイクルでは予約 path のみ確保する。

## 完了条件

- [ ] focused test 16 件（C1〜C8 + A1〜A8）の test 名と期待を確定
- [ ] grep gate test 4 件（G1〜G4）を確定
- [ ] mock 戦略 5 種を確定
- [ ] evidence 出力 path 6 種を確定
- [ ] 本サイクル外テストの予約 path を確定

## 参照資料

- `index.md`
- `phase-06.md` ・ `phase-08.md`
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-09.md`

## 統合テスト連携

- 本タスクは scripts 層中心のため、E2E / int-test との連携は限定的。Phase 12 で int-test-skill との接合を検討。

## 出力

- `outputs/phase-09/main.md`（test 計画 + mock 戦略 + evidence path）

## Next Phase

- [Phase 10](phase-10.md): デプロイ / canary workflow 起動手順 / rollback runbook

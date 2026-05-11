# Phase 8: エラーハンドリング / fallback / leakage 防止

## 目的

`artifact-canary.ts` / `rotation-evidence-collector.ts` / canary workflow / runbook における異常系を網羅し、fallback / leakage 防止 / secret redaction の振る舞いを確定する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## 1. 異常系一覧

| # | 異常系 | 検知 | 振る舞い | exit code |
| --- | --- | --- | --- | --- |
| E1 | candidate op 参照解決失敗 | `op run` exit != 0 | log: `op resolution failed` (path 名のみ・実値なし) / canary fail / verdict = `candidate_fail_load` | 1 |
| E2 | candidate artifact load 失敗 | `MLClassifier.load()` throw | threshold fallback 発動。canary fail / verdict = `candidate_fail_load` | 1 |
| E3 | offline replay 中の event 不整合 | parse error | 該当 event をスキップしカウント。閾値超で canary fail | 0 or 1 |
| E4 | leakage grep positive | `secret-leakage-grep.ts` exit 1 | candidate fail / verdict = `candidate_fail_leakage` / log redact | 1 |
| E5 | precision/recall proxy が baseline を下回る | gate 判定 | candidate fail / verdict = `candidate_fail_metrics` / promotion 不可 | 1 |
| E6 | fallback rate >= 5% / p95 latency > baseline * 1.5 | gate 判定 | candidate fail / verdict = `candidate_fail_metrics` | 1 |
| E7 | `--out` 書き込み失敗 | fs error | log: write failure / canary fail | 1 |
| E8 | `bash scripts/cf.sh whoami` 失敗 | wrapper exit != 0 | canary 起動前に fail / log: auth failure | 1 |
| E9 | candidate path 実値が log に混入 | post-step grep | log redact + Issue 起票 | 1 |
| E10 | raw feature dataset commit 検出 | dataset-grep | CI fail。promotion 不可 | 1 |

## 2. fallback 設計

| 状況 | fallback |
| --- | --- |
| candidate load 失敗 | `MLClassifier` skeleton の threshold fallback が staging 上で発動。canary は fail と判定するが、production hourly run は無影響（hourly は `..._PROD` を見る） |
| canary 中の transient error（network 等） | retry 1 回。それでも fail なら canary fail |
| `..._CANDIDATE` 未登録 | canary 起動前に exit 1（workflow input 必須） |
| leakage grep の transient error | canary を fail 寄りに倒す（safe-by-default） |

## 3. secret redaction

```
log redaction rules:
  - candidate path の実値（"https://..."、"@cf-account-id/...", "binding-name" 等）を log に出さない
  - op 参照（"op://Vault/Item/Field"）のみ log に出してよい
  - エラー時の stack trace 中に実値が含まれる場合、**log 出力前に redact** する
  - JSON evidence の candidatePathRef / baselinePathRef は op 参照のみ（実値ではない）

redaction implementation:
  - op run --env-file 経由で取得した値を環境変数として揮発的に保持
  - console.log / process.stdout には常に op 参照のみ書き出す
  - error 時は err.message を redact (実値文字列を masked に置換) してから throw
```

## 4. leakage 防止

```
leakage grep の流用フロー:
  artifact-canary.ts
    └─ runOfflineReplay() 完了後
        ├─ 出力 log を一時ファイルに書き出し
        ├─ child_process.spawnSync('node', ['secret-leakage-grep.ts', '--input', tmpfile, '--exit-on-detect'])
        ├─ exit 1 ならcanary fail / verdict = 'candidate_fail_leakage'
        └─ tmp ファイルは finally で削除
```

`secret-leakage-grep.ts` 自体は本タスクで **再実装しない**。#515 既存 + #549 で `--exit-on-detect` 追加済みのものを流用する。

## 5. raw feature dataset 防止

```
dataset-grep gate:
  rg -n '(\.csv|\.parquet|\.jsonl)$' \
      scripts/cf-audit-log/rotation/ \
      .github/workflows/cf-audit-log-artifact-canary.yml \
      docs/30-workflows/runbooks/ml-model-artifact-rotation.md \
      docs/30-workflows/issue-587-cf-audit-ml-artifact-rotation/
  期待: hits = 0
  evidence: outputs/phase-11/evidence/dataset-grep.log

artifact upload 検査:
  canary workflow の upload-artifact step で
  - rotation-evidence.json のみを upload する
  - canary-out.json は redacted 後に upload
  - log artifact は redaction 後のみ upload
  - 拡張子 .csv / .parquet / .jsonl は upload 禁止
```

## 6. canary workflow の異常時挙動

| 異常 | workflow 挙動 |
| --- | --- |
| `inputs.candidatePath` 未指定 | workflow_dispatch validation で fail（`required: true`） |
| op 解決失敗 | step 4 で exit 1 → workflow run fail |
| canary metrics fail | step 4 exit 1（exitOnLeakage=true 時） / verdict=`candidate_fail_*` |
| evidence collector fail | step 5 で fail。step 4 の canary-out.json は upload される |
| upload-artifact 失敗 | workflow fail。再実行で復旧 |

## 完了条件

- [ ] 異常系 E1〜E10 を網羅
- [ ] fallback 設計を確定
- [ ] secret redaction ルールを確定
- [ ] leakage grep 流用フローを確定（再実装なし）
- [ ] raw feature dataset 防止 grep gate を確定
- [ ] canary workflow の異常時挙動を確定

## 参照資料

- `index.md`
- `phase-03.md` ・ `phase-05.md` ・ `phase-06.md`
- `scripts/cf-audit-log/evaluation/secret-leakage-grep.ts`（既存）
- `scripts/cf-audit-log/classifier/ml.ts`（既存）

## 統合テスト連携

- Phase 9 で異常系 E1〜E10 のうち、unit test で再現可能なもの（E1〜E7、E9）に対する test を計画。

## 出力

- `outputs/phase-08/main.md`（異常系一覧 + fallback / redaction / leakage / dataset 防止の各設計）

## Next Phase

- [Phase 9](phase-09.md): テスト計画

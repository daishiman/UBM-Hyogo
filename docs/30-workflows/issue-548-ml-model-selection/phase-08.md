# Phase 8: エラーハンドリング

## 目的

モデルロード失敗 / Workers AI quota / training data 不足 などのエラーパターンを列挙し、すべて `ThresholdClassifier` fallback に収束させる。secret leakage は exit code 2 で fail-fast。

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| state | spec_created |

## エラーパターン一覧

| # | エラー | 検出箇所 | ハンドリング |
| --- | --- | --- | --- |
| E-1 | model artifact ファイル不在 | `IsolationForestClassifier` / `XGBoostClassifier` constructor | catch → `fallback = ThresholdClassifier`。log warn 1 行 |
| E-2 | model artifact JSON parse error | constructor | 同上 |
| E-3 | model artifact schema 不正（version mismatch / required field 欠落） | constructor schema validate | 同上 |
| E-4 | inference 中の TypeError（feature vector 未定義 key） | `classify()` | catch → fallback 委譲 + fallback counter increment |
| E-5 | Workers AI 401 / 403 / 429 | `WorkersAIClassifier.classify()` | response.ok=false で fallback 委譲 |
| E-6 | Workers AI timeout (>2s) | AbortController | `AbortError` catch → fallback 委譲 |
| E-7 | Workers AI 5xx | response.ok=false | fallback 委譲 |
| E-8 | training dataset 0 行 / labeled 列欠落 | training script `validateInput` | exit 1 |
| E-9 | training dataset に raw IP / token 検出 | training script `validateRedacted` + post-output `runLeakageGrep` | exit 2 |
| E-10 | training output に raw 値混入 | post-output `runLeakageGrep` | exit 2 |
| E-11 | comparison harness で全 ML classifier が fallback 100% | `compareModels()` 終端で集計確認 | exit 2（gate failure） |
| E-12 | factory 未知 `CF_AUDIT_CLASSIFIER` 値 | `getClassifier(env)` | `ThresholdClassifier` を返し log warn |

## fallback rate 集計

- 各 event について classifier の inference が fallback 経由になった場合に `fallbackCount++`
- `fallbackRate = fallbackCount / datasetSize`
- 選定基準の `fallbackRateMax = 0.01` に乗らない classifier は selection で reject

## secret leakage 防止 hook

- training script は `output` 書き出し直後に同期で `runLeakageGrep(output)` を呼ぶ。検出時 fs.unlink + exit 2
- comparison harness は report 書き出し直後に同様
- CI 上では `--strict` フラグ（既定 on）でこれらを enforce

## ログ方針

- すべての fallback は `console.warn(JSON.stringify({ event: 'classifier_fallback', classifier, reason }))` の構造化 1 行
- ログに event payload は出さない（leakage 防止）
- `confidence` も含めない（推論時刻には raw 値が混じる可能性があるため）

## 完了条件

- [ ] E-1〜E-12 のハンドリングを擬似コードに反映
- [ ] fallback rate 集計仕様を確定
- [ ] leakage grep の exit code 2 ポリシーを明記
- [ ] ログ最小化方針を明記

## 出力

- `phase-08.md`

## 参照資料

- `index.md`
- 親 #515 phase-08（fallback / leakage 設計）
- `phase-06.md`

## 統合テスト連携

- Phase 9 で E-1〜E-12 のうち unit test 対象を選定

## 依存Phase参照

Phase 1 / Phase 2 / Phase 3 / Phase 4 / Phase 5 / Phase 6 / Phase 7 の成果物を上流契約として参照する。

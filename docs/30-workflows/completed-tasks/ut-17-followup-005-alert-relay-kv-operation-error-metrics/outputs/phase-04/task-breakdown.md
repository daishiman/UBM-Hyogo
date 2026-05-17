# Phase 4 成果物: タスク分解 (T-01〜T-09)

SRP に沿った最小単位サブタスク。各サブタスクは Phase 5 / Phase 6 で 1 ブロックとして扱える粒度。

| ID | 名称 | 責務 | 対象ファイル | 想定 LOC | 依存 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | `isolateId` module top 採番 | `crypto.randomUUID()` を module top で 1 回呼んで `const isolateId` に保持 | `alert-relay.ts` | +2 | なし | module load 時に 1 回採番される |
| T-02 | `textEncoder` module top 共有 | `new TextEncoder()` を module top で 1 度だけ生成 | `alert-relay.ts` | +1 | なし | helper が再利用する |
| T-03 | `computeDedupeKeyHash` 追加 | SHA-256 先頭 12 hex を返す module-local helper | `alert-relay.ts` | +8 | T-02 | 同一 key で同 hash を返す |
| T-04 | `logKvOperationError` 追加 | schema 準拠 JSON 1 行を `console.warn` で emit、`computeDedupeKeyHash` 失敗時は `"hash_error"` fallback | `alert-relay.ts` | +25 | T-01, T-03 | catch path で 1 行 emit、再 throw しない |
| T-05 | `KV.get` を try/catch + fail-open 化 | `seen` を let で初期化、catch で helper 呼び `seen=null` 継続 | `alert-relay.ts` | +6 / -2 | T-04 | 例外で 500 落下しない |
| T-06 | `KV.put` catch を helper 置換 | 既存非構造化 `console.warn` を `await logKvOperationError("put", ...)` へ | `alert-relay.ts` | +1 / -3 | T-04 | response 契約変更なし |
| T-07 | テスト 8 ケース追加 | TC-LOG-01〜08 を `alert-relay.spec.ts` に追加。`vi.spyOn(console, 'warn')` ベース | `alert-relay.spec.ts` | +150 | T-04〜T-06 | 全 case PASS / 既存 case regression なし |
| T-08 | runbook 追記 | section 5「KV 操作エラーログ確認」追加 | `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | +49 | なし（並行可） | grep 例 + field 表 + しきい値ガイドが含まれる |
| T-09 | 品質ゲート実行 | `@ubm-hyogo/api` package filter で typecheck / lint / build / test | — | 0 | T-01〜T-08 | 全 PASS、`*.test.ts` 追加なし |

## 並行可能性

- T-01 / T-02 / T-08 は他に依存しないため並行可。
- T-03 → T-04 → (T-05 // T-06) → T-07 → T-09 が直列必須。

## 単一責務原則の遵守

- helper 設計（T-04）と emit 点改修（T-05/T-06）を分離 → helper の責務は「schema を吐く」のみ
- テスト（T-07）と実装（T-01〜T-06）を別タスクに分離 → red/green サイクルを明示
- runbook（T-08）と実装を独立 → ドキュメント単独でレビュー可能

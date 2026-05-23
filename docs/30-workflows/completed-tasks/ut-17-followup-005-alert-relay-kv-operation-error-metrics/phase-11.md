# Phase 11: NON_VISUAL Evidence

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 名称 | NON_VISUAL evidence |
| タスク | UT-17-FU-005 alert-relay KV 操作エラーの observability 計測 |
| GitHub Issue | #701（OPEN） |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 状態 | spec_created |
| タスク種別 | implementation / NON_VISUAL |
| 証跡の主ソース | local command evidence + `outputs/phase-11/visual-verification-skip.md` |
| screenshot を作らない理由 | 本タスクは `apps/api/src/routes/internal/alert-relay.ts` への構造化ログ追加・`alert-relay.spec.ts` 拡張・runbook 追記のみ。`apps/web` への変更なし、UI / API response shape 変更なし、ログ出力先 (`console.warn`) のみ追加 |

---

## 判定

UT-17-FU-005 は **NON_VISUAL** タスクである。判定の根拠は以下 4 点:

1. `apps/web` への変更が無く、画面 UI を一切持たない
2. `apps/api` 側 endpoint の **HTTP レスポンス shape は不変**（既存 `{ ok, deduped }` / `{ ok, attempts, dedupPersisted }` / 502 を維持）
3. behaviour change は「`KV.get` の fail-closed throw → fail-open + 構造化ログ」だが、これは observability 追加であり UI 描画には現れない
4. 出力は `console.warn` 経由の JSON 1 行のみ。Cloudflare Workers Logs / `wrangler tail` でしか観測されず、スクリーンショット対象とならない

よって Phase 11 の成果物は `outputs/phase-11/visual-verification-skip.md` を正本とし、UI screenshot は取得しない。

---

## NON_VISUAL 代替 evidence 5 点セット

UI が存在しない代わりに、以下 5 種の local command evidence で品質を担保する。
すべて `outputs/phase-11/evidence/` 配下に保存し、`visual-verification-skip.md` から参照する。

### 1. typecheck.log（必須）

| 項目 | 値 |
| --- | --- |
| 取得コマンド | `mise exec -- pnpm typecheck 2>&1 \| tee docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/evidence/typecheck.log` |
| 期待 exit code | `0` |
| PASS 判定基準 | `error TS` を含む行が 0 件。最終行に non-zero exit の表示がないこと |
| 想定実行時間 | 30 秒〜2 分 |

新規追加した `logKvOperationError` ヘルパおよび `dedupeKeyHash` 算出 path の型が monorepo 全体で整合することを確認する。

### 2. lint.log（必須）

| 項目 | 値 |
| --- | --- |
| 取得コマンド | `mise exec -- pnpm lint 2>&1 \| tee docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/evidence/lint.log` |
| 期待 exit code | `0` |
| PASS 判定基準 | `error` / `warning` lines が 0 件。最終行に `Lint passed` 相当または non-zero exit の表示がないこと |
| 想定実行時間 | 20〜60 秒 |

`alert-relay.ts` 編集行に対して biome / eslint 違反（未使用変数、any 残置、`console.log` 残置等）がないこと、特に新規 helper の `console.warn(JSON.stringify(...))` が許容パターンであることを確認する。

### 3. test.txt（必須）

| 項目 | 値 |
| --- | --- |
| 取得コマンド | `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay 2>&1 \| tee docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/evidence/test.txt` |
| 期待 exit code | `0` |
| PASS 判定基準 | `alert-relay.spec.ts` の既存テストすべて PASS + Phase 7 で追加した 4 ケース（`KV.get` throw / `KV.put` throw / 成功時 emit 0 / payload shape assertion）が PASS。`failed: 0` |
| 想定実行時間 | 10〜30 秒 |

> filter 名 (`@ubm-hyogo/api`) はリポジトリ実体に従う。実体名が異なる場合は Phase 6 実装手順内で確定する（artifacts.json `plannedImplementationFiles` の path を grep して特定）。

### 4. build.txt（任意 / Workers 互換性確認）

| 項目 | 値 |
| --- | --- |
| 取得コマンド | `mise exec -- pnpm --filter @ubm-hyogo/api build 2>&1 \| tee docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/evidence/build.txt` |
| 期待 exit code | `0` |
| PASS 判定基準 | Workers バンドルが成功し、`crypto.randomUUID()` / `crypto.subtle.digest()` の解決エラーが出ないこと |
| 取得タイミング | typecheck / lint / test が全て PASS した後に任意で取得 |

`crypto.subtle.digest("SHA-256", ...)` は Workers runtime で利用可能だが、Node test runtime と Workers runtime で微妙に差異があるためビルド時の bundling エラー有無を確認する。

### 5. grep-gate.txt（必須）

| 項目 | 値 |
| --- | --- |
| 取得コマンド | `grep -rn "alert_relay_kv_op_failed" apps/api/src/ 2>&1 \| tee docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/outputs/phase-11/evidence/grep-gate.txt` |
| 期待 exit code | `0`（マッチあり） |
| PASS 判定基準 | 最低 3 件マッチ: (a) `alert-relay.ts` 実装側で `event: "alert_relay_kv_op_failed"` リテラル 1 箇所、(b) `alert-relay.spec.ts` の payload shape assertion 内 1 箇所、(c) `wrangler tail \| grep` 例として runbook 内 1 箇所 |
| 補助 grep | `grep -rn "logKvOperationError" apps/api/src/` で helper 名の定義 1 + 呼び出し 2（`get` catch / `put` catch）の計 3 件マッチを確認 |

これにより「ログ schema 文字列がコード・テスト・runbook の 3 点で同期している」ことが視覚以外で担保される。

---

## runtime evidence の扱い（staging deploy 後）

本タスクは staging deploy 後の **実 runtime ログ 1 行** を取得することで完全な PASS となる。ただし以下の理由から、仕様書側では「契約準備完了・runtime ログ取得は user-gated」状態を `contract_ready_runtime_pending` として記録する。

| 観点 | 内容 |
| --- | --- |
| 取得対象 | staging に deploy 後、`bash scripts/cf.sh tail --env staging --config apps/api/wrangler.toml \| grep alert_relay_kv_op_failed` の 1 行 |
| 取得タイミング | KV 一時障害は自然発生待ちでは検証できないため、Phase 7 テスト計画に従い「staging で `wrangler dev --remote` を当てた状態で KV binding を意図的に外す or 一時的に invalid binding を当てて発火させる」操作を user 側で実施する |
| 仕様書側の責務 | 「schema が固定されていること」「ローカルテストで emit shape が assertion 済みであること」までを Phase 11 で完了させる |
| user-gated とする理由 | (1) staging へ deploy する権限は `bash scripts/cf.sh` 経由で user が握る、(2) KV binding を一時的に外す操作は他 endpoint への副作用がある、(3) CLAUDE.md「シークレット管理」「Cloudflare 系 CLI 実行ルール」に従い AI agent が直接 deploy しない |
| 仕様書側の状態 | `contract_ready_runtime_pending`（schema は固定済、runtime sample は外部 ops 待ち） |

runtime ログ取得結果は Phase 13 PR 本文「External ops」セクションに後追いで反映可能（本 PR では空欄で良い）。

---

## 完了条件

- [ ] `artifacts.json` の `metadata.visualEvidence` が `NON_VISUAL` であること（既に設定済）
- [ ] `outputs/phase-11/visual-verification-skip.md` に skip 理由と代替 evidence 5 点の取得手順が記載されている
- [ ] `outputs/phase-11/evidence/typecheck.log` が存在し、exit code 0
- [ ] `outputs/phase-11/evidence/lint.log` が存在し、exit code 0
- [ ] `outputs/phase-11/evidence/test.txt` が存在し、Phase 7 追加 4 ケースが PASS
- [ ] `outputs/phase-11/evidence/grep-gate.txt` が存在し、`alert_relay_kv_op_failed` リテラルが 3 箇所以上同期している
- [ ] `outputs/phase-11/evidence/build.txt` は任意（取得しない場合は `visual-verification-skip.md` に「build 検証は test/typecheck で代替」と明記）
- [ ] runtime ログサンプルは `contract_ready_runtime_pending` として記録され、Phase 11 完了 gate からは除外されている
- [ ] `screenshots/` ディレクトリ・`.gitkeep` を作成していない

---

## 参照

- `docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md`（原典）
- `docs/30-workflows/ut-17-followup-003-alert-relay-healthcheck-cron/phase-11.md`（NON_VISUAL Phase 11 フォーマット参考）
- `.claude/skills/task-specification-creator/references/phase-template-phase11.md`（Phase 11 雛形）
- CLAUDE.md「Cloudflare 系 CLI 実行ルール」（runtime evidence を user-gated にする根拠）

---

## 次 Phase 引き継ぎ事項

Phase 12 では、本 Phase の代替 evidence 5 点を `implementation-guide.md` の「検証手順」セクションへ転記する。runtime ログ取得は `system-spec-update-summary.md` で「external ops 待ち」として記録し、Phase 13 PR 本文の「External ops」項目に staging deploy 後追跡として明記する。

ブロック条件: typecheck / lint / test のいずれかが FAIL した状態で Phase 12 へ進まないこと。grep gate が 3 件未満 (ログ schema 不同期) の場合も Phase 12 着手前に修正する。

## 目的

UI を持たない alert-relay logging task の local evidence を、tracked な `.txt` ファイルとして保存する。

## 実行タスク

typecheck / lint / build / test / grep gate を実行し、`outputs/phase-11/evidence/*.txt` に要約を残す。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `outputs/phase-11/evidence/*.txt` | local evidence |
| 必須 | `outputs/phase-11/visual-verification-skip.md` | NON_VISUAL 判定 |

## 成果物/実行手順

`.log` は `.gitignore` 対象のため使わず、`.txt` を canonical evidence とする。

## 統合テスト連携

`test.txt` は `alert-relay.spec.ts` を含む API Vitest 実行結果を記録する。

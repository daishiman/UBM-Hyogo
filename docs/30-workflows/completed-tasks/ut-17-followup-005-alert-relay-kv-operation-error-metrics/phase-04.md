# Phase 4: タスク分解（実装サブタスク化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測 |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | spec_created |
| GitHub Issue | #701 |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | `apps/api/src/routes/internal/alert-relay.ts` への構造化ログヘルパ実装・`KV.get` への try/catch 追加・`KV.put` catch ブロックの `console.warn` 構造化置換・isolateId / dedupeKeyHash の新規導入・既存 `alert-relay.spec.ts` への 4 ケース追加・runbook 追記を **実コードとして実装する**ため。 |

---

## 目的

Phase 3 設計レビューで GO 判定された構造化ログ schema（AC-3）/ helper 設計（`logKvOperationError`）/
emit 点（`KV.get` 新規 catch + `KV.put` 既存 catch 置換）/ isolateId 採番戦略（module top 1 回）を
入力として、実装作業を **単一責務原則（SRP）** に沿った T-01〜T-09 のサブタスクに分解し、
各サブタスクの依存・所要時間・DoD を Phase 5 へ引き渡せる形で固定する。

UT-17 本体および兄弟 followup との責務境界:

| タスク | 責務 |
| --- | --- |
| UT-17 本体 | Cloudflare native alerts + Slack 日本語化リレー Worker |
| UT-17-FU-002（完了） | dedup state の KV 永続化導入 |
| UT-17-FU-003 | weekly healthcheck cron（本タスク範囲外） |
| UT-17-FU-004 | logpush / dashboard 集計（本タスク範囲外） |
| **UT-17-FU-005（本タスク）** | **KV `get`/`put` 失敗の構造化ログ emit + `get` の fail-open 化** |

---

## 実行タスク

- [ ] Phase 02/03 成果物（log schema / helper API / emit 点 / isolateId 戦略）が GO であることを確認する
- [ ] T-01〜T-09 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T-05/T-06（emit 点配線）が T-07（テスト追加）より前段に配置されていることを確認する
- [ ] 既存テスト `alert-relay.spec.ts`（`*.spec.ts` 縛り遵守）への追加であり新規 `*.test.ts` を作らないことを確認する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T-01〜T-09）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T-01 | ログ schema 定数 + 型定義 | `event` 固定文字列・`LogKvOperationError` 型を module-local で宣言 | 編集 `apps/api/src/routes/internal/alert-relay.ts`（top） | Phase 03 GO | 0.25h | `const KV_OP_FAILED_EVENT = "alert_relay_kv_op_failed"` と `type LogKvOperationError = { event; op; errorClass; dedupeKeyHash; isolateId; ts }` が定義され `pnpm typecheck` PASS |
| T-02 | `computeDedupeKeyHash` 実装 | `SHA-256(dedupeKey)` の先頭 12 hex chars を返す async pure 関数 | 編集 同上 | T-01 完了 | 0.25h | `await computeDedupeKeyHash("a:b:1")` が決定的に同じ 12 文字 hex を返し、unit test 1 ケース PASS |
| T-03 | `isolateId` module top 採番 | module load 時に `crypto.randomUUID()` を 1 回呼び module-local const に固定 | 編集 同上 | Phase 03 GO | 0.1h | `const isolateId = crypto.randomUUID();` が `createAlertRelayRoute` 関数定義の **外側**で評価され、同 isolate 内 emit 2 回が同値 |
| T-04 | `logKvOperationError` ヘルパ実装 | `op` / `err` / `dedupeKey` を受け、構造化 JSON 1 行を `console.warn` で emit する副作用関数 | 編集 同上 | T-01, T-02, T-03 完了 | 0.5h | `JSON.parse(console.warn 引数)` が AC-3 schema 通り、`errorClass` は `err instanceof Error ? err.constructor.name : typeof err`、`pnpm typecheck` PASS |
| T-05 | `KV.get` の try/catch 化 + emit | 現状無防備の `await KV.get(dedupeKey)` を try/catch でラップし fail-open（seen=null として配信継続）+ `logKvOperationError("get", err, dedupeKey)` | 編集 同上 | T-04 完了 | 0.25h | `KV.get` throw 時に request が 5xx で落ちず、Slack 配信処理に進む。`pnpm typecheck` / `pnpm lint` PASS |
| T-06 | `KV.put` catch 置換 | 既存 `console.warn("alert relay dedup KV put failed after Slack delivery", {...})` を `await logKvOperationError("put", error, dedupeKey)` に置換し、既存 `dedupPersisted: false` レスポンスは維持 | 編集 同上 | T-04 完了 | 0.25h | 旧 `console.warn` 文字列リテラルが grep でヒットしないこと、レスポンス shape 不変 |
| T-07 | 既存テスト 4 ケース追加 | `alert-relay.spec.ts` に下記ケースを追加: (a) `KV.get` throw → 配信継続 + emit 1 / (b) `KV.put` throw → emit 1 + `dedupPersisted:false` / (c) 成功パス → emit 0 / (d) 同一 isolate 内 2 emit の `isolateId` 一致 | 編集 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | T-05, T-06 完了 | 1.0h | `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay` で全ケース PASS、line coverage ≥ 既存値 |
| T-08 | runbook 追記 | 「KV 操作エラーログ確認」セクション + `scripts/cf.sh tail ... \| grep alert_relay_kv_op_failed` + field 定義表 | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | Phase 03 GO（T-01 と並列可） | 0.5h | runbook に新セクション見出しと grep 例 + 6 field 表が掲載される |
| T-09 | 品質ゲート実行 | `typecheck` / `lint` / `test` を順次実行し PASS を確認 | （実行のみ） | T-07, T-08 完了 | 0.25h | 3 コマンド全 PASS、unstaged changes が意図したファイルのみ |

> **注記**: 順序依存は T-01,T-02,T-03 → T-04 → T-05/T-06 → T-07 → T-09。T-08 は T-01 以降と並列可（コード変更に依存しない）。

---

## クリティカルパス

```
T-01 ┐
T-02 ┼──► T-04 ──► T-05 ┐
T-03 ┘             T-06 ┴──► T-07 ──► T-09
                                       ▲
T-08 ───────────────────────────────────┘ (並列)
```

| 区間 | 累積時間 | 備考 |
| --- | --- | --- |
| T-01〜T-03（前提整備） | 0.6h | 型・hash・isolateId |
| T-04（helper） | 0.5h | 構造化 emit の中核 |
| T-05〜T-06（emit 配線） | 0.5h | get/put 双方への接続 |
| T-07（テスト追加） | 1.0h | 4 ケース + assertion |
| T-08（runbook） | 0.5h | 並列可 |
| T-09（品質ゲート） | 0.25h | typecheck/lint/test |
| **クリティカル合計** | **2.85h** | 半日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは追加しない（本タスクは KV のみ）
- [ ] Secret / env 追加なし（既存 `ALERT_DEDUP_KV` binding 流用）
- [ ] `wrangler` 直接実行なし（本タスクは deploy 変更なし）
- [ ] 新規テストは `*.spec.ts` 拡張子のみ（既存 `alert-relay.spec.ts` 拡張）
- [ ] `dedupeKey` raw / stack trace をログに出さない（PII non-leak）
- [ ] 既存 behaviour（dedup hit 202、Slack 失敗 502、put 失敗時 `dedupPersisted:false`）を維持
- [ ] CONST_007: T-01〜T-09 を本サイクル内で完了させる（持ち越し禁止）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17 本体（alert-relay route） | 同一ファイル内への helper 追加 | T-04 で module-local 配置 |
| UT-17-FU-002（KV 永続化） | `ALERT_DEDUP_KV` binding を流用 | binding 変更なし |
| UT-17-FU-004（logpush） | 本タスクの 1 行 JSON が後段集計の入力 | schema 安定化（不変条件 7）を遵守 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-02.md | log schema / helper / emit 点 / isolateId 設計 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-operation-error-metrics/phase-03.md | 設計レビュー GO 判定 |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | 実装対象本体 |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト拡張対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs / `console.warn` 経路 |
| 参考 | https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest | `crypto.subtle.digest("SHA-256", ...)` |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T-01〜T-09 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T-01〜T-09 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T-05/T-06 が T-07 より前段にあることが確認されている
- [ ] cron / secret / env / D1 への追加変更が混入していないことが確認されている
- [ ] CONST_005 の不変条件チェックが全 PASS
- [ ] outputs/phase-04 配下が artifacts.json と 1 対 1 整合

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-04 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 5（実装計画）
- 引き継ぎ事項:
  - T-01〜T-09 の DoD を Phase 5 で関数シグネチャ・型定義レベルまで具体化する
  - 変更ファイル候補（パス）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
- ブロック条件: T-01〜T-09 のいずれかが単一責務でない、または env / secret / cron 追加が混入した場合

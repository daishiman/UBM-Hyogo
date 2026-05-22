# Phase 4: タスク分解（実装サブタスク化）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | alert-relay KV 操作エラーの observability 計測（構造化ログ emit） |
| Phase 番号 | 4 / 13 |
| Phase 名称 | タスク分解 |
| 作成日 | 2026-05-16 |
| 担当 | delivery |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装計画) |
| 状態 | completed |
| GitHub Issue | #701（CLOSED / completed marked / close時点では実コード未実装・本workflowでlocal実装済み） |
| 実装区分 | **実装仕様書** |
| 実装区分 判定根拠 | 本タスクは `apps/api/src/routes/internal/alert-relay.ts` に対する構造化ログ emit ヘルパ追加、`get` 側 try/catch 新設、`put` 側 catch の JSON 化、`apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` への 4 ケース追加、`docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` への運用手順追記を伴う **実コードとして実装する**コード実装タスク。ドキュメントのみで完結しない。 |

---

## 目的

Phase 3 設計レビュー GO 判定（構造化ログ schema 固定・`get` fail-open 化・`dedupeKeyHash` SHA-256 12 char 短縮）を入力として、
全実装作業を **単一責務原則（SRP）** に沿った T1〜T8 のサブタスクに分解する。
各サブタスクの「変更ファイル候補」「上流依存」「所要時間」「DoD」を確定し、Phase 5（実装計画）以降が即着手可能な状態へ引き渡す。

UT-17 本体および兄弟 followup との責務境界:

| タスク | 責務 |
| --- | --- |
| UT-17 本体 | Cloudflare Notifications → alert-relay → Slack 日本語化 relay |
| UT-17-FU-002 | dedup state を in-memory → Cloudflare KV へ永続化（**前提・完了済**） |
| UT-17-FU-003 | 週次 cron による alert-relay 死活監視（独立） |
| **UT-17-FU-005（本タスク）** | **KV `get` / `put` 失敗の構造化ログ emit（observability）** |
| UT-17-FU-006 | KV usage dashboard 化（本タスクの後段、別 issue） |

---

## 実行タスク

- [ ] Phase 02/03 成果物（log-schema・helper-design・emit-points・get-fail-open-policy）が GO であることを確認する
- [ ] T1〜T8 のサブタスクテーブルを `outputs/phase-04/task-breakdown.md` に固定する
- [ ] 各サブタスクの「変更ファイル候補」「上流依存」「所要時間目安」「DoD」を埋める
- [ ] サブタスク実行順序（クリティカルパス）を `outputs/phase-04/critical-path.md` に図示する
- [ ] T2（helper 実装）が T3（emit point 接続）より前段に配置されていることを確認する
- [ ] T5（spec.ts テスト追加）が T6（runbook 追記）より前段に配置されていることを確認する
- [ ] `get` 側 fail-open 化が AC-5 / AC-10 の意図的挙動変更であることを Phase 12 documentation-changelog 連携項目として記録する
- [ ] artifacts.json の phase-04 を completed に更新する手順を確認する

---

## サブタスク分解（T1〜T8）

| # | サブタスク | 単一責務 | 変更ファイル候補 | 上流依存 | 所要時間 | DoD |
| --- | --- | --- | --- | --- | --- | --- |
| T1 | `isolateId` module-top 採番 | module load 時に `const isolateId = crypto.randomUUID()` を 1 回だけ採番 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | Phase 03 GO | 0.25h | top-level に `const isolateId = crypto.randomUUID();` が追加され、handler 内で再採番されない。`pnpm typecheck` PASS |
| T2 | `sha256Hex12` / `logKvOperationError` ヘルパ実装 | private helper を top-level に新設（外部 export しない） | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T1 完了 | 0.5h | `async function logKvOperationError(op, err, dedupeKey)` と `async function sha256Hex12(input)` が定義され、Phase 02 log-schema (`event` / `op` / `errorClass` / `dedupeKeyHash` / `isolateId` / `ts`) を満たす JSON を `console.warn(JSON.stringify(payload))` で 1 行 emit する |
| T3 | `KV.get` try/catch + fail-open 化 | 既存 `const seen = await c.env.ALERT_DEDUP_KV.get(dedupeKey)` を `try { ... } catch (err) { await logKvOperationError('get', err, dedupeKey); seen = null 相当 }` に置換 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T2 完了 | 0.5h | `KV.get` throw 時に warn 1 回 emit され、`seen` 相当が `null` 扱いで通常 Slack 配信フローへ続行する。`pnpm typecheck` PASS |
| T4 | `KV.put` catch JSON 化 | 既存 plain object `console.warn("alert relay dedup KV put failed...", { error })` を `await logKvOperationError('put', error, dedupeKey)` に置換。戻り値 `dedupPersisted: false` は不変 | 編集 `apps/api/src/routes/internal/alert-relay.ts` | T2 完了 | 0.25h | `KV.put` throw 時に warn 1 回 emit され、payload の `op` が `"put"`、レスポンスに `dedupPersisted: false` が乗る |
| T5 | vitest 新規 4 ケース | TC-KV-GET-THROW / TC-KV-PUT-THROW / TC-KV-SUCCESS-NO-WARN / TC-DEDUPE-KEY-HASH を `alert-relay.spec.ts` に追加 | 編集 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | T3 / T4 完了 | 1.0h | 4 ケース全 PASS、`vi.spyOn(console, 'warn')` の leak 防止に `afterEach(() => vi.restoreAllMocks())` が追加されている。`mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` PASS |
| T6 | 既存 TC-KV-05 の挙動更新 | `get` fail-open 化により、既存「KV get throw で 500」期待値の更新検討（GO/NO-GO は Phase 02 get-fail-open-policy で確定済） | 編集 `apps/api/src/routes/internal/__tests__/alert-relay.spec.ts` | T5 と並行 | 0.25h | TC-KV-05 が「`get` throw でも Slack 配信される（fail-open）」へ更新されているか、または `get` throw 時の挙動変更を反映した新規ケースに置換されている |
| T7 | runbook 追記 | KV 操作エラーログの確認手順・`scripts/cf.sh tail` grep 例・しきい値・schema 表を runbook へ追加 | 編集 `docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md` | T5 完了 | 0.5h | 「KV 操作エラーログの確認」セクションに `bash scripts/cf.sh tail --config apps/api/wrangler.toml --env production --format pretty \| grep alert_relay_kv_op_failed` の grep 例・「直近 1 時間で 10 件超で調査開始」しきい値・構造化ログ schema 表（field 名・型・例値）が記載されている |
| T8 | 品質ゲート | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` / `mise exec -- pnpm --filter @ubm-hyogo/api test -- alert-relay.spec` 全 PASS | n/a（実コード変更なし） | T7 完了 | 0.25h | 3 コマンド全 PASS。失敗時は上流タスクへ巻き戻し |

> **注記**: T1〜T8 は順序依存があり、T2 helper が完了する前に T3/T4 の emit 接続を行わない。T5 のテストが PASS する前に T7 runbook を確定しない。

---

## クリティカルパス

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
              ↓         ↓
              （T3/T4 は T2 完了後に並列可、T5 は T3/T4 両方の完了が前提）
```

| 区間 | 累積時間 | 備考 |
| --- | --- | --- |
| T1〜T2（前提整備） | 0.75h | isolateId 採番 + helper 実装 |
| T3〜T4（emit 接続） | 0.75h | `get` fail-open 化 + `put` catch 置換 |
| T5〜T6（テスト追加・既存ケース調整） | 1.25h | vitest 4 ケース + 既存 TC-KV-05 更新 |
| T7（runbook） | 0.5h | 運用手順追記 |
| T8（品質ゲート） | 0.25h | typecheck / lint / test PASS |
| **合計** | **3.5h** | 半営業日想定 |

---

## 不変条件チェック（CONST_005 準拠）

- [ ] D1 直接アクセスは `apps/api` に閉じる（本タスクは D1 アクセスなし、`apps/web` 変更なし）
- [ ] Secret は 1Password → Cloudflare Secrets。`.env` には `op://` 参照のみ（本タスクは新規 secret なし）
- [ ] Cloudflare CLI は `bash scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止。runbook 例も `scripts/cf.sh tail` 形式）
- [ ] alert-relay 主機能（dedupe TTL / Slack 配信 retry / `formatCloudflareAlertToSlack`）を改変しない
- [ ] `event` 文字列は `"alert_relay_kv_op_failed"` 固定（後段 logpush filter 契約）
- [ ] `isolateId` は module top で 1 回採番（handler 内採番禁止）
- [ ] raw `dedupeKey` をログに出力しない（12 char SHA-256 hash のみ）
- [ ] CONST_007: 全 T1〜T8 を本サイクル内で完了させる（持ち越し禁止）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| UT-17-FU-002（KV 永続化） | `ALERT_DEDUP_KV` binding と `kv-stub` test helper を共有 | spec.ts の `createKvStub({ getError, putError })` をそのまま利用 |
| UT-17-FU-003（週次 healthcheck） | 同じ alert-relay route を経由するが本タスクと独立 | 連携なし |
| UT-17-FU-006（KV usage dashboard） | 本タスクの `alert_relay_kv_op_failed` JSON ログを Workers Logs 経由で集計する | 後段タスクの前提として `event` 文字列固定を維持 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/ut-17-followup-005-alert-relay-kv-operation-error-metrics.md | 原典 |
| 必須 | docs/30-workflows/ut-17-followup-005-alert-relay-kv-error-metrics/index.md | 本タスク仕様書 index |
| 必須 | apps/api/src/routes/internal/alert-relay.ts | emit 追加対象（全 108 行） |
| 必須 | apps/api/src/routes/internal/__tests__/alert-relay.spec.ts | テスト追加対象 |
| 必須 | docs/30-workflows/runbooks/ut-17-alert-relay-monthly-healthcheck.md | runbook 追記対象 |
| 参考 | https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ | `crypto.subtle.digest` / `crypto.randomUUID` API |
| 参考 | https://developers.cloudflare.com/workers/observability/logs/workers-logs/ | Workers Logs JSON emit 取り扱い |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/task-breakdown.md | T1〜T8 サブタスクテーブル |
| ドキュメント | outputs/phase-04/critical-path.md | 実行順序とクリティカルパス図 |
| メタ | artifacts.json | phase-04 を completed に更新 |

---

## 完了条件

- [ ] T1〜T8 が単一責務原則で分解され、各サブタスクが「責務」「変更ファイル候補」「上流依存」「所要時間」「DoD」を持っている
- [ ] T2 helper 完了前に T3/T4 emit 接続が走らないことが確認されている
- [ ] T5 テスト追加が T7 runbook 追記より前段にあることが確認されている
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
  - T1〜T8 の DoD を Phase 5 で関数シグネチャ・型定義レベルまで具体化する
  - 変更ファイル候補（`alert-relay.ts` / `alert-relay.spec.ts` / `ut-17-alert-relay-monthly-healthcheck.md`）を Phase 5 の「変更対象ファイル一覧」に転記する
  - クリティカルパスを Phase 5 の実装順序の根拠とする
- ブロック条件: T1〜T8 のいずれかが単一責務でない、または `event` 文字列が schema-fix 違反になる設計が混入した場合

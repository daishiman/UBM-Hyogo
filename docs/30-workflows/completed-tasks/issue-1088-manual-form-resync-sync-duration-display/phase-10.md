**[実装区分: 実装仕様書 / implementation_mode: new]**

# Phase 10 — 最終レビュー

## 目的

issue #1088 の durationMs 実装が AC-1〜AC-6 をすべて充足し、blocker が無いことを判定する。MINOR 指摘は未タスク化候補として Phase 12 へ引き継ぐ。

## 10.1 AC 充足判定表

| AC | 内容 | 充足条件 | 担保 | 判定 |
|----|------|---------|------|------|
| **AC-1** | `runResponseSync` の 3 経路で `durationMs`（非負整数ミリ秒）を返却 | succeeded(268-274) / failed(225-232) / skipped(154-162) の 3 return に `durationMs: now().getTime() - startedAt` が付与され、開始時刻 `const startedAt = now().getTime();` が冒頭に存在 | backend spec TC-D1〜D9（3 経路 × 値検証）/ Phase 5 実装 | 実装サイクルで確定 |
| **AC-2** | `SyncResultSchema` に `durationMs` optional 追加・`.strict()` 維持 | `durationMs: z.number().int().nonnegative().optional()` が追加され、`.strict()` が残存・union 構造不変 | schema spec TC-S8〜S16 / Phase 9 §9.2 | 実装サイクルで確定 |
| **AC-3** | `resultRows` に durationMs 行・欠落時 `-`・実値表示 | `["durationMs", result.durationMs ?? "-"]` が追加され、値ありは実値、undefined は `-` を表示 | panel spec TC-B9 / TC-B14 / TC-B15 | 実装サイクルで確定 |
| **AC-4** | 既存表示 / 409 / `.strict()` / union 退化なし | mode/status/jobId/processedCount/writeCount/cursor/skippedReason の既存行・409（other sync in progress）ハンドリング・union 両分岐が不変 | panel spec 既存 TC-B1〜B8 / schema spec TC-S1〜S7 が回帰 green | 実装サイクルで確定 |
| **AC-5** | panel / schema spec 回帰 green | 既存 + 追加 TC がすべて pass | focused vitest log（Phase 7/11 証跡） | 実装サイクルで確定 |
| **AC-6** | contract spec durationMs 込み green | `responses-sync.contract.spec.ts` が durationMs を含む result で pass | api contract spec | 実装サイクルで確定 |

> 本 workflow は `implemented_local_evidence_captured`。AC-1〜AC-6 は Phase 4（テスト設計）・Phase 5（実装）・Phase 6（拡充）・Phase 7（カバレッジ）の local evidence で確認済み。runtime screenshot のみ user-gated として Phase 11 / Phase 13 に残す。

## 10.2 blocker 判定

| 観点 | 確認 | 判定 |
|------|------|------|
| backend 3 経路網羅 | succeeded / failed / skipped すべてに durationMs が付与される設計か | blocker なし（3 return すべてに付与） |
| `.strict()` 破壊 | optional 追加が strict parse を壊さないか | blocker なし（optional は strict と両立） |
| 既存契約破壊 | route 素通し維持・union 退化なし | blocker なし（`responses-sync.ts` 無変更） |
| D1 境界 | web 側に計時・D1 直参照が混入しないか | blocker なし（計時は apps/api 閉包） |
| 負値・小数の混入 | `durationMs` が非負整数になるか | blocker なし（`now().getTime()` 差分は同一時刻源で単調・整数ミリ秒。schema も `.int().nonnegative()` で二重ガード） |

**blocker: 0 件。** Phase 11（手動テスト）・Phase 12（ドキュメント）へ進行可能。

## 10.3 MINOR 指摘（未タスク化候補 → Phase 12 へ）

| ID | 指摘 | 重大度 | 扱い |
|----|------|--------|------|
| MINOR-1 | `now().getTime()` は monotonic clock ではないため、システム時刻が後退（NTP 補正等）した場合に理論上 durationMs が負になりうる。schema 側 `.nonnegative()` で弾けるが、backend で `Math.max(0, ...)` クランプを入れると堅牢 | MINOR | Phase 12 未タスク化候補として記録（実害は極小・runtime sync は数秒〜数分オーダー） |

> MINOR-1 は「機能に影響なし」を理由に握り潰さず、Phase 12 の `unassigned-task-detection.md` に current 候補として記録する（[Phase 10 MINOR → 未タスク化ルール]）。本タスクのスコープ（durationMs を 3 経路で返し UI に表示）は MINOR-1 なしで充足するため、本 PR には含めない。

## 10.4 scope-out（本タスクで実装しない・記録のみ）

| 項目 | 理由 | 引き継ぎ先 |
|------|------|-----------|
| durationMs 以外のメトリクス（writeRate / throughput 等） | issue #1088 は所要時間 1 指標のみ。他メトリクスは別関心 | Phase 12 scope-out 記録 |
| `sync/manual.ts:87` の `durationMs: 0` ハードコード修正 | resync 経路と無関係（別 sync 系）。本タスクの変更面に含めると責務が拡散 | Phase 8 §8.3 + Phase 12 scope-out 記録 |
| `sync/` 系と resync 系の計時 helper 統一 | cross-cutting refactor でスコープ超過 | Phase 8 §8.1 + Phase 12 scope-out 記録 |
| runtime screenshot の実取得 | admin 認証 + `SYNC_ADMIN_TOKEN` runtime + 実 resync が必要で user-gated | Phase 11 / Phase 13（user-gated） |

## 完了条件（Phase 10 DoD）

- [ ] AC-1〜AC-6 の充足条件と担保テストを判定表に記録した。
- [ ] blocker 0 件を確認した。
- [ ] MINOR-1（monotonic clock クランプ）を未タスク化候補として記録した。
- [ ] scope-out（他メトリクス / `manual.ts:87` / 計時統一 / runtime screenshot）を引き継ぎ先付きで記録した。

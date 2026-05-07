[実装区分: 実装仕様書]

# Phase 1: 要件定義 — task-03b-followup-006-per-sync-cap-alert

## 統合テスト連携

| 判定項目 | 結果 |
| --- | --- |
| NON_VISUAL spec-created gate | DOC_PASS |
| Runtime test execution | PENDING_IMPLEMENTATION_APPROVAL |

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | task-03b-followup-006-per-sync-cap-alert |
| task_id | TASK-03B-FOLLOWUP-006-PER-SYNC-CAP-ALERT |
| phase | 1 / 13 |
| wave | 03b follow-up / observability cluster |
| mode | sequential |
| 作成日 | 2026-05-03 |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| issue | #199 (OPEN) |
| scope | per-sync write cap 連続到達検知 + Analytics Engine emit + runbook。cap 値変更 / cron 間隔変更 / 通知チャネル本体構築は対象外 |

## Schema / 共有コード Ownership 宣言

| 対象 | 本タスクでの編集権 | owner / 参照元 | 理由 |
| --- | --- | --- | --- |
| `sync_jobs` テーブル DDL | no | U-04 | 既存 `metrics_json TEXT` 列で十分、migration 不要 |
| `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | yes | 03b cluster | `writeCapHit` optional 追加 |
| `apps/api/src/jobs/sync-forms-responses.ts` | yes | 本タスク | `succeed()` 呼び出しに `writeCapHit` を渡す |
| `apps/api/src/jobs/cap-alert.ts` (新規) | yes | 本タスク | 連続 hit detector + analytics emit |
| `apps/api/wrangler.toml` | yes | 本タスク | Analytics Engine binding 追加 |
| `cursor-store.ts` | no | 03b 本体 | cursor schema には触れない |

## 目的

per-sync write cap (200) 到達を観測可能にし、連続 N=3 回到達時にカスタムイベントを emit する観測ロジックを `apps/api` 側に閉じ込めて実装する。これにより無料枠 (D1 write 100k/day) を圧迫する構造的問題を 45 分以内に検知できる土台を作る。

## 要件サマリ

### 機能要件

- F-1: `runResponseSync()` が cap 到達した場合、`succeed()` の payload に `writeCapHit: true` を含める
- F-2: cap 未到達の場合、`writeCapHit: false` を含める（後方互換: absent も false 扱い）
- F-3: cap 到達後の処理完了時、新 helper `evaluateConsecutiveCapHits(env.DB, { window: 3 })` が直近 3 行を取得して連続判定を行う
- F-4: 連続 hit が未達から達成へ遷移した時のみ、`env.SYNC_ALERTS.writeDataPoint(...)` で `sync_write_cap_consecutive_hit` イベントを emit
- F-5: emit 失敗（binding 未設定 / Analytics Engine 障害）は `console.warn` のみで握り潰し、sync 本体の成功/失敗には影響させない。Phase 11 では warning grep を別 evidence とし、alert 無効を隠さない
- F-6: 閾値・チャネル・escalation 階段の specs 追記

### 非機能要件

- NF-1: 既存 sync 経路の latency 影響を最小化（detector の SQL は LIMIT 3 のみ）
- NF-2: PII / responseEmail / sessionToken を log / metrics に書かない（既存 redact 経路を維持）
- NF-3: D1 直接アクセスは `apps/api` 内に閉じる（不変条件 #5）
- NF-4: NON_VISUAL タスクとして Phase 11 evidence を grep / SQL log / dry-run log で構成する

## 実行タスク

1. 既存 `sync-forms-responses.ts` の `succeed()` 呼び出し位置と `metrics_json` shape を grep で確定。完了条件: 行番号と shape 表が確定する
2. `_shared/sync-jobs-schema.ts` の zod schema に `writeCapHit?: boolean` を追加した場合の PII guard 影響を確認。完了条件: PII チェックに影響しないと確認できる
3. Cloudflare Analytics Engine の free tier 制約 (25M write/month) と本ユースケース (96 cron/day × ~1 emit = 2,880/month) の余裕度を確定。完了条件: 余裕度が runbook に書ける数値になっている
4. AC-1〜AC-7 を Phase 6 / 7 / 11 evidence path に紐付ける。完了条件: AC ↔ evidence 対応表が下流フェーズに渡せる
5. user 承認 gate（コード実装着手 / commit / push / PR / Cloudflare deploy）の分離方針を確定

## 参照資料

- docs/30-workflows/completed-tasks/03b-parallel-forms-response-sync-and-current-response-resolver-followups/03b-followup-006-per-sync-cap-alert.md
- apps/api/src/jobs/sync-forms-responses.ts (lines 80-217)
- apps/api/src/jobs/_shared/sync-jobs-schema.ts
- apps/api/src/jobs/cursor-store.ts
- apps/api/wrangler.toml
- docs/00-getting-started-manual/specs/08-free-database.md

## 実行手順

- 対象 directory: `docs/30-workflows/task-03b-followup-006-per-sync-cap-alert/`
- 本仕様書作成では実コード変更・実 evidence 取得・commit / push / PR を行わない
- 実装着手は Phase 5 ランブックに従い user 明示指示後

## 完了条件

- 要件 F-1〜F-6, NF-1〜NF-4 が確定し phase-02 に渡せる
- AC ↔ evidence path 対応表が `outputs/phase-01/ac-evidence-mapping.md` に保存可能な粒度で確定する

# Phase 4 — 事前検証手順

## Phase 1-3 成果物の存在確認

| ファイルパス | 存在 | 内容充足 |
|-------------|------|---------|
| `outputs/phase-01/requirements.md` | OK | OK |
| `outputs/phase-02/design.md` | OK | OK |
| `outputs/phase-02/sync-flow.md` | OK | OK |
| `outputs/phase-03/review.md` | OK | OK |

全成果物: **存在確認 OK**

---

## フロー整合性検証

| 検証項目 | 結果 | 備考 |
|---------|------|------|
| 定期同期フローでsync_audit.trigger = 'scheduled'を使用 | PASS | sync-flow.md フロー1と一致 |
| 手動同期フローでsync_audit.trigger = 'manual'を使用 | PASS | sync-flow.md フロー2と一致 |
| バックフィルフローでsync_audit.trigger = 'backfill'を使用 | PASS | sync-flow.md フロー3と一致 |
| 全フローでsync_audit.status = 'running'から開始 | PASS | 各フロー冒頭のINSERT確認 |
| 全フローでfinished_atとstatusを更新して終了 | PASS | 各フロー末尾のUPDATE確認 |
| バックフィル時はSheetsがsource-of-truth | PASS | design.md §Source-of-Truth定義と一致 |

フロー整合性: **PASS**

---

## AC事前カバレッジ確認

Phase 5以降で以下の成果物が作成されることを確認:

| AC | Phase 5以降の対応成果物 |
|----|----------------------|
| AC-1 | `outputs/phase-05/sync-method-comparison.md` |
| AC-2 | `outputs/phase-05/sequence-diagrams.md` |
| AC-3 | `outputs/phase-05/retry-policy.md` |
| AC-4 | `outputs/phase-05/sync-audit-contract.md` |
| AC-5 | `outputs/phase-02/design.md`（既存） |
| AC-6 | `outputs/phase-05/retry-policy.md` |
| AC-7 | `outputs/phase-12/implementation-guide.md` |

---

## Phase 5 への引き継ぎ事項

1. Phase 2設計の内容を詳細化した成果物（比較表・シーケンス図・監査契約・リトライポリシー）を作成する
2. sync_audit テーブルのカラム詳細説明は `sync-audit-contract.md` で行う
3. `sequence-diagrams.md` では異常系（部分失敗・quota超過・D1失敗）も網羅する
4. `retry-policy.md` では Exponential Backoff パラメータを数値で明示する

**Phase 5 開始条件: クリア**

# Phase 6: 失敗ケース整理

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | retry 回数と offset resume 方針の統一 (U-UT01-09) |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 失敗ケース整理 |
| 作成日 | 2026-04-30 |
| 前 Phase | 5 (実装委譲ランブック) |
| 次 Phase | 7 (AC マトリクス検証) |
| 状態 | spec_created |
| タスク分類 | specification-design（failure-case） |
| taskType | docs-only |
| visualEvidence | NON_VISUAL |

## 目的

U-UT01-09 unassigned-task の「苦戦箇所 1〜4」「リスク R1〜R5」で記述された失敗ケースを、
具体ケース表へ展開し、canonical 採択後にも残存するリスク（特に R1 過渡的 failed 件数増、
R5 行削除耐性）を含めて、検出方法・復旧方針・関連 AC を一覧化する。本タスクは docs-only の
ため復旧手順はコマンド実行レベルではなく「UT-09 / 運用側に委譲する判断」として記述する。

## 実行タスク

1. 既存仕様欠落（canonical 不在）に起因する失敗ケースを 6 件以上列挙する（完了条件: 1000 行同期 / 600 行で failed / 行削除 / quota 耗尽 / 5 回 retry レース / offset 不在のリカバリ不能 を含む）。
2. canonical 採択後に残存する失敗ケースを 4 件以上列挙する（完了条件: R1 過渡的 failed 件数増 / R3 tick 内未完了 / R4 既定値変更失念 / R5 行削除 drift を含む）。
3. 各ケースの分類（migration / 制約 / quota / 過渡期 / DR）を付与する（完了条件: 全件で分類が一意）。
4. 各ケースの検出シグナル（ログ JSON / メトリクス / 手動 query）を記述する（完了条件: SRE が観測可能な粒度）。
5. 各ケースの復旧方針（UT-09 反映 / 運用 revert / 監視閾値再校正 / 申し送り）を記述する（完了条件: 本タスクではコマンド実行を伴わない判断レベル）。
6. canonical 採択後の残存リスクを Phase 12 unassigned-task-detection の入力候補として整理する（完了条件: 残存リスクごとに「再起票 or 受容」の判定が記述）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/unassigned-task/U-UT01-09-retry-and-offset-policy-alignment.md | 苦戦箇所 1〜4 / リスク R1〜R5 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-02/canonical-retry-offset-decision.md | canonical 採択値 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-04/test-strategy.md | V1〜V4 机上検証 |
| 必須 | docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/outputs/phase-05/ut09-handover-runbook.md | Step A〜F の例外パス |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | 既存実装の retry / withRetry 宣言 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | 既存 schema |
| 参考 | https://developers.google.com/sheets/api/limits | quota 上限値 |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync 関連正本仕様索引 |

## 失敗ケースマトリクス

### A 群: canonical 不在に起因する既存ケース（U-UT01-09 検出時点）

| # | 分類 | ケース | 原因（苦戦箇所 / R 番号） | 検出シグナル | 復旧方針（判断レベル） | 関連 AC |
| - | --- | --- | --- | --- | --- | --- |
| 1 | 過渡期 | retry=3 期待の SRE と retry=5 実装のレース | 苦戦箇所 1 | SRE 介入ログと自動再試行ログの time overlap | UT-09 反映で canonical retry に統一（Step B） | AC1, AC6 |
| 2 | quota | retry=5 × baseMs=50 で 100s window 内 burst | 苦戦箇所 1 / 苦戦箇所 3 | Sheets API 429 / `quota exceeded` ログ | UT-09 で canonical curve（Step B）+ batch_size 維持 | AC2, AC5 |
| 3 | DR | 1000 行同期で 600 行成功後 batch 7 連続失敗 → 全体 failed | 苦戦箇所 2 | `sync_job_logs` で `processed_offset` 不在 / failed | UT-09 で offset resume（Step C/D） or 冪等 upsert 確認 | AC3, AC4 |
| 4 | DR | 全件再取得ループで Workers CPU 制限到達 | 苦戦箇所 2 | scheduled handler timeout ログ | offset 採用（Step C）または batch_size 縮小 | AC3, AC5 |
| 5 | 監査 | failed ログの「どこまで進んだか」復元不能 | 苦戦箇所 4 | `sync_job_logs` の retry_count のみで progress 不明 | offset 列追加 or `started_at` 上書き禁止仕様明文化 | AC3, AC4 |
| 6 | quota | 手動同期 + cron 同期の同時刻重複で quota 上振れ | 苦戦箇所 3 | `sync_locks` 取得失敗ログ / quota 429 | `sync_locks` 排他で抑止確認（U-UT01-07 整合） | AC5 |

### B 群: canonical 採択後にも残存するケース

| # | 分類 | ケース | 原因（R 番号） | 検出シグナル | 復旧方針（判断レベル） | 関連 AC |
| - | --- | --- | --- | --- | --- | --- |
| 7 | 過渡期 | retry=5→canonical 切替直後に failed 件数が一時的増加 | R1 | failed ログ件数の staging 想定比 +X% | 過渡期 7 日のしきい値再校正（Step F）。+200% 超過なら Step B revert | AC1, AC6 |
| 8 | 運用 | 本番 SLO 算定が retry=5 ベースから移行未完了 | R1 | アラート過剰発火 / モニタリング閾値乖離 | SRE 運用で SLO 文書を canonical retry ベースへ更新 | AC1, AC6 |
| 9 | scheduled | canonical curve を秒オーダーへ伸ばすと 1 tick 内完了不能 batch 増加 | R3 | scheduled handler timeout / `in_progress` 残留 | Phase 9 worst case で「batch_size × max_retries × backoff 上限」< cron 間隔の証明、超過時は batch_size 縮小 | AC2, AC5 |
| 10 | env | `SYNC_MAX_RETRIES` 既定値変更を wrangler.toml / .dev.vars に反映忘れ | R4 | runtime 値が旧値のまま / staging で挙動差分 | UT-09 受入条件に反映ポイント appendix 列挙（Step A） | AC6 |
| 11 | offset | offset 採用後に Sheets 行削除で position drift | R5 | 期待行と異なる行を再開対象に upsert / 監査 diff | offset 単位を chunk_index + 安定 ID（hybrid C ケース）に再定義、または採用見送り | AC3 |
| 12 | migration | `processed_offset` 列追加 migration が既存行 backfill で誤った DEFAULT 0 を意味付け | R2 | failed ログの再開判定が誤動作 | migration 適用前に「DEFAULT 0 = 未開始」の意味整合を Phase 2 で確定、適用は UT-09 / U-UT01-07 委譲 | AC4 |

合計: 12 件（A 群 6 + B 群 6）。

## 検出シグナルのログ JSON フォーマット例

UT-07 通知基盤想定に整合させ、以下のフォーマット雛形を申し送る:

```json
{ "code": "SYNC_RETRY_EXCEEDED", "retryCount": 5, "expectedMax": 3, "responseId": "r123" }
{ "code": "SYNC_QUOTA_BURST", "windowSec": 100, "requests": 521, "limit": 500 }
{ "code": "SYNC_PARTIAL_FAILED", "processedOffset": 600, "totalRows": 1000, "lastBatch": 7 }
{ "code": "SYNC_OFFSET_DRIFT", "offsetType": "rowIndex", "drift": "+1" }
{ "code": "SYNC_TICK_TIMEOUT", "elapsedMs": 29800, "tickLimitMs": 30000 }
```

> 上記 code 体系は UT-07（通知基盤）標準化対象。本タスクでは仮置きとし、確定は UT-07 へ委譲する。

## 残存リスクの取り扱い（Phase 12 unassigned 候補）

| ケース# | 判定 | 根拠 |
| --- | --- | --- |
| #7, #8 | **受容（過渡期 7 日）** | R1 は時限的。Step F で再校正して収束 |
| #9 | **受容（Phase 9 で証明）** | tick 内収まりが Phase 9 worst case で算定済みなら追加タスク不要 |
| #10 | **UT-09 受入条件で吸収** | 反映ポイント appendix で網羅。再起票不要 |
| #11 | **要監視 / 採用ケース次第で再起票** | hybrid C 採択時は対策済み、A 単独採択時は U-UT01-09-2（仮）として再起票候補 |
| #12 | **U-UT01-07 へ申し送り** | 列追加とその意味整合は ledger 整合タスクの責務 |

## 各ケース ↔ 検証スイート / Step wire-in

| Case # | 対応 V (Phase 4) | 対応 Step (Phase 5) |
| --- | --- | --- |
| #1, #2 | V1 retry boundary / V3 quota | Step B (定数 canonical 化) |
| #3, #4, #5 | V2 offset シナリオ / V4 migration | Step C (offset ロジック) / Step D (migration) |
| #6 | V3 quota worst case | （U-UT01-07 sync_locks 整合へ申し送り） |
| #7, #8 | V1 retry boundary（過渡期挙動） | Step F (過渡期運用) |
| #9 | V3 quota / tick 内収まり | Step B (backoff curve) |
| #10 | （env 反映確認） | Step A (env 既定値) |
| #11 | V2 ケース C | Step C (offset 単位 hybrid) |
| #12 | V4 migration 決定木 | Step D (migration 適用) |

## 実行手順

1. 12 件マトリクスを `outputs/phase-06/failure-cases.md` に転記する。
2. ログ JSON フォーマット雛形を UT-07 想定に合わせて記述する。
3. 残存リスク表（受容 / 申し送り / 再起票候補）を Phase 12 unassigned-task-detection の入力として整理する。
4. ケース ↔ V/Step wire-in を Phase 4 / Phase 5 と相互参照する。
5. 復旧方針が「コマンド実行」ではなく「判断レベル」に留まっていることを確認する（docs-only 準拠）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 7 | 12 件を AC マトリクスの「関連 failure case」列に紐付け |
| Phase 9 | #2, #4, #6, #9 を quota worst case 算定の入力に流用 |
| Phase 11 | docs-only のため staging smoke は実施せず、参照リンク整合のみ確認 |
| Phase 12 | 残存リスク表を unassigned-task-detection に登録 |
| UT-09 phase-06 | 12 件を実装側の failure case 入力に流す |

## 多角的チェック観点

- 価値性: A 群 / B 群がそれぞれ canonical 採択前後の失敗を網羅しているか。
- 実現性: 検出シグナルが SRE / 監視ダッシュボードで観測可能な粒度か。
- 整合性: 苦戦箇所 1〜4 / R1〜R5 が全てケース# に対応しているか。
- 運用性: 残存リスクの判定（受容 / 申し送り / 再起票候補）が運用判断に使えるか。
- 認可境界: 復旧方針が docs-only タスクの範囲を逸脱（コマンド実行記述）していないか。
- セキュリティ: ログ JSON 例に実値・トークン等が含まれていないか。

## サブタスク管理

| # | サブタスク | 状態 |
| --- | --- | --- |
| 1 | A 群 6 ケース確定 | spec_created |
| 2 | B 群 6 ケース確定 | spec_created |
| 3 | 分類付与 | spec_created |
| 4 | 検出シグナル / ログ JSON 雛形 | spec_created |
| 5 | 復旧方針（判断レベル） | spec_created |
| 6 | 残存リスク表（Phase 12 入力） | spec_created |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/failure-cases.md | 12 件マトリクス + ログ JSON 雛形 + 残存リスク表 + V/Step wire-in |
| メタ | artifacts.json | Phase 6 状態更新 |

## 完了条件

- [ ] A 群 6 件以上が苦戦箇所 1〜4 を網羅
- [ ] B 群 4 件以上が R1〜R5 の残存リスクを網羅
- [ ] 全ケースに分類・検出・復旧方針・関連 AC が記入
- [ ] ログ JSON 雛形が UT-07 通知基盤想定に整合
- [ ] 残存リスク表（受容 / 申し送り / 再起票候補）が Phase 12 入力として完成
- [ ] V/Step wire-in が Phase 4 / Phase 5 と diff ゼロ
- [ ] 復旧方針がコマンド実行記述を含まない（docs-only 準拠）

## Phase 完了スクリプト呼出例

```bash
# Phase 6 完了マーキング
mise exec -- pnpm tsx scripts/phase/mark-complete.ts \
  --task u-ut01-09-retry-and-offset-policy-alignment \
  --phase 6 \
  --output outputs/phase-06/failure-cases.md
```

## タスク100%実行確認【必須】

- 実行タスク 6 件が `spec_created`
- 成果物が `outputs/phase-06/failure-cases.md` に配置済み
- 12 件全てに 6 項目（#・分類・ケース・原因・検出・復旧・AC）が記入
- canonical 採択後の残存リスクが B 群 4 件以上で明示
- wrangler 直叩き / コード変更指示が本ドキュメントにゼロ件

## 次 Phase への引き渡し

- 次 Phase: 7 (AC マトリクス検証)
- 引き継ぎ事項:
  - 12 件 failure case を AC マトリクスの「関連 failure case」列で参照
  - 残存リスク表を Phase 12 unassigned-task-detection.md の入力に予約
  - ログ JSON 雛形を UT-07 標準化候補として申し送り
- ブロック条件:
  - A 群 6 件未満
  - B 群 4 件未満
  - 復旧方針にコマンド実行記述が含まれる（docs-only 違反）

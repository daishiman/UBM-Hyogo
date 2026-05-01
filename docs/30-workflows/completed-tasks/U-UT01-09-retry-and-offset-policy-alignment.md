# U-UT01-09: retry 回数と offset resume 方針の統一

## メタ情報

| 項目 | 値 |
| --- | --- |
| ID | U-UT01-09 |
| 親タスク | UT-01 (Sheets→D1 同期方式定義) |
| 関連タスク | UT-09 (Sheets→D1 同期ジョブ実装) / U-UT01-07 (`sync_log` と `sync_job_logs`/`sync_locks` 整合) / U-UT01-08 (sync 状態 enum / trigger enum 統一) |
| 優先度 | HIGH |
| 起票日 | 2026-04-29 |
| 状態 | spec_created |
| taskType | docs-only-contract |
| visualEvidence | NON_VISUAL |
| 検出元 | UT-01 Phase 12 unassigned-task-detection.md（U-9） |
| 起票時期 | UT-09 実装追補 / 設計差分レビュー |
| 後継workflow | `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` |
| Issue状態 | #263 CLOSED のまま設計判断記録として残置 |

## close-out 同期（2026-04-30）

本未タスクは後継 workflow `docs/30-workflows/completed-tasks/u-ut01-09-retry-and-offset-policy-alignment/` により Phase 1〜12 の設計判断記録を作成済み。root 状態は `spec_created` を維持し、実装変更は UT-09、物理 ledger / migration は U-UT01-07 へ委譲する。

| AC | close-out 状態 |
| --- | --- |
| AC1 | PASS: retry max = 3、`SYNC_MAX_RETRIES` override 存続 |
| AC2 | PASS: backoff base 1s / factor 2 / cap 32s / jitter ±20%。UT-09 では 1 invocation budget を別途検証する |
| AC3 | PASS: `processed_offset` 採用、chunk index 単位。行削除 / 挿入 / 並べ替え検知時は offset invalidation を UT-09 受入条件へ追加 |
| AC4 | PASS: migration 影響は机上評価済み。物理 DDL は UT-09 / U-UT01-07 |
| AC5 | PASS: quota worst case 2 req / 100s = 0.4% |
| AC6 | PASS: `SYNC_MAX_RETRIES` 既定 3、過渡期 7 日 |

## 目的

UT-01 論理仕様（Phase 02 `sync-method-comparison.md` / `sync-log-schema.md`）が定める「retry 最大 3 回 + Exponential Backoff + `processed_offset` による再開」と、既存実装 (`apps/api/src/jobs/sync-sheets-to-d1.ts` の `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES`) および既存 migration (`apps/api/migrations/0002_sync_logs_locks.sql` に `processed_offset` カラム不在) との差分を、canonical な retry / offset resume ポリシーとして一意化する設計判断を確定する。本タスクは設計文書のみで、実装変更は UT-09 追補で行う。

## 直交関係

| 関連 | 直交性 |
| --- | --- |
| U-UT01-07 (`sync_log` 物理対応) | テーブル/カラムの ledger 整合に責務が閉じる。本タスクは値ポリシー（最大回数 / backoff curve / offset resume 採否）に閉じる |
| U-UT01-08 (status / trigger enum 統一) | enum 名前空間に閉じる。本タスクは数値・タイミング・再開ロジックに閉じる |
| UT-09 実装 | 本タスクが canonical を確定し、UT-09 が実装反映する。UT-09 単独では値判断を行わない |

## スコープ

### 含む
- canonical retry 最大回数の決定（仕様 3 回 / 実装 5 回 / その他案の比較評価と採択理由）
- canonical Exponential Backoff curve の決定（仕様 1s/2s/4s/8s/16s/32s 上限 / 実装 `baseMs: 50` / jitter 採用可否）
- `processed_offset` カラム追加可否の決定（追加 / 全範囲再取得 + 冪等 upsert / hybrid のいずれかを採択）
- 既存実装値（`DEFAULT_MAX_RETRIES = 5`）を 3 へ寄せる場合の影響評価（過渡期 quota / SLA / failed log 解釈）
- `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値方針
- D1 migration 影響範囲（カラム追加 / backfill / NOT NULL DEFAULT の選択）の机上評価
- Sheets API quota（500 req/100s/project）整合性の再検証

### 含まない
- 実装変更（コード修正 / migration 追加 / wrangler 設定変更）
- UT-09 ジョブのコード変更
- 新規テーブル作成や `sync_job_logs` のリネーム（→ U-UT01-07）
- enum リネーム（→ U-UT01-08）
- 本番データの再同期実施

## 苦戦箇所【記入必須】

**1. retry 回数差分による失敗解釈の二重化**
仕様は「3 回失敗で failed 確定」を前提に SLA / monitoring を組む想定だが、実装は 5 回まで暗黙に再試行する。同じエラー事象でも仕様読者と実装ログ読者で「失敗した」と見なすタイミングがずれ、SRE オペレータが「3 回 retry 済」のログを見て手動介入を始めても実装はまだ自動再試行中、というレース状態が起きる。実装が 5 回試行する間に Sheets API quota（500 req/100s/project）を消費し、quota 耗尽時に手動同期が同時失敗する具体ケースを確認した。

**2. `processed_offset` 不在による部分失敗リカバリ不能**
1000 行同期中に 600 行 upsert 完了 → batch 7（行 601-700）で 3 回連続失敗 → ジョブ全体 failed のシナリオで、現行実装は次回 tick / 手動再実行時に行 0 から再取得 + 冪等 upsert に依存する。これは Sheets API quota を毎回フル消費し、Workers CPU 制限（一定時間で打ち切り）に近接した行数では「永遠に最後の batch に到達できない」状態に陥る具体ケースが成立する。`processed_offset` を持てば 600 行目から再開できるが、行の安定 ID 不在（UT-01 苦戦箇所 2）と組み合わせて offset 単位（行 / chunk index / Sheets rowIndex）の選定も canonical に決める必要がある。

**3. backoff curve 差分が quota 上限を踏み抜く**
仕様は 1s/2s/4s/8s/16s/32s（合計待機 ~63s 上限、5 retry で約 3.5 req）。実装は `baseMs: 50` 起点で同じ指数なら 50/100/200/400/800ms と 1 オーダー短い。batch size 100 行 + 並走 cron で短い backoff のまま retry 5 回が走ると、100s ウィンドウ内に同一 project から burst が発生し quota 超過が他 batch にも波及する。canonical curve を確定しないと UT-09 実装で「baseMs を秒オーダーに直す + retry 3 回」「baseMs を維持して retry 5 回」のどちらに収束させるかが判断不能になる。

**4. failed log 30 日保持と offset の意味整合**
`sync-log-schema.md` は `processed_offset` を「再開可能な書き込み済境界」として定義するが、実装テーブルには列がないため failed ログの監査時に「どこまで進んでいたか」が SQL で復元不能。failed → in_progress 再開時に `started_at` 上書きしないという仕様も、offset が無いと再開判定の根拠が retry_count しかなくなる。

## リスクと対策

| # | リスク | 影響 | 対策 |
| --- | --- | --- | --- |
| R1 | retry 5→3 へ寄せた直後に過渡的に failed ログが増える | 監査ノイズ / アラート過剰発火 | canonical 決定文書に「適用直後 7 日は failed 件数しきい値を staging 実測ベースで再校正」と明記 |
| R2 | `processed_offset` 追加は migration を伴う | D1 prod に対する破壊的変更リスク | 本タスクは机上評価のみ。物理 migration は UT-09 / U-UT01-07 の責務へ明示移譲し、本タスクは「列追加 / 別経路採用 / 採用見送り」の 3 択判断のみ確定 |
| R3 | backoff curve を秒オーダーへ伸ばすと 1 tick 内に完了できない batch が増える | scheduled handler の打ち切りで failed が常態化 | tick 内に収まる「batch_size × max_retries × backoff 上限」の理論最大時間を本仕様で算定し、cron 間隔（既定 6h）と非衝突であることを証明 |
| R4 | `SYNC_MAX_RETRIES` 環境変数の既定値変更を忘れる | 値が変わっても挙動が旧値のまま | canonical 決定後の wrangler 設定 / .dev.vars の参照ポイントを appendix で列挙し、UT-09 受入条件に含めるよう申し送り |
| R5 | offset resume を採用しても Sheets 側で行が削除されると意味が変わる | 600 行目以降が誤った行を指す | offset を「Sheets rowIndex」ではなく「ジョブ内 chunk index + 安定 ID 集合」として再定義する設計案を本タスク内で採否決定 |

## 検証方法

### V1: retry boundary テスト（机上）
- canonical 候補値（3 / 5 / 環境変数で可変）について、batch_size 100 / 1000 行データ / 1 batch 障害シナリオで「成功率 / 想定 quota 消費 / 1 tick 内最大滞在時間」を表計算し、各 SLA threshold を満たすか確認する
- 採択値が 1 tick 内に収まり、Sheets API quota を理論最大で 500 req/100s 未満に抑えることを示す

### V2: offset resume シナリオ
- ケース A: `processed_offset` 採用 + Sheets 行削除なし → 600 行で failed → 次回 tick で 600 行目から再開し追加 quota 400 req に収まる
- ケース B: `processed_offset` 不採用 + 冪等 upsert → 1000 行毎回再取得で quota 1000 req/tick × cron 頻度を quota window 内に収まることを試算
- ケース C: hybrid（offset を chunk index で持ち、安定 ID で重複排除）→ 行削除耐性を持つことを示す
- 3 ケースを比較し採択ケースを確定

### V3: Sheets API quota 影響
- canonical retry 回数 × backoff curve × batch_size × cron 間隔の組み合わせで、worst case 100s window 内 request 数を計算し 500 未満であることを示す
- 手動同期（`POST /admin/sync`）と cron 同期が同時刻に重なった場合の上振れも算定し、`sync_locks` による排他で抑止できることを確認

### V4: D1 migration 影響評価
- `processed_offset INTEGER NOT NULL DEFAULT 0` を `sync_job_logs` へ追加する場合の prod migration 手順（既存行への DEFAULT 適用 / rollback 手順）を文書化
- 採用見送りの場合は「列追加なしで再開判定する代替シグナル（`retry_count` / `started_at` の意味）」を明文化

## 受入条件

- [ ] AC1: canonical retry 最大回数（3 / 5 / その他）が比較表とともに採択され、採択理由が明文化されている
- [ ] AC2: canonical Exponential Backoff curve（base / 上限 / jitter 採否）が確定し、batch_size 100 と cron 間隔 6h で 1 tick 内に収まることが机上証明されている
- [ ] AC3: `processed_offset` schema 採否（追加 / 不採用 / hybrid）が決定され、採択ケースの offset 単位（行 / chunk index / 安定 ID）が定義されている
- [ ] AC4: D1 migration 影響（追加列・DEFAULT・既存行 backfill・rollback）が机上で評価され、UT-09 / U-UT01-07 への申し送り内容が記載されている
- [ ] AC5: Sheets API quota（500 req/100s/project）整合が worst case シナリオで成立することが算定済みである
- [ ] AC6: `SYNC_MAX_RETRIES` 環境変数の存続可否と既定値、`DEFAULT_MAX_RETRIES = 5` を canonical へ寄せる際の過渡期運用方針が記載されている

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-log-schema.md | `processed_offset` / retry_count / failed → in_progress 再開の論理定義 |
| 必須 | docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-02/sync-method-comparison.md | retry 最大 3 回 / backoff 1s〜32s / batch 100 の確定パラメータ |
| 必須 | docs/30-workflows/ut-01-sheets-d1-sync-design/outputs/phase-12/unassigned-task-detection.md | U-9 検出文脈と U-7 / U-8 との直交関係 |
| 必須 | apps/api/src/jobs/sync-sheets-to-d1.ts | `DEFAULT_MAX_RETRIES = 5` / `SYNC_MAX_RETRIES` / `withRetry({ maxRetries, baseMs: 50 })` の宣言箇所 |
| 必須 | apps/api/migrations/0002_sync_logs_locks.sql | `processed_offset` カラム不在 / `retry_count` のみ存在の事実 |
| 必須 | docs/30-workflows/unassigned-task/UT-01-sheets-d1-sync-design.md | 親タスク仕様（フォーマット模倣元） |
| 参考 | .claude/skills/aiworkflow-requirements/indexes/quick-reference.md | sync / retry / offset 関連の正本仕様への索引 |
| 参考 | .claude/skills/task-specification-creator/SKILL.md | docs-only / NON_VISUAL 縮約テンプレ準拠ルール |

## 注意事項

- 本タスクはコード変更を一切伴わない設計確定タスクであり、コミット禁止
- 実装反映は UT-09 追補（または UT-09 受入条件への canonical 申し送り）で行う
- U-UT01-07（ledger 整合）/ U-UT01-08（enum 統一）と直交。値ポリシーに閉じる
- canonical 採択に至った場合でも、本ファイルは「設計判断記録」として残置し、実装反映後も削除しない

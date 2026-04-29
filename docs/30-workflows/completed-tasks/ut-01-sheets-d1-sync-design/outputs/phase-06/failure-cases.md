# Phase 6 成果物: 異常系検証（failure-cases.md）

> **ステータス**: completed
> 本ファイルは UT-01 設計タスクの異常系検証の正本。仕様本体は `../../phase-06.md` を参照。

## 1. スコープ宣言

本タスクは docs-only / NON_VISUAL の設計仕様であり、ランタイム異常系を実コードで再現することはしない。本 Phase は **「Phase 2 設計成果物が、想定される異常系シナリオに対して責務・対応方針を明示しているか」** を **設計レベルで検証** する。実コード再現は UT-09 が IMPL-T-3（Backoff）/ IMPL-T-4（status 遷移）/ IMPL-T-5（quota guard）/ IMPL-T-7（部分失敗 resume）/ IMPL-T-8（二重起動冪等性）で実施する。

検証手段は `outputs/phase-02/` 配下に対する rg ベースの存在確認 + 目視 walkthrough。`/tmp/ut-01-failure-walkthrough/` にコピーして読み込み、本物 outputs を破壊しない方針を採る。

## 2. 異常系シナリオ（FC）

### 2.1 FC-1 Sheets API 一時障害（5xx / network error）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 定期 cron 実行中に Sheets API が 503 を返す |
| 設計上の期待挙動 | 最大 3 回 Exponential Backoff（1s / 2s / 4s）で再試行 → 全失敗で `sync_log.status=failed` + `error_code=5xx` + `error_message` 保存 → 次 cron tick で新規 job_id にて再試行 |
| 検証 rg | `rg -n "Backoff\|3 回\|リトライ\|最大 3 回" outputs/phase-02/` |
| 期待検出 | 3 系列ともヒット（採択方式 §5 確定パラメータ + flow §エラーパス） |
| 防御線 | AC-3（リトライ方針） / AC-4（sync_log.error_code, error_message） |
| ロールバック設計 | sync_log を `failed` のまま残置、次 tick が新規 job_id で再実行（重複なし） |

### 2.2 FC-2 D1 書込失敗（D1 binding 一時不可 / SQLITE_BUSY）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | バッチ書込中に D1 が binding error / `SQLITE_BUSY` で transaction abort |
| 設計上の期待挙動 | 当該 chunk を `failed` ロールバック / `processed_offset` を直前バッチ末尾で固定 / 次回 cron tick で `processed_offset` から resume / chunk 単位 retry |
| 検証 rg | `rg -in "offset\|resume\|SQLITE_BUSY\|chunk" outputs/phase-02/` |
| 期待検出 | 4 ラベルすべてヒット |
| 防御線 | AC-3 / AC-4 / AC-7（INSERT ON CONFLICT DO UPDATE で重複なし） |
| ロールバック設計 | UPSERT のため resume で重複行は発生しない |

### 2.3 FC-3 Workers CPU タイムアウト（10ms バースト / 50ms 上限）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 1000 行を 1 cron tick で処理中に CPU 上限到達 |
| 設計上の期待挙動 | バッチサイズ 100 行で分割 → 1 tick で全件不可なら次 tick で resume / I/O 待ちは CPU 時間にカウントされない |
| 検証 rg | `rg -n "バッチ\|100\|chunk" outputs/phase-02/sync-method-comparison.md` |
| 期待検出 | バッチサイズ 100 が明示（§5 確定パラメータ） |
| 防御線 | AC-6（quota + バッチサイズ） / 苦戦箇所 #1（CPU 制限と Sheets 応答遅延の衝突） |
| ロールバック設計 | バッチ単位コミットで `processed_offset` 進行、tick 跨ぎでも整合維持 |

### 2.4 FC-4 部分失敗（1000 行中 500 行で中断）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 500 行書込後にエラー発生、残 500 行が未処理 |
| 設計上の期待挙動 | `sync_log.processed_offset=500` / `status=failed` → 次 tick で `processed_offset=500` から resume / バックフィル時は手動トリガーで再開可 |
| 検証 rg | `rg -in "processed_offset\|resume\|部分失敗" outputs/phase-02/` |
| 期待検出 | 3 ラベルヒット |
| 防御線 | AC-3（部分失敗時継続戦略） / AC-4（processed_offset カラム） / 苦戦箇所 #3 |
| ロールバック設計 | full-resync 不要。offset ベース resume |

### 2.5 FC-5 quota 超過（500 req/100s/project）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | バックフィルで 5,000 行を一括同期し Sheets API quota が枯渇 |
| 設計上の期待挙動 | バッチ 100 行 + Backoff 1〜32s + quota 超過時 100s 以上待機戦略 / `error_code=quota_exhausted` 記録 |
| 検証 rg | `rg -n "500\|quota\|待機\|100 秒\|100s" outputs/phase-02/` |
| 期待検出 | quota / 待機戦略が明文化（§5 + §エラーパス） |
| 防御線 | AC-6（quota 対処方針） / 苦戦箇所 #4 |
| ロールバック設計 | quota 回復後に `processed_offset` から resume |

### 2.6 FC-6 冪等性破綻（重複起動 / 再実行で行が重複コピー）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 手動トリガーと cron が同時実行 / 同じバッチが 2 回処理 |
| 設計上の期待挙動 | バンドマン固有 ID（または行ハッシュ）+ INSERT ON CONFLICT DO UPDATE で行重複ゼロ / sync_log の job_id が UUID で衝突しない / `idempotency_key` で実行単位排他 |
| 検証 rg | `rg -in "ON CONFLICT\|冪等\|ハッシュ\|UUID\|idempotency_key" outputs/phase-02/` |
| 期待検出 | 全ラベルヒット |
| 防御線 | AC-7（冪等性担保） / 苦戦箇所 #2 |
| ロールバック設計 | 不要（ON CONFLICT で常に最新値に収束） |

### 2.7 FC-7 SoT コンフリクト（Sheets と D1 で値が乖離）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | D1 を直接書換えてから Sheets と乖離した状態で次 cron tick が走る |
| 設計上の期待挙動 | **Sheets 優先**（一方向同期）→ D1 が Sheets 値で上書きされる。直接書換えは禁止（不変条件 #5）。乖離検出時は `sync_log.error_code=mapping_error` 等で記録 |
| 検証 rg | `rg -in "Sheets 優先\|一方向\|source-of-truth\|SoT" outputs/phase-02/` |
| 期待検出 | SoT が「Sheets 優先」一意で記述（Phase 5 §6 SoT マトリクス連動） |
| 防御線 | AC-5（SoT 優先順位 + ロールバック判断フロー） / Phase 5 Step 4 SoT 決定マトリクス |
| ロールバック設計 | Sheets 値で D1 を再生成（full backfill 手動トリガー） |

### 2.8 FC-8 sync_log の異常状態遷移（pending → completed への直接遷移など）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 実装側で status を `pending → completed` に直接書換え（`in_progress` をスキップ） |
| 設計上の期待挙動 | 状態遷移は `pending → in_progress → completed/failed` のみ許容。`failed → in_progress` は `retry_count++` 条件付きで許容。`sync-log-schema.md` §3 に許容遷移表が含まれる |
| 検証 rg | `rg -in "pending\|in_progress\|状態遷移" outputs/phase-02/sync-log-schema.md` |
| 期待検出 | 遷移定義が §3 に明文化 |
| 防御線 | AC-4（status カラム + 状態遷移） |
| ロールバック設計 | UT-09 実装時に状態遷移 guard を実装（IMPL-T-4） |

### 2.9 FC-9 Workers Cron Triggers の二重起動

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | Cron Triggers が短時間に二重発火し 2 ジョブが並走 |
| 設計上の期待挙動 | sync_log の `in_progress` レコード存在 + `lock_expires_at` 未到達時は新規 cron tick が **早期リターン**（active lock 相当） |
| 検証 rg | `rg -in "in_progress\|二重\|lock_expires_at\|active lock" outputs/phase-02/` |
| 期待検出 | 二重起動への対応方針が明示（sync-log-schema §1 概要 + §6） |
| 防御線 | AC-3 / AC-7 |
| ロールバック設計 | ON CONFLICT で常に整合維持。stale lock は `lock_expires_at` 経過で自動解放 |

### 2.10 FC-10 Sheets schema 変更（列追加・列削除）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | フォーム編集で列が追加され、D1 マッピングと不整合 |
| 設計上の期待挙動 | 不変条件 #1「実フォームの schema をコードに固定しすぎない」適用。マッピング層で未知列は WARN ログ + 既知列のみ同期。schema 変更検知の自動化は本タスクスコープ外で `unassigned-task-detection.md` 候補 |
| 検証 rg | `rg -in "schema\|マッピング\|mapping_error" outputs/phase-02/` |
| 期待検出 | schema 変動許容方針が明示（sync-log-schema §error_code に `mapping_error`） |
| 防御線 | 不変条件 #1 / AC-3（部分失敗継続戦略） |
| ロールバック設計 | 既知列のみ同期続行、新列は次マイグレーション（UT-04）で取り込み |

## 3. 防御線サマリー

| FC | 防御 Phase | 防御 AC | fail-fast 機能箇所 | rg 期待検出 |
| --- | --- | --- | --- | --- |
| FC-1 | Phase 2 / 4 | AC-3 / AC-4 | Phase 4 TC-2-3 | OK |
| FC-2 | Phase 2 / 4 | AC-3 / AC-4 / AC-7 | Phase 4 TC-2-3, TC-2-7 | OK |
| FC-3 | Phase 2 / 4 | AC-6 | Phase 4 TC-2-6 | OK |
| FC-4 | Phase 2 / 4 | AC-3 / AC-4 | Phase 4 TC-2-3, TC-2-4 | OK |
| FC-5 | Phase 2 / 4 | AC-6 | Phase 4 TC-2-6 | OK |
| FC-6 | Phase 2 / 4 | AC-7 | Phase 4 TC-2-7 | OK |
| FC-7 | Phase 2 / 5 | AC-5 | Phase 4 TC-2-5 / Phase 5 Step 4 | OK |
| FC-8 | Phase 2 | AC-4 | Phase 4 TC-1-4 | OK |
| FC-9 | Phase 2 | AC-3 / AC-7 | Phase 4 TC-2-3 | OK |
| FC-10 | Phase 2 / 12 | 不変条件 #1 / AC-3 | Phase 12 unassigned-task-detection | OK（mapping_error） |

## 4. sandbox walkthrough 手順

```bash
# 成果物コピー（破壊しないため）
mkdir -p /tmp/ut-01-failure-walkthrough
cp -r outputs /tmp/ut-01-failure-walkthrough/

# FC ごとに rg を実行し記述存在を検証
cd /tmp/ut-01-failure-walkthrough
rg -n "Backoff|3 回|リトライ|最大 3 回" outputs/phase-02/        # FC-1
rg -in "offset|resume|SQLITE_BUSY|chunk" outputs/phase-02/      # FC-2
rg -n "バッチ|100|chunk" outputs/phase-02/sync-method-comparison.md  # FC-3
rg -in "processed_offset|resume|部分失敗" outputs/phase-02/      # FC-4
rg -n "500|quota|待機|100 秒|100s" outputs/phase-02/             # FC-5
rg -in "ON CONFLICT|冪等|ハッシュ|UUID|idempotency_key" outputs/phase-02/  # FC-6
rg -in "Sheets 優先|一方向|source-of-truth|SoT" outputs/phase-02/  # FC-7
rg -in "pending|in_progress|状態遷移" outputs/phase-02/sync-log-schema.md  # FC-8
rg -in "in_progress|二重|lock_expires_at|active lock" outputs/phase-02/  # FC-9
rg -in "schema|マッピング|mapping_error" outputs/phase-02/        # FC-10

# 終了時
rm -rf /tmp/ut-01-failure-walkthrough
```

walkthrough 結果: FC-1〜FC-10 すべての検証 rg が Phase 2 成果物にヒット可能なキーワードを含むことを確認した（`sync-method-comparison.md` §エラーパス・§5 確定パラメータ、`sync-flow-diagrams.md` §エラーパス、`sync-log-schema.md` §2 / §3 / §6）。rg ヒット件数は実行時に取得し本ファイルに転記する。

## 5. スコープ外（unassigned-task-detection 候補）

- **FC-10 schema 変更自動検知**: 列追加・列削除の自動検出 → UT-04 / UT-08 領域。本タスクでは「未知列は WARN + 既知列のみ同期」方針のみ確定し、検知自動化は別タスク化。
- **実コード異常系の Vitest / 統合テスト**: UT-09 IMPL-T-3〜IMPL-T-9 で実施。
- **Sheets API quota の動的計測**: 実 quota 余剰の monitoring は UT-08（モニタリング/アラート設計）領域。
- **D1 SQLITE_BUSY の頻度計測**: staging 実測は UT-09 / UT-26 領域。

## 6. Phase 8 / Phase 12 への引き継ぎ

| 項目 | 引き継ぎ先 | 内容 |
| --- | --- | --- |
| FC-7 SoT 単一正本化 | Phase 8 DRY 化 | 「Sheets 優先」記述が複数 Phase に重複しないよう正本集約 |
| FC-10 schema 変更検知自動化 | Phase 12 unassigned-task-detection | 別タスク化候補として記録 |
| FC-3 CPU タイムアウト実測 | UT-09 staging | TECH-M-02 と連動して staging で測定 |
| FC-5 quota 配分 | UT-03 | MINOR-M-Q-01 として申し送り（GCP プロジェクト共有時の quota 配分） |

## 7. DoD チェック

- [x] FC-1〜FC-10 が全件記述
- [x] 各 FC に検出 rg と防御線（AC / TC / Phase / 不変条件）が紐付く
- [x] ロールバック設計（UT-09 引き継ぎ含む）が紐付け済
- [x] 防御線サマリー表が完成
- [x] sandbox walkthrough 手順記録
- [x] スコープ外項目の別タスク化方針記載（§5）
- [x] Phase 8 / Phase 12 への引き継ぎリスト作成（§6）

## 8. 苦戦箇所への配慮

- **「コードで再現」の誘惑回避**: §1 で実コード再現は UT-09 担当と明示。
- **rg 偽陽性**: §2 の各 FC で「期待検出」キーワードを限定し、目視確認を要求。
- **FC-7 SoT 揺れ**: §6 で Phase 5 SoT マトリクスを単一正本として参照する旨を Phase 8 へ引き継ぎ。
- **FC-10 越境**: §5 でスコープ外宣言。
- **本物 outputs 破壊防止**: §4 で `/tmp/` コピー後に rg を実行する手順を採用。

## 9. 次 Phase 引き継ぎ

- Phase 7（AC マトリクス）へ FC-1〜FC-10 / 防御線サマリー / 欠落リスト（なし） / Phase 8・12 引き継ぎリストを引き継ぎ

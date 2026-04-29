# Phase 6: 異常系検証（設計の異常パス検証）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証（設計レベル） |
| 作成日 | 2026-04-29 |
| 上流 | Phase 5（implementation-runbook） |
| 下流 | Phase 7（AC マトリクス） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

本タスクは docs-only / NON_VISUAL の設計仕様であり、ランタイム異常系を実コードで再現することはしない。代わりに **「Phase 2 設計成果物が、想定される異常系シナリオに対して責務・対応方針を明示しているか」** を **設計レベルで検証** する。

具体的には、

1. 同期失敗（API エラー / D1 書込失敗 / Workers タイムアウト）
2. **部分失敗**（1000 行中 500 行で中断 → resume 設計）
3. **quota 超過**（500 req/100s/project の Sheets API 制限）
4. **冪等性破綻**（重複起動 / 再実行で行が重複コピー）
5. **SoT コンフリクト**（Sheets と D1 で値が乖離した状態）

の各シナリオを列挙し、対応方針が phase-02 成果物（`sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`）に **網羅されているか rg / 目視で確認** する手順を確定する。観察ログを `outputs/phase-06/failure-cases.md` に記録し、欠落があれば Phase 8 DRY 化 / Phase 12 documentation で逆反映する。

## 入力

- `outputs/phase-02/sync-method-comparison.md`
- `outputs/phase-02/sync-flow-diagrams.md`
- `outputs/phase-02/sync-log-schema.md`
- `outputs/phase-03/main.md`（リスク R-1〜R-N）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-6）
- `outputs/phase-05/implementation-runbook.md`（SoT 決定マトリクス）

## 異常系シナリオ（FC）

### FC-1 Sheets API 一時障害（5xx / network error）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 定期 cron 実行中に Sheets API が 503 を返す |
| 設計上の期待挙動 | 最大 3 回 Exponential Backoff（1s / 2s / 4s）で再試行 → 全失敗で `sync_log.status=failed` + error_message 保存 → 次 cron tick で再試行 |
| 検証方法 | `rg -n "Backoff\|3 回\|リトライ" outputs/phase-02/` で記述存在確認 |
| 期待検出 | 3 系列ともヒット |
| 防御 | AC-3（リトライ方針） / AC-4（sync_log.error_message） |
| ロールバック設計 | sync_log を `failed` のまま残し、次 tick が新規 job_id で再実行（重複なし） |

### FC-2 D1 書込失敗（D1 binding 一時不可 / トランザクションエラー）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | バッチ書込中に D1 が binding error / transaction abort |
| 設計上の期待挙動 | 当該バッチを `failed` ロールバック / `sync_log.offset` を直前バッチ末尾で固定 / 次回 cron tick で `offset` から resume |
| 検証方法 | `rg -in "offset\|resume\|rollback" outputs/phase-02/` |
| 期待検出 | 3 ラベルすべてヒット |
| 防御 | AC-3 / AC-4 / AC-7（ON CONFLICT DO UPDATE で重複なし） |
| ロールバック設計 | 設計上 `INSERT ... ON CONFLICT DO UPDATE` のため、resume で重複行は発生しない |

### FC-3 Workers CPU タイムアウト（30ms バースト / 50ms 上限）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 1000 行を 1 cron tick で処理中に CPU 上限到達 |
| 設計上の期待挙動 | バッチサイズ 100〜500 行で分割 → 1 tick で全件不可なら次 tick で resume |
| 検証方法 | `rg -n "バッチ\|100\|500" outputs/phase-02/sync-method-comparison.md` |
| 期待検出 | バッチサイズが明示されている |
| 防御 | AC-6（Sheets quota + バッチサイズ） / 苦戦箇所 #1（CPU 制限と Sheets 応答遅延の衝突） |
| ロールバック設計 | バッチ単位コミットで `offset` 進行、tick 跨ぎでも整合維持 |

### FC-4 部分失敗（1000 行中 500 行で中断）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 500 行書込後にエラー発生、残 500 行が未処理 |
| 設計上の期待挙動 | sync_log.offset=500 / status=failed → 次 tick で `offset=500` から resume / バックフィル時は手動トリガーで再開可 |
| 検証方法 | `rg -in "部分失敗\|resume\|offset" outputs/phase-02/` |
| 期待検出 | 3 ラベルヒット |
| 防御 | AC-3（部分失敗時継続戦略） / AC-4（offset カラム） / 苦戦箇所 #3 |
| ロールバック設計 | full-resync 不要。offset ベース resume |

### FC-5 quota 超過（500 req/100s/project）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | バックフィルで 10000 行を一括同期し Sheets API quota が枯渇 |
| 設計上の期待挙動 | バッチ 100〜500 行 + Exponential Backoff + quota 超過時の **明示的待機戦略**（次 100s window まで sleep / または次 tick に持ち越し） |
| 検証方法 | `rg -n "500 req\|quota\|待機\|sleep" outputs/phase-02/` |
| 期待検出 | quota / 待機戦略が明文化 |
| 防御 | AC-6（quota 対処方針） / 苦戦箇所 #4 |
| ロールバック設計 | quota 回復後に offset から resume |

### FC-6 冪等性破綻（重複起動 / 再実行で行が重複コピー）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 手動トリガーと cron が同時実行 / 同じバッチが 2 回処理 |
| 設計上の期待挙動 | バンドマン固有 ID（または行ハッシュ）+ `INSERT ... ON CONFLICT DO UPDATE` で行重複ゼロ / sync_log の job_id が UUID で衝突しない |
| 検証方法 | `rg -in "ON CONFLICT\|冪等\|ハッシュ\|UUID\|job_id" outputs/phase-02/` |
| 期待検出 | 全ラベルヒット |
| 防御 | AC-7（冪等性担保） / 苦戦箇所 #2 |
| ロールバック設計 | 不要（ON CONFLICT で常に最新値に収束） |

### FC-7 SoT コンフリクト（Sheets と D1 で値が乖離）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | D1 を直接書換えてから Sheets と乖離した状態で次 cron tick が走る |
| 設計上の期待挙動 | **Sheets 優先**（一方向同期）→ D1 が Sheets 値で上書きされる。直接書換えは禁止（不変条件 #5: D1 直接アクセスは apps/api 限定）。乖離検出時は `sync_log` に WARN 相当 log を残す |
| 検証方法 | `rg -in "Sheets 優先\|一方向\|source-of-truth\|SoT" outputs/phase-02/` |
| 期待検出 | SoT が「Sheets 優先」一意で記述 |
| 防御 | AC-5（SoT 優先順位 + ロールバック判断フロー） / Phase 5 Step 4 SoT 決定マトリクス |
| ロールバック設計 | Sheets 値で D1 を再生成（full backfill 手動トリガー）|

### FC-8 sync_log の異常状態遷移（pending → completed への直接遷移など）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | 実装側で status を `pending → completed` に直接書換え（`in_progress` をスキップ） |
| 設計上の期待挙動 | 状態遷移は `pending → in_progress → completed/failed` のみ許容。`sync-log-schema.md` に遷移図または許容遷移表を含める |
| 検証方法 | `rg -in "pending.*in_progress\|状態遷移" outputs/phase-02/sync-log-schema.md` |
| 期待検出 | 遷移定義が明文化 |
| 防御 | AC-4（status カラム + 状態遷移） |
| ロールバック設計 | UT-09 実装時に状態遷移 guard を実装（IMPL-T-4） |

### FC-9 Workers Cron Triggers の二重起動

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | Cron Triggers が短時間に二重発火し 2 ジョブが並走 |
| 設計上の期待挙動 | sync_log の `in_progress` レコード存在時は新規 cron tick が **早期リターン**（mutex 相当） / または並走を許容するが ON CONFLICT で整合維持 |
| 検証方法 | `rg -in "二重\|in_progress\|mutex\|並走" outputs/phase-02/` |
| 期待検出 | 二重起動への対応方針が明示 |
| 防御 | AC-3 / AC-7 |
| ロールバック設計 | ON CONFLICT で常に整合維持 |

### FC-10 Sheets schema 変更（列追加・列削除）

| 項目 | 内容 |
| --- | --- |
| 仮想シナリオ | フォーム編集で列が追加され、D1 マッピングと不整合 |
| 設計上の期待挙動 | 不変条件 #1「実フォームの schema をコードに固定しすぎない」適用。マッピング層で未知列は WARN ログ + 既知列のみ同期。schema 変更検知は `unassigned-task-detection.md` 候補 |
| 検証方法 | `rg -in "schema\|マッピング" outputs/phase-02/` |
| 期待検出 | schema 変動許容方針が明示 |
| 防御 | 不変条件 #1 / AC-3（部分失敗継続戦略） |
| ロールバック設計 | 既知列のみ同期続行、新列は次マイグレーション（UT-04）で取り込み |

## 防御線サマリー

| FC | 防御 Phase | 防御 AC | fail-fast 機能箇所 |
| --- | --- | --- | --- |
| FC-1 | Phase 2 / 4 | AC-3 / AC-4 | Phase 4 TC-2-3 |
| FC-2 | Phase 2 / 4 | AC-3 / AC-4 / AC-7 | Phase 4 TC-2-3, TC-2-7 |
| FC-3 | Phase 2 / 4 | AC-6 | Phase 4 TC-2-6 |
| FC-4 | Phase 2 / 4 | AC-3 / AC-4 | Phase 4 TC-2-3, TC-2-4 |
| FC-5 | Phase 2 / 4 | AC-6 | Phase 4 TC-2-6 |
| FC-6 | Phase 2 / 4 | AC-7 | Phase 4 TC-2-7 |
| FC-7 | Phase 2 / 5 | AC-5 | Phase 4 TC-2-5 / Phase 5 Step 4 |
| FC-8 | Phase 2 | AC-4 | Phase 4 TC-1-4 |
| FC-9 | Phase 2 | AC-3 / AC-7 | Phase 4 TC-2-3 |
| FC-10 | Phase 2 / 12 | 不変条件 #1 / AC-3 | Phase 12 unassigned-task-detection |

## sandbox 設計

本 Phase では実行可能なコードがないため、sandbox は **「Phase 2 成果物に対する rg / 目視 walkthrough」** 形式で行う。`/tmp/ut-01-failure-walkthrough/` にコピーを作って読み込む方法でも可。

```bash
# 成果物コピー（破壊しないため）
mkdir -p /tmp/ut-01-failure-walkthrough
cp -r outputs /tmp/ut-01-failure-walkthrough/

# FC ごとに rg を実行し記述存在を検証
cd /tmp/ut-01-failure-walkthrough
rg -n "Backoff|3 回|リトライ" outputs/phase-02/      # FC-1
rg -in "offset|resume|rollback" outputs/phase-02/    # FC-2
rg -n "バッチ|100|500" outputs/phase-02/             # FC-3
rg -in "部分失敗|resume|offset" outputs/phase-02/    # FC-4
rg -n "500 req|quota|待機|sleep" outputs/phase-02/   # FC-5
rg -in "ON CONFLICT|冪等|ハッシュ|UUID|job_id" outputs/phase-02/  # FC-6
rg -in "Sheets 優先|一方向|source-of-truth|SoT" outputs/phase-02/  # FC-7
rg -in "pending.*in_progress|状態遷移" outputs/phase-02/sync-log-schema.md  # FC-8
rg -in "二重|in_progress|mutex|並走" outputs/phase-02/  # FC-9
rg -in "schema|マッピング" outputs/phase-02/         # FC-10

# 終了時
rm -rf /tmp/ut-01-failure-walkthrough
```

## 実行タスク

1. FC-1〜FC-10 を sandbox（読み取り walkthrough）で再現
2. 各 FC で防御線（AC / TC / 設計記述）が存在することを rg で確認
3. 観察ログを `outputs/phase-06/failure-cases.md` に記録
4. 欠落があれば Phase 2 成果物への追記タスクを Phase 8 / Phase 12 に予約
5. 防御線サマリー表を作成
6. スコープ外（FC-10 の schema 変更検知自動化など）を `unassigned-task-detection.md` 候補化

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-05/implementation-runbook.md` |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-06.md`（FC フォーマット模倣元） |

## 依存Phase明示

- Phase 2 / 3 / 4 / 5 成果物を参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-06/failure-cases.md` | FC-1〜FC-10 / 検出 rg / 防御線 / ロールバック / 防御線サマリー / sandbox walkthrough ログ |

## 完了条件 (DoD)

- [ ] FC-1〜FC-10 が成果物に記述
- [ ] 各 FC に検出 rg コマンドと防御線（AC / TC / Phase / 不変条件）が紐付く
- [ ] ロールバック設計（実装担当 UT-09 への引き継ぎ含む）が紐付け済
- [ ] 防御線サマリー表が作成済
- [ ] sandbox 設計（破壊しない読み取り walkthrough）が記述済
- [ ] スコープ外 FC（schema 変更自動検知など）の別タスク化方針記載

## 苦戦箇所・注意

- **「コードで再現」の誘惑**: FC を実コードで実行したくなるが、本タスクは docs-only。実コード再現は UT-09 IMPL-T-7（部分失敗 resume）で実施
- **rg 検出の偽陽性**: 「Backoff」が単語として登場しても本質的な意味で記述されているかは目視確認。**rg の hit 件数だけで GREEN 判定しない**
- **FC-7 の SoT 揺れ**: Phase 5 Step 4 SoT 決定マトリクスと食い違うと FC-7 検出が機能しない。**マトリクスを単一の正本** として参照
- **FC-10 の越境**: schema 変更検知の自動化に踏み出すと UT-04 / UT-08 領域に侵入。本タスクスコープ外として `unassigned-task-detection.md` に切り出す
- **本物の outputs を破壊しない**: walkthrough 中に誤って outputs を編集しないよう、`/tmp/` コピー後に読むのが安全

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様であり、実コードでの異常系テストは追加しない。
- 異常系の実コード再現は UT-09 が IMPL-T-3（Backoff）/ IMPL-T-4（status 遷移）/ IMPL-T-5（quota guard）/ IMPL-T-7（部分失敗 resume）/ IMPL-T-8（二重起動冪等性）で実施する。
- 本 Phase は **設計記述の網羅性検証** に責務を限定する。

## 次 Phase

- 次: Phase 7（AC マトリクス）
- 引き継ぎ: FC-1〜FC-10 検出結果 / 防御線サマリー / 欠落あれば Phase 8 / 12 への引き継ぎリスト

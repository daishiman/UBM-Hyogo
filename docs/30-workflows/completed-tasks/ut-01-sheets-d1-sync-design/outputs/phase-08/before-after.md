# Phase 8 成果物: before / after 比較（before-after.md）

> **ステータス**: completed
> 仕様本体は `../../phase-08.md` を参照。`main.md` から本ファイルへリンク参照。

## 1. 観点 1: 同期フロー記述

### before（重複あり）

`sync-method-comparison.md` の採択理由節、`implementation-runbook.md` Step 2-B、`failure-cases.md` FC-1〜4 で、3 種フロー（手動 / 定期 / バックフィル）の Mermaid sequenceDiagram またはエラーパス記述が部分再掲される懸念があった。

### after（DRY 化後）

- 正本: `phase-02/sync-flow-diagrams.md` §2（手動）/ §3（定期）/ §4（バックフィル）/ §5（エラーパス）/ §6（ロールバック判断）
- 参照側（他 Phase outputs）: 「フロー図は `phase-02/sync-flow-diagrams.md` §X を参照」とリンク表記のみ。Mermaid 図本体は再掲しない。
- 削減効果: 図の重複維持コスト 0 / 改版時の同期コスト 0 / UT-09 が読むべき正本が 1 ファイルに集約

## 2. 観点 2: エラーハンドリング 6 項目

### before

「最大 3 回 / 1s→2s→4s→8s→16s→32s / 100s 待機」の Backoff 値と「リトライ / quota 超過 / SQLITE_BUSY / 部分失敗 / Dead Letter / 二重実行防止」の 6 項目が、`phase-03/main.md` リスク節 / `phase-04/test-strategy.md` TC-2-3 / `phase-05/implementation-runbook.md` Step 2-A / `phase-06/failure-cases.md` FC-1〜FC-9 で部分再掲される懸念があった。

### after

- 正本: `phase-02/sync-method-comparison.md` §5 確定パラメータ + `phase-02/sync-flow-diagrams.md` §エラーパス
- 参照側: 項目名（リトライ / Backoff / 冪等 / failed ログ）+ 「詳細は `phase-02/sync-method-comparison.md` §5 を参照」のみ。Backoff 数値（1s / 2s / 4s / ...）は再掲禁止。
- 削減効果: 数値の改版時に 1 ファイル更新で全 Phase に反映 / grep 表記揺れ検出の偽陽性削減

## 3. 観点 3: sync_log 13 カラム定義

### before

13 カラム（id / trigger_type / status / started_at / finished_at / processed_offset / total_rows / error_code / error_message / retry_count / created_at / idempotency_key / lock_expires_at）の型・制約付きフル定義が、`implementation-runbook.md` Step 2-C と `failure-cases.md` FC-2/4/8 と `ac-matrix.md` AC-4 で部分再掲される懸念があった。

### after

- 正本: `phase-02/sync-log-schema.md` §2 カラム定義 + §3 状態遷移 + §4 索引 + §5 保持期間 + §6 active lock
- 参照側: カラム名のみ参照（例: 「`processed_offset` から resume」）。型・制約・既定値は再掲禁止。状態遷移図（Mermaid 風 ASCII）も再掲禁止。
- 削減効果: UT-04 が物理 DDL を作る際に参照する正本が 1 箇所に確定

## 4. 観点 4: 冪等性 3 戦略

### before

行ハッシュ / バンドマン固有 ID / `INSERT ON CONFLICT DO UPDATE` の 3 戦略が、`phase-01/main.md` 苦戦箇所、`phase-03/main.md` リスク R-4、`phase-04/test-strategy.md` IMPL-T-2/8 で本文再掲される懸念があった。

### after

- 正本: `phase-02/sync-method-comparison.md` §5 確定パラメータ + §6 既知制約 + `phase-02/sync-log-schema.md` §6 active lock
- 参照側: 戦略名 + 「UT-04 引き継ぎ事項」の旨のみ。本文（順序非依存ハッシュ / null 安全 / UPSERT 構文）は再掲禁止。
- UT-04 引き継ぎ表記の統一: 「UT-04 引き継ぎ事項」（「UT-04 へ申し送り」「UT-04 で実装」は使わない）
- 削減効果: 冪等性方針の改版時の同期漏れ防止

## 5. 観点 5: Sheets API quota 5 項目

### before

500 req/100s/project / バッチサイズ 100 行 / 並列度 1 / Backoff 1〜32s / quota 超過判定（HTTP 429 / `RESOURCE_EXHAUSTED`）の 5 項目が、`phase-04/test-strategy.md` TC-2-6、`phase-06/failure-cases.md` FC-5、`phase-09/free-tier-estimation.md` §3 で部分再掲される懸念があった。

### after

- 正本: `phase-02/sync-method-comparison.md` §5 + `phase-02/sync-flow-diagrams.md` §エラーパス
- 参照側: 項目名のみ。値（500 / 100 / 1 / 1〜32s）は再掲禁止。
- **例外**: `phase-09/free-tier-estimation.md` は無料枠見積もり計算の根拠として独立記述を許容（観点 5 の例外）。ただし quota 値そのものは正本と一致確認必須。
- 削減効果: quota 値が公式仕様変更で更新された場合の同期コスト最小化

## 6. 観点 6: aiworkflow-requirements references 既述との境界

### before

Cron Triggers 設定手順（wrangler.toml / scheduled handler）/ D1 binding 設定 / SQLITE_BUSY retry 一般方針 / apps/api 境界の説明が、本仕様書内に再掲される潜在リスクがあった。

### after

- 外部正本: `aiworkflow-requirements/references/deployment-cloudflare.md` / `database-schema.md` / `architecture-overview-core.md`
- 仕様書内記述方針:
  - Cron Triggers 構文 → `deployment-cloudflare.md` リンクのみ
  - D1 binding → `deployment-cloudflare.md` リンクのみ
  - SQLITE_BUSY 一般方針 → `database-schema.md` リンクのみ
  - apps/api 境界 → 「不変条件 #5: D1 直接アクセスは apps/api に閉じる」一文 + `architecture-overview-core.md` リンクのみ
- 残置記述: UT-01 固有判断（cron 間隔 `0 */6 * * *` / batch 100 / Backoff 1〜32s / sync_log 13 カラム / SoT 優先順位）は仕様書内に残し AC-9（UT-09 が本仕様書のみで着手可能）を維持

## 7. 統合判断ログ

| # | 統合先 | 参照側方針 | 判断理由 |
| --- | --- | --- | --- |
| 1 | `phase-02/sync-flow-diagrams.md` | リンクのみ | 図の重複維持コスト最小化 + UT-09 読み下し起点固定 |
| 2 | `phase-02/sync-method-comparison.md` §5 / `sync-flow-diagrams.md` §エラーパス | 項目名のみ + リンク | 数値改版の同期漏れ防止 |
| 3 | `phase-02/sync-log-schema.md` | カラム名のみ | 型・制約は単一正本で UT-04 への引き継ぎ単純化 |
| 4 | `phase-02/sync-method-comparison.md` §5・§6 + `sync-log-schema.md` §6 | 戦略名 + UT-04 引き継ぎ旨のみ | 冪等性方針の正本固定 |
| 5 | `phase-02/sync-method-comparison.md` §5 + `sync-flow-diagrams.md` §エラーパス | 項目名のみ（free-tier-estimation.md は例外）| quota 値の正本一意化 |
| 6 | `aiworkflow-requirements/references/*` | リンクのみ | 基盤記述は外部正本に委譲、UT-01 固有のみ仕様書内残置 |

## 8. 表記統一 grep ログ

| 概念 | grep コマンド | 揺れ検出 | 統一適用 |
| --- | --- | --- | --- |
| status 値 | `grep -rn "running\|done\|error_status" outputs/` | 0 件 | OK |
| trigger_type 値 | `grep -rn "scheduled" outputs/` | `scheduled handler` という Workers 用語のみ（trigger_type 値としての `scheduled` 使用 0 件） | OK |
| Backoff 値 | `grep -rn "2 倍\|3 回" outputs/` | 「最大 3 回」「Exponential Backoff」表記に統一 | OK |
| quota 値 | `grep -rn "300 req/分\|100 req/100s" outputs/` | 0 件 | OK |
| Cron スケジュール | `grep -rn "Cron" outputs/ \| grep -E "[0-9*/ ]+"` | 既定 `0 */6 * * *`、調整余地として 5 分 / 1h を §5 に明示 | OK |

## 9. リスク評価

| リスク | 内容 | 緩和策 |
| --- | --- | --- |
| リンク切れ | 正本ファイルの見出し変更時に参照側が壊れる | セクション番号ではなく **見出しテキスト** を引用ターゲットとし、見出し変更を検知できるようにする。Phase 11 link-checklist.md で再走 |
| 仕様変更時の同期コスト | 正本だけ更新して参照側の文脈が古くなる | Phase 12 documentation-changelog.md で更新履歴を集約 |
| aiworkflow-requirements 側との同期 | 外部正本の見出しが将来変わる可能性 | Phase 9 / Phase 11 で `verify-indexes-up-to-date` CI gate との整合を再確認する義務を残す |
| 過剰 DRY による読みづらさ | 短いセクションまで集約すると正本ファイルへの往復が増え可読性低下 | 5 行未満のセクションは集約せず明示性優先（main.md §「苦戦箇所・注意」に判断記録） |
| AC-9 への影響 | 外部正本リンクが増えすぎると「本仕様書のみで着手」が成り立たない | UT-01 固有判断は仕様書内残置の原則を §6 で明文化 |

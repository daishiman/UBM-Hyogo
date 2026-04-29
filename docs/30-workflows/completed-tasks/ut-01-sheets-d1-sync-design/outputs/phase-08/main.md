# Phase 8 成果物: DRY 化（main.md）

> **ステータス**: completed
> 本タスク: docs-only / NON_VISUAL / spec_created / design_specification
> 仕様本体は `../../phase-08.md` を参照。before/after 詳細は `before-after.md` を参照。

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 8 / 13 |
| visualEvidence | NON_VISUAL |
| taskType | docs-only |
| workflow_state | spec_created |
| 実行日 | 2026-04-29 |

## 2. 入力ファイルと精読ログ

| パス | 役割 | 重複検出観点 |
| --- | --- | --- |
| `outputs/phase-01/main.md` | 要件 / AC-1〜10 | 1, 2, 4, 5 |
| `outputs/phase-02/sync-method-comparison.md` | 4 方式比較・採択理由・エラーハンドリング・冪等性・quota | **正本候補**（観点 1, 2, 4, 5） |
| `outputs/phase-02/sync-flow-diagrams.md` | 3 種フロー図・ロールバック判断 | **正本候補**（観点 1） |
| `outputs/phase-02/sync-log-schema.md` | 13 カラム論理スキーマ・状態遷移 | **正本候補**（観点 3） |
| `outputs/phase-03/main.md` | PASS/MINOR/MAJOR 判定 + MINOR 追跡 | 2, 4 |
| `outputs/phase-03/alternatives.md` | 代替案 4 件比較 | 1 |
| `outputs/phase-04/test-strategy.md` | TC-1〜TC-6 / IMPL-T-1〜9 | 2 |
| `outputs/phase-05/implementation-runbook.md` | Step 0〜6 / SoT マトリクス | 1, 2, 4 |
| `outputs/phase-06/failure-cases.md` | FC-1〜FC-10 | 2, 4, 5 |
| `outputs/phase-07/ac-matrix.md` | AC × TC × FC | （参照のみ） |
| `.claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | D1 / Cron Triggers 既存記述 | **外部正本**（観点 6） |
| `.claude/skills/aiworkflow-requirements/references/database-schema.md` | 隣接スキーマ / sync_log 境界 | **外部正本**（観点 6） |
| `.claude/skills/aiworkflow-requirements/references/architecture-overview-core.md` | apps/api 境界 | **外部正本**（観点 6） |

## 3. 重複検出サマリー

| # | 観点 | 重複対象 | 重複先（仕様書内） | 統合方針 |
| --- | --- | --- | --- | --- |
| 1 | 同期フロー記述（手動 / 定期 / バックフィル） | Mermaid sequenceDiagram + エラーパス | `phase-02/sync-method-comparison.md` 採択理由節 / `phase-05/implementation-runbook.md` Step 2-B / `phase-06/failure-cases.md` FC-1〜4 | **正本 = `phase-02/sync-flow-diagrams.md`**。他は「フロー図は phase-02/sync-flow-diagrams.md §X を参照」と表記 |
| 2 | エラーハンドリング 6 項目（リトライ / quota 超過 / SQLITE_BUSY / 部分失敗 / Dead Letter / 二重実行防止） | Backoff 値「1s→2s→4s→8s→16s→32s」「最大 3 回」「100s 待機」 | `phase-03/main.md` リスク節 / `phase-04/test-strategy.md` / `phase-05/implementation-runbook.md` / `phase-06/failure-cases.md` | **正本 = `phase-02/sync-method-comparison.md` §5 + `sync-flow-diagrams.md` §エラーパス**。他は項目名のみ再掲、Backoff 値は再掲禁止 |
| 3 | sync_log 13 カラム定義（型 / 制約 / 用途） | id / trigger_type / status / started_at / finished_at / processed_offset / total_rows / error_code / error_message / retry_count / created_at / idempotency_key / lock_expires_at | `phase-05/implementation-runbook.md` Step 2-C / `phase-06/failure-cases.md` FC-2/4/8 / `phase-07/ac-matrix.md` AC-4 | **正本 = `phase-02/sync-log-schema.md`**。他はカラム名のみ参照、型・制約は再掲禁止 |
| 4 | 冪等性 3 戦略（行ハッシュ / 固有 ID / ON CONFLICT DO UPDATE） | 戦略本体記述 | `phase-01/main.md` 苦戦箇所 / `phase-03/main.md` R-4 / `phase-04/test-strategy.md` IMPL-T-2/8 | **正本 = `phase-02/sync-method-comparison.md` §5・§6 + `sync-log-schema.md` §6**。他は戦略名 + UT-04 引き継ぎの旨のみ |
| 5 | Sheets API quota 5 項目（500 req/100s / バッチ 100 / 並列度 1 / Backoff / quota 超過判定） | quota 値・対処方針 | `phase-04/test-strategy.md` TC-2-6 / `phase-06/failure-cases.md` FC-5 / `phase-09/free-tier-estimation.md` §3 | **正本 = `phase-02/sync-method-comparison.md` §5 + `sync-flow-diagrams.md` §エラーパス**。`phase-09/free-tier-estimation.md` は計算根拠として独立記述許容（観点 5 例外） |
| 6 | aiworkflow-requirements references 既述内容 | Cron Triggers 設定手順 / D1 binding 設定 / SQLITE_BUSY retry / apps/api 境界 | 仕様書内に再掲なし（リンクのみ）| **外部正本リンク維持**（`deployment-cloudflare.md` / `database-schema.md` / `architecture-overview-core.md`）。手順本体の再掲は禁止を確認 |

## 4. 正本所在マップ

| 概念 | 正本ファイル | 正本セクション | 仕様書内の参照側方針 |
| --- | --- | --- | --- |
| 4 方式比較表 | `phase-02/sync-method-comparison.md` | §1, §2 | 他箇所は「採択 = B（Cron pull）」のみ短縮再掲可 |
| 採択理由 3 文以上 | `phase-02/sync-method-comparison.md` | §3 | 他箇所はリンクのみ |
| 不採択理由 | `phase-02/sync-method-comparison.md` | §4 | リンクのみ |
| 確定パラメータ（Cron 間隔 / batch / Backoff / SoT） | `phase-02/sync-method-comparison.md` | §5 | 値の再掲は禁止 |
| 既知制約 | `phase-02/sync-method-comparison.md` | §6 | 参照のみ |
| 3 種フロー図 + エラーパス | `phase-02/sync-flow-diagrams.md` | §2, §3, §4, §5 | Mermaid 図の再掲禁止 |
| ロールバック判断フローチャート | `phase-02/sync-flow-diagrams.md` | §6 | リンクのみ |
| sync_log 13 カラム | `phase-02/sync-log-schema.md` | §2 | カラム名参照のみ |
| sync_log 状態遷移 | `phase-02/sync-log-schema.md` | §3 | 遷移図の再掲禁止 |
| sync_log 索引 / 保持期間 / active lock | `phase-02/sync-log-schema.md` | §4, §5, §6 | リンクのみ |
| 代替案 4 件 PASS/MINOR/MAJOR | `phase-03/alternatives.md` | 全節 | 判定値のみ短縮再掲可 |
| MINOR 追跡（TECH-M-01〜04） | `phase-03/main.md` | §6 | 追記のみ可（Phase 8 で TECH-M-DRY-01 を追加） |
| SoT 決定マトリクス | `phase-05/implementation-runbook.md` | §6 | 仕様書全体で唯一の正本 |
| FC-1〜FC-10 防御線サマリー | `phase-06/failure-cases.md` | §3 | リンクのみ |
| Cron Triggers 設定手順 | `aiworkflow-requirements/references/deployment-cloudflare.md` | （外部）| 仕様書内では概念名のみ |
| D1 binding / SQLITE_BUSY 方針 | `aiworkflow-requirements/references/deployment-cloudflare.md` / `database-schema.md` | （外部）| 仕様書内では方針名のみ |
| apps/api 境界（不変条件 #5） | `aiworkflow-requirements/references/architecture-overview-core.md` | （外部）| 仕様書内では一文 + リンク |

## 5. 表記揺れ grep 結果と統一後表記

| 概念 | 揺れ候補 | 統一後表記 | grep 結果 |
| --- | --- | --- | --- |
| trigger_type 値 | `manual` / `scheduled` / `cron` / `backfill` | `manual` / `cron` / `backfill` の 3 値 | `phase-02/sync-log-schema.md` §2 が正本。他箇所で `scheduled` 単独使用なし（`scheduled handler` は Workers 用語として許容） |
| status 値 | `pending` / `running` / `in_progress` / `done` / `completed` / `error` / `failed` | `pending` / `in_progress` / `completed` / `failed` の 4 値 | `running` / `done` / `error_status` 単独 0 件 |
| Backoff 値 | 「3 回」/「最大 3 回」/「2 倍」/「Exponential」 | 「最大 3 回」「Exponential Backoff」「1s→2s→4s→8s→16s→32s 上限」 | 統一 |
| quota 値 | `500 req/100s/project` / `300 req/分` / `100 req/100s` | **`500 req/100s/project`** | 他値 0 件 |
| Cron スケジュール | `0 */6 * * *` / `5 分` / `1h` / `6h` | **既定 `0 */6 * * *`（6h）**、調整余地として 5 分 / 1h を §5 に明示 | 統一 |

## 6. aiworkflow-requirements references との境界整理

| 外部正本 | 外部に委譲する記述 | 仕様書内残置記述 |
| --- | --- | --- |
| `deployment-cloudflare.md` | wrangler.toml `[triggers]` 構文 / scheduled() handler エントリ / D1 binding 設定手順 / SQLITE_BUSY retry 一般方針 | UT-01 固有の cron 間隔（`0 */6 * * *`）/ batch size（100）/ Backoff 値（1〜32s）は仕様書内に残す |
| `database-schema.md` | D1 容量見積もり一般式 / 隣接スキーマとの境界 | sync_log 13 カラム論理設計は本仕様書の `sync-log-schema.md` が正本 |
| `architecture-overview-core.md` | apps/api 境界 / data flow 一般記述 / 不変条件 #5 の説明本体 | 仕様書内では「不変条件 #5: D1 直接アクセスは apps/api に閉じる」一文 + リンクのみ |

判断基準: **基盤・汎用記述は外部正本へ、UT-01 固有判断（採択方式 / quota 値 / sync_log カラム / SoT 優先順位）は仕様書内に残す**。これにより AC-9（UT-09 が本仕様書のみで実装着手可能）を維持。

## 7. TECH-M-DRY-01 記録（Phase 3 MINOR 追跡テーブル追記内容）

| 項目 | 内容 |
| --- | --- |
| ID | TECH-M-DRY-01 |
| 種別 | MINOR（DRY 違反の構造化解消） |
| 内容 | 本仕様書 13 Phase 構成で同概念（フロー図 / エラーハンドリング / sync_log / 冪等性 / quota）が複数 Phase に再登場する構造のため、Phase 8 で正本集約 + リンク化 + 表記統一により恒久解消した。今後 Phase 追加時にも観点 1〜6 の再点検を Phase 8 相当で実施することを残務化 |
| 戻り先 | Phase 2（設計）— 重複が残存する場合は設計段階の章立てを見直し |
| 完了条件 | 本 main.md に重複削除の正本所在マップと before/after が記録され、AC-1〜AC-10 が GREEN を維持していること |
| 解決 Phase | Phase 8（本 Phase で完了） |

Phase 3 main.md §6 MINOR 追跡テーブルに以下行を追記する（Phase 9 で再確認）:

> | TECH-M-DRY-01 | DRY 違反の構造化解消（観点 1〜6 を Phase 8 で正本集約 + リンク化）| Phase 8（完了） |

## 8. AC GREEN 維持確認

`outputs/phase-07/ac-matrix.md` §1 と照合した結果:

| AC ID | DRY 化前 | DRY 化後 | 維持確認 |
| --- | --- | --- | --- |
| AC-1 | GREEN | GREEN | OK（`sync-method-comparison.md` 正本維持） |
| AC-2 | GREEN | GREEN | OK（`sync-flow-diagrams.md` 正本維持） |
| AC-3 | GREEN | GREEN | OK（`sync-method-comparison.md` §5 + `sync-flow-diagrams.md` §エラーパス） |
| AC-4 | GREEN | GREEN | OK（`sync-log-schema.md` 正本維持） |
| AC-5 | GREEN | GREEN | OK（`implementation-runbook.md` §6 SoT マトリクス維持） |
| AC-6 | GREEN | GREEN | OK（`sync-method-comparison.md` §5 + `phase-09/free-tier-estimation.md` 補完） |
| AC-7 | GREEN | GREEN | OK（`sync-method-comparison.md` §5・§6 + `sync-log-schema.md` §6） |
| AC-8 | GREEN | GREEN | OK（`alternatives.md` 正本維持） |
| AC-9 | GREEN | GREEN | OK（曖昧表現 0 件、open question 0 件） |
| AC-10 | GREEN | GREEN | OK（artifacts.json metadata 一致） |

## 9. 次 Phase（Phase 9 品質保証）への引き継ぎ事項

| 引き継ぎ項目 | 内容 |
| --- | --- |
| 正本所在マップ | §4 をそのまま Phase 9 検証コマンド 3〜5（表記揺れ grep）の入力に |
| 表記統一結果 | §5 を Phase 9 で `grep -rn "running\|done\|error_status"` 実行時の期待値（0 件）に |
| TECH-M-DRY-01 | Phase 3 MINOR 追跡テーブルへ追記（§7） |
| AC GREEN 維持 | §8 を Phase 9 一括判定 Gate「AC マトリクス GREEN」の事前確認に |
| 外部正本リンク化箇所 | §6 を Phase 9 不変条件遵守確認の補強材料に |
| Phase 11 縮約テンプレ準備 | 本 DRY 化により main.md / manual-smoke-log.md / link-checklist.md の 3 点で完結する状態を確保 |

## 10. DoD チェック

- [x] 観点 1〜6 すべてについて重複検出結果が §3 に記録済み
- [x] 正本所在マップ（§4）が表形式で記載済み
- [x] `before-after.md` に観点 1〜6 ごとの before/after diff が記載される（補助成果物）
- [x] 表記揺れ（trigger_type / status / Backoff / quota / Cron）統一結果が §5 に記載
- [x] aiworkflow-requirements references 既述内容の再掲 0 件（§6）
- [x] TECH-M-DRY-01 が §7 に記録（Phase 3 へ追記指示）
- [x] AC-1〜AC-10 が全件 GREEN を維持（§8）

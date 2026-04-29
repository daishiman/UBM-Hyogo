# Phase 7 成果物: AC マトリクス（ac-matrix.md）

> **ステータス**: completed
> 本ファイルは UT-01 設計タスクの追跡可能行列の正本。仕様本体は `../../phase-07.md` を参照。

## 1. AC マトリクス

| AC ID | 内容（要約）| 検証 Phase | 検証 TC / FC | 検証コマンド（代表） | 受入合格条件 | 失敗時アクション | 証跡 path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | push/pull/webhook/cron 比較評価表 + 採択（Cron pull）理由明文化 | Phase 2 / 4 | TC-1-1, TC-1-2, TC-2-1 | `rg -in "push\|pull\|webhook\|cron" outputs/phase-02/sync-method-comparison.md` | 4 ラベル全ヒット + 採択理由 3 文以上 | Phase 5 Step 2-A 再実行 | `outputs/phase-02/sync-method-comparison.md` |
| AC-2 | 手動 / 定期 / バックフィルの 3 フロー図（エラーパス含む） | Phase 2 / 4 | TC-1-3, TC-2-2, FC-1 | `rg -n "手動\|定期\|バックフィル" outputs/phase-02/sync-flow-diagrams.md` | 3 ラベル全ヒット + Mermaid sequenceDiagram 3 件 | Phase 5 Step 2-B 再実行 | `outputs/phase-02/sync-flow-diagrams.md` |
| AC-3 | リトライ / Backoff / 冪等性 / 部分失敗継続戦略 / failed ログ保持 | Phase 2 / 4 / 6 | TC-2-3 / FC-1, FC-2, FC-4, FC-9 | `rg -n "リトライ\|Backoff\|冪等\|failed" outputs/phase-02/` | 4 ラベル全件 1 件以上 | Phase 5 Step 2 再実行 + Phase 6 walkthrough 再走 | `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` |
| AC-4 | sync_log 13 カラム論理スキーマ（job_id / status / offset / timestamp / error_message） | Phase 2 / 4 / 6 | TC-1-4, TC-2-4 / FC-2, FC-4, FC-8 | `rg -n "id\|status\|offset\|started_at\|error" outputs/phase-02/sync-log-schema.md` | 5 ラベル全ヒット + 状態遷移定義 | Phase 5 Step 2-C 再実行 | `outputs/phase-02/sync-log-schema.md` |
| AC-5 | SoT 優先順位（Sheets 優先）+ ロールバック判断フロー | Phase 2 / 4 / 5 / 6 | TC-2-5 / FC-7 | `rg -in "source-of-truth\|SoT\|Sheets 優先\|ロールバック" outputs/phase-02/` | 全ラベル 1 件以上 + 一意な記述 | Phase 5 Step 4 SoT マトリクス再確定 | `outputs/phase-02/sync-method-comparison.md` / `outputs/phase-05/implementation-runbook.md` §6 |
| AC-6 | Sheets API quota（500 req/100s）対処方針 + バッチ + 待機 | Phase 2 / 4 / 6 / 9 | TC-2-6 / FC-3, FC-5 | `rg -n "500\|バッチ\|Backoff\|待機" outputs/phase-02/` | 4 ラベル全ヒット | Phase 5 Step 2-A 再実行 | `outputs/phase-02/sync-method-comparison.md` / `outputs/phase-09/free-tier-estimation.md` |
| AC-7 | 冪等性担保（行ハッシュ / 一意 ID / ON CONFLICT DO UPDATE） | Phase 2 / 4 / 6 | TC-2-7 / FC-2, FC-6, FC-9 | `rg -in "ハッシュ\|ON CONFLICT\|一意\|UPSERT" outputs/phase-02/` | 3 ラベル以上ヒット + UT-04 引き継ぎ事項記述 | Phase 5 Step 2 再実行 | `outputs/phase-02/sync-method-comparison.md` / `sync-log-schema.md` |
| AC-8 | 代替案 4 件（A push / B pull / C webhook / D hybrid）を PASS/MINOR/MAJOR 評価 + base case 確定 | Phase 3 / 4 | TC-2-8 | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/alternatives.md` | 4 案全評価 + base case = B PASS | Phase 5 Step 3 再実行 | `outputs/phase-03/alternatives.md` |
| AC-9 | UT-09 が本仕様のみで実装着手可能（曖昧 0 / open question 0） | Phase 3 / 4 / 10 | TC-2-9, TC-4-1, TC-4-3 | `rg -in "実装で判断\|TBD\|要検討\|後で決める" outputs/` | 0 件ヒット + open question 0 件 | Phase 5 / Phase 10 で曖昧記述を解消 | `outputs/phase-03/main.md` / `outputs/phase-10/go-no-go.md` |
| AC-10 | docs-only / NON_VISUAL / spec_created / design_specification の Phase 1 固定 + artifacts.json 一致 | Phase 1 / 4 / 9 / 12 | TC-2-10, TC-6-2 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` | 4 値出力一致 | `artifacts.json` または `index.md` を Phase 1 仕様に修正 | `artifacts.json` / `index.md` / `outputs/phase-01/main.md` |

## 2. 依存トレース

| AC | 上流 Phase | 下流 Phase | 自動化レベル |
| --- | --- | --- | --- |
| AC-1 | Phase 1 / 2 | Phase 4 / 9 / 10 | 自動（rg） |
| AC-2 | Phase 1 / 2 | Phase 4 / 9 / 10 | 自動（rg） |
| AC-3 | Phase 1 / 2 / 6 | Phase 4 / 9 / UT-09（IMPL-T-3） | 自動（rg） |
| AC-4 | Phase 1 / 2 / 6 | Phase 4 / 9 / UT-04（物理 DDL） | 自動（rg） |
| AC-5 | Phase 2 / 5 / 6 | Phase 9 / 10 / UT-09 | 自動（rg） |
| AC-6 | Phase 2 / 6 | Phase 4 / 9 / UT-09（IMPL-T-5） | 自動（rg） |
| AC-7 | Phase 2 / 6 | Phase 4 / 9 / UT-04 / UT-09（IMPL-T-2, IMPL-T-8） | 自動（rg） |
| AC-8 | Phase 3 | Phase 10 | 自動（rg） |
| AC-9 | Phase 3 / 5 / 10 | UT-09 着手ゲート | 半自動（rg + 手動 review） |
| AC-10 | Phase 1 | Phase 9 / 12 | 自動（jq） |

## 3. TC × FC × AC 三項対応

| AC | 関連 TC | 関連 FC（防御線） |
| --- | --- | --- |
| AC-1 | TC-1-1, TC-1-2, TC-2-1 | — |
| AC-2 | TC-1-3, TC-2-2 | FC-1（エラーパス） |
| AC-3 | TC-2-3 | FC-1, FC-2, FC-4, FC-9 |
| AC-4 | TC-1-4, TC-2-4 | FC-2, FC-4, FC-8 |
| AC-5 | TC-2-5 | FC-7 |
| AC-6 | TC-2-6 | FC-3, FC-5 |
| AC-7 | TC-2-7 | FC-2, FC-6, FC-9 |
| AC-8 | TC-2-8 | — |
| AC-9 | TC-2-9, TC-4-1, TC-4-3 | FC-10（schema 変動許容） |
| AC-10 | TC-2-10, TC-6-2 | — |

検証漏れ: AC-1 / AC-8 / AC-10 は FC 紐付きなし（性質上、設計記述の存在性のみで担保可能）。AC-9 は曖昧表現自動検出（rg）+ 手動 review で部分担保、最終確定は Phase 10。

## 4. 証跡 path 命名（先取り）

Phase 9〜12 で生成される証跡 path を本 Phase で先行確定する（パスズレ防止）。`artifacts.json.phases[].outputs` と完全一致することを `jq` 出力で確認。

| 証跡 path | 生成 Phase | 紐付く AC |
| --- | --- | --- |
| `outputs/phase-01/main.md` | Phase 1 | AC-10 |
| `outputs/phase-02/sync-method-comparison.md` | Phase 2 | AC-1, AC-3, AC-5, AC-6, AC-7 |
| `outputs/phase-02/sync-flow-diagrams.md` | Phase 2 | AC-2, AC-3 |
| `outputs/phase-02/sync-log-schema.md` | Phase 2 | AC-4, AC-7 |
| `outputs/phase-03/main.md` | Phase 3 | AC-9 |
| `outputs/phase-03/alternatives.md` | Phase 3 | AC-8 |
| `outputs/phase-04/test-strategy.md` | Phase 4 | TC-1〜TC-6 / IMPL-T-1〜9（UT-09 引き継ぎ） |
| `outputs/phase-05/implementation-runbook.md` | Phase 5 | AC-5（SoT マトリクス）+ TC Green ログ |
| `outputs/phase-06/failure-cases.md` | Phase 6 | FC-1〜FC-10 全件 |
| `outputs/phase-07/ac-matrix.md` | Phase 7 | AC-1〜AC-10 統合 |
| `outputs/phase-08/main.md` | Phase 8 | DRY 化 / 正本所在マップ |
| `outputs/phase-08/before-after.md` | Phase 8 | 重複削除 before/after |
| `outputs/phase-09/main.md` | Phase 9 | AC-10 再確認 / 4 条件 / 不変条件 |
| `outputs/phase-09/free-tier-estimation.md` | Phase 9 | AC-6 / 無料枠見積もり |
| `outputs/phase-10/go-no-go.md` | Phase 10 | AC-8, AC-9 最終判定 |
| `outputs/phase-11/main.md` | Phase 11 | docs-only / NON_VISUAL 縮約テンプレ自己適用 |
| `outputs/phase-11/manual-smoke-log.md` | Phase 11 | TC-1〜TC-6 再走確認 |
| `outputs/phase-11/link-checklist.md` | Phase 11 | TC-3（リンクチェック） |
| `outputs/phase-12/implementation-guide.md` | Phase 12 | UT-09 引き継ぎ（IMPL-T-1〜9） |
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 | FC-10 / TECH-M 等のスコープ外項目 |

## 5. ゲート連携

| Phase | ゲート条件 | 関連 AC |
| --- | --- | --- |
| Phase 5 → 6 | TC-1〜TC-6 全 GREEN + open question 0 件 | AC-1〜AC-10 |
| Phase 6 → 7 | FC-1〜FC-10 の防御線が rg で確認済 | AC-3, AC-4, AC-5, AC-6, AC-7 |
| Phase 7 → 8 | AC マトリクス完成 + 証跡 path 命名確定 | 全 AC |
| Phase 8 → 9 | 観点 1〜6 の重複削除完了 + AC GREEN 維持 | AC-1〜AC-10 |
| Phase 9 → 10 | typecheck/lint PASS + jq 整合 + git diff 0 行 + 4 条件 PASS | AC-10 |
| Phase 10 → 11 | base case B PASS 維持 + 採択方式 + SoT マトリクス確定 | AC-1, AC-5, AC-8, AC-9 |
| Phase 11 → 12 | 縮約テンプレ 3 点（main / manual-smoke-log / link-checklist）完了 | docs-only / NON_VISUAL |
| Phase 12 → 13 | UT-09 引き継ぎ完了 + workflow_state=spec_created 維持 | AC-9, AC-10 |
| UT-09 着手 | 本タスクの全 AC PASS（特に AC-9） | AC-9 |

## 6. verified カバレッジサマリー

| AC ID | Phase 4〜7 でのカバー状況 | 補足 |
| --- | --- | --- |
| AC-1 | **verified**（Phase 4 TC-1-1/1-2/2-1 + Phase 7 マトリクス） | rg 自動検証 |
| AC-2 | **verified**（Phase 4 TC-1-3/2-2 + Phase 6 FC-1） | エラーパス含む 3 フロー存在 |
| AC-3 | **verified**（Phase 4 TC-2-3 + Phase 6 FC-1/FC-2/FC-4/FC-9） | リトライ・部分失敗・冪等性網羅 |
| AC-4 | **verified**（Phase 4 TC-1-4/2-4 + Phase 6 FC-2/FC-4/FC-8） | sync_log 13 カラム + 状態遷移 |
| AC-5 | **verified**（Phase 4 TC-2-5 + Phase 5 SoT マトリクス + Phase 6 FC-7） | SoT 単一正本化 |
| AC-6 | **verified**（Phase 4 TC-2-6 + Phase 6 FC-3/FC-5）+ Phase 9 で再評価 | quota / バッチ / 待機 |
| AC-7 | **verified**（Phase 4 TC-2-7 + Phase 6 FC-2/FC-6/FC-9） | 冪等性 + ON CONFLICT + 行ハッシュ |
| AC-8 | **verified**（Phase 4 TC-2-8） | 代替案 4 案 PASS/MINOR/MAJOR |
| AC-9 | **部分 verified**（Phase 4 TC-2-9/4-1/4-3）/ 最終確定は Phase 10 | 曖昧表現検出は自動、内容妥当性は手動 review |
| AC-10 | **verified**（Phase 4 TC-2-10/6-2） | metadata 一致（jq） |

**結論**: Phase 4〜7 で **AC-1〜AC-8, AC-10 は verified**、**AC-9 は Phase 10 review で最終確定**。FC-1〜FC-10 を全 AC に紐付けることで、設計レベルでの異常系網羅も同時に verified。

## 7. 不一致検出時の対応

| 検出種別 | 対応 |
| --- | --- |
| rg ヒット欠落 | Phase 8 DRY 化または Phase 5 Step 2 再実行 |
| jq 不一致（AC-10） | `artifacts.json` または `index.md` を Phase 1 仕様に合わせ修正 |
| 証跡 path ズレ | Phase 7 で再発行 + Phase 9 / 10 / 11 / 12 で参照修正 |
| FC walkthrough 欠落 | Phase 6 sandbox walkthrough 再走 + Phase 8 DRY 整理 |
| 曖昧表現検出（AC-9） | Phase 5 Step 1〜4 で該当箇所を再記述 + Phase 10 で再 review |

## 8. UT-09 引き継ぎサマリー

- **IMPL-T-1〜IMPL-T-9 雛形**: `outputs/phase-04/test-strategy.md` §4 に整理済み。UT-09 phase-04 入力としてそのまま転送可能。
- **AC-9 担保**: 本タスク完了時点で曖昧表現 0 件 + open question 0 件（Phase 3 main.md §9 で達成済、Phase 10 で再確認）。
- **SoT 決定マトリクス**: `outputs/phase-05/implementation-runbook.md` §6 を UT-09 が読むのみで Sheets 優先 / 一方向同期 / 行ハッシュ + 固有 ID の 3 戦略を確定できる。
- **異常系防御線**: `outputs/phase-06/failure-cases.md` §3 防御線サマリーを UT-09 が IMPL-T-3〜IMPL-T-8 のテストケース起点として利用可能。
- **MINOR 6 件**: Phase 12 / UT-04 / UT-08 / UT-09 への引き継ぎ先を Phase 10 go-no-go で明記。

## 9. DoD チェック

- [x] AC-1〜AC-10 全件がマトリクスに含まれる
- [x] 各 AC に検証コマンド（rg / jq）が紐付く
- [x] 各 AC に証跡 path が紐付く（artifacts.json.phases[].outputs と整合）
- [x] 依存トレース表が作成済
- [x] TC × FC × AC 三項対応表が作成済
- [x] ゲート連携表が作成済
- [x] verified カバレッジサマリーで Phase 4〜7 のカバー状況が明示
- [x] UT-09 引き継ぎサマリー記述済

## 10. 次 Phase 引き継ぎ

- Phase 8（DRY 化）へ AC マトリクス / 証跡 path 命名 / TC × FC × AC 三項対応 / verified カバレッジサマリーを引き継ぎ
- AC GREEN 維持を Phase 8 完了時に再照合

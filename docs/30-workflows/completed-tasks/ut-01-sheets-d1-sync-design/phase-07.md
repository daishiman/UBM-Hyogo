# Phase 7: AC マトリクス

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 7 / 13 |
| Phase 名称 | AC マトリクス |
| 作成日 | 2026-04-29 |
| 上流 | Phase 6（異常系検証） |
| 下流 | Phase 8（DRY 化） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

AC-1〜AC-10 と Phase 4 で定義した TC-1〜TC-6、Phase 6 で定義した FC-1〜FC-10 を **追跡可能行列** に統合する。各 AC について「内容 / 検証 phase / 検証 TC・FC / 検証コマンド / 受入合格条件 / 失敗時アクション / 証跡 path」を一意に対応付け、Phase 9 / Phase 10 / Phase 11 / Phase 12 で参照可能にする。

## 入力

- `index.md`（AC-1〜AC-10 の正本）
- `outputs/phase-01/main.md`（AC 確定）
- `outputs/phase-04/test-strategy.md`（TC-1〜TC-6 / IMPL-T-1〜9）
- `outputs/phase-06/failure-cases.md`（FC-1〜FC-10）
- `artifacts.json`（`phases[].outputs` の正本）

## AC マトリクス

| AC ID | 内容（要約）| 検証 Phase | 検証 TC / FC | 検証コマンド（代表）| 受入合格条件 | 失敗時アクション | 証跡 path |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | push/pull/webhook/cron 比較評価表 + 採択（Cron pull）理由 明文化 | Phase 2 / 4 | TC-1-1, TC-1-2, TC-2-1 | `rg -in "push\|pull\|webhook\|cron" outputs/phase-02/sync-method-comparison.md` | 4 ラベル全ヒット + 採択理由 3 文以上 | Phase 5 Step 2-A 再実行 | `outputs/phase-02/sync-method-comparison.md` |
| AC-2 | 手動 / 定期 / バックフィルの 3 フロー図（エラーパス含む）| Phase 2 / 4 | TC-1-3, TC-2-2 | `rg -n "手動\|定期\|バックフィル" outputs/phase-02/sync-flow-diagrams.md` | 3 ラベル全ヒット | Phase 5 Step 2-B 再実行 | `outputs/phase-02/sync-flow-diagrams.md` |
| AC-3 | リトライ / Backoff / 冪等性 / 部分失敗継続戦略 / failed ログ保持 | Phase 2 / 4 / 6 | TC-2-3 / FC-1, FC-2, FC-4, FC-9 | `rg -n "リトライ\|Backoff\|冪等\|failed" outputs/phase-02/` | 4 ラベルすべて 1 件以上 | Phase 5 Step 2 再実行 + Phase 6 walkthrough 再走 | `outputs/phase-02/sync-method-comparison.md` / `sync-flow-diagrams.md` |
| AC-4 | sync_log 論理スキーマ（job_id / status / offset / timestamp / error_message）| Phase 2 / 4 / 6 | TC-1-4, TC-2-4 / FC-2, FC-4, FC-8 | `rg -n "ジョブ\|status\|offset\|timestamp\|error" outputs/phase-02/sync-log-schema.md` | 5 ラベル全ヒット + 状態遷移定義 | Phase 5 Step 2-C 再実行 | `outputs/phase-02/sync-log-schema.md` |
| AC-5 | SoT 優先順位（Sheets 優先）+ ロールバック判断フロー | Phase 2 / 4 / 5 / 6 | TC-2-5 / FC-7 | `rg -in "source-of-truth\|SoT\|Sheets 優先\|ロールバック" outputs/phase-02/` | 全ラベル 1 件以上 + 一意な記述 | Phase 5 Step 4 SoT マトリクス再確定 | `outputs/phase-02/sync-method-comparison.md` / `outputs/phase-05/implementation-runbook.md` |
| AC-6 | Sheets API quota（500 req/100s）対処方針 + バッチサイズ + 待機戦略 | Phase 2 / 4 / 6 | TC-2-6 / FC-3, FC-5 | `rg -n "500\|バッチ\|Backoff\|待機" outputs/phase-02/` | 4 ラベル全ヒット | Phase 5 Step 2-A 再実行 | `outputs/phase-02/sync-method-comparison.md` |
| AC-7 | 冪等性担保（行ハッシュ / 一意 ID / ON CONFLICT DO UPDATE）| Phase 2 / 4 / 6 | TC-2-7 / FC-2, FC-6, FC-9 | `rg -in "ハッシュ\|ON CONFLICT\|一意" outputs/phase-02/` | 3 ラベル全ヒット + UT-04 引き継ぎ事項記述 | Phase 5 Step 2 再実行 | `outputs/phase-02/sync-method-comparison.md` / `sync-log-schema.md` |
| AC-8 | 代替案 3 件以上（A push / B pull / C webhook / D hybrid）を PASS/MINOR/MAJOR 評価 + base case 確定 | Phase 3 / 4 | TC-2-8 | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/alternatives.md` | 4 案全評価 + base case = B PASS | Phase 5 Step 3 再実行 | `outputs/phase-03/alternatives.md` |
| AC-9 | UT-09 が本仕様のみで実装着手可能（曖昧さ 0 / open question 0）| Phase 3 / 4 / 10 | TC-2-9, TC-4-1, TC-4-3 | `rg -in "実装で判断\|TBD\|要検討\|後で決める" outputs/` | 0 件ヒット + open question 0 件 | Phase 5 / Phase 10 で曖昧記述を解消 | `outputs/phase-03/main.md` / `outputs/phase-10/go-no-go.md` |
| AC-10 | docs-only / NON_VISUAL / spec_created / design_specification の Phase 1 固定 + artifacts.json 一致 | Phase 1 / 4 / 9 / 12 | TC-2-10, TC-6-2 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` | 4 値出力一致 | `artifacts.json` または `index.md` を Phase 1 仕様に修正 | `artifacts.json` / `index.md` / `outputs/phase-01/main.md` |

## 依存トレース

| AC | 上流 Phase | 下流 Phase | 自動化レベル |
| --- | --- | --- | --- |
| AC-1 | Phase 1 / 2 | Phase 4 / 9 / 10 | 自動（rg）|
| AC-2 | Phase 1 / 2 | Phase 4 / 9 / 10 | 自動（rg）|
| AC-3 | Phase 1 / 2 / 6 | Phase 4 / 9 / UT-09（IMPL-T-3）| 自動（rg） |
| AC-4 | Phase 1 / 2 / 6 | Phase 4 / 9 / UT-04（物理 DDL） | 自動（rg） |
| AC-5 | Phase 2 / 5 / 6 | Phase 9 / 10 / UT-09 | 自動（rg） |
| AC-6 | Phase 2 / 6 | Phase 4 / 9 / UT-09（IMPL-T-5） | 自動（rg） |
| AC-7 | Phase 2 / 6 | Phase 4 / 9 / UT-04 / UT-09（IMPL-T-2, IMPL-T-8） | 自動（rg） |
| AC-8 | Phase 3 | Phase 10 | 自動（rg） |
| AC-9 | Phase 3 / 5 / 10 | UT-09 着手ゲート | 半自動（曖昧表現 rg + 手動 review） |
| AC-10 | Phase 1 | Phase 9 / 12 | 自動（jq） |

## TC × FC × AC 三項対応

| AC | 関連 TC | 関連 FC（防御線）|
| --- | --- | --- |
| AC-1 | TC-1-1, TC-1-2, TC-2-1 | — |
| AC-2 | TC-1-3, TC-2-2 | FC-1（エラーパス）|
| AC-3 | TC-2-3 | FC-1, FC-2, FC-4, FC-9 |
| AC-4 | TC-1-4, TC-2-4 | FC-2, FC-4, FC-8 |
| AC-5 | TC-2-5 | FC-7 |
| AC-6 | TC-2-6 | FC-3, FC-5 |
| AC-7 | TC-2-7 | FC-2, FC-6, FC-9 |
| AC-8 | TC-2-8 | — |
| AC-9 | TC-2-9, TC-4-1, TC-4-3 | FC-10（schema 変動許容）|
| AC-10 | TC-2-10, TC-6-2 | — |

## 証跡 path 命名（先取り）

Phase 9〜12 で生成される証跡 path を本 Phase で先行確定（パスズレ防止）。

| 証跡 path | 生成 Phase | 紐付く AC |
| --- | --- | --- |
| `outputs/phase-01/main.md` | Phase 1 | AC-10 |
| `outputs/phase-02/sync-method-comparison.md` | Phase 2 | AC-1, AC-3, AC-5, AC-6, AC-7 |
| `outputs/phase-02/sync-flow-diagrams.md` | Phase 2 | AC-2, AC-3 |
| `outputs/phase-02/sync-log-schema.md` | Phase 2 | AC-4, AC-7 |
| `outputs/phase-03/main.md` | Phase 3 | AC-9 |
| `outputs/phase-03/alternatives.md` | Phase 3 | AC-8 |
| `outputs/phase-04/test-strategy.md` | Phase 4 | TC-1〜TC-6 / IMPL-T-1〜9（UT-09 引き継ぎ）|
| `outputs/phase-05/implementation-runbook.md` | Phase 5 | AC-5（SoT マトリクス）+ TC Green ログ |
| `outputs/phase-06/failure-cases.md` | Phase 6 | FC-1〜FC-10 全件 |
| `outputs/phase-09/main.md` | Phase 9 | AC-10 再確認 / TC-5 typecheck/lint ログ |
| `outputs/phase-10/go-no-go.md` | Phase 10 | AC-8, AC-9 最終判定 |
| `outputs/phase-11/main.md` | Phase 11 | docs-only / NON_VISUAL 縮約テンプレ自己適用 |
| `outputs/phase-11/manual-smoke-log.md` | Phase 11 | TC-1〜TC-6 再走確認 |
| `outputs/phase-11/link-checklist.md` | Phase 11 | TC-3（リンクチェック）|
| `outputs/phase-12/implementation-guide.md` | Phase 12 | UT-09 引き継ぎ（IMPL-T-1〜9）|
| `outputs/phase-12/unassigned-task-detection.md` | Phase 12 | FC-10（schema 変更検知）他のスコープ外項目 |

## ゲート連携

| Phase | ゲート条件 | 関連 AC |
| --- | --- | --- |
| Phase 5 → 6 | TC-1〜TC-6 全 GREEN + open question 0 件 | AC-1〜AC-10 |
| Phase 6 → 7 | FC-1〜FC-10 の防御線が rg で確認済 | AC-3, AC-4, AC-5, AC-6, AC-7 |
| Phase 9 → 10 | typecheck/lint PASS + jq 整合 + git diff（apps/packages）0 行 | AC-10 |
| Phase 10 → 11 | base case B PASS 維持 + 採択方式 + SoT マトリクス確定 | AC-1, AC-5, AC-8, AC-9 |
| Phase 11 → 12 | 縮約テンプレ 3 点（main / manual-smoke-log / link-checklist）完了 | docs-only / NON_VISUAL |
| Phase 12 → 13 | UT-09 引き継ぎ完了 + workflow_state=spec_created 維持 | AC-9, AC-10 |
| UT-09 着手 | 本タスクの全 AC PASS（特に AC-9） | AC-9 |

## verified カバレッジ（Phase 4〜7 で何が verified になるか）

| AC ID | Phase 4〜7 でのカバー状況 | 補足 |
| --- | --- | --- |
| AC-1 | **Phase 4 TC-1-1/1-2/2-1 + Phase 7 マトリクスで verified** | rg 自動検証 |
| AC-2 | **Phase 4 TC-1-3/2-2 + Phase 6 FC-1 で verified** | エラーパス含む 3 フロー存在 |
| AC-3 | **Phase 4 TC-2-3 + Phase 6 FC-1/FC-2/FC-4/FC-9 で verified** | リトライ・部分失敗・冪等性の網羅 |
| AC-4 | **Phase 4 TC-1-4/2-4 + Phase 6 FC-2/FC-4/FC-8 で verified** | sync_log スキーマ + 状態遷移 |
| AC-5 | **Phase 4 TC-2-5 + Phase 5 SoT マトリクス + Phase 6 FC-7 で verified** | SoT 単一正本化 |
| AC-6 | **Phase 4 TC-2-6 + Phase 6 FC-3/FC-5 で verified** | quota / バッチサイズ / 待機 |
| AC-7 | **Phase 4 TC-2-7 + Phase 6 FC-2/FC-6/FC-9 で verified** | 冪等性 + ON CONFLICT + 行ハッシュ |
| AC-8 | **Phase 4 TC-2-8 で verified** | 代替案 4 案 PASS/MINOR/MAJOR |
| AC-9 | Phase 4 TC-2-9/4-1/4-3 で **部分 verified** / 最終確定は Phase 10 | 曖昧表現検出は自動、内容妥当性は手動 review |
| AC-10 | **Phase 4 TC-2-10/6-2 で verified**（jq 整合）| metadata 一致 |

> **結論**: Phase 4〜7 で AC-1〜AC-8, AC-10 は **verified（または verified 経路確定）**、AC-9 は Phase 10 review で最終確定。FC-1〜FC-10 を全 AC に紐付けることで、設計レベルでの異常系網羅も同時に verified。

## 実行タスク

1. AC-1〜AC-10 × 検証コマンド × 証跡 path 対応表を作成
2. 依存トレース（上流 / 下流 Phase / 自動化レベル）を作成
3. TC × FC × AC 三項対応表を作成
4. 証跡 path 命名を先取り確定
5. ゲート連携表を作成
6. verified カバレッジサマリーを作成（Phase 9 / 10 が参照）

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `index.md`（AC 正本）|
| 必須 | `outputs/phase-01/main.md` |
| 必須 | `outputs/phase-04/test-strategy.md` |
| 必須 | `outputs/phase-06/failure-cases.md` |
| 必須 | `artifacts.json` |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-07.md`（フォーマット模倣元）|

## 依存Phase明示

- Phase 1 / 4 / 6 成果物を参照する。
- Phase 9 / Phase 10 / Phase 11 / Phase 12 が本マトリクスを **読み取り専用** で参照する。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-07/ac-matrix.md` | AC × 検証 × 証跡 / 依存トレース / TC×FC×AC 三項対応 / 証跡 path 命名 / ゲート連携 / verified カバレッジサマリー |

## 完了条件 (DoD)

- [ ] AC-1〜AC-10 全てがマトリクスに含まれる
- [ ] 各 AC に検証コマンド（rg / jq）が紐付く
- [ ] 各 AC に証跡 path が紐付く（未生成分は path 命名のみ）
- [ ] 依存トレース表が作成済
- [ ] TC × FC × AC 三項対応表が作成済
- [ ] 証跡 path 命名が `artifacts.json.phases[].outputs` と整合
- [ ] ゲート連携表が作成済
- [ ] verified カバレッジサマリーで Phase 4〜7 のカバー状況が明示

## 苦戦箇所・注意

- **証跡 path の先取り**: Phase 9〜12 の成果物は未生成だが、`artifacts.json.phases[].outputs` と一致する path を本 Phase で確定。実体作成時のパスズレを防止
- **AC-9 の機械検証困難**: 「曖昧表現が一切ないか」「UT-09 が本当に独立着手可能か」は機械検証できない。`rg "実装で判断|TBD|要検討|後で決める"` の minimal 自動検出のみ行い、内容妥当性は Phase 10 review で担保
- **AC-8 の base case 揺れ**: 代替案再評価で base case が B 以外に移ると本マトリクスの記述全体が崩れる。**base case = B（Workers Cron pull）を Phase 3 で確定後に本マトリクスを書く**
- **TC × FC × AC 三項の MECE**: TC か FC のいずれにも紐付かない AC があると検証漏れ。AC-9 / AC-10 のように TC のみで担保される項目は明示
- **`jq` 期待出力の硬直化**: Phase 数増減があった場合 AC-10 の期待出力が変わる。`artifacts.json` を正本として参照する形にして、ハードコードを避ける
- **UT-09 引き継ぎとの混同**: IMPL-T-1〜9 は UT-09 で GREEN にする項目で、本タスクの AC ではない。マトリクスに混入させない（証跡 path の備考欄に「UT-09 引き継ぎ」と区別記載）

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様であり、アプリケーション統合テストは追加しない。
- 統合検証は `mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。
- 実コードの統合テストは UT-09 が IMPL-T-6〜IMPL-T-9 雛形（Phase 4 出力）に基づき実施する。

## 次 Phase

- 次: Phase 8（DRY 化）
- 引き継ぎ: AC マトリクス / 証跡 path 命名 / ゲート連携 / TC×FC×AC 三項対応 / verified カバレッジサマリー

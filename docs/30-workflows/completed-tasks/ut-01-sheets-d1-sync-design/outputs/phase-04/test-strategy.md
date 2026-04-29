# Phase 4 成果物: テスト戦略（test-strategy.md）

> **ステータス**: completed
> 本ファイルは UT-01 設計タスクのテスト戦略の正本。仕様本体は `../../phase-04.md` を参照。

## 1. スコープ宣言

- 本タスクは **docs-only / NON_VISUAL** の設計仕様タスクであり、ランタイムコード単体テスト・統合テストは **適用外**（UT-09 で実施）。
- 本 Phase の責務は以下の 4 点に限定する。
  1. **設計レビュー走行確認**: Phase 2 成果物（`sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`）の章立て・採択理由・図の網羅性を rg / 目視で確認。
  2. **ドキュメントリンクチェック**: `index.md` / `specs_referenced` / 原典スペック / 下流 UT-09 への相互参照が壊れていないこと。
  3. **仕様書 walkthrough**: UT-09 / UT-03 観点で AC-1〜AC-10 を読み下し、open question 0 件 / 曖昧表現 0 件を確認。
  4. **UT-09 引き継ぎテスト雛形先取り**: 同期ジョブ実装時に Vitest / 統合テスト / smoke でカバーすべき項目を IMPL-T-1〜IMPL-T-9 として先取り定義。
- ランタイム副作用ゼロ（コード変更 0 行）であることを `mise exec -- pnpm typecheck` / `pnpm lint` / `git diff` で機械検証する。

## 2. 検証カテゴリ表

| カテゴリ | 概要 | 自動化可否 | 本タスクでの扱い |
| --- | --- | --- | --- |
| コード単体テスト | 同期ジョブ関数の Vitest テスト | 自動 | **適用外**（UT-09 IMPL-T-1〜IMPL-T-5 で実施） |
| コード統合テスト | Sheets API mock × D1 local（miniflare）の疎通 | 自動 | **適用外**（UT-09 IMPL-T-6〜IMPL-T-9 で実施） |
| 設計レビュー走行確認 | Phase 2 成果物の章立て・図・採択理由の網羅性 | 半自動（rg + 目視） | **本 Phase の主検証** |
| ドキュメントリンクチェック | 内部相互参照・外部 URL の到達性 | 自動（rg / curl） | **本 Phase の主検証** |
| 仕様書 walkthrough | UT-09 / UT-03 視点で読み下し open question 0 件確認 | 手動 | **本 Phase の主検証** |
| AC × 成果物 整合 | AC-1〜AC-10 の引用箇所が成果物に物理存在 | 自動（rg） | **本 Phase の主検証** |
| 副作用なし確認 | コード変更ゼロ / typecheck / lint PASS | 自動 | **本 Phase で実行** |
| artifacts.json 整合 | metadata と outputs の jq 整合 | 自動（jq） | **本 Phase で実行** |

## 3. TC（テストケース）一覧

### 3.1 TC-1 設計成果物 3 点の存在と章立て

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-1-1 | `sync-method-comparison.md` 存在 + 比較表セクション | ファイル存在 + `比較` ヒット 1 件以上 | `ls outputs/phase-02/sync-method-comparison.md && rg -n "比較" outputs/phase-02/sync-method-comparison.md` |
| TC-1-2 | 採択方式（B: Cron pull）が明記 | `Cron` または `Workers Cron Triggers` が 1 件以上 | `rg -n "Cron" outputs/phase-02/sync-method-comparison.md` |
| TC-1-3 | `sync-flow-diagrams.md` に 3 フロー（手動 / 定期 / バックフィル） | 3 ラベルすべてヒット | `rg -n "手動\|定期\|バックフィル" outputs/phase-02/sync-flow-diagrams.md` |
| TC-1-4 | `sync-log-schema.md` に必須カラム（job_id / status / offset / timestamp / error） | 5 ラベルすべてヒット | `rg -n "id\|status\|offset\|started_at\|error" outputs/phase-02/sync-log-schema.md` |

### 3.2 TC-2 AC × 成果物 整合（AC-1〜AC-10）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-2-1 | AC-1（push/pull/webhook/cron 比較）が `sync-method-comparison.md` に存在 | 4 ラベル全ヒット | `rg -in "push\|pull\|webhook\|cron" outputs/phase-02/sync-method-comparison.md` |
| TC-2-2 | AC-2（3 フロー図）が `sync-flow-diagrams.md` に存在 | 3 フローキーワード全ヒット | TC-1-3 と同コマンド |
| TC-2-3 | AC-3（リトライ / Backoff / 冪等性 / failed ログ）が成果物に存在 | 4 ラベル全ヒット | `rg -n "リトライ\|Backoff\|冪等\|failed" outputs/phase-02/` |
| TC-2-4 | AC-4（sync_log 論理スキーマ）が `sync-log-schema.md` に存在 | TC-1-4 と同 | TC-1-4 と同コマンド |
| TC-2-5 | AC-5（SoT 優先順位 + ロールバック判断フロー） | `source-of-truth\|SoT\|Sheets 優先\|ロールバック` ヒット | `rg -in "source-of-truth\|SoT\|Sheets 優先\|ロールバック" outputs/phase-02/` |
| TC-2-6 | AC-6（Sheets API quota 500 + バッチサイズ + 待機戦略） | `500` + `バッチ` + `Backoff\|待機` ヒット | `rg -n "500\|バッチ\|Backoff\|待機" outputs/phase-02/` |
| TC-2-7 | AC-7（行ハッシュ / 一意 ID / ON CONFLICT DO UPDATE） | 3 ラベルヒット | `rg -in "ハッシュ\|ON CONFLICT\|一意\|UPSERT" outputs/phase-02/` |
| TC-2-8 | AC-8（代替案 4 案 PASS/MINOR/MAJOR 評価） | 3 ラベル全ヒット + 4 案分判定 | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/alternatives.md` |
| TC-2-9 | AC-9（open question 0 件） | `0 件` または「open question」セクションが 0 | `rg -in "open question" outputs/phase-03/main.md` |
| TC-2-10 | AC-10（taskType / visualEvidence / workflow_state / scope の整合） | jq 出力 4 値一致 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` |

### 3.3 TC-3 リンクチェック

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-3-1 | `index.md` の参照資料パス全件が実在 | MISSING 行 0 | `rg -o "doc/[^ )]+\.md\|docs/[^ )]+\.md" index.md \| sort -u \| while read p; do test -e "$p" \|\| echo "MISSING: $p"; done` |
| TC-3-2 | 原典スペック `unassigned-task/UT-01-sheets-d1-sync-design.md` への参照 | 1 件以上 | `rg -n "UT-01-sheets-d1-sync-design" index.md` |
| TC-3-3 | 下流 UT-09 への参照 | 1 件以上 | `rg -n "ut-09-sheets-to-d1-cron-sync-job" index.md` |
| TC-3-4 | Phase 11 縮約テンプレ正本への参照 | 1 件以上 | `rg -n "phase-template-phase11" index.md` |
| TC-3-5 | 外部 URL（Cron Triggers / Sheets API）の到達性 | HTTP 200（SHOULD） | `curl -fsI https://developers.cloudflare.com/workers/configuration/cron-triggers/ \| head -1` |

### 3.4 TC-4 仕様書 walkthrough（UT-09 / UT-03 視点）

| TC ID | 検証 | 期待 | 方法 |
| --- | --- | --- | --- |
| TC-4-1 | UT-09 担当が本仕様のみで実装着手可能（AC-9） | open question 0 件 + 曖昧記述 0 件 | 手動 walkthrough + `rg -in "実装で判断\|TBD\|要検討\|後で決める" outputs/` が 0 件 |
| TC-4-2 | UT-03（認証）担当が必要な認証境界を一意把握 | Service Account / scope が記述済 | `rg -in "Service Account\|scope" outputs/phase-02/` |
| TC-4-3 | 曖昧表現の検出 | 0 件ヒット | `rg -in "実装で判断\|TBD\|要検討\|後で決める" outputs/` |

### 3.5 TC-5 副作用なし確認

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-5-1 | typecheck PASS | exit 0 | `mise exec -- pnpm typecheck` |
| TC-5-2 | lint PASS | exit 0 | `mise exec -- pnpm lint` |
| TC-5-3 | `apps/`・`packages/` 配下の変更ゼロ | diff 0 行 | `git diff --name-only main -- apps packages` |

### 3.6 TC-6 artifacts.json 整合

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-6-1 | Phase 1〜13 の outputs パスが実在もしくは生成計画通り | jq 列挙 → ls 検証 | `jq -r '.phases[].outputs[]' artifacts.json \| while read p; do test -e "$p" \|\| echo "PENDING: $p"; done` |
| TC-6-2 | metadata の docs-only / NON_VISUAL / spec_created / design_specification 一致 | 4 値一致 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` |

## 4. UT-09 へ引き継ぐ実装テスト戦略雛形

> 本 Phase ではコード実装は行わない。以下は UT-09（Sheets→D1 同期ジョブ実装）の Phase 4 入力としてそのまま転送する **最低限カバーすべき項目**。UT-09 が必要に応じて追加・拡張する余地を残す。

| 雛形 ID | テストレイヤ | 対象 | 想定アサーション |
| --- | --- | --- | --- |
| IMPL-T-1 | unit | offset 計算 / バッチ分割関数 | 1000 行 + バッチ 100 → 10 バッチ生成 / 端数処理（999 行 → 9 + 1） |
| IMPL-T-2 | unit | 行ハッシュ生成（順序非依存・null 安全） | 同一行で同一ハッシュ / 列順入替で同一 / null と空文字を区別 |
| IMPL-T-3 | unit | リトライ Exponential Backoff（最大 3 回） | 1s / 2s / 4s 系列 / 上限到達で fail / quota 超過時 100s 待機 |
| IMPL-T-4 | unit | sync_log status 遷移（pending → in_progress → completed/failed） | 不正遷移は throw / failed → in_progress は retry_count++ で許容 |
| IMPL-T-5 | unit | quota guard（500 req/100s window 推定） | 超過予測時に sleep を返す / window 跨ぎで reset |
| IMPL-T-6 | integration | Sheets API mock × D1 local（miniflare） | 1000 行 ON CONFLICT DO UPDATE で行数不変 / 値更新が反映 |
| IMPL-T-7 | integration | 部分失敗時の resume（offset 復元） | 中断 → 再開で残行のみ処理 / 既処理行への重複書込なし |
| IMPL-T-8 | integration | バックフィル（手動）と定期 cron の同時起動の冪等性 | 二重起動でも sync_log が衝突しない / `in_progress` lock で排他 |
| IMPL-T-9 | smoke (staging) | 実 Sheets ↔ D1 staging で 1 行追加 → 1 cron tick で D1 反映 | sync_log 1 行追加 + completed |

## 5. AC × TC 検証マトリクス

| AC ID | 関連 TC | 自動化レベル |
| --- | --- | --- |
| AC-1 | TC-1-1, TC-1-2, TC-2-1 | 自動（rg） |
| AC-2 | TC-1-3, TC-2-2 | 自動（rg） |
| AC-3 | TC-2-3 | 自動（rg） |
| AC-4 | TC-1-4, TC-2-4 | 自動（rg） |
| AC-5 | TC-2-5 | 自動（rg） |
| AC-6 | TC-2-6 | 自動（rg） |
| AC-7 | TC-2-7 | 自動（rg） |
| AC-8 | TC-2-8 | 自動（rg） |
| AC-9 | TC-2-9, TC-4-1, TC-4-3 | 半自動（rg + 手動 review） |
| AC-10 | TC-2-10, TC-6-2 | 自動（jq） |

## 6. fail-fast 実行順序

1. **TC-6（artifacts.json 整合）** — 構造ズレを最速検出（jq 1 コマンド）
2. **TC-1（成果物 3 点存在 + 章立て）** — Phase 2 成果物の物理存在
3. **TC-2（AC × 成果物 整合）** — AC-1〜AC-10 の引用箇所
4. **TC-3（リンクチェック）** — 相互参照崩壊検出
5. **TC-4（walkthrough）** — UT-09 / UT-03 視点での読み下し（手動）
6. **TC-5（副作用なし）** — typecheck / lint / git diff で最終証跡

理由: TC-6 → TC-1 → TC-2 の順は「メタ整合 → 物理存在 → 内容整合」と段階的に絞る fail-fast。TC-3/4 はファイル整合確認後でないと意味を持たない。TC-5 は最後に副作用ゼロを検証する閉じ確認。

## 7. スコープ外宣言

- コード単体テスト / 統合テスト / Vitest 実行は **UT-09 IMPL-T-1〜IMPL-T-9** で実施。
- 外部 URL の HTTP 到達性（TC-3-5）は CI ネットワーク制約で不安定なため **SHOULD 扱い**。失敗時は `unassigned-task-detection.md` 候補に登録。
- 内容妥当性 walkthrough（TC-4-1）の最終判定は **Phase 10 review** で担保。本 Phase は曖昧表現自動検出のみ機械化。
- 実コードでの異常系再現は UT-09 IMPL-T-3 / IMPL-T-4 / IMPL-T-5 / IMPL-T-7 / IMPL-T-8 で実施。

## 8. DoD チェック

- [x] TC-1〜TC-6 が全件記述
- [x] 各 TC に rg / jq / diff / curl / pnpm の具体コマンドが書かれている
- [x] AC × TC マトリクスが AC-1〜AC-10 全カバー
- [x] UT-09 引き継ぎ雛形 IMPL-T-1〜IMPL-T-9 が整理済
- [x] fail-fast 実行順序確定
- [x] 「コード単体テストは本タスクスコープ外（UT-09 で実施）」明記
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` PASS（実行ログは Phase 9 で取得）

## 9. 苦戦箇所への配慮

- 「テスト＝コード単体テスト」の取り違え防止のため §1 で明示。
- AC-9 機械化困難は §5 自動化レベル「半自動」で明示し最終判定 Phase 10 委譲。
- TC-3-5 外部 URL 不安定性は §7 で SHOULD 化。
- UT-09 雛形硬直化リスクは §4 冒頭で「最低限カバーすべき項目」と位置付け、追加余地を残す。
- rg 前提 → CI で `grep -rn` 代替が必要な場合は Phase 5 ランブックで明記する旨を引き継ぐ。

## 10. 次 Phase 引き継ぎ

- Phase 5（実装ランブック / spec walkthrough）へ TC-1〜TC-6 / IMPL-T-1〜IMPL-T-9 / fail-fast 順序を引き継ぎ
- TC Green ログは Phase 5 Step 5 で取得し、Phase 9 品質保証で再検証

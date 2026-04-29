# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-01-sheets-d1-sync-design |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-29 |
| 上流 | Phase 3（設計レビュー） |
| 下流 | Phase 5（実装ランブック / spec walkthrough） |
| 状態 | spec_created |
| user_approval_required | false |

## 目的

本タスクは **docs-only / NON_VISUAL** の設計仕様タスクであり、ランタイムコード実装は UT-09 で行う。したがって本 Phase ではコード単体テスト・統合テストは適用外であることを明記したうえで、**設計文書としての検証戦略** を確定する。具体的には、

1. Phase 2 成果物（`sync-method-comparison.md` / `sync-flow-diagrams.md` / `sync-log-schema.md`）の **設計レビュー走行確認**（章立て・採択理由・図の網羅性）
2. ドキュメント **リンクチェック**（specs_referenced・index.md・原典スペックへの相互参照が壊れていないこと）
3. **仕様書 walkthrough**（UT-09 / UT-03 観点で AC-1〜AC-10 を読み下し、open question 0 件を確認）
4. **UT-09 実装フェーズへ引き継ぐテスト戦略雛形**（同期ジョブ実装時に Vitest / Cron 単体テストでカバーすべき項目を本 Phase で先取り定義）

を `outputs/phase-04/test-strategy.md` に整理する。

## 入力

- `outputs/phase-02/sync-method-comparison.md`（採択理由・代替案比較表）
- `outputs/phase-02/sync-flow-diagrams.md`（手動 / 定期 / バックフィルの 3 フロー）
- `outputs/phase-02/sync-log-schema.md`（sync_log 論理スキーマ）
- `outputs/phase-03/main.md`（PASS / MINOR / MAJOR と open question リスト）
- `outputs/phase-03/alternatives.md`（代替案 4 案の評価）
- `index.md`（AC-1〜AC-10）

## 検証カテゴリ

| カテゴリ | 概要 | 自動化可否 | 本タスクでの扱い |
| --- | --- | --- | --- |
| コード単体テスト | 同期ジョブ関数の Vitest テスト | 自動 | **適用外**（UT-09 で実施。雛形のみ本 Phase で先取り） |
| コード統合テスト | Sheets API ↔ D1 のサンドボックス疎通 | 自動 | **適用外**（UT-09 で実施） |
| 設計レビュー走行確認 | Phase 2 成果物の章立て・図・採択理由の網羅性確認 | 半自動（rg / 目視） | **本 Phase の主検証** |
| リンクチェック | 内部相互参照・外部 URL の到達性 | 自動（rg / lychee 等） | **本 Phase の主検証** |
| 仕様書 walkthrough | UT-09 / UT-03 視点で読み下し、open question 0 を確認 | 手動 | **本 Phase の主検証** |
| AC × 成果物 整合 | AC-1〜AC-10 の引用箇所が成果物に物理存在 | 自動（rg） | **本 Phase の主検証** |
| 副作用なし確認 | コード変更ゼロ。`mise exec -- pnpm typecheck` / `pnpm lint` PASS | 自動 | 本 Phase で実行 |

## TC（テストケース）

### TC-1 設計成果物 3 点の存在と章立て

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-1-1 | `sync-method-comparison.md` 存在 + 比較表セクション | ファイル存在 + `比較` ヒット 1 件以上 | `ls outputs/phase-02/sync-method-comparison.md && rg -n "比較" outputs/phase-02/sync-method-comparison.md` |
| TC-1-2 | 採択方式（B: Cron pull）が明記 | `Cron` または `Workers Cron Triggers` が 1 件以上 | `rg -n "Cron" outputs/phase-02/sync-method-comparison.md` |
| TC-1-3 | `sync-flow-diagrams.md` に 3 フロー（手動 / 定期 / バックフィル） | 3 ラベルすべてヒット | `rg -n "手動\|定期\|バックフィル" outputs/phase-02/sync-flow-diagrams.md` |
| TC-1-4 | `sync-log-schema.md` に必須カラム（ジョブID / status / offset / timestamp / error） | 5 ラベルすべてヒット | `rg -n "ジョブ\|status\|offset\|timestamp\|error" outputs/phase-02/sync-log-schema.md` |

### TC-2 AC × 成果物 整合（AC-1〜AC-10）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-2-1 | AC-1（push/pull/webhook/cron 比較）が `sync-method-comparison.md` に存在 | `push`・`pull`・`webhook`・`cron` 全ヒット | `rg -in "push\|pull\|webhook\|cron" outputs/phase-02/sync-method-comparison.md` |
| TC-2-2 | AC-2（3 フロー図）が `sync-flow-diagrams.md` に存在 | 3 フローキーワード全ヒット | TC-1-3 と同コマンド |
| TC-2-3 | AC-3（リトライ / Backoff / 冪等性 / failed ログ）の方針が成果物に存在 | 4 ラベル全ヒット | `rg -n "リトライ\|Backoff\|冪等\|failed" outputs/phase-02/` |
| TC-2-4 | AC-4（sync_log 論理スキーマ）が `sync-log-schema.md` に存在 | TC-1-4 と同 | TC-1-4 と同コマンド |
| TC-2-5 | AC-5（SoT 優先順位 + ロールバック判断フロー）が成果物に存在 | `source-of-truth` または `SoT` + `ロールバック` ヒット | `rg -in "source-of-truth\|SoT\|ロールバック" outputs/phase-02/` |
| TC-2-6 | AC-6（Sheets API quota 500 req/100s + バッチサイズ + 待機戦略） | `500` + `バッチ` + `待機\|Backoff` ヒット | `rg -n "500\|バッチ\|Backoff" outputs/phase-02/` |
| TC-2-7 | AC-7（行ハッシュ / 一意 ID / ON CONFLICT DO UPDATE） | 3 ラベルヒット | `rg -in "ハッシュ\|ON CONFLICT\|一意" outputs/phase-02/` |
| TC-2-8 | AC-8（代替案 4 案の PASS/MINOR/MAJOR 評価） | `PASS\|MINOR\|MAJOR` 1 件以上 | `rg -n "PASS\|MINOR\|MAJOR" outputs/phase-03/alternatives.md` |
| TC-2-9 | AC-9（open question 0 件） | 「open question」セクションが 0 件 または "0" 明記 | `rg -in "open question" outputs/phase-03/main.md` |
| TC-2-10 | AC-10（taskType / visualEvidence / workflow_state / scope の整合） | jq 出力一致 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` |

### TC-3 リンクチェック

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-3-1 | `index.md` の参照資料（specs_referenced）パスがリポジトリに存在 | 全パスで `ls` PASS | `rg -o "doc/[^ )]+\.md\|docs/[^ )]+\.md" index.md \| sort -u \| while read p; do test -e "$p" \|\| echo "MISSING: $p"; done` |
| TC-3-2 | 原典スペック `unassigned-task/UT-01-sheets-d1-sync-design.md` への参照存在 | 1 件以上 | `rg -n "UT-01-sheets-d1-sync-design" index.md` |
| TC-3-3 | 下流 UT-09 への参照存在 | 1 件以上 | `rg -n "ut-09-sheets-to-d1-cron-sync-job" index.md` |
| TC-3-4 | Phase 11 縮約テンプレ正本への参照存在 | 1 件以上 | `rg -n "phase-template-phase11" index.md` |
| TC-3-5 | 外部 URL（Cron Triggers / Sheets API）の到達性 | HTTP 200（任意） | `curl -fsI https://developers.cloudflare.com/workers/configuration/cron-triggers/ \| head -1` |

### TC-4 仕様書 walkthrough（UT-09 / UT-03 視点）

| TC ID | 検証 | 期待 | 方法 |
| --- | --- | --- | --- |
| TC-4-1 | UT-09 担当が本仕様のみで実装着手可能（AC-9） | open question 0 件 + 曖昧記述 0 件 | 手動 walkthrough、`実装で判断\|TBD\|要検討` の rg が 0 件 |
| TC-4-2 | UT-03（認証）担当が本仕様で必要な認証境界を一意に把握できる | 認証境界（Service Account / scope）が記述済 | `rg -in "Service Account\|scope" outputs/phase-02/` |
| TC-4-3 | 曖昧表現の検出 | `実装で判断\|TBD\|要検討\|後で` ヒット 0 件 | `rg -in "実装で判断\|TBD\|要検討\|後で決める" outputs/` |

### TC-5 副作用なし確認（コード変更ゼロ）

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-5-1 | typecheck PASS | 終了コード 0 | `mise exec -- pnpm typecheck` |
| TC-5-2 | lint PASS | 終了コード 0 | `mise exec -- pnpm lint` |
| TC-5-3 | `apps/`・`packages/` 配下に変更ゼロ | `git diff --name-only main -- apps packages` 出力 0 行 | `git diff --name-only main -- apps packages` |

### TC-6 artifacts.json 整合

| TC ID | 検証 | 期待 | コマンド |
| --- | --- | --- | --- |
| TC-6-1 | Phase 1〜13 の outputs パスがすべて実在もしくは生成計画通り | jq で列挙 → ls 検証 | `jq -r '.phases[].outputs[]' artifacts.json` |
| TC-6-2 | metadata の docs-only / NON_VISUAL / spec_created / design_specification 一致 | 4 値出力 | `jq -r '.metadata \| .taskType, .visualEvidence, .workflow_state, .scope' artifacts.json` |

## UT-09 へ引き継ぐ実装テスト戦略雛形

> **本 Phase ではコード実装はしないが、UT-09 が実装時に参照する Vitest / 統合テスト雛形をここで先取り定義する。UT-09 は本セクションをそのまま `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/phase-04.md` の入力にできる。**

| 雛形 ID | テストレイヤ | 対象 | 想定アサーション |
| --- | --- | --- | --- |
| IMPL-T-1 | unit | offset 計算 / バッチ分割関数 | 1000 行 + バッチ 100 → 10 バッチ生成 / 端数処理 |
| IMPL-T-2 | unit | 行ハッシュ生成（順序非依存・null 安全） | 同一行で同一ハッシュ / 列順入替で同一 |
| IMPL-T-3 | unit | リトライ Exponential Backoff（最大 3 回） | 1s / 2s / 4s 系列・上限到達で fail |
| IMPL-T-4 | unit | sync_log status 遷移（pending → in_progress → completed/failed） | 不正遷移は throw |
| IMPL-T-5 | unit | quota guard（500 req/100s window 推定） | 超過予測時に sleep を返す |
| IMPL-T-6 | integration | Sheets API mock × D1 local（miniflare） | 1000 行 ON CONFLICT DO UPDATE で行数不変 |
| IMPL-T-7 | integration | 部分失敗時の resume（offset 復元） | 中断 → 再開で残行のみ処理 |
| IMPL-T-8 | integration | バックフィル（手動トリガー）と定期 cron の同時起動の冪等性 | 二重起動でも sync_log が衝突しない |
| IMPL-T-9 | smoke (staging) | 実 Sheets ↔ D1 staging で 1 行追加 → 1 cron tick で D1 反映 | sync_log 1 行追加 + completed |

## 検証マトリクス（AC × TC）

| AC ID | 関連 TC | 自動化 |
| --- | --- | --- |
| AC-1 | TC-1-1, TC-1-2, TC-2-1 | 自動 |
| AC-2 | TC-1-3, TC-2-2 | 自動 |
| AC-3 | TC-2-3 | 自動 |
| AC-4 | TC-1-4, TC-2-4 | 自動 |
| AC-5 | TC-2-5 | 自動 |
| AC-6 | TC-2-6 | 自動 |
| AC-7 | TC-2-7 | 自動 |
| AC-8 | TC-2-8 | 自動 |
| AC-9 | TC-2-9, TC-4-1, TC-4-3 | 半自動 |
| AC-10 | TC-2-10, TC-6-2 | 自動 |

## 実行順序（fail-fast）

1. **TC-6（artifacts.json 整合）** — 構造ズレを最速検出
2. **TC-1（成果物 3 点存在 + 章立て）** — Phase 2 成果物の物理存在確認
3. **TC-2（AC × 成果物 整合）** — AC-1〜AC-10 の引用箇所確認
4. **TC-3（リンクチェック）** — 相互参照崩壊検出
5. **TC-4（walkthrough）** — UT-09 / UT-03 視点で読み下し
6. **TC-5（副作用なし）** — typecheck / lint / git diff で最終証跡

## 実行タスク

1. TC-1〜TC-6 の検証コマンド集合を `outputs/phase-04/test-strategy.md` に展開
2. AC × TC マトリクスを作成
3. UT-09 引き継ぎ雛形（IMPL-T-1〜IMPL-T-9）を整理し、UT-09 phase-04 入力として参照可能にする
4. fail-fast 順序を確定
5. 「コード単体テストは UT-09 で実施・本 Phase はスコープ外」を明文化

## 参照資料

| 種別 | パス |
| --- | --- |
| 必須 | `outputs/phase-02/sync-method-comparison.md` |
| 必須 | `outputs/phase-02/sync-flow-diagrams.md` |
| 必須 | `outputs/phase-02/sync-log-schema.md` |
| 必須 | `outputs/phase-03/main.md` |
| 必須 | `outputs/phase-03/alternatives.md` |
| 必須 | `index.md` |
| 必須 | `artifacts.json` |
| 参考 | `docs/30-workflows/ut-gov-005-docs-only-nonvisual-template-skill-sync/phase-04.md`（フォーマット模倣元） |
| 参考 | `docs/30-workflows/ut-09-sheets-to-d1-cron-sync-job/index.md`（引き継ぎ先） |

## 依存Phase明示

- Phase 1 / 2 / 3 成果物を参照する。
- Phase 5（実装ランブック）以降の検証ゲートとして TC-1〜TC-6 を引き継ぐ。

## 成果物

| パス | 役割 |
| --- | --- |
| `outputs/phase-04/test-strategy.md` | TC-1〜TC-6 / AC×TC マトリクス / fail-fast 順序 / UT-09 引き継ぎ雛形 IMPL-T-1〜9 / 「コード単体テスト適用外」宣言 |

## 完了条件 (DoD)

- [ ] TC-1〜TC-6 が成果物に記述
- [ ] 各 TC に rg / jq / diff / curl / pnpm の具体コマンドが書かれている
- [ ] AC × TC マトリクスが作成済（AC-1〜AC-10 全カバー）
- [ ] UT-09 引き継ぎ雛形 IMPL-T-1〜IMPL-T-9 が整理されている
- [ ] fail-fast 実行順序確定
- [ ] 「コード単体テストは本タスクスコープ外（UT-09 で実施）」が明記
- [ ] `mise exec -- pnpm typecheck` / `pnpm lint` PASS の証跡記録欄あり

## 苦戦箇所・注意

- **「テスト＝コード単体テスト」と取り違えない**: 本タスクは設計仕様であり、コード単体テストは UT-09 担当範囲。本 Phase は「設計文書の正しさ検証」と「UT-09 への雛形引き継ぎ」が責務
- **AC-9 の機械化困難**: 「open question 0 件」は機械検出が部分的にしかできない（曖昧表現のキーワード rg）。最終判定は Phase 10 review に委ねる
- **TC-3-5 の不安定性**: 外部 URL の HTTP 到達性は CI ネットワーク制約で不安定。MUST ではなく SHOULD 扱いとし、失敗時は `unassigned-task-detection.md` 候補に登録
- **UT-09 雛形の固定化リスク**: 雛形 IMPL-T-1〜9 を硬直化すると UT-09 の自由度を奪う。**「最低限カバーすべき項目」と位置付け、UT-09 が追加する余地を残す**
- **rg の挙動差**: `rg` 前提コマンド。CI で `grep -rn` 代替が必要な場合は Phase 5 ランブックで明記

## タスク100%実行確認【必須】

- [ ] 本 Phase の実行タスクをすべて確認する。
- [ ] 成果物パスと `artifacts.json` の outputs が一致していることを確認する。
- [ ] 未実行項目は pending または blocked として明示し、完了済みと誤読される表現を残さない。

## 統合テスト連携

- 本タスクは docs-only / NON_VISUAL の設計仕様であり、アプリケーション統合テストは追加しない。
- 統合検証は Phase 2 成果物の rg ベース AC × 成果物 整合、`mise exec -- pnpm typecheck` / `pnpm lint` の副作用なし確認、Phase 11 縮約テンプレ自己適用 smoke で代替する。
- 実コードの統合テストは UT-09 が IMPL-T-6〜IMPL-T-9 に基づき実施する。

## 次 Phase

- 次: Phase 5（実装ランブック / spec walkthrough）
- 引き継ぎ: TC-1〜TC-6 / AC×TC マトリクス / fail-fast 順序 / UT-09 雛形 IMPL-T-1〜9

# Phase 7 成果物 — AC マトリクス

## 1. AC マトリクスサマリ

UT-25 の AC は **AC-1〜AC-11 の全 11 件**（`index.md` §受入条件）。本マトリクスで AC × Phase（1-13）× T（T1〜T11）× 成果物（evidence / deploy-runbook / rollback-runbook / artifacts.json）の対応を空セルなく埋める。実走を伴わない仕様確認のみ。

## 2. AC × Phase 対応表

| AC | 内容（要約） | 主担当 Phase | 補助 Phase | 担当成果物 |
| --- | --- | --- | --- | --- |
| AC-1 | cf.sh ラッパー経由のみ | 2 / 5 | 4 / 6 / 11 / 13 | 全 Phase の検証コマンド |
| AC-2 | staging / production 両投入 + staging-first | 5 (Step 3〜6) | 4 (T1) / 6 (T6) / 11 / 13 | secret-list-evidence-{staging,production}.txt |
| AC-3 | `private_key` 改行保全 stdin 投入 | 2 / 5 (Step 2) | 4 (T4) / 6 (T8) | deploy-runbook.md §投入経路 |
| AC-4 | シェル履歴汚染防止 | 2 / 5 (Step 0) | 6 (T7) | deploy-runbook.md §冒頭 |
| AC-5 | `wrangler secret list` name 確認 | 5 (Step 4 / 6) | 4 (T1) / 6 (T9) / 11 / 13 | secret-list-evidence-{staging,production}.txt |
| AC-6 | `apps/api/.dev.vars` + `.gitignore` 除外 | 2 / 5 (Step 1) | 4 (T2) / 6 (T10) / 11 | （`.dev.vars` は git 管理外）/ `.gitignore` |
| AC-7 | rollback delete + 旧 key 再投入 | 2 / 5 | 4 (T5) / 6 (T8) | rollback-runbook.md |
| AC-8 | UT-03 runbook への配置完了反映 | 5 (Step 7) | 12 | deploy-runbook.md §completion / UT-03 docs |
| AC-9 | 仕様書整備に閉じ・実投入は Phase 13 後 | 1 (§スコープ) | 4 / 5 / 6 / 13 | index.md §スコープ / 全 Phase の "NOT EXECUTED" 表記 |
| AC-10 | 4 条件 PASS（Phase 1 / 3） | 1 / 3 | - | outputs/phase-01/main.md / outputs/phase-03/main.md |
| AC-11 | Phase 1〜13 = artifacts.json 完全一致 | index.md / artifacts.json | 全 Phase | artifacts.json |

## 3. AC × T 対応表

| AC | T1 name | T2 gitignore | T3 `--env` 突合 | T4 改行 | T5 rollback | T6 `--env` 漏れ | T7 op 失敗 | T8 改行破損 | T9 list 遅延 | T10 値ずれ | T11 governance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | -（構造的被覆 / 全 T が cf.sh 経由）|
| AC-2 | - | - | ◎ | - | - | ◎ | - | - | - | - | - |
| AC-3 | - | - | - | ◎ | - | - | - | ◎ | - | - | - |
| AC-4 | - | - | - | - | - | - | ◎ | - | - | - | - |
| AC-5 | ◎ | - | - | - | - | - | - | - | ◎ | - | - |
| AC-6 | - | ◎ | - | - | - | - | - | - | - | ◎ | - |
| AC-7 | - | - | - | - | ◎ | - | - | ◎ | - | - | - |
| AC-8 | -（runbook 記載要件 / Phase 5 Step 7 で被覆）|
| AC-9 | -（Phase 1 §スコープで構造的被覆）|
| AC-10 | -（Phase 1 / 3 評価で構造的被覆）|
| AC-11 | -（artifacts.json 整合で構造的被覆）|

> 凡例: ◎ = 主たる被覆、- = 該当なし。AC-1 / AC-8 / AC-9 / AC-10 / AC-11 は T 群ではなく構造（ラッパー経路 / runbook 記載 / スコープ宣言 / Phase 1・3 評価 / artifacts.json）で直接被覆。

## 4. AC × 成果物 対応表

| AC | 主成果物 | 補助成果物 |
| --- | --- | --- |
| AC-1 | scripts/cf.sh（参照） | 全 Phase の検証コマンドブロック |
| AC-2 | secret-list-evidence-{staging,production}.txt | deploy-runbook.md §staging-first |
| AC-3 | deploy-runbook.md §投入経路（stdin パイプ） | Phase 5 Step 2 jq 検査ログ |
| AC-4 | deploy-runbook.md §冒頭（`set +o history`） | Phase 5 Step 0 |
| AC-5 | secret-list-evidence-{staging,production}.txt | deploy-runbook.md §完了確認 |
| AC-6 | apps/api/.gitignore（参照） | T2 grep + git check-ignore 結果 |
| AC-7 | rollback-runbook.md | Phase 5 §rollback-runbook 骨格 |
| AC-8 | deploy-runbook.md §completion | UT-03 該当 docs / Phase 12 documentation-changelog.md |
| AC-9 | index.md §スコープ §含まない | 全 Phase の "NOT EXECUTED" 表記 |
| AC-10 | outputs/phase-01/main.md §4 条件評価 / outputs/phase-03/main.md §4 条件再評価 | - |
| AC-11 | artifacts.json `phases[]` | index.md §Phase 一覧 |

## 5. Phase 13 成果物 1:1 対応表

| Phase 13 成果物 | 対応 AC | 検証コマンド |
| --- | --- | --- |
| `outputs/phase-13/secret-list-evidence-staging.txt` | AC-2（staging 投入）/ AC-5（staging name 確認） | `grep -E '^GOOGLE_SERVICE_ACCOUNT_JSON\b'` で 1 行ヒット |
| `outputs/phase-13/secret-list-evidence-production.txt` | AC-2（production 投入）/ AC-5（production name 確認） | 同上 |
| `outputs/phase-13/deploy-runbook.md` | AC-2 / AC-3 / AC-4 / AC-7 / AC-8 | 各セクション存在を `rg -c '^## '` で確認 |
| `outputs/phase-13/rollback-runbook.md` | AC-7（delete + 再 put）+ T8 緊急 rollback | §通常 / §緊急 の両セクション存在確認 |
| `artifacts.json` `phases[]` | AC-11 | Phase 1〜13 状態が index.md と完全一致 |

## 6. AC-10（4 条件 PASS）引用

| 観点 | Phase 1 判定 | Phase 3 判定 |
| --- | --- | --- |
| 価値性（UT-26 / UT-09 unblock） | PASS | PASS |
| 実現性（cf.sh + op + stdin で実装可能） | PASS | PASS |
| 整合性（CLAUDE.md 直接禁止 / 不変条件 #5） | PASS | PASS |
| 運用性（staging-first + rollback fail-fast） | PASS | PASS |

## 7. AC-11（Phase 1-13 = artifacts.json 完全一致）確認

| Phase | 状態（index.md） | 状態（artifacts.json） | 一致 |
| --- | --- | --- | --- |
| 1 | completed | completed | ✓ |
| 2 | completed | completed | ✓ |
| 3 | completed | completed | ✓ |
| 4 | pending | pending | ✓ |
| 5 | pending | pending | ✓ |
| 6 | pending | pending | ✓ |
| 7 | pending | pending | ✓ |
| 8 | pending | pending | ✓ |
| 9 | pending | pending | ✓ |
| 10 | pending | pending | ✓ |
| 11 | pending | pending | ✓ |
| 12 | pending | pending | ✓ |
| 13 | pending | pending | ✓ |

## 8. MINOR 解決状況

| MINOR ID | 指摘 | 解決 Phase | 紐付き AC / T |
| --- | --- | --- | --- |
| UT25-M-01 | `.gitignore` 除外確認 smoke 必須化 | Phase 4 (T2) / Phase 11 | AC-6 / T2 |
| UT25-M-02 | `--env` 漏れ異常系 | Phase 6 (T6) | AC-2 / T3（予防）/ T6（本体） |

## 9. 未消化 AC チェック

- AC-1〜AC-11 すべてに **主担当 Phase / 主成果物** が割り当て済み
- AC × T マトリクスで AC-2 / AC-3 / AC-4 / AC-5 / AC-6 / AC-7 に最低 1 件の ◎ あり
- AC-1 / AC-8 / AC-9 / AC-10 / AC-11 は構造的被覆（ラッパー経路 / runbook 記載 / スコープ宣言 / Phase 1・3 評価 / artifacts.json）で代替
- 空セル（「-」のみ）の AC 行: なし（構造的被覆を注記済み）

## 10. 引き渡し（Phase 8 へ）

- 全 11 件 AC が Phase × T × 成果物 + Phase 13 成果物 1:1 の 4 軸でマッピング済み
- 未消化 AC ゼロを Phase 8 DRY 化 / Phase 9 品質保証 / Phase 10 GO/NO-GO で再利用
- AC-7（rollback runbook）/ AC-8（UT-03 runbook 反映）の 2 件は実装ランブック / runbook 記載の両方が要件のため、Phase 11 / Phase 12 / Phase 13 PR 説明で再点検
- Phase 13 成果物 1:1 対応表（§5）は Phase 11 smoke / Phase 12 documentation-changelog の入力
- 実走を伴わない（本 Phase は対応関係の固定のみ）

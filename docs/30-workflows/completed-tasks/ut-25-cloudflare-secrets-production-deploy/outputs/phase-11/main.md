# Phase 11 main — 手動 smoke test（staging 投入リハーサル）

## スコープ

- **実走対象: staging のみ**
- **production には触れない**: production 環境への実投入は Phase 13 deploy-runbook 経由でユーザー承認後に実施
- 本 Phase は Phase 1〜10 で固定された設計（cf.sh ラッパー / staging-first / op stdin / delete + 再 put rollback / `.dev.vars` gitignore 整合）の **staging 実走テンプレート**。現時点では secret 操作未実走で、実行結果は `manual-smoke-log.md` の TBD をユーザー承認後に置換する。

## 実走の境界

| 行為 | 本 Phase 11 | Phase 13（ユーザー承認後） |
| --- | --- | --- |
| `bash scripts/cf.sh secret put --env staging` | ○ 実走 | - |
| `bash scripts/cf.sh secret list --env staging` | ○ 実走 | ○ evidence 取得 |
| `bash scripts/cf.sh secret delete --env staging` + 再 put | ○ rollback リハーサル | - |
| `bash scripts/cf.sh secret put --env production` | × 禁止 | ○ ユーザー承認後 |
| `bash scripts/cf.sh secret list --env production` | × 禁止 | ○ evidence 取得 |
| evidence の secret-list-evidence-*.txt 置換 | × 禁止 | ○ ユーザー本人 |

## 4 条件（staging smoke テンプレート確認）

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 価値性 | TEMPLATE READY | staging で put / list / delete / 再 put を確認する手順が揃っている |
| 実現性 | TEMPLATE READY | cf.sh + op stdin 経路で実走するコマンド列が定義済み |
| 整合性 | TEMPLATE READY | wrangler 直接実行なし / 履歴汚染なし / 値転記なし / `.dev.vars` gitignore 確認欄を用意 |
| 運用性 | TEMPLATE READY | rollback リハーサルの fail-fast 経路をテンプレート化済み |

## MINOR 解決確認

| MINOR ID | 内容 | 解決 Phase | 確認結果 |
| --- | --- | --- | --- |
| UT25-M-01 | `apps/api/.dev.vars` の `.gitignore` 除外確認 | Phase 11 | `manual-smoke-log.md` STEP 5 で確認予定（`git check-ignore -v` 結果を記録） |
| UT25-M-02 | `--env` 漏れ事故シナリオ | Phase 6 / Phase 9 | Phase 9 で確認済（本 Phase では再掲のみ） |

## 保証できない範囲（Phase 12 申し送り候補）

1. **Sheets API 機能疎通**: 本 Phase は name 確認まで。実 Sheets API 呼び出しによる SA 認証成功確認は UT-26 のスコープ。
2. **SA key 失効監視**: SA key 自体が期限切れ・失効した場合の検出経路は本ワークフローのスコープ外。Phase 12 `unassigned-task-detection.md` で派生タスクとして登録候補。
3. **SA key 定期ローテーション運用**: 本ワークフローは初回配置と緊急 rollback のみ。定期ローテーション運用 SOP は別ワークフロー。
4. **Cloudflare Secret bulk export 監査**: Cloudflare 側で secret が誰によって参照されたかの監査ログは本 Phase で扱わない。

## NON_VISUAL evidence 階層（本タスク適用版）

| 階層 | 代替手段 | 何を保証するか | 何を保証できないか |
| --- | --- | --- | --- |
| L1: 型 | `wrangler secret list` の name 出力に `GOOGLE_SERVICE_ACCOUNT_JSON` が含まれる | secret name の存在 | 値の正当性（key の有効性） |
| L2: 境界 | staging / production の `--env` 切替が wrangler.toml と一致 | 環境境界の正しさ | 投入間違い（環境取り違え） |
| L3: 手順 | put / list / delete / 再 put の 4 ステップが staging で再現可能 | 操作手順の網羅 | 実 production 挙動 |
| L4: 意図的 violation | `set +o history` を抜いて `history | grep BEGIN PRIVATE` を回す赤確認（spec walkthrough のみ・実走しない） | 履歴汚染検出経路 | （L4 自体は green 保証ではない） |

## 関連ファイル

- `manual-smoke-log.md`: 実走ログ（コマンド・時刻・結果）
- `link-checklist.md`: ワークフロー内リンク健全性チェック
- 上流: `outputs/phase-05/main.md`（実装ランブック）/ `outputs/phase-06/main.md`（異常系）/ `outputs/phase-09/main.md`（QA）
- 下流: `outputs/phase-12/implementation-guide.md` Part 2（コマンド系列再掲先）/ `outputs/phase-13/deploy-runbook.md`（production 展開先）

## 完了状況

- [ ] staging smoke 6 STEP 実走済
- [ ] rollback リハーサル PASS
- [ ] `.dev.vars` gitignore 確認済
- [ ] 履歴汚染チェック PASS
- [ ] 保証できない範囲 4 件を Phase 12 へ申し送り
- [ ] production への実投入を行っていない

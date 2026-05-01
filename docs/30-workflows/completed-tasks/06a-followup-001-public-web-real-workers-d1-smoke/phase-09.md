# Phase 9: 品質保証

## 目的

本タスクは smoke が中心で実装ファイル変更を伴わないが、`scripts/cf.sh` 経由で 1Password 注入された secret（`CLOUDFLARE_API_TOKEN` 等）を扱い、staging URL / D1 database id 等の準機密情報を log / PR に晒すリスクがある。Phase 9 では secret hygiene を中心に、free-tier 影響と非対象領域（a11y / VR）の明示を行う。

## QA 観点 1: secret hygiene（最重要）

### 出してはいけない値

| 種別 | 値の場所 | 漏洩リスク |
| --- | --- | --- |
| API Token | `op://...` 経由で env injection | log redirect / `printenv` 出力 |
| Account ID | `wrangler.toml` / op | wrangler dump 出力 |
| D1 Database ID | `wrangler.toml` の `database_id` | `d1 list` / `d1 info` 出力 |
| OAuth tokens | `~/.wrangler/config/default.toml`（CLAUDE.md で禁止済み） | wrangler 直接実行による副作用 |
| staging Worker の独自 subdomain | `*.workers.dev` | curl 結果 log への混入 |

### 漏洩防止チェックリスト

- [ ] `local-curl.log` / `staging-curl.log` を保存する前に `grep -E "(token|TOKEN|secret|SECRET|database_id)"` で空ヒット確認
- [ ] D1 database id を含むコマンド出力（`d1 list` 等）を **log に直接 redirect しない**。必要時は database 名のみ抽出して記録
- [ ] staging URL は `evidence` log の中で 1 度だけ出現させる（curl の URL に含まれる範囲は許容）。それ以外の本文では「staging URL」と一般化記述する
- [ ] PR description / commit message に staging URL / D1 id を貼らない
- [ ] スクリーンショット `staging-screenshot.png` 内に Cloudflare ダッシュボードの API token UI / account ID が映り込んでいないことを目視で確認
- [ ] `wrangler` を直接呼び出していないことを Phase 11 実施前にコマンド履歴で確認（CLAUDE.md ルール）

### 自動チェック（手動 smoke 後の最終ゲート）

```
# 擬似コマンド例（Phase 11 実施直前ゲート）
rg -i "(api[_-]?token|database_id|cloudflare_api_token)" outputs/phase-11/evidence/
# 期待: 0 件
```

## QA 観点 2: free-tier 影響

| 項目 | 評価 |
| --- | --- |
| D1 read rows | 4 route family / 5 smoke cases × 2 環境で `/members` を叩く程度のため、無料枠（25M reads/day）に対し誤差レベル |
| Workers requests | smoke 数回 / staging のみ。無料枠（100k/day）に対し影響なし |
| D1 write | 本タスクでは write を行わない（seed は前提条件） |
| 課金ガード | smoke を CI で繰り返し実行する設計にしない（手動 smoke gate のみ） |

結論: **free-tier 逸脱リスクなし**。

## QA 観点 3: 非対象領域（明示）

本タスクは NON_VISUAL タスクのため、以下は **明示的に対象外** とする。

| 領域 | 対象外理由 |
| --- | --- |
| a11y 検証（axe / Lighthouse） | 06a 親タスクの責務、本 followup は smoke 経路の確認のみ |
| visual regression | 同上、screenshot は 1 枚のみで evidence 用途に限定 |
| 04a API contract（zod schema 等） | scope out、04a 親タスクで担保済み前提 |
| Playwright E2E | 08b の責務 |
| パフォーマンス計測 | smoke 範囲外（応答 status のみ確認） |

## QA 観点 4: 再現性 / 冪等性

- `scripts/cf.sh` 経由起動は 2 回連続 fresh で同一結果（AC-1）
- D1 binding seed の差分による `/members` 件数の揺らぎは AC-3 で「1 件以上」と緩く設定し冪等性を担保
- staging への副作用なし（read-only smoke）

## QA 観点 5: 不変条件 trace 再確認

| # | QA での担保 |
| --- | --- |
| #5 | AC-7 の `rg` 0 件 + 経路自体の 3 層分離 |
| #1 | `/members` 200 応答が schema 固定回避を間接担保 |
| #6 | smoke ルートに GAS endpoint を含めない |

## レビュー結論

- secret hygiene チェックリストを Phase 11 実施前 / 実施後の 2 回適用
- free-tier 影響なし
- a11y / VR / contract / E2E は明示的に scope out として記録
- 自動チェック（rg による secret pattern 検出）を最終ゲートに採用

## 完了条件

- [ ] 既存の完了条件を満たす

- `outputs/phase-09/main.md` に上記チェックリストとレビュー結論が反映
- secret hygiene の自動チェックコマンド（擬似形式）が記録
- 非対象領域 5 項目が明示

## メタ情報

- workflow: `06a-followup-001-public-web-real-workers-d1-smoke`
- phase: 9
- status: `spec_created / pending`
- taskType: `implementation`
- visualEvidence: `NON_VISUAL`

## 実行タスク

- secret hygiene と保存ファイルサイズを確認する
- local / staging の gate 条件を品質保証観点で再確認する

## 参照資料

- `docs/30-workflows/completed-tasks/task-06a-followup-001-real-workers-d1-smoke.md`
- `CLAUDE.md`
- `docs/00-getting-started-manual/specs/08-free-database.md`
- `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`

## 成果物

- `outputs/phase-09/main.md`

## 統合テスト連携

- Phase 11 の local / staging curl smoke と AC trace に接続する。
- UI regression ではなく NON_VISUAL の HTTP / D1 binding evidence を正本にする。

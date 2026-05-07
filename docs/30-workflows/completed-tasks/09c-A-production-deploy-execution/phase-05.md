[実装区分: 実装仕様書（runbook execution + evidence collection）]

# Phase 5: 実装ランブック — 09c-A-production-deploy-execution

## メタ情報

| 項目 | 値 |
| --- | --- |
| task name | 09c-A-production-deploy-execution |
| phase | 5 / 13 |
| wave | 9c-fu |
| mode | serial |
| 作成日 | 2026-05-05 |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |

## 目的

production deploy 実 execution の **完全 runbook** を `outputs/phase-05/main.md` に固定する。本仕様書は spec_created 段階であり、runbook の各 Step は実 execution 用に「コピペ可能なコマンド + sanity check + evidence path + user approval mark + skip 条件」を含む。本 Phase で実コマンドの実行・production mutation・commit・push・PR 作成は **行わない**。

## 実行タスク

1. 8 Step + rollback + approval gate 一覧 + 24h verification を `outputs/phase-05/main.md` にまとめる。完了条件: 全 Step が `bash scripts/cf.sh` 経由で記述される。
2. user approval gate を mutation Step ごとに明示マークする。完了条件: 5 つの mutation Step に `[USER_APPROVAL_REQUIRED]` の宣言がある。
3. rollback 経路（API / Web / D1）を 3 種類に分けて記述する。完了条件: 各 rollback の前提・コマンド・sanity check・evidence path が揃う。
4. 24h verification の取得手順（Cloudflare Dashboard / SQL / Sentry-Slack）を記述する。完了条件: metrics 5 種類の取得経路が揃う。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-04/main.md | 5 層 verify suite + AC mapping |
| 必須 | docs/30-workflows/completed-tasks/09c-A-production-deploy-execution/outputs/phase-02/main.md | 17 step 依存 matrix |
| 必須 | docs/00-getting-started-manual/specs/15-infrastructure-runbook.md | D1 / Worker / Rollback 基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/deployment-cloudflare-opennext-workers.md | apps/web 正規 deploy 経路 §5 |
| 必須 | apps/api/package.json / apps/web/package.json | scripts 確認（deploy:production 不在を確認済み） |
| 参考 | docs/30-workflows/completed-tasks/09c-serial-production-deploy-and-post-release-verification/phase-05.md | 13 step 構造の参考 |

## 実行手順

### ステップ 1: outputs/phase-05/main.md の Step 1〜8 を記述

各 Step は次の構造で書く:

- ヘッダー: `### Step N: <名前>` と `[USER_APPROVAL_REQUIRED]` または `[READ_ONLY]` のマーク
- 前提条件
- コマンド（コピペ可能、`bash scripts/cf.sh` 経由のみ）
- sanity check（各コマンドの期待出力）
- evidence: 出力先 path
- 失敗時の差し戻し先

### ステップ 2: rollback 手順 3 種類

API Worker / Web Worker / D1 migration の 3 種類を独立節として記述する。`apps/web` から D1 を直接操作する rollback は不変条件 #6 違反なので **明示禁止** と書く。

### ステップ 3: 自走禁止操作 / approval gate 一覧

5 つの mutation gate（D1 apply / API deploy / Web deploy / release tag push / dev→main merge）を冒頭にサマリ。

### ステップ 4: 24h verification 手順

Cloudflare Dashboard 3 画面 + SQL 1 件 + Sentry/Slack 通知履歴 の 5 種を `outputs/phase-11/24h-verification-summary.md` に集約する手順を書く。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | verify suite 5 層を runbook の各 Step に紐付け |
| Phase 6 | failure case と rollback の対応関係 |
| Phase 7 | AC matrix で runbook step 列に再利用 |
| Phase 11 | runbook 走破 evidence を取得 |
| 上流 09a-A | staging runbook を citation |
| 上流 09b-A / 09b-B | release / incident runbook を citation、healthcheck mechanism を Step 7 で接続 |

## 多角的チェック観点

- #5 public/member/admin boundary（Step 6 smoke）
- #6 apps/web から D1 直接 access 禁止（Step 6 invariant + rollback で web→D1 操作禁止を明示）
- #14 Cloudflare free-tier（Step 8 metrics）
- secret 値を log / evidence に転記しない
- `wrangler` 直接実行を runbook に登場させない

## サブタスク管理

- [ ] Step 1〜8 を `outputs/phase-05/main.md` に完全記述
- [ ] rollback 3 種類を記述
- [ ] approval gate 5 件サマリを冒頭に配置
- [ ] 24h verification 手順を記述
- [ ] `bash scripts/cf.sh` 以外の Cloudflare CLI が登場しない

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | 8 step + rollback + approval gate + 24h verification の完全 runbook |

## 完了条件

- [ ] 8 Step すべてに前提・コマンド・sanity・evidence・差し戻し先が記述される
- [ ] mutation Step 5 件に `[USER_APPROVAL_REQUIRED]` マークがある
- [ ] rollback 3 種類（API / Web / D1）が独立節で記述される
- [ ] 24h verification 手順が 5 種記述される
- [ ] Phase 4 verify suite の 5 層と各 Step が 1:1 以上で対応する

## タスク100%実行確認

- [ ] outputs/phase-05/main.md が完成
- [ ] 実コマンドが全 Step に記述される（template 表現禁止）
- [ ] secret 値を含まない
- [ ] runtime mutation を spec 段階で行っていない

## 次 Phase への引き渡し

- 8 Step の execution 順序 + 5 mutation gate を Phase 6 に
- rollback 3 種を Phase 6 異常系の mitigation に再利用
- AC × runbook step を Phase 7 に

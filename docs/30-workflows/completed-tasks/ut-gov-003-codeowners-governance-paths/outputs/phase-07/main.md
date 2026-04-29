# Phase 7 成果物: AC マトリクス main

## 概要

UT-GOV-003 の受入条件 AC-1〜AC-10 を、検証 Phase / 検証コマンド or 手順 / 期待結果 / 検証担当 でクロス参照する。本マトリクスは Phase 9（品質保証） / Phase 10（GO/NO-GO 判定） / Phase 11（実走証跡）の判定入力として再利用される。

> CODEOWNERS は実行コードを伴わないため line / branch coverage は適用しない。本マトリクスがカバレッジ責務を担う。

## AC 定義（10 件）

### 原典 §2.2 由来

| AC | 内容 |
| --- | --- |
| AC-1 | リポジトリ直下に `.github/CODEOWNERS` が存在する |
| AC-2 | governance 5 パス（`docs/30-workflows/**` / `.claude/skills/**/references/**` / `.github/workflows/**` / `apps/api/**` / `apps/web/**`）に owner が明示 |
| AC-3 | global fallback (`* @daishiman`) が 1 行配置され、最終マッチ勝ち順序 |
| AC-4 | `gh api .../codeowners/errors` で `errors: []` |
| AC-5 | `doc/` → `docs/` 統一済み or 不可避ケース明示記録 |
| AC-6 | branch protection で `require_code_owner_reviews=false` 方針明記、CODEOWNERS は ownership 文書として機能 |

### 本タスク派生

| AC | 内容 | 派生根拠 |
| --- | --- | --- |
| AC-7 | glob は `**` 形式に統一、末尾 `/` 有無の差異なし | Phase 6 T7 |
| AC-8 | 個人ハンドル `@daishiman` のみ、未存在 team / user 混入なし | Phase 6 T6 |
| AC-9 | post-merge に `gh api .../codeowners/errors` を再実行し errors=[] を記録 | Phase 5 Step 5 |
| AC-10 | CI gate（codeowners-validator 等）導入可否判定済み、不採用根拠 or 再評価トリガを Phase 12 へ申し送り | Phase 4 T4 |

## メインマトリクス（AC × Phase × コマンド × 期待 × 担当）

| AC | 検証 Phase | 検証コマンド / 手順 | 期待結果 | 検証担当 |
| --- | --- | --- | --- | --- |
| AC-1 | Phase 5 Step 3 / 11 | `test -f .github/CODEOWNERS` | exit 0 | 実装担当者 |
| AC-2 | Phase 5 Step 4 (T2) | test PR で 5 パスに無害 file → suggested reviewer 確認 | 5 パスすべて `@daishiman` | 実装担当者（UI 目視） |
| AC-3 | Phase 5 Step 3 / Phase 6 T9 | `head -20 .github/CODEOWNERS` で 1 行目 `* @daishiman`、governance 末尾 | 順序が正本通り | 実装担当者 |
| AC-4 | Phase 5 Step 4 (T1) | `gh api repos/daishiman/UBM-Hyogo/codeowners/errors --jq '.errors'` | `[]` | 実装担当者 |
| AC-5 | Phase 5 Step 1 / 2 / 5 (T3) | `rg -n "(^\|[^a-zA-Z])doc/" -g '!node_modules' -g '!.git' -g '!docs/30-workflows/completed-tasks/**' .` | 0 hit or 除外記録のみ | 実装担当者 |
| AC-6 | Phase 5 Step 0 / UT-GOV-001 連携 | branch protection 草案で `required_pull_request_reviews.require_code_owner_reviews=false`（or null）目視確認 + Step 0 ゲート記述確認 | true でないこと | 実装担当者 + UT-GOV-001 |
| AC-7 | Phase 5 Step 3 / Phase 6 T7 | `rg "^[^#].* @" .github/CODEOWNERS` で governance 行が `**` 形式 | 末尾 `/` のみ / 末尾なしが無い | 実装担当者 |
| AC-8 | Phase 5 Step 4 (T1) / Phase 6 T6 | `gh api .../codeowners/errors` errors=[] かつ `grep -E "@[^ ]+/" .github/CODEOWNERS` で team 形式無し | 個人ハンドルのみ | 実装担当者 |
| AC-9 | Phase 5 Step 5 | main マージ後 `gh api .../codeowners/errors` を再走、`outputs/phase-11/manual-smoke-log.md` に記録 | `[]` | 実装担当者（post-merge） |
| AC-10 | Phase 4 T4 / Phase 12 申し送り | T4 の 3 条件チェックリストを `outputs/phase-04/main.md` に記録、再評価トリガを Phase 12 unassigned-task-detection.md に登録 | 不採用根拠 or 再評価トリガが文書化済み | 実装担当者 + Phase 12 |

## AC × T テスト 対応表

| AC | T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | - | - | - | - | - | - | - | - | - |
| AC-2 | ◎ | ◎ | - | - | - | △ | △ | - | △ |
| AC-3 | - | - | - | - | - | - | - | - | ◎ |
| AC-4 | ◎ | - | - | - | ◎ | - | - | - | - |
| AC-5 | - | - | ◎ | - | - | - | - | ◎ | - |
| AC-6 | - | - | - | - | - | - | - | - | - |
| AC-7 | △ | ◎ | - | - | - | - | ◎ | - | - |
| AC-8 | ◎ | △ | - | - | △ | ◎ | - | - | - |
| AC-9 | ◎ | - | ◎ | - | - | - | - | - | - |
| AC-10 | - | - | - | ◎ | - | - | - | - | - |

> 凡例: ◎ = 主検証 / △ = 補助検証 / - = 該当なし。AC-1 / AC-6 は文書配置 / 方針記述で担保する別レイヤ。

## 検証実走チェックリスト（Phase 11 / 実装 PR で記入）

- [ ] AC-1: `.github/CODEOWNERS` 存在確認 → exit 0
- [ ] AC-2: test PR で 5 パスすべて @daishiman 表示
- [ ] AC-3: 1 行目 `* @daishiman`、末尾 governance 配置
- [ ] AC-4: `gh api .../codeowners/errors` => `[]`
- [ ] AC-5: rg 棚卸し 0 hit（または除外記録）
- [ ] AC-6: branch protection 草案で `require_code_owner_reviews` が true でない
- [ ] AC-7: governance 行すべて `**` 形式
- [ ] AC-8: team 形式が混入していない
- [ ] AC-9: post-merge に `gh api .../codeowners/errors` 再実行 → `[]` を log に記録
- [ ] AC-10: CI gate 不採用根拠 or 再評価トリガが Phase 12 に登録

## 将来再評価項目

| 項目 | トリガ | 影響 AC |
| --- | --- | --- |
| team handle 採用 | 組織化 | AC-8 / AC-2（権限事前付与必須） |
| `require_code_owner_reviews=true` 切替 | 共同開発体制 | AC-6 / AC-3（順序設計の影響顕在化） |
| CODEOWNERS CI gate 導入 | T4 の 3 条件のいずれか成立 | AC-10 |

## 関連

- 原典: `docs/30-workflows/completed-tasks/UT-GOV-003-codeowners-governance-paths.md` §2.2
- Phase 4: `phase-04.md`（T1〜T4）
- Phase 5: `phase-05.md`（Step 0〜5）
- Phase 6: `phase-06.md`（T5〜T9）
- 後続: Phase 9 / 10（GO/NO-GO 判定）/ Phase 11（実走証跡）/ Phase 12（再評価トリガ申し送り）

# Phase 3 成果物 — 設計レビュー

## 1. レビューサマリ

Phase 2 設計（lane 1〜5 直列実行 / dev・main 独立 PUT / adapter 正規化 / rollback 3 経路）に対し、4 案（A / B / C / D）を 9 観点（4 条件 + 5 観点）で比較した結果、**base case = 案 A（gh api 直叩き + payload Git 管理）** を採用、UT-GOV-004 同時完了時のみ案 D（2 段階適用）にフォールバック、と確定した。最終判定は **PASS（with notes 4 件）**、MAJOR ゼロ。着手可否ゲートで UT-GOV-004 完了を NO-GO 条件として 3 重明記の最終箇所に固定し、Phase 4 へ進める。

## 2. 代替案比較

### 2.1 案 A: gh api 直叩き + payload Git 管理（base case / MVP）

- 概要: `gh api ... -X PUT --input payload-{branch}.json`。adapter は jq / shell。snapshot / payload / rollback / applied は `outputs/phase-13/` に Git tracked。
- 強み: 既存 `gh` CLI 認証流用、追加依存ゼロ、payload diff が PR レビューしやすい、CLAUDE.md `scripts/cf.sh` 思想と整合。
- 弱み: state 管理は手動、drift 検知は grep ベース。

### 2.2 案 B: Terraform `github_branch_protection_v3`

- 概要: IaC 化、state backend（R2 / S3 / GitHub）。
- 強み: 完全宣言的、drift 検知、plan-apply。
- 弱み: 本リポジトリは Cloudflare Workers + pnpm 中心で Terraform 運用基盤が無い。**実現性 MAJOR / 整合性 MAJOR / 価値とコスト MAJOR**。MVP スコープ外。

### 2.3 案 C: Octokit script (Node)

- 概要: `@octokit/rest` で TypeScript 実装。
- 強み: 型安全、複雑 adapter ロジック向け。
- 弱み: 新規依存追加、`gh` CLI 認証流用不可、secret 管理経路追加。**整合性 MINOR / 価値とコスト MINOR**。

### 2.4 案 D: gh api + 2 段階適用（UT-GOV-004 同時完了時フォールバック）

- 概要: 第 1 段階で `contexts=[]` 適用 → UT-GOV-004 完了後に第 2 段階で contexts 入りを再 PUT。
- 強み: UT-GOV-004 と並列着手可能。
- 弱み: 第 1 段階完了後は governance 強制力が一時弱化。**価値性 MINOR / 運用性 MINOR**。
- 採用方針: base case のフォールバック分岐として保持。

## 3. 評価マトリクス（9 観点 × 4 案）

| 観点 | A (base) | B (TF) | C (Octokit) | D (2 段階) |
| --- | --- | --- | --- | --- |
| 価値性 | PASS | PASS | PASS | MINOR |
| 実現性 | PASS | MAJOR | MINOR | PASS |
| 整合性 | PASS | MAJOR | MINOR | PASS |
| 運用性 | PASS | MINOR | MINOR | MINOR |
| 責務境界 | PASS | PASS | PASS | PASS |
| 依存順序固定 | PASS | PASS | PASS | PASS |
| 価値とコスト | PASS | MAJOR | MINOR | PASS |
| ロールバック | PASS | PASS | PASS | PASS |
| 状態所有権 | PASS | PASS | PASS | PASS |

## 4. PASS/MINOR/MAJOR 判定基準

| レベル | 基準 |
| --- | --- |
| PASS | 4 条件 + 5 観点を満たす。Phase 4 へ進める。 |
| MINOR | 警告。Phase 5 / 11 / 12 / 13 で補足対応が必要だが Phase 4 移行可。 |
| MAJOR | block。Phase 4 へ進めず、Phase 2 へ差し戻し or MVP スコープ外明確化。 |

## 5. base case 最終判定 (PASS with notes)

| 観点 | 判定 |
| --- | --- |
| 価値性 | PASS |
| 実現性 | PASS |
| 整合性 | PASS |
| 運用性 | PASS |
| 責務境界 | PASS |
| 依存順序 | PASS（with notes: UT-GOV-004 完了必須） |
| 価値とコスト | PASS |
| ロールバック | PASS |
| 状態所有権 | PASS |

**notes:**
1. UT-GOV-004 完了確認は Phase 5 着手前の必須ゲート。同時完了は案 D フォールバック（2 段階適用）。第 2 段階の再 PUT を Phase 13 完了条件に組み込む。
2. `enforce_admins=true` の rollback 経路は `apply-runbook.md` に担当者明記必須（solo 運用では実行者本人）。
3. dry-run / apply / rollback リハーサルは Phase 11 で実走。コマンド系列は Phase 2 §7 で固定済み。
4. 実 `gh api PUT` は Phase 13 ユーザー承認後に実行（user_approval_required: true）。

## 6. 着手可否ゲート

### 6.1 GO 条件

- 代替案 4 案以上が評価マトリクスに並ぶ
- base case 最終判定が全観点 PASS（or PASS with notes）
- MAJOR ゼロ（base case ベース）
- MINOR の対応 Phase 指定済み
- open question 全件 Phase 振り分け済み

### 6.2 NO-GO 条件（重複明記 3/3）

- **UT-GOV-004 が completed でない（同時完了で 2 段階適用フォールバック合意も無い）**
- 4 条件のいずれかに MAJOR
- adapter で snapshot をそのまま PUT に流す設計が残存（§8.1 違反）
- dev / main bulk PUT 設計が残存（§8.5 違反）
- `lock_branch=true` が payload に含有（§8.3 違反）
- `enforce_admins=true` の rollback 経路が runbook に担当者明記なし（§8.4 違反）
- ロールバック 3 経路（通常 / 緊急 / 再適用）が記述なし

## 7. open question 振り分け

| # | 質問 | 受け皿 |
| --- | --- | --- |
| 1 | adapter 実装言語（jq / shell vs Node） | Phase 5 |
| 2 | dry-run 差分形式（diff ベタ貼り vs 構造化） | Phase 11 |
| 3 | 2 段階適用第 2 段階の自動化 | Phase 13 |
| 4 | 案 B（Terraform）将来導入時期 | Phase 12 unassigned |
| 5 | drift 検知の高度化（定期 GHA diff） | Phase 12 unassigned |

## 8. 結論

- 採用: 案 A（gh api 直叩き + payload Git 管理）
- フォールバック: 案 D（2 段階適用、UT-GOV-004 同時完了時のみ）
- 棄却: 案 B（MVP スコープ外）/ 案 C（過剰設計）
- 最終判定: **PASS（with notes 4 件）**、MAJOR ゼロ → Phase 4 へ進む

## 9. 引き渡し（Phase 4 へ）

- base case = 案 A、フォールバック = 案 D
- lane 1〜5 のテスト計画ベースライン
- notes 4 件（UT-GOV-004 ゲート / enforce_admins 担当者 / Phase 11 smoke / Phase 13 user_approval）
- open question 5 件 register

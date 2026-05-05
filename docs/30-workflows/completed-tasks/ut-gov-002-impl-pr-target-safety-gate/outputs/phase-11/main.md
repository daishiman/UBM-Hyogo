# Phase 11: 手動テスト — メイン

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | ut-gov-002-impl-pr-target-safety-gate |
| Phase | 11 |
| タスク種別 | implementation |
| visualEvidence | VISUAL |
| workflow | spec_created |
| GitHub Issue | #204（CLOSED） |
| ステータス | spec_created（実走未実施） |

## 概要

本 Phase は **VISUAL evidence 取得の正本**である。`pull_request_target` safety gate / `pull_request` build-test の責務分離が、実 GitHub Actions 上で意図通りに動作することを T-1〜T-5 の 5 シナリオで dry-run smoke 実走し、`gh run view --log` での secrets / token 露出ゼロ目視確認と GitHub Actions UI / branch protection 画面のスクリーンショットで AC-4 / AC-5 を実証する。

`spec_created` 状態の本 Phase 12 時点では、実走および画像取得は **未実施**である。Phase 13 でユーザー承認を得た後、本 Phase に固定された手順テンプレートに従って実走し、その結果を本ディレクトリに追記する。

## 責務（本 Phase が正本となる項目）

| 項目 | 正本となる成果物 | AC |
| --- | --- | --- |
| T-1〜T-5 dry-run smoke 実走記録 | `manual-smoke-log.md` | AC-4 |
| `gh run view --log` 上の secrets / token 露出ゼロ目視確認 | `manual-smoke-log.md`（行ごとに secrets 露出有無列） | AC-4 |
| GitHub Actions UI のスクリーンショット | `screenshots/<scenario>-actions-ui-<date>.png` | AC-5 |
| branch protection の required status checks スクリーンショット | `screenshots/branch-protection-{main,dev}-required-checks-<date>.png` | AC-5 |
| 画像命名規約・機微情報マスク要件 | `screenshots/README.md` | AC-5 |

## 実走前後のフロー

### 実走前（spec_created 時点 = 現状）

1. `outputs/phase-11/manual-smoke-log.md` の T-1〜T-5 行は全て `PENDING（Phase 13 ユーザー承認後）` を記入。
2. `outputs/phase-11/screenshots/README.md` に取得計画と命名規約のみ記載。画像ファイルは存在しない。
3. `artifacts.json` の Phase 11 status は `spec_created`。

### 実走後（Phase 13 承認後の手順）

1. T-1〜T-5 の各シナリオを Phase 12 の `implementation-guide.md` Part 2「dry-run 実走手順」に従い実行。
2. 各 run について以下を実行し、`manual-smoke-log.md` の対応行を更新：
   - `gh run view <run-id> --json url -q .url` で URL 取得
   - `gh run view <run-id> --log | grep -E '(ghp_|github_pat_|CLOUDFLARE_API_TOKEN|AUTH_SECRET)' || echo OK`
3. GitHub Actions UI および branch protection 画面でスクリーンショットを撮影し、命名規約に従い `screenshots/` に保存。機微情報（メールアドレス・トークン等）は撮影前にマスク。
4. `screenshots/README.md` の表に行を追加し、撮影日時・確認内容・マスク有無を記録。
5. `artifacts.json` の Phase 11 status を `completed` に更新。
6. 表記整合最終確認（`grep -ric` で 4 用語の表記揺れゼロ）。

## 想定読者の到達経路

- **レビュアー**: `index.md` → `phase-10.md` → `outputs/phase-10/go-no-go.md` → 本 `main.md` → `manual-smoke-log.md` / `screenshots/`
- **後続評価担当（UT-GOV-002-EVAL / SEC / OBS）**: `outputs/phase-11/screenshots/` を VISUAL evidence の引用元として参照

## 参照

- `outputs/phase-4/test-matrix.md`（T-1〜T-5 マトリクス正本）
- `outputs/phase-5/runbook.md`（actionlint / yq / gh コマンド）
- `outputs/phase-9/quality-gate.md`（品質ゲート）
- `outputs/phase-10/go-no-go.md`（go/no-go 判定）
- `outputs/phase-12/implementation-guide.md`（実走手順 Part 2）

## 完了条件（spec_created 時点で満たすもの）

- [x] 本 `main.md` に実走前後フロー・責務・到達経路を記述。
- [x] `manual-smoke-log.md` テンプレートに T-1〜T-5 行を `PENDING` で配置。
- [x] `screenshots/README.md` に取得計画・命名規約・最低 7 枚要件・マスク要件を記述。
- [ ] T-1〜T-5 の実行 URL と結果記録（Phase 13 承認後実施）。
- [ ] スクリーンショット 7 枚以上の保存（Phase 13 承認後実施）。

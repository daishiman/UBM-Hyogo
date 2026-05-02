# タスク仕様書 検証レポート

> 検証日時: 2026-05-03（実装仕様書化）
> 対象: docs/30-workflows/ut-07b-fu-03-production-migration-apply-runbook
> 実装区分: **[実装仕様書]**（CONST_004 例外）

## サマリー

| 項目 | 値 |
| --- | --- |
| 総 Phase 数 | 13 |
| 状態 spec_created | 12（Phase 1〜12）|
| 状態 blocked_until_user_approval | 1（Phase 13）|
| 4 条件評価 | PASS × 4 |
| AC トレース | AC-1〜AC-20 全件 spec_created |
| CONST_004 / 005 / 007 | PASS / PASS / PASS |

## Phase 別状態

| Phase | 名称 | 状態 | 主成果物 |
| --- | --- | --- | --- |
| 1 | 要件定義（実装仕様書化） | spec_created | outputs/phase-01/main.md |
| 2 | 設計（runbook + コードアーキテクチャ） | spec_created | outputs/phase-02/main.md |
| 3 | 設計レビュー | spec_created | outputs/phase-03/main.md |
| 4 | テスト戦略 / bats / CI gate 設計 | spec_created | outputs/phase-04/main.md |
| 5 | runbook 本体 + scripts 実装手順（Part A/B） | spec_created | outputs/phase-05/main.md |
| 6 | 異常系・失敗ハンドリング | spec_created | outputs/phase-06/main.md |
| 7 | AC マトリクス（AC-1〜AC-20） | spec_created | outputs/phase-07/main.md |
| 8 | DRY 化 | spec_created | outputs/phase-08/main.md |
| 9 | 品質保証 / 4 条件評価 | spec_created | outputs/phase-09/main.md |
| 10 | 最終レビュー | spec_created | outputs/phase-10/main.md |
| 11 | evidence 仕様（NON_VISUAL） | spec_created | outputs/phase-11/main.md |
| 12 | ドキュメント更新 / 正本同期 | spec_created | outputs/phase-12/main.md |
| 13 | PR 作成 | blocked_until_user_approval | outputs/phase-13/main.md |

## 実装ファイル F1〜F9（コード実装済み / production 実走未実行）

| # | パス | 種別 | 状態 |
| --- | --- | --- | --- |
| F1 | scripts/d1/preflight.sh | 新規 | implemented-local |
| F2 | scripts/d1/postcheck.sh | 新規 | implemented-local |
| F3 | scripts/d1/evidence.sh | 新規 | implemented-local |
| F4 | scripts/d1/apply-prod.sh | 新規 | implemented-local |
| F5 | scripts/cf.sh（d1:apply-prod 追加） | 編集 | implemented-local |
| F6 | .github/workflows/d1-migration-verify.yml | 新規 | implemented-local |
| F7 | scripts/d1/__tests__/*.bats | 新規 | implemented-local |
| F8 | outputs/phase-05/main.md（runbook Part B） | 編集 | implemented-local |
| F9 | package.json（test:scripts 追加） | 編集 | implemented-local |

## AC-1〜AC-20 サマリ

詳細は `outputs/phase-07/main.md`。全 20 件 spec_created。

## 4 条件評価

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | 実装仕様書化と production 実 apply 別タスクの境界が一貫（index / phase-01 / phase-12 / phase-13）|
| 漏れなし | PASS | F1〜F9 全件、AC-1〜AC-20 全件、Phase 12 7 ファイル parity、未タスク 4 件 |
| 整合性あり | PASS | exit code 規約 / DRY_RUN / op run / scripts/cf.sh / wrangler.toml / D1 migrations 仕様と一致 |
| 依存関係整合 | PASS | 上流 UT-07B / U-FIX-CF-ACCT-01 完了済、bats が CI で先行、CI gate green が PR merge 前提、production 実 apply は FU-04 |

## CONST_005 必須項目チェック

| 項目 | 充足箇所 |
| --- | --- |
| 変更対象ファイル一覧 | `index.md` 実装する成果物表 + `artifacts.json` `implementation_artifacts` |
| 関数シグネチャ | `outputs/phase-12/implementation-guide.md` Part 2 + `outputs/phase-02/main.md` |
| 入出力・副作用 | `outputs/phase-01/main.md` outputs F1-F5 + `outputs/phase-12/implementation-guide.md` |
| テスト方針 | `outputs/phase-04/main.md`（bats 19 ケース）+ `artifacts.json` `test_strategy` |
| ローカル実行コマンド | `outputs/phase-12/implementation-guide.md` Local 実行コマンド + `artifacts.json` `local_commands` |
| DoD | `index.md` 完了判定 + `artifacts.json` `definition_of_done` + `outputs/phase-12/implementation-guide.md` DoD |
| exit code 規約 | `outputs/phase-05/main.md` Part A + `outputs/phase-06/main.md` |
| redaction grep | `outputs/phase-11/redaction-check.md` |
| mock 戦略 | `outputs/phase-04/main.md` mock wrangler 戦略 |

## 機密情報チェック

仕様書 / artifacts.json 配下に Token / Account ID / production 実 apply 結果値の記録なし（PASS）。`op://Vault/Item/Field` 参照記法のみ許容。

## GitHub Issue 方針

- `Refs #363`（CLOSED）採用
- `Closes #363` 不採用
- 再オープンしない

## Phase 12 7 ファイル parity

| File | Result |
| --- | --- |
| `outputs/phase-12/main.md` | PASS |
| `outputs/phase-12/implementation-guide.md` | PASS |
| `outputs/phase-12/system-spec-update-summary.md` | PASS |
| `outputs/phase-12/documentation-changelog.md` | PASS |
| `outputs/phase-12/unassigned-task-detection.md` | PASS |
| `outputs/phase-12/skill-feedback-report.md` | PASS |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | PASS |

## Phase 11 evidence 構成

| File | 状態 |
| --- | --- |
| `outputs/phase-11/main.md` | spec_created |
| `outputs/phase-11/manual-smoke-log.md` | spec_created（bats 期待出力） |
| `outputs/phase-11/staging-dry-run.md` | spec_created（DRY_RUN=1 期待出力） |
| `outputs/phase-11/grep-verification.md` | spec_created |
| `outputs/phase-11/redaction-check.md` | spec_created |
| `outputs/phase-11/structure-verification.md` | spec_created |
| `outputs/phase-11/manual-test-checklist.md` | spec_created |
| `outputs/phase-11/manual-test-result.md` | DOC_PASS_WITH_OPEN_RUNTIME_EVIDENCE |
| `outputs/phase-11/discovered-issues.md` | NO_BLOCKER |
| `outputs/phase-11/link-checklist.md` | PASS |
| `outputs/phase-11/screenshot-plan.json` | NON_VISUAL（screenshotsRequired=false）|

## Final Verdict

**PASS（implemented-local / production-not-executed）** — 実装仕様書と F1〜F9 のローカル実装は整備済み。Phase 13 は commit / push / PR のユーザー承認待ち。production 実 apply は UT-07B-FU-04 で `executed` に昇格する。

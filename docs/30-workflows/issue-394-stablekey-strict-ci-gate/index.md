# issue-394-stablekey-strict-ci-gate — タスク仕様書 index

[実装区分: 実装仕様書]

判定根拠: 本タスクは `.github/workflows/ci.yml` への step 追加（コード変更）と CI gate 名称の整合検証を伴う。CONST_004 デフォルトに従い実装仕様書として作成する。Issue 本文の「含まない: PR 作成 / push / branch protection 実 PUT 操作」は実装範囲を狭めるための除外であり、ワークフロー YAML 自体の変更はスコープ内。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | issue-394-stablekey-strict-ci-gate |
| ディレクトリ | docs/30-workflows/issue-394-stablekey-strict-ci-gate |
| Issue | #394 |
| Issue 状態 | CLOSED（2026-05-03 `gh issue view 394` 確認。再openせず `Refs #394` のみ使用） |
| 親タスク | 03a-stablekey-literal-lint-enforcement（completed-tasks 配下） |
| 関連 task spec | docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md |
| Wave | follow-up（03a AC-7 fully enforced 昇格） |
| 実行種別 | sequential |
| 作成日 | 2026-05-03 |
| 担当 | CI / release owner |
| 状態 | spec_created |
| ゲート状態 | warning_mode（current）→ strict_required（target after legacy cleanup 0 violations） |
| タスク種別 | implementation / NON_VISUAL |
| visualEvidence | NON_VISUAL |

## purpose

03a workflow の AC-7「stableKey リテラル直書き禁止」を、現行の `pnpm lint`（warning mode）+ 親 workflow の lint 統合だけでは保証しきれない「required CI gate での strict 0 violation」に昇格させる。`package.json` に既に存在する `lint:stablekey:strict` を、branch protection の required status context（`ci`）に紐づく lint job 内で必ず実行し、違反 0 件を blocking gate で恒久化することで、不変条件 #1 を CI レベルで静的に保護する。

## scope in / out

### scope in

- legacy cleanup 完了後の `.github/workflows/ci.yml` strict stableKey lint step 追加計画（既存 `ci` job 内への組込で required context 名を維持）
- `pnpm lint:stablekey:strict` の CI 実行コマンドと local 実行コマンドの一致検証
- branch protection の required_status_checks `contexts` が `ci` / `Validate Build` であることの正本確認（PUT は行わない）
- strict mode current blocker evidence と、0 violation 到達後の PASS evidence 取得手順（local + CI）
- 03a workflow 親 implementation-guide の AC-7 を「enforced_dry_run」→「fully enforced」へ昇格するための前提条件付き diff 計画
- aiworkflow-requirements の branch protection current facts と CI gate 名の整合更新

### scope out

- legacy stableKey literal のコード置換（前提タスク。現時点で strict 148 violations のため本タスクでは実施しない）
- branch protection の実 PUT 操作（required_status_checks は既に `ci` を含むため変更不要）
- `lint-stablekey-literal.mjs` 本体のロジック改修
- 03b 側 lint 展開
- 新規 GitHub Actions workflow の追加（既存 `ci` job への step 追加に閉じる）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | legacy stableKey literal cleanup | strict mode 0 violation が前提条件（CONST_007 例外: cleanup 完了が技術前提のため別タスク） |
| 上流 | 03a-stablekey-literal-lint-enforcement | AC-7 enforced_dry_run 状態を引き継ぎ fully enforced へ昇格 |
| 上流 | `scripts/lint-stablekey-literal.mjs` | strict mode 実装（既存） |
| 上流 | `package.json#scripts.lint:stablekey:strict` | strict 実行コマンド（既存） |
| external gate | `.github/workflows/ci.yml` の `ci` job | required status context |
| 関連 | aiworkflow-requirements branch protection current facts | required context 名 drift 防止 |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/task-03a-stablekey-strict-ci-gate-001.md | 元 unassigned-task spec（正本ソース） |
| 必須 | docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/index.md | 親 workflow / AC-7 昇格対象 |
| 必須 | docs/30-workflows/completed-tasks/03a-stablekey-literal-lint-enforcement/outputs/phase-12/implementation-guide.md | AC-7 状態と禁止事項 |
| 必須 | scripts/lint-stablekey-literal.mjs | strict mode 実装 |
| 必須 | package.json | `lint:stablekey:strict` script |
| 必須 | .github/workflows/ci.yml | strict step 追加対象 |
| 必須 | docs/00-getting-started-manual/specs/00-overview.md | 不変条件 #1 |
| 必須 | docs/00-getting-started-manual/specs/01-api-schema.md | stableKey 仕様 |
| 参考 | .claude/skills/aiworkflow-requirements/references/branch-protection-current-facts.md | required context 正本 |

## AC（Acceptance Criteria）

- AC-1: legacy cleanup 完了後に限り、`.github/workflows/ci.yml` の `ci` job に `pnpm lint:stablekey:strict` を実行する step が追加され、`continue-on-error` を付けない blocking step として配置されている。
- AC-2: branch protection の required_status_checks `contexts` 配列に `ci` が含まれていることが Phase 9 で実 API レスポンスにより確認されている（PUT 変更は行わない）。
- AC-3: 現行リポジトリで `pnpm lint:stablekey:strict` が exit 1 / 148 violations である blocker evidence が保存され、legacy cleanup 完了後に exit 0 / 0 violation evidence を `outputs/phase-11/evidence/planned-after-cleanup/strict-pass.txt` として差し替える（current は `outputs/phase-11/evidence/current-blocker/` に物理分離保存）手順が定義されている。
- AC-4: 故意違反 fixture（local dry-run）で `pnpm lint:stablekey:strict` が exit code 非 0 / violation を報告することを確認する手順が Phase 6 で定義されている。現サイクルでは legacy cleanup 未完のため実走せず、cleanup 後の実装サイクルで `outputs/phase-11/evidence/planned-after-cleanup/strict-violation-fail.txt` として保存する。
- AC-5: ci.yml の lint command と local の `pnpm lint:stablekey:strict` が完全一致することが Phase 7 で grep / diff により検証される。
- AC-6: 親 workflow（03a）の implementation-guide.md / index.md の AC-7 ステータスを「enforced_dry_run」→「fully enforced」へ更新する diff 計画は、strict 0 violations を昇格条件として Phase 12 で記述され、aiworkflow-requirements の branch protection current facts に required context 名 drift がないことが同 Phase で確認されている。
- AC-7: 03a-stablekey-strict-ci-gate-001 unassigned-task spec（completed-tasks 配下）の完了条件 3 項が本 workflow Phase 11/12 で完全トレースされている。

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（既存 ci job step 追加 vs 新 job 追加）と AC-1〜7 確定、artifacts.json metadata 確定 |
| 2 | 設計 | phase-02.md | ci.yml diff 設計、step 配置位置、依存条件、required context 維持戦略 |
| 3 | 設計レビュー | phase-03.md | alt 3 案（既存 step 追加 / 新 lint job / matrix 展開）を PASS / MINOR / MAJOR で判定 |
| 4 | テスト戦略 | phase-04.md | local PASS / 違反 fixture FAIL / CI command 同等性のテスト matrix |
| 5 | 実装ランブック | phase-05.md | ci.yml 編集差分、コミット粒度、ローカル検証手順 |
| 6 | 異常系検証 | phase-06.md | 故意違反 fixture 設計、required context drift、bypass 試行 |
| 7 | 統合検証 | phase-07.md | local / CI command 同一性、親 workflow との整合 |
| 8 | パフォーマンス・運用 | phase-08.md | strict 実行時間（local / CI）、開発者 DX、developer override |
| 9 | セキュリティ・品質ゲート | phase-09.md | branch protection required context 正本確認、suppression 監査 |
| 10 | リリース準備 | phase-10.md | 親 workflow AC-7 昇格 merge 順序、rollback 戦略 |
| 11 | 実測 evidence | phase-11.md | NON_VISUAL: strict-pass / strict-violation-fail / ci-command-trace を保存 |
| 12 | ドキュメント・未タスク・スキルフィードバック | phase-12.md | implementation-guide / 03a 親同期 / 未タスク / skill feedback / compliance |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/ci-yml-diff-design.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/test-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-06/main.md
outputs/phase-06/violation-fixture-spec.md
outputs/phase-07/main.md
outputs/phase-07/integration-check.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/manual-smoke-log.md
outputs/phase-11/evidence/current-blocker/strict-current-blocker.txt
outputs/phase-11/evidence/current-blocker/ci-command-trace.md
outputs/phase-11/evidence/current-blocker/branch-protection-main.json
outputs/phase-11/evidence/current-blocker/branch-protection-dev.json
outputs/phase-11/evidence/planned-after-cleanup/strict-pass.txt（cleanup 完了後に実値で差し替え）
outputs/phase-11/evidence/planned-after-cleanup/strict-violation-fail.txt（cleanup 完了後の故意違反 fixture 実行時に実値で差し替え）
outputs/phase-12/main.md
outputs/phase-12/implementation-guide.md
outputs/phase-12/system-spec-update-summary.md
outputs/phase-12/documentation-changelog.md
outputs/phase-12/unassigned-task-detection.md
outputs/phase-12/skill-feedback-report.md
outputs/phase-12/phase12-task-spec-compliance-check.md
outputs/phase-13/main.md
outputs/phase-13/local-check-result.md
outputs/phase-13/change-summary.md
outputs/phase-13/pr-template.md
outputs/phase-13/pr-info.md
outputs/phase-13/pr-creation-result.md
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| CI | GitHub Actions `ci` job | `.github/workflows/ci.yml` | 既存 step 列に strict step を追加。branch protection PUT: 実施しない（read-only 確認のみ、AC-2 / scope out 整合） |
| Branch protection | required_status_checks `contexts`（`ci` / `Validate Build`） | GitHub API（read-only） | branch protection PUT: 実施しない（read-only 確認のみ、AC-2 / scope out 整合） |
| 静的検査 | `node scripts/lint-stablekey-literal.mjs --strict` | repo root | 既存実装 |
| Secrets | （新規導入なし） | — | public artefact のみ |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（stableKey は正本モジュール経由のみ）
- **#2** consent キーは `publicConsent` / `rulesConsent` 統一（リテラル直書き禁止の射程に含まれうる）

## completion definition

- Phase 1〜10 が completed、Phase 11 で current blocker evidence（`evidence/current-blocker/strict-current-blocker.txt` / `evidence/current-blocker/ci-command-trace.md` / `evidence/current-blocker/branch-protection-main.json` / `evidence/current-blocker/branch-protection-dev.json`）または cleanup 後 evidence（`evidence/planned-after-cleanup/strict-pass.txt` / `evidence/planned-after-cleanup/strict-violation-fail.txt`）が保存済み
- AC-1〜7 が Phase 7 で完全トレースされ、strict 0 violations 未達の場合は blocking gate 実装を実行しない
- 03a 親 workflow の AC-7 を「fully enforced」に昇格する Phase 12 documentation diff が、strict 0 violations を前提条件として確定
- aiworkflow-requirements の branch protection current facts が required context 名で drift なし
- Phase 13 で user 承認後に PR 作成完了

## lifecycle states

| state | 意味 | completed 判定 |
| --- | --- | --- |
| spec_created | 13 phase 仕様書と outputs skeleton 整備済み、ci.yml 未編集 | 不可 |
| blocked_by_legacy_cleanup | strict mode が現行 148 violations で fail しており、ci.yml strict gate 追加は CI 破壊になる | 不可 |
| ready | legacy cleanup 完了 / strict 0 violation 確認済み | 不可 |
| enforced | ci.yml strict step merged、required gate で blocking | 不可 |
| completed | enforced + Phase 12 親 sync + Phase 13 user approval gate 完了 | 可 |

## 実行モード

sequential。legacy cleanup の完了が技術前提（0 violation 必要）であり、現行 `pnpm lint:stablekey:strict` は 148 violations で exit 1 のため、本仕様書の現サイクルでは ci.yml strict gate 追加を実行しない。cleanup 完了後の同一サイクルで ci.yml 編集 + evidence + 親同期 + PR 準備まで完了する。

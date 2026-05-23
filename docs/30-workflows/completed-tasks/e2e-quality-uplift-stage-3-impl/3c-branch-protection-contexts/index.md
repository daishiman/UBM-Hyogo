# 3c — Branch Protection contexts 更新

| 項目 | 値 |
|------|----|
| workflow id | `e2e-quality-uplift-stage-3-impl-3c` |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-3/` |
| base branch | `dev` |
| feature branch | `docs/e2e-quality-uplift-stage-3-impl-task-specs` |
| 起票日 | 2026-05-09 |
| CONST_007 | single cycle |
| 適用 tier | standard（lines >= 70%） |
| 正本 | 本ディレクトリ |
| 実装区分 | **実装仕様書** |

## 実装区分の判定根拠

本サブタスク 3c は **リポジトリ内ファイル変更を伴わない**が、`gh api -X PUT repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` による **GitHub branch protection（production governance）状態の変更** を伴う。

CONST_004 における「ドキュメントのみ仕様書」は「リポジトリ内ファイル変更がなく、外部システム状態変更も伴わない」場合に適用される。本サブタスクは:

- リモート GitHub 側の branch protection 設定（`required_status_checks.contexts` 配列）を実 API で書換える
- 設定 drift は CI gate 通過要件・solo dev policy（`required_pull_request_reviews=null` 等）に直接影響する
- evidence ファイル（pre/post snapshot JSON）は実行時に生成・コミットされる

ため、**環境変更を伴う実装仕様書**として扱う。

## 機械検証メタ情報

| key | value |
| --- | --- |
| タスク種別 | implementation |
| visualEvidence | NON_VISUAL |
| coverageTier | standard |
| workflow_state | spec_created |
| evidence_state | runtime_pending |

---

## 目的

親 workflow `e2e-quality-uplift-stage-3` のサブタスク 3a（Lighthouse CI 導入）/ 3b（`e2e-tests.yml` hard gate 化）が `dev` にマージされ、新規 workflow が 1 度成功 run を返して GitHub 側に check-run context が登録された後、`dev` / `main` の branch protection の `required_status_checks.contexts` を **5 件**（`ci` / `Validate Build` / `coverage-gate` / `lighthouse-ci` / `e2e-tests-coverage-gate`）に拡張する。同時に solo dev policy（`required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins`）を drift させない。

---

## スコープ

| 区分 | 内容 |
|------|------|
| in-scope | `dev` / `main` 両方の branch protection `required_status_checks.contexts` 更新 / pre/post snapshot 取得 / drift 検証 / evidence 一式コミット |
| out-of-scope | 3a / 3b の実装内容（別サブタスク仕様書を参照） / merge queue 導入 / レビュアー必須化 / ruleset 移行 |

---

## 受入基準

| # | 受入基準 | 検証方法 |
|---|----------|----------|
| AC-05 | `dev` / `main` branch protection の `required_status_checks.contexts` に `lighthouse-ci` / `e2e-tests-coverage-gate` が追加される | `gh api repos/daishiman/UBM-Hyogo/branches/{dev,main}/protection` で contexts 配列を確認 |
| AC-06 | `required_pull_request_reviews=null` / `lock_branch=false` / `enforce_admins=true` が drift していない | 同上 API で各フィールドが期待値であること |

> 親 index.md の AC-01..AC-04 は 3a / 3b 側の責務であり、本仕様書では検証しない。

---

## 不変条件

1. **solo dev policy**: `required_pull_request_reviews=null` を保持する。`{}` 等への drift は禁止。
2. **lock 不変**: `lock_branch=false` を維持。
3. **管理者強制**: `enforce_admins=true` を維持（CLAUDE.md governance）。
4. **strict=false**: `required_status_checks.strict=false` を維持（merge queue 未導入）。
5. **順序厳守**: 3a PR-A merge → 3a workflow 1 run 成功 → 3b PR-B merge → 3b workflow 1 run 成功 → context 登録確認 → 3c `gh api PUT`。3c を先行させると PR の必須 check が **永久 pending** となる（BLK-03）。
6. **適用対象は `dev` / `main` の両方**: Stage 3 完了時の最終形は両ブランチで 5 contexts に揃える。
7. **`required_conversation_resolution=true`** を維持。
8. CLAUDE.md `## Governance` セクションと整合し、`require_code_owner_reviews` は有効化しない。
9. 評価対象 contexts は **完全一致 5 件**（順序不問・`sort -u` で一致）。
10. 実 API 呼び出し（`gh api -X PUT`）は **ユーザー明示承認後** にのみ実行する（read-only `GET` は事前 evidence として取得可能）。

---

## 適用後 contexts（最終形）

```json
["ci", "Validate Build", "coverage-gate", "lighthouse-ci", "e2e-tests-coverage-gate"]
```

| context | 出処 | 状態 |
|---------|------|------|
| `ci` | 既存（Stage 0..2） | 維持 |
| `Validate Build` | 既存 | 維持 |
| `coverage-gate` | 既存（Stage 2） | 維持 |
| `lighthouse-ci` | 3a で新設 | 追加 |
| `e2e-tests-coverage-gate` | 3b で新設 | 追加 |

---

## サブタスク Phase 1-13 状態表

| Phase | 名称 | 状態 | 出力 |
|-------|------|------|------|
| 1 | 要件定義 | spec_created | `phase-1.md` |
| 2 | 設計 | spec_created | `phase-2.md` |
| 3 | 設計レビュー | spec_created | `phase-3.md` |
| 4 | テスト作成 | spec_created | `phase-4.md` |
| 5 | 実装 | spec_created | `phase-5.md` |
| 6 | テスト拡充 | spec_created | `phase-6.md` |
| 7 | カバレッジ確認 | spec_created | `phase-7.md` |
| 8 | リファクタリング | spec_created | `phase-8.md` |
| 9 | 品質保証 | spec_created | `phase-9.md` |
| 10 | 最終レビュー | spec_created | `phase-10.md` |
| 11 | 手動テスト / Evidence | spec_created | `phase-11.md` |
| 12 | ドキュメント更新 | spec_created | `phase-12.md` |
| 13 | PR 作成 | spec_created | `phase-13.md` |

---

## 依存関係

| 種別 | 内容 | 状態 |
|------|------|------|
| depends-on | 3a PR-A が `dev` に merge 済み + `lighthouse-ci` が check-run として登録済み | 実行時確認 |
| depends-on | 3b PR-B が `dev` に merge 済み + `e2e-tests-coverage-gate` が check-run として登録済み | 実行時確認 |
| depends-on | `dev` / `main` 現行 contexts: `ci` / `Validate Build` / `coverage-gate`（drift なし） | 実行時確認 |
| blocks | 親 Phase 13 統合 PR の merge（3c evidence 揃いが前提） | — |

---

## 関連サブタスク

| ID | 名称 | パス |
|----|------|------|
| 3a | Lighthouse CI 導入 | `../3a-lighthouse-ci/` |
| 3b | `e2e-tests.yml` hard gate 化 | `../3b-e2e-tests-hard-gate/` |
| 3c | Branch Protection contexts 更新 | 本ディレクトリ |

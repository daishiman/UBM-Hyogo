# 08a-parallel-api-contract-repository-and-authorization-tests — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | api-contract-repository-and-authorization-tests |
| ディレクトリ | doc/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests |
| Wave | 8 |
| 実行種別 | parallel |
| 作成日 | 2026-04-26 |
| 担当 | qa-tests |
| 状態 | pending |
| タスク種別 | spec_created |

## purpose

`apps/api` の **全 endpoint** に対する contract test（zod schema parse）、**全 repository** の unit test（fixture ベース）、**public / member / admin の認可境界 test**（401 / 403 / 200/201 の3軸）を網羅し、不変条件 #1 / #2 / #5 / #6 / #7 / #11 を test として恒久固定する。`responseId` と `memberId` の混同は **type test** で防ぐ（コンパイル時 fail）。

## scope in / out

### scope in

- 全 public endpoint (`/public/*` 4 種) の contract test (response zod parse)
- 全 member endpoint (`/me/*`) の contract test
- 全 admin endpoint (`/admin/*` 全 9 系統) の contract test
- repository unit test (members / responses / meetings / attendance / tags / queue / schema / audit / sync)
- 認可境界 test: anonymous / member / admin × 各 endpoint で 401 / 403 / 200 を断定
- type test: `responseId` ≠ `memberId` をブランド型違反でコンパイル fail させる
- 不変条件 test: #1 (schema 固定しすぎない), #2 (responseEmail system field), #5 (3層分離), #6 (apps/web → D1 禁止), #11 (profile 直接編集なし)
- vitest 設定 (`apps/api/vitest.config.ts`) と CI workflow placeholder

### scope out

- Playwright E2E（08b の責務）
- visual regression
- D1 migration test（01a / 02b で完了している前提）
- Forms API mock 実体（msw / local fixture を採用するが本 task は spec のみ）

## dependencies

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | 06a-parallel-public-landing-directory-and-registration-pages | public endpoint の view model を確定 |
| 上流 | 06b-parallel-member-login-and-profile-pages | member endpoint の view model を確定 |
| 上流 | 06c-parallel-admin-dashboard-members-tags-schema-meetings-pages | admin endpoint の view model を確定 |
| 上流 | 07a-parallel-tag-assignment-queue-resolve-workflow | tag queue resolve endpoint 仕様 |
| 上流 | 07b-parallel-schema-diff-alias-assignment-workflow | schema alias endpoint 仕様 |
| 上流 | 07c-parallel-meeting-attendance-and-admin-audit-log-workflow | attendance / audit endpoint 仕様 |
| 下流 | 09a-parallel-staging-deploy-smoke-and-forms-sync-validation | test pass を staging deploy の前提条件 |
| 下流 | 09b-parallel-cron-triggers-monitoring-and-release-runbook | CI workflow を release runbook に組込 |
| 並列 | 08b | 同 wave で互いに独立（contract vs E2E） |

## refs

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | 31 項目 schema |
| 必須 | doc/00-getting-started-manual/specs/03-data-fetching.md | sync 系仕様 |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | 型 4 層 / brand 型 |
| 必須 | doc/00-getting-started-manual/specs/05-pages.md | endpoint × page 対応 |
| 必須 | doc/00-getting-started-manual/specs/11-admin-management.md | admin 認可境界 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 参考 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | CI 運用 |

## AC（Acceptance Criteria）

- AC-1: `apps/api` 全 endpoint（public 4 + member 4 + admin 約 20 + auth 1 = 約 30 endpoint）の **contract test 100% green**（zod parse 成功）
- AC-2: 全 repository（02a/b/c で定義された約 16 種）の **unit test pass**、各 CRUD で fixture を 5 件以上使った test が存在
- AC-3: 認可境界 test で `(anonymous, member, admin)` × `(public, member, admin)` endpoint × 9 マトリクスを **必ず 401 / 403 / 200 (or 201/204)** で断定
- AC-4: `responseId` と `memberId` の混同を **type test** で防止（`expectError<...>()` 形式 1 ケース以上）
- AC-5: 不変条件 test として、#1 (schema 固定しすぎ防止 — extraFields 経路あり)、#2 (responseEmail system field)、#5 (3層分離)、#6 (apps/web から D1 import 禁止 lint)、#11 (profile 編集 endpoint 不在 = 404) を test として記述
- AC-6: vitest run + coverage で **statements ≥ 85%** / **branches ≥ 80%**
- AC-7: CI workflow placeholder (`.github/workflows/api-tests.yml` 提案) を outputs に配置、`pnpm test --filter @ubm/api` を 1 step で実行できる

## 13 phases

| Phase | 名称 | ファイル | 概要 |
| --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | 真の論点（contract / unit / authz / type test の 4 軸を 1 task で扱う妥当性）と AC-1〜7 確定 |
| 2 | 設計 | phase-02.md | Mermaid（test 種別と対象）、test ディレクトリ構造、env / dependency matrix、msw vs local fixture 方針 |
| 3 | 設計レビュー | phase-03.md | alternative 3 案（msw / local fixture / D1 in-memory）、PASS-MINOR-MAJOR |
| 4 | テスト戦略 | phase-04.md | 4 種 verify suite の test signature と coverage 目標 |
| 5 | 実装ランブック | phase-05.md | runbook + 擬似コード（contract / repo / authz / type test） |
| 6 | 異常系検証 | phase-06.md | failure cases（401 / 403 / 404 / 422 / 5xx / sync 失敗 / consent 撤回 / 削除済み） |
| 7 | AC マトリクス | phase-07.md | AC × verify × 実装 × 不変条件のトレース |
| 8 | DRY 化 | phase-08.md | test fixture / helper / brand 型 import の Before / After |
| 9 | 品質保証 | phase-09.md | free-tier (CI 分) / secret hygiene (msw secret なし) / a11y (test 範囲外だが UI snapshot は 08b へ) |
| 10 | 最終レビュー | phase-10.md | GO / NO-GO（上流 06a/b/c, 07a/b/c の AC 達成チェック） |
| 11 | 手動 smoke | phase-11.md | `pnpm test --filter @ubm/api` 出力 evidence + coverage report |
| 12 | ドキュメント更新 | phase-12.md | implementation-guide / system-spec-update-summary / changelog / unassigned / skill-feedback / compliance-check |
| 13 | PR 作成 | phase-13.md | approval gate / local-check-result / change-summary / PR template |

## outputs

```
outputs/phase-01/main.md
outputs/phase-02/main.md
outputs/phase-02/test-architecture.mmd
outputs/phase-02/test-directory-layout.md
outputs/phase-03/main.md
outputs/phase-04/main.md
outputs/phase-04/verify-suite-matrix.md
outputs/phase-05/main.md
outputs/phase-05/runbook.md
outputs/phase-05/test-signatures.md
outputs/phase-06/main.md
outputs/phase-07/main.md
outputs/phase-07/ac-matrix.md
outputs/phase-08/main.md
outputs/phase-09/main.md
outputs/phase-10/main.md
outputs/phase-11/main.md
outputs/phase-11/evidence/
outputs/phase-11/evidence/coverage-report.txt
outputs/phase-11/evidence/test-run.log
outputs/phase-11/evidence/ci-workflow.yml
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
```

## services / secrets

| 区分 | 値 | 配置 | 備考 |
| --- | --- | --- | --- |
| Vitest | runner | apps/api/vitest.config.ts | local sqlite + msw |
| msw (Mock Service Worker) | Forms API mock | apps/api/test/mocks/ | optional、local fixture と二択 |
| GitHub Actions | api-tests workflow | .github/workflows/api-tests.yml | placeholder のみ |
| 環境変数 | `TEST_D1_PATH` | vitest.config.ts | local sqlite path |
| Secrets | （新規導入なし） | — | msw / fixture でモック |

## invariants touched

- **#1** 実フォーム schema をコードに固定しすぎない（contract test で extraFields 経路を verify）
- **#2** consent キーは `publicConsent` `rulesConsent` 2 種だけ（zod schema enum で固定）
- **#5** 公開 / 会員 / 管理 3 層分離（authz test で 9 マトリクス）
- **#6** apps/web から D1 直接アクセス禁止（eslint rule + import test）
- **#7** 削除は論理削除（deleted member contract test）
- **#11** 管理者は他人本文を直接編集しない（profile 編集 endpoint 404 を test）

## completion definition

- 13 Phase の status が artifacts.json で全て completed
- AC-1〜7 が Phase 7 マトリクスで完全トレース
- 4 条件すべて PASS
- 不変条件 #1 / #2 / #5 / #6 / #7 / #11 が test として記述済み
- Phase 13 で user 承認後に PR 作成完了

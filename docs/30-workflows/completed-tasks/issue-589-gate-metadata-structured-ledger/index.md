# タスク仕様書: Issue #589 — Gate metadata structured ledger（schema + validator + Phase 12 統合）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | issue-589-gate-metadata-structured-ledger |
| タスクコード | U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-04 |
| 親 Issue | https://github.com/daishiman/UBM-Hyogo/issues/589 (CLOSED — そのまま据え置き / 再オープン操作は本仕様書では行わない) |
| 起票元 source | `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md` |
| 親タスク | `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D`（issue #549） |
| 親ワークフロー | `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/` |
| 配置先 | `docs/30-workflows/issue-589-gate-metadata-structured-ledger/` |
| 作成日 | 2026-05-10 |
| artifacts | `artifacts.json` + `outputs/artifacts.json` mirror |
| 状態 | implemented_local_runtime_pending |
| workflow_state | implemented_local_runtime_pending |
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| 実装区分 | **[実装区分: 実装仕様書]** — root cause: 自由文の `gateConditions[]` を機械検証可能な構造化 ledger（`metadata.gates[]`）に置き換えるには、(a) zod schema と TypeScript 型の追加、(b) CLI validator の新規実装、(c) `package.json` script の追加、(d) `.github/workflows/` への CI gate 追加、(e) 既存 `artifacts.json`（Issue #549）の backfill、(f) Phase 12 compliance check への validator 結線が必須。これらは docs-only では成立しない（CI で `pnpm gate-metadata:validate` を恒久実行できないため）。Issue #589 は CLOSED だが「親 #549 で導入された自由文 gate を構造化する follow-up」として実装スコープを保持しており、後続実装サイクルでコード変更を伴う。 |
| 親 Issue 状態維持 | **CLOSED のまま据え置き**。本仕様書での再オープン / クローズ操作は行わない。Issue は親 #549 完了同期で close 済みであり、structured ledger 実装はこの仕様書 + Phase 13 PR で完結させる。再 open が必要な場合はユーザー判断のみで実施。 |
| 優先度 | 低（`priority:low`） |
| 規模 | 小規模（`scale:small`） |
| ラベル | `priority:low`, `scale:small`, `type:improvement` |
| 想定 PR 数 | 1（schema + validator + CI gate + #549 backfill + Phase 12 reference 更新 + SSOT 同期） |
| coverage AC | `packages/shared/src/gate-metadata/__tests__/schema.test.ts` の focused vitest が green、Statements >=80% / Branches >=80% / Functions >=80% / Lines >=80%、`scripts/gate-metadata/validate.ts` の CLI 動作が `node --import tsx scripts/gate-metadata/validate.ts` で exit 0、`bash scripts/coverage-guard.sh` exit 0、`.github/workflows/verify-gate-metadata.yml` は actionlint clean |

## GitHub label / tag（Claude Code / Codex 共有用）

| 用途 | 値 |
| --- | --- |
| Issue 参照 | `#589`（`Refs: #589` を PR 本文に必ず含める。親 #549 も `Refs: #549` で併記） |
| GitHub Issue labels（継承） | `priority:low`, `type:improvement` |
| PR に付与する labels | `priority:low`, `scale:small`, `type:improvement` |
| `gh pr create` 引数 | `--label priority:low --label scale:small --label type:improvement --base dev` |
| ブランチ名 | `feat/issue-589-gate-metadata-structured-ledger` |
| PR タイトル | `feat(governance): issue-589 gate metadata structured ledger schema + validator` |
| 親タスク参照 | `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D-FU-04` / 親 `U-FIX-CF-ACCT-01-DERIV-04-FU-03-D` |
| PR base | `dev`（CLAUDE.md「既定の PR base ブランチは `dev`」に整合） |

## 目的

親タスク Issue #549 で `artifacts.json.metadata.gateConditions[]` として自由文配列で記録された 4 つの gate（Gate-A〜D）は、人間がレビュー時に読むことはできても、「いつ・誰の承認で・どの evidence を根拠に通過したか」を機械的に検証できない。結果として Phase 12 compliance check で gate 通過状態を自動判定できず、production switch 前の最終確認が手動・属人的なレビューに依存している。

本タスクでは以下 4 点を達成し、HIGH severity な runtime mutation（cf-acct production switch 系・cron schedule 投入・secrets ローテーション等）の前段で「gate-by-gate evidence 確認」を CI 上で恒久化する:

1. **構造化 schema 導入**: `packages/shared/src/gate-metadata/schema.ts` に zod schema を新設し、`gate_id` / `status` / `passed_at` / `evidence_path` / `approver` / 任意 `notes` を必須/任意属性として固定する。`apps/web` の `getEnv()` で確立した zod 採用パターンに揃える。
2. **CLI validator 実装**: `scripts/gate-metadata/validate.ts` で `docs/30-workflows/**/artifacts.json` を再帰走査し、`metadata.gates[]` が schema を満たすこと、および `status === "passed"` の場合に `evidence_path` 実体が repo 内に存在することを検証する。exit code は 0/1 で CI consume 可能。
3. **Phase 12 compliance 結線**: `.github/workflows/verify-gate-metadata.yml`（新規）を `**/artifacts.json` 触る PR で発火させ、`pnpm gate-metadata:validate` を実行する。branch protection の required status check 化は user approval 後の別操作とし、Phase 12 compliance template（`.claude/skills/task-specification-creator/references/phase12-checklist-definition.md`）にも「gate-metadata validator green」項目を追記。
4. **Issue #549 backfill**: 既存 `gateConditions[]` 4 件を `gates[]` 構造へ変換し、`outputs/artifacts.json` mirror も同時更新する。状態は親 Issue の現実と整合させ（Phase 12 outputs 7 種揃いを根拠に Gate-A は `passed`、Gate-B/C は production switch 前のため `pending`、Gate-D は Gate-A passed により `waived`）。

`gateConditions` を「ただ削除して structured 化」するのではなく、後方互換のため `gateConditions_legacy` にリネームして `gates[]` 構造と並存させ、validator は `gates[]` のみを参照する設計とする。

## スコープ

### 含む

- `packages/shared/src/gate-metadata/schema.ts` 新規実装（zod schema + TypeScript 型 + 列挙型）
- `packages/shared/src/gate-metadata/index.ts` 新規（barrel export）
- `packages/shared/src/gate-metadata/__tests__/schema.test.ts` 新規（schema parse 成功/失敗ケース）
- `packages/shared/src/index.ts` 編集（`gate-metadata` export 追加）
- `packages/shared/package.json` 編集（`"./gate-metadata": "./src/gate-metadata/index.ts"` export 追加）
- `scripts/gate-metadata/validate.ts` 新規（CLI: `docs/30-workflows/**/artifacts.json` 再帰走査 + schema 検証 + evidence_path 実体確認）
- `scripts/gate-metadata/__tests__/walk.test.ts` 新規（fixture 走査の単体テスト）
- `package.json` 編集（root の `scripts.gate-metadata:validate` 追加）
- `.github/workflows/verify-gate-metadata.yml` 新規（PR で `**/artifacts.json` および `packages/shared/src/gate-metadata/**` 変更時に発火、`pnpm gate-metadata:validate` を実行。required status check 化は user approval 後）
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` 編集（`gates[]` 構造を追加 / `gateConditions[]` は `gateConditions_legacy` にリネーム）
- `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json` 編集（同 mirror）
- `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` 編集（`gate-metadata validator` 必須項目追記）
- `.claude/skills/aiworkflow-requirements/references/` 配下に gate-metadata schema 仕様の参照を追加（schema 公開ファイルパスと validator 起動コマンドを記載）
- `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` 編集（`gate-metadata` / `structured ledger` / `verify-gate-metadata` 等の keyword 追加）

### 含まない

- 親 #549 以外の歴史的 workflow への structured `gates[]` 一括 backfill（schema 導入時点では `gates[]` がない artifacts は validator が WARN/skip し、新規ワークフローは day-1 から構造化される運用とする）
- production switch 実行そのもの（親 #549 / user-gated runtime operation の責務）
- `gateConditions` 自由文を全 historical artifacts から削除する操作（本 PR 内の対象は Issue #549 のみ）
- D1 / R2 等への gate 履歴永続化 UI（admin 画面）

> **CONST_007 整合**: 上記「含まない」4 件は、(a) 歴史的 artifacts は問題が顕在化していない、(b) production switch 実行は親 Issue 別スコープ、(c) historical 自由文削除は破壊的変更で別 PR review が必要、(d) admin UI は本タスク目的（gate 通過の機械検証）に不要、という根拠で対象外。「分量が多い」「念のため切り出す」を理由に分割していない。

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | Issue #549（cf audit ml production switch） | `gateConditions[]` 自由文の正本ソース。本タスクの backfill 対象 |
| 上流 | `apps/web/src/lib/env.ts` の zod 採用パターン | schema 設計の参照モデル |
| 上流 | `packages/shared` の既存 export 構造 | barrel export 配置先の前提 |
| 上流 | `.github/workflows/verify-indexes.yml` 等の既存 workflow | actionlint / pnpm install パターンの参照モデル |
| 下流 | `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` | Phase 12 compliance check への gate-metadata 結線 |
| 下流 | `.claude/skills/aiworkflow-requirements/references/` SSOT | structured ledger の参照経路 |
| 下流 | 後続全 implementation 仕様書 | 新規 `artifacts.json` は day-1 から `gates[]` を生成する |

## 着手前提

| 条件 | 確認コマンド |
| --- | --- |
| `gh` CLI が認証済 | `gh auth status` |
| Node 24 / pnpm 10 が使用可能 | `mise exec -- node -v && mise exec -- pnpm -v` |
| Issue #549 spec が存在 | `test -f docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` |
| `actionlint` / `shellcheck` 利用可能 | `which actionlint shellcheck` |
| zod が `packages/shared` 依存に含まれる | `grep '"zod"' packages/shared/package.json` |
| 既存 schema / validator の不在を確認 | `rg 'metadata.gates' docs/ packages/ scripts/` で hit が無い |

## 想定アーキテクチャ概要（変更対象モジュール一覧）

| パス | 種別 | 役割 |
| --- | --- | --- |
| `packages/shared/src/gate-metadata/schema.ts` | 新規 | zod schema: `GateStatusEnum` / `GateEntrySchema` / `GatesArraySchema` / `inferGateEntry`。`gate_id` 正規表現 / `passed_at` ISO8601 / `status === passed` 時 `passed_at` と `evidence_path` 必須の refine |
| `packages/shared/src/gate-metadata/index.ts` | 新規 | barrel export |
| `packages/shared/src/gate-metadata/__tests__/schema.test.ts` | 新規 | parse success / failure / refine（status×passed_at 整合・evidence_path 文字列）の網羅 |
| `packages/shared/src/index.ts` | 編集 | `export * from './gate-metadata'` 追加 |
| `packages/shared/package.json` | 編集 | subpath export `./gate-metadata` を追加し、`@ubm-hyogo/shared/gate-metadata` import を解決可能にする |
| `scripts/gate-metadata/validate.ts` | 新規 | CLI entry。`docs/30-workflows/**/artifacts.json` を Node `fs.readdir` で再帰走査 → schema parse → 全 status の path safety → `status===passed` の `evidence_path` 実体確認 → 失敗集約 → exit 0/1 |
| `scripts/gate-metadata/__tests__/walk.test.ts` | 新規 | fixture artifacts.json を temp dir に作って walk → 期待結果 |
| `package.json` | 編集 | `"gate-metadata:validate": "node --import tsx scripts/gate-metadata/validate.ts"` 追加 |
| `.github/workflows/verify-gate-metadata.yml` | 新規 | trigger: PR `paths: ['**/artifacts.json', 'packages/shared/src/gate-metadata/**', 'scripts/gate-metadata/**']`。job: pnpm install + `pnpm gate-metadata:validate` |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/artifacts.json` | 編集 | `metadata.gates[]` 4 件追加（Gate-A=passed / Gate-B/C=pending / Gate-D=waived）、`gateConditions[]` を `gateConditions_legacy` にリネーム |
| `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/outputs/artifacts.json` | 編集 | 同 mirror |
| `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` | 編集 | gate-metadata validator green を Phase 12 必須項目化 |
| `.claude/skills/aiworkflow-requirements/references/gate-metadata.md` | 新規 | structured ledger 仕様の SSOT |
| `.claude/skills/aiworkflow-requirements/indexes/{keywords.json,quick-reference.md,resource-map.md,topic-map.md}` | 編集 | keyword / 参照 entry 追加 |

## Phase 構成（13 Phase）

| Phase | 目的 | 状態 |
| --- | --- | --- |
| [1](phase-01.md) | 要件定義 / P50 既存実装不在チェック / acceptance criteria 確定 / GO 判定 | completed |
| [2](phase-02.md) | アーキテクチャ設計 / schema フィールド表 / validator architecture / CI workflow 設計 / dependency matrix（owner/co-owner） | completed |
| [3](phase-03.md) | 詳細レビュー / PASS/MINOR/MAJOR 判定 / MINOR 追跡 / Phase 4 GO 判定 | completed |
| [4](phase-04.md) | テストファースト / vitest テストケース列挙 / fixture 設計 | completed |
| [5](phase-05.md) | コア実装（schema.ts / validate.ts / barrel export / package.json script） | completed |
| [6](phase-06.md) | ローカル検証 / typecheck / lint / vitest / coverage-guard / Issue #549 backfill | completed |
| [7](phase-07.md) | コードレビュー（security: path traversal / correctness / observability） | completed |
| [8](phase-08.md) | CI 統合（`verify-gate-metadata.yml` 新規 + actionlint） | completed |
| [9](phase-09.md) | 品質検証（workspace-wide typecheck / lint / vitest / coverage AC） | completed |
| [10](phase-10.md) | 最終レビュー（#549 artifacts.json validator green / Phase 12 template 反映確認） | completed |
| [11](phase-11.md) | NON_VISUAL evidence 収集（validator stdout / CI run URL placeholder / link checklist） | completed |
| [12](phase-12.md) | implementation guide / SSOT sync / changelog / strict 7 成果物 | completed |
| [13](phase-13.md) | PR 作成（base `dev` / labels / Refs: #589 / Refs: #549） | pending_user_approval |

## Outputs 導線

| Phase | Output |
| --- | --- |
| 1 | `phase-01.md`（root phase file） |
| 2 | `phase-02.md`（root phase file） |
| 3 | `phase-03.md`（root phase file） |
| 4 | `phase-04.md`（root phase file） |
| 5 | `phase-05.md`（root phase file） |
| 6 | `phase-06.md`（root phase file） |
| 7 | `phase-07.md`（root phase file） |
| 8 | `phase-08.md`（root phase file） |
| 9 | `phase-09.md`（root phase file） |
| 10 | `phase-10.md`（root phase file） |
| 11 | `outputs/phase-11/main.md` |
| 12 | `outputs/phase-12/main.md` ほか strict 7 成果物 |
| 13 | `outputs/phase-13/phase-13.md` |

## 完了条件（DoD: implemented-local close-out）

- [x] Phase 1〜13 の実装仕様書が root に揃っている。
- [x] root `artifacts.json` に `taskType=implementation` / `visualEvidence=NON_VISUAL` / `workflow_state=implemented_local_runtime_pending` を記録している。
- [x] `metadata.gates[]` を新 schema 例として self-demonstrating に記載している（Gate-A: spec_review / Gate-B: validator_green / Gate-C: ci_integration / Gate-D: backfill_549）。
- [x] `outputs/artifacts.json` が root と byte-identical な mirror として配置されている。
- [x] CONST_007 整合: 1 PR / 1 サイクル内で schema + validator + CI + #549 backfill + Phase 12 結線まで完了する範囲に固定している。

## 完了条件（DoD: local implementation wave）

- [x] `packages/shared/src/gate-metadata/schema.ts` が実装され、focused vitest が green。
- [x] `scripts/gate-metadata/validate.ts` が `pnpm gate-metadata:validate` で exit 0、`docs/30-workflows/**/artifacts.json` 全件 schema 適合（historical `gates[]` 不在は WARN/skip、変更 artifacts は CI で必須化）。
- [x] Issue #549 `artifacts.json` と `outputs/artifacts.json` に `gates[]` 4 件（Gate-A: passed / Gate-B/C: pending / Gate-D: waived）が追加され、`gateConditions[]` 自由文は `gateConditions_legacy` にリネームされている。
- [x] `.github/workflows/verify-gate-metadata.yml` が追加され、PR の変更 artifacts を `--require-gates-for-changed` で検証する。required status check 化は user approval 後の別操作。
- [x] `.claude/skills/task-specification-creator/references/phase12-checklist-definition.md` に「gate-metadata validator green」項目が追記され、Phase 12 compliance template から参照可能。
- [x] aiworkflow-requirements `references/gate-metadata.md` 新規追加 + `indexes/*` に keyword 追加。
- [ ] PR に `priority:low` / `scale:small` / `type:improvement` label 付与、本文に `Refs: #589` と `Refs: #549` を含む、base = `dev`。
- [ ] `bash scripts/coverage-guard.sh` exit 0。

## 参照情報

- 起票元: `docs/30-workflows/unassigned-task/u-fix-cf-acct-01-deriv-04-fu-03-d-followup-04.md`
- 親 Issue: https://github.com/daishiman/UBM-Hyogo/issues/589（CLOSED）
- 親 Issue (workflow): https://github.com/daishiman/UBM-Hyogo/issues/549
- 親ワークフロー: `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/`
- zod schema 採用パターン参照: `apps/web/src/lib/env.ts`
- Phase 12 compliance template: `.claude/skills/task-specification-creator/assets/phase12-task-spec-compliance-template.md`
- coverage 基準: `.claude/skills/task-specification-creator/references/coverage-standards.md`
- CLAUDE.md「シークレット管理」「ブランチ戦略」「PR 作成の完全自律フロー」

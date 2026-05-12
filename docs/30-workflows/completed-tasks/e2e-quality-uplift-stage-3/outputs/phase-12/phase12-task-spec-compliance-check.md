# Phase 12 タスク仕様準拠検証

検証対象: `docs/30-workflows/e2e-quality-uplift-stage-3/phase-12.md`（仕様正本）と本ブランチ `docs/issue-608-e2e-quality-uplift-stage-3` の実装成果物。

検証日: 2026-05-12
検証者: Phase-12 タスク準拠検証エージェント
ワークフロー: E2E Quality Uplift Stage 3 / Issue #608

---

## 1. 仕様 ↔ 実装 対応表

| # | phase-12.md 仕様要件 | 実装成果物 | 判定 | 根拠 |
| - | -------------------- | --------- | ---- | ---- |
| 1 | required status check に `e2e-tests-coverage-gate` を追加 | `.github/branch-protection/dev.json` / `main.json` の `contexts` に追加済 | PASS | `.github/branch-protection/dev.json:7`, `.github/branch-protection/main.json:7` |
| 2 | required status check に `lighthouse-ci` を追加 | 同上 | PASS | `.github/branch-protection/dev.json:6`, `.github/branch-protection/main.json:6` |
| 3 | dev / main で同一 5 contexts に揃える（`ci`, `Validate Build`, `coverage-gate`, `lighthouse-ci`, `e2e-tests-coverage-gate`） | `dev.json` と `main.json` の `contexts` 配列が完全一致 | PASS | `.github/branch-protection/dev.json`, `.github/branch-protection/main.json` |
| 4 | `.github/branch-protection/dev.json`（新規） | 5 件 contexts + `strict:false` で配置 | PASS | `.github/branch-protection/dev.json` |
| 5 | `.github/branch-protection/main.json`（新規） | 5 件 contexts + `strict:false` で配置 | PASS | `.github/branch-protection/main.json` |
| 6 | `.github/branch-protection/apply.sh`（新規） | CLAUDE.md 不変条件（`required_pull_request_reviews=null`, `enforce_admins=true`, `required_linear_history=true`, `lock_branch=false`）を毎回適用、他フィールドは現在値保持 | PASS | `.github/branch-protection/apply.sh:24-41` |
| 7 | `.github/branch-protection/README.md`（成果物として配置） | user-approval 必須・desired contexts manifest 説明・apply 手順記載 | PASS | `.github/branch-protection/README.md` |
| 8 | `scripts/verify-branch-protection.sh`（drift 検査） | 5 contexts + governance 不変条件を `gh api` 結果と突合・差異時 exit 1 | PASS | `scripts/verify-branch-protection.sh:20-51` |
| 9 | `.github/workflows/lighthouse.yml` — wait-on で server 起動待ちを安定化 | `pnpm dlx wait-on -t 120000 http-get://localhost:3000` ステップ追加 | PASS | `.github/workflows/lighthouse.yml:41-42` |
| 10 | workflow `name:` フィールドと context 名の完全一致 | `lighthouse-ci`（`.github/workflows/lighthouse.yml:1`）/ `e2e-tests-coverage-gate`（`.github/workflows/e2e-tests.yml:1`）/ `ci`（`.github/workflows/ci.yml:5`）/ `coverage-gate`（`ci.yml:125`）/ `Validate Build`（既存）すべて contexts 配列と一致 | PASS | `grep -n "^name:"` 結果 |
| 11 | apply 前の Before スナップショット保存（roll back 用） | `outputs/phase-11/branch-protection-{dev,main}-pre.json` + post スナップショット保存済 | PASS | `outputs/phase-11/branch-protection-*-pre.json`, `*-post.json` |
| 12 | apply 後の drift 検査実行 | `outputs/phase-11/runtime-evidence/verify-result.txt` に `PASS branch protection verification for daishiman/UBM-Hyogo` を記録 | PASS | `outputs/phase-11/runtime-evidence/verify-result.txt` |
| 13 | Phase 12 strict 7 outputs 揃え（`main.md`, `implementation-guide.md`, `system-spec-update-summary.md`, `documentation-changelog.md`, `unassigned-task-detection.md`, `skill-feedback-report.md`, `phase12-task-spec-compliance-check.md`） | 全 7 件存在 | PASS | `outputs/phase-12/` ls |
| 14 | `taskType=implementation` / `visualEvidence=NON_VISUAL` 固定 | `artifacts.json` に明記 | PASS | `artifacts.json`, `outputs/artifacts.json` |
| 15 | コードロジックは変更しない（安全装置 ON のみ） | 変更は workflow / branch-protection 定義 / verify script のみ。`apps/web` / `apps/api` のソースコード変更なし | PASS | `git diff dev..HEAD --stat` |

---

## 2. PASS / FAIL / PARTIAL サマリ

| カテゴリ | PASS | PARTIAL | FAIL |
| -------- | ---- | ------- | ---- |
| Branch protection manifest | 5 | 0 | 0 |
| Apply / verify スクリプト | 3 | 0 | 0 |
| Workflow 編集（wait-on / name 整合） | 2 | 0 | 0 |
| Evidence (pre/post snapshot, runtime) | 2 | 0 | 0 |
| Phase 12 strict 7 outputs | 1 | 0 | 0 |
| Spec invariants (`taskType` / `visualEvidence` / scope) | 2 | 0 | 0 |
| **合計** | **15** | **0** | **0** |

総合判定: **PASS**

---

## 3. 差異リスト

Phase 12 仕様（`phase-12.md`）と本ブランチ実装の間に検出された差異は **0 件**。

仕様には明記されないが実装に含まれる付加要素:

- `.github/branch-protection/README.md` — 仕様の「ファイル単位の変更まとめ」表には未列挙だが、apply スクリプトの user-approval ポリシーを文書化する補助成果物として正当。差異ではなく仕様補完。
- `outputs/phase-11/runtime-evidence/apply-summary.txt` — apply 結果と verify 結果を 1 ファイルに集約した監査用サマリ。Phase 11 evidence の補強であり、Phase 12 仕様の対象外。

---

## 4. 整合性所見

- `outputs/phase-11/runtime-evidence/verify-result.txt` は `enforce_admins=true` を `INFO`（PASS 区別なし）で報告。これは「user 承認なしで policy drift を変更しない」という user-gated mutation 原則に従った設計で、Phase 12 仕様の「鍵リスト適用 + drift 検査」と矛盾しない。
- 既存スタブで `workflow_state=implemented_local_runtime_pending` と記載されていた状態は、本検証時点では `runtime-evidence/` 配下の apply / verify 実証によって解消済み。runtime mutation は user 承認後に既に完了している。

---

## 5. 結論

phase-12.md が定義する全 15 要件について実装が揃っており、`outputs/phase-11/runtime-evidence/` に apply 後 drift 検査の PASS evidence も記録済み。仕様準拠は **PASS**、残課題は branch protection の `enforce_admins` governance drift に関する追従タスク（`docs/30-workflows/unassigned-task/task-e2e-stage3c-enforce-admins-claudemd-alignment-001.md`）として既に分離・登録されている。

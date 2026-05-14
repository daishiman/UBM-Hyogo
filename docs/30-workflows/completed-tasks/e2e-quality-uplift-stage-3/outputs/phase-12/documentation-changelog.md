# Documentation Changelog — Stage 3 (Issue #608)

## docs/00-getting-started-manual/specs/ への反映

該当なし。

### 理由

Stage 3 の変更はすべて以下のいずれかに該当し、`docs/00-getting-started-manual/specs/` の正本仕様（システム機能・API schema・認証設計・DB 構成など）の変更を要さない:

1. **GitHub branch protection の運用ポリシー実装**: `required_status_checks.contexts` の構成と CLAUDE.md 不変条件の正規化。仕様レベルでは CLAUDE.md（`solo 運用ポリシー` / `品質保証は CI gate で担保` 節）に既に表現済みであり、specs/ への昇格は不要。
2. **CI workflow の readiness 修正**: `lighthouse.yml` の起動 step 安定化はインフラ実装詳細。specs 系の文書は具体的な step 実装を記述対象としていない。
3. **aiworkflow-requirements skill 内仕様への反映**: 仕様は `.claude/skills/aiworkflow-requirements/references/branch-protection.md` / `quality-e2e-testing.md` 配下に閉じる。これは skill SSOT であり、`docs/00-getting-started-manual/specs/` とは責務が分離されている。

## docs/30-workflows/e2e-quality-uplift-stage-3/ への反映（本 workflow 内）

| Date | Path | Change |
| --- | --- | --- |
| 2026-05-11 | `docs/30-workflows/e2e-quality-uplift-stage-3/index.md` | implementation/NON_VISUAL/runtime_pending metadata と contexts 修正 |
| 2026-05-11 | `phase-1.md` | E2E matrix contexts を aggregate `e2e-tests-coverage-gate` に置換 |
| 2026-05-11 | `phase-2.md` | branch protection JSON を desired-state manifest として再定義 |
| 2026-05-11 | `phase-3.md` | CLAUDE.md 不変条件正規化方針を R-2 に追記 |
| 2026-05-11 | `phase-4.md` | Lighthouse 検証経路を `workflow_dispatch` / dev PR に修正 |
| 2026-05-11 | `phase-6.md` | desired contexts + governance-invariant apply の実装手順に更新 |
| 2026-05-11 | `phase-8.md` | 動的検証の期待 contexts を 5 件構成に修正 |
| 2026-05-11 | `phase-9.md` | coverage 閾値を 80% に修正 |
| 2026-05-11 | `phase-10.md` | integration context リストを更新 |
| 2026-05-11 | `phase-11.md` | runtime-pending evidence boundary を追加 |
| 2026-05-11 | `phase-12.md` | 中学生レベル説明を集約 E2E gate に整合 |
| 2026-05-11 | `phase-13.md` | PR / test plan context 名と user-gated 完了表記を修正 |
| 2026-05-12 | `.github/workflows/lighthouse.yml` | `main` PR trigger 追加で required `lighthouse-ci` context が main PR でも生成される |
| 2026-05-12 | `.github/workflows/ci.yml` | actionlint 対象を全 workflow YAML に拡張 |
| 2026-05-12 | `.github/branch-protection/{dev,main}.json` | desired `strict=false` 明示で drift 検査対象化 |
| 2026-05-12 | `scripts/verify-branch-protection.sh` | manifest-driven strict 検証 + hard invariant check + `OK(<branch>): no drift` 行 |
| 2026-05-12 | `phase-7.md` | desired-state JSON の静的 schema 検証に修正 |

## skill 配下（Phase 2 で反映予定）

`.claude/skills/aiworkflow-requirements/` 内の更新対象は `system-spec-update-summary.md` を SSOT として扱う。

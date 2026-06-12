# Phase 12: main (集約 entry)

本 workflow `admin-meetings-card-ux-clarity` の Phase 1-13 成果物・最終状態・受け入れ verdict を集約する index。

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

## 状態

- 現状: `implemented_local_evidence_captured`（apps/web 表現層実装 + local typecheck/lint/vitest/verify:tokens PASS）
- 遷移先 1: `implemented_local_visual_evidence_captured`（local/staging screenshot evidence 取得後）
- 遷移先 2: `implementation_completed`（staging visual smoke + Phase 13 user approval 後）

## Phase 別 entry

| Phase | path | 状態 |
|-------|------|------|
| 1 | `outputs/phase-1/phase-1.md` | done (spec) |
| 1 | `outputs/phase-1/spec-extraction-map.md` | done (spec) |
| 2 | `outputs/phase-2/phase-2.md` | done (spec) |
| 3 | `outputs/phase-3/phase-3.md` | done (spec) |
| 4 | `outputs/phase-4/phase-4.md` | done (spec) |
| 5 | `outputs/phase-5/phase-5.md` | done (spec) |
| 6 | `outputs/phase-6/phase-6.md` | done (spec) |
| 7 | `outputs/phase-7/phase-7.md` | done (spec) |
| 8 | `outputs/phase-8/phase-8.md` | done (spec) |
| 9 | `outputs/phase-9/phase-9.md` | done (spec) |
| 10 | `outputs/phase-10/phase-10.md` | done (spec) |
| 11 | `outputs/phase-11/phase-11.md` | local evidence present / screenshot pending（user-gated） |
| 12 | 本ファイル + strict 7 一式 | done (spec) |
| 13 | `outputs/phase-13/phase-13.md` | pending_user_approval |

## Phase 12 strict 7 成果物（6 + compliance check）

| # | path | 役割 | 状態 |
|---|------|------|------|
| 1 | `outputs/phase-12/main.md` | Phase 12 集約 entry（本ファイル） | present |
| 2 | `outputs/phase-12/implementation-guide.md` | 実装ハンドブック（Part 1 中学生レベル / Part 2 技術者向け・CONST_005 5 必須項目 + 視覚証跡） | present |
| 3 | `outputs/phase-12/system-spec-update-summary.md` | 正本 spec 影響（本サイクルは N/A） | present |
| 4 | `outputs/phase-12/documentation-changelog.md` | Step 1-A/1-B/1-C/Step 2 個別記録 | present |
| 5 | `outputs/phase-12/unassigned-task-detection.md` | current（0 件）+ baseline（OOS-1〜OOS-4） | present |
| 6 | `outputs/phase-12/skill-feedback-report.md` | テンプレート/ワークフロー/ドキュメント改善 3 観点 | present |
| 7 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | canonical 9 headings compliance（CI gate SSOT） | present |

## 入口

- 実装着手者は **Phase 5** の依存グラフ + **Phase 4** の実装ガイド、および `implementation-guide.md` から順に作業する
- レビュー者は **`phase12-task-spec-compliance-check.md`** + **`implementation-guide.md`** を起点に
- PR 作成は **Phase 13** が手順書
- 設計の前提・CSS 契約・DOM 改修・DoD は `../../shared-context.md` を正本とする

## Local validation 記録

| 検証 | 期待 | 結果 |
|------|------|------------------|
| `pnpm typecheck`（workspace） | exit 0 | PASS |
| `pnpm lint`（workspace） | exit 0 | PASS |
| repo-root `pnpm exec vitest run`（_meetings 4 spec + 追加ケース） | exit 0 | PASS（4 files / 18 tests） |
| `pnpm verify:tokens`（HEX 0 / token 経由） | exit 0 | PASS（91 tracked） |
| `rg -n "bg-\[#\|text-\[#"`（_meetings + globals.css） | 0 件 | PASS |
| `git diff -- apps/api`（API 不変・AC） | 空 | PASS |
| data-testid contract | 削除IDなし | PASS（wrapper移動のみ。同一ID維持） |
| Phase 11 screenshot 5 件（desktop/mobile・折りたたみ/展開/出席者） | present | pending（user-gated・staging） |
| `bash scripts/verify-pr-ready.sh` | exit 0 | pending（Phase 13 user-gated） |

詳細は `outputs/phase-11/evidence/local-validation-summary.txt` を正本とする。

## user-gated 境界

| 種別 | 項目 | 境界 |
|---|---|---|
| local 実行 | typecheck / lint / web vitest / verify:tokens / HEX grep / apps/api diff | 実装 wave（Claude 実行可） |
| user-gated | staging deploy（`bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging`） | user 承認後 |
| user-gated | staging screenshot 5 枚（desktop/mobile・折りたたみ/展開/出席者） | user 承認後 |
| user-gated | `git commit` / `git push` / `gh pr create --base dev` | user 承認後 |

## 4 条件 verdict

| 条件 | 判定 | 根拠 |
| --- | --- | --- |
| 矛盾なし | PASS | API/D1/Form 不変。表現層 CSS + wrapper のみ。token 正本に整合 |
| 漏れなし | PASS | カード分離 / 展開階層 / 出席者行の 3 課題を F1-F3 で実装・focused tests で検証 |
| 整合性あり | PASS | 既存 BEM 実体化 + 汎用 primitive 最小新設。未定義 token 参照も定義済 token へ収束 |
| 依存関係整合 | PASS | apps/web 単独完結。staging/visual/commit は user-gated 分離 |

総合 verdict: **implemented_local_evidence_captured / 4 条件 PASS**。Gate-A/B は passed、Gate-C は user-gated pending。

## 関連 reference

- `.claude/skills/task-specification-creator/references/phase-template-phase12.md`
- `.claude/skills/task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md`
- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- 同型サンプル: `docs/30-workflows/completed-tasks/admin-identity-conflicts-prototype-alignment-and-404-fix/outputs/phase-12/`

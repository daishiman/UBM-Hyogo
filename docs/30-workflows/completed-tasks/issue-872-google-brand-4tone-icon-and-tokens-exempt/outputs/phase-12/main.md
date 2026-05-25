**[実装区分: 実装仕様書 / 状態: spec_created]**

# Phase 12: main (集約 entry)

issue #872 [FU-LOGIN-001] Google brand 4-tone 正規アイコン導入 + `verify-design-tokens` brand-color exempt path 拡張 ワークフローの Phase 1-13 成果物・最終状態・受け入れ verdict を集約する index。

## 状態

- 本仕様書時点: `spec_created` (Phase 1-13 全 spec の作成完了。実装と evidence 取得は未着手)
- Phase 11 完了後の想定終端: `implemented_local_visual_evidence_captured` (実装 + local static evidence + local Playwright screenshot 完了。staging visual smoke は FU-LOGIN-003 で user-gated)
- 遷移先: `implementation_completed` (Phase 13 PR merge + user approval 後)

## Phase 別 entry

| Phase | path | 状態 |
|-------|------|------|
| 1 | `outputs/phase-1/phase-1.md` | done (spec) |
| 2 | `outputs/phase-2/phase-2.md` | done (spec) |
| 3 | `outputs/phase-3/phase-3.md` | done (spec) |
| 4 | `outputs/phase-4/phase-4.md` | done (spec) |
| 5 | `outputs/phase-5/phase-5.md` | done (spec) |
| 6 | `outputs/phase-6/phase-6.md` | done (spec) |
| 7 | `outputs/phase-7/phase-7.md` | done (spec) |
| 8 | `outputs/phase-8/phase-8.md` | done (spec) |
| 9 | `outputs/phase-9/phase-9.md` | done (spec) |
| 10 | `outputs/phase-10/phase-10.md` | done (spec) |
| 11 | `outputs/phase-11/phase-11.md` + `outputs/phase-11/screenshot-plan.json` + (`outputs/phase-11/evidence/*` / `outputs/phase-11/screenshots/*` は Phase 11 実行時取得) | spec ready / evidence pending |
| 12 | `outputs/phase-12/phase-12.md` + strict 7 (`main.md` / `implementation-guide.md` / `system-spec-update-summary.md` / `documentation-changelog.md` / `unassigned-task-detection.md` / `skill-feedback-report.md` / `phase12-task-spec-compliance-check.md`) | done (spec) |
| 13 | `outputs/phase-13/phase-13.md` | done (spec) |

## 入口

- 実装着手者は **Phase 5** (実装順序・依存グラフ) から作業し、**Phase 4** (実装ガイド本体) を併読する
- レビュー者は **Phase 12 implementation-guide.md** (Part 1 中学生レベル + Part 2 技術者レベル) と **phase12-task-spec-compliance-check.md** (canonical 9 headings) を起点に
- PR 作成は **Phase 13** が手順書

## Local validation (Phase 11 実行後に追記想定)

Phase 11 完了後、`outputs/phase-11/evidence/local-validation-summary.txt` を要約して本セクションに転記する想定:

> 例 (実行後): web Vitest scripts/verify-design-tokens.spec.ts PASS、typecheck PASS、lint PASS、`pnpm tsx scripts/verify-design-tokens.ts` exit 0 (drift 0)、`apps/web` build PASS、Playwright visual `login.spec.ts` chromium-desktop diff = 0、screenshot 2 件 (desktop / mobile) 取得済。

## 重要不変条件 (本 task でも遵守)

1. 既存 API endpoint surface のみ利用 (新規 endpoint なし)
2. OKLch token 正本維持。本 task の例外は `apps/web/src/components/ui/brand-icons/*.svg` に限定 (brand-asset exempt 章)
3. `apps/web` から D1 直接アクセス禁止
4. test ファイルは `*.spec.{ts,tsx}` のみ
5. 親 workflow (completed-tasks 配下) への consumed trace 追記は live ledger 扱いで許容

## 次 Phase への引き継ぎ

Phase 13 で base=`dev` の PR を user-gated で作成する。issue #872 は CLOSED のまま維持し、本 PR では `Refs #872` で参照 (`Closes` ではなく `Refs`)。

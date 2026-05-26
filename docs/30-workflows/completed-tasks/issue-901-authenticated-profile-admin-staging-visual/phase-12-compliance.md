---
phase: 12
title: Compliance check — authenticated staging-visual evidence existence validator gate
workflow_id: issue-901-authenticated-profile-admin-staging-visual
status: spec_created
---

# Phase 12 — Compliance check（中学生レベル概念説明込み）

[実装区分: 実装仕様書]

## 1. なぜ Phase 12 が必要か（中学生レベル説明）

Phase 11 で「この場所にこのファイルを置く」と決めても、実行時に置き忘れると後で「ちゃんとやった」と証明できない。Phase 12 では「Phase 11 で決めた場所に本当にファイルがあるか」を CI が機械で確認する。先生が宿題の写真を出して、と言って本当に写真があるか見るのと同じ。

つまり Phase 12 は **「Phase 11 と実物の照合」を CI で機械化** するための gate。

## 2. canonical 9 headings（task-specification-creator 標準）

1. 目的
2. 適用範囲
3. 検証ルール
4. 実行コマンド
5. 失敗時の対応
6. 例外規定
7. 監査ログ
8. 関連ドキュメント
9. SSOT 宣言

## 3. 目的

Phase 11 で定義した evidence inventory (E-01..E-15) が物理存在し、`artifacts.json` が gate-metadata zod schema を通過し、Phase 12 strict 7 outputs が workflow root `outputs/phase-12/` に SSOT として配置されていることを CI で機械検証する。これにより本タスクの DoD（Phase 8）が満たされ、親 workflow `ut-dsf-07-staging-visual-runtime-evidence` の `VISUAL_RUNTIME_AUTHENTICATED_OK` 解除が evidence 裏付き状態になることを gate にする。

## 4. 適用範囲

| 範囲 | 内容 |
|---|---|
| 対象ディレクトリ | `docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual/outputs/phase-11/` および `outputs/phase-12/` |
| 対象 evidence | Phase 11 inventory 15 件 (E-01..E-15) + Phase 12 strict 7 件 |
| 対象 schema | 本 workflow `artifacts.json`（gate-metadata） |
| 対象 gate | `verify-phase12-compliance` / `verify-gate-metadata` / `verify-no-auth-secret-leak` |
| 対象 parent | 親 `ut-dsf-07-staging-visual-runtime-evidence` の `phase-09-risks.md` §5 / `phase-13-commit-pr-draft.md` §7 cross-ref 整合 |

## 5. 検証ルール

| Rule | 内容 | 検証 |
|---|---|---|
| R-01 | Phase 11 inventory の present 行（E-01..E-03）が物理存在 | evidence existence validator |
| R-02 | spec_created 時点で pending 行（E-04..E-15）は CI 実行サイクル後に存在へ遷移し inventory 表が更新される | Gate-C |
| R-03 | `artifacts.json` が zod schema を満たす（status enum / passed_at ISO8601 / evidence_path 相対） | `gate-metadata:validate` |
| R-04 | Phase 12 strict 7 outputs が `outputs/phase-12/` 配下に物理存在 | strict-7 parity check |
| R-05 | Phase 12 strict 7 が sub-workflow に複製されていない（本 workflow に sub なし。N/A） | parity check |
| R-06 | canonical 9 headings (§2) が本ファイルに存在 | `verify-phase12-compliance` |
| R-07 | proto-spec ファイルに `status: consumed` + `canonical_workflow` pointer が追記されている | grep |
| R-08 | 親 workflow に cross-ref が追記されている（R-03 解消明記） | grep |
| R-09 | cookie 値 / JWT / `STAGING_AUTH_SECRET` 値が tracked file に 0 hit | `verify-no-auth-secret-leak` |
| R-10 | unassigned-task-detection.md の unassigned カウント = 0（FU 候補は別記） | review |

## 6. 実行コマンド

```bash
WF=docs/30-workflows/completed-tasks/issue-901-authenticated-profile-admin-staging-visual
# local
mise exec -- pnpm gate-metadata:validate
mise exec -- pnpm verify:phase12-compliance 2>&1 | tee "$WF/outputs/phase-11/evidence/verify-phase12-compliance.log"
bash scripts/lib/grep-no-auth-leak.sh
mise exec -- pnpm indexes:rebuild   # diff 0 期待
bash scripts/verify-pr-ready.sh

# CI
# - .github/workflows/verify-phase12-compliance.yml
# - .github/workflows/verify-gate-metadata.yml
# - .github/workflows/playwright-staging-visual-authenticated.yml (verify-no-auth-secret-leak job)
```

## 7. 失敗時の対応

| 失敗パターン | 原因 | 対応 |
|---|---|---|
| evidence path 不在 (E-11/E-12) | CI step (f) 未実行 / baseline 生成失敗 | Phase 10 §4 step (e)(f) を再実行 |
| `artifacts.json` schema violation | enum / datetime / pending→passed_at 整合 | Phase 4 §7 contract に再整列 |
| canonical 9 headings 不足 | 見出し漏れ | §2 の 9 headings を全配置 |
| strict 7 parity fail | outputs/phase-12 に欠落 | 本 phase 末尾の 7 file 一覧で再生成 |
| grep gate hit | cookie 値 / JWT が log / spec / docs に混入 | 該当 commit を amend で除去 + `STAGING_AUTH_SECRET` rotation |
| parent cross-ref 不在 | 親 phase-09 §5 / phase-13 §7 編集漏れ | Phase 5 §7 の diff を適用 |

参照: `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`

## 8. 例外規定

- 本タスクは `[実装区分: 実装仕様書]` で `docs-only` 適用なし。NON_VISUAL skip 規定は適用されない。
- baseline PNG (E-11..E-14) は git にコミット必須（CI artifact のみは不採用）。
- storageState JSON は git コミット禁止（cookie 値含むため）。inventory 上 evidence 化しない。

## 9. 監査ログ

`outputs/phase-11/evidence/verify-phase12-compliance.log` に exit code と検証結果を出力。`artifacts.json.gates[].passed_at` は ISO 8601 で監査タイムスタンプとして残る。`outputs/phase-11/parent-gate-release.md`（E-15）が親 workflow gate 解除の監査記録。

## 10. 関連ドキュメント

- `.claude/skills/task-specification-creator/references/phase-12-completion-checklist.md`
- `.claude/skills/task-specification-creator/references/phase12-strict-7-workflow-root-parity-gate.md`
- `.claude/skills/task-specification-creator/references/phase12-compliance-check-template.md`
- `.claude/skills/task-specification-creator/references/pr-pre-flight-ci-gate-checklist.md`
- `.claude/skills/task-specification-creator/references/closed-issue-canonical-workflow-recovery.md`
- 親: `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/phase-12-compliance.md`

## 11. SSOT 宣言

本 Phase 12 ファイルが、本タスクの Phase 11 evidence と Phase 8 DoD の compliance に関する SSOT である。`artifacts.json` の内容が本ファイルの検証ルール R-01..R-10 と矛盾する場合、本ファイルが優先する。strict 7 outputs は `outputs/phase-12/` を SSOT とし、sub-workflow 複製禁止（本 workflow に sub なし）。

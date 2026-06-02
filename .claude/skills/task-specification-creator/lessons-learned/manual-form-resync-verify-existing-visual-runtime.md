# Task B manual form resync — verify_existing + VISUAL_ON_EXECUTION close-out

## Context

`docs/30-workflows/completed-tasks/task-b-manual-form-resync-admin-ui-spec/` は親 workflow
`task-member-publish-recovery-form-ops-and-admin-link` の Task B（手動 Google Form
再取込 admin UI）を Phase 1-13 化したもの。実装は本 spec 作成より前に commit
`745c95115` / PR #1064 で dev へ landed 済み（`implementation_mode: verify_existing`）。
spec 一式は greenfield 指示ではなく landed 実装の正本記述 + 回帰確認として構成した。

## Lessons

### L-TASKB-001: verify_existing + VISUAL は state を 2 軸で分離する

landed 実装に対する VISUAL タスクの close-out では、ローカル決定的証跡（focused
Vitest / typecheck / lint / static UI contract PNG）は `implemented_local_evidence_captured`
として記録できる一方、認証必須の runtime screenshot は `runtime_visual_pending_user_gate`
として user-gated に残す。両者を同一 state に潰すと false-green になる。

### L-TASKB-002: landed 親実装の standalone spec でも Phase 11/12 物理成果物は必須

親実装が landed 済みでも、standalone spec workflow は Phase 11/12 の**物理ファイル**
（strict 7 + Phase 11 evidence）を必ず materialize する。Phase ファイルを指示文の
ままにすると close-out が空証跡で「完了」扱いされる false close-out になる。

### L-TASKB-003: gate-metadata の gate status は enum 4 値のみ

`artifacts.json` の `metadata.gates[].status` は zod enum
`pending` / `passed` / `failed` / `waived` のみ受理する。`blocked_pending_user_approval`
等の独自語を入れると `gate-metadata:validate` が `Invalid option` で ERROR。
user-gated を表現したい場合は `status: "pending"` とし、ニュアンスは `notes` に書く。
root / outputs 両 artifacts.json を byte-identical に保つこと（`cp` で同期）。

### L-TASKB-004: phase12-compliance の見出しは canonical 9 を逐語一致させる

`outputs/phase-12/phase12-task-spec-compliance-check.md` の見出しは
`references/phase12-compliance-check-template.md` の Required Sections
（`1. Summary verdict` … `9. Four-condition verdict`）を**逐語**で使う。
`## 1. Summary Verdict`（Verdict 大文字）/ `## 3. Workflow State Consistency` 等の
独自命名は CI gate `verify-phase12-compliance` が `missing-heading` で必ず fail する。
さらに Phase 11 evidence inventory は列見出し `Classification` / `Path` / `Status`
（小文字統一）固定、`Status` は `present` / `pending` / `n/a` の 3 値のみ。
`present` 行は物理 file 存在検査が走る。`File | Status` 等の亜種列は parser に
拾われず fail。

### L-TASKB-005: generate-index.js は compact `phase-N.md` 命名を認識する

本 workflow は `phase-1.md` … `phase-13.md` の compact 命名を採用したが、
`task-specification-creator/scripts/generate-index.js` は当初 `phase-N-*.md` の
descriptive 命名のみ検出し `Phase files found: 0/13` を報告した。生成 index を
正本採用せず手書き index へ revert したうえで、script を compact 命名対応へ修正し、
`scripts/__tests__/generate-index.test.mjs` に回帰テストを追加した（3 tests passed）。

## How to apply

verify_existing + VISUAL タスクの close-out では:

1. state を `implemented_local_evidence_captured`（ローカル証跡）と
   runtime user-gated に分離して記録する;
2. Phase 11/12 物理成果物（strict 7 + evidence）を必ず作る;
3. `artifacts.json` の gate status は enum 4 値のみ、root/outputs を byte 一致;
4. compliance 見出しは canonical 9 を逐語、Phase 11 表は `Classification|Path|Status`;
5. compact `phase-N.md` 命名なら generate-index.js の対応有無を確認する。

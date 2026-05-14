---
task_id: task-24
title: UI MVP W8 par invariant audit – lessons learned
status: completed
scope: NON_VISUAL / read-only audit
created: 2026-05-14
---

# Lessons Learned — task-24 UI MVP W8 par invariant audit

task-24 は `apps/` / `packages/` を一切変更しない read-only invariant audit task として
W8 を並列 (par) 実行した。22 タスク × 6 不変条件を `audit-runner.sh` で grep-evidence
化し、`INVARIANT-AUDIT.md` を生成して W9（task-27）へ橋渡しする責務を持つ。
ここでは task-spec / phase 設計 / skill 同期で得た再利用可能な教訓を抽出する。

参照: `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/`、
`docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/INVARIANT-AUDIT.md`、
`outputs/phase-12/skill-feedback-report.md`。

---

## L-TASK24-001 — 22×6 invariant matrix shape の SSOT 化

audit 結果は「rows = tasks (task-01..task-22, 22 件)、cols = invariants (INV-1..INV-6, 6 件)、
cell vocabulary = `COMPLIANT | VIOLATION | N/A`」という固定 shape を SSOT として持つ。
この shape を `INVARIANT-AUDIT.md` の matrix table と `phase-5/matrix.tsv` の両方で
完全一致させ、消費側（task-27 W9 mapping）は cell vocabulary のみで分岐すれば良いように
した。

- **Why**: matrix shape を decode するロジックを consumer 側で書くと、行数 / 列順 /
  ステータス語彙のいずれかが乱れた時点で W9 全体が壊れる。SSOT を一箇所に固定すれば
  audit-runner の出力契約だけ守れば良い。
- **How to apply**: 新規 audit task では matrix shape（rows / cols / vocabulary）を
  Phase 1 acceptance criteria に明記し、Phase 5 で生成する TSV と Phase 12 で書き出す
  Markdown table の両方を sample fixture でゴールデン比較する。語彙は `N/A` を必ず
  許容し、未該当セルを `COMPLIANT` で埋めない。

## L-TASK24-002 — read-only audit task の Phase-5 / Phase-11 役割定義

通常 implementation task では Phase 5 = unit test、Phase 11 = smoke / visual evidence。
read-only audit task ではコードを書かないため、Phase 5 は **grep-evidence の集合 + 集計
TSV**、Phase 11 は **smoke の代わりに matrix snapshot + audit-runner stdout** で代替した。

- **Why**: NON_VISUAL かつ apps/ 改変なしの task に visual smoke を要求すると
  evidence を捏造するインセンティブが生まれる。task 性質に応じて phase 役割の
  「読み替え」を明示しないと、Phase 12 strict 7 compliance check で missing 判定が出る。
- **How to apply**: task-spec-creator で task type = audit / read-only を選んだ場合、
  Phase 5 を「evidence collection」、Phase 11 を「matrix snapshot or runner log」と
  自動 rename する template 分岐を持たせる。NON_VISUAL helper outputs を Phase 11
  output として認める旨を `task-workflow-active.md` に明記する。

## L-TASK24-003 — `audit-runner.sh` の I/O contract を spec 化する

`outputs/phase-5/audit-runner.sh` は `exit 0` / `outputs/phase-5/` 固定出力先 /
生成ファイル集合 (`matrix.tsv`, `grep-evidence.txt`, `violations.md`,
`primitives-unexpected.txt`) という暗黙の I/O contract を持っていた。implementation-guide
と script 自体に同じ事実が分散し、矛盾が起きた場合に「どちらが正本か」が曖昧だった。

- **Why**: runner script を再実行可能な audit primitive として扱う以上、I/O contract
  （exit code 意味論、stdout フォーマット、生成ファイル名）は task-spec で SSOT 化
  しないと、grep-evidence の location drift と implementation-guide の二重管理が
  発生する。
- **How to apply**: audit task の Phase 2 design output に「runner contract」節を
  必須化し、(1) exit code 体系、(2) 出力 dir の絶対 path、(3) 生成ファイル名 +
  schema、(4) 再実行時の idempotency を明記。implementation-guide からはこの節を
  link 参照のみとし、本文重複を避ける。

## L-TASK24-004 — task root rename 時の self-reference path 一括更新

task-24 完了後に root を `docs/30-workflows/task-24-...` から
`docs/30-workflows/completed-tasks/task-24-...` へ rename したが、
`outputs/phase-12/*.md` / `phase-12.md` / `INVARIANT-AUDIT.md` / skill 配下
（artifact-inventory / resource-map / LOGS）に旧 path literal が残存した。
git の `R` 検出は path 移動を追跡するが、ファイル本文の文字列までは更新しない。

- **Why**: completed-tasks/ への移動は workflow lifecycle で頻繁に発生する一方、
  self-reference を放置すると、後続 task が link 切れの旧 path を参照し evidence
  trace が壊れる。aiworkflow-requirements skill の indexes も同様。
- **How to apply**: workflow を `completed-tasks/` へ移動する hook（または手順
  checklist）に、(1) `outputs/**/*.md` 内の旧 root literal grep、(2) skill
  `references/workflow-<task>-artifact-inventory.md` / `indexes/resource-map.md` /
  `LOGS/_legacy.md` / 親 SCOPE.md の旧 path 一括 sed を含める。replace_all は
  「旧 path literal は新 path の suffix」ではないことを確認してから実行する
  （`completed-tasks/` を含む新 path は旧 literal と一致しないため安全）。

---

## Backlinks

- canonical workflow: `docs/30-workflows/completed-tasks/task-24-ui-mvp-w8-par-invariant-audit/`
- consumer (W9): `docs/30-workflows/task-27-ui-mvp-w9-solo-mvp-3-layer-task-mapping/`
- parent scope: `docs/30-workflows/completed-tasks/ui-prototype-alignment-mvp-recovery/SCOPE.md`
- artifact inventory: `.claude/skills/aiworkflow-requirements/references/workflow-task-24-ui-mvp-w8-par-invariant-audit-artifact-inventory.md`

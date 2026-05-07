# Lessons Learned — Issue #494 09a-A Exec Staging Smoke Runtime（2026-05-06）

> task id: `issue-494-09a-A-exec-staging-smoke-runtime`
> branch: `docs/issue-494-09a-A-exec-staging-smoke-task-spec`
> wave: 2026-05-06 / spec_hygiene_complete / runtime_evidence_pending
> created: 2026-05-06
> canonical root: `docs/30-workflows/issue-494-09a-A-exec-staging-smoke-runtime/`
> historical root: `docs/30-workflows/09a-A-staging-deploy-smoke-execution/`（2026-05-06 に rename。新規参照禁止）
> 関連 reference:
> - `references/task-workflow-active.md`
> - `references/legacy-ordinal-family-register.md`（L361-362 successor 行）
> - `references/workflow-task-issue-494-09a-A-exec-staging-smoke-runtime-artifact-inventory.md`
> 関連 lessons-learned: `2026-05-05-09a-A-staging-deploy-smoke-execution-spec.md`（spec phase の前段教訓）

## サマリ

本 wave は staging deploy smoke の **runtime root 不整合の補正サイクル**。実 deploy / Forms sync / D1 apply / screenshot 取得は実施せず、spec hygiene のみで完結させた。再発防止のため以下 5 件を canonical lessons として固定する。

## 教訓一覧

### L-494-001: 1 runtime task に対し canonical evidence root は **必ず単一**にする（1 task 1 evidence root 原則）

- **背景**: 09a-A の旧 root `docs/30-workflows/09a-A-staging-deploy-smoke-execution/` は spec phase の正本だったが、runtime execution wave で「同名のまま runtime evidence を追記する経路」と「Issue #494 で別 root を切る経路」が混在しかけた。Phase 11 で `outputs/phase-11/` の参照先と artifacts.json の root 宣言が乖離する事故の原因になる。
- **教訓**: runtime execution が独立 issue で formalize される場合は、初手で canonical evidence root を 1 つに固定し、historical root には「新規参照禁止 / successor 参照」を legacy-ordinal-family-register.md に明記する。`artifacts.json` (root) と `outputs/artifacts.json` の両方が同一 root を指していることを Phase 12 compliance check で検証する。
- **適用条件**: spec phase が先行クローズし、runtime phase を別 issue / 別 wave で実行する全 workflow。
- **再利用方法**: artifact inventory の冒頭に `Current canonical root` / `Historical root (do-not-cite)` を 2 行で固定。Phase 12 compliance check の必須項目に「root parity」と「historical root 参照ゼロ」を追加。

### L-494-002: Successor workflow は **削除済み historical root に依存させない** — fail-fast 設計にする

- **背景**: 旧 root を rename した結果 `git status` 上は D（削除）扱いとなり、後続 workflow が historical root の `outputs/phase-11/` を参照していると参照先が消える。runtime workflow が壊れた状態で起動してしまうのは最悪の事故。
- **教訓**: runtime execution workflow を起動する前に、(a) artifacts.json の root path 実在チェック、(b) outputs/phase-N/ ディレクトリ存在チェック、(c) inventory の canonical root と一致しているかの 3 点を **pre-flight gate** として実行し、不一致があれば即座に fail させる。successor workflow は historical root を参照しない。
- **適用条件**: rename / move を伴う runtime workflow 全般。特に historical root を残置（spec close-out として）するケース。
- **再利用方法**: phase12-skill-feedback-promotion.md の Applied Examples に Issue #494 行として既反映済。新規 runtime workflow の Phase 1 pre-flight gate 雛形として参照する。

### L-494-003: Spec hygiene only サイクルは **明示ステータスで分離**する（runtime PASS と混同しない）

- **背景**: 本 wave は実行成果物 0、spec 整合性修正のみ。Phase 12 compliance-check が「7 ファイル揃い」を理由に PASS とすると、runtime evidence が PENDING のまま「Phase 12 達成」と読み違える事故になる。
- **教訓**: spec hygiene cycle は `runtime_status_update_pending` を artifacts.json metadata と main.md 冒頭に明記し、`PASS_BOUNDARY_SYNCED_RUNTIME_PENDING`（L-09AA-001 と同じ判定軸）で固定。compliance-check には「runtime_evidence_required_but_pending」項目を必ず含める。
- **適用条件**: runtime mutation を一切伴わない hygiene-only wave。docs-only / index-only / spec-rename も同様。
- **再利用方法**: artifact inventory の `Wave Type` フィールドに `spec_hygiene_only` / `runtime_execution` / `mixed` の 3 値を導入し、phase-12 compliance-check の判定分岐に使う。

### L-494-004: Skill index 群への新 inventory 登録は **同一 wave で 5 箇所同期**する

- **背景**: 本 wave で `workflow-task-issue-494-09a-A-exec-staging-smoke-runtime-artifact-inventory.md` を新規追加する際、(1) resource-map.md, (2) quick-reference.md, (3) topic-map.md, (4) keywords.json, (5) task-workflow-active.md の 5 箇所への登録が必須だった。1 つでも欠けると Progressive Disclosure の経路が成立しない。
- **教訓**: 新規 inventory / new reference を追加する wave では、上記 5 箇所への登録を **同一 commit** で完了させる。`pnpm indexes:rebuild` 後に CI の `verify-indexes-up-to-date` gate が通ることまで確認する。
- **適用条件**: aiworkflow-requirements skill 配下に新規 reference を追加する全 wave。
- **再利用方法**: skill 編集チェックリストに「5 箇所同期」を mandatory 化。本 lessons の本セクションを Phase 12 implementation-guide.md からリンクして再利用する。

### L-494-005: legacy-ordinal-family-register.md の successor 行は **rename 当日**に追記する（後追い禁止）

- **背景**: rename 操作後に register への追記を後回しにすると、grep 引き直しの正本が存在しない状態で他 wave が走り、historical root への新規 citation が混入する。
- **教訓**: rename / move を含む wave は、操作と同 commit で legacy-ordinal-family-register.md に successor 行を追加し、historical 行にも「<日付> に <新 root> へ rename」を追記する。grep 引き直し用のコマンド例も同行に併記する。
- **適用条件**: directory rename / move を伴う全 wave。
- **再利用方法**: legacy-register の最下段「旧 citation 引き直し方針」セクションに合わせ、rename wave のチェックリストに register 同 commit 更新を入れる。

## 関連 promotion

- task-specification-creator skill 側 promotion: `.claude/skills/task-specification-creator/references/phase12-skill-feedback-promotion.md`（Applied Examples に Issue #494 行を追加済）
- aiworkflow-requirements skill 側 SKILL.md changelog: `v2026.05.06-issue494-runtime-root-correction`

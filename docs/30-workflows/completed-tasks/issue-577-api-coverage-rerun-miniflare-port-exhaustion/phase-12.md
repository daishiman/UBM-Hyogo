# Phase 12 — implementation-guide / 採用判断記録 / unassigned 検出 / skill feedback / compliance

## 目的

strict 7 outputs を `outputs/phase-12/` に固定し、Issue #577 タスク完了の SSOT を Claude Code / Codex 共通で参照可能にする。現在は実測結果で上書き済みで、Phase 13 の commit / push / PR のみ user gate に残す。

## 入力 / 前提

- Phase 11 の rerun / triage 結果
- 30 種思考法 compact evidence

## 手順

1. strict 7 outputs を以下のファイル名で作成:
   - `outputs/phase-12/main.md`（Phase 12 サマリ）
   - `outputs/phase-12/implementation-guide.md`（採用軸 / patch 内容 / rerun 手順 / 再発時 runbook）
   - `outputs/phase-12/system-spec-update-summary.md`（仕様変更点 / vitest config 影響 / Issue #532 への follow-up）
   - `outputs/phase-12/documentation-changelog.md`（本仕様書 + Issue #532 への追記 changelog）
   - `outputs/phase-12/unassigned-task-detection.md`（matrix で別エラー検出時の起票候補 / 30day-contract 候補）
   - `outputs/phase-12/skill-feedback-report.md`（task-specification-creator skill への feedback）
   - `outputs/phase-12/phase12-task-spec-compliance-check.md`（30 種思考法 compact + 検証 4 条件）
2. 採用判断記録: `implementation-guide.md` に「rerun PASS で no-code verification」「軸 X 採用で patch」「ペンディングで 30day-contract」の確定状態を明記。
3. unassigned 検出: matrix で副次的に発見された別 fail（例: 別 test の flaky）を `unassigned-task-detection.md` に列挙し、`docs/30-workflows/unassigned-task/` への起票候補化を検討。
4. compliance check: `phase12-task-spec-compliance-check.md` に 30 種思考法（仮説検証 / 対立軸 / 反証可能性 / 単一責務 / DoD / 30day-contract / NON_VISUAL secret hygiene 等）の compact evidence を記録。
5. artifacts parity: root `artifacts.json` と `outputs/artifacts.json` の `task_id` / metadata / required_outputs が同値であることを `documentation-changelog.md` と `phase12-task-spec-compliance-check.md` に記録する。
6. system spec sync: aiworkflow-requirements の `quick-reference` / `resource-map` / `task-workflow-active` / `LOGS` 登録と、元 unassigned task の consumed trace を `system-spec-update-summary.md` に記録する。

## 成果物

- 上記 strict 7 outputs（固定ファイル名）

## 検証コマンド

```bash
ls docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-12/
test -f docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/phase-12/implementation-guide.md
diff -u docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/artifacts.json docs/30-workflows/issue-577-api-coverage-rerun-miniflare-port-exhaustion/outputs/artifacts.json
```

## 完了条件（DoD）

- [ ] strict 7 outputs が固定ファイル名で揃っている。
- [ ] 採用判断が implementation-guide.md に明記されている。
- [ ] unassigned-task-detection.md に起票候補（無い場合は「該当なし」明記）が記録されている。
- [ ] compliance check が 30 種思考法 compact evidence で埋められている。
- [ ] root `artifacts.json` と `outputs/artifacts.json` の parity が確認されている。
- [ ] aiworkflow-requirements sync と consumed trace が確認されている。

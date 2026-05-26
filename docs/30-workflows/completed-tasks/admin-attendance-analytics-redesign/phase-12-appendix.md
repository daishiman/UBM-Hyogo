[実装区分: 実装仕様書]

# Phase 12 Appendix: Close-out 詳細

> 親: [phase-12.md](phase-12.md)。500行制限のため、詳細チェックリストを分離する。

## 1. Unassigned Task Detection

出力: `outputs/phase-12/unassigned-task-detection.md`。

確認ソース:

- scope-out / Phase 3 / Phase 10 / Phase 11 改善提案
- 変更ファイルの TODO / FIXME
- `describe.skip` / `it.skip` / `test.skip`
- 既存 active workflow との overlap

0 件でも baseline/current を分けて明示し、作成しない理由を記録する。今回の optional CSV pagination / async export は current redesign の完了条件ではないため未タスク化しない。

## 2. Skill Feedback

出力: `outputs/phase-12/skill-feedback-report.md`。

観点:

- task-specification-creator の既存ルールで吸収可能か。
- workflow state と implementation diff が矛盾していないか。
- aiworkflow-requirements へ domain lesson / API contract を反映する必要があるか。
- no-op 判定には evidence path と no-op reason があるか。

## 3. Compliance Check

出力: `outputs/phase-12/phase12-task-spec-compliance-check.md`。

必須項目:

- strict 7 physical files exist and are non-empty。
- root `artifacts.json` と `outputs/artifacts.json` が同値。
- Phase 11 evidence inventory が実在 path と一致。
- `apps/` / `packages/` / canonical spec diff がある場合、`spec_created` で閉じない。
- staging/browser evidence が未取得なら runtime pending と明記する。

## 4. Same-wave Sync

同期対象:

- workflow root / output artifacts
- `docs/00-getting-started-manual/specs/01-api-schema.md`
- aiworkflow quick-reference / resource-map / task-workflow-active
- aiworkflow artifact inventory / API endpoint reference / dated changelog / LOGS
- lessons-learned when reusable苦戦箇所がある場合
- task-specification-creator reference only when the owning rule is missing

Commit / push / PR はこの appendix の手順対象外。ユーザー承認後の Phase 13 で扱う。

## 5. Recovery

| Failure | Action |
| --- | --- |
| strict 7 missing | regenerate missing file and rerun compliance |
| artifacts parity drift | copy authoritative root JSON to output mirror |
| state mismatch | align artifacts, Phase 12 outputs, aiworkflow ledgers in one wave |
| API spec drift | update `01-api-schema.md` and `api-endpoints.md` together |
| staging screenshot missing | keep `implemented_local_runtime_pending`; do not claim visual PASS |

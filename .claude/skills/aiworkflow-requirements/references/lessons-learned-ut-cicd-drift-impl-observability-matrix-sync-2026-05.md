# Lessons Learned — UT-CICD-DRIFT-IMPL-OBSERVABILITY-MATRIX-SYNC（2026-05）

## L-CICD-OBS-001: required status context は confirmed 値を正とする

GitHub Actions の workflow display name、job id、job name、branch protection の required status context は同一ではない。observability matrix や UT-GOV 系に渡す値は GitHub API の confirmed contexts（例: `ci` / `Validate Build` / `verify-indexes-up-to-date`）を正とし、`workflow / job` 形式は候補表示として分離する。

## L-CICD-OBS-002: 対象 workflow と `.github/workflows/` 実体総数を混同しない

本タスク対象は 5 workflow だが、`.github/workflows/` 実体は 8 files。トップ説明では「存在する 5 本」ではなく「対象 5 workflow」と書き、スコープ外 3 files は未タスク委譲先を明記する。

## L-CICD-OBS-003: Phase 12 canonical 7 files は `main.md` + required outputs 6 files と書く

Phase 12 の監査では `main.md` を含めた canonical 7 files と、Task 12-1〜12-6 の required outputs 6 files が混同されやすい。成果物一覧では内訳を先に書き、完了条件も 7 files と 6 outputs の関係を明記する。

## L-CICD-OBS-004: generator が `phase-01.md` を弱く扱う場合は未タスク化する

task-specification-creator LOGS で phase index 生成が弱いことを検出した場合、ログだけに残さず未タスクまたは template 改修へ接続する。今回の follow-up は `TASK-SPEC-PHASE-FILENAME-DETECTION-001` に分離する。

## L-CICD-OBS-005: skill feedback は Promote / Defer / Reject で閉じる

`skill-feedback-report.md` に記録した改善は、同一 wave で該当 skill reference へ昇格するか、未タスクへ分離するか、反映しない根拠を残す。監査 SubAgent は read-only、編集 owner は直列適用に固定する。

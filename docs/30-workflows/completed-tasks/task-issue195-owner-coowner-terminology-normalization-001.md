# task-issue195-owner-coowner-terminology-normalization-001

## Status

- status: resolved (2026-05-02)
- source: issue-195-03b-followup-002-sync-shared-modules-owner Phase 12
- type: docs-only / NON_VISUAL
- resolution: 03a / 03b の active spec（index.md 等）には `主担当` / `サブ担当` のドリフトが存在しないことを grep で確認済み。唯一の出現箇所は `03a/outputs/phase-04/main.md:9`（テスト戦略の表ヘッダ "主担当"）だが、これは Phase 4 の historical evidence log であり AC「Historical logs are not rewritten」により書き換えない。AC1（owner 表へのリンク追加）は本ブランチの `03a/index.md` / `03b/index.md` 変更で達成済み。よって全 AC 充足。

## Purpose

Normalize 03a / 03b specifications from older Japanese terms such as `主担当` / `サブ担当` to the shared `owner` / `co-owner` vocabulary.

## Scope

- Search 03a / 03b workflow documents for ownership terminology drift.
- Replace or annotate ambiguous wording with `owner` / `co-owner`.
- Preserve historical context where the older terms are part of an evidence log.

## Acceptance Criteria

- 03a / 03b current specs link to `docs/30-workflows/_design/sync-shared-modules-owner.md`.
- Current ownership language is consistent across active sections.
- Historical logs are not rewritten in a way that changes past evidence.

## 苦戦箇所（resolution 過程の知見）

出典: `.claude/skills/aiworkflow-requirements/references/lessons-learned-issue-195-03b-followup-sync-shared-modules-owner-2026-05.md` L-ISSUE195FU002-005

- **用語統一を本 wave に含めると scope 越境**: 03a / 03b の Phase 12 を再 open する必要があり、wave スコープを越える。governance design 文書側に「owner = 主担当 / co-owner = サブ担当」の対応表を 1 行追加し、用語統一は別 task として formalize するのが scope-correct。本タスクは resolved 扱いだが、将来の同種タスクは同手順で対応する。
- **Historical evidence と active spec の分離**: `03a/outputs/phase-04/main.md:9` のような Phase output は historical evidence log であり、AC「Historical logs are not rewritten」により書き換え対象外。書き換え対象は current spec（`index.md` 等）のみ。grep で対象ファイルを限定すること。

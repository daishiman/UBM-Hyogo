# Skill Feedback Report

## Template Improvement

No task-specification-creator template change is required. The existing strict 7
and canonical 9 heading rules cover the detected drift.

## Workflow Improvement

Applied in this cycle: a spec-created flat workflow must still include physical
`outputs/phase-12/phase12-task-spec-compliance-check.md`, output artifacts
parity, and a Phase 11 `manual-test-result.md` row with `n/a` status.

## Documentation Improvement

Applied in this cycle: aiworkflow-requirements inventory was updated in the
same wave instead of leaving the new workflow only under `docs/30-workflows/`.
No owning skill rule needs promotion because this is direct application of
existing requirements.

## 苦戦箇所・lessons-learned 候補

本サイクルで詰まった箇所を以下に列挙する。詳細な再発防止策は
aiworkflow-requirements skill 側の
`lessons-learned/20260522-ut-25-deriv-02-sheets-auth-alert-dedup.md`
を相互参照すること。

1. **alert-relay isolateId 遅延生成 (Workers error 10021)** — `crypto.randomUUID()` を
   module top-level で評価すると Workers の validation error 10021 が発生するため、
   isolate 初回 fetch 時に遅延生成する pattern へ修正した。
2. **401 vs 403 切り分け設計** — `SheetsFetchError.status` を classifier に渡し、
   `SHEETS_AUTH_401_KEY_INVALID` / `SHEETS_AUTH_403_FORBIDDEN` /
   `SHEETS_AUTH_OTHER` の 3 値分類とすることで、500/404 が
   `SHEETS_AUTH_OTHER` に流れる false-positive alert を抑止した。
3. **structured log emission の eslint 抑止** — JSON 1 行 emit のため
   `console.log` を許容する必要があり、対象 logger ファイルのみ
   `// eslint-disable-next-line no-console` を明示注記した。
4. **sheets-auth dedup の 10 分窓 3 件目以降 suppress 是正 (2026-05-23 review)** —
   従来の `firstSeen + window` 判定が 3 件目以降を取りこぼしていたため、
   `lastEmitted` ベースに置換し 10 分窓内の連続発火を 1 件に折りたたむ。
5. **rollback-runbook の cross-workflow 逆参照** —
   `completed-tasks/ut-25-cloudflare-secrets-production-deploy/outputs/phase-13/rollback-runbook.md`
   への逆参照リンクを冒頭に追記する運用を採用。completed-tasks 配下を編集する
   際は `physical deletion 2-stage` ルールに従い、`git mv` を伴う移動と
   内容追記を別コミットに分けた。

相互参照: `.claude/skills/aiworkflow-requirements/lessons-learned/20260522-ut-25-deriv-02-sheets-auth-alert-dedup.md`

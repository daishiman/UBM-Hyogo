# Phase 7 成果物: AC-1〜AC-14 × Phase 1〜13 × T × 成果物 マッピング

## 状態

`spec_created` — 本ファイルは Phase 7 仕様書（`../../phase-07.md`）に基づくマッピング表の本体。実走は伴わない。

## 親仕様 AC（index.md §受入条件 より写経）

| ID | 内容 |
| --- | --- |
| AC-1 | 全 package 一律 80%（lines / branches / functions / statements）が `vitest.config.ts` の `coverage.thresholds` で固定されている |
| AC-2 | `scripts/coverage-guard.sh` が新設され、`pnpm -r test:coverage` を実行 → `coverage/coverage-summary.json` を package 単位で集計 → 80% 未達時に exit 1 |
| AC-3 | 80% 未達時、`coverage-guard.sh` は不足ファイル top10 と「追加すべきテスト雛形パス」を stderr に出力 |
| AC-4 | 各 package に `test` / `test:coverage` script が統一フォーマットで定義される |
| AC-5 | `.github/workflows/ci.yml` に `coverage-gate` job が追加され、PR① soft / PR③ hard の 2 段階切替 |
| AC-6 | `lefthook.yml` の pre-push に `coverage-guard` が追加、skip フラグの抜け道なし |
| AC-7 | T0 baseline 計測手順（artifact / package 別未達リスト / Phase 11 証跡化）が仕様化 |
| AC-8 | PR① / PR② / PR③ の 3 段階段取りが Phase 5 / 13 で明記、各 PR の merge 前提条件確定 |
| AC-9 | hard gate 化時の `required_status_checks.contexts` への coverage job 登録手順が UT-GOV-001 / UT-GOV-004 連携で記述 |
| AC-10 | `aiworkflow-requirements/references/quality-requirements-advanced.md` の更新差分（85%/65% → 全 package 80%）が Phase 12 で正本反映 |
| AC-11 | `task-specification-creator/references/coverage-standards.md` から `scripts/coverage-guard.sh` 参照を追記 |
| AC-12 | `apps/web` / `packages/*` のテスト不足が baseline 計測で可視化される手順が Phase 6 / 11 で仕様化 |
| AC-13 | 4 条件（価値性 / 実現性 / 整合性 / 運用性）が Phase 1 と Phase 3 で PASS 確認 |
| AC-14 | Phase 1〜13 が `artifacts.json` の `phases[]` と完全一致（Phase 1〜3 = completed / Phase 4〜13 = pending） |

## AC × Phase 対応マトリクス（空セル禁止）

凡例: `S` = 仕様確定 / `V` = 検証 / `R` = 参照のみ / `-`（許容禁止）

| AC | P1 | P2 | P3 | P4 | P5 | P6 | P7 | P8 | P9 | P10 | P11 | P12 | P13 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| AC-1 | S | S | R | V | S | R | R | R | V | V | V | R | R |
| AC-2 | S | S | R | V | S | V | R | S | V | V | V | R | R |
| AC-3 | S | S | R | R | S | V | R | S | V | V | V | R | R |
| AC-4 | S | S | R | V | S | R | R | S | V | V | R | R | R |
| AC-5 | S | S | R | V | S | R | R | R | V | V | V | R | S |
| AC-6 | S | S | R | R | S | V | R | R | V | V | V | R | R |
| AC-7 | S | S | R | R | R | R | R | R | R | V | V | R | R |
| AC-8 | S | S | R | R | S | R | R | R | V | V | R | R | S |
| AC-9 | S | S | R | R | R | R | R | R | V | V | R | R | S |
| AC-10 | S | S | R | R | R | R | R | R | V | V | R | S | R |
| AC-11 | S | S | R | R | R | R | R | R | V | V | R | S | R |
| AC-12 | S | S | R | R | S | V | R | R | V | V | V | R | R |
| AC-13 | V | R | V | R | R | R | R | R | V | V | R | R | R |
| AC-14 | R | R | R | R | R | R | R | R | V | V | R | R | R |

> 全 14 行 × 13 列 = 182 セルすべて `S` / `V` / `R` のいずれかで埋まっている（空セル 0）。

## AC × T（Phase 4 happy + Phase 6 fail）対応

> T 名は Phase 4 / 6 で確定するため、本表は **T テンプレ ID** で表現。Phase 4 / 6 完了後に実 ID へ置換する。

| AC | happy path（Phase 4） | fail path（Phase 6） |
| --- | --- | --- |
| AC-1 | T-thresholds-set: `vitest.config.ts` の thresholds が 80%/80%/80%/80% で読める | T-thresholds-violation: 79.99% で exit 1 |
| AC-2 | T-guard-happy: 全 package 80% 達成時 exit 0 | T-guard-fail: 1 package 未達で exit 1 |
| AC-3 | T-stderr-empty: 100% 時 stderr に top10 を出さない | T-stderr-format: 未達時 top10 + 雛形パス出力 |
| AC-4 | T-script-presence: 全 package で `pnpm -F <pkg> test:coverage` が success | （N/A） |
| AC-5 | T-ci-soft: PR① で 79% でも CI green | T-ci-hard: PR③ で 79% で CI red |
| AC-6 | T-lefthook-runs: pre-push で coverage-guard が起動 | T-skip-blocked: `LEFTHOOK=0` 等の skip 抜け道で skip されないこと |
| AC-7 | T-baseline-emit: `coverage-baseline-summary.md` 生成 | T-baseline-missing: artifact 欠落時のエラー |
| AC-8 | （N/A） | （N/A） — manual review |
| AC-9 | T-contexts-registered: hard gate 化後 `gh api ... GET` で contexts に coverage 含む | T-contexts-missing: UT-GOV-004 未完了で第 2 段階フォールバック |
| AC-10 | T-doc-diff-applied: quality-requirements-advanced.md に diff 適用 | （N/A） |
| AC-11 | T-doc-ref-added: coverage-standards.md に参照追記 | （N/A） |
| AC-12 | T-uncovered-list: package 別未達ファイルリスト出力 | T-partial-summary: 部分集計欠落時のエラーハンドリング |
| AC-13 | （N/A） — manual review | （N/A） |
| AC-14 | T-artifacts-match: validate-phase-output.js exit 0 | T-artifacts-drift: artifacts.json と phase-NN.md の不整合検出 |

> 全 AC が happy / fail どちらか最低 1 件で被覆（AC-4 / AC-8 / AC-10 / AC-11 / AC-13 は manual review or N/A 許容）。

## AC × 成果物 対応

| AC | 主成果物 |
| --- | --- |
| AC-1 | `vitest.config.ts` / `outputs/phase-05/main.md` |
| AC-2 | `scripts/coverage-guard.sh` / `outputs/phase-05/main.md` |
| AC-3 | `outputs/phase-05/main.md` / `outputs/phase-11/manual-smoke-log.md` |
| AC-4 | `apps/*/package.json` / `packages/*/package.json` / `outputs/phase-05/main.md` |
| AC-5 | `.github/workflows/ci.yml` / `outputs/phase-13/pr1-runbook.md` / `pr3-runbook.md` |
| AC-6 | `lefthook.yml` / `outputs/phase-05/main.md` |
| AC-7 | `outputs/phase-11/coverage-baseline-summary.md` |
| AC-8 | `outputs/phase-13/pr{1,2,3}-runbook.md` |
| AC-9 | `outputs/phase-13/pr3-runbook.md` |
| AC-10 | `outputs/phase-12/system-spec-update-summary.md` |
| AC-11 | `outputs/phase-12/system-spec-update-summary.md` |
| AC-12 | `outputs/phase-11/coverage-baseline-summary.md` |
| AC-13 | `outputs/phase-01/main.md` / `outputs/phase-03/main.md` |
| AC-14 | `artifacts.json` |

## 検証方法分類（再掲）

| 検証方法 | 対応 AC |
| --- | --- |
| unit test (bats / shellspec) | AC-2 |
| integration test (vitest --coverage) | AC-1, AC-4, AC-12 |
| manual smoke | AC-2, AC-3, AC-6, AC-7, AC-9, AC-12 |
| CI artifact 確認 | AC-1, AC-5, AC-7, AC-12 |
| grep / jq | AC-3, AC-4, AC-6, AC-10, AC-11 |
| validate-phase-output.js | AC-14 |
| manual review | AC-8, AC-13 |

## AC 未カバー検出時の対応（6 シナリオ）

1. Phase 7 マトリクス作成中に空セル発見 → 該当 AC を担当 Phase まで戻し設計補強。
2. Phase 9 / 10 GO/NO-GO で AC PASS 不能 → blocker 化、Phase 5 / 6 へ差し戻し。
3. Phase 11 smoke で AC-7 / AC-12 baseline 取得失敗 → NO-GO 条件 #2（30% 下回り）発動、PR② 細分化。
4. Phase 12 で AC-10 / AC-11 正本反映漏れ → `documentation-changelog.md` で差分追記、Phase 13 で再確認。
5. Phase 13 で AC-9 contexts 登録失敗 → UT-GOV-004 完了状況再確認、第 2 段階適用フォールバック。
6. MINOR 発生 → `outputs/phase-12/unassigned-task-detection.md` へ formalize。

## AC-13 / AC-14 の自己検証

- AC-13: Phase 1 §4 条件評価 / Phase 3 §4 条件再評価（最終）の 2 箇所で PASS 引用済み。
- AC-14: `artifacts.json` の `phases[]` 件数 = 13、各 status = `completed`（1〜3）/ `pending`（4〜13）。validate-phase-output.js で機械検証。

## 結論

- 14 AC × 13 Phase の全マッピング空セル 0。
- 全 AC が最低 1 件の T または manual review で検証可能。
- 全 AC が最低 1 件の成果物に紐付き、追跡可能性確保。
- 未カバー検出時の対応手順が 6 シナリオで整備済み。

## 次 Phase

Phase 8 (DRY 化) で本マトリクスを SSOT として参照。

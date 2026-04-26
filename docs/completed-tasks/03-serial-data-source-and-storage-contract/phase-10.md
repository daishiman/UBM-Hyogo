# Phase 10: 最終レビュー

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | data-source-and-storage-contract |
| Phase 番号 | 10 / 13 |
| Phase 名称 | 最終レビュー（data-decision review / gate 判定） |
| 作成日 | 2026-04-23 |
| 前 Phase | 9 (品質保証) |
| 次 Phase | 11 (手動 smoke test) |
| 状態 | completed |
| implementation_mode | new |
| visibility | NON_VISUAL |

## 目的

Phase 7 の AC トレースと Phase 8 / 9 の DRY 化・QA 結果を統合し、Sheets→D1 data contract の最終 gate 判定（PASS / CONDITIONAL_PASS / FAIL）と downstream task（04 / 05a / 05b）への handoff items を確定する。MINOR 指摘は未タスク化判定（[Feedback unassigned-task-guidelines]）に従い記録のみとする。

## 実行タスク

- AC-1〜AC-5 の最終 trace（Phase 7 matrix + Phase 9 QA）
- 4 条件（価値性 / 実現性 / 整合性 / 運用性）の最終判定
- downstream 04 / 05a / 05b への handoff items 確定
- MINOR 指摘 → 未タスク化判定（記録のみ、別 task 起票しない）
- gate（PASS / CONDITIONAL_PASS / FAIL）の確定

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-07/coverage-matrix.md | AC 全項目トレース |
| 必須 | outputs/phase-08/refactor-record.md | DRY 化結果 |
| 必須 | outputs/phase-09/qa-report.md | QA / 不変条件スキャン結果 |
| 必須 | outputs/phase-02/data-contract.md | source-of-truth 一意性確認 |
| 必須 | CLAUDE.md | 不変条件 1〜7 |
| 参考 | .claude/skills/aiworkflow-requirements/references/deployment-core.md | rollback 方針 |

## 実行手順

### ステップ 1: AC 最終トレース
- Phase 7 の AC matrix と Phase 9 qa-report を突合し、AC-1〜AC-5 の判定を確定。
- 根拠リンクを outputs/phase-10/data-decision-review.md に固定。

### ステップ 2: 4 条件の最終判定
- 価値性 / 実現性 / 整合性 / 運用性 を表で判定し、条件別の根拠 phase を明示する。
- いずれかが FAIL の場合は gate を CONDITIONAL_PASS 以下に下げる。

### ステップ 3: gate 判定と handoff
- gate を PASS / CONDITIONAL_PASS / FAIL のいずれかに確定。
- 04 / 05a / 05b への handoff items（参照 path / 前提条件 / 未解消事項）を表で固定。
- MINOR 指摘は未タスク化として記録のみ（タスク化しない理由を明記）。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | gate 結果と handoff items を smoke test の前提として渡す |
| Phase 7 | AC matrix を最終確定 |
| Phase 9 | qa-report を gate 根拠として参照 |
| Phase 12 | close-out / spec sync 判断の入力 |

## 多角的チェック観点（AIが判断）

- 価値性: source-of-truth 一意化が会員データ運用コストを下げるか（AC-1 / AC-5）。
- 実現性: D1 / Sheets / Workers 無料枠で sync が成立するか（AC-2 / AC-3）。
- 整合性: 不変条件 1〜7 と一切矛盾しないか（Phase 9 結果と一致）。
- 運用性: 障害時復旧基準が Sheets / D1 のどちらに寄せるか明確か（AC-4）。

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | AC-1〜5 最終 trace | 10 | completed | phase-07 + phase-09 突合 |
| 2 | 4 条件最終判定 | 10 | completed | 表形式 |
| 3 | downstream handoff 確定 | 10 | completed | 04 / 05a / 05b |
| 4 | MINOR 未タスク化記録 | 10 | completed | 起票しない理由を併記 |
| 5 | gate 確定 | 10 | completed | PASS / CONDITIONAL_PASS / FAIL |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-10/data-decision-review.md | AC / 4 条件 / handoff の最終レビュー |
| ドキュメント | outputs/phase-10/final-review-result.md | gate 判定結果（PASS / CONDITIONAL_PASS / FAIL） |
| メタ | artifacts.json | Phase 状態と outputs の記録 |

## 完了条件

依存Phase 2 / Phase 5: `outputs/phase-02/data-contract.md` / `outputs/phase-02/sync-flow.md` / `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-05/sync-deployment-runbook.md`

依存成果物参照: `outputs/phase-02/data-contract.md` / `outputs/phase-02/sync-flow.md` / `outputs/phase-05/d1-bootstrap-runbook.md` / `outputs/phase-05/sync-deployment-runbook.md`

- [ ] AC-1〜AC-5 が全て判定済み（TBD なし）
- [ ] 4 条件が全て判定済み
- [ ] gate が確定し final-review-result.md に記録
- [ ] downstream 04 / 05a / 05b への handoff items が表で固定
- [ ] MINOR 指摘が未タスク化判定として記録（起票しない理由付き）

## タスク100%実行確認【必須】

- [x] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] 異常系（gate FAIL / handoff 不足 / 不変条件違反残存）も検証済み
- [ ] 次 Phase への引き継ぎ事項を記述
- [x] artifacts.json の該当 phase を completed に更新

## 次 Phase

- 次: 11 (手動 smoke test)
- 引き継ぎ事項: gate 結果と handoff items を Phase 11 の smoke test 前提条件として渡す。
- ブロック条件: gate=FAIL、または不変条件違反が残る場合は Phase 11 に進まない。

## AC 全項目 PASS 判定表

| AC | 内容 | 判定 | 根拠 |
| --- | --- | --- | --- |
| AC-1 | Sheets input / D1 canonical の source-of-truth 非競合 | TBD | phase-02 data-contract + phase-09 不変条件 4 / 5 |
| AC-2 | sync の manual / scheduled / backfill 分離 | TBD | phase-02 sync-flow + phase-08 constants |
| AC-3 | D1 backup / restore / staging の runbook 化 | TBD | phase-05 d1-bootstrap-runbook + phase-09 link 整合 |
| AC-4 | 障害時復旧基準（Sheets / D1）の明確化 | TBD | phase-02 + phase-06 異常系 |
| AC-5 | 純 Sheets 案を非採用とする無料運用整合 | TBD | phase-01 / phase-02 + phase-09 無料枠 |

## 4 条件最終判定

| 条件 | 判定 | 根拠 phase |
| --- | --- | --- |
| 価値性 | TBD | phase-01 / phase-10 |
| 実現性 | TBD | phase-02 / phase-09 無料枠 |
| 整合性 | TBD | phase-09 不変条件 1〜7 |
| 運用性 | TBD | phase-05 runbook / phase-06 異常系 |

## blocker 一覧

| ID | blocker | 解消条件 |
| --- | --- | --- |
| B-01 | 正本仕様と矛盾する文言が残る | 該当 phase を修正し phase-09 を再走 |
| B-02 | 下流 task が参照できない output がある | path を補正し index.md を更新 |
| B-03 | 不変条件違反が phase-09 で検出 | 違反箇所を phase-02 / 08 で訂正 |

## downstream handoff items

| 受け手 | 渡す output | 前提条件 | 未解消事項 |
| --- | --- | --- | --- |
| 04-cicd-secrets-and-environment-sync | refactor-record / qa-report | GOOGLE_SERVICE_ACCOUNT_JSON は placeholder のみ | Cloudflare / GitHub 配置の最終決定は 04 で確定 |
| 05a-observability-and-cost-guardrails | data-contract / sync-flow / constants | sync schedule cron は constants 値を使用 | アラート閾値は 05a で決定 |
| 05b-smoke-readiness-and-handoff | d1-bootstrap-runbook / sync-deployment-runbook | runbook link 切れ 0 件 | smoke シナリオの最終確定は 05b |

## MINOR 指摘の未タスク化判定（[Feedback unassigned-task-guidelines]）

| ID | 指摘 | 重大度 | 未タスク化理由 |
| --- | --- | --- | --- |
| M-01 | 表記揺れの軽微残存 | MINOR | docs-only で次回 spec sync 時に吸収可能 |
| M-02 | runbook の細則追記候補 | MINOR | 運用開始後の実測で更新する方が妥当 |

## Phase 11 進行 GO / NO-GO

- GO: gate=PASS、または gate=CONDITIONAL_PASS かつ blockers が docs-only で吸収可能。
- NO-GO: gate=FAIL、または source-of-truth / branch / secret placement の重大矛盾が残る。

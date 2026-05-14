# Phase 12 — 実装ガイド・ADR・SSOT 同期・未タスク・skill feedback

本 Phase は task-specification-creator の strict 7 file names に従い、`outputs/phase-12/` 配下に `main.md` + 6 補助ファイル + apps/web 用 ADR を残す。

## 1. strict 7 files + apps/web ADR

| # | 成果物 | 責務 | 状態 |
| --- | --- | --- | --- |
| 0 | `outputs/phase-12/main.md` | Phase 12 close-out summary | completed |
| 1 | `outputs/phase-12/implementation-guide.md` | Part 1 中学生レベル + Part 2 技術者レベル | completed |
| 2 | `outputs/phase-12/system-spec-update-summary.md` | SSOT 同期記録（apps/api ADR との対比表） | completed |
| 3 | `outputs/phase-12/documentation-changelog.md` | ドキュメント更新履歴 | completed |
| 4 | `outputs/phase-12/unassigned-task-detection.md` | followup-002 / followup-003 が別 issue 化済みであることを記録、本タスク内未タスク 0 件 | completed |
| 5 | `outputs/phase-12/skill-feedback-report.md` | skill 改善フィードバック | completed |
| 6 | `outputs/phase-12/phase12-task-spec-compliance-check.md` | コンプライアンスチェック | completed |
| 補 | `outputs/phase-12/test-file-suffix-adr-apps-web.md` | apps/web 用 suffix 規約 ADR（実装PRの目標状態・apps/api ADR 対比表含む） | completed |

## 2. 境界

本 workflow は `implementation / NON_VISUAL` で、本サイクルで `implemented_local_evidence_captured`。実 70 ファイル rename / typecheck / lint / web test / verify-design-tokens / Phase 11 evidence / Phase 12 strict 7 files + ADR 作成 はすべて実装段階で実施する。本仕様書はその青写真として機能する。

## 3. apps/web 用 ADR の核心構成

`test-file-suffix-adr-apps-web.md` には以下を含める:

| 節 | 内容 |
| --- | --- |
| Status | Accepted（実装完了時点） |
| Context | apps/api で suffix 規約を確定した経緯（Issue #325）と、apps/web に同等規約を拡張する必要性 |
| Decision | 5 分類（component / runtime / lib-unit）と判別フロー |
| 対比表 | apps/api ADR との構造対比（Phase 7 §1.1 / 1.2 を再掲） |
| Consequences | suite 種別判別性 100%、jsdom / node 環境分離前提整備、apps/api との非対称性解消 |
| Alternatives Considered | (1) apps/api 4 分類流用 → 否決（authz / repository が UI 層に該当しない）、(2) suffix なし維持 → 否決（規約 drift の固定化）|
| 適用範囲 | `apps/web/src/**/*.spec.{ts,tsx}` のみ。`tests/e2e/` / Storybook / Playwright は対象外 |
| 例外 | `route` / `action` / `hook` 専用分類は将来要請で改訂 |
| 参照 | Issue #621 / Issue #325 / followup-002 / followup-003 |

## 4. SSOT 同期対象

| SSOT | 同期内容 |
| --- | --- |
| `docs/00-getting-started-manual/specs/` | 直接更新なし（ADR は `outputs/phase-12/` に配置） |
| `CLAUDE.md` | 同一 wave では変更なし。ADR を本 workflow の Phase 12 正本として配置済み |
| `docs/30-workflows/completed-tasks/issue-325-test-suffix-rename-migration/outputs/phase-12/test-file-suffix-adr.md` | 参照のみ。改訂しない |

## 5. 未タスク検出

Issue #621 の本タスク責務は `apps/web` の rename + ADR に限定する。以下は本仕様書の未完了改善として未タスク化しない（既に別 issue 化済み）:

| 項目 | 状態 |
| --- | --- |
| `packages/**/*.test.ts` の rename | followup-002 として別 issue 化済み（scope-out） |
| `vitest.config.ts` の `*.{test,spec}` から `*.spec` 単独収斂 | followup-003 として別 issue 化済み（scope-out） |
| Storybook / Playwright の suffix 統一 | 別 issue 化対象（必要時に新規 issue）|
| route / action / hook 専用分類追加 | 将来要請時に ADR 改訂で対応 |

`unassigned-task-detection.md` には上記 4 項目と「本タスク内未タスク 0 件」を記録する。

## 6. skill フィードバック

skill feedback は正規名 `outputs/phase-12/skill-feedback-report.md` に記録する。記録項目候補:

- task-specification-creator skill: 親完了タスク（#325）からのフォーマット流用が高速化に寄与した点
- aiworkflow-requirements skill: 関連参照なし（本タスクは仕様書のみで完結）
- github-issue-manager skill: Issue #621 が OPEN 状態であることの確認手順

## 7. implementation-guide.md の構成

| Part | 対象 | 内容 |
| --- | --- | --- |
| Part 1 | 中学生レベル | 「テストファイルの名前を、何の検査かわかる名前に変える作業」「壊れにくい仕組み」「規約とは何か」を 500 字以内で平易に説明 |
| Part 2 | 技術者レベル | 70 ファイル rename の機械的手順、CSV / git mv / glob 同期の I/O 契約、apps/api ADR との関係、followup タスクとのスコープ境界 |

## 8. 完了条件チェック

- [ ] strict 7 files + ADR が `outputs/phase-12/` 配下に存在（実装時）
- [ ] `test-file-suffix-adr-apps-web.md` が apps/api ADR との対比表を含む
- [ ] `unassigned-task-detection.md` に followup-002 / followup-003 / Storybook の scope-out 境界が記録されている
- [ ] `system-spec-update-summary.md` が SSOT 同期対象を明示
- [ ] placeholder token は Phase 12 成果物から除去される
- [ ] `implementation-guide.md` が Part 1 中学生レベル + Part 2 技術者レベルで構成される

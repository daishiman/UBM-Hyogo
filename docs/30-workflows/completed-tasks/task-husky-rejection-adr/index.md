# task-husky-rejection-adr — タスク仕様書 index

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-husky-rejection-adr |
| ディレクトリ | docs/30-workflows/completed-tasks/task-husky-rejection-adr |
| 実行種別 | documentation |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | documentation |
| 状態 | pending_user_approval |
| GitHub Issue | #139 (CLOSED) |
| 派生元 | task-git-hooks-lefthook-and-post-merge Phase 12 |
| 作成日 | 2026-04-28 |
| 担当 | unassigned |

## 目的

`task-git-hooks-lefthook-and-post-merge` Phase 2 design / Phase 3 review に分散している「Git hook ツールに lefthook を採用、husky を不採用」の判断を ADR として独立化し、リポジトリ全体の ADR 集約場所に配置する。workflow outputs から ADR への trace を確立し、将来の hook ツール再評価時に判断履歴が辿れる状態を作る。

## スコープ

### 含む

- ADR 集約先ディレクトリの決定（`doc/decisions/` 新設 or 既存箇所活用）
- ADR-0001「Git hook ツールに lefthook を採用、husky を不採用」の執筆（Context / Decision / Consequences / Alternatives Considered）
- husky / pre-commit / native git hooks との比較・不採用理由の整理
- `task-git-hooks-lefthook-and-post-merge` の outputs（Phase 2 design / Phase 3 review）から ADR への参照リンク追加

### 含まない

- 他の設計判断（D1, Auth.js, Hono 等）の ADR 化
- `lefthook.yml` 設定そのものの変更
- workflow outputs の内容書き換え（ADR への参照リンク追加のみ）
- ADR テンプレート自体の標準化（本タスクで初版を確立するのみで、フォーマット標準化は別タスクで実施）

## Phase一覧

| Phase | 名前 | ファイル | 状態 | 主成果物 |
| --- | --- | --- | --- | --- |
| 1 | 要件定義 | phase-01.md | completed | outputs/phase-1/main.md |
| 2 | 設計 | phase-02.md | completed | outputs/phase-2/main.md, outputs/phase-2/design.md |
| 3 | 設計レビュー | phase-03.md | completed | outputs/phase-3/main.md, outputs/phase-3/review.md |
| 4 | テスト設計 | phase-04.md | completed | outputs/phase-4/main.md, outputs/phase-4/test-matrix.md |
| 5 | 実装ランブック | phase-05.md | completed | outputs/phase-5/main.md, outputs/phase-5/runbook.md |
| 6 | テスト拡充 | phase-06.md | completed | outputs/phase-6/main.md, outputs/phase-6/failure-cases.md |
| 7 | カバレッジ確認 | phase-07.md | completed | outputs/phase-7/main.md, outputs/phase-7/coverage.md |
| 8 | リファクタリング | phase-08.md | completed | outputs/phase-8/main.md, outputs/phase-8/before-after.md |
| 9 | 品質保証 | phase-09.md | completed | outputs/phase-9/main.md, outputs/phase-9/quality-gate.md |
| 10 | 最終レビュー | phase-10.md | completed | outputs/phase-10/main.md, outputs/phase-10/go-no-go.md |
| 11 | 手動テスト | phase-11.md | completed | outputs/phase-11/main.md, outputs/phase-11/manual-smoke-log.md, outputs/phase-11/link-checklist.md |
| 12 | ドキュメント更新 | phase-12.md | completed | outputs/phase-12/main.md, outputs/phase-12/implementation-guide.md, outputs/phase-12/system-spec-update-summary.md, outputs/phase-12/documentation-changelog.md, outputs/phase-12/unassigned-task-detection.md, outputs/phase-12/skill-feedback-report.md, outputs/phase-12/phase12-task-spec-compliance-check.md |
| 13 | 完了確認 | phase-13.md | pending_user_approval | outputs/phase-13/main.md, outputs/phase-13/local-check-result.md, outputs/phase-13/change-summary.md, outputs/phase-13/pr-template.md |

## 依存関係

| 種別 | 対象 | 理由 |
| --- | --- | --- |
| 上流 | task-git-hooks-lefthook-and-post-merge | Phase 2 design ADR-01 / Phase 3 review 第5節が ADR 化対象の原典 |
| 上流参照 | `lefthook.yml` | 現行採用構成を ADR の Decision セクションで参照 |
| 上流参照 | `doc/00-getting-started-manual/lefthook-operations.md` | hook 運用要件の現状を ADR Context に反映 |
| 下流 | 他設計判断の ADR 化（別タスク） | 本タスクで確立する ADR 集約場所・命名規約を踏襲する |

## 主要な参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `.claude/skills/task-specification-creator/SKILL.md` | タスク仕様書のフォーマット・Phase 定義 |
| 必須 | `.claude/skills/aiworkflow-requirements/SKILL.md` | システム正本仕様の参照規約 |
| 必須 | `docs/30-workflows/completed-tasks/task-husky-rejection-adr.md` | unassigned-task 期の原典指示書（Why / What / How の出典） |
| 必須 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-2/design.md` | ADR-01 派生元 |
| 必須 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-3/review.md` | 第5節（採否レビュー）派生元 |
| 必須 | `docs/30-workflows/completed-tasks/task-git-hooks-lefthook-and-post-merge/outputs/phase-12/unassigned-task-detection.md` | B-2 検出記録（本タスクの発掘経路） |
| 必須 | `lefthook.yml` | 現行 hook 構成の確認 |
| 必須 | `doc/00-getting-started-manual/lefthook-operations.md` | 現行運用ドキュメント |
| 参考 | `CLAUDE.md` | プロジェクト全体規約 |

## 受入条件 (AC)

- AC-1: ADR 集約ディレクトリ（`doc/decisions/` 新設 or 既存箇所活用のいずれか）が一意に確定し、命名規約 `NNNN-<slug>.md` が定義されている。
- AC-2: ADR-0001（`0001-git-hook-tool-selection.md` 等）が Context / Decision / Consequences / Alternatives Considered / References を全て埋めて存在する。
- AC-3: husky / pre-commit / native git hooks の不採用理由が Alternatives Considered に明記されている。
- AC-4: `task-git-hooks-lefthook-and-post-merge` の Phase 2 design ADR-01 セクションおよび Phase 3 review 第5節から ADR-0001 への相対リンクが追記されている。
- AC-5: ADR-0001 単独で読んでも判断履歴が完結しており、workflow outputs に依存しない。
- AC-6: 既存 `lefthook.yml` / `doc/00-getting-started-manual/lefthook-operations.md` と ADR の Decision が矛盾しない。

## 完了条件

- [ ] 13 Phase の仕様書（phase-01.md〜phase-13.md）が揃っている。
- [ ] Phase 13 はユーザー承認待ちを維持している。
- [ ] artifacts.json / outputs/artifacts.json の outputs 定義と本ファイルの Phase 一覧が一致している。
- [ ] ユーザー承認なしの commit / push / PR 作成を行わない。

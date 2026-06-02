# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | `pnpm indexes:rebuild` の fail-fast / atomic write / decisive log 保証 (issue-229-indexes-rebuild-fail-fast) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-05-31 |
| 前 Phase | 11 (手動 smoke test / CLI 回帰検証) |
| 次 Phase | 13 (PR 作成) |
| 状態 | completed |
| 実装区分 | 実装仕様書 |
| タスク種別 | implementation / implementation_mode: new / visualEvidence: NON_VISUAL / scope: tooling |

## 目的

task-specification-creator の Phase 12 必須 5 タスク + 準拠チェックを実行し、`generate-index.js` の fail-fast / atomic write / decisive log hardening を理解・検証できるドキュメント群を整備する。本ワークフローは **implemented_local_evidence_captured** として実コード変更（`generate-index.js` 編集 + 新規 spec test）まで今回の実装サイクルで完了した。UI/UX 変更がない NON_VISUAL tooling タスクのため、Phase 11 スクリーンショットは不要で、代替証跡（CLI 回帰検証 + 自動テスト）に置き換える。

## 実行タスク

1. 実装ガイドを作成する（Part 1 中学生レベル + Part 2 技術者レベル / `## 視覚証跡` で screenshot 不要を明記）。
2. システム仕様書更新サマリーを作成し、新規インターフェース有無を判定する（generate-index.js の内部 helper 追加・公開 API/型変更なし → Step 2 N/A だが理由を明記）。
3. ドキュメント更新履歴を作成する（Step 1-A / 1-B / 1-C / Step 2 を個別に記録。「該当なし」も明記）。
4. 未タスク検出レポートを作成する（current / baseline 分離・1 件候補を記録）。
5. スキルフィードバックレポートを作成する（改善点なしでも必須出力）。
6. Phase 12 タスク仕様準拠チェックを root evidence として作成する（canonical 9 見出し逐語一致）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-spec.md | Phase 12 必須 5 タスク |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-pitfalls.md | 漏れ防止 |
| 必須 | （本ワークフロー）phase-02.md | hardening 設計（helper シグネチャ / atomic write / byte-identical） |
| 必須 | （本ワークフロー）phase-11.md / outputs/phase-11/main.md | CLI 回帰 smoke の代替証跡基準 |
| 必須 | .claude/skills/aiworkflow-requirements/references/spec-guidelines.md | 正本仕様更新ルール |

## 実行手順

1. Phase 11 の代替証跡計画（CLI 回帰 smoke / 自動テスト）を読み、close-out 範囲を確定する。
2. Phase 12 必須 7 成果物を `outputs/phase-12/` に作成する。
3. NON_VISUAL のため Phase 11 スクリーンショット参照は作らず、`manual-test-result.md` + 自動テストを代替証跡として記録する。
4. canonical 9 見出しを逐語で `phase12-task-spec-compliance-check.md` に配置し、各判定に `implemented_local_evidence_captured` を suffix する。

## 多角的チェック観点（AIが判断）

- 7 成果物のうち 0 件レポート系（未タスク検出 / skill feedback）を省略していないか。
- 正本仕様（aiworkflow-requirements）と workflow outputs に情報が二重化していないか。
- implementation close-out と user-gated 操作（commit / push / PR / Issue mutation）を混同していないか。
- NON_VISUAL の Phase 11 代替証跡が各成果物で整合しているか。

## サブタスク管理

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | 実装ガイド | completed | Part 1 / 2 + 視覚証跡節 |
| 2 | システム仕様書更新サマリー | completed | Step 2 N/A（理由明記） |
| 3 | ドキュメント更新履歴 | completed | Step 1-A/1-B/1-C/Step 2 |
| 4 | 未タスク検出 | completed | current/baseline 分離・1 件 |
| 5 | skill feedback | completed | 改善点なしでも出力 |
| 6 | 準拠チェック | completed | canonical 9 見出し逐語 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| サマリー | outputs/phase-12/main.md | Phase 12 全体まとめ |
| 実装ガイド | outputs/phase-12/implementation-guide.md | Part 1 / Part 2 + 視覚証跡 |
| 仕様更新 | outputs/phase-12/system-spec-update-summary.md | 新規インターフェース判定（Step 2 N/A） |
| 更新履歴 | outputs/phase-12/documentation-changelog.md | Step 1-A/1-B/1-C/Step 2 |
| 未タスク | outputs/phase-12/unassigned-task-detection.md | current/baseline 分離・1 件 |
| skill feedback | outputs/phase-12/skill-feedback-report.md | 改善点なしでも出力 |
| 準拠チェック | outputs/phase-12/phase12-task-spec-compliance-check.md | canonical 9 見出し root evidence |

## 完了条件

- [x] Phase 12 必須 5 タスクがすべて完了
- [x] 必須 7 成果物がすべて配置済み
- [x] 新規インターフェース有無（Step 2 N/A）が理由付きで明記されている
- [x] NON_VISUAL の Phase 11 代替証跡が implementation-guide.md `## 視覚証跡` に明記されている
- [x] implementation close-out と user-gated 操作の境界が明記され、ローカル実装完了を主張している

## タスク100%実行確認【必須】

- [x] 全実行タスク（6 件）が completed
- [x] 成果物が `artifacts.json` の outputs（phase=12）と一致
- [x] canonical 9 見出しが逐語で配置され、各 AC/Step 判定に `implemented_local_evidence_captured` suffix が付く

## 次 Phase への引き渡し

- 次 Phase: 13 (PR 作成 / pending_user_approval)
- 引き継ぎ事項: Phase 12 成果物一式 / byte-identical 不変条件 / commit・push・PR はユーザー承認待ち
- ブロック条件: canonical 9 見出しの drift / 実装完了を主張する誤記

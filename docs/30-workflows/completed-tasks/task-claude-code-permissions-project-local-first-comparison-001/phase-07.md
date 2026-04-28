# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-claude-code-permissions-project-local-first-comparison-001 |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 |
| 下流 | Phase 8 (リファクタリング) |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |
| 状態 | pending |

## 目的

本タスクは docs-only / spec_only のため、line / branch coverage は N/A。代わりに **受入条件 AC-x（index.md と同期） × 出力ドキュメント** の行列で「比較表 / rollback 手順 / ハンドオフメモ」が要件を 100% trace できているかを可視化する。

## 真の論点

- AC-x が比較表（Phase 5 `comparison.md`）と verification テストケース（TC-01〜TC-04 / TC-F / TC-R）の双方から trace 可能であること
- 「採用方針 1 案確定」が比較表の根拠ロジックに紐付くこと
- 未カバー要件 0 件、または保留扱い（deny 検証タスク待ち）の理由が明示されていること

## 受入条件 × 出力ドキュメント トレーサビリティ行列

| AC | 概要 | 設計 (Phase 1〜3) | 実装 (Phase 5) | テスト (Phase 4) | 補助 (Phase 6) |
| --- | --- | --- | --- | --- | --- |
| AC-1 | 4 層責務表 | Phase 1 成果物 | `comparison.md` Section 1 | TC-01 / TC-02 | TC-R-01 |
| AC-2 | project-local-first の再発判定 | Phase 2 再発判定メモ | `comparison.md` Section 2 | TC-01 | TC-F-01 |
| AC-3 | 3 案 × 5 軸の比較表 | Phase 3 評価軸定義 | `comparison.md` Section 3 | TC-02 / TC-03 | TC-F-02 |
| AC-4 | 採用方針 1 案確定 | Phase 4 ハンドオフ設計 | `comparison.md` Section 6 / `main.md` | TC-02 / TC-03 | - |
| AC-5 | global 採用時 rollback 手順 | Phase 3 rollback 設計 | `comparison.md` Section 4 | TC-04 | - |
| AC-6 | 他プロジェクト副作用一覧（`scripts/cf.sh` / `op run` / 他 worktree） | Phase 1 / Phase 3 | `comparison.md` Section 5 | TC-02 / TC-04 | TC-F-02 |
| AC-7 | apply タスクへのハンドオフ箇条書き | Phase 4 | `comparison.md` Section 6 | - | - |
| AC-8 | NON_VISUAL 証跡 | - | `outputs/phase-5/main.md` | `outputs/phase-4/test-scenarios.md` | `outputs/phase-6/main.md` |

## 追加カバレッジ確認

### Phase 3 シナリオ A〜D との対応

| シナリオ | 概要 | 比較表での記載箇所 |
| --- | --- | --- |
| シナリオ A | 案 A / B 双方で最終値が変わらないケース | Section 3「影響半径」「再発リスク」 |
| シナリオ B | 案 A / B 双方で最終値が変わらない（local 値支配）ケース | Section 3「影響半径」 |
| シナリオ C | fresh 環境で案 A 採用時に bypass 化するケース | Section 3「fresh 環境挙動」/ TC-03 |
| シナリオ D | 他 worktree / 他リポジトリで最終値が変化するケース | Section 5 他プロジェクト副作用一覧 / TC-F-02 |

### 関連タスク参照のカバレッジ

- `task-claude-code-permissions-decisive-mode`（前提）→ Phase 3 / Phase 12 成果物リンクが比較表に存在
- `task-claude-code-permissions-apply-001`（後続）→ ハンドオフ箇条書きが Section 6 に存在
- `task-claude-code-permissions-deny-bypass-verification-001`（並行）→ TC-R-02 で結果到着後の更新手順を記述

## カバレッジ目標

- AC-1〜AC-10 全件に対し、設計 + 実装 + テストで 100% trace
- 未カバー 0 件（保留扱いの場合は理由を併記し、解消トリガーとなる関連タスクを明記）

## 主成果物

- `outputs/phase-7/main.md`（カバレッジ行列）

## 完了条件

- [ ] AC × 出力ドキュメント の行列が `outputs/phase-7/main.md` に記載されている
- [ ] Phase 3 シナリオ A〜D との対応が明示されている
- [ ] 未カバー 0 件、または保留理由（deny 検証タスク待ち）が明示されている
- [ ] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 実行タスク

- 本文に記載済みのタスクを実行単位とする
- docs-only / spec_only の境界を維持する（実書き換えは行わない）

## 参照資料

- Phase 4: `outputs/phase-4/` を参照する
- Phase 5: `outputs/phase-5/` を参照する
- Phase 6: `outputs/phase-6/` を参照する
- ソース MD: `docs/30-workflows/completed-tasks/task-claude-code-permissions-project-local-first-comparison-001.md` §5
- 関連タスク: `task-claude-code-permissions-decisive-mode` / `task-claude-code-permissions-apply-001` / `task-claude-code-permissions-deny-bypass-verification-001`
- `.claude/skills/task-specification-creator/SKILL.md`

## 成果物/実行手順

- `artifacts.json` の該当 Phase outputs を正本とする
- `outputs/phase-7/main.md` を作成し、AC × 出力ドキュメントのカバレッジ行列を記録する

## 統合テスト連携

本タスクは docs-only / NON_VISUAL のため、line/branch coverage に代えて受入条件 × 出力ドキュメントの行列でカバレッジを担保する。実機検証は `task-claude-code-permissions-apply-001` で実施。

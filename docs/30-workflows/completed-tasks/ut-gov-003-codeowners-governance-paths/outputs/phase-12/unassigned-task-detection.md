# Unassigned task detection — UT-GOV-003 CODEOWNERS

> **0 件でも出力必須**ルール適用。current / baseline を分離し、baseline 最低 2 件・current 最低 1 件を記録。

## 区分定義

- **baseline**: 本タスク Phase 1〜11 の外側で既に独立タスクとして起票済 / 既知の派生タスク群。本タスクの未タスク検出ではカウントしないが、関連タスクとして双方向リンクのため列挙する。
- **current**: 本タスク Phase 1〜11 で新規に発見した派生課題。大きな課題のみ `docs/30-workflows/unassigned-task/` への新規起票 or 既存関連タスク (UT-GOV-001/002/004/005) への申し送りで対応する。

---

## baseline（既知の派生タスク群・最低 2 件）

| ID | タスク名 | 区分 | 関連 |
| --- | --- | --- | --- |
| B-1 | UT-GOV-001-github-branch-protection-apply | 既存タスク | branch protection 本適用。CODEOWNERS が整備されていることが前提（require_code_owner_reviews は本タスクで非有効化方針確認） |
| B-2 | UT-GOV-002-pr-target-safety-gate-dry-run | 既存タスク | PR target safety gate。governance workflow パス (`.github/workflows/**`) の owner 指定との整合 |
| B-3 | UT-GOV-004-required-status-checks-context-sync | 既存タスク | `.github/workflows/**` の status check context 名整合。CODEOWNERS-validator 採用時の context 名連携 |
| B-4 | UT-GOV-005-docs-only-nonvisual-template-skill-sync | 既存タスク | docs パス整備 / aiworkflow-requirements の governance section 追記 / README 整備が本タスクで N/A 判定の場合の受け皿 |

---

## current（本タスク Phase 1〜11 で発見した派生課題）

| ID | 検出項目 | 種別 | 推奨対応 | 割り当て先候補 |
| --- | --- | --- | --- | --- |
| C-1 | CI で `codeowners-validator` action 導入の検討（`.github/workflows/verify-codeowners.yml` 新規 / on: pull_request で `gh api .../codeowners/errors` を gate） | 新規未タスク | `docs/30-workflows/unassigned-task/task-codeowners-validator-ci.md` を本 PR と同 sprint または後続で起票 | unassigned-task → UT-GOV-004 と context 統合 |
| C-2 | UT-GOV-004（required status checks context sync）と CODEOWNERS-validator workflow の context 名整合（`required_status_checks.contexts` に追加する name の合意） | 既存タスク連携 | UT-GOV-004 の Phase 12 unassigned-task-detection に申し送り | UT-GOV-004 |
| C-3 | Phase 11 link-checklist.md の N/A 9 件（関連 UT-GOV-001/002/004/005 タスク仕様書との双方向リンク補完） | 新規未タスク（小） | 関連 UT-GOV タスクの仕様書整備 PR でそれぞれ本タスクへの双方向リンクを追加 | 各 UT-GOV タスク |
| C-4 | `doc/` 文字列の広域残置（過去 workflow / changelog / archive / 旧リンク）の allow-list 化とリンク切れ修正 | 新規未タスク | 現在の正規実フォルダは `docs/00-getting-started-manual/`。広域残置を履歴引用 / 修正対象 / 外部参照に分類し、必要な実リンクだけ同 wave で修正 | UT-GOV-005 と統合検討 |
| C-5 | 将来 `require_code_owner_reviews=true` 有効化への移行 runbook 化（contributor 体制移行時の判断材料） | 新規未タスク（低優先度） | solo 運用解消の予兆が見えた時点で起票 | unassigned-task（低優先度） |

---

## 設計タスクパターン 4 種の確認

| パターン | 該当 | 内容 |
| --- | --- | --- |
| 型 → 実装 | N/A | 本タスクは GitHub governance のみで型実装は無関係 |
| 契約 → テスト | 部分該当 | CODEOWNERS は GitHub の契約。`gh api .../codeowners/errors` が「契約のテスト」に相当 |
| UI 仕様 → コンポーネント | N/A | NON_VISUAL タスクのため非該当 |
| 仕様書間差異 | 該当 | `doc/` `docs/` 表記揺れが本タスクの中核。C-4 で扱い継続 |

---

## サマリー

| 区分 | 件数 |
| --- | --- |
| baseline | 4 件（B-1〜B-4） |
| current | 5 件（C-1〜C-5） |
| 合計 | 9 件 |

> baseline 4 件・current 5 件で「最低 baseline 2 件 / current 1 件」のルールを満たす。

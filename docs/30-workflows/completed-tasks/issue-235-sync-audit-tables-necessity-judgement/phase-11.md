# Phase 11: 再現コマンド手動検証（NON_VISUAL）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 11 / 13 |
| 種別 | docs-only / NON_VISUAL（設計判定） |
| 前 Phase | 10（最終レビュー） |
| 次 Phase | 12（ドキュメント更新） |
| 主成果物 | outputs/phase-11/manual-test-result.md |
| 補助成果物 | outputs/phase-11/reproduction-verification.md |

## NON_VISUAL 宣言

- タスク種別: 設計判定（docs-only）。Renderer / UI コンポーネント変更なし。
- 非視覚的理由: 成果物は判定証跡（ドキュメント）であり、画面表示の変化が一切ない。
- 代替証跡: 再現コマンド（rg/grep）の実行記録を `manual-test-result.md` に一次証跡として集約し、`reproduction-verification.md` で判定前提（現行 ledger 存在・`sync_audit_*` 非存在）を再確認する。
- **UI/UX変更なしのため Phase 11 スクリーンショット不要**。screenshot ディレクトリは作成しない。

## 目的

判定の前提（現行 `sync_jobs` / `sync_job_logs` / `metrics_json` zod が存在し、`sync_audit_logs` / `sync_audit_outbox` はコードに存在しない）が、最新コードで崩れていないことを再現コマンドで 0 差分確認する。

## 実行タスク

1. **再現コマンド実行**: Phase 4 raw-evidence.md の検索コマンドを実行し、`sync_audit_*` が `apps/` 配下 0 件、`sync_jobs` 定義が存在することを確認する。
2. **docs-only 実証**: `git status --short apps packages` が 0 件であることを記録する。
3. **一次証跡集約**: `manual-test-result.md` にテスト件数サマリ / edge case / 仕様判断根拠 / 実行記録を集約する。
4. **再現確認**: `reproduction-verification.md` に「コマンド / 前提条件 / 期待結果 / 実結果」を記録する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] `manual-test-result.md` を 1 ファイル集約の正本として作成
- [ ] 再現コマンドを「コマンド / 前提条件 / 期待結果 / 実結果」で記録
- [ ] `git status --short apps packages` 0 件を記録（docs-only 実証）
- [ ] screenshot ディレクトリを作成しない
- [ ] 固定フレーズ「UI/UX変更なしのため Phase 11 スクリーンショット不要」を明記

## 成果物/実行手順

- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-11/reproduction-verification.md`

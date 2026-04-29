# Phase 4 Output: テスト設計

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 4 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 3 |
| 下流 | Phase 5（実装 = 比較表本体） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

本タスクは spec_only / docs-only / NON_VISUAL のため、TDD 対象のコードは存在しない。「テスト」は **比較表（4 層 × 5 軸）と採用方針の検証シナリオ** であり、ソース MD §6 の TC-01〜TC-04 を主とする手動レビューシナリオで成立する。実 settings / shell alias の書き換えは禁止し、読み取り専用または公式仕様引用のみで合否判定する。

## 1. 方針

| 項目 | 内容 |
| --- | --- |
| 検証単位 | 4 段階の手動レビュー（TC-01〜TC-04） + 補助回帰観点（Phase 6 で TC-F-* / TC-R-* に拡充） |
| 判定基準 | 各 TC の期待結果と一致するエビデンスが Phase 5 比較表 / 公式仕様 / 読み取り専用観測ログに揃っていること |
| 失敗時挙動 | 対応する Phase 5 セクションを修正、または Phase 3 にループバック |
| 環境ブロッカー | `task-claude-code-permissions-deny-bypass-verification-001` 未着の場合、alias 強化を含む TC は CONDITIONAL ACCEPT |

## 2. テストシナリオ（要約。詳細は `test-scenarios.md`）

| TC | 概要 | 出典 / 確認方法 |
| --- | --- | --- |
| TC-01 | project-local-first 単独で fresh プロジェクトの `defaultMode` が bypass を維持するか | 公式 docs 引用 + Phase 3 R-2 結論 |
| TC-02 | 案 A 適用後、シナリオ A / B の最終 `defaultMode` が変化しないこと | 階層優先順位の評価過程 |
| TC-03 | 案 A 適用後、fresh 環境（シナリオ C / D）で意図せず bypass 化することの許容判断 | 個人開発マシン前提 + deny 検証依存 |
| TC-04 | rollback 手順 dry-run（実行禁止、読み合わせのみ） | Phase 5 Section 4 のコマンド列 |

## 3. 受入条件 traceability（AC × TC）

| AC（index.md と同期） | 概要 | 紐付け TC |
| --- | --- | --- |
| AC-1 | 4 層責務表 | TC-01 / TC-02 |
| AC-2 | project-local-first の再発判定 | TC-01 |
| AC-3 | 3 案 × 5 軸の比較表 | TC-02 / TC-03 |
| AC-4 | 採用方針 1 案確定 | TC-02 / TC-03 |
| AC-5 | global 採用時 rollback 手順 | TC-04 |
| AC-6 | 他プロジェクト副作用一覧（`scripts/cf.sh` / `op run` / 他 worktree） | TC-02 / TC-03 / TC-04 |
| AC-7 | Phase 3 シナリオ A〜D 対応 | TC-02 / TC-03 |
| AC-8 | NON_VISUAL のため Phase 11 はスクリーンショット不要、`manual-smoke-log.md` を主証跡 | Phase 11 で確認 |
| AC-9 | Phase 12 必須成果物 + apply タスク参照欄追記依頼 | Phase 12 で確認 |
| AC-10 | `task-claude-code-permissions-decisive-mode` の Phase 3 / 12 リンク | Phase 5 / 12 で確認 |

## 4. エッジケース（Phase 6 で拡充）

| EC | シナリオ | 期待 |
| --- | --- | --- |
| EC-01 | deny 検証タスク未着で本タスク完了 | 比較表に「deny 実効性」軸を保留扱いで明示し、結果到着後に追記する旨を残す |
| EC-02 | `~/dev` 配下に `defaultMode` 明示プロジェクトが存在 | grep で全件列挙し、案 A 採用後の最終値変化有無を表化（実値は記録しない） |
| EC-03 | fresh 環境で `~/.claude/settings.json` 自体が未配置 | 公式 docs の組み込み default を引用し、bypass 化リスクを評価 |

## 5. 証跡フォーマット

`outputs/phase-4/test-scenarios.md` にチェックリスト形式で記録。各 TC について:

- 実施日時（Phase 11 手動レビュー時に記録）
- 参照したコマンド or 引用 URL（読み取りのみ）
- 期待結果 / 実観測結果
- PASS / FAIL / BLOCKED
- 環境ブロッカー（deny 検証タスク未着など）は別カテゴリで記録

## 6. スコープ外

- 自動テスト（settings ファイルは Claude プロセス再起動が必要、かつ本タスクは spec_only）
- bypass モード下の deny 実効性検証（→ `task-claude-code-permissions-deny-bypass-verification-001`）
- 実 `~/.claude/settings.json` / `~/.zshrc` の書き換え（→ `task-claude-code-permissions-apply-001`）

## 7. 完了条件チェック

- [x] TC-01〜TC-04 を `test-scenarios.md` に記載
- [x] AC × TC のトレーサビリティ表を本ファイルに記載
- [x] 本文と `artifacts.json` の Phase outputs が矛盾しない

## 8. 次 Phase へのハンドオフ

- Phase 5 比較表 Section 1〜6 の章立て確定（TC との対応を Section 注釈に書く）
- Phase 6 で TC-F-01 / TC-F-02 / TC-R-01 / TC-R-02（fail path / 回帰 guard）を追加
- Phase 11 で TC-01〜TC-04 を手動レビューし `manual-smoke-log.md` に PASS/FAIL を記録

## 9. 参照資料

- `phase-04.md`
- `outputs/phase-3/main.md` / `impact-analysis.md`
- ソース MD §6 検証手順

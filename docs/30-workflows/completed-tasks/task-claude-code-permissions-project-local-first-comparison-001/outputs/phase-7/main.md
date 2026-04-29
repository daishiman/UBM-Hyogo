# Phase 7 Output: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 7 / 13 |
| 作成日 | 2026-04-28 |
| 上流 | Phase 6 |
| 下流 | Phase 8（リファクタリング） |
| visualEvidence | NON_VISUAL |
| workflow | spec_only / docs-only |

## 0. 結論サマリ

AC-1〜AC-10 のすべてについて、対応成果物・対応 TC・充足判定をトレースした。**全 10 件 PASS（または該当 Phase で完了予定）**。本タスクは spec_only / docs-only / NON_VISUAL のため、コードカバレッジ計測は対象外。代替として「AC × 成果物 × TC」の充足トレースを行う。

## 1. AC × 成果物 × TC トレース表

| AC | 概要 | 対応成果物 | 紐付け TC | 充足判定 |
| --- | --- | --- | --- | --- |
| AC-1 | 4 層責務表 | `outputs/phase-2/layer-responsibility-table.md`, `outputs/phase-5/comparison.md` Section 1 | TC-01 / TC-02 | PASS |
| AC-2 | project-local-first 再発判定 | `outputs/phase-3/main.md` §2, `outputs/phase-5/comparison.md` Section 2 | TC-01, TC-F-01 | PASS（再発する判定） |
| AC-3 | 3 案 × 5 軸の比較表 | `outputs/phase-5/comparison.md` Section 3 | TC-02 / TC-03 | PASS |
| AC-4 | 採用方針 1 案確定 | `outputs/phase-5/main.md` §0, `outputs/phase-5/comparison.md` Section 6 | TC-02 / TC-03 | PASS（ハイブリッド採用） |
| AC-5 | global 採用時 rollback 手順 | `outputs/phase-5/comparison.md` Section 4 | TC-04 | PASS |
| AC-6 | 他プロジェクト副作用一覧 | `outputs/phase-3/impact-analysis.md`, `outputs/phase-5/comparison.md` Section 5 | TC-02 / TC-03 / TC-04 / TC-F-02 | PASS |
| AC-7 | Phase 3 シナリオ A〜D 対応 | `outputs/phase-3/impact-analysis.md` §2, `outputs/phase-5/comparison.md` Section 3.2 | TC-02 / TC-03 | PASS |
| AC-8 | NON_VISUAL のため Phase 11 はスクリーンショット不要、`manual-smoke-log.md` を主証跡 | `outputs/phase-11/manual-smoke-log.md` | Phase 11 で完了 | Phase 11 完了時に PASS |
| AC-9 | Phase 12 必須成果物 + apply タスク参照欄追記依頼 | `outputs/phase-12/*`（7 種） | Phase 12 で完了 | Phase 12 完了時に PASS |
| AC-10 | `task-claude-code-permissions-decisive-mode` Phase 3 / 12 リンク | `index.md`, `artifacts.json`, `outputs/phase-3/`（リンク先あり） | - | PASS |

## 2. TC × 成果物カバレッジ

| TC | 概要 | 主成果物 | 補強成果物 |
| --- | --- | --- | --- |
| TC-01 | project-local-first 再発判定 | `comparison.md` §2 | `phase-3/main.md` |
| TC-02 | シナリオ A / B 不変 | `comparison.md` §3.2 | `impact-analysis.md` §2 |
| TC-03 | fresh 環境許容判断 | `comparison.md` §3.1 / §6 | `impact-analysis.md` §6 |
| TC-04 | rollback 手順 dry-run | `comparison.md` §4 | - |
| TC-F-01 | 新 worktree 再発検出 | `phase-6/main.md` §1 | - |
| TC-F-02 | 案 A 他プロジェクト副作用検出 | `phase-6/main.md` §2 | `impact-analysis.md` §3.4 |
| TC-R-01 | global / global.local 不整合 guard | `phase-6/main.md` §3 | - |
| TC-R-02 | deny 検証結果到着後の更新 guard | `phase-6/main.md` §4 | `phase-12/unassigned-task-detection.md` |

## 3. ギャップ分析

| 項目 | 状態 | 対応 |
| --- | --- | --- |
| `--dangerously-skip-permissions` の deny 実効性検証 | 本タスク範囲外 | `task-claude-code-permissions-deny-bypass-verification-001` に委譲（cross_task_order に明記） |
| `scripts/new-worktree.sh` テンプレ配置 | 未タスク化候補 | Phase 12 `unassigned-task-detection.md` に記録 |
| MCP server / hook permission 検証 | スコープ外 | Phase 12 `unassigned-task-detection.md` に記録 |

## 4. 完了条件チェック

- [x] AC-1〜AC-10 のトレース完了
- [x] AC-8 / AC-9 を除き全件 PASS（残 2 件は Phase 11 / Phase 12 で確定）
- [x] ギャップが `unassigned-task-detection.md` 候補として整理

## 5. 次 Phase へのハンドオフ

- Phase 8: 表現整理・用語統一（spec_only のため指摘ログのみ。書き換えは Phase 5 を参照する形）
- Phase 11: AC-8 を実証跡として記録
- Phase 12: AC-9 / AC-10 を `documentation-changelog.md` で確定

## 6. 参照資料

- `phase-07.md`
- `index.md` AC-1〜AC-10
- `outputs/phase-1〜6/`

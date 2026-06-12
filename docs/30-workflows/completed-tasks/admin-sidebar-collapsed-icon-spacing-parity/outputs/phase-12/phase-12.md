**[実装区分: 実装仕様書]**

# Phase 12: ドキュメント更新

> 本ファイルは Phase 12 の canonical entry。詳細な集約・strict 7 成果物は `main.md` ほか
> 本ディレクトリ配下の各ファイルが正本。本ファイルは validator 検出用の薄い索引である。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | admin-sidebar-collapsed-icon-spacing-parity |
| workflow_state | implemented_local_runtime_pending |
| task_type | implementation |
| visual_category | VISUAL_ON_EXECUTION |
| branch | feat/admin-sidebar-collapsed-icon-spacing-parity |
| related_issue | null |

## 目的

staging 左サイドバーで、折りたたみ（アイコンのみ）時のアイコン縦間隔が展開（アイコン+ラベル）時より
広い問題を、展開と一致させる修正のドキュメント同期を行う。`apps/web` 表現層（CSS className）のみの修正で、
正本 spec（specs/*.md）・API・D1・Google Form は非接触のため新規 spec 更新は不要（N/A）と判定する。

## 実行タスク

1. `implementation-guide.md`（中学生レベル概念説明 + 技術者向け className diff・ピッチ計算）を維持する。
2. `system-spec-update-summary.md` で正本 spec 更新要否を N/A 判定として記録する。
3. `documentation-changelog.md` に docs 同期記録を残す。
4. `unassigned-task-detection.md` で未タスク（current 0 / baseline 候補 OOS-1・OOS-2）を記録する。
5. `phase12-task-spec-compliance-check.md` で canonical 9 見出し逐語 compliance を確認する。

## 参照資料

| 資料 | 用途 |
| --- | --- |
| `outputs/phase-12/main.md` | Phase 12 集約 entry（strict 7 成果物の索引） |
| `outputs/phase-12/implementation-guide.md` | className diff / ピッチ計算 / 検証コマンドの正本 |
| `outputs/phase-12/system-spec-update-summary.md` | 正本 spec 更新要否（N/A） |
| `outputs/phase-12/unassigned-task-detection.md` | 未タスク検出結果 |
| `index.md` | workflow 全体の真因・修正方針・スコープ |

## 成果物

| ファイル | 役割 |
| --- | --- |
| `main.md` | Phase 12 集約 entry |
| `implementation-guide.md` | Part1 中学生レベル + Part2 技術者向け実装ガイド |
| `system-spec-update-summary.md` | 正本 spec 更新要否判定（N/A） |
| `documentation-changelog.md` | docs 同期記録 |
| `unassigned-task-detection.md` | 未タスク検出（current 0 / baseline 候補 OOS-1・OOS-2） |
| `skill-feedback-report.md` | skill 改善観点 |
| `phase12-task-spec-compliance-check.md` | canonical 9 見出し逐語 compliance |

## 完了条件

- [ ] strict 7 成果物（main / implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）が揃っている
- [ ] 正本 spec 更新要否を N/A 判定として記録済み
- [ ] 未タスク検出（current 0 / baseline 候補）を記録済み
- [ ] canonical 9 見出し逐語 compliance を確認済み

## 統合テスト連携

本 Phase は、実コード差分・focused tests・Phase 11 evidence・aiworkflow ledger を同一サイクルで同期する。
collapsed/expanded 回帰は `SidebarShell.spec.tsx` / `SidebarNavItem.spec.tsx` の既存統合テストで担保し、
認証付き staging screenshot は Gate-C / user-gated として残す。

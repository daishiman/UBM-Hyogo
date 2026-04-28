# Phase 12 — ドキュメント更新（main）

## Status

done（spec_created / docs-only / NON_VISUAL）

## 1. メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | task-github-governance-branch-protection |
| Phase | 12 |
| タスク種別 | docs-only |
| visualEvidence | NON_VISUAL |
| workflow | spec_created |
| 実装範囲 | 仕様書のみ（コード実装は別タスク） |

## 2. Phase 12 の目的

GitHub branch protection / squash-only / auto-rebase / `pull_request_target` safety gate の **草案** を、後続実装タスクが翻訳ロスなく着手できる形にドキュメント化する。本 Phase は仕様書の確定であり、実装・PR 作成は Phase 13 のユーザー承認後に別タスクで行う。

## 3. 7 ファイルの存在チェック

| # | 成果物 | パス | 状態 |
| - | --- | --- | :-: |
| 1 | 本サマリ | `outputs/phase-12/main.md` | OK |
| 2 | 実装ガイド（Part1+Part2） | `outputs/phase-12/implementation-guide.md` | OK |
| 3 | システム仕様更新サマリ | `outputs/phase-12/system-spec-update-summary.md` | OK |
| 4 | 更新履歴 | `outputs/phase-12/documentation-changelog.md` | OK |
| 5 | 未タスク検出 | `outputs/phase-12/unassigned-task-detection.md` | OK |
| 6 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` | OK |
| 7 | コンプライアンスチェック（root evidence） | `outputs/phase-12/phase12-task-spec-compliance-check.md` | OK |

> 7 ファイル合計が canonical 6 成果物 + root evidence の構成。`artifacts.json` / `index.md` Phase 表との整合は phase12-task-spec-compliance-check.md で機械的に確認する。

## 4. 受入条件マッピング（Phase 1 §4）

| AC | 達成箇所 |
| --- | --- |
| AC-1 main/dev protection JSON 草案 | implementation-guide.md Part 2 §1 |
| AC-2 squash-only 強制 | implementation-guide.md Part 2 §2 |
| AC-3 auto-rebase workflow | implementation-guide.md Part 2 §3 |
| AC-4 pull_request_target safety gate | implementation-guide.md Part 2 §4 |
| AC-5 横断境界の表記 | system-spec-update-summary.md §3, unassigned-task-detection.md §4 |
| AC-6 Phase 13 承認ゲート維持 | 本書 §6 / implementation-guide.md 冒頭 |
| AC-7 草案宣言 | implementation-guide.md 冒頭・各成果物冒頭 |

## 5. 視覚証跡の取り扱い

NON_VISUAL タスクのため、Phase 11 のスクリーンショット成果物は **不要**。代替証跡として下記を参照する。

- `outputs/phase-10/go-no-go.md`
- `outputs/phase-11/manual-smoke-log.md`

## 6. Phase 13 への申し送り

- 本 Phase の出力は **草案** に閉じる。`gh api` 投入や `.github/workflows/*.yml` への実ファイル化は **Phase 13 のユーザー承認後** に別タスクで行う。
- Phase 13 では `change-summary.md` / `pr-template.md` を提示し、ユーザー承認待ちの `spec_created` として閉じる。GitHub 適用や PR 作成は別実装タスクで扱う。
- 横断 5 タスクとの境界（Phase 1 §6 / Phase 3 §5）は本 Phase 内で再衝突なし。

## 7. 完了条件チェック

- [x] 7 ファイルすべて存在
- [x] artifacts.json / index.md Phase 表と命名一致（phase12-task-spec-compliance-check.md で確認）
- [x] docs-only / spec_created / NON_VISUAL の分類が崩れていない
- [x] ユーザー承認なしの commit / push / PR 作成を行っていない

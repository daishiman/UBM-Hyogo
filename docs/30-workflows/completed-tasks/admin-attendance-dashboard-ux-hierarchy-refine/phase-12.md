# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-attendance-dashboard-ux-hierarchy-refine |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 実行種別 | serial |
| 作成日 | 2026-06-08 |
| 上流 | Phase 11（手動テスト・VISUAL screenshot） |
| 下流 | Phase 13（PR 作成） |
| 状態 | completed |
| 実装区分 | 実装仕様書（VISUAL） |

## 目的

本タスクのドキュメント更新を完遂する。implementation-guide（中学生レベル + 開発者レベル）、システム仕様更新方針（Step 1 / Step 2）、documentation-changelog、unassigned-task-detection（current / baseline 分離）、skill-feedback-report、phase12 compliance check の **6 成果物すべて**を出力する（0 件・該当なしでも出力必須）。実装・ローカル機械検証は完了済みで、global skill 同期は公開 surface 変更なしのため N/A。Phase 11 の 8 canonical PNG は `pending_visual_capture` として記録する。

## 実行タスク（Task 12-1〜12-6）

1. **Task 12-1**: `outputs/phase-12/implementation-guide.md` を Part 1（中学生レベル）+ Part 2（開発者レベル）+ `## 視覚証跡`（Phase 11 screenshot canonical 名参照）で作成する。
2. **Task 12-2**: `outputs/phase-12/system-spec-update-summary.md` に Step 1（タスク完了記録方針）/ Step 2（新規インターフェース追加判定）を記録する。
3. **Task 12-3**: `outputs/phase-12/documentation-changelog.md` に全 Step（1-A/1-B/1-C/Step 2）を個別明記する（該当なしも記録）。workflow-local 同期と global skill sync を別ブロックで記録する。
4. **Task 12-4**: `outputs/phase-12/unassigned-task-detection.md` に current / baseline を分離記録する（current = VIS-1 / baseline = OOS-1/OOS-2 + MINOR 扱い）。
5. **Task 12-5**: `outputs/phase-12/skill-feedback-report.md` にテンプレート / ワークフロー / ドキュメント改善観点を記録する（改善点なしでも出力）。
6. **Task 12-6**: `outputs/phase-12/phase12-task-spec-compliance-check.md` に Task 12-1〜12-6 / canonical 9 見出し充足の root evidence を記録する。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-11/screenshot-plan.json | 視覚証跡 canonical 名 |
| 必須 | outputs/phase-10/main.md | AC 最終確認 / MINOR 解決確認 |
| 必須 | _shared-context.md（§6 / §10） | AC / 裏取り（`attendanceFollowLevel` / `AttendanceDetailTabs`） |
| 必須 | outputs/phase-02/component-map.md | 新規コンポーネント signature 根拠 |

### システム仕様（aiworkflow-requirements）

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | Step 2 新規 primitive 非追加判定 |
| デザイントークン正本 | `docs/00-getting-started-manual/specs/09b-design-tokens.md` | token 追加なしの裏取り |
| 画面 blueprint（admin） | `docs/00-getting-started-manual/specs/09g-screen-blueprints-admin.md` | ダッシュボード設計の正本整合 |

## 実行手順

### ステップ 1: implementation-guide.md 作成（Task 12-1）

- Part 1（中学生レベル）: 日常の例え話・専門用語なし。「なぜ必要か → 何をするか」の順。
- Part 2（開発者レベル）: 変更ファイル一覧・新規コンポーネント TypeScript シグネチャ・globals.css 追加クラス・テスト・実行コマンド・エッジケース。
- `## 視覚証跡`: Phase 11 の 8 canonical 名を参照する。

### ステップ 2: Step 1 / Step 2 判定（Task 12-2）

- Step 1（タスク完了記録方針）: feature ローカル UI 改修のみで global skill 同期 N/A と記録。
- Step 2（新規インターフェース追加判定）: `attendanceFollowLevel` 純関数 + `AttendanceDetailTabs` props が feature ローカルである → aiworkflow-requirements 正本更新は **N/A** であることを明記。

### ステップ 3: changelog / unassigned / feedback / compliance（Task 12-3〜12-6）

- documentation-changelog: 全 Step の結果を個別明記（該当なしも記録）。workflow-local と global を別ブロック。
- unassigned-task-detection: current（VIS-1）/ baseline（OOS-1/OOS-2 + MINOR）を分離記録。
- skill-feedback-report: 改善点なしでも出力。
- phase12-task-spec-compliance-check: Task 12-1〜12-6 / canonical 9 見出し充足の root evidence。

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 11 | screenshot canonical 名を implementation-guide `## 視覚証跡` に反映 |
| Phase 13 | implementation-guide を PR 本文（Phase 13 仕様）に反映 |

## 依存Phase成果物参照

| 依存Phase | 必須成果物 | 本Phaseでの使用 |
| --- | --- | --- |
| Phase 2 | `outputs/phase-02/component-map.md` / `outputs/phase-02/layout-blueprint.md` | implementation-guide の変更ファイル・構造説明へ反映 |
| Phase 5 | `outputs/phase-05/main.md` / `outputs/phase-05/runbook.md` | 実装内容と検証手順をドキュメント化 |
| Phase 6 | `outputs/phase-06/main.md` / `outputs/phase-06/failure-cases.md` | 未タスク検出と境界ケース記録へ反映 |
| Phase 7 | `outputs/phase-07/main.md` / `outputs/phase-07/ac-matrix.md` | AC matrix を compliance check の根拠にする |
| Phase 8 | `outputs/phase-08/main.md` / `outputs/phase-08/before-after.md` | リファクタ履歴を documentation changelog へ反映 |
| Phase 9 | `outputs/phase-09/main.md` / `outputs/phase-09/token-audit.md` | token gate / lint / typecheck 結果を system-spec update summary へ反映 |

## 多角的チェック観点（AIが判断）

| 観点 | 確認内容 |
| --- | --- |
| Step 2 N/A 判定の正当性 | `attendanceFollowLevel` / `AttendanceDetailTabs` が feature ローカルで、公開 surface（aiworkflow-requirements 正本）に昇格しないこと |
| current/baseline 分離 | current = VIS-1（8 canonical PNG 未取得）/ baseline = 新 endpoint 要の OOS-1/OOS-2 を混同しない |
| 視覚証跡参照の一貫性 | implementation-guide の canonical 名が Phase 11 と一致 |
| same-wave sync 判定 | feature ローカル UI 改修のみで global skill sync N/A と記録 |

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | implementation-guide.md（Part 1/2 + 視覚証跡） | 12 | completed | Task 12-1 |
| 2 | system-spec-update-summary.md（Step 1/2） | 12 | completed | Task 12-2 |
| 3 | documentation-changelog.md（全 Step） | 12 | completed | Task 12-3 |
| 4 | unassigned-task-detection.md（current/baseline） | 12 | completed | Task 12-4 |
| 5 | skill-feedback-report.md | 12 | completed | Task 12-5 |
| 6 | phase12-task-spec-compliance-check.md | 12 | completed | Task 12-6 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 総括 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1（中学生）+ Part 2（開発者）+ 視覚証跡 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 1 / Step 2 判定 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 全 Step 個別記録（workflow-local / global 別ブロック） |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | current / baseline 分離 |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | 改善観点 |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | Task 12-1〜12-6 / canonical 9 見出し root evidence |

## 完了条件

- [x] 6 成果物（implementation-guide / system-spec-update-summary / documentation-changelog / unassigned-task-detection / skill-feedback-report / phase12-task-spec-compliance-check）+ main.md がすべて実体ファイルとして存在する
- [x] implementation-guide が Part 1（中学生レベル）+ Part 2（開発者レベル）+ `## 視覚証跡` を持つ
- [x] system-spec-update-summary が Step 2 を `attendanceFollowLevel` / `AttendanceDetailTabs` の feature ローカル判定で N/A 明記している
- [x] unassigned-task-detection が current（VIS-1）/ baseline（OOS-1/OOS-2 + MINOR）を分離記録している
- [x] documentation-changelog が全 Step（1-A/1-B/1-C/Step 2）を個別明記している（該当なしも記録）
- [x] global skill 同期が N/A である旨が明記されている

## タスク100%実行確認【必須】

- [x] サブタスク 1〜6 が完了している
- [x] outputs/phase-12/* の 7 ファイル（6 成果物 + main.md）が配置済み
- [x] implementation-guide の視覚証跡 canonical 名が Phase 11 と一致している（不一致 0 件）
- [x] current / baseline が混同なく分離されている
- [x] artifacts.json の Phase 12 ステータスが completed に整合している

## 次Phase

- 次: Phase 13（PR 作成）
- 引き継ぎ事項: implementation-guide（PR 本文の Phase 13 仕様）/ unassigned baseline / 視覚証跡 canonical 名
- ブロック条件: 6 成果物のいずれかが欠落する場合は本 Phase に留まる

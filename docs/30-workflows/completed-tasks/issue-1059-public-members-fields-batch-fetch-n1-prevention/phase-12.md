# Phase 12: ドキュメント更新

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 公開 members list の fields 一括取得 N+1 防止 (issue-1059) |
| Phase 番号 | 12 / 13 |
| Phase 名称 | ドキュメント更新 |
| 作成日 | 2026-06-02 |
| 状態 | completed |
| 前 Phase | 11 (手動テスト) |
| 次 Phase | 13 (PR作成) |
| タスク種別 | implementation / NON_VISUAL |

## 目的

実装内容を正本ドキュメントへ反映し、Phase 12 の strict 7 成果物（main.md + implementation-guide /
system-spec-update-summary / documentation-changelog / unassigned-task-detection /
skill-feedback-report / phase12-task-spec-compliance-check）を揃える。

## Task 12-1: 実装ガイド（2 パート構成）

`outputs/phase-12/main.md` と `outputs/phase-12/implementation-guide.md` を作成する。

- **Part 1（中学生レベル）**: 例え話「クラス40人の連絡先を、1人ずつ職員室まで取りに行く（40回往復＝N+1）か、
  名簿を1枚もらって全員分まとめて受け取る（1回）か」。「なぜ必要か（往復が多いと遅い）」→「何をするか
  （まとめて1回で取る）」の順で説明。専門用語を使う場合は即時に言い換える。
- **Part 2（技術者レベル）**: `listFieldsByResponseIds` の TypeScript シグネチャ、`response_id IN (...)`
  の SQL、空配列ガード、`Map<string, ResponseFieldRow[]>`（key=`response_id`）groupBy、before/after の
  クエリ回数（N → 1）、エラーハンドリング（空配列で DB 非アクセス）。識別子は実コードで `grep` 確認して引用する（W1-02b-3）。
- **`## 視覚証跡`**: 「UI/UX変更なしのため Phase 11 スクリーンショット不要」と明記。

## Task 12-2: システム仕様更新判定（Step 1 / Step 2）

| Step | 判定 |
| --- | --- |
| Step 1-A | 完了タスク記録（aiworkflow-requirements 完了ledger + LOGS.md×2 + topic-map）を same-wave で更新 |
| Step 1-B | 実装状況テーブル: 実装完了時 `completed` / 仕様書のみ時 `spec_created` |
| Step 1-C | 関連タスク（#224 follow-up）テーブルのステータスを current facts へ更新 |
| **Step 2** | **N/A**: `listFieldsByResponseIds` は repository 内部 helper であり、公開 API 契約（endpoint / view 出力形状）は不変。新規インターフェース公開なしのため aiworkflow-requirements 正本（api-*.md / interfaces-*.md）の更新は不要 |

## Task 12-3: ドキュメント更新履歴

`outputs/phase-12/documentation-changelog.md` に全 Step（1-A/1-B/1-C/Step 2）の結果を「該当なし」も含め個別に記録する。

## Task 12-4: 未タスク検出（0 件でも出力必須）

`outputs/phase-12/unassigned-task-detection.md` を作成。確認ソース: 元仕様のスコープ外（tags 変更等は完了済み/対象外）、
Phase 10 MINOR 指摘、コードコメント TODO/FIXME。**現時点の想定は 0 件**だが、検出時は
`current` / `baseline` を分離して記録し、「機能に影響なし」を不要判定理由にしない。

## Task 12-5: スキルフィードバック（改善点なしでも出力必須）

`outputs/phase-12/skill-feedback-report.md` を作成。観点: テンプレート改善 / ワークフロー改善 / ドキュメント改善。

## Task 12-6: コンプライアンスチェック

`outputs/phase-12/phase12-task-spec-compliance-check.md` を root evidence として残す。
implementation-guide の識別子（`listFieldsByResponseIds` / `fieldsByResponseId` / `responseIds`）を
実コードで grep 確認した結果を記録する。

## 実行タスク

1. implementation-guide.md を Part 1/Part 2 + 視覚証跡で作成する（完了条件: 2 パート + 視覚証跡記載）。
2. system-spec-update-summary.md に Step 1-A〜1-C と Step 2=N/A 判定を記録する（完了条件: 判定明記）。
3. documentation-changelog.md を全 Step 個別記録で作成する（完了条件: 該当なしも記録）。
4. unassigned-task-detection.md を 0 件でも作成する（完了条件: current/baseline 分離）。
5. skill-feedback-report.md を作成する（完了条件: 改善点なしでも出力）。
6. phase12-task-spec-compliance-check.md を作成する（完了条件: 識別子 grep 確認結果を記録）。
7. インデックス再生成（`node .claude/skills/aiworkflow-requirements/scripts/generate-index.js` 等）を実行する（完了条件: drift 0）。

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | .claude/skills/task-specification-creator/references/phase-12-documentation-guide.md | Phase 12 正本 |
| 必須 | .claude/skills/task-specification-creator/references/spec-update-workflow.md | Step 1-A〜1-C 手順 |
| 必須 | apps/api/src/repository/responseFields.ts | 識別子 grep 確認対象 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-12/main.md | Phase 12 主成果物 |
| ドキュメント | outputs/phase-12/implementation-guide.md | Part 1/2 + 視覚証跡 |
| ドキュメント | outputs/phase-12/system-spec-update-summary.md | Step 判定 |
| ドキュメント | outputs/phase-12/documentation-changelog.md | 全 Step 記録 |
| ドキュメント | outputs/phase-12/unassigned-task-detection.md | 未タスク（0 件でも） |
| ドキュメント | outputs/phase-12/skill-feedback-report.md | フィードバック |
| ドキュメント | outputs/phase-12/phase12-task-spec-compliance-check.md | compliance root evidence |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 13 | implementation-guide を PR 本文の主内容に渡す |

## 完了条件 (Acceptance Criteria for this Phase)

- [x] main.md が Phase 12 主成果物として配置されている
- [x] implementation-guide.md が Part 1/2 + 視覚証跡を満たす
- [x] Step 1-A〜1-C + Step 2=N/A 判定が記録されている
- [x] documentation-changelog.md が全 Step 個別記録
- [x] unassigned-task-detection.md が 0 件でも出力されている
- [x] skill-feedback-report.md が出力されている
- [x] phase12-task-spec-compliance-check.md が root evidence として残されている
- [x] インデックス drift が 0

## タスク100%実行確認【必須】

- 全実行タスク（7 件）が完了
- strict 7 成果物が `outputs/phase-12/` に配置済み
- artifacts.json の `phases[11].status` が完了時に更新される

## 次 Phase への引き渡し

- 次 Phase: 13 (PR作成 / user-gated)
- 引き継ぎ事項: implementation-guide / 未タスク検出結果
- ブロック条件: 必須 6 成果物のいずれかが欠落

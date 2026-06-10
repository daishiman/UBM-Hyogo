# Phase 12: ドキュメント変更履歴（documentation-changelog）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 12 |
| taskType | VISUAL |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |

## 目的

本ワークフローのドキュメント差分を Step 1-A / 1-B / 1-C / Step 2 の手順で個別に記録する。「該当なし」も明示記録する。workflow-local sync と global skill sync を別ブロックで分離する。本サイクルは `implemented_local_evidence_captured`（ローカル実装とfocused tests完了）。

## Step 1-A: 既存ドキュメント（specs / manual）の更新

| 対象 | 差分 | 結果 |
| --- | --- | --- |
| `docs/00-getting-started-manual/specs/01-api-schema.md` | `/me` 契約不変（AC-6・apps/api 非接触） | 該当なし（更新せず） |
| `docs/00-getting-started-manual/specs/02-auth.md` | session / `/me` 解決・401/410 境界不変 | 該当なし（更新せず） |
| `docs/00-getting-started-manual/specs/13-mvp-auth.md` | session 境界不変 | 該当なし（更新せず） |
| `CLAUDE.md` | 不変条件・運用フロー変更なし | 該当なし（更新せず） |

## Step 1-B: 本ワークフロー内ドキュメント（outputs/）の生成（implemented_local_evidence_captured）

| 対象 | 差分 | 結果 |
| --- | --- | --- |
| `outputs/phase-9/phase-9.md` | 新規生成（品質保証・apps/api 非接触確認） | 追加（present） |
| `outputs/phase-10/phase-10.md` | 新規生成（AC-1〜8 充足判定・MINOR 0 件 N/A） | 追加（present） |
| `outputs/phase-11/manual-test-result.md` | 新規生成（staging 実機切り分け MT-A〜MT-D + 証跡主ソース定義） | 追加（present） |
| `outputs/phase-11/screenshots/.gitkeep` | VISUAL_ON_EXECUTION（screenshots ディレクトリ保持） | 維持（present） |
| `outputs/phase-12/main.md` | 新規生成（Phase 12 index） | 追加（present） |
| `outputs/phase-12/implementation-guide.md` | 新規生成（Part 1/2 + 視覚証跡） | 追加（present） |
| `outputs/phase-12/system-spec-update-summary.md` | 新規生成 | 追加（present） |
| `outputs/phase-12/documentation-changelog.md` | 本ファイル | 追加（present） |
| `outputs/phase-12/unassigned-task-detection.md` | 新規生成（current 4 件 formalize） | 追加（present） |
| `outputs/phase-12/skill-feedback-report.md` | 新規生成 | 追加（present） |
| `outputs/phase-12/phase12-task-spec-compliance-check.md` | 新規生成（canonical-9） | 追加（present） |
| `outputs/phase-13/phase-13.md` | 新規生成（PR 多段ゲート仕様） | 追加（present） |

## Step 1-C: skill reference / changelog（global）の更新

| 対象 | 差分 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/references/workflow-profile-session-fetch-failure-investigation-artifact-inventory.md` | 本 wave で artifact inventory を新規追加予定 | 該当なし（implemented_local_evidence_captured 段階では未追加） |
| `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` | 本 wave で active ledger 登録予定 | 該当なし（implemented_local_evidence_captured 段階では未更新） |
| `.claude/skills/aiworkflow-requirements/indexes/{quick-reference,resource-map}.md` | 本 wave で登録予定 | 該当なし（implemented_local_evidence_captured 段階では未更新） |

## Step 2: 自動生成物（indexes / keywords）の再生成

| 対象 | 差分 | 結果 |
| --- | --- | --- |
| `.claude/skills/aiworkflow-requirements/indexes/keywords.json` 等 | skill reference 文面変更なし（implemented_local_evidence_captured）のため drift なし | 該当なし（rebuild 不要・本 wave では再生成しない） |

## workflow-local

- 生成: Phase 9 / 10 / 11（manual-test-result + screenshots/.gitkeep）/ 12（strict 7）/ 13。すべて新規追加（present）。
- `artifacts.json` / `outputs/artifacts.json` は phase status / `workflow_state = implemented_local_evidence_captured` を保持（byte-identical）。

## global

- skill reference / indexes は **implemented_local_evidence_captured 段階では sync しない**（本 wave で同期）。changelog / LOGS は本 wave の必須追加対象ではないため該当なし。

## 完了条件

- [x] Step 1-A（既存ドキュメント: 該当なし）を記録
- [x] Step 1-B（outputs 生成物・implemented_local_evidence_captured）を記録
- [x] Step 1-C（skill reference/changelog: 本 wave で artifact inventory と active ledger を同期）を記録
- [x] Step 2（自動生成物: 該当なし）を記録
- [x] workflow-local sync と global skill sync を別ブロックで分離記録

## 成果物

- `outputs/phase-12/documentation-changelog.md`（本ファイル）

## 参照資料

- `outputs/phase-12/system-spec-update-summary.md`
- `index.md`

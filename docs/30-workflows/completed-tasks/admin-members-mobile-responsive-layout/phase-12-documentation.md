# Phase 12: ドキュメント同期

## メタ情報

- task_id: `admin-members-mobile-responsive-layout`
- phase: 12 / 13
- 前提: Phase 1-11 完了
- SSOT: [outputs/shared-context.md](outputs/shared-context.md)
- モード: 本タスクは VISUAL UI task（local implementation 段階）。Phase 12 は close-out 成果物 7 点を揃える。

## 目的

実装ガイド・仕様同期・変更履歴・未タスク検出・スキルフィードバック・準拠チェックの 6 成果物を揃え、後続実装プロンプトが迷わず着手できる状態にする。

## 実行タスク（必須 6 成果物）

| Task | 成果物 | パス |
| ---- | ------ | ---- |
| 12-1 | 実装ガイド（Part 1/2 + 視覚証跡） | `outputs/phase-12/implementation-guide.md` |
| 12-2 | システム仕様更新サマリー（Step 1/2） | `outputs/phase-12/system-spec-update-summary.md` |
| 12-3 | ドキュメント更新履歴 | `outputs/phase-12/documentation-changelog.md` |
| 12-4 | 未タスク検出（0件でも出力 / current・baseline 分離） | `outputs/phase-12/unassigned-task-detection.md` |
| 12-5 | スキルフィードバック | `outputs/phase-12/skill-feedback-report.md` |
| 12-6 | 準拠チェック（Task 12-1〜12-5 確認） | `outputs/phase-12/phase12-task-spec-compliance-check.md` |

### Task 12-1: 実装ガイド

- Part 1（中学生レベル）: 「画面が小さいスマホだと、横長の表は右側が画面の外に隠れて押せない。だから小さい画面のときだけ、表を1人ずつの『カード』に並べ替えて、上から下に読めるようにする」という例え話で説明。
- Part 2（技術者レベル）: F1 の `data-component`/`data-role`/`data-label`/`data-cell` 属性、F2 の `@media (max-width:640px)` card 化 CSS（token 経由）、jsdom が media query 非適用ゆえ既存 axe テストが緑維持する理屈、機械可読id 不変の理由。
- 視覚証跡: VISUAL task。screenshot canonical 名（`admin-members-table-mobile-card-375.png` / `-640.png` / `admin-members-table-desktop-table-1280.png`）を Phase 11 から参照。CSS-contract screenshot は captured、authenticated route screenshot は user-gated。

### Task 12-2: システム仕様更新サマリー

- Step 1-A/1-B/1-C: spec_created UI task として same-wave で記録（実装状況テーブル = `spec_created`）。
- Step 2: **新規インターフェース/型/定数の追加なし**（props 不変・型不変・CSS変数は既存 token 流用）→ **Step 2 は N/A**。

### Task 12-3: ドキュメント更新履歴

- 変更ファイル（仕様書群）、validator 結果、current/baseline を記録。workflow-local 同期と global skill sync を別ブロックで記録（BEFORE-QUIT-003）。

### Task 12-4: 未タスク検出（current / baseline 分離）

- **current（今回サイクルで解決すべき）: 0 件**。F1-F4 で AC-1〜AC-9 を完結。
- **baseline（スコープ外・将来候補）: OOS-1** — 他 admin 一覧テーブル（tags/meetings/requests/audit）の同種レスポンシブ化。**分離理由 = 別画面・別コンポーネント・別責務**（CONST_007 例外。「分量」理由ではない）。実施時期 = 別タスク、実施場所 = `docs/30-workflows/unassigned-task/`（実装サイクルで起票判断）。

### Task 12-5: スキルフィードバック

- 改善点 or 改善点なしを記録（0件でも出力必須）。

### Task 12-6: 準拠チェック

- Task 12-1〜12-5 の全完了と canonical 9 見出し / Phase 11 evidence 表 / strict 7 outputs を確認。

## 参照資料

| 参照資料 | パス |
| -------- | ---- |
| SSOT | `outputs/shared-context.md` |
| Phase 11 evidence | `outputs/phase-11/manual-test-result.md` |
| 実装手順 | `phase-5-implementation.md` |

## 実行手順

1. Task 12-1〜12-6 を順に作成（6 成果物）。
2. `artifacts.json` と `outputs/artifacts.json` の parity を確認。
3. CI gate（phase12-compliance / gate-metadata / indexes）整合を確認。

## 統合テスト連携

- local implementation 段階のため実コードテストは Phase 13 後の実装サイクルで実施。本 Phase は close-out ドキュメント整合のみ。

## 多角的チェック観点（AIが判断）

- current 0 件 / baseline OOS-1 を混在させない（current と baseline の監査結果を分離）。
- planned wording（「仕様策定のみ」「実行予定」）を残さない。

## サブタスク管理

| ID | 内容 | status |
| -- | ---- | ------ |
| DOC-1 | implementation-guide | done |
| DOC-2 | system-spec-update-summary | done |
| DOC-3 | documentation-changelog | done |
| DOC-4 | unassigned-task-detection | done |
| DOC-5 | skill-feedback-report | done |
| DOC-6 | phase12-task-spec-compliance-check | done |

## 成果物

上記 6 成果物（`outputs/phase-12/` 配下）。

## 完了条件

- [ ] 6 成果物すべて作成。
- [ ] Step 2 N/A 判定を記録。
- [ ] 未タスク current 0 / baseline OOS-1 を分離記録。
- [ ] artifacts.json parity 確認。

## タスク100%実行確認【必須】

- [x] 12-1 implementation-guide
- [x] 12-2 system-spec-update-summary
- [x] 12-3 documentation-changelog
- [x] 12-4 unassigned-task-detection
- [x] 12-5 skill-feedback-report
- [x] 12-6 phase12-task-spec-compliance-check

## 次Phase

[phase-13-pr.md](phase-13-pr.md) — commit / PR（user-gated）。

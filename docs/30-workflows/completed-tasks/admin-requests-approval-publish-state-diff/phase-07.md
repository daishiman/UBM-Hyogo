# Phase 7: カバレッジ確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | admin-requests-approval-publish-state-diff |
| Phase 番号 | 7 / 13 |
| Phase 名称 | カバレッジ確認 |
| 実行種別 | serial（単一 workflow / 1 サイクル完了） |
| 作成日 | 2026-06-11 |
| 担当 | web (apps/web 表現層) |
| タスク種別 | implementation（VISUAL / コード変更を伴う） |
| 上流 | Phase 5（実装）/ Phase 6（テスト拡充） |
| 下流 | Phase 8（リファクタリング） |
| 状態 | completed |

## 目的

Phase 5 の実装と Phase 4/6 のテストに対し、**変更したファイル/ブロックに限定したカバレッジ**を測定し、AC-1〜AC-10 が漏れなくテストケース（TC-XX / TC-E-XX）と実装ファイルにトレースされていることを確認する。全体一律のカバレッジ閾値ではなく、**本タスクで新規追加した純粋関数 `formatPublishStateLabel` / `buildPublishStateDiff` と diff 行描画・`destructiveMessage` 生成の line/branch カバレッジ実測値を証跡に残す**ことを正本とする。`formatPublishStateLabel` の 4 写像分岐（public/member_only/hidden/未知）と `buildPublishStateDiff` の note_type 分岐（visibility/delete/null）、`destructiveMessage` の note_type 分岐（delete/visibility/fallback）が branch カバレッジに現れることを実測値で残す。

## 実行タスク

1. **カバレッジ対象範囲の限定**: 計測対象を `apps/web/src/components/admin/` 配下の **本タスクで変更したファイルのみ**（`RequestQueueDetail.tsx` / `RequestQueuePanel.tsx` / `RequestConfirmDialog.tsx` + helper を別ファイル化した場合のその helper）に限定する。全体一律 `--coverage` 指定はしない。
2. **`formatPublishStateLabel` の branch 確認**: `public`/`member_only`/`hidden`/未知（fail-soft「不明」）の 4 分岐が TC で網羅され、branch カバレッジが実測値として残ることを確認する。
3. **`buildPublishStateDiff` の note_type 分岐確認**: `visibility`（after 正常 / `desiredState` 欠落で「不明」）/ `delete` / 対象外・null（`null` 返却）の各分岐が TC で網羅され、line/branch カバレッジに現れることを確認する。
4. **`destructiveMessage` 分岐確認**: `delete_request`（退会文言）/ `visibility_request`（具体遷移文言）/ fallback（既存汎用文言）の 3 分岐が TC で網羅されることを確認する。
5. **AC × TC × 実装ファイルのトレーサビリティ表作成**: `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 を行、Phase 4/6 検証 TC・Phase 5 実装ファイルを列とする 1:1 対応表を作り、**未カバー AC が 0 件**であることを確認する。各 AC は「テストで担保 / 機械検証（gate）で担保」を区別する（AC-5 は `verify-design-tokens` gate、AC-7 は `git diff -- apps/api packages/shared` gate）。

## 参照資料

### タスク内部資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-04/test-plan.md | 正常系 TC-XX の定義（トレース起点） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-06/edge-cases.md | 異常系 TC-E-XX の定義（トレース起点） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/outputs/phase-05/main.md | 変更ファイル一覧 / シグネチャ（カバレッジ対象範囲） |
| 必須 | docs/30-workflows/completed-tasks/admin-requests-approval-publish-state-diff/_shared-context.md | AC-1〜AC-10 の正本 / §9 検証コマンド |

### システム仕様（aiworkflow-requirements）

> 実装前に必ず以下のシステム仕様を確認し、既存設計との整合性を確保してください。

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| テスト/実装パターン | `.claude/skills/task-specification-creator/references/patterns-testing-and-implementation.md` | カバレッジ範囲限定・変更ブロック実測の方針 |
| UI/UX primitives | `.claude/skills/aiworkflow-requirements/references/ui-ux-atoms-patterns-core.md` | primitive 非追加（AC-6）の裏取り |

### プロジェクト spec 正本

| 種別 | パス | 用途 |
| --- | --- | --- |
| 計測対象 | apps/web/src/components/admin/RequestQueueDetail.tsx | `formatPublishStateLabel` / `buildPublishStateDiff` / diff 行（branch 対象） |
| 計測対象 | apps/web/src/components/admin/RequestQueuePanel.tsx | `destructiveMessage` 生成（note_type 3 分岐対象） |
| 計測対象 | apps/web/src/components/admin/RequestConfirmDialog.tsx | 92 行表示条件緩和（branch 対象） |

## 実行手順

### ステップ 1: 対象限定カバレッジの計測（全体一律禁止）

計測は admin requests 関連の変更ファイルのみに限定する。リポジトリルートが vitest root のため、フルパス指定 + `--root=.` を用いる（`_shared-context.md` §8 / §9 の既知の罠）。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/components/admin/__tests__/RequestQueueDetail.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestConfirmDialog.spec.tsx \
  apps/web/src/components/admin/__tests__/RequestQueuePanel.component.spec.tsx \
  --coverage \
  --coverage.include='apps/web/src/components/admin/RequestQueueDetail.tsx' \
  --coverage.include='apps/web/src/components/admin/RequestQueuePanel.tsx' \
  --coverage.include='apps/web/src/components/admin/RequestConfirmDialog.tsx' \
  --coverage.reporter=text --coverage.reporter=json-summary
```

`--coverage.include` で変更ファイルに限定し、全体一律閾値を適用しない。

### ステップ 2: `formatPublishStateLabel` の branch 実測

`public`/`member_only`/`hidden`/未知（fail-soft「不明」）の 4 分岐が TC で実行されることを確認し、branch カバレッジを実測値として `outputs/phase-07/main.md` の記録欄に転記する。

### ステップ 3: `buildPublishStateDiff` の note_type 分岐実測

`visibility`（after 正常 + `desiredState` 欠落「不明」）/ `delete` / 対象外・null（`null` 返却）の各分岐が TC で網羅されることを確認し、line/branch を記録欄に転記する。

### ステップ 4: `destructiveMessage` 分岐実測

`delete_request` / `visibility_request` / fallback の 3 分岐が TC で網羅されることを確認し、記録欄に転記する。

### ステップ 5: AC マトリクスの作成と未カバー 0 件確認

`outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × TC-XX/TC-E-XX × 実装ファイルの 1:1 対応表を作る。AC-5（HEX 0）は `verify-design-tokens`、AC-7（apps/api 不変）は `git diff -- apps/api packages/shared` の機械検証で担保する旨を記す。**未カバー AC が 0 件**であることを最終行で宣言する。

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-07/main.md | カバレッジ方針・範囲限定コマンド・変更ブロック line/branch 実測記録欄 |
| ドキュメント | outputs/phase-07/ac-matrix.md | AC-1〜AC-10 × TC-XX/TC-E-XX × 実装ファイル 1:1 トレーサビリティ表 |
| メタ | artifacts.json | Phase 7 を completed に同期 |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 | TC-XX 定義をカバレッジトレースの起点として参照する |
| Phase 6 | TC-E-XX（fail path / 境界値）の実行結果をカバレッジに合算 |
| Phase 8 | 未カバー 0 件・既存 3 spec 追従済みを前提にリファクタへ進む |
| Phase 9 | カバレッジ証跡を品質保証の入力にする |
| Phase 10 | GO/NO-GO 判定の根拠（AC 全カバー） |

## 完了条件

- [ ] `outputs/phase-07/main.md` にカバレッジ範囲限定方針（admin requests 変更ファイル配下のみ）が書かれている。
- [ ] カバレッジ計測コマンドが `--coverage.include` で対象限定されており、全体一律指定でない。
- [ ] `formatPublishStateLabel` の 4 写像分岐（public/member_only/hidden/未知）の branch 実測記録欄がある。
- [ ] `buildPublishStateDiff` の note_type 分岐（visibility/delete/null）の line/branch 実測記録欄がある。
- [ ] `destructiveMessage` の 3 分岐（delete/visibility/fallback）の実測記録欄がある。
- [ ] `outputs/phase-07/ac-matrix.md` に AC-1〜AC-10 × TC-XX/TC-E-XX × 実装ファイルの 1:1 対応表が完成している。
- [ ] ac-matrix.md で未カバー AC が 0 件であることが宣言されている。
- [ ] AC-5（HEX 0）/ AC-7（apps/api 不変）が gate（verify-design-tokens / git diff）で担保される区別が記載されている。
- [ ] 既存 3 spec（`RequestQueueDetail` / `RequestConfirmDialog` / `RequestQueuePanel.component`）の追従状況が記録されている。
- [ ] artifacts.json の Phase 7 ステータスが completed に整合している。

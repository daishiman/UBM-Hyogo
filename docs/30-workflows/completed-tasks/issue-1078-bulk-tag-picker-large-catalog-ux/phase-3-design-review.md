# Phase 3: 設計レビュー（Gate-A）

Phase 1-2 の設計が Phase 4（テスト作成）へ進める品質かを判定する。本ファイルが
`artifacts.json` の **Gate-A evidence**。

## 3.1 判定サマリー

| 判定 | 結果 |
|------|------|
| Phase 4 へ進めるか | **PASS** |
| BLOCKER | 0 件 |
| MINOR | 2 件（下記・いずれも Phase 4/5 で吸収可能） |

## 3.2 4条件レビュー

| 条件 | 評価 | 根拠 |
|------|------|------|
| 価値性 | PASS | admin bulk tag 運用者の「picker が空/落ちる（AC-0）」「tag 増加で操作不能（AC-1/3/5）」を解消。価値の中心は AC-0 の correctness 回復。 |
| 実現性 | PASS | 全 apps/web・3 task・関数 2 + component 1 + test 2 の厚み。1 サイクルで実装可能。apps/api 非変更で表面積が小さい。 |
| 整合性 | PASS | 既存 API（#1035 landed）・既存 primitives（`TagPill`）・既存選択モデル（`Set`）に整合。新 endpoint / schema 変更なし。`available` を返り値キーに維持して既存呼び出し互換を保つ。 |
| 運用性 | PASS | component test + api client test + Playwright visual で回帰担保。contract 不一致は mock 是正で恒久的に再発防止（テストが実 API 形を強制）。 |

## 3.3 因果ループ（root-cause 確認）

- **バランスループ（回復）**: `GET /admin/tags` が `{total,items}` を返す → `fetchTagMaster` が `items` を
  読む（修正後）→ `available` に正しい配列 → `groupedTags` が安全に反復 → picker 描画成功。
  現状はこのループが「`items` を読まず `available`(=undefined) を読む」で破断していた。
- **強化ループ（隠蔽）**: テスト mock が `{available}` を返す → テスト緑 → 「動いている」と誤認 →
  実 API 形との乖離が温存。mock 是正でこのループを断つ。

## 3.4 MINOR 指摘（Phase 4/5 で吸収）

1. **[MINOR-1] 検索 input と不変条件 #9 の関係**
   - 不変条件 #9 は admin の **編集フォーム入力**を `FormField` 経由に統一する規約。本タスクの検索
     `<input type="search">` は mutation を伴わない **filter UI** であり編集フォーム入力ではないため、
     `FormField` 強制対象外と判断する。ただし Phase 5 実装時に既存の admin filter 入力（例: members
     一覧の検索）と token / aria の様式を合わせること。`<input>` を `components/admin/` 配下に増やす
     懸念は filter 用途であることをコメントで明示して回避する。
2. **[MINOR-2] debounce 実装の最小化**
   - server search mode の debounce は外部ライブラリを足さず `setTimeout` + cleanup の最小実装に留める
     （新規依存を増やさない）。Phase 4 で「debounce 後に 1 回だけ fetch」を検証するケースを置く。

## 3.5 リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| `fetchAllTagMaster` のページ周回が無限化 | 中 | 最終ページ判定（`available.length < pageSize`）+ `cap` 二重ガード。Phase 4 でループ終了を検証 |
| `total > cap` 時の silent 切り捨て | 中 | `truncated:true` を返し UI に「全 N 件中 M 件」を必ず表示（silent cap 禁止） |
| 選択 tag の label 未解決（未取得 id） | 低 | `knownTagsRef` 累積 + code/id フォールバック描画（AC-4） |
| 小規模 catalog の現行挙動 regression | 中 | 閾値（既定 24）以下は現行の全件表示を維持。Phase 4 に小規模回帰ケース |
| design token 逸脱（HEX 直書き） | 中 | `var(--ubm-*)` のみ使用。CI gate `verify-design-tokens` で fail 判定（Phase 9 で確認） |

## 3.6 Phase 4 への引き継ぎ

- テストは命名規則（`TC-BAB-*` 継承、新規 `TC-BAB-CAT-*`）に整合させる。
- AC-2 / AC-4 は verify_existing regression として既存挙動の固定に徹する。
- mock 是正（実 API 形）を Phase 4 の最初のタスクに置き、AC-0 の RED→GREEN を成立させる。

## 完了条件

- [x] 4条件すべて PASS
- [x] BLOCKER 0、MINOR は Phase 4/5 吸収方針を明記
- [x] root-cause（contract 不一致 + mock 隠蔽）を因果ループで確認
- [x] Gate-A evidence として確定


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 |
| workflow | issue-1078-bulk-tag-picker-large-catalog-ux |
| taskType | implementation |
| visualEvidence | VISUAL_ON_EXECUTION |
| workflow_state | implemented_local_evidence_captured |
| verdict | PASS_BOUNDARY_SYNCED_RUNTIME_PENDING |

## 目的

本 Phase の既存本文で定義した目的に従い、issue #1078 の tag master contract 修正と BulkActionBar large catalog UX を検証可能な単位で扱う。

## 実行タスク

- [x] Phase 本文の設計・実装・検証項目を issue #1078 の実装結果に同期する。
- [x] 実コード差分、focused tests、typecheck、lint の local evidence と矛盾しない状態語彙へ更新する。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/index.md`
- `docs/30-workflows/completed-tasks/issue-1078-bulk-tag-picker-large-catalog-ux/artifacts.json`
- `.claude/skills/task-specification-creator/references/workflow-state-vocabulary.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 成果物

- 本 Phase ファイル
- `outputs/phase-11/manual-test-result.md`
- `outputs/phase-12/phase12-task-spec-compliance-check.md`



## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。

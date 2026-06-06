# Phase 1: 要件定義

`[実装区分: 実装仕様書]` — apps/web のコード変更を伴う。docs-only ではない（CONST_004）。

## 1.1 タスク分類

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| implementation_mode | `new`（P0 contract バグ修正 + 新規 large catalog UX。AC-2 / AC-4 のみ verify_existing） |
| visualEvidence | `VISUAL_ON_EXECUTION`（`BulkActionBar` の UI を変更 → Phase 11 で screenshot 取得対象） |
| 変更領域 | **apps/web のみ**（apps/api は変更不要 — #1035 で read endpoint landed 済） |
| docs-only か | No（root-cause がコード欠陥のため実装仕様書として作成） |

## 1.2 真の論点（要件レビュー思考法）

1. **真の論点**: 元 issue は「tag が増えたら sticky bar が伸びる」cosmetic UX を主問題に置くが、
   現コードを読むと **その前段に tag picker が実 API 形でクラッシュ／空表示する correctness 欠陥**
   がある。真の主問題は「`fetchTagMaster()` の client contract が `GET /admin/tags`（#1035 で
   `{total,items}` 化）と不一致で、bulk tag picker が壊れている」こと。large catalog UX は
   その上に積む二次論点。
2. **依存・責務境界**: read endpoint（apps/api、#1035 landed）／ proxy（pass-through）／
   client fetch（`fetchTagMaster`）／ component（`BulkActionBar`）の 4 層。責務境界として
   「fetch 層が API 形→UI 形へ変換する」「component は UI state（検索/折りたたみ/選択）のみ所有」を
   固定する。apps/api の責務には踏み込まない（既存 API のみ接続）。
3. **価値とコストの不均衡**: 最大価値は AC-0（picker が実際に動く）。次が AC-3（50 件超で
   切り捨てない）。AC-1/AC-5（高さ制御）は中価値。AC-2/AC-4 は既充足のため追加コストは
   regression test のみ。高コスト項目は staging 認証付き visual baseline（user-gated・将来層）。
4. **改善優先順位**: AC-0 → AC-3 → AC-1/AC-5 → AC-4 表示 → AC-2 regression。
5. **4条件評価**:
   - 価値性: admin の bulk tag 運用者の「picker が空/落ちる」「tag が増えると操作不能」を解消。
   - 実現性: 全 apps/web・3 task・1 サイクルで実装可能な厚み。
   - 整合性: 既存 API・既存 primitives・既存 Set 選択モデルに整合。新 endpoint / schema 変更なし。
   - 運用性: component test + api client test + Playwright visual で回帰を担保。

## 1.3 現状コードの inventory（実コードを Read して確定）

| ファイル | 現状 | 本タスクでの扱い |
|---------|------|-----------------|
| `apps/web/src/features/admin/api/members.ts` L88-94 | `fetchTagMaster()` が `{ available }` cast（**バグ**） | task-A: `{total,items}` 対応 + query 引数化 + 型追加 |
| `apps/web/src/features/admin/components/_members/BulkActionBar.tsx` L52-86, L213-238 | `available` state / 全件 category grouping / 検索・折りたたみ・overflow 無し | task-B: large catalog UX を追加 |
| `apps/web/src/features/admin/components/_shared/TagPill.tsx` L20-38 | `<button>` + `aria-pressed={selected}`（**充足済み**） | 変更なし。AC-2 regression のみ |
| `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` L58-66 | fetch mock が `{ available }`（**実 API 形と不一致＝バグ隠蔽**） | task-C: mock 是正 + 新規ケース |
| `apps/api/src/routes/admin/tags.ts` L110-129 | `GET /tags` → `{ q,page,pageSize }` → `{ total, items }` | **変更なし**（接続先として参照のみ） |
| `apps/web/app/api/admin/[...path]/route.ts` L100-107 | pass-through proxy（reshape なし） | 変更なし |

## 1.4 命名規則（既存コードベース分析）

- TS 関数: camelCase（`fetchTagMaster` / `assignMemberTag` / `bulkApplyMemberTags`）。
- React component: PascalCase（`BulkActionBar` / `TagPill`）。
- 型: PascalCase（`AdminTagRef` / `MemberTagsResult` / `BulkApplyMemberTagsResult`）。
- テストファイル: `*.spec.tsx` / `*.spec.ts`（**不変条件 #8**: `*.test.*` 禁止）。
- テストケース ID: `TC-BAB-*` / `TC-BAB-TAG-*`（既存命名を継承し新規は `TC-BAB-CAT-*` を付番）。
- CSS: OKLch design token（`var(--ubm-color-*)` / `var(--ubm-radius-*)`）。**HEX 直書き / `bg-[#xxx]` 禁止**（不変条件 #2・CI gate `verify-design-tokens`）。

## 1.5 P50 前提確認チェック

| 確認項目 | 結果 | 対応 |
|----------|------|------|
| current branch に実装が存在するか | Yes（local 実装済み・staging visual pending） | 通常実装 Phase（`new`）として実施済み |
| upstream にマージ済みか | No（本機能） / 依存の `GET /admin/tags` は #1035 で merged | read endpoint は landed 済として接続のみ |
| 前提タスク完了済みか | Yes（#1035 read endpoint / #1036 bulk picker base いずれも CLOSED・landed） | 依存解消タスク不要 |
| 既充足 AC | AC-2（aria-pressed）/ AC-4（Set 独立保持） | Phase 4 で verify_existing regression として設計 |

## 1.6 スコープ

### 含む
- `fetchTagMaster()` の contract 修正（`{total,items}`）と pagination/search query 対応（apps/web）。
- `BulkActionBar` tag picker の検索 / category 折りたたみ / `max-height`+`overflow` / 選択中固定行 / 閾値ゲート。
- `BulkActionBar.spec.tsx` の mock 是正 + 新規テストケース、新規 `members.spec.ts`（api client）。
- Playwright visual sanity 計画（desktop / mobile・large fixture）。

### 含まない（先送りではなく構造的に対象外）
- apps/api の変更（#1035 で read endpoint が landed 済。新 endpoint / schema 変更は不変条件で禁止）。
- tag master write / CRUD（#1035 系・#1068/#1069/#1070 で対応済）。
- staging 認証付き visual baseline の実取得（user-gated・Phase 11 で canonical 名と手順を固定済み）。
- commit / PR / issue mutation（CONST_002・user-gated）。

> **CONST_007 確認**: 上記「含まない」はいずれも「将来 PR への先送り」ではなく、
> 別 issue で landed 済 or 不変条件で禁止 or user-gated runtime のいずれか。本タスクの
> local 実装サイクルで AC-0〜AC-5 はすべて充足した。staging visual baseline の実取得のみ user-gated として残る。

## 1.7 受入条件

index.md「受入条件 (AC)」AC-0〜AC-5 を参照。各 AC の検証は Phase 4（テスト作成）でケースへ落とす。

## 完了条件

- [x] 実装区分を判定（実装仕様書）し根拠を記録
- [x] current コードの inventory と命名規則を確定
- [x] P50 チェック完了（既充足 AC を verify_existing に分類）
- [x] scope（含む/含まない）を CONST_007 観点で固定


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 |
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

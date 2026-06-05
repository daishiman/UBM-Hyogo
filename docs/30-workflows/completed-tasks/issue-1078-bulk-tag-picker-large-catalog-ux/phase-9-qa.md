# Phase 9: 品質保証（Gate-B evidence）

> **Phase 種別**: 品質保証 / 一括検証（Gate-B の evidence 取得フェーズ）
> **対象 issue**: #1078 BulkActionBar tag picker 大規模 catalog UX 改善 + tag master read contract 修正
> **実装区分**: implemented_local_evidence_captured。
> **Gate-B status**: **passed**（local deterministic evidence captured）。staging visual baseline は Gate-C user-gated。
> **前提**: Phase 5-8 完了（実装 + テスト + カバレッジ + リファクタ）。
> **次フェーズ**: Phase 10 最終レビュー

---

## 9.1 このフェーズのゴール

local 実装サイクルで以下を一括検証し、各項目の実行コマンドと実測結果を固定する。
全項目 PASS を **Gate-B の evidence** として記録する。

> 本 issue は全 apps/web 変更（apps/api 非変更）であり、**mirror parity 該当なし**（API/web 二重定義の同期対象を新設しない）。

---

## 9.2 一括検証項目（実行コマンドと期待結果）

| # | 検証項目 | 実行コマンド | 期待結果 | 実測 |
|---|---------|------------|---------|------------------|
| QA-1 | typecheck | `mise exec -- pnpm typecheck` | exit 0（型エラー 0） | PASS |
| QA-2 | lint | `mise exec -- pnpm lint` | exit 0（lint 違反 0） | PASS |
| QA-3 | design tokens（HEX 0・token 整合） | `rg "bg-\\[#|text-\\[#|#[0-9a-fA-F]{3,6}" BulkActionBar.tsx` | HEX 直書き 0 / `bg-[#...]` / `text-[#...]` 0 / OKLch token のみ | PASS（0 hits） |
| QA-4 | BulkActionBar.spec.tsx 全 PASS | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | 全 it PASS（追加 TC + 既存 TC） | PASS（20 tests） |
| QA-5 | members.spec.ts 全 PASS（新規） | `mise exec -- pnpm --filter @ubm-hyogo/web test --run src/features/admin/api/__tests__/members.spec.ts` | 全 it PASS（contract / pagination） | PASS（11 tests） |
| QA-6 | 既存 regression 維持 | QA-4 内で TC-BAB-01..05 / TC-BAB-TAG-01..05 が **無改変で green** | publish/hide/soft-delete/bulk tag が退行なし | PASS |
| QA-7 | a11y（jest-axe） | QA-4 内の `a11y violations 0` it | violations length 0（aria-pressed / region 維持） | PASS |
| QA-8 | mirror parity | 該当なし（web 単独変更・同期対象なし） | N/A（評価不要を明記） | N/A |

> QA-3 の `verify-design-tokens` 実コマンドはリポジトリの gate 実装（`.github/workflows` / `scripts`）に合わせる。
> 不変条件 #2: 色は OKLch token（`tokens.css` / `design-tokens.md`）正本。新規 class でも HEX を増やさない。

---

## 9.3 regression 対象（明示）

| 既存 TC グループ | 対象挙動 | 維持条件 |
|-----------------|---------|---------|
| TC-BAB-01..05（`TC-BAB-01`〜`TC-BAB-04` + a11y） | publish / hide / soft-delete のシリアル mutation / 非表示条件 | 無改変で green |
| TC-BAB-TAG-01..05（`TAG-01`〜`TAG-05`） | tag master ロード / bulk trigger / 部分失敗集計 / unassign / disabled | 無改変で green |

> 注: 既存 spec の `fetch` mock は現在 `{ available: AVAILABLE }` を返しており、これが root-cause（実 API は `{total, items}`）を隠蔽していた。
> Phase 6 で **mock を実 contract（`{total, items}`）に修正**するため、TC-BAB-TAG-01 系の mock 調整は「テスト隠蔽の是正」であり regression ではない。
> regression 維持の判定対象は **挙動アサーション（描画・trigger 引数・disabled）** であって mock shape ではない点を明記する。

---

## 9.4 入出力・副作用

- **入力**: Phase 5-8 完了状態のコード。
- **出力**: 各検証コマンドの exit code とテスト結果サマリ（Gate-B evidence）。
- **副作用**: 検証のみ。プロダクトコード変更なし。

---

## 9.5 ローカル実行コマンド（CONST_005・一括）

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm exec verify-design-tokens
mise exec -- pnpm --filter @ubm-hyogo/web test --run \
  src/features/admin/components/__tests__/BulkActionBar.spec.tsx \
  src/features/admin/api/__tests__/members.spec.ts
```

---

## 9.6 DoD（Definition of Done）— Gate-B 合格条件

- [x] QA-1 typecheck exit 0
- [x] QA-2 lint exit 0
- [x] QA-3 token grep で HEX 0 / token 整合
- [x] QA-4 BulkActionBar.spec.tsx 全 PASS
- [x] QA-5 members.spec.ts（新規）全 PASS
- [x] QA-6 既存 regression（TC-BAB-01..05 / TAG-01..05）維持
- [x] QA-7 a11y violations 0
- [x] QA-8 mirror parity 該当なし（N/A）を確認・明記
- [x] 全項目 PASS をもって Gate-B を `passed` に遷移

> local deterministic evidence は取得済み。staging visual baseline のみ Gate-C user-gated。


## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 9 |
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

## 完了条件

- [x] 必須見出しが揃っている。
- [x] 状態語彙が `implemented_local_evidence_captured` / `PASS_BOUNDARY_SYNCED_RUNTIME_PENDING` と整合している。


## 統合テスト連携

- [x] API client contract は `apps/web/src/features/admin/api/__tests__/members.spec.ts`（11 tests PASS）で検証済み。
- [x] BulkActionBar UI / a11y / regression は `apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（20 tests PASS）で検証済み。
- [x] broader web Vitest run は 216 files / 1587 tests PASS / 1 skipped。

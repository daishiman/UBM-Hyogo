# Phase 6: テスト拡充

## メタ情報

| 項目 | 値 |
|------|-----|
| feature | `publish-state-backfill-admin-ui` |
| phase | 6 / 13 |
| 実装区分 | 実装仕様書 |
| workflow_state | implemented_local_evidence_captured |
| 前提 | Phase 5（実装）完了 |
| 正本 | 既存実装（PR #1064 / commit `745c95115` で dev へ landed） |

> 本仕様書は landed 実装の正本記述。Phase 4 で固定した TC を境界・異常系の観点で拡充し、green 維持を確認する。Write 対象は仕様書のみ。

## 目的

Phase 4 の TC-A1..A7 / TC-B1..B4 を起点に、二重起動・グリッド崩れ・confirm 依存・schema mismatch の境界・異常系を補強し、`backfill.ts` / `BackfillPublishStatePanel.client.tsx` の分岐網羅を Phase 7 の coverage AC に耐える水準へ引き上げる。

## 実行タスク

### 拡充観点（境界・異常系）

| 観点 | 内容 | 既存 TC との関係 |
|------|------|------------------|
| 二重起動防止 | pending 中（`mutation.isLoading=true`）に両ボタンが disabled で trigger が重複しない経路を確認。実装は dry-run/apply ボタンの `disabled={isLoading...}` で守る | TC-A4 が充足 |
| confirm モック必須 | apply 系 TC は `vi.spyOn(globalThis, "confirm")` を必須化。モック漏れで jsdom が `confirm is not a function` を投げ flaky 化する | TC-A2 / TC-A2c / TC-A7 |
| `<dl>` contents wrapper | 各 skipped 行を `<div className="contents">` でラップし `grid-cols-2 md:grid-cols-4` のグリッド崩れを起こさないこと（label/value が同一トラックに整列） | TC-A3 の描画前提 |
| candidates=0 で apply disabled | dry-run 結果の `candidates===0` 時に `canApply=false` で apply が無効化されること | TC-A2b（dry-run 前 disabled）が同経路を充足。明示の candidates=0 ケースは追加候補 |
| skipped 全種表示 | `alreadyPublic / adminExplicit / consentNotMet / deleted` の 4 行すべてが描画されること | TC-A3（adminExplicit / deleted）を 4 種へ拡張可能 |

### 追加候補ケースの整理

| 候補 | 判定 | 理由 |
|------|------|------|
| candidates=0 で apply disabled | **TC-A2b で充足** | dry-run 前と candidates=0 はいずれも `canApply=false` に収束。別 TC 化は冗長 |
| skipped 全種（4 行）表示 | TC-A3 の拡張で吸収可 | 現状 adminExplicit / deleted を検証。残 2 種を加えても同一描画経路 |
| isSubmittingRef による二重起動防止 | TC-A4 で充足 | UI 上は `disabled` で二重起動を阻止。ref 経路は実装内ガードとして TC-A4 が観測 |

> 拡充は新規 TC の乱立を避け、既存 TC-A1..A7 / TC-B1..B4 が網羅する分岐を維持することを優先する。新規ケースは「既存 TC で未到達の分岐があるか」を基準に判断する。

### 既存テスト green 維持の確認手順

1. `mise exec -- pnpm --filter @ubm-hyogo/web test` で TC-A1..A7 + TC-B1..B4 が全 green。
2. `confirm` モックが `beforeEach` で true 既定、TC-A2c のみ `false` に上書きされ、他 TC へ漏れない（`vi.restoreAllMocks()` を `afterEach` で実行）。
3. `triggerMock.mockReset()` → `mockResolvedValue(DRY_RUN_RESULT)` が `beforeEach` で再設定され、TC 間の状態漏れがない。
4. apply 系（TC-A2 / TC-A7）は `mockResolvedValueOnce(DRY_RUN_RESULT).mockResolvedValueOnce(APPLY_RESULT)` の順序依存が崩れていない。

## 参照資料

| 種別 | パス |
|------|------|
| panel テスト | `apps/web/src/features/admin/components/_sync/__tests__/BackfillPublishStatePanel.spec.tsx` |
| schema テスト | `apps/web/src/features/admin/diagnostics/__tests__/sync-schemas.spec.ts` |
| 実装 | `BackfillPublishStatePanel.client.tsx` / `backfill.ts` |
| Phase 4 | 本ディレクトリ `phase-4.md` |

## 実行手順

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web test
mise exec -- pnpm lint
```

1. 既存 TC-A1..A7 / TC-B1..B4 を実行し全 green を確認する。
2. 拡充観点表に沿って未到達分岐の有無を点検する。
3. confirm モックの spillover がないこと（TC-A2c の false が他 TC に漏れない）を確認する。
4. grid 崩れ（`contents` wrapper）が描画上問題ないことを検証経路（TC-A3）で確認する。

## 統合テスト連携

- 3 層（endpoint / web schema / panel）のうち web 層の分岐網羅を本 Phase で確定し、Phase 7 の coverage マッピングへ引き渡す。

## 多角的チェック観点（AIが判断）

- 新規 TC を追加する場合でも命名は `*.spec.{ts,tsx}` のみか（不変条件 #8）。
- confirm モックの `mockReturnValue` が TC ごとに正しく分離されているか（flaky 防止）。
- `getAllByText` / `queryByText` が button 文言と dd 値を取り違えていないか。
- candidates=0 ケースを新設する場合、TC-A2b と重複しないか（冗長排除）。

## サブタスク管理

| ID | 内容 | 判定 |
|----|------|------|
| T6-1 | 境界・異常系の拡充観点整理 | 完了 |
| T6-2 | 追加候補ケースの要否判定（candidates=0 / skipped 全種） | 完了（既存 TC で充足） |
| T6-3 | 既存 TC green 維持確認 | 完了（landed） |

## 成果物

- 拡充観点・追加候補ケースの判定（本ファイル）。
- 既存 TC（`BackfillPublishStatePanel.spec.tsx` / `sync-schemas.spec.ts`）の green 維持確認。

## 完了条件

- [x] 境界・異常系（二重起動 / grid 崩れ / confirm 依存）の観点を整理した。
- [x] 追加候補ケース（candidates=0 / skipped 全種）の要否を既存 TC との重複で判定した。
- [x] 既存 TC-A1..A7 + TC-B1..B4 が拡充後も green。
- [x] coverage AC（apps/web 既定閾値 Statements/Branches/Functions/Lines >= 80%）の最終確認は Phase 7。

## タスク100%実行確認【必須】

- [x] 拡充観点と既存 TC の対応を表で示した。
- [x] confirm モック必須・grid wrapper・pending 二重起動の各観点を記述した。
- [x] 追加候補ケースが既存 TC で充足することを判定した。

## 次Phase

Phase 7（カバレッジ確認）。

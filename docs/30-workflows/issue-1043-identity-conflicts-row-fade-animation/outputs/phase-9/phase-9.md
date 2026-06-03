# Phase 9: 品質保証

`[実装区分: 実装仕様書]` / `implementation_mode: new` / `taskType: implementation` / `visualEvidence: VISUAL_ON_EXECUTION`

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 9（品質保証） |
| 実施ゲート | typecheck / lint / focused Vitest / playwright / OKLch token gate / legacy hook grep |
| N/A ゲート | line budget / mirror parity / ファイル削除判定（stub 不要） |

## 目的

exiting fade 実装後に、typecheck / lint / design-token gate（`verify-design-tokens`）/ legacy hook gate を一括判定し、すべて green であることを確認する。特に exiting fade が **Tailwind transition utility のみ**で構成され、HEX 直書き / `bg-[#xxx]` / `text-[#xxx]` / inline `style={{}}` を一切導入しないことを `verify-design-tokens` の PASS 基準として明記する。

## 実行タスク

### 9.1 品質ゲート方針

本タスクは **単一 component の編集タスク**（新規 file 作成・file 削除なし。test / playwright は既存 file の編集）。したがって line budget / mirror parity / ファイル削除判定は N/A とし、stub の作成も不要。

| 一般ゲート | 本タスクでの扱い |
| --- | --- |
| line budget（生成行数上限） | **N/A** — 既存 component への小差分。新規 file なし |
| mirror parity（生成物の左右一致） | **N/A** — mirror 生成物を持たないタスク |
| ファイル削除判定（stub 要否） | **N/A** — 削除ではなく `IdentityConflictRow.tsx`（+ test / playwright）の編集。削除対象ファイル不在、stub 不要 |

### 9.2 品質ゲート一括判定セット

| # | ゲート | コマンド | 期待結果 |
| --- | --- | --- | --- |
| 1 | 型チェック | `mise exec -- pnpm typecheck` | green（型エラー 0。`isExiting: boolean` / `exitTimerRef: ReturnType<typeof setTimeout> \| null` の整合含む） |
| 2 | lint | `mise exec -- pnpm --filter @ubm-hyogo/web lint` | green（違反 0。残れば `lint --fix` → 手修正） |
| 3 | focused Vitest | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | 全ケース PASS（exiting 開始 / removed 遷移 / rollback で exiting キャンセル / reduced-motion 即時 / success-stays-removed） |
| 4 | playwright e2e | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/admin-identity-conflicts.spec.ts` | 「fade 後の安定状態で row 消失」「rollback で復元」含め PASS。animation 中ではなく安定 locator state（`toHaveCount(0)` / `toBeVisible()`）を待つ |
| 5 | OKLch token gate | `verify-design-tokens`（CI gate / task-18） | exiting fade が transition utility のみで HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` ゼロ → PASS |
| 6 | legacy hook 未参照 grep | `grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx` | **0 件**（不変条件 #10） |

### 9.3 ゲート詳細

#### ゲート 4: Playwright 安定 locator state 待ち（flaky 防止）

- animation 中の中間状態（opacity 遷移途中）を assert しない。`expect(row).toHaveCount(0)`（removed 後）/ `expect(row).toBeVisible()`（rollback 復元後）の **安定終状態**を待つ。
- height collapse を行わない（Phase 8.4）ため layout reflow flaky を回避。reduced-motion で transition≈0 のため終状態到達が速い。

#### ゲート 5: OKLch トークン gate（`verify-design-tokens`）— exiting fade 非抵触の PASS 基準

- exiting fade で追加する className は **Tailwind transition utility のみ**: `transition-[opacity,transform]` / `duration-200` / `motion-reduce:transition-none` / `opacity-0`（+ 任意 `scale-[0.99]`）。いずれも色 token を持たない。
- 色を持つ markup（border / bg / text 色）は既存の `var(--ubm-color-*)` 参照のまま。rollback inline error も既存 `text-[var(--ubm-color-danger)]` / `role="alert"` を流用し、新規トークン参照を増やさない。
- **PASS 基準**: diff に HEX 直書き（`#xxxxxx`）/ `bg-[#...]` / `text-[#...]` / inline `style={{}}` が一切存在しないこと。`opacity-0` / `scale-[0.99]` / `duration-200` は色 token gate の対象外（数値 utility）であり抵触しない。

#### ゲート 6: legacy hook 未参照 grep

```bash
grep -rn "lib/useAdminMutation" apps/web/src/components/admin/IdentityConflictRow.tsx
# 期待: 出力なし（0 件）
```

- import は `import { useAdminMutation } from "../../features/admin/hooks";`（features 経由）のまま。legacy `@/lib/useAdminMutation` 参照を新規に増やさない（不変条件 #10）。

### 9.4 vitest 追加ケースの green 要件（Phase 4/6 整合）

| ケース | 期待 | 既存テストへの影響 |
| --- | --- | --- |
| exiting 開始 | merge 実行 click 直後に row が DOM に残ったまま exiting class（`opacity-0` 等）が付与される | 新規ケース |
| removed 遷移 | `fireEvent.transitionEnd(rowEl)` または fake timer 前進（`vi.advanceTimersByTime(EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS)`）後に row が DOM から消える | 既存「即 `toBeNull`」ケースの更新（Phase 2.4） |
| rollback で exiting キャンセル | trigger reject 後に exiting 解除で row 復元 + inline error（`role="alert"`）surface。exit timer は clear 済み | 既存 rollback ケースの更新（Phase 2.4） |
| reduced-motion 即時 | transition≈0 想定で transitionEnd 即発火 → row が即時 removed | 新規ケース |
| success-stays-removed | trigger resolve 後も row は消えたまま（再表示なし） | 既存 success ケースの assertion 更新 |

> dismiss 系テストは不変（変更しない）。dismiss に exiting を入れないため assertion も維持（AC-6）。

### 9.5 失敗時の自動修復方針

| ゲート | 失敗時対応 |
| --- | --- |
| typecheck | `isExiting`（`boolean`）/ `exitTimerRef`（`ReturnType<typeof setTimeout> \| null`）/ `useState(false)` の整合を確認。明白な型不整合を最小差分で修正 |
| lint | `lint --fix` を試行 → 残る違反のみ手修正 |
| vitest | RED の切り分け: removed 未遷移 → transitionEnd 発火 or fake timer 前進の漏れ / rollback 未復元 → `.catch` の `clearExitTimer`+`setIsExiting(false)` 漏れ / success-stays-removed 漏れ |
| playwright | 中間状態 assert を安定終状態待ちへ修正。route mount / mock 設定確認。capture は Phase 11（e2e 自体の green を優先） |
| token gate | diff の HEX / `bg-[#...]` / `text-[#...]` / inline style を Tailwind utility / `var(--ubm-color-*)` へ置換 |

## 参照資料

| 参照資料 | パス | 内容 |
| --- | --- | --- |
| 本WF Phase 2 設計 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-2/phase-2.md` | className 戦略（§2.2）/ reduced-motion 戦略（§2.3）/ jsdom transitionend 制約（§2.4） |
| 本WF Phase 8 | `docs/30-workflows/issue-1043-identity-conflicts-row-fade-animation/outputs/phase-8/phase-8.md` | MINOR-1（height collapse なし）/ transition utility のみ |
| design tokens 正本 | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠（不変条件 #2） |
| 兄弟テンプレート | `docs/30-workflows/completed-tasks/issue-988-identity-conflicts-merge-optimistic-update/outputs/phase-9/phase-9.md` | 一括判定セット書式・N/A ゲート判定 |

## 成果物

- 品質ゲート一括判定セット 6 件（§9.2）と N/A ゲート判定（§9.1）。
- `verify-design-tokens` の exiting fade 非抵触 PASS 基準（§9.3 ゲート 5）。
- vitest 追加ケースの green 要件（§9.4）/ 失敗時自動修復方針（§9.5）。

## 統合テスト連携

- ゲート 3（vitest）と Phase 7 coverage が同一 focused spec を共有し、§9.4 のケースが Phase 7 §7.4 の全分岐を踏む。
- ゲート 4（playwright）の安定 locator state 待ちが Phase 11 の screenshot 取得タイミング（fade 後安定状態）と整合する。

## 完了条件（Phase 9）

| 項目 | 基準 |
| --- | --- |
| 一括判定セット | typecheck / lint / vitest / playwright / token gate / legacy hook grep の 6 ゲートが all-green |
| token gate 非抵触 | exiting fade に HEX 直書き・`bg-[#xxx]` / `text-[#xxx]` / inline `style={{}}` が存在せず `verify-design-tokens` PASS |
| legacy hook | `lib/useAdminMutation` 参照 0 件 |
| N/A 明示 | line budget / mirror parity / ファイル削除判定が N/A、stub 不要と明記 |

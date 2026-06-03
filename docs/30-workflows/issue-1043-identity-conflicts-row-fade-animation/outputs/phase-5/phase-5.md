# Phase 5: 実装（仕様）

`[実装区分: 実装仕様書]` / `implementation_mode: new`

Issue #1043「optimistic row 消失に fade animation を追加（FU-AIDC-007）」の実装仕様。
Phase 4 の RED を GREEN にする最小差分を、本サイクルで実装した差分の最小設計を記録する。
コードの実装そのものは本サイクルで実装した。

## メタ情報

| 項目 | 値 |
| --- | --- |
| workflow_id | `issue-1043-identity-conflicts-row-fade-animation` |
| issue | #1043（FU-AIDC-007） |
| phase | 5（実装 / 仕様） |
| implementation_mode | new |
| 新規作成ファイル | **0 件** |
| 修正ファイル | **3 件**（下表） |

### 変更対象ファイル一覧（必須記載）

| 区分 | パス | 変更内容 |
| --- | --- | --- |
| 修正 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | `isExiting` state / `exitTimerRef` / `finalizeRemoval` / `onTransitionEnd` / `useEffect` cleanup 追加、root div の className へ transition utility と条件付き fade class 付与、`onMerge` を exiting 相起動へ書き換え |
| 修正 | `apps/web/src/components/admin/__tests__/IdentityConflictRow.spec.tsx` | Phase 4 の TC-EXIT-* / TC-ROLLBACK / TC-SUCCESS / TC-REDUCED / TC-DISMISS-UNCHANGED 追加、既存 line 99 / 155 更新（Phase 4 §4.4・§4.5） |
| 修正 | `apps/web/playwright/tests/admin-identity-conflicts.spec.ts` | optimistic 系 e2e を「安定状態（`toHaveCount(0)`）待ち」へ整合（Phase 6 で確定。本 Phase では参照） |

> **変更なし（参照のみ）**: `apps/web/src/styles/globals.css`（既存 reduced-motion 基盤を流用）/
> `apps/web/src/styles/tokens.css` / `apps/web/app/(admin)/admin/identity-conflicts/page.tsx` /
> `apps/web/src/features/admin/hooks/useAdminMutation.ts`。

## 目的

merge 二段階 confirm 完了直後の row 消失を「即時 `return null`」から「exiting 相（fade）→ removed 相」へ
置き換える。optimistic 体感・rollback 整合・reduced-motion a11y・design token gate 非抵触を維持する。

## 実行タスク

### 5.1 `IdentityConflictRow.tsx` 差分方針（擬似コード）

Phase 2 §2.1 のハンドラ設計を転記する。既存の `stage` / `optimisticMerged` / dialog / dismiss ロジックは不変。

#### import 追加

```ts
// 既存: import { useId, useState } from "react";
import { useEffect, useId, useRef, useState } from "react";
```

#### 定数（module スコープ）

```ts
// 退場アニメの想定時間（ms）。Tailwind の duration-200 と一致させる。
const EXIT_ANIMATION_MS = 200;
// transitionend が来なかった場合の安全 fallback の余白（ms）。
const EXIT_FALLBACK_BUFFER_MS = 50;
```

#### state / ref 追加（component 内・既存 useState 群の直後）

```ts
const [isExiting, setIsExiting] = useState(false);
const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

#### finalizeRemoval（removed 相へ遷移・冪等）

```ts
const finalizeRemoval = () => {
  if (exitTimerRef.current !== null) {
    clearTimeout(exitTimerRef.current);
    exitTimerRef.current = null;
  }
  setOptimisticMerged(true); // removed 相: 既存 `if (optimisticMerged) return null;` を発火
};
```

#### onMerge 書き換え（visible → exiting）

```ts
const onMerge = () => {
  setIsExiting(true); // exiting 相開始（fade out 視覚表現 = optimistic hide）
  // reduced-motion 環境では globals.css が transition-duration≈0 にするため transitionend が
  // ほぼ即時発火。来ない環境向けに timeout fallback を張る（removed 遷移を必ず保証）。
  exitTimerRef.current = setTimeout(
    finalizeRemoval,
    EXIT_ANIMATION_MS + EXIT_FALLBACK_BUFFER_MS, // = 250ms
  );
  void mergeMutation
    .trigger({
      targetMemberId: item.candidateTargetMemberId,
      reason: mergeReason.trim(),
    })
    .catch(() => {
      // rollback: exit timer を確実に解除し、exiting を解いて row を復元。
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      setIsExiting(false);
      // optimisticMerged は false 維持。既存 mergeError の inline 表示が surface する。
      // stage（merge-final）/ mergeReason はそのまま保持（既存挙動踏襲）。
    });
};
```

#### onTransitionEnd（exiting → removed）

root div に付与する。

```ts
const onRowTransitionEnd = () => {
  if (isExiting) finalizeRemoval();
};
```

> `transitionend` は opacity + transform の複数 property で複数回発火しうるが、`finalizeRemoval` は
> `clearTimeout` + `setOptimisticMerged(true)` で冪等。`optimisticMerged===true` 後は `return null` で
> 再 render されないため二重発火しても副作用なし。

#### アンマウント時 timer leak 防止

```ts
useEffect(
  () => () => {
    if (exitTimerRef.current !== null) clearTimeout(exitTimerRef.current);
  },
  [],
);
```

#### render 分岐（既存維持 + root div className 変更）

```tsx
if (optimisticMerged) return null; // removed 相（既存・不変）

return (
  <div
    onTransitionEnd={onRowTransitionEnd}
    className={
      "flex flex-col gap-3 rounded border border-[var(--ubm-color-border-default)] " +
      "bg-[var(--ubm-color-surface-panel)] p-4 " +
      "transition-[opacity,transform] duration-200 motion-reduce:transition-none" +
      (isExiting ? " opacity-0 scale-[0.99]" : "")
    }
  >
    {/* 既存の中身（conflict メタ / merge dialog / dismiss dialog）は完全に不変 */}
  </div>
);
```

> className は文字列連結 / テンプレートリテラル / `clsx` 相当いずれでもよいが、
> **既存の `var(--ubm-color-*)` を保持**し、HEX 直書き / inline `style={{}}` を追加しないこと。
> `scale-[0.99]` は collapse 感の補助（Phase 3 MINOR-1: 任意・opacity 単独でも AC 充足）。
> height collapse（行高縮小）は flaky リスクのため本タスクでは行わない。

### 5.2 dismiss 経路の不変性（明示）

- `onDismiss` / `cancelDismiss` / dismiss dialog の JSX は一切変更しない。
- dismiss は exiting 相を経ず、`isExiting` / `exitTimerRef` / `finalizeRemoval` に触れない。
- dismiss 成功後の row 表示挙動は既存のまま（AC-6 / TC-DISMISS-UNCHANGED）。

### 5.3 diff check 観点（変更は exiting 相のみ）

| 観点 | 期待 |
| --- | --- |
| 変更箇所 | import / 定数 / `isExiting`・`exitTimerRef` / `finalizeRemoval` / `onMerge` / `onTransitionEnd` / `useEffect` / root div className のみ |
| 既存ロジック不変 | `stage` 遷移 / `optimisticMerged` の `return null` / merge dialog（確認 1/2・2/2）/ dismiss dialog / `mergeError`・`dismissError` 表示 / `useAdminMutation` 呼び出し shape |
| API / hook 不変 | merge / dismiss endpoint・payload・`useAdminMutation` import（`../../features/admin/hooks`）は無変更（不変条件 #1 / #10） |
| token gate | HEX 直書き 0 / inline `style={{}}` 追加 0 / 新規 token・keyframes 0（不変条件 #2） |
| legacy hook | `@/lib/useAdminMutation` 参照 0（不変条件 #10） |

### 5.4 実装後の検証コマンド（リポジトリルートから）

```bash
# 型チェック
mise exec -- pnpm typecheck

# web パッケージの lint
mise exec -- pnpm --filter @ubm-hyogo/web lint

# focused Vitest（GREEN 化確認）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run src/components/admin/__tests__/IdentityConflictRow.spec.tsx
```

## 参照資料

| 参照資料 | パス | 用途 |
| --- | --- | --- |
| Phase 2 設計 | `../phase-2/phase-2.md` | §2.1 ハンドラ設計 / §2.2 className / §2.6 timer 解放経路 |
| Phase 3 レビュー | `../phase-3/phase-3.md` | MINOR-1（scale 任意 / height collapse 不採用） |
| Phase 4 テスト | `../phase-4/phase-4.md` | GREEN 化対象の RED ケース |
| 既存実装 | `apps/web/src/components/admin/IdentityConflictRow.tsx` | 編集対象 |
| reduced-motion 基盤 | `apps/web/src/styles/globals.css`（line 1998-2007） | 既存グローバル transition-duration 0 化（参照のみ） |
| design tokens | `docs/00-getting-started-manual/specs/design-tokens.md` | HEX 直書き禁止根拠 |
| mutation hook | `apps/web/src/features/admin/hooks/useAdminMutation.ts` | 不変条件 #10（参照のみ） |

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `outputs/phase-5/phase-5.md` | 修正3ファイルの差分方針（`IdentityConflictRow.tsx` の exiting 相実装擬似コード・`isExiting`/`exitTimerRef`/`finalizeRemoval`/`onMerge`/`onTransitionEnd`/`useEffect` cleanup・条件付き className・diff check 観点） |

## 統合テスト連携

- 実装後、Phase 4 の focused Vitest が全 GREEN になること（AC-7）。
- `pnpm typecheck` / `pnpm --filter @ubm-hyogo/web lint` green（AC-9）。
- Phase 6 で fail path / 連打防止 / network error rollback / token guard / legacy hook guard を拡充し、
  Playwright e2e（`admin-identity-conflicts.spec.ts`）を安定状態待ちへ整合（AC-8）。
- Phase 11 で merge-final → exiting-fade → removed-stable → rollback-restored の screenshot を取得（AC-11・user-gated）。

## 完了条件（Phase 5）

- 新規 0 件 / 修正 3 件のファイル一覧を確定した。
- `IdentityConflictRow.tsx` の差分方針を擬似コード（import / 定数 / state・ref / `finalizeRemoval` /
  `onMerge` / `onTransitionEnd` / `useEffect` / 条件付き className）で確定した。
- 変更は exiting 相のみ・既存 dismiss/stage/error/API/hook 不変という diff check 観点を確定した。
- 実装後の検証コマンド（typecheck / lint / focused Vitest）を確定した。

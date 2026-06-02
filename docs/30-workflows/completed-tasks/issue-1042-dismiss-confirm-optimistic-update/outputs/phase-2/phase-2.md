# Phase 2: 設計

**[実装区分: 実装仕様書 / 状態: implemented_local_evidence_captured]**

## 2.1 既存コンポーネント再利用可否（FB-SDK-07-1）

新規 UI コンポーネント実装は**ゼロ**。既存 `IdentityConflictRow` の merge optimistic 機構（`optimisticMerged` + render guard + `.catch` rollback）を dismiss 側へ対称適用する。新規 primitive / 新規 hook は生やさない（不変条件 #3 / #9 / #10）。

## 2.2 因果と境界

**バランスループ（B1: 体感速度の対称化）**
```
dismiss 実行 → optimisticDismissed=true → row 即時非表示 → 体感速度↑（merge と対称）
            → server 応答 → 成功なら router.refresh() で list 整合（非表示維持）
                          → 失敗なら .catch で optimisticDismissed=false → row 復元（B1 を打ち消す安全弁）
```

**強化ループ（R1: 大量 conflict 処理の効率）**
```
row 即時消失 → 次の conflict へ即移行 → 処理速度↑ → 管理者の連続処理が加速
```

**状態所有権の明示**

| 状態 | 所有者 | 備考 |
|---|---|---|
| `optimisticMerged` | `IdentityConflictRow`（component-local） | merge 専用。本タスクで触らない |
| `optimisticDismissed`（**新規**） | `IdentityConflictRow`（component-local） | dismiss 専用。merge と独立 |
| `dismissReason` | `IdentityConflictRow`（component-local） | rollback 時も保持 |
| mutation 状態（isLoading/error） | `useAdminMutation`（hook） | 変更しない |
| server list（正本） | `page.tsx`（Server Component） + `router.refresh()` | 変更しない |

→ UI（component-local optimistic）と Store（server list）の所有権を混在させない。rollback は component-local state のみで完結。

## 2.3 state 分離の設計判断（Issue 苦戦箇所の写像）

Issue #1042 苦戦箇所:
> merge 側は `optimisticMerged` で row を `return null` にしているが、dismiss 側を同じ state に混ぜると、error surface が merge / dismiss のどちらに属するか分からなくなる。

**設計決定**:
- state は **分離**: `optimisticMerged`（既存）と `optimisticDismissed`（新規）を別々の `useState<boolean>` にする。
- 可視性条件だけ **合流**: render guard を `if (optimisticMerged || optimisticDismissed) return null;` にする。
- error surface は既存どおり分離: `mergeError`（merge stage 内）/ `dismissError`（dismiss stage 内）はそれぞれの mutation.error 由来で独立表示。

> 知見: optimistic visibility state は「操作種別ごとに独立」させ、render guard だけで合流させると rollback の責務が明確になる。

## 2.4 ステップ間 state 引き渡しテーブル（dismiss フロー）

| stage | trigger | state 変化 | 可視性 |
|---|---|---|---|
| `idle` | 「別人マーク」click | `stage = "dismiss"` | row 表示・dismiss 入力欄表示 |
| `dismiss` | 「別人として確定」click（`onDismiss`） | `optimisticDismissed = true` → `trigger()` | row 即時非表示（`return null`） |
| `dismiss`（成功） | server 200 → `onSuccess` | `stage="idle"` / `dismissReason=""` / `router.refresh()` | 非表示維持（list 後追い） |
| `dismiss`（失敗） | server reject → `.catch` | `optimisticDismissed = false`（`dismissReason` 保持） | row 復元・`dismissError` inline 表示 |

## 2.5 ロック変数の解放経路テーブル（正常 / エラー / キャンセル）

`optimisticDismissed` は「row 非表示ロック」に相当。解放経路を全網羅:

| 経路 | `optimisticDismissed` の終端値 | 根拠 |
|---|---|---|
| 正常（成功） | `true` 維持 | row は消えたまま。server list が後追いで反映 |
| エラー（reject） | `false`（解放） | `.catch(() => setOptimisticDismissed(false))` で row 復元 |
| キャンセル（`cancelDismiss`） | 影響なし（`onDismiss` 未実行のため `true` にならない） | cancel は dismiss 実行前なので optimistic 化していない |

→ merge と異なり「ロック解放漏れ」リスクは構造的に低い（trigger 前の cancel では optimistic 化しない）。ただし実装時は `.catch` での解放を必須テストで固定する（Phase 4 AC-3）。

## 2.6 検証 path（SubAgent lane / validation）

| lane | 内容 | 並列性 |
|---|---|---|
| 実装 lane | `IdentityConflictRow.tsx` 編集 | 単一（小規模・1 component） |
| component test lane | `IdentityConflictRow.spec.tsx` 追加 | 実装後 |
| e2e lane | Playwright dismiss optimistic / rollback | component test 後 |
| validation lane | typecheck / lint / focused vitest / Playwright focused | 直列で締める |

## 2.7 不変条件チェック（設計時点）

| # | 不変条件 | 本設計での遵守 |
|---|---|---|
| 1 | 既存 API のみ | endpoint `/dismiss` は既存。payload `{ reason }` 不変 |
| 2 | OKLch トークン正本 | 新規色なし。既存 `var(--ubm-color-*)` のみ |
| 5 | `apps/web` から D1 直接アクセス禁止 | UI のみ変更。D1 非接触 |
| 9 | admin form は FormField/primitive 経由 | 既存 `Textarea` / `Button` primitive を継続使用。新規 `<input>` 追加なし |
| 10 | admin mutation は `@/features/admin/hooks/useAdminMutation` 経由 | 既存 `dismissMutation` を継続使用。legacy `@/lib/useAdminMutation` 不使用 |

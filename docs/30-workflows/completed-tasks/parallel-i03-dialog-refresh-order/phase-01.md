# Phase 01: 要件定義

[実装区分: 実装仕様書]

## 目的

profile 画面の request dialog (Visibility / Delete) の submit 成功時に発生し得る race condition / unmounted-component warning を排除するため、親仕様 `parallel-02-state-sync` §4.2 が定める呼び出し順序 `router.refresh() → onSubmitted → onClose` を dialog component 内で固定する。

## 背景

- 親仕様 `parallel-02-state-sync` §4.2 (line 95-117) で順序が明示されている。
- 現状実装では `RequestActionPanel.tsx` の `onSubmitted` callback 内で `router.refresh()` を呼んでおり、dialog の `onClose()` で unmount された直後に parent 側 callback から refresh が発火する。
- React 18+ の dev mode で「unmounted component から navigation API を呼び出すケース」での warning と、Next.js App Router の `router.refresh()` を unmounted 状態で発火することによる race condition が懸念される。

## 要件 (functional)

1. `VisibilityRequestDialog` の submit 成功 path で、`router.refresh()` を最先に発火する。続けて `onSubmitted(res.accepted)` → `onClose()` を呼ぶ。
2. `DeleteRequestDialog` で同パターンを適用する。
3. `RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` の発火を撤去する。
4. `useRouter()` の import が他で使われていない場合は削除し lint clean を保つ。
5. 各 dialog の component spec で呼び出し順序を assert する。
6. RequestActionPanel の component spec で parent 側 refresh が**呼ばれない**ことを assert する。

## 要件 (non-functional)

- dialog props / mutation endpoint シグネチャは不変。
- catch / else 分岐の挙動は不変。
- 既存 test 資産の他ケースを破壊しない。
- 新規 test ファイルは `*.spec.tsx` 命名規約に従う（`*.test.tsx` 禁止）。

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` | modify | `useRouter` import + 成功 path に refresh 追加 |
| `apps/web/app/profile/_components/DeleteRequestDialog.tsx` | modify | 同上 |
| `apps/web/app/profile/_components/RequestActionPanel.tsx` | modify | `onSubmitted` から refresh 撤去 |
| `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx` | modify | 順序 assertion 追加 |
| `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx` | modify | 順序 assertion 追加 |
| `apps/web/app/profile/_components/RequestActionPanel.component.spec.tsx` | modify | parent 側 refresh 非発火 assert 追加 |

## 関数シグネチャ

```ts
// 不変
type VisibilityRequestDialogProps = {
  onSubmitted: (accepted: QueueAccepted) => void;
  onClose: () => void;
  // ...
};

type DeleteRequestDialogProps = {
  onSubmitted: (accepted: QueueAccepted) => void;
  onClose: () => void;
  // ...
};
```

## 入出力・副作用

| 時点 | 副作用 |
|------|--------|
| mutation success | `router.refresh()` を schedule（Server Component 再 fetch 起動） |
| 直後 | `onSubmitted(res.accepted)` で parent local state 更新 |
| 最後 | `onClose()` で dialog unmount |

順序保証により、unmount 時点で `router.refresh()` は既に schedule 済となり、unmounted-component warning と race condition が消える。

## DoD（Phase 1 完了条件）

- [x] `outputs/phase-01/requirements.md` に上記要件・AC・スコープ・不変条件が記載
- [x] AC-1〜AC-8 が index.md と整合
- [x] 変更対象ファイル一覧が確定し implementation_status が `implemented_local_evidence_captured` に同期済み

## ローカル実行コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

（本 Phase は仕様確定のみ。実装は Phase 06 以降）

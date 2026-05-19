# integration-fixes i03 dialog refresh order 修正 - タスク指示書

## メタ情報

| 項目         | 内容                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------- |
| タスクID     | integration-fixes-i03-dialog-refresh-order                                                      |
| タスク名     | profile request dialog で `router.refresh()` 呼び出し順序を spec 通りに修正                     |
| 分類         | 改善 / integration fix（UX バグ修正）                                                           |
| 対象機能     | `/profile` 配下の VisibilityRequestDialog / DeleteRequestDialog / RequestActionPanel の状態同期 |
| 優先度       | 高                                                                                              |
| 見積もり規模 | 小規模                                                                                          |
| ステータス   | consumed                                                                                        |
| canonical_workflow | `docs/30-workflows/issue-766-dialog-refresh-order/`                                       |
| consumed_by | Issue #766 canonical workflow                                                                    |
| 発見元       | improvements integration-fixes 接続検証（i03 ギャップ）                                         |
| 発見日       | 2026-05-16                                                                                      |
| consumed日   | 2026-05-18                                                                                      |

## Canonical Workflow Status

- 親 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/`
- 親タスク状態: `spec_ready_implementation_pending`
- consumed_by: Issue #766 canonical workflow (`docs/30-workflows/issue-766-dialog-refresh-order/`)
- ソース spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md`
- 上位 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/`（不変条件 1〜4 を継承）
- 関連 spec（順序ルールの起源）: `improvements/parallel-02-state-sync/spec.md` 4.2 節（line 95-117）
- 関連実装:
  - `apps/web/app/profile/_components/VisibilityRequestDialog.tsx`
  - `apps/web/app/profile/_components/DeleteRequestDialog.tsx`
  - `apps/web/app/profile/_components/RequestActionPanel.tsx`
  - `apps/web/app/profile/_components/VisibilityRequestDialog.component.spec.tsx`
  - `apps/web/app/profile/_components/DeleteRequestDialog.component.spec.tsx`

---

## 1. なぜこのタスクが必要か（Why）

### 1.1 背景

`parallel-02-state-sync` spec 4.2 は profile dialog における mutation 成功時の副作用順序を以下の**固定ルール**として定義している。

```
1) router.refresh()
2) onSubmitted(res.accepted)
3) onClose()
```

この順序は「Server Component の再 fetch を先発火 → parent 通知 → dialog unmount」を保証することで、unmount 後に navigation API が呼ばれて React 警告が出る race condition を排除する設計である。

ところが integration-fixes 接続検証の実 grep / file read で、`RequestActionPanel.tsx:57` が `onSubmitted` callback の内側で `router.refresh()` を呼び、その後に dialog 側で `onClose()` を発火する**逆順実装**になっていることが判明した。dialog 側 (`VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx`) には `router.refresh()` の呼び出しが存在せず、parent 側からの遅延発火に依存している。

### 1.2 問題点・課題

- spec 4.2 が定める呼び出し順序ルールと実装が逆転している（spec 違反）
- dialog `onClose()` 後に `router.refresh()` が走るタイミングが発生し得るため、profile dialog の close と server component 再 fetch の間で stale UI が一瞬見えるバグが顕在化する
- "unmounted component から navigation API 呼び出し" warning および race condition リスク
- 同型の dialog mutation が他箇所で追加される際に同じ逆順実装を踏襲する横展開リスク

### 1.3 放置した場合の影響

- profile (`/profile`) の visibility / delete request 操作で banner UI が一瞬古い値のまま残るユーザー体感バグが残存
- React の navigation API warning が production console に出続け、後続障害解析時のノイズになる
- `parallel-02-state-sync` の DoD（順序ルール遵守）が未達のまま integration-fixes workflow が `completed` に進めない
- 同パターンの dialog（今後追加される admin mutation 等）に逆順実装が伝播する

---

## 2. 何を達成するか（What）

### 2.1 目的

`parallel-02-state-sync` spec 4.2 で固定された `router.refresh() → onSubmitted → onClose` の呼び出し順序を **dialog component 内**で確実に実施し、`RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` を撤去して二重発火・逆順発火の双方を排除する。

### 2.2 最終ゴール

- `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` の onSubmit 成功 path で `router.refresh()` が最先に発火される
- `RequestActionPanel.tsx` の `onSubmitted` から `router.refresh()` が撤去され、未使用となった `useRouter` import が lint clean な状態で除去される
- 各 dialog の component spec で `["refresh", "onSubmitted", "onClose"]` の順序 assertion が PASS する
- `RequestActionPanel.component.spec.tsx` で `router.refresh` が parent 側から発火されないことを assert する

### 2.3 スコープ

#### 含むもの

- `VisibilityRequestDialog.tsx` 内 onSubmit 成功 path で `useRouter` を呼び `router.refresh()` を first 発火
- `DeleteRequestDialog.tsx` で同パターンを適用
- `RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` を撤去
- 関連 component spec で呼び出し順序を検証
- 未使用 `useRouter` import の整理（lint PASS）

#### 含まないもの

- mutation endpoint の挙動変更
- banner UI のスタイル変更
- `QueueAccepted` 型の変更
- catch / else 分岐の振る舞い変更（spec の race condition 対象は成功 path のみ）
- dialog props のシグネチャ変更

### 2.4 成果物

- 上記 3 component の修正差分
- 2 dialog spec の順序 assertion 追加差分
- `RequestActionPanel.component.spec.tsx` の refresh 非発火 assertion 差分
- `pnpm typecheck` / `pnpm lint` / 該当 component test の PASS evidence

---

## 3. 苦戦箇所 (Struggle Points)

### 3.1 callback hoisting による逆順実装の罠

`RequestActionPanel.tsx:57` で `router.refresh()` を `onSubmitted` callback の中に置いた当初実装は、一見「mutation 成功通知後にリフレッシュ」という直感的な読み下しに合致する。しかし dialog 側で `onSubmitted` を呼んだ直後に `onClose()` を発火する構造のため、実行順序は以下になる。

```
dialog 内 onSubmit success
  → onSubmitted() を呼ぶ        // parent callback がここで router.refresh() を schedule
  → onClose()                   // dialog unmount
  // この後、scheduled refresh が走る → 既に unmount 済み component から呼ばれた扱いになる
```

spec 4.2 は「refresh は dialog がまだ mount されている時点で発火し、その後 unmount する」ことを暗黙の前提にしているため、parent callback に refresh を委譲した時点で順序が逆転する。

### 3.2 解決策候補（実施順）

1. **dialog 内で refresh を最先に発火する**: `VisibilityRequestDialog.tsx` / `DeleteRequestDialog.tsx` の onSubmit 成功 path 冒頭で `useRouter` を取得し `router.refresh()` を呼ぶ。続いて `onSubmitted(res.accepted)` → `onClose()`。
2. **parent 側から refresh を撤去する**: `RequestActionPanel.tsx` の `onSubmitted` から `router.refresh()` を削除し、二重発火を防ぐ。
3. **未使用 import の整理**: `RequestActionPanel.tsx` で `useRouter` が他用途で使われていない場合は import を削除（lint clean）。
4. **順序 assertion の追加**: dialog spec で `vi.mock("next/navigation", ...)` により `useRouter` をモック化し、`callOrder` 配列で `["refresh", "onSubmitted", "onClose"]` を assert。
5. **parent 側の非発火 assertion**: `RequestActionPanel.component.spec.tsx` で `router.refresh` mock が呼ばれないことを assert。

### 3.3 学んだこと / 横展開メモ

- **mutation 完了 → refresh → close の順序は dialog（呼び出し元最寄り）でカプセル化するべき**。parent callback に副作用順序を委譲すると、dialog 側の close タイミングと parent callback 実行タイミングのズレで逆順実装になりやすい。
- 将来的に同型 mutation（admin の承認 dialog 等）が増える場合、`useAdminMutation` 等の mutation hook 側で `{ onSuccess: () => { router.refresh(); onSubmitted?.(); onClose?.(); } }` の順序を強制する **mutation hook 側カプセル化案** を採用する選択肢がある。これにより呼び出し側は順序を意識せずに正しい振る舞いになる。
- React の navigation API は **mount 中の component から呼ぶ前提**で設計されている。unmount 直前にスケジュールする副作用は、unmount 直後に dispatched されると warning 対象になりやすい。「副作用は早く・unmount は最後」のルールを順序ガイドラインとして横展開する。
- `vi.mock("next/navigation", ...)` での `useRouter` モック化と `callOrder` 配列による順序検証は、今後 router 副作用を持つ component で再利用可能なパターン。

---

## 4. 受入条件 (AC)

- **AC-1**: `apps/web/app/profile/_components/VisibilityRequestDialog.tsx` の onSubmit 成功 path で `router.refresh() → onSubmitted(res.accepted) → onClose()` の順に呼び出される
- **AC-2**: `apps/web/app/profile/_components/DeleteRequestDialog.tsx` の onSubmit 成功 path で同順序が実装される
- **AC-3**: `apps/web/app/profile/_components/RequestActionPanel.tsx` の `onSubmitted` callback から `router.refresh()` が撤去され、`useRouter` が他用途で未使用なら import も削除されている
- **AC-4**: `VisibilityRequestDialog.component.spec.tsx` および `DeleteRequestDialog.component.spec.tsx` で `callOrder` が `["refresh", "onSubmitted", "onClose"]` であることを assert し PASS する
- **AC-5**: `RequestActionPanel.component.spec.tsx` で `router.refresh` mock が parent 側から呼ばれないことを assert し PASS する
- **AC-6**: `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint` がローカル PASS
- **AC-7**: `mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run profile/_components` が 0 fail で完走
- **AC-8**: dev 環境で `/profile` の visibility / delete request 操作を行い、mutation 成功直後に banner UI が古い値を残さず即時更新されることを目視確認
- **AC-9**: dialog props (`onSubmitted: (accepted: QueueAccepted) => void` 等) のシグネチャが変更されておらず、既存 caller の破壊がない
- **AC-10**: catch / else 分岐の振る舞いが変更されていない（成功 path のみ修正対象）

---

## 5. 参照資料

- 親 spec: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i03-dialog-refresh-order/spec.md`
- 親 index: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/index.md`
- 順序ルールの起源: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-02-state-sync/spec.md` 4.2 節（line 95-117）
- 上位 workflow: `docs/30-workflows/ui-prototype-alignment-mvp-recovery/` の不変条件 1〜4
- CLAUDE.md「UI prototype alignment / MVP recovery」セクション
- 横展開先候補: `apps/web/src/features/admin/hooks/useAdminMutation.ts`（mutation hook 側カプセル化案の適用検討先）

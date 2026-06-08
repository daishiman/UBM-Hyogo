---
phase: 12
task_id: issue-1102-usedismissable-hook-extraction
visual_category: NON_VISUAL
implementation_mode: new
status: completed
---

# Phase 12: 実装ガイド（useDismissable hook 抽出）

## Part 1: 概念説明（中学生レベル）

### 背景（なぜ必要か）

メニューやヘルプの吹き出し（popover）を開いたまま、別の場所をクリックしたり Esc キーを押したら、自動で閉じてほしいですよね。この「外側を触ったら閉じる」「Esc で閉じる」という見張り係の仕事を、これまでは 2 つの画面（サイドバーのアカウントメニューと、表示密度の切り替えヘルプ）が**それぞれ自前で雇って**いました。中身はほとんど同じ仕事なのに、別々のコードとして 2 か所に書かれていた、ということです。

同じ仕事を 2 人が別々にやっていると、片方だけ直し忘れる事故が起きます。たとえば「Esc で閉じる」処理を片方の画面にだけ書き忘れたり、見張りを辞めるとき（画面を閉じるとき）に後片付けを忘れて、見えないゴミ（メモリリーク）が残ったりします。

### 要約（何をするか）

そこで、この「外側を触ったら閉じる・Esc で閉じる」係を、1 人の共通スタッフ `useDismissable` にまとめます。2 つの画面はこの共通スタッフを 1 行呼ぶだけになり、自前の見張りコードを捨てます。これは「見た目や動きを変える」改造ではなく、「同じ動きのまま、中の書き方だけ整理する」お掃除（リファクタ）です。だから画面の見た目は 1 ミリも変わりません。

### 実装ステップ（おおまかな流れ）

1. 共通スタッフ `useDismissable.ts` を新しく作る（外側クリックと Esc を見張る部品）。
2. その部品が正しく働くか確認するテスト（`useDismissable.spec.tsx`）を作る。
3. サイドバーのアカウントメニューの自前見張りコードを、共通スタッフ呼び出しに置き換える。
4. 表示密度ヘルプの自前見張りコードも、同じ共通スタッフ呼び出しに置き換える。

### 検証コマンド（ちゃんと動くか確かめる方法）

置き換えのあと、自動テストを走らせて「前と同じ動きのまま」を確認します。前から使っていたテストを 1 文字も変えずに全部 OK になれば、「動きが変わっていない」証拠になります。

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useDismissable.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
```

### 既知制限（気をつけること）

- 共通スタッフは「開いている／閉じている」の状態は持ちません。開閉の管理は今まで通り画面側（`<details>` というブラウザ標準のしくみ）が持ちます。役割を混ぜると壊れるので、わざと分けています。
- サーバー側（ブラウザがない場所）では、見張る相手がいないので何もしません（安全に空振り）。

## Part 2: 技術詳細（開発者向け）

### 背景

`<details>` popover の dismiss（外側 pointerdown / Escape 閉じ）ロジックが `SidebarUserMenu.tsx` と `DensityToggle.client.tsx` の 2 箇所に重複していた（DRY 違反）。片側のみ Escape 漏れ / cleanup 漏れ（リスナーリーク）が起きる drift リスクを根絶するため、共通 hook `apps/web/src/hooks/useDismissable.ts` に抽出し、両 consumer を移行した。NON_VISUAL（挙動不変）/ implementation_mode=new / implemented_local_evidence_captured。

### 要約（API 型定義）

```ts
import { useEffect, type RefObject } from "react";
import { browserDocument } from "../lib/is-browser";

export type DismissReason = "pointerdown-outside" | "escape";

export interface UseDismissableOptions {
  /** false のとき listener を張らない（既定 true）。条件付き有効化に使う。 */
  readonly enabled?: boolean;
}

export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  onClose: (reason: DismissReason) => void,
  options?: UseDismissableOptions,
): void;
```

`ref` は dismiss 領域 root（`<details>` 想定だが `HTMLElement` 汎用）、`onClose(reason)` は閉じる指示の受け口、`options.enabled` で有効化を切り替える。戻り値は `void`。

### 実装ステップ

1. `useDismissable.ts` を新規作成。内部は `useEffect` で `browserDocument()` を取得し、`enabled === false` または `doc` が undefined のとき early return（副作用なし）。`pointerdown` / `keydown` を登録し cleanup で removeEventListener。deps は `[ref, onClose, enabled]`。
2. `useDismissable.spec.tsx` を新規作成（両 reason / 内側無視 / Tab 無視 / enabled:false no-op / unmount cleanup / ref null / SSR no-op）。
3. `SidebarUserMenu.tsx` を編集。inline `useEffect`（L34-58）を削除し、`useDismissable(detailsRef, closeMenu)` 1 行へ。route-close `useEffect` は責務別ゆえ残置。`browserDocument` 直接 import を除去。
4. `DensityToggle.client.tsx` を編集。inline `useEffect`（L76-101）を削除し、`useDismissable(detailsRef, onDismiss)` へ。`browserDocument` 直接 import を除去。

### API 使用例（consumer の onClose 実装）

`<details>.open` の判定（open ガード）と Escape 時の summary focus 復帰は呼び出し側に委ねる。これにより hook は open state に依存せず（I-2）、既存挙動を完全保持する。

```ts
// SidebarUserMenu.tsx — reason は無視（両理由で同一の close 動作）
const closeMenu = useCallback(() => {
  const d = detailsRef.current;
  if (d?.open) d.open = false;
}, []);
useDismissable(detailsRef, closeMenu);

// DensityToggle.client.tsx — Escape のときだけ summary に focus 復帰
const onDismiss = useCallback((reason: DismissReason) => {
  const d = detailsRef.current;
  if (!d?.open) return;
  d.open = false;
  if (reason === "escape") d.querySelector("summary")?.focus();
}, []);
useDismissable(detailsRef, onDismiss);
```

### 内部ロジック（hook 本体）

```ts
export function useDismissable(ref, onClose, options) {
  const enabled = options?.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    const doc = browserDocument();
    if (!doc) return; // SSR/Workers: no-op (I-5)

    const onPointerDown = (event: PointerEvent) => {
    const el = ref.current;
    const target = event.target;
    if (!el) return;
    const NodeCtor = doc.defaultView?.Node;
    if (NodeCtor && target instanceof NodeCtor && el.contains(target)) return; // 内側は無視
      onClose("pointerdown-outside");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose("escape");
    };

    doc.addEventListener("pointerdown", onPointerDown);
    doc.addEventListener("keydown", onKeyDown);
    return () => {
      doc.removeEventListener("pointerdown", onPointerDown);
      doc.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, onClose, enabled]);
}
```

### エラーハンドリング / エッジケース

| ケース | 挙動 |
| --- | --- |
| SSR / Workers（`browserDocument()` が undefined） | `if (!doc) return` で no-op。throw しない（I-5） |
| `event.target` が非 Node | `target instanceof NodeCtor` ガードで `contains` 判定をスキップし、外側 pointerdown として `onClose("pointerdown-outside")` を呼ぶ。`ref.current` 不在時（`!el`）は早期 return で `onClose` を呼ばない |
| `ref.current === null`（未マウント） | `if (!el) return` で `onClose` を呼ばない（throw なし） |
| `options.enabled === false` | `if (!enabled) return` で listener を張らない（no-op） |
| unmount / deps 変化 | cleanup で `pointerdown` / `keydown` を removeEventListener（リークなし） |
| `onClose` の再生成 | consumer 側で `useCallback` 安定化し、不要な listener 再登録を防ぐ（deps に `onClose` を含むため） |

### 設定可能パラメータ / 定数一覧

| 項目 | 値 / 既定 | 説明 |
| --- | --- | --- |
| `options.enabled` | 既定 `true` | `false` で listener 非登録（条件付き有効化） |
| `DismissReason` | `"pointerdown-outside"` / `"escape"` の 2 値 | `onClose` に渡る閉じ理由。consumer は reason で分岐（DensityToggle の summary focus 復帰など） |
| 登録イベント | `pointerdown` / `keydown` | document（`browserDocument()`）に bubble phase で登録（capture 不使用＝現行挙動維持） |
| 所有しない状態 | `<details>.open` | hook は読み書きしない（I-2）。open 制御は `onClose` 内で呼び出し側が行う |

各識別子（`useDismissable` / `DismissReason` / `UseDismissableOptions` / `enabled` / `pointerdown-outside` / `escape`）は確定 API（Phase 2 §2.3）に一致させる（drift 防止）。

### 検証コマンド

```bash
# focused vitest（hook 単体 + consumer 2 本の無改修回帰）
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  apps/web/src/hooks/__tests__/useDismissable.spec.tsx \
  apps/web/src/components/shell/__tests__/SidebarUserMenu.spec.tsx \
  apps/web/src/components/public/__tests__/DensityToggle.client.spec.tsx
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```

### 既知制限

- `reason` は 2 値のみ（YAGNI）。blur / route 変更等の追加理由は現行 consumer に需要がなく対象外（Phase 10 §10.3 M-2）。
- capture phase オプションは未提供（現行 consumer 不使用・挙動不変が目的・Phase 10 §10.3 M-3）。
- focus-trap modal（背景 inert / Tab 循環）は責務が異なり横展開対象外（Phase 10 §10.3 M-1）。既存 `useFocusTrap` の領域。
- jsdom 制約（実ブラウザの pointer デバイス差・実フォーカスリング描画は範囲外）。挙動不変ゆえ現行と同一制約。

## 視覚証跡

**UI/UX 変更なしのため Phase 11 スクリーンショットは不要。** 本タスクは dismiss 検知ロジックの hook 抽出（NON_VISUAL・挙動不変リファクタ）であり、DOM 構造・className・OKLch トークン・表示テキスト・`<details>` の開閉外形を一切変更しない。before/after に視覚差分が存在しないため、`outputs/phase-11/` に画像は配置せず、PR 本文にもスクリーンショット専用セクションを設けない（CLAUDE.md PR フロー準拠）。

代替証跡として以下を参照する:

- `outputs/phase-11/manual-test-result.md`: focused vitest（hook 単体 + consumer 回帰）による挙動不変の証明・NON_VISUAL 判定根拠。
- `phase-10-final-review.md`: AC-1〜AC-8 の網羅判定（仕様として全 PASS）・blocker なし・未タスク化 MINOR 0 件の最終判定。

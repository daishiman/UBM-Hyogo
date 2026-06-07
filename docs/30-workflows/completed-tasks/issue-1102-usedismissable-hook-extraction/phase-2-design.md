---
phase: 2
name: 設計
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 2: 設計

## 2.1 既存コンポーネント再利用可否（[FB-SDK-07-1]）

| 検討 | 結論 |
| --- | --- |
| 既存 dismiss hook はあるか | なし（`rg useDismissable apps/web` 0 件）。`useFocusTrap` は modal の focus 閉じ込め用で dismiss 検知とは責務が異なる |
| `browserDocument()` の再利用 | する（`lib/is-browser.ts` の既存 getter・I-5 の正規入口） |
| 新規 primitive の要否 | hook 1 本のみ新規。UI primitive・CSS・トークンは新規ゼロ |

再利用で賄えない「外側クリック / Escape 検知の共通化」だけを新規 hook として最小追加する。

## 2.2 真の論点（要件レビュー思考法）

1. **真の論点**: 「`<details>` popover の dismiss（外側 pointerdown / Escape）ロジックが 2 箇所に重複し、片側だけ Escape 漏れ / cleanup 漏れ（リーク）の drift が起きうる」こと。単なる「汎用 hook が欲しい」ではなく「重複の DRY 違反を根絶し、I-2/I-5 を型シグネチャで強制する」が主問題。
2. **依存関係・責務境界**: dismiss 検知（document listener 管理）と open state 制御（`<details>.open` 書き込み）は別責務。hook は前者のみ、後者は呼び出し側。これを混在させると I-2（state owner 単一）が壊れる。
3. **価値とコストの不均衡**: 価値 = 重複根絶 + SSR 境界の型強制。コスト = hook 1 本 + 2 consumer の小規模置換。コスト極小・価値明確で着手妥当。
4. **改善優先順位**: hook 抽出 → SidebarUserMenu 移行 → DensityToggle 移行（挙動差吸収の検証）の順。
5. **4 条件**: 価値性=DRY/型強制で drift を防ぐ / 実現性=小規模で 1 サイクル / 整合性=I-2/I-5 を型で閉じる / 運用性=既存 spec 無改修回帰で挙動不変を保証。

### 因果ループ
- **強化ループ（放置時）**: popover 追加 → inline コピー → 重複増 → 片側修正漏れ（Escape 欠落 / cleanup リーク）→ 信頼低下 → 各 popover で個別対処 → さらにコピー増。
- **バランスループ（本タスク）**: hook 集約 → 新 popover は hook 呼び出し 1 行 → 重複ゼロ → 修正は hook 1 箇所 → drift 収束。

## 2.3 hook 詳細設計

### シグネチャ / 型

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

### 入力 / 出力 / 副作用

| 項目 | 内容 |
| --- | --- |
| 入力 | `ref`（dismiss 領域の root 要素・`<details>` を想定するが `HTMLElement` 汎用）/ `onClose(reason)` / `options.enabled` |
| 出力 | なし（`void`） |
| 副作用 | mount 時に `browserDocument()` へ `pointerdown` / `keydown` listener を登録。unmount / deps 変化時に removeEventListener。`enabled===false` または `browserDocument()===undefined` のとき副作用なし（early return） |
| 所有しない状態 | `<details>.open`（I-2）。hook は open を読み書きしない。`onClose` 内で呼び出し側が制御 |

### 内部ロジック（擬似コード）

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
      if (target instanceof Node && el.contains(target)) return; // 内側は無視
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

### 設計上の決定（挙動互換性の要）

- **「open かどうか」の判定は呼び出し側に委ねる**。現行 2 consumer はいずれも listener 内で `details.open` を確認してから閉じている。hook 化後はこの「open ガード」を `onClose` コールバック内に移す。これにより hook は open state に依存せず（I-2）、かつ既存挙動（閉じているときは何もしない）を完全保持できる。
  - SidebarUserMenu の `onClose`: `() => { const d = detailsRef.current; if (d?.open) d.open = false; }`
  - DensityToggle の `onClose`: `(reason) => { const d = detailsRef.current; if (!d?.open) return; d.open = false; if (reason === "escape") d.querySelector("summary")?.focus(); }`
- **`onClose` の安定性**: 呼び出し側は `useCallback` で `onClose` を安定化する（deps に `ref`/`onClose`/`enabled`）。これにより listener の不要な再登録を防ぐ。DensityToggle は既存 `closeHelp`（`useCallback`）を流用できる。
- **`reason` 引数**: 2 consumer の唯一の挙動差（DensityToggle の Escape 時 summary focus 復帰）を吸収する最小の拡張点。SidebarUserMenu は `reason` を無視する（両理由で同じ close 動作）。

## 2.4 consumer 別 移行設計

### SidebarUserMenu.tsx

| Before（L34-58） | After |
| --- | --- |
| 匿名 `useEffect` 内で `browserDocument()` ガード → `closeIfOutside`(pointerdown) + `closeOnEscape`(keydown) を登録 → cleanup | `useDismissable(detailsRef, closeMenu)` の 1 行。`closeMenu = useCallback(() => { const d = detailsRef.current; if (d?.open) d.open = false; }, [])` |
| route-close `useEffect`（L30-32 pathname 依存） | **そのまま残す**（dismiss 機構ではない・責務別） |

import 整理: `browserDocument` の直接 import は不要になる（hook 内部に隠蔽）。`useDismissable` を追加 import。`useCallback` を追加 import。

### DensityToggle.client.tsx

| Before（L76-101） | After |
| --- | --- |
| 匿名 `useEffect` 内で `browserDocument()` ガード → `onKeyDown`(Escape→closeHelp+summary focus) + `onPointerDown`(外側→closeHelp) を登録 → cleanup | `useDismissable(detailsRef, onDismiss)`。`onDismiss = useCallback((reason) => { const d = detailsRef.current; if (!d?.open) return; d.open = false; if (reason === "escape") d.querySelector("summary")?.focus(); }, [])` |
| `closeHelp`（L69-71） | `onDismiss` に統合可（または `closeHelp` を残し `onDismiss` から呼ぶ）。`onChange` 等他ロジックは不変 |

import 整理: `browserDocument` の直接 import は不要になる。`useDismissable` を追加 import。

## 2.5 ロック変数 / 状態所有権テーブル（[Feedback STATE-DETAIL-01]）

| 状態 | 所有者 | hook の関与 |
| --- | --- | --- |
| `<details>.open` | ネイティブ `<details>`（呼び出し側 ref 経由） | 読み書きしない（I-2） |
| document listener 登録/解除 | `useDismissable`（useEffect cleanup） | 唯一の出口で removeEventListener |
| Escape 後の focus 復帰 | 呼び出し側 `onClose` 内 | reason を渡すのみ |

## 2.6 配置決定

`apps/web/src/hooks/useDismissable.ts`。理由: consumer が `components/shell/`（SidebarUserMenu）と `components/public/`（DensityToggle）に跨る cross-feature hook であり、特定 feature 配下（元案の `components/shell/`）に置くと public 側からの import が feature 境界を越えて不自然になる。既存 `apps/web/src/hooks/useImeSafeInput.ts` と同階層が最も整合する。

## 2.7 SubAgent lane / validation path

本仕様書は spec 作成タスク。実装フェーズ（後続 03.実装）の lane は単一（hook + 2 consumer は密結合のため直列 1 lane）。validation lane: `vitest`（hook spec + 2 consumer 回帰）→ `typecheck` → `lint` の直列。

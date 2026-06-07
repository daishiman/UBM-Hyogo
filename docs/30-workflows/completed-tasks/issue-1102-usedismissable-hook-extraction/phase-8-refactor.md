---
phase: 8
name: リファクタリング
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 8: リファクタリング

本タスク自体が「重複 dismiss ロジックの抽出」というリファクタリングである。
本フェーズでは、その変更内容を `対象 / Before / After / 理由` 形式で記録し、
DRY 改善・dead code 除去・構造改善（I-2 / I-5 の型強制）を明文化する。

## 8.1 リファクタリングの本質

- **問題（リファクタ前）**: `<details>` popover の dismiss（外側 pointerdown / Escape）ロジックが
  `SidebarUserMenu.tsx`（L34-58）と `DensityToggle.client.tsx`（L76-101）の 2 箇所に
  ほぼ同一の inline `useEffect` としてコピーされている（計約 50 行）。
  片側だけ Escape 漏れ / cleanup（removeEventListener）漏れが起きうる DRY 違反。
- **改善（リファクタ後）**: 汎用 hook `useDismissable`（約 30 行）に集約し、
  各 consumer は hook 呼び出し数行へ縮約。重複ゼロ・修正点 1 箇所に収束。
- **不変条件**: NON_VISUAL（挙動不変リファクタ）。既存 spec 2 本を**無改修**で回帰パスさせることで
  外形的挙動の不変を機械的に証明する。

## 8.2 変更内容テーブル（[Feedback RT-03]）

| 対象 | Before | After | 理由 |
| --- | --- | --- | --- |
| `apps/web/src/hooks/useDismissable.ts`（NEW） | 存在しない | dismiss 検知ロジックを 1 本に集約した汎用 hook。`useDismissable(ref, onClose, options?)` / `DismissReason = "pointerdown-outside" \| "escape"`。内部で `browserDocument()` 経由・open state 非所有・cleanup で removeEventListener・`enabled:false` は early return | DRY 根絶。I-2（state 非所有）/ I-5（`browserDocument()` 経由）を型シグネチャと実装で強制 |
| `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`（NEW） | 存在しない | hook 単体 spec。外側 pointerdown → `onClose("pointerdown-outside")` / Escape → `onClose("escape")` / 内側 pointerdown は無視 / `enabled:false` で no-op / unmount で removeEventListener を検証 | 抽出した共通ロジックの回帰を恒久保護 |
| `apps/web/src/components/shell/SidebarUserMenu.tsx`（EDIT） | L34-58 に匿名 `useEffect`：`browserDocument()` ガード → `closeIfOutside`(pointerdown) + `closeOnEscape`(keydown) を登録 → cleanup（約 25 行）。`browserDocument` を直接 import | `useDismissable(detailsRef, closeMenu)` の 1 行に置換。`closeMenu = useCallback(() => { const d = detailsRef.current; if (d?.open) d.open = false; }, [])`。`browserDocument` 直接 import を除去・`useDismissable` / `useCallback` を追加 import。route-close `useEffect`（pathname 依存）は責務別ゆえ残置 | 重複削減。dismiss と nav 連動の責務分離を維持 |
| `apps/web/src/components/public/DensityToggle.client.tsx`（EDIT） | L76-101 に匿名 `useEffect`：`browserDocument()` ガード → `onKeyDown`(Escape→close+summary focus) + `onPointerDown`(外側→close) を登録 → cleanup（約 25 行）。`browserDocument` を直接 import | `useDismissable(detailsRef, onDismiss)` に置換。`onDismiss = useCallback((reason) => { const d = detailsRef.current; if (!d?.open) return; d.open = false; if (reason === "escape") d.querySelector("summary")?.focus(); }, [])`。`browserDocument` 直接 import を除去・`useDismissable` を追加 import | 重複削減。Escape 時の summary focus 復帰という挙動差を `reason` 引数で吸収し挙動完全保持 |

## 8.3 dead code / import drift の除去

| 項目 | 内容 |
| --- | --- |
| `browserDocument` 直接 import の不要化 | `SidebarUserMenu.tsx` / `DensityToggle.client.tsx` は dismiss を hook に委譲するため、`browserDocument` を自前で呼ばなくなる。各ファイルの `import { browserDocument } from "...is-browser"` が他で未使用なら**除去**する（他箇所で使用が残る場合のみ保持）。lint の `no-unused-vars` / `unused-imports` で残骸を検出 |
| 重複 inline listener の削除 | 抽出元の匿名 `useEffect`（pointerdown/keydown 登録 + cleanup）を 2 箇所とも削除。削除後にコメントアウト・コピー残骸を残さない |
| 命名整理 | consumer 側の close ハンドラ名は責務が明確になるよう `closeMenu` / `onDismiss` に統一（実装時に既存 `closeHelp` を流用する場合は `onDismiss` から呼ぶ形でも可。挙動同一なら命名は実装者裁量） |

## 8.4 構造改善（I-2 / I-5 の型強制）

- **I-2（state owner = `<details>.open` 単一・hook 非所有）**: hook は open state を一切読み書きしない設計。
  「閉じているときは何もしない」open ガードは `onClose` コールバック内（呼び出し側）に置く。
  これにより state の所有者が `<details>` ネイティブ要素に一本化され、hook は検知の責務だけを持つ。
  型上も hook は open に関する引数・戻り値を持たないため、誤って state を所有する実装を構造的に防ぐ。
- **I-5（`browserDocument()` 経由のみ）**: 素の `document.addEventListener` を consumer から消し、
  document アクセスを hook 内部の `browserDocument()` 1 経路に閉じ込めた。
  SSR / Cloudflare Workers 境界で `browserDocument()` が `undefined` を返す場合は hook が no-op になり、
  呼び出し側は SSR 境界を意識する必要がなくなる。
- **DismissReason 型**: `"pointerdown-outside" | "escape"` の literal union により、
  呼び出し側の `reason` 分岐がコンパイル時に網羅チェックされる。挙動差（Escape 時 focus 復帰）の取りこぼしを型で防ぐ。

## 8.5 リファクタリングの後退防止

- 既存 spec 2 本（`SidebarUserMenu.spec.tsx` / `DensityToggle.client.spec.tsx`）は**無改修**。
  これらが hook 化後もパスすることが、外形的挙動が変わっていない最強の証跡（Phase 9 で検証）。
- 新規 `useDismissable.spec.tsx` で抽出ロジックそのものを保護し、将来の hook 変更による drift を検出する。

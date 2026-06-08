---
phase: 7
name: カバレッジ確認
task_id: issue-1102-usedismissable-hook-extraction
status: completed
---

# Phase 7: カバレッジ確認

## 7.1 対象範囲の限定（[Feedback BEFORE-QUIT-002][Feedback 5]）

カバレッジ目標は **`apps/web/src/hooks/useDismissable.ts` の 1 ファイルに限定**する。
広域（`apps/web/**` 等）の閾値指定は行わない。本タスクの新規コードは hook 本体のみであり、
2 consumer（SidebarUserMenu / DensityToggle）は inline ロジックを削るだけで新規分岐を増やさないため、
回帰は既存 spec で担保し、新規カバレッジ目標は hook に集中させる。

| 項目 | 値 |
| --- | --- |
| カバレッジ対象 | `apps/web/src/hooks/useDismissable.ts` |
| 目標 | line 100% / branch 100% |
| 計測 spec | `apps/web/src/hooks/__tests__/useDismissable.spec.tsx`（HT-1〜HT-13） |
| 非対象 | 2 consumer（既存 spec が回帰担保。新規 hook 由来の未到達分岐なし） |

## 7.2 分岐インベントリと保護テスト対応表

`useDismissable.ts` の全分岐と、それを到達/両側網羅するテストケース ID。

| 分岐 | true 側 | false 側 | 保護テスト |
| --- | --- | --- | --- |
| `enabled` (= options?.enabled ?? true) | enabled:true で listener 登録 | enabled:false で early return | HT-1（true・既定）／ HT-5・HT-9（false）／ HT-8（false→true）／ HT-2（既定 true 適用） |
| `if (!doc) return` (browserDocument) | doc あり → listener 登録 | doc undefined → no-op | HT-1（あり）／ HT-7（undefined） |
| `if (!el) return`（pointerdown 内 ref.current） | el あり → 判定継続 | el null → 早期離脱 | HT-1（あり）／ HT-13（null） |
| `target instanceof Node && el.contains(target)` | 内側（contains true）→ return（呼ばない） | 外側（false / 非 Node）→ onClose | HT-2（内側 true）／ HT-1（外側 false）／ HT-12（非 Node） |
| `event.key !== "Escape"`（keydown） | 非 Escape → return | Escape → onClose("escape") | HT-4（Tab・非 Escape）／ HT-3（Escape） |
| cleanup（return () => removeEventListener） | unmount / deps 変化で実行 | — | HT-6（unmount）／ HT-9（enabled 変化）／ HT-10（onClose 変化） |

全 if 分岐の両側（true/false）と cleanup 実行経路がいずれかのテストで到達する設計のため、
branch 100% を満たす。`onPointerDown` / `onKeyDown` の各ステートメントも HT-1〜HT-4 で全行到達する。

## 7.3 計測コマンド（hook 限定）

```bash
mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts \
  --coverage \
  --coverage.include='apps/web/src/hooks/useDismissable.ts' \
  apps/web/src/hooks/__tests__/useDismissable.spec.tsx
```

> `--coverage.include` で対象を hook 1 ファイルに絞り、レポートのノイズと誤った広域閾値を避ける。
> プロジェクト標準の coverage 設定（`vitest.config.ts`）に閾値がある場合は、本タスクで
> グローバル閾値を変更しない（限定スコープのまま hook の 100% を目視確認する）。

## 7.4 2 consumer のカバレッジ方針

- SidebarUserMenu / DensityToggle は inline dismiss `useEffect` を削除し hook 呼び出しへ置換するのみ。
  新規分岐は追加されない（`onClose` 内の open ガード・reason 分岐は旧 inline コードと同一ロジックの移設）。
- DensityToggle の `reason === "escape"` 分岐（summary focus 復帰）は既存 TC-4 が両側
  （Escape→復帰あり / 外側→復帰なし＝TC-5）を回帰で踏むため、consumer 側の新規カバレッジ目標は不要。
- したがって本フェーズの数値目標は hook 単体に集約し、consumer は「既存 spec 無改修 GREEN」で品質を担保する。

## 7.5 合格判定

- `useDismissable.ts` の line / branch カバレッジが 100%（§7.2 対応表の全分岐到達を確認）。
- 2 consumer の既存 spec が無改修で全パス（AC-6 / AC-7）。
- typecheck / lint 緑（AC-8）。

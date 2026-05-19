# Phase 3: 設計レビュー — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. レビュー観点と判定

| 観点 | 判定 | 備考 |
|---|---|---|
| シグネチャ不変性 | ✅ | `RouteError(props: Props)` は変更なし、外部 API 影響ゼロ |
| useEffect 副作用順序 | ✅ | `logger.error → focus` の固定順を Phase 2 で明記、テスト TC-U-09 で間接検証 |
| `useRef` 初期値 null + optional chaining | ✅ | `headingRef.current?.focus()` で安全 |
| `preventScroll: true` 指定 | ✅ | After サンプルで必須化 |
| `tabIndex={-1}` 妥当性 | ✅ | プログラム的 focus を許可しタブ移動から除外 |
| client component 制約 | ✅ | `"use client"` 維持、useRef / useEffect は client only |
| SSR / hydration 整合 | ✅ | static props のみ、useRef は client mount 後にのみ実行 |
| 既存 OKLch トークン非侵食 | ✅ | className 変更なし |
| 既存 logger シグネチャ非侵食 | ✅ | logger.error 呼び出し維持 |
| テストファイルパス | ✅ | 既存 `apps/web/app/__tests__/error.component.spec.tsx` への追記方針（新規ファイル作成回避） |
| `*.spec.tsx` 命名規約（CLAUDE.md 不変条件 8） | ✅ | 既存ファイル名がすでに `.spec.tsx`、新規ファイルなし |
| AC-10（i05 と非衝突） | ✅ | 編集対象は `apps/web/app/error.tsx` のみ、`/login/error.tsx` 非編集 |
| 共通 hook `useAutoFocusOnMount` 抽出 | ⏸️ 本タスク外 | i05 + i06 merge 後に再評価する横展開候補として Phase 12 で記録。現時点では未タスク化しない |

## 2. 親 spec との整合

`docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/integration-fixes/parallel-i06-root-error-focus/spec.md` の以下要件を本 workflow が全て満たすことを確認:

- Before / After コード差分の一致 ✅
- DoD 5 項目（h1 ref + tabIndex / focus 呼び出し / spec PASS / typecheck+lint / parallel-07 4.3 達成）→ 本 workflow の AC-1〜AC-8 にマッピング済 ✅
- リスク表（visual outline / 順序紛糾）→ 本 workflow の Phase 2 §8 で再現 ✅

## 3. unassigned-task 仕様書との整合

`docs/30-workflows/unassigned-task/integration-fixes-i06-root-error-focus.md` の AC-1〜AC-10 を本 workflow の DoD に全て継承（index.md 参照）。

## 4. 想定変更ファイル群の俯瞰

| Path | 役割 | 本タスクでの扱い |
|---|---|---|
| `apps/web/app/error.tsx` | root error boundary | **修正** |
| `apps/web/app/__tests__/error.component.spec.tsx` | error 関連 test | **TC 追記** |
| `apps/web/src/lib/logger.ts` | logger 実装 | 不変 |
| `apps/web/app/login/error.tsx` | login error boundary | 不変（i05 担当） |
| `apps/web/app/profile/error.tsx` | profile error boundary | 不変 |
| `apps/web/app/(admin)/admin/error.tsx` | admin error boundary | 不変 |

## 5. 判定

本設計は実装可能性・最小差分・安全性を満たし、Phase 4 以降に進める判定。

## 6. リスク再評価

- **確認済リスク**: ルート `vitest.config.ts` に setupFiles が無く `@testing-library/jest-dom` 拡張 matcher は自動拡張されない。既存 8 ケースも vitest 標準 matcher のみで構成されている。
- **対応**: Phase 2 設計を `document.activeElement` / `getAttribute` / `vi.spyOn(HTMLElement.prototype, "focus")` の vitest 標準 matcher 構成に修正済。新規依存追加なし。

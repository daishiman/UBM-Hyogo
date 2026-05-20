# Phase 10: 最終レビュー — root error.tsx h1 自動 focus

**[実装区分: 実装仕様書]**

## 1. DoD 達成状況

| AC | 検証 | 状態 |
|---|---|---|
| AC-1 | `apps/web/app/error.tsx` の h1 に `ref={headingRef}` + `tabIndex={-1}` | ✅ |
| AC-2 | useEffect 内で `logger.error → headingRef.current?.focus({ preventScroll: true })` | ✅ |
| AC-3 | `useRef<HTMLHeadingElement>(null)` 生成 | ✅ |
| AC-4 | TC-U-09a/b/c PASS | ✅ |
| AC-5 | digest 表示（既存 TC-U-03 / TC-U-04 維持） | ✅ |
| AC-6 | `pnpm typecheck` / `pnpm lint` 0 error | ✅ |
| AC-7 | `pnpm -F "@ubm-hyogo/web" test -- --run error.component` PASS | ✅ |
| AC-8 | parallel-07 spec 4.3 達成 | ✅ |
| AC-9 | 親 workflow index.md の i06 行更新 | ✅ |
| AC-10 | i05 と編集ファイル非重複 | ✅ |

## 2. CLAUDE.md 不変条件チェック

| 不変条件 | 状態 |
|---|---|
| 5. D1 直接アクセス禁止 | ✅ UI 単独修正、D1 binding 不使用 |
| 8. 新規 test ファイルは `*.spec.{ts,tsx}` のみ | ✅ 既存 `.spec.tsx` への追記のみ |
| UI-MVP 不変条件 1: 既存 API のみ接続 | ✅ API 接続なし |
| UI-MVP 不変条件 2: OKLch トークン正本化 | ✅ className 変更なし |
| UI-MVP 不変条件 3: プロトタイプ primitive 維持 | ✅ DOM 構造変更なし |
| UI-MVP 不変条件 4: D1 直接アクセス禁止 | ✅ apps/web のみ修正 |

## 3. リスク再評価

| Phase 2 §8 で識別したリスク | 最終確認 |
|---|---|
| visual outline | 既存 focus-visible utility に依存。Phase 11 manual で目視確認 |
| 副作用順序紛糾 | useEffect 内で固定済、TC-U-09c で `preventScroll` 引数も検証 |
| log 失敗で focus が走らない | logger.error は throw しない設計を維持 |
| optional chaining | `?.focus()` で null 安全 |
| hydration mismatch | static props / useRef は client only |

## 4. 親 spec 再点検

`parallel-i06-root-error-focus/spec.md` の DoD 5 項目:
- [x] h1 ref + tabIndex
- [x] useEffect で focus
- [x] `error.component.spec.tsx` TC-U-09a/b/c focus 検証
- [x] typecheck + lint PASS
- [x] parallel-07 4.3 達成

→ 本 workflow の AC-1〜AC-8 と完全に一致。副作用順序は `apps/web/app/error.tsx` の useEffect 本文順、および TC-U-09c の `preventScroll` 呼び出し検証で確認する。

## 5. 横展開検出

| 候補 | 判定 |
|---|---|
| `/profile/error.tsx` | 同パターン適用候補だが本タスクスコープ外。現時点では未 formalize |
| `/admin/error.tsx` | 同パターン適用候補だが本タスクスコープ外。現時点では未 formalize |
| `/login/error.tsx` | i05 で別途実施中 |
| 共通 hook `useAutoFocusOnMount` | i05 + i06 merge 後に再評価する横展開候補。現時点では未タスク化しない |

## 6. 判定

§1 の全 AC を確認済み。interactive screen reader smoke、commit、push、PR は user-gated。

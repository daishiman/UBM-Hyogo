---
実装区分: 実装仕様書
状態: implemented_local_evidence_captured
Phase: 11
作成日: 2026-06-03
task_id: issue-1063-shell-collapse-cookie-secure-attribute
visual_category: NON_VISUAL
issue: 1063
issue_state: CLOSED
---

# Phase 11 手動テスト結果 / Evidence（NON_VISUAL）

## NON_VISUAL 宣言

- **タスク種別 = NON_VISUAL**
- **非視覚的理由**: 変更は cookie の送信制御属性（`Secure`）のみ。`Secure` 有無はレンダリング結果にも `document.cookie` の read 値にも現れず、screenshot 比較では捕捉できない。検証は serializer が生成する**文字列**の `; Secure` 有無で行う。
- **代替証跡（主ソース）**: focused Vitest log（`shell-collapse-cookie.spec.ts` の TC-1〜TC-6）+ serializer 戻り値の文字列 assertion。スクリーンショットは作成しない（`screenshots/.gitkeep` も置かない）。
- **スクリーンショットを作らない理由**: `Secure` は cookie の送信制御属性で、UI の見た目・DOM 構造に一切影響しない。視覚回帰の対象が存在しない。

## 証跡メタ

| 項目 | 内容 |
|------|------|
| 証跡の主ソース | focused Vitest `apps/web/src/components/shell/__tests__/shell-collapse-cookie.spec.ts`（TC-1〜TC-6 = 6 ケース追加 + 既存ケース） |
| 補助証跡 | `mise exec -- pnpm typecheck` / `mise exec -- pnpm lint`（lint-boundaries）/ `grep -rn "process.env" apps/web/src/components/shell/`（0 件期待） |
| 環境ブロッカー | なし（focused Vitest は local PASS。browser DevTools smoke は user-gated） |

## 実行記録

> 本タスクは **implemented_local_evidence_captured**。実コード変更と focused Vitest は本サイクルで完了。browser smoke は user-gated で行う。

| 項目 | 結果 | 備考 |
|------|------|------|
| focused Vitest（TC-1〜TC-6 + 既存4） | PASS | 10 tests PASS（`shell-collapse-cookie.spec.ts`） |
| `pnpm typecheck` | PASS | `mise exec -- pnpm typecheck` 実走 |
| `pnpm lint`（lint-boundaries） | PASS | `mise exec -- pnpm lint` 実走 |
| DevTools Application→Cookies で Secure フラグ（production HTTPS staging = ON） | NOT EXECUTED | user-gated（browser smoke） |
| DevTools Application→Cookies で Secure フラグ（localhost http = OFF） | NOT EXECUTED | user-gated |
| dev での collapse 永続化が回帰しない目視 | NOT EXECUTED | user-gated |
| 既存属性（Path=/ / SameSite=Lax / Max-Age / not HttpOnly）維持 | NOT EXECUTED | user-gated（DevTools 確認） |

## 手動 smoke 手順（user 承認後に実走）

1. **production（HTTPS staging）での Secure 確認**
   - staging（`https://...workers.dev/`）の shell 配下画面（例: `/profile`）を開く。
   - sidebar collapse toggle を押す。
   - DevTools → Application → Cookies で `ubm_shell_collapsed` の **Secure 列が ✓**（ON）であることを確認。
2. **localhost（http）での Secure 無し確認**
   - `http://localhost:3000` の shell 配下画面で collapse toggle を押す。
   - DevTools → Application → Cookies で `ubm_shell_collapsed` の **Secure 列が空**（OFF）であることを確認。
   - リロードして collapse 状態が**維持される**（cookie が黙って不送信にならない）ことを確認。
3. **既存属性の不変確認**
   - 上記 cookie が `Path=/` / `SameSite=Lax` / `Max-Age` 付き・`HttpOnly` 無しであることを確認（issue-1024 と同一）。

主証跡: focused Vitest log（serializer 文字列検証）。browser DevTools smoke は user 承認後に実走する。

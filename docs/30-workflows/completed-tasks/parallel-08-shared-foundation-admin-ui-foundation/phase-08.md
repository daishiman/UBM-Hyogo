# Phase 8: パフォーマンス・セキュリティ

[実装区分: 実装仕様書]

## メタ情報

| 項目 | 値 |
|------|-----|
| workflow | parallel-08-shared-foundation-admin-ui-foundation |
| phase | 8 / 13 |
| 種別 | 検証（非機能 — パフォーマンス / セキュリティ） |
| 想定所要 | 25〜35 分 |
| 前提 Phase | Phase 7 完了（静的解析 clean） |

---

## 目的

Phase 5 で投入した admin UI 共通基盤の **非機能要件**（パフォーマンス・セキュリティ）を、本 Phase の範囲で検証可能な観点に絞って確認する。

本 Phase の主たる確認対象:

1. **再レンダースコープ**: `ToastProvider` を root 配置したことによる re-render 影響範囲
2. **競合 fetch 防止 (将来契約)**: `useAdminMutation` が step-01 実装時に AbortController または in-flight guard を採用することを契約として宣言
3. **CSRF**: 既存 API 側 CSRF 防御（Auth.js / SameSite cookie）との整合確認
4. **XSS**: Toast message レンダリング時のエスケープ確認（dangerouslySetInnerHTML 不使用）

> 本 Phase は **検証 + 契約宣言** が中心。実装本体は serial-05/step-01 に委ねる（先送りではなく責務分離）。

---

## 実行タスク

| # | 観点 | 内容 |
|---|------|------|
| T1 | re-render scope | `ToastProvider` の `useState` / `useContext` / `useMemo` を grep し、context value が安定化されているか確認 |
| T2 | AbortController 契約 | `useAdminMutation.ts` の docstring に「step-01 実装時は AbortController または in-flight guard で競合 fetch を排除すること」が明文化済みか確認 |
| T3 | CSRF 整合 | `apps/api/src/routes/admin/**` の mutation endpoint で Auth.js session check と SameSite cookie が利用されている grep 確認 |
| T4 | XSS — Toast | `apps/web/src/components/ui/Toast.tsx` で `dangerouslySetInnerHTML` 不使用、message が React children として render されることを確認 |
| T5 | XSS — error.tsx | `apps/web/app/(admin)/admin/error.tsx` で `error.message` 直接 render が安全か確認（React 自動エスケープに依拠） |
| T6 | bundle size | `pnpm -F "@ubm-hyogo/web" build` の出力 size が前回比で大幅増（>+10%）でないか目視確認 |

---

## 参照資料

| 種別 | パス |
|------|------|
| Toast 実装 | `apps/web/src/components/ui/Toast.tsx` |
| Admin error boundary | `apps/web/app/(admin)/admin/error.tsx` |
| Middleware | `apps/web/middleware.ts` |
| API admin routes | `apps/api/src/routes/admin/**` |
| Auth | `docs/00-getting-started-manual/specs/02-auth.md` |

---

## 実行手順

### Step 1 — T1: re-render scope 確認

```bash
grep -nE "useState|useReducer|useContext" apps/web/src/components/ui/Toast.tsx
```

**確認観点**:
- `ToastProvider` が state 更新時に context value を不要に作り直さない構造（context value は `useMemo` で安定化）
- root 配置による副作用が `<html>` / `<body>` の外側ハイドレーションに影響しないこと

**期待値**: `useMemo` により context value が安定化されていること。違反があれば Phase 8 内で修正してから Phase 9 に進む。

### Step 2 — T2: AbortController 契約明文化

`apps/web/src/features/admin/hooks/useAdminMutation.ts` の冒頭 docstring に以下が含まれることを確認:

```ts
/**
 * Admin 用 mutation hook の型シグネチャ宣言。
 * 実装本体は serial-05/step-01 で投入する。
 *
 * 非機能要件（step-01 実装時の契約）:
 *  - 競合 fetch 防止: 連続 mutate() 呼び出し時は AbortController で前リクエストを cancel するか、
 *    isPending=true の間は新規 mutate() を no-op として扱う in-flight guard を実装すること。
 *  - error は ErrorBoundary (admin/error.tsx) で補足可能な Error インスタンスで throw すること。
 *  - toastMessage は React children として render されることを前提に、HTML を含めないこと。
 */
```

**目的**: step-01 実装担当者（人間 / AI 問わず）が非機能要件を見落とさないようにする宣言。

### Step 3 — T3: CSRF 整合確認

```bash
grep -rnE "getSession|auth\(\)|SameSite" apps/api/src/routes/admin/ | head -50
```

**期待値**: admin 配下の mutation endpoint が session check 経由でのみ通過すること。SameSite cookie 設定が Auth.js 既定（Lax 以上）であることを確認。違反があれば API 側 task として記録（本 Phase では fix しない — スコープ外）。

### Step 4 — T4: XSS (Toast)

```bash
grep -n "dangerouslySetInnerHTML" apps/web/src/components/ui/Toast.tsx || echo "OK: no dangerouslySetInnerHTML"
```

**期待値**: マッチ 0 件。`message` は `<div>{message}</div>` のように React の自動エスケープに依拠して描画されること。

### Step 5 — T5: XSS (admin error.tsx)

```bash
grep -n "dangerouslySetInnerHTML" apps/web/app/\(admin\)/admin/error.tsx || echo "OK"
grep -n "error\.message" apps/web/app/\(admin\)/admin/error.tsx
```

**期待値**: `dangerouslySetInnerHTML` 不使用。`error.message` は JSX children として render される。

### Step 6 — T6: bundle size 監視

```bash
mise exec -- pnpm -F "@ubm-hyogo/web" build 2>&1 | tee outputs/phase-08/build.log
```

**期待値**: build 成功 + 出力 size が前回比 +10% 以下（目視確認、log として保存）。

---

## 統合テスト連携

- step-01 実装時の AbortController 採用は本 Phase の docstring 契約に紐付く。違反した場合 PR で reject 対象。
- API 側 CSRF / SameSite は本 workflow スコープ外だが、drift があれば別 issue 起票して記録。

---

## 多角的チェック観点（AIが判断）

- ToastProvider の context value が `useMemo` でメモ化されているか（されていなければ全 children が toast 表示毎に再 render）
- `(admin)/admin/error.tsx` の reset Button が Toast scope 外で動作することの確認（context 外でも reset 可能）
- middleware による `gate=admin_required` リダイレクトが OAuth flow と二重リダイレクトを起こさないか
- bundle に `ToastProvider` 由来の重複モジュールが含まれていないか（tree-shake が効いているか）

---

## サブタスク管理

| ID | 内容 | 完了条件 |
|----|------|---------|
| ST-08-01 | re-render scope 確認 | grep + 必要なら memo 化 |
| ST-08-02 | AbortController 契約 docstring | 追記 commit 済み |
| ST-08-03 | CSRF 整合 grep | session check 確認ログ保存 |
| ST-08-04 | Toast XSS 安全性 | `dangerouslySetInnerHTML` 0 件 |
| ST-08-05 | error.tsx XSS 安全性 | `dangerouslySetInnerHTML` 0 件 |
| ST-08-06 | bundle size 記録 | build.log 保存 |

---

## 成果物

- `apps/web/src/features/admin/hooks/useAdminMutation.ts`（Step 2 docstring 追記）
- `outputs/phase-08/security-review.md`（T1〜T5 の確認ログ）
- `outputs/phase-08/build.log`（T6 build 出力）

---

## 完了条件 (DoD)

- [ ] ToastProvider の context value が memo 化済み（または render scope が children に影響しないことを記録）
- [ ] `useAdminMutation.ts` docstring に AbortController / in-flight guard 契約が明記されている
- [ ] admin API mutation endpoint の session check が grep で確認できる
- [ ] Toast / admin error.tsx で `dangerouslySetInnerHTML` 不使用（grep 0 件）
- [ ] `pnpm -F "@ubm-hyogo/web" build` exit 0 + build.log 保存

---

## タスク100%実行確認【必須】

```bash
# 1. XSS gate
{ ! grep -rn "dangerouslySetInnerHTML" apps/web/src/components/ui/Toast.tsx apps/web/app/\(admin\)/admin/error.tsx; }

# 2. AbortController 契約明記
grep -q "AbortController" apps/web/src/features/admin/hooks/useAdminMutation.ts

# 3. CSRF 整合 (session check 存在)
grep -rqE "getSession|auth\(\)" apps/api/src/routes/admin/

# 4. build 成功
mise exec -- pnpm -F "@ubm-hyogo/web" build
```

全てが exit 0 / 期待出力で完走することを確認。1 件でも fail した場合は本 Phase で解消し、Phase 9 に進まない。

---

## 次Phase

→ Phase 9: ドキュメント整備 / リリースノート（workflow 全体の次 phase に従う）

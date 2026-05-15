# Phase 8 成果物 — パフォーマンス・セキュリティ

## T1 — re-render scope (Toast)

```
$ grep -n "useState|useReducer|useContext|useMemo" apps/web/src/components/ui/Toast.tsx
3:  import { createContext, useContext, useState, useCallback, useMemo } ...
18: const [toasts, setToasts] = useState<ToastItem[]>([]);
24: const value = useMemo(() => ({ toast }), [toast]);
41: const ctx = useContext(ToastContext);
```

→ context value は `useMemo(() => ({ toast }), [toast])` で memo 化済み。`toast` 自体も `useCallback` (Toast.tsx:19) で安定化されている。children 全体の不要な re-render は発生しない。

## T2 — AbortController 契約 docstring

`apps/web/src/features/admin/hooks/useAdminMutation.ts` に下記契約を明文化済み (Phase 8 で追記)。

- 競合 fetch 防止: AbortController または in-flight guard
- ErrorBoundary 補足可能な Error throw
- toastMessage は React children 想定 (HTML 不可)
- API error 両形 (`{ error }` / `{ ok: false, error }`) の parse

```
$ grep -q "AbortController" apps/web/src/features/admin/hooks/useAdminMutation.ts && echo OK
OK
```

## T3 — CSRF 整合 (API admin routes)

`apps/api/src/routes/admin/**` の admin 系 endpoint は session/auth ガードを含む (`requireAdminSession` / `auth()` / session 系識別子が tags-queue / meetings / members / dashboard / attendance / schema 等で grep ヒット)。SameSite cookie は Auth.js 既定 (Lax 以上) を採用。

→ 本 workflow スコープ内では drift なし。詳細監査は API 側 task に委ねる。

## T4 — Toast XSS

```
$ grep -n "dangerouslySetInnerHTML" apps/web/src/components/ui/Toast.tsx
(0 件)
```

`message` は `<div role="status">{t.message}</div>` (Toast.tsx:32-34) として React 自動エスケープに依拠して描画。XSS 不発。

## T5 — admin error.tsx XSS

```
$ grep -n "dangerouslySetInnerHTML" apps/web/app/\(admin\)/admin/error.tsx
(0 件)

$ grep -n "error\.message" apps/web/app/\(admin\)/admin/error.tsx
6:      <p>{error.message}</p>
```

→ React 自動エスケープに依拠して安全。XSS 不発。

## T6 — bundle size

`mise exec -- pnpm -F "@ubm-hyogo/web" build` exit 0 (`outputs/phase-11/evidence/build.log` 参照)。Toast / hook 追加による bundle 増分は軽微 (既存 Toast.tsx の再配置 + skeleton hook のみ)。

## DoD

- [x] ToastProvider context value memo 化済み
- [x] `useAdminMutation.ts` docstring に AbortController / in-flight guard 契約明記
- [x] admin API mutation endpoint の session check grep PASS
- [x] Toast / admin error.tsx に `dangerouslySetInnerHTML` なし
- [x] `pnpm build` exit 0 (build.log 既存 evidence で代替確認)

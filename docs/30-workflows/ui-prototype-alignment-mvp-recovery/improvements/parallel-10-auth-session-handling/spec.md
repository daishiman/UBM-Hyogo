# parallel-10-auth-session-handling 実装仕様書

**[実装区分: 実装仕様書]** — API 401/403 ハンドリングと session refresh の統一

## 1. 目的

API 呼び出し中に 401（認証要求）/ 403（権限不足）が返された場合のフロント挙動を統一する。改善ワークフロー全体で「session 切れ時の UX」が未定義だったため、`fetchAuthed` と `useAdminMutation` (既存 hook) 配下で 401/403 を捕捉し、redirect / toast / re-login flow を一貫して提供する。

## 2. スコープ

### G10-1: API 401/403 共通ハンドラの強化
- `apps/web/src/lib/fetch/authed.ts` の既存 `fetchAuthed` 関数を検証
- 401 → automatic logout + redirect to `/login?redirect=<current>`
- 403 → toast "権限がありません" + 現在 page 維持

### G10-2: useAdminMutation hook の 401 連携 (依存: serial-05-admin-mutation-ui)
- mutation 中に 401 が返った場合、hook 内で redirect 処理を発火
- form state は preserve（user が再ログイン後に retry 可能）
- 403 の場合は toast alert を表示し form keep

### G10-3: Auth.js session refresh ポリシー確認
- `apps/web/src/lib/auth.ts` の session callback を確認
- token expiry が近い場合の silent refresh 仕様（実装可能なら）
- 既存実装で対応済みなら "確認 OK" として明示

### G10-4: `/login?redirect=` の query parameter ハンドリング
- `apps/web/src/lib/url/login-redirect.ts` の既存実装を確認
- ログイン成功後に `redirect` query を受け取り、安全に redirect する
- `normalizeRedirectPath` による open redirect 防止を再検証

## 3. 変更対象ファイル一覧

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/src/lib/fetch/authed.ts` | 検証 | 既存 401/403 処理を確認（変更の可能性あり） |
| `apps/web/src/lib/url/login-redirect.ts` | 検証 | redirect query parameter 仕様確認 |
| `apps/web/src/lib/auth.ts` | 検証 | session callback / token refresh ポリシー確認 |
| hooks/useAdminMutation（仮） | 編集 | 401/403 error handling を追加 |
| `apps/web/src/components/ui/Toast.tsx` | 利用確認 | 既存 toast component の API 確認 |

## 4. 設計

### 4.1 fetchAuthed の 401/403 既存実装

**現状確認:**
```typescript
// apps/web/src/lib/fetch/authed.ts (既存)
export class AuthRequiredError extends Error { /* ... */ }
export class FetchAuthedError extends Error { 
  readonly status: number;
  readonly bodyText: string;
}

export const fetchAuthed = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  if (res.status === 401) {
    throw new AuthRequiredError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FetchAuthedError(res.status, text);
  }
  return (await res.json()) as T;
};
```

**仕様:**
- 401 → `AuthRequiredError` throw
- 403+ → `FetchAuthedError(status, bodyText)` throw
- 呼び出し側で catch し、UI に translate

### 4.2 useAdminMutation hook での 401/403 キャッチ

**要件:**
```typescript
// 擬似: useAdminMutation hook の概要
function useAdminMutation(endpoint: string) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (payload: unknown) => {
    try {
      setIsPending(true);
      setError(null);
      const result = await fetchAuthed(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return result;
    } catch (err) {
      if (err instanceof AuthRequiredError) {
        // 401: redirect to login with current path
        window.location.href = toLoginRedirect(window.location.pathname);
        return; // unreachable
      }
      if (err instanceof FetchAuthedError && err.status === 403) {
        // 403: toast + keep form open
        showToast({ role: "alert", message: "権限がありません" });
        setError(err);
        return;
      }
      // 他のエラー
      setError(err as Error);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
}
```

### 4.3 Auth.js session refresh ポリシー

**既存実装確認点:**
- JWT TTL: 24h (SESSION_JWT_TTL_SECONDS)
- signIn callback: API worker `/auth/session-resolve` を呼び D1 lookup
- jwt callback: memberId / isAdmin を JWT に積む
- session callback: SessionUser 構造を返す

**検証項目:**
- Token expiry が近い（例: 残り 30 分以下）場合の silent refresh 実装有無
- 既存実装で対応済みなら記述; 不可なら「現在仕様外」と明示

### 4.4 `/login?redirect=` の query parameter

**既存実装確認:**
```typescript
// apps/web/src/lib/url/login-redirect.ts
export const toLoginRedirect = (currentPath: string): string => {
  const safe = normalizeRedirectPath(currentPath);
  return `/login?redirect=${encodeURIComponent(safe)}`;
};
```

**仕様:**
- `normalizeRedirectPath` が open redirect を防止
- `/login` page で `?redirect=...` を受け取り、ログイン成功後に redirect
- 検証: `safe-redirect.ts` の実装確認

## 5. 関数・型シグネチャ

### 5.1 Error types（既存）

```typescript
export class AuthRequiredError extends Error {
  constructor(message = "AUTH_REQUIRED");
}

export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  constructor(status: number, bodyText: string);
}
```

### 5.2 toast component API（既存確認対象）

```typescript
// apps/web/src/components/ui/Toast.tsx (仮)
showToast(options: {
  role?: "alert" | "status";
  message: string;
  duration?: number;
  variant?: "default" | "destructive";
}): void;
```

### 5.3 useAdminMutation hook（実装対象）

```typescript
interface UseAdminMutationOptions {
  endpoint: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseAdminMutationResult {
  mutate: (payload: unknown) => Promise<unknown>;
  isPending: boolean;
  error: Error | null;
  reset: () => void;
}

function useAdminMutation<T = unknown>(
  options: UseAdminMutationOptions
): UseAdminMutationResult;
```

## 6. 入出力・副作用

### 6.1 fetchAuthed (入出力)
- **Input:** path (string), init? (RequestInit)
- **Output:** JSON レスポンス (T)
- **副作用:**
  - 401 → AuthRequiredError throw
  - 403+ → FetchAuthedError throw
  - Network error → TypeError throw

### 6.2 useAdminMutation (副作用)
- **Input:** endpoint, payload
- **副作用:**
  - 401 → `window.location.href = toLoginRedirect(...)` (redirect)
  - 403 → toast 表示（"権限がありません"）+ error state 設定
  - 2xx → onSuccess callback 発火（実装時）

### 6.3 toLoginRedirect (入出力)
- **Input:** currentPath (string)
- **Output:** `/login?redirect=<encoded>`
- **副作用:** なし

## 7. テスト方針

### 7.1 fetchAuthed unit test
- [ ] 401 status → AuthRequiredError throw
- [ ] 403 status → FetchAuthedError(403, ...) throw
- [ ] 500+ status → FetchAuthedError throw
- [ ] 2xx status → JSON parse + return

### 7.2 useAdminMutation hook test
- [ ] 401 catch → redirect to `/login?redirect=<path>`
- [ ] 403 catch → toast 表示 + error state
- [ ] 2xx → onSuccess callback + isPending false
- [ ] Network error → setError + toast（variant: destructive）

### 7.3 Integration test（e2e 検討）
- [ ] Login form submit → session 獲得 → admin endpoint 成功
- [ ] Session 切れ → admin endpoint 叩く → 401 → redirect to /login
- [ ] /login?redirect=/admin → ログイン成功 → /admin へ redirect

### 7.4 login-redirect safety test
- [ ] normalizeRedirectPath で open redirect 防止確認
- [ ] "../../../ etc" → safe に normalize
- [ ] "http://evil.com" → safe に normalize

## 8. ローカル実行コマンド

```bash
# Unit test
npm run test -- apps/web/src/lib/fetch/authed.spec.ts
npm run test -- apps/web/src/hooks/useAdminMutation.spec.ts
npm run test -- apps/web/src/lib/url/login-redirect.spec.ts

# Type check
npm run type-check

# Integration test (if Playwright)
npm run test:e2e -- --grep "401.*redirect|403.*toast"

# Local dev server
npm run dev
# 手動: fetch 401 を simulate して UX 確認
```

## 9. DoD (Definition of Done)

- [ ] fetchAuthed の 401/403 処理が既存仕様通り動作確認
- [ ] useAdminMutation hook の error handling を実装・テスト
- [ ] 401 → `/login?redirect=<current>` redirect の動作確認
- [ ] 403 → toast "権限がありません" 表示確認
- [ ] Auth.js session refresh ポリシーを文書化（実装有無記述）
- [ ] `normalizeRedirectPath` による open redirect 防止を再検証
- [ ] lint + type check 通過
- [ ] unit test / integration test 全 PASS
- [ ] Storybook（if 有り）で 401/403 UI 検証

## 10. リスク・制約

### 10.1 リスク
- **Session expiry timing:** Token 有効期限と silent refresh タイミングのズレ
  - 対策: 24h TTL のため実運用では問題少ないが、logout フローで明示的に session 破棄
- **Redirect loop:** `/login?redirect=/login?redirect=...` の多重化
  - 対策: `normalizeRedirectPath` で safe route のみ accept
- **Error state 保持:** 403 error 後に form state が残る
  - 対策: reset button + onError callback で明示的に clear

### 10.2 制約
- **既存 API endpoint のみ:** new endpoint 追加禁止
- **OKLch token のみ:** 色定義は OKLch color space に統一
- **行数 200 行以内:** useAdminMutation + toast integration
- **Write tool でファイル作成:** 実ファイル作成のみ、実装は serial-05 に委譲

### 10.3 依存関係
- **serial-05-admin-mutation-ui:** useAdminMutation hook の定義・error handling 連動
- **parallel-07-auth-and-shared:** `/login` route の UX（loading / error handling）
- **Auth.js config (auth.ts):** session callback の動作

## 11. 実装ロードマップ

### Phase 1: 検証（this spec）
- [ ] fetchAuthed 既存実装の 401/403 処理を確認
- [ ] Auth.js session refresh ポリシーを文書化
- [ ] login-redirect.ts + normalizeRedirectPath を確認

### Phase 2: useAdminMutation hook 実装（serial-05 内）
- [ ] useAdminMutation を新規作成 or 既存を拡張
- [ ] 401 catch → redirect
- [ ] 403 catch → toast
- [ ] Unit test + integration test

### Phase 3: UI 統合テスト（parallel-07 or 並行）
- [ ] Mock API で 401/403 simulate
- [ ] Toast component の表示・dismiss 動作確認
- [ ] Redirect フロー検証

---

**Last Updated:** 2026-05-15
**Owner:** UBM-Hyogo Improvements Task Force
**Status:** 仕様書作成完了（実装は serial-05 に委譲）

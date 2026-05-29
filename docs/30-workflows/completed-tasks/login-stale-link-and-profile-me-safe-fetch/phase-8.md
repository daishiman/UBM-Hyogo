# Phase 8: リファクタリング

## 変更テーブル

| 対象 | Before | After | 理由 |
|------|--------|-------|------|
| `apps/web/app/(member)/profile/page.tsx` の `/me` fetch | bare `await fetchAuthed<MeSessionResponse>("/me")` を try/catch で囲んで rethrow | `safeServerFetch` でラップし `meResult.ok === false` で `SectionError` 降下、`AuthRequiredError` のみ outer catch で redirect | Server Components render error を SectionError UI に置換 |
| `apps/web/src/lib/url/safe-redirect.ts` | `string | undefined` only | `unknown` を受けて string のみ通す | object-shaped redirect の `[object Object]` coerce を防止 |
| `apps/web/src/lib/url/login-query.ts` | searchParams value を string 前提で回収 | unknown-safe に first string のみ採用 | Next integration drift に耐える |
| `apps/web/src/lib/url/login-redirect.ts` | API signature は string のまま | `unknown` input を normalize へ渡す契約に更新 | object-shaped input が型上も fallback 対象になる |
| `apps/web/src/lib/url/login-state.ts` | API signature は string のまま | `unknown` redirect を normalize へ渡す契約に更新 | URL 書き換え時の `[object Object]` 生成を型契約で防止 |
| `apps/web/app/(member)/profile/error.tsx` | digest 表示あり | 変更なし | incident response 経路は既存で十分 |

## 重複の削減

- Task B で `/me` と `/me/profile` の取得が同型になるが、helper 抽象化は行わない（2回出現は premature abstraction を避ける）。

## navigation drift

- 新規 helper は作らず、既存 `safe-redirect.ts` / `login-query.ts` 境界へ責務を集約した。

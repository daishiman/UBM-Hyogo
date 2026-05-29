# Phase 8 — リファクタリング

## 1. 変更内容

| 対象                  | Before                                                   | After                                                        | 理由                                          |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| `safe-next.ts`        | 個別 `if` の連鎖                                         | `isSafeInternalRedirect` 再利用 + next 固有 guard のみ維持     | 重複責務を避けるため                          |
| `page.tsx` redirect 部 | inline で `safeNext(Array.isArray(...) ? ... : ...)`     | そのまま維持（1 箇所のみ・抽出すると逆に冗長）               | YAGNI                                         |
| `safe-redirect.ts` 統合 | 別関数として併存                                         | 併存のまま                                                   | Phase 2 §2.2 で併存判断済み。統合は別タスク化 |

## 2. duplicate / navigation drift チェック

- `apps/web/src/lib/url/` 配下で `safe-` プレフィクスが2つ（`safe-redirect.ts` / `safe-next.ts`）になるが、`safe-next.ts` は既存 predicate の薄い wrapper として責務を分離する。
- `app/login/page.tsx` の import 順序は eslint-plugin-import の自動ソートに委ねる。

## 3. 削除候補

なし（新規追加のみ）

## 4. DoD

- [ ] `pnpm lint` green
- [x] 重複コード新規導入なし（既存 `safe-redirect.ts` の predicate を再利用）
